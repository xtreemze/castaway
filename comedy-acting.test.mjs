import test from 'node:test';import assert from 'node:assert/strict';import {comedyPose,comedySound} from './comedy-acting.mjs';
for(const id of ['portable-shade','crab-handshake','sundial','return-to-sender','pier-to-nowhere']){
 test(id+' returns finite poses at each beat',()=>{for(const time of [0,6,12,19,23,28,30]){const p=comedyPose(id,time);assert.ok(Object.values(p).every(Number.isFinite));}});
 test(id+' begins and ends at rest',()=>{for(const time of [0,30])assert.ok(Object.values(comedyPose(id,time)).every(v=>Math.abs(v)<1e-8));});
}
test('unknown events produce a neutral pose and no sound',()=>{assert.deepEqual(Object.values(comedyPose('unknown',12)),[0,0,0,0,0]);assert.equal(comedySound('unknown',3),null)});
test('sound is only emitted on active story beats',()=>{assert.equal(comedySound('sundial',0),null);assert.ok(comedySound('sundial',3)>0)});
