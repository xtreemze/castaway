import {gaitPhaseAt} from './scene-choreography.mjs';
// Deterministic footfall pulse and sand response; independent of frame rate.
const clamp=x=>Math.max(0,Math.min(1,x));
export function groundContact(kind,time,stage,previous){const dx=stage[0]-previous[0],dz=stage[1]-previous[1],distance=Math.hypot(dx,dz);const moving=distance>.0001;const phase=gaitPhaseAt(kind,time);const foot=Math.floor(phase/Math.PI)%2;const strike=Math.pow(Math.max(0,Math.cos(phase*2)),12);const footprint=moving?clamp(distance*75)*strike:0;return {foot,footprint,sandCompression:footprint*.018,waterRipple:stage[1]>1.1?footprint:0}}
