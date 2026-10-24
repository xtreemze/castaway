// Frame-rate-independent, deterministic gait and reaction layer.
// Position delta is sampled over a fixed 16ms story-time interval rather than
// the actual render interval, so replay/seek and workers produce identical poses.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function secondaryMotion(kind,time,position,previousPosition){
 const t=Math.max(0,Number.isFinite(time)?time:0);
 const dx=position[0]-previousPosition[0],dz=position[1]-previousPosition[1];
 const speed=Math.hypot(dx,dz)/.016; // scene units / second
 const weight=ease(speed/(kind==='run'?1.1:.7));
 const cadence=kind==='run'?9:5.8;
 const stride=Math.sin(t*cadence)*weight;
 const impact=(kind==='coconut'||kind==='depart')?ease((t-19)/.7)*(1-ease((t-22)/2)):0;
 return {leftLeg:stride*.48,rightLeg:-stride*.48,leftArm:-stride*.22,rightArm:stride*.22,
 lift:Math.abs(Math.sin(t*cadence))*.055*weight,lean:impact*.3,
 lookUp:kind==='coconut'&&t<12?-.25:0,impact,
 weight,heading:speed>1e-5?Math.atan2(dx,dz):null};
}
