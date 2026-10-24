import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENTS} from './story-catalog.mjs';
import {heightAt} from './world-terrain.mjs';
import {validateStoryPropCoverage,sampleOriginalPropStage,PROP_RESOURCES} from './original-prop-stage.mjs';

test('every catalog actor and prop resolves to geometry or a world fixture',()=>{
  assert.deepEqual(validateStoryPropCoverage(),[]);
  assert.equal(PROP_RESOURCES['leaf glove'],'glove');
  assert.deepEqual(validateStoryPropCoverage([{id:'bad',actors:['seagull'],props:['television'],phases:['setup']}]),
    ['bad: unknown actor seagull','bad: unknown prop television']);
});
test('five original vignettes sample finite, repeatable stage positions in any order',()=>{
  const root=[.3,.1,-.2];
  for(const event of EVENTS) {
    for(const t of [30,0,19,7,25,12,21,6,29.9,16,30]) {
      const a=sampleOriginalPropStage(event.id,t,root);
      const b=sampleOriginalPropStage(event.id,t,root);
      assert.deepEqual(a,b,event.id+' @ '+t);
      for(const p of Object.values(a)) {
        assert.ok(typeof p.visible==='boolean');
        assert.ok(typeof p.owner==='string');
        assert.ok(p.position.every(Number.isFinite),event.id+' @ '+t);
        assert.ok(p.rotation.every(Number.isFinite),event.id+' @ '+t);
      }
    }
  }
});
test('hat and broad leaf appear and the wind shifts the shade at payoff',()=>{
  const setup=sampleOriginalPropStage('portable-shade',10);
  const payoff=sampleOriginalPropStage('portable-shade',23);
  assert.equal(setup.hat.visible,true);
  assert.equal(setup.shade.visible,true);
  assert.equal(payoff.shade.owner,'wind');
  assert.ok(payoff.shade.position[2]<setup.shade.position[2]);
});
test('SOS paper seals into bottle; bottle route remains position-continuous',()=>{
  assert.equal(sampleOriginalPropStage('return-to-sender',8).paper.visible,true);
  assert.equal(sampleOriginalPropStage('return-to-sender',16).paper.visible,false);
  assert.equal(sampleOriginalPropStage('return-to-sender',16).paper.owner,'bottle');
  assert.equal(sampleOriginalPropStage('return-to-sender',24).bottle.owner,'crab');
  assert.equal(sampleOriginalPropStage('return-to-sender',29).bottle.owner,'ground');
  for(const edge of [15,19,23,28]) {
    const before=sampleOriginalPropStage('return-to-sender',edge-1e-6).bottle.position;
    const after=sampleOriginalPropStage('return-to-sender',edge+1e-6).bottle.position;
    assert.ok(Math.hypot(...before.map((v,i)=>v-after[i]))<.001,'bottle jump at '+edge);
  }
});
test('sundial and pier sign are staged only during their own episodes',()=>{
  assert.equal(sampleOriginalPropStage('sundial',9).pebbles.visible,true);
  assert.equal(sampleOriginalPropStage('pier-to-nowhere',23).sign.visible,false);
  assert.equal(sampleOriginalPropStage('pier-to-nowhere',26.1).sign.visible,true);
  assert.equal(sampleOriginalPropStage('pier-to-nowhere',28).sign.owner,'quay');
  assert.equal(sampleOriginalPropStage('crab-handshake',28).sign.visible,false);
});

test('the returned bottle lands on the exact committed terrain height',()=>{
  for(const t of [28,29,29.999,30]){
    const p=sampleOriginalPropStage('return-to-sender',t,[0,0,.2]).bottle.position;
    assert.ok(Math.abs(p[1]-heightAt(p[0],p[2])-.185)<1e-8,'final bottle buried at '+t);
  }
});
