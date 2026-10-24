import assert from 'node:assert/strict';
import * as T from 'three';
import { createCastawayRig } from './castaway-rig.mjs';
import { handContact } from './hand-rig.mjs';
// Original prop handoffs are exercised separately by the semantic prop integration.

const scene=new T.Scene();
const mat=new T.MeshBasicMaterial({color:'white'});
const obj=(geometry,material,x=0,y=0,z=0,parent=scene)=>{
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  parent.add(mesh);
  return mesh;
};
const ball=(r,material,x,y,z,parent=scene)=>
  obj(new T.IcosahedronGeometry(r,1),material,x,y,z,parent);
const rod=(a,b,r,material,parent=scene)=>{
  const from=new T.Vector3(...a),to=new T.Vector3(...b);
  const delta=to.clone().sub(from);
  const mesh=obj(new T.CylinderGeometry(r,r,delta.length(),7),material,
    (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,parent);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  return mesh;
};
const rig=createCastawayRig({
  T,scene,obj,ball,rod,m:()=>mat,skin:mat,hair:mat,shirt:mat,shorts:mat,white:mat,
});
for(const name of ['castaway-root','pelvis','spine-chest','neck','head','beard',
  'shoulder-left','elbow-left','wrist-left','shoulder-right','elbow-right','wrist-right',
  'hip-left','knee-left','ankle-left','hip-right','knee-right','ankle-right']){
  assert.ok(rig.socket(name),name+' socket required');
}
const world=rig.actor.position.toArray();
const target=handContact('coconut',15,world).position;
for(const time of [12.6,13,15,17,19.3]){
  // The normal authored arm pose is regenerated before each absolute-time sample.
  rig.arms[1].rotation.set(0,0,0);
  rig.elbows[1].rotation.set(0,0,0);
  const solution=rig.applyHandIK('coconut',time,target);
  assert.ok(solution,'grip expected for '+time);
  rig.actor.updateWorldMatrix(true,true);
  const actual=rig.hands[1].getWorldPosition(new T.Vector3());
  const error=actual.distanceTo(new T.Vector3(...target));
  assert.ok(error<.051,'world wrist gap: '+time+' error '+error);
}
assert.equal(rig.applyHandIK('fish',15,target),null);
assert.equal(rig.applyHandIK('original',20,target,0),null);
for(const t of [0,12,20,30]){
  rig.secondaryRigMotion(t,.2);
  assert.ok(Number.isFinite(rig.beard.rotation.x));
}
// Whole-rig terrain contact: all joints are regenerated from absolute time.
const footGoalModule=await import('./foot-contact.mjs');
const routeModule=await import('./scene-choreography.mjs');
const terrainModule=await import('./world-terrain.mjs');
let plantedSamples=0,reachableSamples=0;
for(const kind of ['fish','coconut','run']){
  const start=kind==='run'?9.8:2, end=kind==='run'?21:8;
  for(let time=start;time<end;time+=.14){
    const {sampleFootContacts}=footGoalModule;
    const {positionAt}=routeModule;
    const {heightAt}=terrainModule;
    const stage=positionAt(kind,time);
    const goals=sampleFootContacts(kind,time);
    rig.actor.position.set(stage[0],heightAt(...stage)-.03,stage[1]);
    const prior=positionAt(kind,time-.015),next=positionAt(kind,time+.015);
    rig.actor.rotation.set(0,Math.atan2(next[0]-prior[0],next[1]-prior[1]),0);
    rig.legs.forEach(j=>j.rotation.set(0,0,0));
    rig.knees.forEach(j=>j.rotation.set(0,0,0));
    rig.ankles.forEach(j=>j.rotation.set(0,0,0));
    const results=rig.applyFootIK(goals);
    if(goals.weight<=.95)continue;
    assert.equal(results.length,2);
    for(const [i,side] of ['left','right'].entries()){
      const result=results[i];
      const planted=goals[side].planted;
      assert.ok(result.elbow.every(Number.isFinite)&&result.wrist.every(Number.isFinite));
      assert.ok(Number.isFinite(result.error));
      if(planted)plantedSamples++;
      if(result.withinReach){
        reachableSamples++;
        rig.actor.updateWorldMatrix(true,true);
        const actual=rig.ankles[i].getWorldPosition(new T.Vector3());
        const distance=actual.distanceTo(new T.Vector3(...goals[side].position));
        assert.ok(distance<.051,kind+' '+side+' ankle not near ground target @'+time+': '+distance);
      }
    }
  }
}
assert.ok(plantedSamples>20,'expected grounded stance samples');
assert.ok(reachableSamples>20,'expected reachable foot targets');
rig.applyFootIK({weight:0,left:null,right:null});
assert.equal(rig.pelvis.position.y,0,'free FK resets compressed pelvis');
console.log('Articulated rig and wrist-target integration passed');
