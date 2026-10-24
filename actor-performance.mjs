// A single renderer-independent authority for castaway pose targets.
// Angles are radians; positions are world-space scene units. The sampler is pure:
// sampling out of order, replaying, or pausing never accumulates rotations.
import { samplePose } from './animation-director.mjs';
import { positionAt } from './scene-choreography.mjs';
import { secondaryMotion } from './secondary-motion.mjs';
import { comedyPose } from './comedy-acting.mjs';
import { expressionAt } from './character-expression.mjs';
import { gripAt } from './hand-rig.mjs';
import { crabBlocking } from './crab-choreography.mjs';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = x => { const v = clamp(x, 0, 1); return v * v * (3 - 2 * v); };
const envelope = (t, start, rise, fall, end) =>
  ease((t - start) / (rise - start)) * (1 - ease((t - fall) / (end - fall)));
const lerpAngle = (a, b, weight) =>
  a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * weight;
const motionLimits = {
  torso: [[-.7, .75], [-.6, .6], [-.5, .5]],
  head: [[-.65, .65], [-.6, .6], [-.65, .65]],
  arm: [[-2.65, 1.65], [-.65, .65], [-2.9, 2.9]],
  leg: [[-1.1, 1.1], [-.25, .25], [-.3, .3]],
};
const constrain = (angles, limits) => angles.map((a, i) => clamp(a, ...limits[i]));

/**
 * Samples a complete pose at an absolute point in a 30-second vignette.
 * No Three.js objects, render state, frame delta, or random state are required.
 * Props and contact targets are separate projections of the same story clock.
 */
export function sampleActorPerformance({
  kind = 'idle', time = 0, worldTime = time, originalId = null, reducedMotion = false,
} = {}) {
  const t = clamp(Number.isFinite(time) ? time : 0, 0, 30);
  const clock = Number.isFinite(worldTime) ? worldTime : t;
  const travel = positionAt(kind, t);
  const prior = positionAt(kind, Math.max(0, t - .016));
  const secondary = secondaryMotion(kind, t, travel, prior);
  const scale = reducedMotion ? .35 : 1;
  const routine = !originalId;
  const active = envelope(t, 4.6, 6.4, 19.5, 25.8);
  const reversal = envelope(t, 19.1, 20, 23, 25.8);
  const recovery = envelope(t, 24, 25, 27.8, 29.8);
  const breath = .018 * Math.sin(clock * 1.3) * (1 - .6 * active);
  const origin = kind === 'run' && reducedMotion
    ? [travel[0] * .25, .2 + (travel[1] - .2) * .25]
    : travel;
  const root = [0, .11 * Math.sin(clock * .3), 0];
  const torso = [0, 0, breath];
  const head = [0, 0, .035 * Math.sin(clock * .7)];
  const arms = [[0, 0, -.08], [0, 0, .08]];
  const legs = [[0, 0, 0], [0, 0, 0]];
  let height = .1 + .01 * Math.sin(clock * 1.3);
  const track = routine ? samplePose(kind, t) : [0, 0, 0, 0];
  torso[0] += track[0]; head[0] += track[1];
  arms[0][0] += track[2]; arms[1][0] += track[3];

  if (routine) {
    switch (kind) {
      case 'fish':
        root[1] = -.5 * envelope(t, 0, 3, 26, 30);
        arms[1][0] -= .9 * active;
        if (t >= 20 && t < 25) head[2] += .18 * reversal;
        break;
      case 'coconut':
        arms[1][0] += -active + .28 * Math.sin(t * 2) * active;
        if (t >= 19 && t < 25) head[2] += .3 * reversal;
        break;
      case 'run':
        height += .035 * Math.abs(Math.sin(t * 9)) * secondary.weight;
        break;
      case 'wave':
        arms[1][2] -= 2.1 * active + .16 * Math.sin(t * 5) * active;
        head[2] += .12 * active;
        break;
      case 'build':
      case 'raft':
        torso[0] += .22 * active;
        arms[0][0] -= .7 * active; arms[1][0] -= .7 * active;
        arms[0][0] += .18 * Math.sin(t * 3) * active;
        arms[1][0] -= .18 * Math.sin(t * 3) * active;
        if (kind === 'build') torso[0] += .35 * reversal;
        break;
      case 'dance':
        arms[0][2] -= 2.2 * active; arms[1][2] += 2.2 * active;
        legs[0][0] += .3 * Math.sin(t * 7) * active;
        legs[1][0] -= .3 * Math.sin(t * 7) * active;
        break;
      case 'sleep':
        root[2] -= 1.38 * ease(t / 6) * (1 - ease((t - 25) / 4));
        height += .11 * ease(t / 6) * (1 - ease((t - 25) / 4));
        break;
      case 'alarm':
        arms[0][2] -= 1.65 * active; arms[1][2] += 1.65 * active;
        head[2] += .12 * Math.sin(t * 4) * active;
        break;
    }
  } else {
    const acting = comedyPose(originalId, t);
    torso[0] += acting.lean;
    head[2] += acting.headRoll;
    head[0] += acting.lookUp;
    arms[1][0] += acting.arm;
    root[1] += acting.bodyTurn;
    if (originalId === 'crab-handshake') {
      const crab = crabBlocking(t);
      torso[0] += .42 * crab.handBend + .18 * crab.bow;
      arms[1][0] -= 1.2 * crab.handReach;
      head[0] += .22 * crab.recognition;
      head[2] -= .2 * crab.recognition;
    }
    if (originalId === 'pier-to-nowhere') {
      origin[0] = 1.4 * envelope(t, 0, 3, 27, 30);
      root[1] = .7 * envelope(t, 0, 3, 27, 30);
    }
  }

  // Derive gait from route displacement, not render-frame timing; never animate
  // the limbs when the root is stationary.
  legs[0][0] += secondary.leftLeg * scale;
  legs[1][0] += secondary.rightLeg * scale;
  arms[0][0] += secondary.leftArm * scale;
  arms[1][0] += secondary.rightArm * scale;
  torso[0] += secondary.lean * scale;
  head[0] += secondary.lookUp * scale;
  height += secondary.lift * scale;
  if (secondary.heading !== null && routine && kind !== 'sleep') {
    root[1] = lerpAngle(root[1], secondary.heading, secondary.weight);
  }
  const expression = expressionAt(routine ? kind : 'idle', t);
  head[0] -= expression.shock * .18;

  // Only expressive offsets are motion-scaled. Spatial blocking remains authored.
  if (reducedMotion) {
    for (const part of [torso, head, ...arms, ...legs])
      for (let axis = 0; axis < 3; axis++) part[axis] *= scale;
  }
  const hand = gripAt(routine ? kind : 'idle', t);
  return {
    position: [origin[0], height, origin[1]],
    root,
    torso: constrain(torso, motionLimits.torso),
    head: constrain(head, motionLimits.head),
    arms: arms.map(a => constrain(a, motionLimits.arm)),
    legs: legs.map(l => constrain(l, motionLimits.leg)),
    expression,
    hand: { index: hand.hand, closure: hand.closure * (reducedMotion ? .75 : 1) },
    locomotion: { weight: secondary.weight, heading: secondary.heading },
  };
}
