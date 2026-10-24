// Stage blocking is sampled from absolute vignette time, never integrated per frame.
import {STAGE_ANCHORS} from './world-terrain.mjs';
export const STATIONS=STAGE_ANCHORS;
export const ROUTES={idle:'center',fish:'water',coconut:'palm',run:'center',wave:'quay',build:'workshop',raft:'workshop',dance:'center',sleep:'palm',depart:'water',alarm:'quay'};
export function positionAt(kind,t){const dest=STATIONS[ROUTES[kind]||'center'];const f=Math.max(0,Math.min(1,(t-1)/7));const eased=f*f*(3-2*f);let x=dest[0]*eased,z=.2+(dest[1]-.2)*eased;if(kind==='run'&&t>9&&t<22){const inT=Math.max(0,Math.min(1,(t-9)/1.5)),outT=Math.max(0,Math.min(1,(22-t)/2));const blend=(inT*inT*(3-2*inT))*(outT*outT*(3-2*outT));x=blend*1.5*Math.sin((t-9)*.8);z=.2+blend*1.2*Math.cos((t-9)*.8)}if(kind==='depart'&&t>14&&t<24)x+=Math.min((t-14)/10,1)*.65;return [x,z]}
export function raftVisibility(progress,kind){return Math.max(0,Math.min(4,progress))>0||kind==='build'||kind==='raft'||kind==='depart'}
export function plankCount(progress){return Math.max(0,Math.min(4,Math.trunc(progress)))}