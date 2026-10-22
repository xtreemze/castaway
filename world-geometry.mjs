import { ISLAND, heightAt, heightForRadius, shoreRadiusAt } from './world-terrain.mjs';

// Mesh construction is separate from the pure world-space queries and story state.
function islandSurface(T, segments = 72, rings = 30) {
  const xyz = [0, heightForRadius(0), 0], indices = [];
  for (let ring = 1; ring <= rings; ring++) {
    const r = ISLAND.shelfRadius * ring / rings;
    for (let i = 0; i < segments; i++) {
      const a = i * Math.PI * 2 / segments;
      xyz.push(Math.cos(a) * ISLAND.radiusX * r, heightForRadius(r), Math.sin(a) * ISLAND.radiusZ * r);
    }
  }
  for (let i = 0; i < segments; i++) {
    indices.push(0, 1 + (i + 1) % segments, 1 + i);
  }
  for (let ring = 1; ring < rings; ring++) {
    const inner = 1 + (ring - 1) * segments, outer = inner + segments;
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      indices.push(inner + i, outer + next, outer + i);
      indices.push(inner + i, inner + next, outer + next);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(xyz, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function foamRibbon(T, material) {
  const segments = 112, geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(new Float32Array((segments + 1) * 2 * 3), 3));
  const indices = [];
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = a + 2;
    indices.push(a, b + 1, b, a, a + 1, b + 1);
  }
  geometry.setIndex(indices);
  geometry.userData.segments = segments;
  return new T.Mesh(geometry, material);
}

export function createWorld({ T, scene, obj, ball, rod, m, sand, wood, bark, leaf, leaf2 }) {
  // A submerged chunky base preserves the miniature's sculpted cross-section.
  const lower = obj(new T.IcosahedronGeometry(3.9, 2), sand, 0, -.84, 0);
  lower.scale.set(1.42, .17, .91);
  const beach = obj(islandSurface(T), m('#f5dda4'));
  beach.castShadow = false;
  beach.receiveShadow = true;

  const seaMat = new T.MeshStandardMaterial({
    color: '#207fa7', roughness: .48, metalness: .08, flatShading: true,
  });
  const seaGeo = new T.PlaneGeometry(180, 180, 40, 40);
  seaGeo.rotateX(-Math.PI / 2);
  const sea = obj(seaGeo, seaMat, 0, ISLAND.baseWaterY, 0);
  sea.castShadow = false;
  const seaPos = seaGeo.attributes.position;
  const seaBase = seaPos.array.slice();

  const foam = Array.from({ length: 3 }, (_, i) => {
    const material = new T.MeshBasicMaterial({
      color: '#dcf8e6', transparent: true, opacity: .24 - i * .045,
      depthWrite: false, side: T.DoubleSide,
    });
    const strip = foamRibbon(T, material);
    strip.userData.band = i;
    strip.frustumCulled = false;
    strip.renderOrder = 2;
    scene.add(strip);
    return strip;
  });
  updateShorelineFoam(foam, ISLAND.baseWaterY, 0);

  const dock = new T.Group();
  dock.name = 'quay';
  dock.position.set(3.5, .24, .85);
  scene.add(dock);
  for (let i = 0; i < 6; i++) {
    const plank = obj(new T.BoxGeometry(.5, .15, 1.25), i % 2 ? wood : bark,
      i * .48 - .4, -.06, 0, dock);
    plank.name = 'quay-plank-' + i;
  }
  for (const x of [-.4, 2]) for (const z of [-.45, .45])
    rod([x, -1.24, z], [x, 0, z], .10, wood, dock);

  const palm = new T.Group();
  palm.name = 'coconut-palm';
  palm.position.set(-2.1, heightAt(-2.1, -.7) - .09, -.7);
  scene.add(palm);
  const points = [];
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    points.push([t * .7, t * 4.8, Math.sin(t * Math.PI) * .18]);
  }
  for (let i = 0; i < 9; i++) rod(points[i], points[i + 1], .23 - i * .015, i % 2 ? bark : wood, palm);
  const crown = new T.Group();
  crown.name = 'palm-canopy';
  crown.position.set(.7, 4.8, 0);
  palm.add(crown);
  const fronds = [];
  for (let i = 0; i < 9; i++) {
    const frond = new T.Group();
    frond.rotation.y = i * Math.PI * 2 / 9;
    frond.userData.azimuth = frond.rotation.y;
    crown.add(frond);
    fronds.push(frond);
    for (let j = 0; j < 7; j++) {
      const t = (j + .5) / 7;
      const blade = obj(new T.ConeGeometry(.44 * (1 - t * .65), .92, 3),
        i % 2 ? leaf : leaf2, t * 3.35,
        Math.sin(t * Math.PI) * .6 - t * t * 1.25, 0, frond);
      blade.rotation.z = Math.PI / 2 + t * .26;
      blade.rotation.y = j % 2 ? .12 : -.12;
    }
  }
  for (let i = 0; i < 3; i++)
    ball(.24, wood, .55 + Math.cos(i * 2) * .2, -.38, Math.sin(i * 2) * .2, crown);

  const bush = new T.Group();
  bush.name = 'bush';
  bush.position.set(1.8, heightAt(1.8, -1.2) - .1, -1.2);
  scene.add(bush);
  for (let i = 0; i < 11; i++) {
    const a = i * 2.4;
    ball(.35 + (i % 3) * .05, i % 2 ? leaf : leaf2,
      Math.cos(a) * .55, .17 + (i % 4) * .1, Math.sin(a) * .37, bush);
  }

  return { lower, beach, seaMat, seaGeo, sea, seaPos, seaBase, foam, dock, palm, crown, fronds, bush };
}

// Update a narrow foam ribbon at the actual terrain/water intersection.
// These strips are not constant-size toroids: the shoreline moves as the tide falls.
export function updateShorelineFoam(foam, waterY, timeSeconds) {
  const radius = shoreRadiusAt(waterY);
  for (const strip of foam) {
    const attr = strip.geometry.attributes.position;
    const { segments } = strip.geometry.userData;
    const band = strip.userData.band;
    for (let i = 0; i <= segments; i++) {
      const angle = i * Math.PI * 2 / segments;
      const wave = .004 * Math.sin(angle * 9 + timeSeconds * .7 + band);
      for (let side = 0; side < 2; side++) {
        const r = radius + band * .013 + (side ? .017 : -.017) + wave;
        const idx = (i * 2 + side) * 3;
        attr.array[idx] = Math.cos(angle) * ISLAND.radiusX * r;
        attr.array[idx + 1] = waterY + .034 + .004 * Math.sin(timeSeconds + angle * 7);
        attr.array[idx + 2] = Math.sin(angle) * ISLAND.radiusZ * r;
      }
    }
    attr.needsUpdate = true;
    strip.material.opacity = .19 + .07 * Math.sin(timeSeconds * .8 + band);
  }
}
