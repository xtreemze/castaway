import {describe,it,expect} from 'vite-plus/test';
import {EVENTS} from '../story-catalog.mjs';
import {completeStoryEvent} from '../story-director.mjs';
import {selectEpisode} from './episode-selector.js';
import {completeLegacyScene} from './legacy-outcomes.js';
import {completeEpisode,normalizeWorld,saveWorld,loadWorld} from './world-state.js';

const stories=[
 ['Quiet','','idle'],['Fishing','','fish'],['Coconut','','coconut'],
 ['Exercise','','run'],['Ship','','wave'],['Building','','build'],
 ['Raft','','raft'],['Rain','','dance'],['Nap','','sleep'],
 ['Departure','','depart'],['Alarm','','alarm'],['Still here','','idle']
];
function step(world,previous){
 const selected=selectEpisode(world,stories,EVENTS,previous);
 if(!selected)throw Error('story director deadlocked');
 const active=normalizeWorld({...world,current:{...selected,elapsed:30}});
 let finished;
 if(selected.family==='legacy')finished=completeLegacyScene(active,Number(selected.id),stories);
 else{
  const event=EVENTS.find(e=>e.id===selected.id);
  expect(event).toBeDefined();
  for(const requirement of event.requires)expect(active.original.flags).toContain(requirement);
  finished=completeEpisode(active,'original',selected.id,w=>{
   w.original=completeStoryEvent(w.original,event);
  });
 }
 expect(finished.narrative.day).toBe(world.narrative.day+1);
 expect(finished.current.family).toBeNull();
 expect(completeEpisode(finished,selected.family,selected.id)).toEqual(finished);
 return {world:finished,previous:selected};
}
describe('whole-story causal replay',()=>{
 it('preserves milestones, event consequences, and reproducibility across 500 episodes',()=>{
  for(const seed of [1,42,1357,2026]){
   const original=normalizeWorld({narrative:{seed}});
   let a=original,b=structuredClone(original),prevA=null,prevB=null;
   for(let i=0;i<500;i++){
    const nextA=step(a,prevA),nextB=step(b,prevB);
    expect(nextA).toEqual(nextB);
    a=nextA.world;prevA=nextA.previous;b=nextB.world;prevB=nextB.previous;
    expect(a.narrative.raftProgress).toBeGreaterThanOrEqual(0);
    expect(a.narrative.raftProgress).toBeLessThanOrEqual(4);
   }
   expect(a.narrative.day).toBe(501);
   expect(a.original.flags).toContain('crab_met');
  }
 });
 it('restores a checkpoint without changing subsequent selection and effects',()=>{
  const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  let state=normalizeWorld({narrative:{seed:777}}),previous=null;
  for(let i=0;i<75;i++){const next=step(state,previous);state=next.world;previous=next.previous}
  expect(saveWorld(storage,state)).toBe(true);
  let restored=loadWorld(storage);
  for(let i=0;i<120;i++){
   const original=step(state,previous),replay=step(restored,previous);
   expect(replay).toEqual(original);
   state=original.world;restored=replay.world;previous=original.previous;
  }
 });
});
