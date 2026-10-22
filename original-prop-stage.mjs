import {EVENTS} from './story-catalog.mjs';

// Each story prop resolves to one renderer mesh or a named environment fixture.
// Scene-state ownership is descriptive; save-game authority remains in the story director.
export const PROP_RESOURCES=Object.freeze({
  'palm-leaf':'shade', 'hat':'hat', 'leaf glove':'glove',
  'driftwood':'stick', 'pebbles':'pebbles', 'palm':'palm',
  'bottle':'bottle', 'paper':'paper', 'cork':'cork',
  'planks':'dock', 'quay':'dock', 'sign':'sign',
});
export const ACTOR_RESOURCES=Object.freeze({castaway:'castaway-root',crab:'crab'});
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const blend=(a,b,t)=>a.map((x,i)=>mix(x,b[i],t));
const pose=(visible=false,position=[0,0,0],rotation=[0,0,0],owner='world')=>
  ({visible,position,rotation,owner});

export function validateStoryPropCoverage(events=EVENTS) {
  const errors=[];
  for(const event of events) {
    for(const actor of event.actors)if(!ACTOR_RESOURCES[actor])errors.push(event.id+': unknown actor '+actor);
    for(const prop of event.props)if(!PROP_RESOURCES[prop])errors.push(event.id+': unknown prop '+prop);
    if(!event.phases?.length)errors.push(event.id+': no scene phases');
  }
  return errors;
}

// Absolute-time sampling is independent of frame order and can be used for
// scrubbing, replay and stable screenshots at specific comic beats.
export function sampleOriginalPropStage(eventId,seconds,root=[0,0,.2]) {
  const t=Math.max(0,Math.min(30,Number.isFinite(seconds)?seconds:0));
  const [x,y,z]=root;
  const result={
    shade:pose(),hat:pose(),paper:pose(),cork:pose(),
    bottle:pose(),sign:pose(),stick:pose(),pebbles:pose(),
  };
  if(eventId==='portable-shade') {
    const lift=ease((t-7)/5),gust=ease((t-19)/3),recovery=ease((t-25)/4);
    result.hat=pose(true,[x,y+2.04,z+.02],[0,.06*Math.sin(t*.35),-.035], 'head');
    result.shade=pose(t>=7,[
      mix(x+.49,x+.04,lift)+gust*.52,
      mix(y+1.42,y+2.29,lift)-gust*.2-recovery*.5,
      z+.18-gust*.68
    ],[gust*.26,gust*Math.PI,-gust*.5],'hat');
    if(t<12)result.shade.owner='wrist-right';
    if(t>=20)result.shade.owner='wind';
  }
  if(eventId==='sundial') {
    result.stick=pose(t>=6,[.25,.40,.4],[0,0,0], 'ground');
    result.pebbles=pose(t>=8,[.25,.045,.4],[0,0,0], 'ground');
  }
  if(eventId==='return-to-sender') {
    const held=[x+.55,y+1.04,z+.35];
    const edge=[1.42,-.26,1.23];
    const afloat=[2.06,-.44,1.38];
    const home=[x+.25,y+.14,z+.35];
    let bottlePosition;
    if(t<15)bottlePosition=held;
    else if(t<19)bottlePosition=blend(held,edge,ease((t-15)/4));
    else if(t<23)bottlePosition=blend(edge,afloat,ease((t-19)/4));
    else if(t<28)bottlePosition=blend(afloat,home,ease((t-23)/5));
    else bottlePosition=home;
    const bottleOwner=t<15?'wrist-right':t<23?'water':t<28?'crab':'ground';
    const bob=t>=15&&t<23?ease((t-15)/.7)*(1-ease((t-22)/.8))*.035*Math.sin(t*4):0;
    bottlePosition=[bottlePosition[0],bottlePosition[1]+bob,bottlePosition[2]];
    result.bottle=pose(true,bottlePosition,[0,0,t>=19?.12*Math.sin(t*2):0],bottleOwner);
    result.paper=pose(t>=6&&t<14,
      blend([x+.33,y+1.14,z+.34],[held[0],held[1]-.03,held[2]],ease((t-10)/4)),
      [0,0,-.13],'wrist-right');
    // Once sealed, both items occupy the bottle and move with it.
    if(t>=14)result.paper=pose(false,bottlePosition,[0,0,0],'bottle');
    result.cork=pose(t>=12,[
      bottlePosition[0],bottlePosition[1]+.215,bottlePosition[2]
    ],[0,0,0],t<15?'wrist-right':'bottle');
  }
  if(eventId==='pier-to-nowhere') {
    const rise=ease((t-24)/2);
    result.sign=pose(t>=24,[4.52,.02+(1-rise)*.3,1.08],
      [0,0,(1-rise)*.22],t<26?'wrist-right':'quay');
  }
  return result;
}
