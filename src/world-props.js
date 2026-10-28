// World presentation is a pure projection of committed narrative consequences.
export function persistentProps(world) {
 const flags=new Set(world?.original?.flags ?? []);
 const progress=Math.max(0,Math.min(4,world?.narrative?.raftProgress ?? 0));
 return {
  sundial:flags.has('sundial_built'),
  pierSign:flags.has('pier_inspected'),
  bottle:flags.has('bottle_sent'),
  crab:flags.has('crab_met'),
  crabGlove:flags.has('crab_met'),
  raftLogs:Math.trunc(progress),
  coconuts:Math.max(0,Math.min(8,world?.narrative?.coconuts ?? 0)),
 };
}
