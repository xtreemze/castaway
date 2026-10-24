import test from 'node:test';
import assert from'node:assert/strict';import{positionAt,raftVisibility,plankCount,ROUTES,travelDistanceAt,gaitPhaseAt}from'./scene-choreography.mjs';
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

test('arc-length parameterization is deterministic and nondecreasing',()=>{
  for(const kind of Object.keys(ROUTES)){
    let previous=0;
    for(let t=0;t<=30;t+=.125){
      const distance=travelDistanceAt(kind,t);
      assert.ok(Number.isFinite(distance)&&distance>=previous-1e-9,kind+' distance at '+t);
      previous=distance;
    }
    assert.equal(travelDistanceAt(kind,12),travelDistanceAt(kind,12));
    assert.ok(Number.isFinite(gaitPhaseAt(kind,15)));
  }
});
test('stopped characters do not accumulate new gait steps',()=>{
  assert.equal(gaitPhaseAt('idle',3),gaitPhaseAt('idle',26));
  assert.equal(gaitPhaseAt('run',22),gaitPhaseAt('run',30));
});

test('all legacy scenes finish at the neutral actor station with no boundary teleport',()=>{
 for(const kind of Object.keys(ROUTES)){
   assert.deepEqual(positionAt(kind,0),[0,.2],kind+' start');
   assert.deepEqual(positionAt(kind,30),[0,.2],kind+' end');
   const last=positionAt(kind,29.999);
   assert.ok(Math.hypot(last[0],last[1]-.2)<.0001,kind+' recovery');
 }
});
