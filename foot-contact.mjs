import {positionAt} from './scene-choreography.mjs';
import {heightAt} from './world-terrain.mjs';

// Stateless foot plants: any episode timestamp yields the same pair of goals.
// Stance is anchored to the stage position at the beginning of each step;
// swing follows a ground-aware arc to the *next* anchor.
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=v=>{const x=clamp(v);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
const WALK={start:1,end:9,period:.78,stance:.58,lift:.105};
const RUN={start:9,end:22,period:.54,stance:.53,lift:.17};
const NO_TRAVEL=new Set(['idle','sleep','dance']);
const ANKLE_HEIGHT=.09;
const HALF_STANCE=.18;

function anchor(kind,stamp,side,range){
  const t=clamp(stamp,range.start,range.end);
  const [x,z]=positionAt(kind,t);
  const [beforeX,beforeZ]=positionAt(kind,Math.max(range.start,t-.02));
  const [afterX,afterZ]=positionAt(kind,Math.min(range.end,t+.02));
  const dx=afterX-beforeX,dz=afterZ-beforeZ;
  // A right-handed local +X axis rotated around Y by the travel heading.
  const len=Math.hypot(dx,dz);
  const rightX=len>1e-7?dz/len:1;
  const rightZ=len>1e-7?-dx/len:0;
  const px=x+side*HALF_STANCE*rightX,pz=z+side*HALF_STANCE*rightZ;
  return [px,heightAt(px,pz)+ANKLE_HEIGHT,pz];
}
function plant(kind,t,side,range){
  // A half-cycle phase difference keeps the feet from swinging together.
  const offset=side>0?.5:0;
  const step=(t-range.start)/range.period+offset;
  const cycle=Math.floor(step);
  const phase=step-cycle;
  const from=anchor(kind,range.start+(cycle-offset)*range.period,side,range);
  if(phase<range.stance)return {position:from,planted:true};
  const to=anchor(kind,range.start+(cycle+1-offset)*range.period,side,range);
  const progress=smooth((phase-range.stance)/(1-range.stance));
  const px=mix(from[0],to[0],progress),pz=mix(from[2],to[2],progress);
  return {
    position:[px,heightAt(px,pz)+ANKLE_HEIGHT+range.lift*Math.sin(Math.PI*progress),pz],
    planted:false,
  };
}

/**
 * Returns world-space ankle goals (left, right) and IK influence.
 * 0 influence outside locomotion allows existing authored FK to remain authoritative.
 */
export function sampleFootContacts(kind,time){
  const t=Number.isFinite(time)?clamp(time,0,30):0;
  const range=kind==='run'?RUN:NO_TRAVEL.has(kind)?null:WALK;
  const enabled=Boolean(range);
  const weight=enabled
    ?smooth((t-range.start)/.55)*(1-smooth((t-(range.end-.85))/.85))
    :0;
  if(weight<=0)return {weight:0,left:null,right:null};
  const left=plant(kind,t,-1,range);
  const right=plant(kind,t,1,range);
  return {weight,left,right};
}
