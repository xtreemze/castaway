// Absolute-time prop blocking for repeatable 30-second vignettes.
export function propPose(kind,time,actorX,actorZ){const t=Math.max(0,Math.min(30,time));
if(kind==='coconut'){if(t<12)return{mode:'ground',x:-1.05,y:.22,z:.55};if(t<19)return{mode:'carried',x:actorX+.34,y:1.21,z:actorZ+.18};if(t<25){const d=t-19;return{mode:'bounce',x:actorX+.65,y:.22+Math.abs(Math.sin(d*2))*Math.exp(-d*.65),z:actorZ+.4}}return{mode:'stored',x:-1.05,y:.22,z:.55}}
if(kind==='build'||kind==='raft')return{mode:t>=12&&t<20?'carried':'staged',x:actorX+.35,y:t>=12&&t<20?1.1:.12,z:actorZ+.2};
return{mode:'hidden',x:0,y:0,z:0}}
export function applyInventory(state,kind){const next={...state};if(kind==='coconut')next.coconuts=Math.min(8,Math.max(0,state.coconuts||0)+1);if(kind==='build')next.raftProgress=Math.min(4,Math.max(0,state.raftProgress||0)+1);if(kind==='depart')next.raftProgress=0;return next}
