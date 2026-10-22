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

/** Select a legacy scene without bypassing milestone prerequisites. */
export function chooseNextScene(stories, history, current) {
  const eligible = stories.map((_, i) => i).filter(i =>
    i !== current && (i !== 6 || history.raftProgress >= 2) &&
    (i !== 9 || history.raftProgress >= 3));
  if (!eligible.length) return current;
  const random = seededRandom(String(history.seed ?? 0xCA57A) + ':' + String(history.episode ?? 0));
  let best = eligible[0], bestScore = -Infinity;
  for (const i of eligible) {
    const score = random() - (history.seen[i] || 0) * .14 -
      (history.lastKinds.includes(stories[i][2]) ? .5 : 0);
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}
