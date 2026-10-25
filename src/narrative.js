export function seededRandom(seed) {
  let s = 2166136261;
  for (const c of String(seed)) s = Math.imul(s ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function chooseStory(stories, history, current, random = Math.random) {
  if (stories.length < 2) return 0;
  let highest = -Infinity, choice = 0;
  for (let i = 0; i < stories.length; i++) {
    if (i === current) continue;
    const kind = stories[i][2];
    const score = random() - (history.seen[i] || 0) * .14
      - (history.lastKinds.includes(kind) ? .5 : 0)
      - (i === 6 && history.raftProgress < 2 ? .9 : 0)
      - (i === 9 && history.raftProgress < 3 ? .9 : 0);
    if (score > highest) { highest = score; choice = i; }
  }
  return choice;
}

/**
 * Deterministic, prerequisite-gated selection for legacy scenes. Uses only
 * persisted narrative state; no render time, Math.random, or mutable RNG.
 */
export function chooseNextScene(stories, history, current) {
  if (stories.length < 2) return 0;
  const seen = history?.seen ?? {};
  const lastKinds = Array.isArray(history?.lastKinds) ? history.lastKinds : [];
  const raftProgress = Number.isFinite(history?.raftProgress) ? history.raftProgress : 0;
  const episode = Number.isSafeInteger(history?.episode) && history.episode >= 0 ? history.episode : 0;
  const rng = seededRandom(String(history?.seed ?? 0xCA57A) + ':' + episode);
  let selected = null;
  let best = -Infinity;
  for (let i = 0; i < stories.length; i++) {
    const kind = stories[i][2];
    if (i === current || (i === 6 && raftProgress < 2) || (i === 9 && raftProgress < 3)) continue;
    const score = rng() - (seen[i] || 0) * .14 - (lastKinds.includes(kind) ? .5 : 0);
    if (score > best) { best = score; selected = i; }
  }
  return selected ?? current;
}
