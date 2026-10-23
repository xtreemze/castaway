import test from 'node:test';
import assert from 'node:assert/strict';
import {heightAt} from './world-terrain.mjs';
import {sampleOriginalPropStage,sampleSundialPebbles,samplePierApproach} from './original-prop-stage.mjs';
import {sampleOriginalHandContact} from './original-hand-contact.mjs';
import {solveTwoBone} from './rig-kinematics.mjs';
import {sampleFootContacts} from './foot-contact.mjs';

const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const root=[0,heightAt(0,.2)-.03,.2];

test('pebbles appear in a deterministic sequence, with real terrain contact',()=>{
  assert.equal(sampleSundialPebbles(7.99,root).filter(x=>x.visible).length,0);
  for(let i=0;i<8;i++){
    const start=8+i*.78;
    const a=sampleSundialPebbles(start+.20,root);
    assert.equal(a[i].owner,'wrist-right');
    assert.equal(a.filter(x=>x.visible).length,i+1);
    const before=sampleSundialPebbles(start+.78-1e-6,root)[i].position;
    const after=sampleSundialPebbles(start+.78+1e-6,root)[i].position;
    assert.ok(distance(before,after)<.002,'pebble '+i+' popped at landing');
  }
  const finished=sampleSundialPebbles(18,root);
  assert.equal(finished.length,8);
  for(const p of finished){
    assert.ok(p.visible);
    assert.equal(p.owner,'ground');
    assert.ok(p.position.every(Number.isFinite));
    assert.ok(Math.abs(p.position[1]-heightAt(p.position[0],p.position[2])-.067)<1e-8);
  }
  assert.deepEqual(sampleSundialPebbles(10.37,root),sampleSundialPebbles(10.37,root));
});

test('active pebble grip follows exactly the visible pebble and is anatomically reachable',()=>{
  const shoulder=[root[0]+.33,root[1]+1.45,root[2]];
  for(let i=0;i<8;i++){
    const t=8+i*.78+.17;
    const grip=sampleOriginalHandContact('sundial',t,root);
    assert.equal(grip?.resource,'pebble-'+i);
    const prop=sampleSundialPebbles(t,root)[i];
    assert.equal(prop.owner,'wrist-right');
    assert.ok(grip.weight>.5);
    assert.ok(distance(grip.position,prop.position)<1e-9);
    assert.ok(solveTwoBone(shoulder,grip.position,[shoulder[0]+.5,shoulder[1]-.1,shoulder[2]+.35],.30,.31).withinReach);
  }
  assert.equal(sampleOriginalHandContact('sundial',18,root),null);
});

test('quay sign is placed by a reachable actor, then releases to the quay',()=>{
  for(const t of [0,5,15,20,24,25,26,29]){
    const a=samplePierApproach(t);
    assert.ok(a.every(Number.isFinite));
    assert.deepEqual(a,samplePierApproach(t));
    assert.ok(Math.abs(a[1]-heightAt(a[0],a[2])+.03)<1e-8);
  }
  for(const t of [24.2,24.6,24.9,25.01]){
    const actor=samplePierApproach(t);
    const staged=sampleOriginalPropStage('pier-to-nowhere',t,actor);
    const grip=sampleOriginalHandContact('pier-to-nowhere',t,actor,staged);
    assert.equal(grip?.resource,'sign');
    assert.equal(staged.sign.owner,'wrist-right');
    assert.ok(grip.weight>0);
    const shoulder=[actor[0]+.33*Math.cos(.12),actor[1]+1.45,actor[2]-.33*Math.sin(.12)];
    const solution=solveTwoBone(shoulder,grip.position,[shoulder[0]+.6,shoulder[1]-.12,shoulder[2]+.35],.30,.31);
    assert.ok(solution.withinReach,'unreachable sign at '+t);
    assert.ok(distance(solution.wrist,grip.position)<1e-7);
  }
  assert.equal(sampleOriginalHandContact('pier-to-nowhere',25.15,samplePierApproach(25.15)),null);
  assert.equal(sampleOriginalPropStage('pier-to-nowhere',26).sign.owner,'quay');
});

test('quay approach has a continuous, deterministic alternating planted-foot gait',()=>{
  assert.equal(sampleFootContacts('pier-to-nowhere',4).weight,0);
  assert.equal(sampleFootContacts('pier-to-nowhere',20).weight,0);
  let planted=0;
  for(let t=6;t<19;t+=.04){
    const a=sampleFootContacts('pier-to-nowhere',t);
    const b=sampleFootContacts('pier-to-nowhere',t+1e-5);
    assert.deepEqual(a,sampleFootContacts('pier-to-nowhere',t));
    assert.ok(a.weight>=0&&a.weight<=1);
    for(const side of ['left','right']){
      const p=a[side],q=b[side];
      assert.ok(p.position.every(Number.isFinite));
      assert.ok(distance(p.position,q.position)<.004,'foot position discontinuity at '+t);
      if(p.planted&&q.planted){
        planted++;
        assert.ok(distance(p.position,q.position)<1e-9,'stance foot slides at '+t);
      }
    }
  }
  assert.ok(planted>40,'expected a sustained quay-walk stance');
});
