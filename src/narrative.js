/** Repeatable PRNG for deterministic screenshots and narrative test fixtures. */
export function createRandom(seed) {
  let state = 2166136261;
  for (const char of String(seed)) {
    state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Select a story without repeating the current event; preserve continuity. */
export function chooseStory(stories, narrative, currentIndex, random = Math.random) {
  if (stories.length < 2) return 0;
  let best = -Infinity;
  let selected = 0;
  for (let i = 0; i < stories.length; i++) {
    if (i === currentIndex) continue;
    const kind = stories[i][2];
    const score = random()
      - (narrative.seen[i] || 0) * 0.14
      - (narrative.lastKinds.includes(kind) ? 0.5 : 0)
      - (i === 6 && narrative.raftProgress < 2 ? 0.9 : 0)
      - (i === 9 && narrative.raftProgress < 3 ? 0.9 : 0);
    if (score > best) { best = score; selected = i; }
  }
  return selected;
}
