import test from 'node:test';import assert from 'node:assert/strict';
import {createCrab} from './src/crab-geometry.js';
test('low-poly crab includes visible shell, stalk eyes, legs and two animated pincers',()=>{
 const meshes=[],segments=[];
 class Group {
  children=[];position={set(){}};
  add(child){this.children.push(child)}
 }
 const T={Group};
 const ball=(radius,material,x,y,z,parent)=>{
  meshes.push({radius,x,y,z,material});
  const mesh={scale:{set(){}}};parent.add(mesh);return mesh;
 };
 const rod=(from,to,radius,material,parent)=>{
  segments.push({from,to,radius});const mesh={};parent.add(mesh);return mesh;
 };
 const {crab,claws}=createCrab({T,ball,rod,material:x=>x});
 assert.equal(claws.length,2);
 assert.ok(crab.children.includes(claws[0])&&crab.children.includes(claws[1]));
 assert.ok(meshes.some(m=>m.radius>=.3),'shell must remain visible at distance');
 assert.equal(meshes.filter(m=>m.material==='#fff7db').length,2,'two prominent eyes');
 assert.ok(segments.length>=10,'articulated legs and claws present');
});
