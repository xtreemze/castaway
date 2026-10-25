import test from 'node:test';
import assert from 'node:assert/strict';
import {createFrameScheduler} from './src/frame-scheduler.js';

function harness(){
  const tasks=new Map();let id=0,renders=[],resumes=0,cancellations=0;
  const scheduler=createFrameScheduler({
    request:fn=>{tasks.set(++id,fn);return id;},
    cancel:key=>{if(tasks.delete(key))cancellations++;},
    render:timestamp=>renders.push(timestamp),
    onResume:()=>{resumes++;},
  });
  return {scheduler,tasks,renders,read:()=>({resumes,cancellations}),
    step(time){assert.equal(tasks.size,1);const [key,callback]=tasks.entries().next().value;tasks.delete(key);callback(time)}};
}

test('one active frame, idempotent start and no hidden polling',()=>{
  const h=harness();
  h.scheduler.start();h.scheduler.start();assert.equal(h.tasks.size,1);
  h.step(100);assert.deepEqual(h.renders,[100]);assert.equal(h.tasks.size,1);
  h.scheduler.setVisible(false);assert.equal(h.tasks.size,0);
  h.scheduler.setVisible(false);assert.equal(h.tasks.size,0);
  assert.equal(h.read().cancellations,1);
  h.scheduler.setVisible(true);assert.equal(h.read().resumes,1);
  assert.equal(h.tasks.size,1);
  h.step(110);assert.deepEqual(h.renders,[100,110]);
});
test('visibility changes before start never start a hidden timer',()=>{
  const h=harness();
  h.scheduler.setVisible(false);
  h.scheduler.start();
  assert.equal(h.tasks.size,0);
  h.scheduler.setVisible(true);
  assert.equal(h.tasks.size,1);
});
test('dispose cancels the pending callback and cannot restart',()=>{
  const h=harness();
  h.scheduler.start();const callback=h.tasks.values().next().value;
  h.scheduler.dispose();h.scheduler.dispose();
  assert.equal(h.tasks.size,0);
  callback(500);assert.deepEqual(h.renders,[]);
  h.scheduler.setVisible(true);h.scheduler.start();assert.equal(h.tasks.size,0);
});
test('invalid callback contracts are rejected',()=>{
  assert.throws(()=>createFrameScheduler({request:()=>1,cancel:()=>{}}),TypeError);
});
