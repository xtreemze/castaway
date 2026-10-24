import test from 'node:test';
import assert from'node:assert/strict';import{positionAt,raftVisibility,plankCount,ROUTES}from'./scene-choreography.mjs';
for(const k of Object.keys(ROUTES)){assert.ok(Math.abs(positionAt(k,0)[0])<1e-9);assert.equal(positionAt(k,0)[1],.2);for(let t=0;t<=30;t+=.5)assert.ok(positionAt(k,t).every(Number.isFinite))}
assert.equal(raftVisibility(0,'idle'),false);assert.equal(raftVisibility(2,'idle'),true);assert.equal(plankCount(7),4);assert.equal(plankCount(-1),0);console.log('Choreography tests passed');

test('running circuit is position-continuous and returns to planted origin',()=>{
  for(const t of [9,22]){
    const before=positionAt('run',t-.001),after=positionAt('run',t+.001);
    assert.ok(Math.hypot(before[0]-after[0],before[1]-after[1])<.001,'run cut at '+t);
  }
  assert.deepEqual(positionAt('run',9),[0,.2]);
  assert.deepEqual(positionAt('run',22),[0,.2]);
  const midpoint=positionAt('run',15.5);
  assert.ok(Math.hypot(midpoint[0],midpoint[1]-.2)>.5,'must actually circle');
});
test('depart action blends out without position snap at payoff',()=>{
  for(const t of [14,22,24,29]){
    const before=positionAt('depart',t-.001),after=positionAt('depart',t+.001);
    assert.ok(Math.hypot(before[0]-after[0],before[1]-after[1])<.001,'departure cut at '+t);
  }
});
