import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENTS,validateCatalog} from './story-catalog.mjs';
import {newStoryState,chooseStoryEvent,completeStoryEvent,beatForTime} from './story-director.mjs';
test('source catalog is valid and 30 seconds per scene',()=>assert.deepEqual(validateCatalog(),[]));
test('same saved seed and episode reproduce same event',()=>{
 const state=newStoryState(42);
 assert.equal(chooseStoryEvent(state).id,chooseStoryEvent({...state}).id);
});
test('dependencies exclude return-to-sender until crab-met',()=>{
 let state=newStoryState(123);
 assert.ok(!EVENTS.filter(e=>e.requires.every(f=>state.flags.includes(f))).some(e=>e.id==='return-to-sender'));
 state=completeStoryEvent(state,EVENTS.find(e=>e.id==='crab-handshake'));
 assert.ok(EVENTS.filter(e=>e.requires.every(f=>state.flags.includes(f))).some(e=>e.id==='return-to-sender'));
});
test('selector returns catalog event and records history',()=>{
 const state=newStoryState();
 const event=chooseStoryEvent(state);
 const next=completeStoryEvent(state,event);
 assert.equal(next.episode,1);assert.deepEqual(next.played,[event.id]);
});
test('30 second comic beat divisions',()=>assert.deepEqual([0,6,12,19,23,28,30].map(beatForTime),[0,1,2,3,4,5,5]));
