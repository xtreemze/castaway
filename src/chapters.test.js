import {describe,it,expect} from 'vite-plus/test';
import {CHAPTERS,advanceChapter} from './chapters.js';
import {normalizeWorld,completeEpisode} from './world-state.js';
describe('story chapter continuity',()=>{
 it('defines eleven original chapters',()=>expect(CHAPTERS).toHaveLength(11));
 it('does not advance just because episode time passes',()=>{
  const world=normalizeWorld({chapter:0,current:{family:'legacy',id:'0',elapsed:30}});
  expect(completeEpisode(world,'legacy','0').chapter).toBe(0);
 });
 it('advances one milestone at a time and never regresses',()=>{
  let world=normalizeWorld({chapter:0,narrative:{coconuts:2,raftProgress:4,failures:2,episode:50},original:{episode:12,flags:['crab_met','sundial_built','bottle_sent','island_attachment','voyage_completed','mainland_arrived','island_returned']}});
  for(let i=0;i<10;i++){const next=advanceChapter(world);expect(next.chapter).toBe(world.chapter+1);world=next;}
  expect(world.chapter).toBe(10);
  expect(advanceChapter(world).chapter).toBe(10);
 });
 it('uses preserved historical raft construction after departure',()=>{
  const w=normalizeWorld({chapter:4,narrative:{raftProgress:0,raftPeak:3}});
  expect(advanceChapter(w).chapter).toBe(5);
 });
 it('keeps prerequisite-locked chapters fixed',()=>{
  const world=normalizeWorld({chapter:2,narrative:{coconuts:5}});
  expect(advanceChapter(world).chapter).toBe(2);
 });
 it('does not unlock voyage, mainland or return from arbitrary episode counts',()=>{
  const world=normalizeWorld({chapter:7,narrative:{episode:1000,failures:20},original:{episode:1000}});
  expect(advanceChapter(world).chapter).toBe(7);
 });
 it('maintains chapter through save normalization',()=>{
  expect(normalizeWorld({chapter:7}).chapter).toBe(7);
 });
});
