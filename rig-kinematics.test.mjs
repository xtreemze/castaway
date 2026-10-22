import assert from 'node:assert/strict';
import {solveTwoBone} from './rig-kinematics.mjs';
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const root=[.33,1.45,0],pole=[.8,1.3,.35];
for(let theta=-Math.PI;theta<=Math.PI;theta+=.17) {
  const target=[.33+.28*Math.sin(theta),1.15,.28*Math.cos(theta)];
  const a=solveTwoBone(root,target,pole,.3,.31);
  const b=solveTwoBone(root,target,pole,.3,.31);
  assert.deepEqual(a,b,'time-independent deterministic IK');
  assert.ok(a.elbow.every(Number.isFinite)&&a.wrist.every(Number.isFinite));
  assert.ok(Math.abs(dist(root,a.elbow)-.3)<1e-8,'upper length');
  assert.ok(Math.abs(dist(a.elbow,a.wrist)-.31)<1e-8,'forearm length');
  assert.ok(dist(target,a.wrist)<1e-8,'reachable target');
}
const far=solveTwoBone(root,[10,1,4],pole,.3,.31);
assert.equal(far.withinReach,false);
assert.ok(Number.isFinite(far.error)&&far.error>0);
assert.ok(dist(root,far.wrist)<.61);
for(const target of [root,[.33,-2,0],[.33,1.45,2],[.33,1.45,-2]]) {
  const a=solveTwoBone(root,target,root,.3,.31);
  assert.ok(a.elbow.every(Number.isFinite)&&a.wrist.every(Number.isFinite));
}
assert.throws(()=>solveTwoBone(root,[0,0,0],pole,0,.3),RangeError);
console.log('Analytic two-bone kinematics passed');
