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
  it('never schedules locked raft or departure scenes', () => {
    const stories = Array.from({length:12}, (_, i) => ['Scene '+i, '', i === 6 ? 'raft' : i === 9 ? 'depart' : 'idle']);
    for (let episode = 0; episode < 100; episode++) {
      const result = chooseNextScene(stories, {seed:42,episode,seen:{},lastKinds:[],raftProgress:0}, 0);
      expect([6,9]).not.toContain(result);
    }
  });
  it('replays scene selection exactly from saved narrative state', () => {
    const stories = Array.from({length:12}, (_, i) => ['Scene '+i,'','kind'+i]);
    const state = {seed:1357,episode:34,seen:{1:4,2:2},lastKinds:['kind3'],raftProgress:3};
    expect(chooseNextScene(stories,state,2)).toBe(chooseNextScene(stories,structuredClone(state),2));
  });
  it('excludes current scene when others are eligible', () => {
    const stories = [['A','','a'],['B','','b'],['C','','c']];
    for(let episode=0;episode<100;episode++) {
      expect(chooseNextScene(stories,{seed:1,episode,seen:{},lastKinds:[],raftProgress:0},1)).not.toBe(1);
    }
  });
});
