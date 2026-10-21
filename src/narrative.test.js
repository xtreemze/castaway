import { describe, expect, it } from 'vite-plus/test';
import { seededRandom, chooseStory } from './narrative.js';
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
