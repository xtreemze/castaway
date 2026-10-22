import {describe,it,expect} from 'vite-plus/test';
import {normalizeWorld} from './world-state.js';
import {completeLegacyScene} from './legacy-outcomes.js';
const scenes=[['Coconut','','coconut'],['Build','','build'],['Departure','','depart']];
const active=(id,narrative={})=>normalizeWorld({narrative,current:{family:'legacy',id:String(id),elapsed:30}});
describe('legacy outcomes are transactional',()=>{
 it('does not increment coconut stock or day twice',()=>{
  const first=completeLegacyScene(active(0),0,scenes);
  const again=completeLegacyScene(first,0,scenes);
  expect(again.narrative.coconuts).toBe(1);
  expect(again.narrative.day).toBe(2);
  expect(again.narrative.seen[0]).toBe(1);
 });
 it('does not apply a stale scene after a different active scene',()=>{
  const current=active(1);
  expect(completeLegacyScene(current,0,scenes)).toEqual(current);
 });
 it('increments raft progress exactly once and resets on departure',()=>{
  const built=completeLegacyScene(active(1,{raftProgress:2}),1,scenes);
  expect(built.narrative.raftProgress).toBe(3);
  expect(built.narrative.raftPeak).toBe(3);
  const departing=normalizeWorld({...built,current:{family:'legacy',id:'2',elapsed:30}});
  const finished=completeLegacyScene(departing,2,scenes);
  expect(finished.narrative.raftProgress).toBe(0);
  expect(finished.narrative.raftPeak).toBe(3);
  expect(finished.narrative.failures).toBe(1);
  expect(completeLegacyScene(finished,2,scenes).narrative.failures).toBe(1);
 });
});
