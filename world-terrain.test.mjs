import assert from 'node:assert/strict';
import {
  ISLAND, STAGE_ANCHORS, heightAt, heightForRadius, radialDistance,
  waterHeightAt, shoreRadiusAt, walkableAt,
} from './world-terrain.mjs';

assert.equal(heightAt(0, 0), .18);
assert.equal(radialDistance(ISLAND.radiusX, 0), 1);
assert.ok(heightForRadius(.4) > heightForRadius(1));
assert.ok(heightForRadius(1.25) > heightForRadius(1.45));

for (const station of Object.values(STAGE_ANCHORS)) {
  assert.equal(walkableAt(...station), true, 'named station must be on dry plateau: ' + station);
  assert.ok(Number.isFinite(heightAt(...station)));
}
for (let r = .6; r < 1.5; r += .01) {
  assert.ok(heightForRadius(r) >= heightForRadius(r + .01) - 1e-8, 'beach slope must be monotonic');
}
for (const event of [null, 'pier-to-nowhere', 'coconut']) {
  for (let t = 0; t <= 30; t += .25) {
    const water = waterHeightAt(event, t);
    const radius = shoreRadiusAt(water);
    assert.ok(radius >= .6 && radius <= ISLAND.shelfRadius);
    assert.ok(Math.abs(heightForRadius(radius) - water) < 1e-5);
  }
}
const high = waterHeightAt('pier-to-nowhere', 18);
const low = waterHeightAt('pier-to-nowhere', 24);
assert.equal(high, ISLAND.baseWaterY);
assert.equal(low, ISLAND.lowWaterY);
assert.ok(shoreRadiusAt(low) > shoreRadiusAt(high) + .12, 'low tide reveals more sand');
const quayTip = [5.5, .85];
assert.ok(heightAt(...quayTip) < high, 'quay end starts above water');
assert.ok(heightAt(...quayTip) > low, 'quay end reveals dry sand at ebb');
assert.equal(walkableAt(ISLAND.radiusX * 1.3, 0), false);
console.log('World terrain and tidal constraints passed');
