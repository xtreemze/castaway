
import * as T from 'three';import{createWorld,updateShorelineFoam}from'../world-geometry.mjs';import{heightAt,waterHeightAt}from'../world-terrain.mjs';import{stageFitDistance,sampleStageProjection}from'../camera-framing.mjs';import{createCastawayRig}from'../castaway-rig.mjs';import{sampleOriginalPropStage}from'../original-prop-stage.mjs';import{sampleOriginalHandContact}from'../original-hand-contact.mjs';import{createSupplementaryOriginalMeshes}from'../original-prop-meshes.mjs';import{sampleFootContacts}from'../foot-contact.mjs';import{EVENTS}from'../story-catalog.mjs';import{crabBlocking}from'../crab-choreography.mjs';import{comedyPose,comedySound}from'../comedy-acting.mjs';import{newStoryState,chooseStoryEvent,completeStoryEvent,beatForTime}from'../story-director.mjs';import{samplePose,beatAt}from'../animation-director.mjs';import{positionAt,raftVisibility,plankCount}from'../scene-choreography.mjs';import{propPose,applyInventory}from'../prop-choreography.mjs';import{secondaryMotion}from'../secondary-motion.mjs';import{expressionAt}from'../character-expression.mjs';import{handContact}from'../hand-rig.mjs';import{groundContact}from'../ground-contact.mjs';
export function startScene({ canvas, emit, initialStoryState, initialNarrativeState, preview, width, height, pixelRatio = 1 }) {
const scene=new T.Scene();scene.background=new T.Color('#94cfdf');scene.fog=new T.Fog('#94cfdf',26,95);const camera=new T.PerspectiveCamera(40,width/height,.1,180);camera.position.set(12,9,17);
const renderer=new T.WebGLRenderer({antialias:true,canvas});renderer.setPixelRatio(Math.min(pixelRatio,2));renderer.setSize(width,height,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
const target = new T.Vector3(0,1,0);
const baseRadius=Math.hypot(12,8,17);
let radius=baseRadius,theta=Math.atan2(12,17),phi=Math.acos(8/radius);
let displayedRadius=radius,displayedTheta=theta,displayedPhi=phi;
let frameFitRadius=baseRadius;
function frameDirection(){
  return [Math.sin(phi)*Math.sin(theta),Math.cos(phi),Math.sin(phi)*Math.cos(theta)];
}
function fitWholeStage(reset=false){
  const direction=frameDirection();
  const next=stageFitDistance(camera.aspect,camera.fov,direction,{minDistance:baseRadius});
  radius=reset?next:clamp(radius*next/frameFitRadius,9,Math.max(37,next*1.55));
  frameFitRadius=next;
  updateCamera(true);
  if(preview?.id)emit({type:'frame-inspection',aspect:camera.aspect,distance:radius,
    projected:sampleStageProjection(camera.aspect,camera.fov,direction,radius)});
}
const pointers=new Map();
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function updateCamera(immediate=false){
  const factor=immediate?1:.18;
  displayedRadius+=(radius-displayedRadius)*factor;
  displayedTheta+=(theta-displayedTheta)*factor;
  displayedPhi+=(phi-displayedPhi)*factor;
  const sin=Math.sin(displayedPhi);
  camera.position.set(target.x+displayedRadius*sin*Math.sin(displayedTheta),target.y+displayedRadius*Math.cos(displayedPhi),target.z+displayedRadius*sin*Math.cos(displayedTheta));
  camera.lookAt(target);
}
function handlePointer({action,id,x,y}){
  if(action==='down'){pointers.set(id,{x,y});return}
  if(action==='up'){pointers.delete(id);return}
  const old=pointers.get(id);
  if(!old)return;
  if(pointers.size===1){
    theta-=((x-old.x)/Math.max(width,1))*Math.PI*2;
    phi=clamp(phi-((y-old.y)/Math.max(height,1))*Math.PI,0.03,1.48);
  }else if(pointers.size===2){
    const other=[...pointers.entries()].find(([key])=>key!==id)?.[1];
    if(other){
      const before=Math.hypot(old.x-other.x,old.y-other.y);
      const after=Math.hypot(x-other.x,y-other.y);
      if(before>0&&after>0)radius=clamp(radius*before/after,9,Math.max(37,frameFitRadius*1.55));
    }
  }
  pointers.set(id,{x,y});updateCamera();
}
fitWholeStage(true);
scene.add(new T.HemisphereLight('#e2f7ff','#77734c',2));const sun=new T.DirectionalLight('#fff1c9',3.1);sun.position.set(-7,12,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;scene.add(sun);
const m=c=>new T.MeshStandardMaterial({color:c,roughness:1,flatShading:true}),sand=m('#efd49a'),wood=m('#805a3b'),bark=m('#967354'),leaf=m('#438551'),leaf2=m('#65a461'),skin=m('#d49d74'),hair=m('#53402e'),shirt=m('#eddfc0'),shorts=m('#987359'),white=m('#fff8e8');
function obj(g,mt,x=0,y=0,z=0,p=scene){const o=new T.Mesh(g,mt);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
function ball(r,mt,x,y,z,p=scene){return obj(new T.IcosahedronGeometry(r,1),mt,x,y,z,p)}
function rod(a,b,r,mt,p=scene){const d=new T.Vector3(...b).sub(new T.Vector3(...a)),o=obj(new T.CylinderGeometry(r*.9,r,d.length(),7),mt,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
const {seaMat,seaGeo,sea,foam,dock,palm,crown,fronds,bush}=createWorld({T,scene,obj,ball,rod,m,sand,wood,bark,leaf,leaf2});
let waveUniform;
seaMat.onBeforeCompile=(shader)=>{
  shader.uniforms.castawayWaveTime={value:0};
  waveUniform=shader.uniforms.castawayWaveTime;
  shader.vertexShader=shader.vertexShader
    .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      float waveX=position.x*.4+castawayWaveTime*.7;
      float waveZ=position.z*.35-castawayWaveTime*.6;
      objectNormal=normalize(vec3(-.032*cos(waveX),1.0,.0315*sin(waveZ)));`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed.y+=.08*sin(position.x*.4+castawayWaveTime*.7)+.09*cos(position.z*.35-castawayWaveTime*.6);`);
  shader.vertexShader='uniform float castawayWaveTime;\n'+shader.vertexShader;
};
seaMat.customProgramCacheKey=()=> 'castaway-ocean-wave-v1';
const {actor,torso,head,eyes,pupils,brows,arms,hands,legs,elbows,knees,ankles,applyHandIK,applyFootIK,secondaryRigMotion}=createCastawayRig({T,scene,obj,ball,rod,m,skin,hair,shirt,shorts,white});
const footprints=Array.from({length:12},()=>{const o=obj(new T.CircleGeometry(.11,12),new T.MeshBasicMaterial({color:'#c39c68',transparent:true,opacity:0,depthWrite:false}),0,-.017,0);o.rotation.x=-Math.PI/2;return o});let footprintHead=0,lastFootfall=-1;const prop=new T.Group();scene.add(prop);const supplies=new T.Group();scene.add(supplies);const storedCoconuts=Array.from({length:8},(_,i)=>{const a=i*2.399,r=.23*Math.sqrt(i);return ball(.16,wood,-1.05+Math.cos(a)*r,.02+.16*(i%2),.55+Math.sin(a)*r,supplies)});const coconut=ball(.22,wood,.7,.23,.65,prop);const pole=rod([.9,.15,1.1],[1.4,2,1.1],.035,wood,prop);const float=ball(.08,white,1.7,-.45,1.1,prop);const splash=new T.Group();scene.add(splash);splash.visible=false;for(let i=0;i<7;i++){const drop=ball(.045,m('#b9ecf5'),0,0,0,splash);drop.userData.angle=i*Math.PI*2/7}
const carriedLog=obj(new T.CylinderGeometry(.11,.11,.85,7),bark,0,0,0);carriedLog.rotation.z=Math.PI/2;carriedLog.visible=false;const raft=new T.Group();raft.position.set(1.6,.05,1.1);scene.add(raft);for(let i=0;i<4;i++){const log=obj(new T.CylinderGeometry(.16,.16,1.7,7),bark,i*.33-.5,0,0,raft);log.rotation.x=Math.PI/2}
// New narrative scenes share the existing character rig and are isolated from legacy choreography.
let storyState;
try{
  const value=initialStoryState;
  storyState=value&&Number.isInteger(value.seed)&&Array.isArray(value.flags)&&Array.isArray(value.played)&&Number.isInteger(value.episode)?value:newStoryState();
}catch{storyState=newStoryState()}
let originalEvent=null,previousOriginalBeat=-1;
const comedyProps=new T.Group();comedyProps.visible=false;scene.add(comedyProps);
const shade=obj(new T.ConeGeometry(.78,.1,5),leaf,0,2.45,0,comedyProps);
const stick=obj(new T.CylinderGeometry(.035,.045,.8,6),bark,0,.5,0,comedyProps);
const pebbleMeshes=Array.from({length:8},(_,i)=>ball(.065,wood,Math.cos(i*Math.PI/4)*.55,.04,Math.sin(i*Math.PI/4)*.55,comedyProps));
const crab=new T.Group();comedyProps.add(crab);crab.position.set(.8,.12,.7);
ball(.18,m('#cf654a'),0,.06,0,crab);for(let side of [-1,1])for(let i=0;i<3;i++)rod([side*.1,.05,i*.09-.1],[side*.31,-.05,i*.14-.2],.025,m('#bf694b'),crab);
const glove=obj(new T.BoxGeometry(.2,.055,.18),leaf2,0,.2,0,comedyProps);
const bottle=obj(new T.CylinderGeometry(.085,.1,.37,7),new T.MeshStandardMaterial({color:'#8fc8b6',transparent:true,opacity:.8}),0,.2,0,comedyProps);
const supplementalProps=createSupplementaryOriginalMeshes({T,obj,m,white,wood,bark,leaf,comedyProps});
function paintOriginalEvent(time){
  comedyProps.visible=Boolean(originalEvent);
  if(!originalEvent)return;
  const id=originalEvent.id,beat=beatForTime(time),impact=smooth((time-19)/4);
  const staged=sampleOriginalPropStage(id,time,actor.position.toArray());
  const meshes={shade,stick,bottle,...supplementalProps};
  for(const [name,mesh] of Object.entries(meshes)){
    const state=staged[name];
    mesh.visible=state.visible;
    if(state.visible){mesh.position.set(...state.position);mesh.rotation.set(...state.rotation)}
  }
  pebbleMeshes.forEach((item,i)=>{
    item.visible=staged.pebbles.visible;
    if(item.visible){
      const [x,y,z]=staged.pebbles.position;
      item.position.set(x+Math.cos(i*Math.PI/4)*.55,y,z+Math.sin(i*Math.PI/4)*.55);
    }
  });
  crab.visible=id==='crab-handshake'||id==='return-to-sender';
  glove.visible=id==='crab-handshake';
  if(id==='crab-handshake'){
    // Single authority: the already-merged crab blocking sampler.
    const b=crabBlocking(time);
    crab.position.set(b.crabX,.12,b.crabZ);crab.scale.setScalar(b.crabScale);
    glove.position.set(b.gloveX+actor.position.x*(1-b.contact),b.gloveY,b.gloveZ+actor.position.z*(1-b.contact));
    glove.rotation.z=b.gloveAngle;
    torso.rotation.x+=.42*b.handBend+.18*b.bow;
    arms[1].rotation.x-=1.2*b.handReach;
    head.rotation.x+=.22*b.recognition;head.rotation.z-=.2*b.recognition;
  }else{
    crab.scale.setScalar(1);glove.position.set(0,.2,0);glove.rotation.z=0;
    if(id==='return-to-sender'&&time>=23&&time<28){
      const [x,,z]=staged.bottle.position;
      crab.position.set(x,heightAt(x,z)+.07,z-.18);
    }else crab.position.set(.8,heightAt(.8,.7)+.07,.7);
  }
  if(id==='sundial')crown.rotation.z+=beat>=3?.22*impact:0;
  if(id==='pier-to-nowhere'){actor.position.x=1.4;actor.rotation.y=.7;}
  const acting=comedyPose(id,time);
  torso.rotation.x+=acting.lean;head.rotation.z+=acting.headRoll;
  head.rotation.x+=acting.lookUp;arms[1].rotation.x+=acting.arm;actor.rotation.y+=acting.bodyTurn;
  const grip=sampleOriginalHandContact(id,time,actor.position.toArray(),staged);
  if(grip){
    applyHandIK('original',time,grip.position,grip.weight);
    hands[1].children.forEach(part=>{if(part.userData.finger)part.rotation.x=grip.weight*.9});
  }
}
function startOriginalEvent(){
  const selected=chooseStoryEvent(storyState);
  if(!selected)return false;
  originalEvent=selected;
  seconds=0;previousBeat=-1;previousOriginalBeat=-1;
  ui('name','Day '+narrative.day+' · '+selected.title);
  ui('desc',selected.phases[0]);
  ui('sub',selected.accessibilitySummary);
  return true;
}
function finishOriginalEvent(){
  if(!originalEvent)return;
  storyState=completeStoryEvent(storyState,originalEvent);
  emit({type:'persist',key:'castaway-original-story-v1',value:storyState});
  originalEvent=null;comedyProps.visible=false;
  
}
const stories=[['A quiet day','He surveys his kingdom of sand.','idle','A kingdom of one.'],['Gone fishing','Patience is an admirable quality.','fish','The fish have other plans.'],['Coconut lunch','Lunch is more complicated than expected.','coconut','Lunch fights back.'],['Morning exercise','One lap is a considerable expedition.','run','Around the world in eight seconds.'],['A distant ship','He waves with unreasonable confidence.','wave','Perhaps they saw him.'],['A magnificent invention','The castaway works on a glorious plan.','build','Progress is relative.'],['The raft','Four logs and a limitless imagination.','raft','Nothing can possibly go wrong.'],['Rain dance','The weather does not cooperate.','dance','The clouds seem unimpressed.'],['Afternoon nap','There is time to dream.','sleep','He dreams of dry socks.'],['Departure','The greatest journey begins.','depart','It ends slightly sooner.'],['Something in the water','Perhaps swimming is a bad idea.','alarm','There are other options.'],['Still here','The tide brings another day.','idle','There is always tomorrow.']];
const narrative={day:1,hope:70,failures:0,coconuts:0,raftProgress:0,seen:{},lastKinds:[],lastEvent:0};
try{const saved=initialNarrativeState;if(saved&&Number.isInteger(saved.day)&&saved.day>0)Object.assign(narrative,saved)}catch{}
const beats=[{start:0,end:5,label:'Anticipation'},{start:5,end:12,label:'Preparation'},{start:12,end:20,label:'Action'},{start:20,end:25,label:'Comic payoff'},{start:25,end:30,label:'Recovery'}];
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
let index=0,seconds=0,total=0,previousBeat=-1,paused=false,dark=false,visible=true;const duration=30;
const uiCache=new Map();
const ui=(id,value)=>{if(uiCache.get(id)===value)return;uiCache.set(id,value);emit({type:'ui',id,value})};
function cue(freq=440){emit({type:'cue',freq})}
function stagedPose(kind,time){const pose=samplePose(kind,time);torso.rotation.x+=pose[0];head.rotation.x+=pose[1];arms[0].rotation.x+=pose[2];arms[1].rotation.x+=pose[3]}
function foley(kind,beat){const tones={coconut:[230,170],fish:[540,350],wave:[670,280],build:[220,310],raft:[260,210],depart:[420,115],alarm:[850,570]};const f=tones[kind]||[360,220];if(beat===2)cue(f[0]);if(beat===3){cue(f[1]);if(kind==='depart'||kind==='coconut')cue(f[1]*.73)}}
function playConsequences(k,t){const carrying=propPose(k,t,actor.position.x,actor.position.z);carriedLog.visible=(k==='build'||k==='raft')&&carrying.mode==='carried';if(carriedLog.visible){const hold=handContact(k,t,[actor.position.x,actor.position.y,actor.position.z]);carriedLog.position.set(...hold.position)}storedCoconuts.forEach((o,i)=>o.visible=i<Math.min(8,narrative.coconuts)+(k==='coconut'&&t>25?1:0));const payoff=smooth((t-19)/3),recover=smooth((t-25)/5);splash.visible=k==='depart'&&t>=19&&t<25;if(splash.visible){splash.position.set(2.3,-.36,1.1);for(const drop of splash.children){const a=drop.userData.angle,r=.1+payoff*.8;drop.position.set(Math.cos(a)*r,.15+Math.sin(payoff*Math.PI)*.32,Math.sin(a)*r)}}if(k==='coconut'){const p=propPose(k,t,actor.position.x,actor.position.z);coconut.visible=p.mode!=='stored';if(p.mode==='carried'){const hold=handContact(k,t,[actor.position.x,actor.position.y,actor.position.z]);coconut.position.set(...hold.position)}else coconut.position.set(p.x,p.y,p.z);coconut.rotation.z=p.mode==='bounce'?(t-19)*5:0;head.rotation.z+=p.mode==='bounce'?.3:0}if(k==='raft'||k==='depart'){raft.scale.setScalar(k==='depart'?1:.7+plankCount(narrative.raftProgress)*.075);raft.children.forEach((log,i)=>{log.visible=i<Math.max(1,plankCount(narrative.raftProgress)+(k==='raft'?1:0))});raft.rotation.z=k==='depart'&&t>19?Math.sin((t-19)*3)*.25*(1-recover):0}if(k==='wave'&&t>20&&t<25)arms[1].rotation.z=-.2;if(k==='fish'&&t>20&&t<25){float.position.x=1.7+.6*Math.sin((t-20)*2);head.rotation.z=.18}if(k==='build'&&t>20&&t<25)torso.rotation.x=.6*(1-recover)}
function chooseNext(){const eligible=stories.map((s,i)=>({i,score:Math.random()+((narrative.seen[i]||0)*-.14)+(narrative.lastKinds.includes(s[2])?-.5:0)+(i===6&&narrative.raftProgress<2?-.9:0)+(i===9&&narrative.raftProgress<3?-.9:0)})).filter(s=>s.i!==index&&(s.i!==6||narrative.raftProgress>=2)&&(s.i!==9||narrative.raftProgress>=3));eligible.sort((a,b)=>b.score-a.score);return eligible[0].i}
function resolveEvent(){const k=stories[index][2];narrative.seen[index]=(narrative.seen[index]||0)+1;narrative.lastKinds=[...narrative.lastKinds,k].slice(-3);narrative.lastEvent=index;narrative.day++;
Object.assign(narrative,applyInventory(narrative,k));if(k==='depart'){narrative.failures++;narrative.hope=Math.max(35,narrative.hope-8);narrative.raftProgress=0}if(k==='wave'||k==='raft')narrative.hope=Math.min(100,narrative.hope+4);
emit({type:'persist',key:'castaway-story-v1',value:narrative});}
function event(n){if(originalEvent){originalEvent=null;comedyProps.visible=false;}lastFootfall=-1;if(typeof index==='number'&&total>0&&seconds>=duration-0.05)resolveEvent();previousBeat=-1;index=(n+stories.length)%stories.length;seconds=0;const [name,desc,kind,sub]=stories[index];storedCoconuts.forEach((o,i)=>o.visible=i<Math.min(8,narrative.coconuts));ui('name','Day '+narrative.day+' · '+name);ui('desc',desc);ui('sub',sub);coconut.visible=kind==='coconut';pole.visible=float.visible=kind==='fish';raft.visible=raftVisibility(narrative.raftProgress,kind);cue(460+index*25)}event(0);
// Read-only QA previews are resolved in the worker, not from window.location.
const previewScene=EVENTS.find(item=>item.id===preview?.id);
if(previewScene){
  originalEvent=previewScene;
  const previewTime=Number(preview.time);
  seconds=Number.isFinite(previewTime)?Math.max(0,Math.min(duration-.001,previewTime)):0;
  paused=true;
  ui('pause','Resume');ui('name','Preview · '+previewScene.title);
  ui('sub',previewScene.accessibilitySummary);
}
function next(){
 if(originalEvent){originalEvent=null;comedyProps.visible=false;event(index+1)}
 else if(!startOriginalEvent())event(index+1);
}
function handle(message){
 switch(message.type){
  case 'pointer':handlePointer(message);break;
  case 'wheel':radius=clamp(radius*Math.exp(message.delta*.001),9,Math.max(37,frameFitRadius*1.55));updateCamera();break;
  case 'resize':
   width=Math.max(1,message.width);height=Math.max(1,message.height);
   camera.aspect=width/height;fitWholeStage();camera.updateProjectionMatrix();
   renderer.setPixelRatio(Math.min(message.pixelRatio||1,2));renderer.setSize(width,height,false);break;
  case 'next':next();break;
  case 'pause':paused=!paused;ui('pause',paused?'Resume':'Pause');break;
  case 'reset':theta=Math.atan2(12,17);phi=Math.acos(8/baseRadius);fitWholeStage(true);break;
  case 'night':
   dark=!dark;scene.background.set(dark?'#0d2244':'#94cfdf');scene.fog.color.copy(scene.background);
   sun.intensity=dark?.5:3.1;sun.color.set(dark?'#a6bce8':'#fff1c9');
   seaMat.color.set(dark?'#153f67':'#207fa7');ui('night',dark?'Day':'Night');
   emit({type:'ambience',time:total,dark});break;
  case 'visibility':visible=message.visible;break;
 }
}
let lastProgressSent=-1,lastAmbienceSent=-1;
const clock=new T.Clock();let bird=0,requestId,lastRenderTime=0;
const raf=typeof requestAnimationFrame==='function'?requestAnimationFrame:(callback)=>setTimeout(()=>callback(performance.now()),16);
const cancel=typeof cancelAnimationFrame==='function'?cancelAnimationFrame:clearTimeout;
function frame(timestamp=performance.now()){
  requestId=raf(frame);
  if(!visible||timestamp-lastRenderTime<1000/60-1)return;
  lastRenderTime=timestamp;const dt=Math.min(clock.getDelta(),.05);if(!paused){total+=dt;seconds+=dt;if(seconds>=duration){if(originalEvent){finishOriginalEvent();seconds=0;event(chooseNext())}else{resolveEvent();seconds=0;if(!startOriginalEvent())event(chooseNext())}}}const t=total,k=originalEvent?'idle':stories[index][2],phase=seconds/duration,beat=beats.findIndex(b=>seconds>=b.start&&seconds<b.end),energy=beat===0?.25:beat===1?.5:beat===2?1:beat===3?1.4:.15,beatTime=seconds-(beats[Math.max(0,beat)]?.start||0);
const tideY=waterHeightAt(originalEvent?.id,seconds);sea.position.y=tideY;if(waveUniform)waveUniform.value=t;updateShorelineFoam(foam,tideY,t);crown.rotation.z=.05*Math.sin(t);const stage=positionAt(k,seconds),priorStage=positionAt(k,Math.max(0,seconds-.016)),secondary=secondaryMotion(k,seconds,stage,priorStage),contactGround=groundContact(k,seconds,stage,priorStage);if(contactGround.footprint>.45&&seconds-lastFootfall>.37){lastFootfall=seconds;const footprint=footprints[footprintHead++%footprints.length];const markX=stage[0]+(contactGround.foot?-.15:.15),markZ=stage[1];footprint.position.set(markX,heightAt(markX,markZ)+.009,markZ);footprint.material.opacity=.4;footprint.userData.born=total}footprints.forEach(o=>{o.material.opacity=Math.max(0,.4-(total-(o.userData.born??-100))* .014)});actor.position.set(stage[0],heightAt(stage[0],stage[1])-.03+.025*Math.sin(t*2)+secondary.lift-contactGround.sandCompression,stage[1]);actor.rotation.set(0,.11*Math.sin(t*.3),0);torso.rotation.set(0,0,.025*Math.sin(t*1.2));head.rotation.set(0,0,.06*Math.sin(t*.7));arms.forEach((a,i)=>{a.rotation.set(0,0,(i?1:-1)*(.08+.06*Math.sin(t*1.1)))});legs.forEach(l=>l.rotation.set(0,0,0));knees.forEach(j=>j.rotation.set(0,0,0));ankles.forEach(j=>j.rotation.set(0,0,0));elbows.forEach(j=>j.rotation.set(0,0,0));head.rotation.x=beat===0?-.18*smooth(beatTime/5):beat===3?.28:0;torso.rotation.x=beat===1?-.12*smooth(beatTime/7):beat===3?.24:beat===4?-.12*smooth(beatTime/5):0;
if(k==='fish'){actor.rotation.y=-.5;arms[1].rotation.x=-.9*energy;float.position.y=-.43+.05*Math.sin(t*2)}
if(k==='coconut'){arms[1].rotation.x=-1+Math.sin(t*2)*.7*energy;coconut.position.y=.23+Math.max(0,Math.sin(t*2))*.16}
if(k==='run'){actor.rotation.y=secondary.heading??actor.rotation.y;legs.forEach((l,i)=>l.rotation.x=Math.sin(t*10+i*Math.PI)*.55*energy);actor.position.y=heightAt(actor.position.x,actor.position.z)-.03+Math.abs(Math.sin(t*10))*.1}
if(k==='wave'){arms[1].rotation.z=-2.4*energy+.3*Math.sin(t*8)*energy;head.rotation.z=.14}
if(k==='build'||k==='raft'){torso.rotation.x=.25+.18*Math.sin(t*2);arms.forEach(a=>a.rotation.x=-.7*energy+.3*Math.sin(t*3)*energy);}
if(k==='dance'){arms[0].rotation.z=-2.5;arms[1].rotation.z=2.5;legs.forEach((l,i)=>l.rotation.x=Math.sin(t*7+i*Math.PI)*.4*energy);actor.position.y=heightAt(stage[0],stage[1])-.03+Math.abs(Math.sin(t*5))*.1}
if(k==='sleep'){actor.rotation.z=-1.4*smooth(seconds/6);actor.position.y=heightAt(stage[0],stage[1])+.12}
if(k==='depart'){raft.position.x=1.6+.5*Math.sin(phase*Math.PI);raft.position.y=.05+.04*Math.sin(t*2)}
if(k==='alarm'){arms[0].rotation.z=-1.8;arms[1].rotation.z=1.8;head.rotation.z=.18*Math.sin(t*4)*energy}stagedPose(k,seconds);const expression=expressionAt(k,seconds);const contact=handContact(k,seconds,[actor.position.x,actor.position.y,actor.position.z]);hands.forEach((hand,i)=>{hand.rotation.x=(i===contact.hand?-1:1)*contact.closure*.8;hand.children.forEach(child=>{if(child.userData.finger)child.rotation.x=contact.closure*.95})});eyes.forEach((eye,i)=>{eye.scale.y=Math.max(.09,1-expression.blink*.92);pupils[i].scale.y=eye.scale.y;pupils[i].position.x=(i===0?-.13:.13)+expression.gazeX*.025;pupils[i].position.y=.04+expression.gazeY*.03;brows[i].position.y=.145+expression.shock*.085-expression.focus*.025;brows[i].rotation.z=(i===0?-1:1)*(expression.shock*.36-expression.focus*.2)});head.rotation.x-=expression.shock*.18;legs[0].rotation.x+=secondary.leftLeg;legs[1].rotation.x+=secondary.rightLeg;arms[0].rotation.x+=secondary.leftArm;arms[1].rotation.x+=secondary.rightArm;torso.rotation.x+=secondary.lean;head.rotation.x+=secondary.lookUp;if(secondary.heading!==null&&k!=='run')actor.rotation.y=secondary.heading;if(beat!==previousBeat){if(!paused)foley(k,beat);previousBeat=beat}if(originalEvent&&beat!==previousOriginalBeat){const pitch=comedySound(originalEvent.id,beat);if(pitch&&!paused)cue(pitch);previousOriginalBeat=beat;}if(!originalEvent)playConsequences(k,seconds);else{carriedLog.visible=false;pole.visible=false;float.visible=false;coconut.visible=false;raft.visible=false;paintOriginalEvent(seconds);ui('desc',originalEvent.phases[beatForTime(seconds)]);}
secondaryRigMotion(t,expression.shock);applyFootIK(sampleFootContacts(k,seconds));if(!originalEvent&&contact.closure>0)applyHandIK(k,seconds,contact.position);
if(!paused&&t-lastAmbienceSent>=.1){lastAmbienceSent=t;emit({type:'ambience',time:t,dark});if(!dark&&t-bird>9){bird=t;cue(1200)}}
if(t-lastProgressSent>=.1){lastProgressSent=t;emit({type:'progress',ratio:seconds/duration})}updateCamera();renderer.render(scene,camera)}
frame();return {handle,dispose(){cancel(requestId);renderer.dispose()}};
}
