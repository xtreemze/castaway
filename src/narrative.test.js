import { describe, expect, it } from 'vite-plus/test';
import { seededRandom, chooseStory, chooseNextScene } from './narrative.js';
describe('story replay', () => {
  it('is deterministic by seed', () => {
    const a = seededRandom('castaway'), b = seededRandom('castaway');
    expect(Array.from({length: 20}, a)).toEqual(Array.from({length: 20}, b));
  });
  it('does not repeat active story', () => {
    const stories = [['Idle','','idle'],['Fish','','fish'],['Sleep','','sleep']];
    const history = {seen:{},lastKinds:[],raftProgress:0};
    for (let i=0;i<20;i++) expect(chooseStory(stories,history,1,seededRandom(i))).not.toBe(1);
  });
});
describe('worker legacy sequence contract', () => {
  const stories=Array.from({length:12},(_,i)=>['Scene '+i,'',i===6?'raft':i===9?'depart':'kind'+i]);
  const state={seed:541,episode:8,seen:{1:4,2:2},lastKinds:['kind3'],raftProgress:0};
  it('is identical after reload and unrelated random draws',()=>{
    const copy=JSON.parse(JSON.stringify(state));
    const first=chooseNextScene(stories,state,0);
    for(let n=0;n<100;n++)Math.random();
    expect(chooseNextScene(stories,copy,0)).toBe(first);
    expect(state).toEqual(copy);
  });
  it('never selects locked raft or departure and avoids active event',()=>{
    for(let episode=0;episode<200;episode++){
      const pick=chooseNextScene(stories,{...state,episode},1);
      expect([1,6,9]).not.toContain(pick);
    }
  });
  it('replays a deterministic sequence across an actual save roundtrip',()=>{
    let story={...state,seen:{},lastKinds:[],episode:0};
    const generated=[];
    for(let i=0;i<35;i++){
      const next=chooseNextScene(stories,story,i?generated[i-1]:0);
      generated.push(next);
      const kind=stories[next][2];
      story={...story,episode:story.episode+1,seen:{...story.seen,[next]:(story.seen[next]||0)+1},lastKinds:[...story.lastKinds,kind].slice(-3)};
      if(i===17)story=JSON.parse(JSON.stringify(story));
    }
    let replay={...state,seen:{},lastKinds:[],episode:0};
    for(let i=0;i<35;i++){
      const next=chooseNextScene(stories,replay,i?generated[i-1]:0);
      expect(next).toBe(generated[i]);
      const kind=stories[next][2];
      replay={...replay,episode:replay.episode+1,seen:{...replay.seen,[next]:(replay.seen[next]||0)+1},lastKinds:[...replay.lastKinds,kind].slice(-3)};
    }
  });
  it('handles one-scene catalogs and malformed legacy migration fields',()=>{
    expect(chooseNextScene([['Only','','idle']],{},0)).toBe(0);
    expect(Number.isInteger(chooseNextScene(stories,{lastKinds:null},0))).toBe(true);
  });
});
