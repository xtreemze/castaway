import { completeEpisode } from './world-state.js';
import { applyInventory } from '../prop-choreography.mjs';

/** Apply legacy consequences inside the canonical exactly-once transaction. */
export function completeLegacyScene(world, sceneIndex, stories) {
  const story = stories[sceneIndex];
  if (!story) return world;
  return completeEpisode(world, 'legacy', String(sceneIndex), state => {
    const n=state.narrative, kind=story[2];
    n.seen[sceneIndex]=(n.seen[sceneIndex]||0)+1;
    n.lastKinds=[...n.lastKinds,kind].slice(-3);
    n.lastEvent=sceneIndex;
    n.episode++;
    Object.assign(n,applyInventory(n,kind));
    n.raftPeak=Math.max(n.raftPeak||0,n.raftProgress||0);
    if(kind==='depart'){
      n.failures++;n.hope=Math.max(35,n.hope-8);n.raftProgress=0;
    }
    if(kind==='wave'||kind==='raft')n.hope=Math.min(100,n.hope+4);
  });
}
