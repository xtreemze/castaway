import {describe, it, expect} from 'vite-plus/test';
import {normalizeWorld} from './world-state.js';
import {completeLegacyScene, completeOriginalScene} from './episode-outcomes.js';

const stories = [
  ['Coconut lunch', '', 'coconut'],
  ['Building the raft', '', 'build'],
  ['Departure', '', 'depart'],
  ['Distant ship', '', 'wave'],
];
const legacy = (id, narrative = {}) => normalizeWorld({
  narrative,
  current: {family: 'legacy', id: String(id), elapsed: 30},
});
const original = (id, flags = []) => normalizeWorld({
  original: {flags},
  current: {family: 'original', id, elapsed: 30},
});

describe('canonical episode outcome adapters', () => {
  it('awards legacy inventory and a day exactly once', () => {
    const prior = legacy(0, {seen: {0: 2}, coconuts: 1});
    const completed = completeLegacyScene(prior, 0, stories);
    expect(completed.narrative).toMatchObject({day: 2, episode: 1, coconuts: 2});
    expect(completed.narrative.seen[0]).toBe(3);
    expect(completed.current.family).toBeNull();
    expect(completeLegacyScene(completed, 0, stories)).toEqual(completed);
    expect(prior.narrative.seen[0]).toBe(2);
    expect(prior.narrative.coconuts).toBe(1);
  });

  it('preserves historical raft construction and does not double-count departure', () => {
    const before = legacy(2, {raftProgress: 3, raftPeak: 1, hope: 70});
    const finished = completeLegacyScene(before, 2, stories);
    expect(finished.narrative).toMatchObject({raftProgress: 0, raftPeak: 3, failures: 1, hope: 62, day: 2});
    expect(completeLegacyScene(finished, 2, stories)).toEqual(finished);
    const built = completeLegacyScene(legacy(1, {raftProgress: 2}), 1, stories);
    expect(built.narrative.raftProgress).toBe(3);
    expect(built.narrative.raftPeak).toBe(3);
  });

  it('repairs invalid legacy scalar counters before applying a consequence', () => {
    const broken = legacy(2, {failures: 'bad', hope: '70', seen: {2: '4'}});
    const fixed = completeLegacyScene(broken, 2, stories);
    expect(fixed.narrative.failures).toBe(1);
    expect(fixed.narrative.hope).toBe(62);
    expect(fixed.narrative.seen[2]).toBe(1);
  });

  it('ignores missing or stale legacy identities and invalid scenes', () => {
    const prior = legacy(1);
    for (const index of [-1, 0, 999, 1.5]) {
      expect(completeLegacyScene(prior, index, stories)).toEqual(prior);
    }
    expect(completeLegacyScene(prior, 1, [])).toEqual(prior);
  });

  it('commits an original vignette once, including played history and a durable count', () => {
    const prior = original('crab-handshake');
    const once = completeOriginalScene(prior, 'crab-handshake');
    expect(once.original.flags).toContain('crab_met');
    expect(once.original.played).toEqual(['crab-handshake']);
    expect(once.original.counts['crab-handshake']).toBe(1);
    expect(once.original.episode).toBe(1);
    expect(once.narrative.day).toBe(2);
    expect(completeOriginalScene(once, 'crab-handshake')).toEqual(once);
    expect(prior.original.flags).not.toContain('crab_met');
  });

  it('allows another completed repeatable gag after a new active episode', () => {
    const first = completeOriginalScene(original('crab-handshake'), 'crab-handshake');
    const replay = normalizeWorld({...first, current: {family: 'original', id: 'crab-handshake', elapsed: 30}});
    const twice = completeOriginalScene(replay, 'crab-handshake');
    expect(twice.original.counts['crab-handshake']).toBe(2);
    expect(twice.original.played).toEqual(['crab-handshake', 'crab-handshake']);
    expect(twice.narrative.day).toBe(3);
  });

  it('rejects missing prerequisites, unrecognized events and replayed milestones', () => {
    const bottle = original('return-to-sender');
    expect(completeOriginalScene(bottle, 'return-to-sender')).toEqual(bottle);
    const eligible = original('return-to-sender', ['crab_met']);
    expect(completeOriginalScene(eligible, 'return-to-sender').original.flags).toContain('bottle_sent');
    expect(completeOriginalScene(eligible, 'unknown-event')).toEqual(eligible);

    const pier = original('pier-to-nowhere');
    const once = completeOriginalScene(pier, 'pier-to-nowhere');
    expect(once.original.flags).toContain('pier_inspected');
    const replay = normalizeWorld({...once, current: {family: 'original', id: 'pier-to-nowhere', elapsed: 30}});
    expect(completeOriginalScene(replay, 'pier-to-nowhere')).toEqual(replay);
  });

  it('does not let an original completion commit a different active family', () => {
    const prior = legacy(1);
    expect(completeOriginalScene(prior, 'crab-handshake')).toEqual(prior);
    const other = original('sundial');
    expect(completeOriginalScene(other, 'portable-shade')).toEqual(other);
  });
});
