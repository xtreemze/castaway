import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleStoryCamera,projectStoryFocus} from './story-camera.mjs';
import {stageFitDistance} from './camera-framing.mjs';

const direction=[12,8,17],fov=40;
const fixtures=[
  ['portable-shade',9,[0,.1,.2]],
  ['sundial',12,[0,.1,.2]],
  ['return-to-sender',12.5,[0,.1,.2]],
  ['pier-to-nowhere',26,[1.4,.1,.2]],
];
test('authored scene samples are pure, seekable and clipped to reachable visual bounds',()=>{
  for(const aspect of [390/844,360/800,844/390,1280/720]){
    for(const [event,time,root] of fixtures){
      const shot=sampleStoryCamera(event,time,aspect,fov,direction,root);
      assert.ok(shot,event+' missing camera beat');
      assert.deepEqual(shot,sampleStoryCamera(event,time,aspect,fov,direction,root));
      assert.ok(shot.distance<shot.stageDistance*.995,event+' failed to provide a closeup');
      assert.ok(shot.weight>0&&shot.weight<=1);
      for(const [x,y] of projectStoryFocus(aspect,fov,direction,shot)){
        assert.ok(Number.isFinite(x)&&Number.isFinite(y));
        assert.ok(Math.abs(x)<.98&&Math.abs(y)<.90,
          event+' clipped focus at '+aspect+': '+x+','+y);
      }
    }
  }
});
test('boundaries blend toward exactly the safe establishing shot',()=>{
  const root=[0,.1,.2],aspect=390/844,base=stageFitDistance(aspect,fov,direction,{minDistance:Math.hypot(...direction)});
  assert.equal(sampleStoryCamera('portable-shade',7,aspect,fov,direction,root),null);
  assert.equal(sampleStoryCamera('portable-shade',12,aspect,fov,direction,root),null);
  const entering=sampleStoryCamera('portable-shade',7.001,aspect,fov,direction,root);
  const leaving=sampleStoryCamera('portable-shade',11.999,aspect,fov,direction,root);
  assert.ok(Math.abs(entering.distance-base)<.001);
  assert.ok(Math.abs(leaving.distance-base)<.001);
});
test('reduced motion and unknown events never trigger automatic orbit changes',()=>{
  assert.equal(sampleStoryCamera('idle',10,1,40,direction),null);
  assert.equal(sampleStoryCamera('portable-shade',9,1,40,direction,[0,0,0],{reducedMotion:true}),null);
  assert.equal(sampleStoryCamera('portable-shade',NaN,1,40,direction),null);
});
