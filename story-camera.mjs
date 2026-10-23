import {FRAME_TARGET,fitCameraPoints,stageFitDistance,projectCameraPoints} from './camera-framing.mjs';
import {sampleOriginalPropStage} from './original-prop-stage.mjs';

// Camera beats are editorial projections, never new narrative or animation state.
// Authored focus is opt-in until visual quality is approved on real devices.
const BEATS=Object.freeze({
  'portable-shade':{start:7,end:12,assets:['shade','hat'],name:'leaf-grasp'},
  'sundial':{start:8,end:17,assets:['stick','pebbles'],name:'stone-placement'},
  'return-to-sender':{start:9,end:15,assets:['paper','cork','bottle'],name:'message-sealing'},
  'pier-to-nowhere':{start:24,end:29,assets:['sign'],name:'pier-payoff'},
});
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const v=clamp(x);return v*v*(3-2*v);};
const interpolate=(a,b,w)=>a.map((v,i)=>v+(b[i]-v)*w);

function focusPoints(eventId,seconds,root,assets){
  const [x,y,z]=root;
  // Physical extents of the tiny actor, including feet, face and right hand.
  const points=[[x,y+.05,z],[x,y+2.25,z],[x+.42,y+1.13,z+.29]];
  const stage=sampleOriginalPropStage(eventId,seconds,root);
  for(const key of assets){
    const item=stage[key];
    if(item?.visible) {
      points.push(item.position);
      if(key==='shade')points.push([item.position[0]+.6,item.position[1],item.position[2]]);
      if(key==='pebbles')for(const dx of [-.55,.55])points.push([item.position[0]+dx,item.position[1],item.position[2]]);
      if(key==='sign')points.push([item.position[0]+.33,item.position[1]+.4,item.position[2]]);
    }
  }
  return points;
}

/** Pure absolute-time camera target for a single story beat. No frame history. */
export function sampleStoryCamera(eventId,seconds,aspect,fovDegrees,direction,root=[0,0,.2],options={}){
  const beat=BEATS[eventId];
  if(!beat||options.reducedMotion||!Number.isFinite(seconds)||seconds<=beat.start||seconds>=beat.end)return null;
  if(!Array.isArray(root)||root.length!==3||!root.every(Number.isFinite))throw new TypeError('Finite actor root required');
  // Enter and leave closeups through a full-stage establishing shot, without snap cuts.
  const weight=ease((seconds-beat.start)/1.3)*(1-ease((seconds-(beat.end-1.3))/1.3));
  if(weight<=0)return null;
  const points=focusPoints(eventId,seconds,root,beat.assets);
  const focus=points.reduce((acc,p)=>acc.map((v,i)=>v+p[i]/points.length),[0,0,0]);
  const stageDistance=stageFitDistance(aspect,fovDegrees,direction,{minDistance:Math.hypot(12,8,17)});
  const fitted=fitCameraPoints(aspect,fovDegrees,direction,focus,points,{
    marginX:.75,marginY:.57,minDistance:Math.max(9,stageDistance*.40)
  });
  // A closeup that would be wider than the establishing shot provides no benefit.
  const focusDistance=Math.min(stageDistance,fitted);
  const target=interpolate(FRAME_TARGET,focus,weight);
  const distance=stageDistance+(focusDistance-stageDistance)*weight;
  return {shot:beat.name,weight,target,distance,stageDistance,focusDistance,points};
}

export function projectStoryFocus(aspect,fovDegrees,direction,sample){
  return projectCameraPoints(aspect,fovDegrees,direction,sample.target,sample.distance,sample.points);
}
