import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldFollowStoryCamera} from './src/motion-policy.js';

test('story camera follows only when allowed by both user interaction and motion preference', () => {
  assert.equal(shouldFollowStoryCamera({automaticFraming:true,reducedMotion:false}),true);
  assert.equal(shouldFollowStoryCamera({automaticFraming:true,reducedMotion:true}),false);
  assert.equal(shouldFollowStoryCamera({automaticFraming:false,reducedMotion:false}),false);
  assert.equal(shouldFollowStoryCamera({automaticFraming:false,reducedMotion:true}),false);
});

test('live toggling does not leave a sticky camera preference', () => {
  const user={automaticFraming:true,reducedMotion:false};
  user.reducedMotion=true;
  assert.equal(shouldFollowStoryCamera(user),false);
  user.reducedMotion=false;
  assert.equal(shouldFollowStoryCamera(user),true);
  user.automaticFraming=false;
  assert.equal(shouldFollowStoryCamera(user),false);
});
