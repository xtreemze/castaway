import {describe,it,expect} from 'vite-plus/test';
import {persistentProps} from './world-props.js';
describe('persistent scenery',()=>{
 it('starts without acquired story props',()=> {
  const p=persistentProps({original:{flags:[]},narrative:{raftProgress:0,coconuts:0}});
  expect(p.sundial).toBe(false);expect(p.pierSign).toBe(false);expect(p.crabGlove).toBe(false);
 });
 it('reconstructs consequences entirely from saved flags and inventory',()=>{
  const snapshot={original:{flags:['crab_met','sundial_built','pier_inspected','bottle_sent']},narrative:{raftProgress:3,coconuts:5}};
  expect(persistentProps(JSON.parse(JSON.stringify(snapshot)))).toEqual(persistentProps(snapshot));
  const p=persistentProps(snapshot);
  expect(p).toMatchObject({crab:true,crabGlove:true,sundial:true,pierSign:true,bottle:true,raftLogs:3,coconuts:5});
 });
 it('constrains visual inventory to available models',()=>{
  const p=persistentProps({original:{flags:[]},narrative:{raftProgress:200,coconuts:200}});
  expect(p.raftLogs).toBe(4);expect(p.coconuts).toBe(8);
 });
});
