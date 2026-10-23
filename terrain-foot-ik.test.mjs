import assert from 'node:assert/strict';
import * as T from 'three';
import {createCastawayRig} from './castaway-rig.mjs';

// Run the production rig against a real Three.js scene (no WebGL required).
const scene=new T.Scene();
const m=color=>new T.MeshStandardMaterial({color});
const skin=m('#c88b68'),hair=m('#463527'),shirt=m('#ddd0aa'),shorts=m('#78563b'),white=m('#fff');
const obj=(geometry,material,x=0,y=0,z=0,parent=scene)=>{
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
};
const ball=(radius,material,x,y,z,parent)=>obj(new T.IcosahedronGeometry(radius,1),material,x,y,z,parent);
const rod=(a,b,radius,material,parent)=>{
  const start=new T.Vector3(...a),end=new T.Vector3(...b);
  const mesh=obj(new T.CylinderGeometry(radius,radius,start.distanceTo(end),6),material,0,0,0,parent);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());
  return mesh;
};
const rig=createCastawayRig({T,scene,obj,ball,rod,m,skin,hair,shirt,shorts,white});
assert.equal(rig.ankles.length,2);
assert.equal(rig.knees.length,2);
const flat=()=>0;
const initial=rig.applyFootIK(flat,.8);
assert.equal(initial.length,2);
assert.ok(initial.every(s=>s===null||s.wrist.every(Number.isFinite)));
const pose=rig.ankles.map(ankle=>ankle.getWorldPosition(new T.Vector3()).toArray());
const repeated=rig.ankles.map(ankle=>ankle.getWorldPosition(new T.Vector3()).toArray());
assert.deepEqual(pose,repeated);
for(let i=0;i<2;i++) {
  rig.legs[i].quaternion.identity();
  rig.knees[i].quaternion.identity();
}
const repeat=rig.applyFootIK(flat,.8);
assert.equal(repeat.length,2);
assert.throws(()=>rig.applyFootIK(()=>NaN),RangeError);
assert.throws(()=>rig.applyFootIK(null),TypeError);
assert.deepEqual(rig.applyFootIK(flat,0),[]);
console.log('Terrain-aware foot IK integration tests passed');
