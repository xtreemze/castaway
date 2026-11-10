import {completeEpisode, normalizeWorld} from './world-state.js';
import {applyInventory} from '../prop-choreography.mjs';
import {completeStoryEvent} from '../story-director.mjs';
import {EVENTS} from '../story-catalog.mjs';

/**
 * Convert a finished legacy vignette into a single canonical world transaction.
 * This is a pure domain operation: no rendering, storage, clocks or side effects.
 * The caller must have an active episode with the corresponding family and ID.
 */
export function completeLegacyScene(world, sceneIndex, stories) {
  const snapshot = normalizeWorld(world);
  if (!Number.isSafeInteger(sceneIndex) || sceneIndex < 0 || !Array.isArray(stories)) return snapshot;
  const scene = stories[sceneIndex];
  if (!Array.isArray(scene) || typeof scene[2] !== 'string') return snapshot;

  return completeEpisode(snapshot, 'legacy', String(sceneIndex), state => {
    const n = state.narrative;
    const kind = scene[2];
    // Valid v2 envelopes may still contain invalid historic scalar values.
    n.failures = Number.isSafeInteger(n.failures) && n.failures >= 0 ? n.failures : 0;
    n.hope = Number.isFinite(n.hope) ? Math.max(0, Math.min(100, n.hope)) : 70;
    const previousVisits = n.seen[sceneIndex];
    n.seen[sceneIndex] = (Number.isSafeInteger(previousVisits) && previousVisits >= 0 ? previousVisits : 0) + 1;
    n.lastKinds = [...n.lastKinds, kind].slice(-3);
    n.lastEvent = sceneIndex;
    n.episode++;
    const previousRaftProgress = n.raftProgress;
    Object.assign(n, applyInventory(n, kind));
    n.raftPeak = Math.max(n.raftPeak || 0, previousRaftProgress, n.raftProgress);
    if (kind === 'depart') {
      n.failures++;
      n.hope = Math.max(35, n.hope - 8);
      n.raftProgress = 0;
    }
    if (kind === 'wave' || kind === 'raft') n.hope = Math.min(100, n.hope + 4);
  });
}

/**
 * Complete an eligible original vignette without duplicate inventory or flags.
 * The single active-episode guard in completeEpisode is shared with legacy
 * scenes. Repeated gags may be performed again; one-off milestones may not.
 */
export function completeOriginalScene(world, eventId, catalog = EVENTS) {
  const snapshot = normalizeWorld(world);
  if (typeof eventId !== 'string' || !Array.isArray(catalog)) return snapshot;
  const event = catalog.find(item => item.id === eventId);
  if (!event || !Array.isArray(event.requires) || !Array.isArray(event.effects)) return snapshot;
  if (!event.requires.every(flag => snapshot.original.flags.includes(flag))) return snapshot;
  if (event.kind === 'milestone' && event.effects.every(flag => snapshot.original.flags.includes(flag))) return snapshot;

  return completeEpisode(snapshot, 'original', eventId, state => {
    const before = state.original;
    const completed = completeStoryEvent(before, event);
    const prior = before.counts[event.id] || 0;
    completed.counts = {...before.counts, [event.id]: prior + 1};
    state.original = completed;
  });
}
