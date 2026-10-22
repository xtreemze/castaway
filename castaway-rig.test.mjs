import assert from 'node:assert/strict';
import * as T from 'three';
import { createCastawayRig } from './castaway-rig.mjs';
import { handContact } from './hand-rig.mjs';
import { sampleOriginalHandContact } from './original-hand-contact.mjs';

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
for(const [id,time] of [['portable-shade',8.2],['return-to-sender',8],['return-to-sender',11],['return-to-sender',13.4]]){
  rig.arms[1].rotation.set(0,0,0);
  rig.elbows[1].rotation.set(0,0,0);
  const contact=sampleOriginalHandContact(id,time,world);
  assert.ok(contact&&contact.weight>.99,id+' full contact hold');
  const solution=rig.applyHandIK('original',time,contact.position,contact.weight);
  assert.ok(solution?.withinReach,id+' contact reachable');
  rig.actor.updateWorldMatrix(true,true);
  const actual=rig.hands[1].getWorldPosition(new T.Vector3());
  assert.ok(actual.distanceTo(new T.Vector3(...contact.position))<.051,id+' wrist follows prop');
}
assert.equal(rig.applyHandIK('original',20,target,0),null);
for(const t of [0,12,20,30]){
  rig.secondaryRigMotion(t,.2);
  assert.ok(Number.isFinite(rig.beard.rotation.x));
}
console.log('Articulated rig and wrist-target integration passed');
