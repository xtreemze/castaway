// Milestone chapters are narrative achievements, not thirty-second episode counters.
export const CHAPTERS=Object.freeze([
 {title:'The Kingdom of Sand',ready:()=>true},
 {title:'Master of Nothing',ready:w=>(w.narrative.coconuts||0)>=1},
 {title:'Uninvited Company',ready:w=>(w.original.flags||[]).includes('crab_met')},
 {title:'Civilization in Miniature',ready:w=>(w.original.flags||[]).includes('sundial_built')},
 {title:'Messages to Nobody',ready:w=>(w.original.flags||[]).includes('bottle_sent')},
 {title:'The Great Construction',ready:w=>(w.narrative.raftProgress||0)>=2},
 {title:'The Sea Has Opinions',ready:w=>(w.narrative.failures||0)>=1},
 {title:'An Unexpected Attachment',ready:w=>(w.original.episode||0)>=8},
 {title:'The Voyage',ready:w=>(w.narrative.failures||0)>=2},
 {title:'The Other Island',ready:w=>(w.narrative.episode||0)>=30},
 {title:'The Return',ready:w=>(w.narrative.episode||0)>=40}
]);
export function advanceChapter(world){
 const previous=Number.isInteger(world.chapter)?Math.max(0,Math.min(10,world.chapter)):0;
 let next=previous;
 // Only one milestone transition per completed event; chapters cannot jump.
 if(next<CHAPTERS.length-1&&CHAPTERS[next+1].ready(world))next++;
 return {...world,chapter:next};
}
