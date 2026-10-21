// Timeline-based grip controls shared by hand rig and props.
export function gripAt(kind,time){const active=['coconut','build','raft'].includes(kind)&&time>=12&&time<20;const blend=active?Math.min(1,(time-12)/.6,(20-time)/.6):0;return {active,closure:Math.max(0,blend),hand:1};}
export function handContact(kind,time,worldPosition){const grip=gripAt(kind,time);return {...grip,position:[worldPosition[0]+.34,worldPosition[1]+1.21,worldPosition[2]+.18]};}
