import { describe, expect, it } from 'vite-plus/test';
import { chooseStory, createRandom } from './narrative.js';

const stories = [['Idle', '', 'idle'], ['Fish', '', 'fish'], ['Run', '', 'run']];
const state = { seen: {}, lastKinds: [], raftProgress: 0 };

describe('deterministic narrative selection', () => {
  it('replays the same random sequence for the same seed', () => {
    const a = createRandom('castaway');
    const b = createRandom('castaway');
    expect(Array.from({ length: 20 }, a)).toEqual(Array.from({ length: 20 }, b));
  });
  it('never repeats the current story', () => {
    const rng = createRandom('island');
    for (let i = 0; i < 100; i++) {
      expect(chooseStory(stories, state, 1, rng)).not.toBe(1);
    }
  });
  it('handles a singleton story list', () => {
    expect(chooseStory([stories[0]], state, 0)).toBe(0);
  });
});
