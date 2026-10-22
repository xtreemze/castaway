// Deterministic, renderer-independent terrain and tidal queries (Y-up world).
// All dimensions are expressed in the same metre-like units as the stage.
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export const ISLAND = Object.freeze({
  radiusX: 5.15,
  radiusZ: 3.15,
  shelfRadius: 1.5,
  baseWaterY: -0.56,
  lowWaterY: -0.96,
});

export const STAGE_ANCHORS = Object.freeze({
  center: Object.freeze([0, .2]),
  palm: Object.freeze([-1.65, -.5]),
  quay: Object.freeze([2.25, .7]),
  water: Object.freeze([1.3, 1.45]),
  workshop: Object.freeze([1.25, .35]),
});

export function radialDistance(x, z) {
  return Math.hypot(x / ISLAND.radiusX, z / ISLAND.radiusZ);
}

// Broad walkable plateau, a steep beach lip, then the intertidal sand shelf.
export function heightForRadius(radius) {
  const r = Math.max(0, radius);
  if (r <= .6) return .18 - .1 * smooth(r / .6);
  if (r <= 1) return lerp(.08, -.42, smooth((r - .6) / .4));
  if (r <= 1.14) return lerp(-.42, -.71, smooth((r - 1) / .14));
  if (r <= ISLAND.shelfRadius) return lerp(-.71, -1.1, smooth((r - 1.14) / .36));
  return -1.1;
}
export function heightAt(x, z) {
  return heightForRadius(radialDistance(x, z));
}
export function walkableAt(x, z) {
  return radialDistance(x, z) <= .91;
}

// The pier gag withdraws the sea *after* the reveal; other events use mean tide.
export function waterHeightAt(eventId = null, elapsedSeconds = 0) {
  const retreat = eventId === 'pier-to-nowhere'
    ? smooth((elapsedSeconds - 19) / 4)
    : 0;
  return lerp(ISLAND.baseWaterY, ISLAND.lowWaterY, retreat);
}

// The radial terrain is monotonic at the shoreline; inversion defines foam.
export function shoreRadiusAt(waterY) {
  let low = .6, high = ISLAND.shelfRadius;
  for (let i = 0; i < 26; i++) {
    const mid = (low + high) / 2;
    if (heightForRadius(mid) > waterY) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
