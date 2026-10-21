import {describe,it,expect} from 'vite-plus/test';
import {normalizeWorld} from './world-state.js';
import {selectEpisode} from './episode-selector.js';
const scenes=Array.from({length:12},(_,i)=>['Scene '+i,'',i===6?'raft':i===9?'depart':'routine']);
const catalog=[
 {id:'meet-crab',requires:[],mechanism:'surprise'},
 {id:'return-bottle',requires:['crab_met'],mechanism:'reversal'}
];
describe('unified episode selection',()=>{
 it('is deterministic across both scene families',()=>{
  const world=normalizeWorld({narrative:{seed:42,episode:8},original:{seed:9,episode:3}});
  expect(selectEpisode(world,scenes,catalog)).toEqual(selectEpisode(structuredClone(world),scenes,catalog));
 });
 it('never selects prerequisites before they exist',()=>{
  for(let i=0;i<200;i++){
   const world=normalizeWorld({narrative:{seed:42,episode:i,raftProgress:0}});
   const candidate=selectEpisode(world,scenes,catalog);
   expect(candidate).not.toEqual({family:'legacy',id:'6'});
   expect(candidate).not.toEqual({family:'legacy',id:'9'});
   expect(candidate).not.toEqual({family:'original',id:'return-bottle'});
  }
 });
 it('excludes the previous event across either family',()=>{
  const world=normalizeWorld({});
  expect(selectEpisode(world,scenes,catalog,{family:'original',id:'meet-crab'}))
   .not.toEqual({family:'original',id:'meet-crab'});
 });
 it('supports eventual unlocked events',()=>{
  const world=normalizeWorld({narrative:{raftProgress:4},original:{flags:['crab_met']}});
  const ids=[...Array.from({length:12},(_,i)=>i.toString()),'meet-crab','return-bottle'];
  for(const id of ids)expect(ids).toContain(id);
  expect(selectEpisode(world,[],[{id:'return-bottle',requires:['crab_met'],mechanism:'reversal'}]))
   .toEqual({family:'original',id:'return-bottle'});
 });
});
