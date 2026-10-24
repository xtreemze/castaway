import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleFootContacts} from './foot-contact.mjs';
import {heightAt} from './world-terrain.mjs';
import {positionAt} from './scene-choreography.mjs';

const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('no IK outside travel and authored quiet performance',()=>{
  for(const kind of ['idle','sleep','dance'])for(const t of [0,1,4,10,20,30]){
    const p=sampleFootContacts(kind,t);assert.equal(p.weight,0);
  }
  assert.equal(sampleFootContacts('fish',0).weight,0);
  assert.equal(sampleFootContacts('fish',9).weight,0);
  assert.equal(sampleFootContacts('run',9).weight,0);
  assert.equal(sampleFootContacts('run',22).weight,0);
});
test('absolute time controls feet independent of sampling order',()=>{
  for(const kind of ['run','fish','coconut','wave','build','raft','depart','alarm']){
    for(const t of [18,1.4,7.2,3.1,6,2,10.1,20.1,5.3,1.4]){
      const result=sampleFootContacts(kind,t);
      assert.deepEqual(result,sampleFootContacts(kind,t));
      assert.ok(result.weight>=0&&result.weight<=1);
      for(const foot of [result.left,result.right]){
        if(!foot)continue;
        assert.ok(foot.position.every(Number.isFinite),kind+' @ '+t);
        const terrain=heightAt(foot.position[0],foot.position[2]);
        assert.ok(foot.position[1]>=terrain+.09-1e-8,'foot above surface '+kind+' @ '+t);
        if(foot.planted)assert.ok(Math.abs(foot.position[1]-(terrain+.09))<1e-8);
      }
    }
  }
});
test('planted feet remain fixed and swing resolves continuously to next plant',()=>{
  for(const kind of ['fish','run']){
    const start=kind==='run'?11:3, stop=kind==='run'?19:6;
    for(let t=start;t<stop;t+=.02){
      const a=sampleFootContacts(kind,t),b=sampleFootContacts(kind,t+.0001);
      if(a.weight<.9||b.weight<.9)continue;
      for(const side of ['left','right']){
        const p=a[side],q=b[side];
        assert.ok(dist(p.position,q.position)<.008,kind+' '+side+' discontinuity at '+t);
        if(p.planted&&q.planted)assert.ok(dist(p.position,q.position)<1e-10,
          kind+' '+side+' slid during stance at '+t);
      }
    }
  }
});
test('jogging route has no teleport at entrance and exit',()=>{
  for(const edge of [9,22]){
    const left=positionAt('run',edge-1e-5),right=positionAt('run',edge+1e-5);
    assert.ok(Math.hypot(right[0]-left[0],right[1]-left[1])<.001,
      'run route jumped at '+edge);
  }
});
