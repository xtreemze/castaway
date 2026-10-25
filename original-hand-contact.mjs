// Pure, time-addressable contact goals for original comic props.
// Targets are sampled from the same prop stage that owns the displayed meshes.
import {sampleOriginalPropStage} from './original-prop-stage.mjs';

const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const v=clamp(x);return v*v*(3-2*v);};
const blend=(a,b,f)=>a.map((v,i)=>v+(b[i]-v)*f);

/**
 * Return a world-space right-wrist goal during an authored grasp.
 * null means the event is in free FK, with no story-prop ownership by the hand.
 * The contact sampler never mutates actor, prop meshes, or story persistence.
 */
export function sampleOriginalHandContact(eventId,seconds,root=[0,0,.2],stage=null){
  const t=Number.isFinite(seconds)?clamp(seconds/30)*30:0;
  const props=stage??sampleOriginalPropStage(eventId,t,root);
  if(eventId==='portable-shade'&&t>=7&&t<9.8){
    const weight=ease((t-7)/.8)*(1-ease((t-8.9)/.9));
    return weight>0?{resource:'shade',position:[...props.shade.position],weight}:null;
  }
  if(eventId==='return-to-sender'&&t>=6&&t<15){
    // The hand follows the note, then hands off to the cork as it seals.
    // Cross-fading the target avoids a wrist teleport at the ownership change.
    const target=blend(props.paper.position,props.cork.position,ease((t-12)/1));
    const weight=ease((t-6)/.8)*(1-ease((t-14.1)/.9));
    return weight>0?{resource:t<12.5?'paper':'cork',position:target,weight}:null;
  }
  return null;
}
