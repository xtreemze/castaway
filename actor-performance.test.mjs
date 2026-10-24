import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleActorPerformance } from './actor-performance.mjs';

const kinds = ['idle','fish','coconut','run','wave','build','raft','dance','sleep','depart','alarm'];
const originals = ['portable-shade','crab-handshake','sundial','return-to-sender','pier-to-nowhere'];
const serialize = pose => JSON.stringify(pose);
test('every legacy and original event yields finite, anatomical pose targets', () => {
  for(const kind of kinds) for(const time of [0,1,5,9,12,19,20,22,25,29,30]) {
    const pose = sampleActorPerformance({kind,time,worldTime:time});
    for(const key of ['position','root','torso','head'])
      assert.ok(pose[key].every(Number.isFinite),kind+' '+time+' '+key);
    for(const limb of [...pose.arms,...pose.legs]) assert.ok(limb.every(Number.isFinite));
  }
  for(const originalId of originals) for(let time=0;time<=30;time+=.25) {
    const pose=sampleActorPerformance({originalId,time,worldTime:time});
    assert.ok(pose.position.concat(pose.head,pose.torso,...pose.arms,...pose.legs).every(Number.isFinite));
  }
});
test('sampling order never changes pose or mutates source state',()=>{
  const query={kind:'run',time:15,worldTime:15};
  const baseline=serialize(sampleActorPerformance(query));
  for(const t of [29,1,20,5,0,30,15,15])
    sampleActorPerformance({kind:'run',time:t,worldTime:t});
  assert.equal(serialize(sampleActorPerformance(query)),baseline);
  assert.deepEqual(query,{kind:'run',time:15,worldTime:15});
});
test('neutral idle has zero locomotion weight and no leg cycling',()=>{
  const pose=sampleActorPerformance({kind:'idle',time:15});
  assert.equal(pose.locomotion.weight,0);
  assert.deepEqual(pose.legs,[[0,0,0],[0,0,0]]);
});
test('running uses travel-driven gait; early and final positions meet',()=>{
  const start=sampleActorPerformance({kind:'run',time:9});
  const middle=sampleActorPerformance({kind:'run',time:15});
  const end=sampleActorPerformance({kind:'run',time:22});
  assert.deepEqual(start.position.filter((_,i)=>i!==1),end.position.filter((_,i)=>i!==1));
  assert.ok(middle.locomotion.weight>.2);
});
test('reduced-motion preserves authored intent but dampens limb movement',()=>{
  const normal=sampleActorPerformance({kind:'wave',time:13,worldTime:13});
  const reduced=sampleActorPerformance({kind:'wave',time:13,worldTime:13,reducedMotion:true});
  assert.ok(Math.abs(reduced.arms[1][2])<Math.abs(normal.arms[1][2])*.5);
});
test('story contacts are independent of sampled history',()=>{
  const before=sampleActorPerformance({originalId:'crab-handshake',time:17});
  sampleActorPerformance({originalId:'crab-handshake',time:27});
  assert.deepEqual(sampleActorPerformance({originalId:'crab-handshake',time:17}),before);
});
