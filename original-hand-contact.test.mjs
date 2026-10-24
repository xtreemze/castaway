import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENTS} from './story-catalog.mjs';
import {sampleOriginalHandContact} from './original-hand-contact.mjs';
import {sampleOriginalPropStage} from './original-prop-stage.mjs';
import {solveTwoBone} from './rig-kinematics.mjs';

const d=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const root=[.15,.1,-.2];
test('original grasp targets are deterministic, finite and release at the payoff',()=>{
  for(const e of EVENTS){
    for(const t of [0,6,7,9,11,12,12.5,13,14,14.5,15,20,25,30,12.5,0]){
      const staged=sampleOriginalPropStage(e.id,t,root);
      const contact=sampleOriginalHandContact(e.id,t,root,staged);
      assert.deepEqual(contact,sampleOriginalHandContact(e.id,t,root,staged));
      if(!contact)continue;
      assert.ok(['shade','paper','cork'].includes(contact.resource));
      assert.ok(contact.weight>0&&contact.weight<=1);
      assert.ok(contact.position.every(Number.isFinite));
    }
  }
  assert.equal(sampleOriginalHandContact('portable-shade',10,root),null);
  assert.equal(sampleOriginalHandContact('portable-shade',20,root),null);
  assert.equal(sampleOriginalHandContact('return-to-sender',15,root),null);
  assert.equal(sampleOriginalHandContact('pier-to-nowhere',26,root),null);
  assert.equal(sampleOriginalHandContact('return-to-sender',Number.NaN,root),null);
});
test('contact goals remain within the anatomical wrist reach during strongest holds',()=>{
  const shoulder=[root[0]+.33,root[1]+1.45,root[2]];
  for(const [event,start,end] of [['portable-shade',7,9.8],['return-to-sender',6,15]]){
    for(let t=start;t<end;t+=.05){
      const contact=sampleOriginalHandContact(event,t,root);
      if(!contact||contact.weight<.5)continue;
      const solution=solveTwoBone(shoulder,contact.position,[root[0]+.98,root[1]+1.3,root[2]+.35],.30,.31);
      assert.ok(solution.withinReach,event+' goal is unreachable at '+t);
      assert.ok(d(solution.wrist,contact.position)<1e-7);
    }
  }
});
test('paper to cork wrist target crosses the handoff without discontinuity',()=>{
  for(const boundary of [7,12,13,14.1,15]){
    const before=sampleOriginalHandContact('return-to-sender',boundary-1e-5,root);
    const after=sampleOriginalHandContact('return-to-sender',boundary+1e-5,root);
    // A contact may appear/disappear only with zero blend weight.
    if(before&&after)assert.ok(d(before.position,after.position)<.003,'wrist popped near '+boundary);
    if(!before)assert.ok(!after||after.weight<.001);
    if(!after)assert.ok(!before||before.weight<.001);
  }
});
