// Independent deterministic secondary animation: locomotion, facial orientation and impact holds.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function secondaryMotion(kind,time,position,previousPosition){
 const t=Math.max(0,time);
 const dx=position[0]-previousPosition[0],dz=position[1]-previousPosition[1];
 const speed=Math.hypot(dx,dz);
 const traveling=(t>1&&t<9)||kind==='run'&&t>9&&t<22;
 const weight=traveling?ease(Math.min(speed*22,1)):0;
 const cadence=kind==='run'?9:5.8;
 const stride=Math.sin(t*cadence)*weight;
 const impact=(kind==='coconut'||kind==='depart')?ease((t-19)/.7)*(1-ease((t-22)/2)):0;
 return {leftLeg:stride*.48,rightLeg:-stride*.48,leftArm:-stride*.22,rightArm:stride*.22,
 lift:Math.abs(Math.sin(t*cadence))*.065*weight,lean:impact*.3,
 lookUp:kind==='coconut'&&t<12?-.25:0,impact,heading:weight>0.03?Math.atan2(dx,dz):null};
}
