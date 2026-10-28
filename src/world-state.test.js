import {describe,it,expect} from 'vite-plus/test';
import {normalizeWorld,loadWorld,saveWorld,completeEpisode,interruptEpisode,STORY_KEY} from './world-state.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};
describe('canonical narrative persistence',()=>{
 it('migrates both historical keys without losing inventory or story flags',()=>{
  const store=memory();
  store.setItem('castaway-story-v1',JSON.stringify({day:9,coconuts:4,raftProgress:2,seen:{3:5}}));
  store.setItem('castaway-original-story-v1',JSON.stringify({seed:42,episode:3,flags:['crab_met'],played:['crab-handshake']}));
  const world=loadWorld(store);
  expect(world.version).toBe(2);expect(world.narrative.day).toBe(9);
  expect(world.narrative.coconuts).toBe(4);expect(world.narrative.raftProgress).toBe(2);
  expect(world.original.flags).toContain('crab_met');
  expect(saveWorld(store,world)).toBe(true);
  expect(JSON.parse(store.getItem(STORY_KEY))).toEqual(world);
 });
 it('commits a completed event once and clears the active event',()=>{
  const world=normalizeWorld({current:{family:'original',id:'crab-handshake',elapsed:29.9}});
  const once=completeEpisode(world,'original','crab-handshake',w=>w.original.flags.push('crab_met'));
  const twice=completeEpisode(once,'original','crab-handshake',w=>w.original.flags.push('crab_met'));
  expect(twice.narrative.day).toBe(2);expect(twice.original.flags).toEqual(['crab_met']);
 });
 it('does not commit an interrupted event',()=>{
  const world=normalizeWorld({current:{family:'legacy',id:'5',elapsed:12}});
  const skipped=interruptEpisode(world);
  expect(skipped.narrative.day).toBe(1);
  expect(skipped.current.family).toBeNull();
  expect(completeEpisode(skipped,'legacy','5').narrative.day).toBe(1);
 });
 it('restores elapsed time and sanitizes invalid values',()=>{
  const store=memory();const state=normalizeWorld({current:{family:'original',id:'sundial',elapsed:18.25}});
  saveWorld(store,state);expect(loadWorld(store).current).toEqual(state.current);
  expect(normalizeWorld({current:{family:'legacy',id:'2',elapsed:900}}).current.elapsed).toBe(30);
 });
 it('recovers both legacy saves when the v2 record is malformed or unsupported',()=>{
  for(const corrupt of ['{bad json',JSON.stringify([]),JSON.stringify({version:99,narrative:{day:100}})]){
   const store=memory();
   store.setItem(STORY_KEY,corrupt);
   store.setItem('castaway-story-v1',JSON.stringify({day:12,coconuts:3}));
   store.setItem('castaway-original-story-v1',JSON.stringify({flags:['crab_met']}));
   const loaded=loadWorld(store);
   expect(loaded.narrative.day).toBe(12);
   expect(loaded.narrative.coconuts).toBe(3);
   expect(loaded.original.flags).toEqual(['crab_met']);
  }
 });
 it('prefers a valid canonical snapshot over stale legacy keys',()=>{
  const store=memory();
  store.setItem(STORY_KEY,JSON.stringify(normalizeWorld({narrative:{day:20,coconuts:6}})));
  store.setItem('castaway-story-v1',JSON.stringify({day:3,coconuts:1}));
  expect(loadWorld(store).narrative).toMatchObject({day:20,coconuts:6});
 });
 it('does not mutate nested historical records when applying completion outcomes',()=>{
  const prior=normalizeWorld({narrative:{seen:{5:2}},current:{family:'legacy',id:'5',elapsed:30}});
  const next=completeEpisode(prior,'legacy','5',world=>{world.narrative.seen[5]=3;});
  expect(prior.narrative.seen[5]).toBe(2);
  expect(next.narrative.seen[5]).toBe(3);
  expect(next.narrative.day).toBe(2);
  const copy=normalizeWorld(prior);
  copy.narrative.seen[5]=500;
  expect(prior.narrative.seen[5]).toBe(2);
 });
});
