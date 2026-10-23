import test from 'node:test';
import assert from 'node:assert/strict';
import {crabBlocking} from './crab-choreography.mjs';
test('blocking is deterministic and finite over the full vignette',()=>{
 for(let t=0;t<=30;t+=.25){const a=crabBlocking(t);assert.deepEqual(a,crabBlocking(t));assert.ok(Object.values(a).every(Number.isFinite))}
});
test('glove transfer is smooth and crab escapes after contact',()=>{
 const before=crabBlocking(18.6),after=crabBlocking(19.8);
 assert.equal(before.contact,0);assert.equal(after.contact,1);
 assert.ok(crabBlocking(25).crabX>crabBlocking(19).crabX);
 for(let t=18;t<21;t+=.02){const a=crabBlocking(t),b=crabBlocking(t+.02);assert.ok(Math.hypot(a.gloveX-b.gloveX,a.gloveY-b.gloveY,a.gloveZ-b.gloveZ)<.12)}
});
test('crab enters and exits without abrupt scale jumps',()=>{
 assert.equal(crabBlocking(0).crabScale,0);
 assert.equal(crabBlocking(30).crabScale,0);
 assert.ok(crabBlocking(12).crabScale>.99);
});
