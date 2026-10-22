import { EVENTS } from './story-catalog.mjs';
export const EPISODE_SECONDS=30;
export function seededRandom(seed){
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
export function newStoryState(seed=0xC457A){return {seed,played:[],counts:{},flags:[],lastMechanism:null,episode:0};}
export function chooseStoryEvent(state,catalog=EVENTS){
  const available=catalog.filter(e=>e.requires.every(flag=>state.flags.includes(flag)));
  if(!available.length)return null;
  const rng=seededRandom((state.seed ^ Math.imul(state.episode+1,2654435761))>>>0);
  const ranked=available.map(e=>{
    const recent=state.played.slice(-3).includes(e.id), repeatedMechanism=state.lastMechanism===e.mechanism;
    const times=state.counts?.[e.id]??state.played.filter(x=>x===e.id).length;
    return {event:e,score:rng()*0.75-(recent?2:0)-(repeatedMechanism?0.5:0)-times*0.2};
  }).sort((a,b)=>b.score-a.score||a.event.id.localeCompare(b.event.id));
  return ranked[0].event;
}
export function completeStoryEvent(state,event){
  return {...state,episode:state.episode+1,played:[...state.played.slice(-39),event.id],
    counts:{...state.counts,[event.id]:(state.counts?.[event.id]??state.played.filter(id=>id===event.id).length)+1},
    flags:[...new Set([...state.flags,...event.effects])],lastMechanism:event.mechanism};
}
export function beatForTime(seconds){
  if(seconds<0)return 0;
  if(seconds<6)return 0;
  if(seconds<12)return 1;
  if(seconds<19)return 2;
  if(seconds<23)return 3;
  if(seconds<28)return 4;
  return 5;
}
