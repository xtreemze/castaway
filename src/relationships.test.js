import {describe,it,expect} from 'vite-plus/test';
import {relationships} from './relationships.js';
import {normalizeWorld,completeEpisode} from './world-state.js';
import {completeStoryEvent} from '../story-director.mjs';
import {EVENTS} from '../story-catalog.mjs';
const event=id=>EVENTS.find(e=>e.id===id);
const commit=(world,id)=>completeEpisode(
 normalizeWorld({...world,current:{family:'original',id,elapsed:30}}),
 'original',id,w=>{w.original=completeStoryEvent(w.original,event(id))}
);
describe('recurring character continuity',()=>{
 it('never invents past encounters before the crab appears',()=>{
  expect(relationships(normalizeWorld({})).crab).toEqual({
   met:false,encounters:0,trust:0,keepsGlove:false,deliveredMessage:false
  });
 });
 it('preserves the crab glove and tracks the later bottle delivery',()=>{
  const first=commit(normalizeWorld({}),'crab-handshake');
  expect(relationships(first).crab).toMatchObject({met:true,encounters:1,keepsGlove:true,deliveredMessage:false});
  const second=commit(first,'return-to-sender');
  expect(relationships(second).crab).toMatchObject({met:true,encounters:2,trust:2,deliveredMessage:true});
  expect(relationships(JSON.parse(JSON.stringify(second)))).toEqual(relationships(second));
 });
 it('retains encounters and trust after the short replay history rolls over',()=>{
  let world=normalizeWorld({});
  for(let i=0;i<60;i++)world=commit(world,'crab-handshake');
  expect(world.original.played).toHaveLength(40);
  expect(world.original.counts['crab-handshake']).toBe(60);
  expect(relationships(world).crab).toMatchObject({encounters:60,trust:3});
  expect(relationships(normalizeWorld(JSON.parse(JSON.stringify(world)))).crab.encounters).toBe(60);
 });
 it('tracks only completed performances, never interrupted ones',()=>{
  const before=normalizeWorld({current:{family:'original',id:'crab-handshake',elapsed:17}});
  expect(relationships(before).crab.encounters).toBe(0);
 });
});
