// Pure, absolute-time blocking: routes start/stop smoothly without teleporting.
export const STATIONS={center:[0,.2],palm:[-1.65,-.5],quay:[2.25,.7],water:[1.3,1.45],workshop:[1.25,.35]};
export const ROUTES={idle:'center',fish:'water',coconut:'palm',run:'center',wave:'quay',build:'workshop',raft:'workshop',dance:'center',sleep:'palm',depart:'water',alarm:'quay'};
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const a=clamp(x);return a*a*(3-2*a)};
export function positionAt(kind,time){
  const t=Number.isFinite(time)?Math.max(0,Math.min(30,time)):0;
  const dest=STATIONS[ROUTES[kind]||'center'];
  const approach=ease((t-1)/7);
  // Episodes share one neutral staging position: recovery must walk the actor
  // home instead of teleporting when the next 30-second vignette begins.
  const recovery=1-ease((t-25)/5);
  const blocking=approach*recovery;
  // Avoid negative zero at neutral boundaries; exact station identity is part of replay.
  let x=blocking===0?0:dest[0]*blocking;
  let z=.2+(dest[1]-.2)*blocking;
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

const pathDistanceCache = new Map();
const samplesPerSecond=30;
/**
 * Arc length is integrated once per route on the worker, at fixed sample
 * resolution. Playback never increments accumulated distance per frame.
 */
export function travelDistanceAt(kind,time){
  let distances=pathDistanceCache.get(kind);
  if(!distances){
    distances=new Float64Array(30*samplesPerSecond+1);
    let previous=positionAt(kind,0);
    for(let i=1;i<distances.length;i++){
      const current=positionAt(kind,i/samplesPerSecond);
      distances[i]=distances[i-1]+Math.hypot(current[0]-previous[0],current[1]-previous[1]);
      previous=current;
    }
    pathDistanceCache.set(kind,distances);
  }
  const index=Math.max(0,Math.min(30*samplesPerSecond,Number.isFinite(time)?time*samplesPerSecond:0));
  const i=Math.floor(index),fraction=index-i;
  return distances[i]+(distances[Math.min(i+1,distances.length-1)]-distances[i])*fraction;
}
export function gaitPhaseAt(kind,time){
  const strideLength=kind==='run'?.82:.6;
  return travelDistanceAt(kind,time)*2*Math.PI/strideLength;
}
