import test from 'node:test';import assert from 'node:assert/strict';import {crabHandshakeAt} from './crab-handshake.mjs';
test('the crab approaches before greeting and leaves after the theft',()=>{
 const a=crabHandshakeAt(0),b=crabHandshakeAt(12),c=crabHandshakeAt(28);
 assert.ok(b.crabX<a.crabX);assert.ok(c.crabX>b.crabX);
});
test('glove changes owner during the payoff and moves with the crab',()=>{
 const before=crabHandshakeAt(18),after=crabHandshakeAt(23);
 assert.ok(before.gloveY>after.gloveY);assert.ok(Math.abs(after.gloveX-after.crabX)<.01);
});
test('shock follows transfer rather than anticipating it',()=>{
 assert.equal(crabHandshakeAt(19).shock,0);assert.ok(crabHandshakeAt(23).shock>.5);
});
test('episode samples remain finite and crab exits by recovery',()=>{
 for(let t=0;t<=30;t+=.25)assert.ok(Object.entries(crabHandshakeAt(t)).every(([k,v])=>typeof v==='boolean'||Number.isFinite(v)),String(t));
 assert.equal(crabHandshakeAt(30).crabVisible,false);
});
