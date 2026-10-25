import test from 'node:test';
import assert from 'node:assert/strict';
import {stageFitDistance,sampleStageProjection,STAGE_FRAME_POINTS} from './camera-framing.mjs';

const direction=[12,8,17], fov=40;
test('landmarks cover all story-bearing set pieces at every aspect',()=>{
  assert.ok(STAGE_FRAME_POINTS.length>85,'shore and canopy sampled');
  for(const aspect of [390/844,360/800,844/390,1280/720,1920/1080,1024/768]){
    const dist=stageFitDistance(aspect,fov,direction,{minDistance:Math.hypot(...direction)});
    assert.ok(Number.isFinite(dist)&&dist>0);
    const projected=sampleStageProjection(aspect,fov,direction,dist);
    for(const [i,p] of projected.entries()){
      assert.ok(Math.abs(p[0])<.91,'landmark '+i+' horizontally clipped at '+aspect);
      assert.ok(Math.abs(p[1])<.74,'landmark '+i+' vertically clipped at '+aspect);
    }
  }
});
test('narrow portrait requires a longer orbit than desktop',()=>{
  const landscape=stageFitDistance(1280/720,40,direction,{minDistance:22.2});
  const portrait=stageFitDistance(390/844,40,direction,{minDistance:22.2});
  assert.ok(portrait>landscape*1.3,portrait+' is not sufficiently wider than '+landscape);
});
test('rotation-compatible framing and deterministic resize recalculation',()=>{
  for(const direction of [[12,8,17],[-12,9,16],[10,7,-15],[-12,11,-14]]){
    const d=stageFitDistance(.46,40,direction,{minDistance:22.2});
    assert.equal(d,stageFitDistance(.46,40,direction,{minDistance:22.2}));
    assert.ok(sampleStageProjection(.46,40,direction,d).every(x=>Math.abs(x[0])<.91&&Math.abs(x[1])<.74));
  }
});
test('invalid aspect, camera directions and margins are rejected',()=>{
  assert.throws(()=>stageFitDistance(0,40,direction),RangeError);
  assert.throws(()=>stageFitDistance(1,0,direction),RangeError);
  assert.throws(()=>stageFitDistance(1,40,[0,0,0]),RangeError);
  assert.throws(()=>stageFitDistance(1,40,[0,1,0]),RangeError);
  assert.throws(()=>stageFitDistance(1,40,direction,{marginX:2}),RangeError);
});
