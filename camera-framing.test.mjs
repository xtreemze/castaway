import test from 'node:test';import assert from 'node:assert/strict';
import {cameraShot,WIDE_SHOT,CRAB_LANDSCAPE_SHOT,CRAB_PORTRAIT_SHOT,framingEase} from './src/camera-framing.js';
test('crab framing responds to landscape and portrait aspect',()=>{
 assert.equal(cameraShot('crab-handshake',16/9),CRAB_LANDSCAPE_SHOT);
 assert.equal(cameraShot('crab-handshake',390/844),CRAB_PORTRAIT_SHOT);
 assert.equal(cameraShot('idle',390/844),WIDE_SHOT);
});
test('authored shots contain finite noncoincident camera and target',()=>{
 for(const shot of [WIDE_SHOT,CRAB_LANDSCAPE_SHOT,CRAB_PORTRAIT_SHOT]){
  assert.equal(shot.position.length,3);assert.equal(shot.focus.length,3);
  assert.ok([...shot.position,...shot.focus].every(Number.isFinite));
  assert.ok(Math.hypot(...shot.position.map((v,i)=>v-shot.focus[i]))>4);
 }
});
test('damping is monotonic and bounded',()=>{
 assert.equal(framingEase(0),0);
 assert.ok(framingEase(.01)>0);
 assert.ok(framingEase(.05)>framingEase(.01));
 assert.ok(framingEase(1)<1);
});
