// Pure, absolute-time blocking: routes start/stop smoothly without teleporting.
export const STATIONS={center:[0,.2],palm:[-1.65,-.5],quay:[2.25,.7],water:[1.3,1.45],workshop:[1.25,.35]};
export const ROUTES={idle:'center',fish:'water',coconut:'palm',run:'center',wave:'quay',build:'workshop',raft:'workshop',dance:'center',sleep:'palm',depart:'water',alarm:'quay'};
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const a=clamp(x);return a*a*(3-2*a)};
export function positionAt(kind,time){
  const t=Number.isFinite(time)?Math.max(0,Math.min(30,time)):0;
  const dest=STATIONS[ROUTES[kind]||'center'];
  const approach=ease((t-1)/7);
  let x=dest[0]*approach;
  let z=.2+(dest[1]-.2)*approach;
  if(kind==='run'){
    // Closed elliptical circuit: both ends return to the exact origin with
    // zero velocity; the old route jumped ~1.2 units at t=9 and t=22.
    if(t<=9||t>=22)return [0,.2];
    const angle=2*Math.PI*ease((t-9)/13);
    x=1.25*Math.sin(angle);
    z=.2+.85*(1-Math.cos(angle));
  }
  if(kind==='depart'){
    // No instantaneous return to the station at the punchline.
    const leave=ease((t-14)/8);
    const returnToStation=1-ease((t-24)/5);
    x+=.65*leave*returnToStation;
  }
  return [x,z];
}
export function raftVisibility(progress,kind){return Math.max(0,Math.min(4,progress))>0||kind==='build'||kind==='raft'||kind==='depart'}
export function plankCount(progress){return Math.max(0,Math.min(4,Math.trunc(progress)))}
