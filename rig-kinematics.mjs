// Render-independent analytic two-bone inverse kinematics for a stylized joint rig.
// A pole is a *point*, not a joint rotation; the solver works in world coordinates.
const add = (a,b) => a.map((v,i) => v+b[i]);
const sub = (a,b) => a.map((v,i) => v-b[i]);
const mul = (a,s) => a.map(v => v*s);
const dot = (a,b) => a.reduce((v,x,i) => v+x*b[i],0);
const length = a => Math.hypot(...a);
const unit = (a, fallback) => { const n=length(a); return n>1e-9 ? mul(a,1/n) : fallback; };
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
export function solveTwoBone(root,target,pole,upperLength,lowerLength) {
  if (![...root,...target,...pole,upperLength,lowerLength].every(Number.isFinite) ||
      upperLength<=0 || lowerLength<=0) throw new RangeError('Finite joints and positive lengths required');
  const raw = sub(target,root), distance=length(raw);
  const direction = unit(raw,[0,-1,0]);
  const minimum = Math.abs(upperLength-lowerLength)+1e-5;
  const maximum = upperLength+lowerLength-1e-5;
  const reach = clamp(distance,Math.min(minimum,maximum),maximum);
  const wrist = add(root,mul(direction,reach));
  const axisProjection = sub(sub(pole,root),mul(direction,dot(sub(pole,root),direction)));
  // Avoid elbow flips when the chosen pole becomes parallel to the reach line.
  let bend = unit(axisProjection,[0,0,0]);
  if(length(bend)<.5) {
    const fallback = Math.abs(direction[2])<.85 ? [0,0,1] : [1,0,0];
    bend = unit(sub(fallback,mul(direction,dot(fallback,direction))),[1,0,0]);
  }
  const along = (upperLength*upperLength-lowerLength*lowerLength+reach*reach)/(2*reach);
  const perpendicular = Math.sqrt(Math.max(0,upperLength*upperLength-along*along));
  const elbow = add(add(root,mul(direction,along)),mul(bend,perpendicular));
  return {
    elbow,wrist,error:distance-reach,
    withinReach:distance<=maximum && distance>=minimum,
  };
}
