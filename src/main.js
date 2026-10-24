// The main thread owns DOM, persistence and user-activated audio.
// Rendering, animation, story direction and the scene clock normally run in a
// dedicated OffscreenCanvas worker. Older browsers use a main-thread fallback.
const $=id=>document.getElementById(id);
const saveKeys=new Set(['castaway-story-v1','castaway-original-story-v1']);
const uiKeys=new Set(['name','desc','sub','pause','night']);
const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
const storyPreview=new URLSearchParams(location.search);
const preview={id:storyPreview.get('storyPreview'),time:storyPreview.get('storyTime')};

let audioContext,master,noiseFilter,noiseGain,audioBusy=false;
function cue(freq=440){
  if(audioContext?.state!=='running')return;
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
  oscillator.frequency.setValueAtTime(freq,now);
  oscillator.frequency.exponentialRampToValueAtTime(freq*.83,now+.22);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(.13,now+.01);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.25);
  oscillator.connect(gain).connect(master);oscillator.start(now);oscillator.stop(now+.26);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
}
function ambience({time,dark}){
  if(audioContext?.state!=='running'||!noiseFilter)return;
  const now=audioContext.currentTime;
  noiseFilter.frequency.setTargetAtTime((dark?180:350)+90*Math.sin(time*.5),now,.06);
  noiseGain.gain.setTargetAtTime(.65+.2*Math.sin(time*.4),now,.06);
}
function fallbackNoise(){
  const buffer=audioContext.createBuffer(1,audioContext.sampleRate*2,audioContext.sampleRate);
  const samples=buffer.getChannelData(0);let previous=0;
  for(let i=0;i<samples.length;i++){previous=previous*.985+(Math.random()*2-1)*.015;samples[i]=previous}
  const node=audioContext.createBufferSource();node.buffer=buffer;node.loop=true;node.start();return node;
}
async function toggleSound(){
  if(audioBusy)return;
  audioBusy=true;
  try{
    if(audioContext){
      if(audioContext.state==='suspended')await audioContext.resume();
      else await audioContext.suspend();
    }else{
      audioContext=new AudioContext();
      master=audioContext.createGain();master.gain.value=.2;master.connect(audioContext.destination);
      noiseFilter=audioContext.createBiquadFilter();noiseFilter.type='lowpass';noiseFilter.frequency.value=400;
      noiseGain=audioContext.createGain();noiseGain.gain.value=.7;
      let node;
      if(audioContext.audioWorklet&&typeof AudioWorkletNode!=='undefined'){
        try{
          await audioContext.audioWorklet.addModule(new URL('./audio/ocean-noise-processor.js',import.meta.url));
          node=new AudioWorkletNode(audioContext,'castaway-ocean-noise',{outputChannelCount:[2]});
        }catch(error){console.warn('AudioWorklet not available, using buffered noise.',error)}
      }
      node ||= fallbackNoise();
      node.connect(noiseFilter).connect(noiseGain).connect(master);
      await audioContext.resume();cue();
    }
    $('sound').textContent=audioContext.state==='running'?'Sound on':'Sound off';
  }catch(error){
    console.error('Unable to start audio',error);$('sound').textContent='Enable sound';
  }finally{audioBusy=false}
}
$('sound').addEventListener('click',toggleSound);

let surface,worker,runtime,recovering=false;
let queue=[],dispatch=message=>queue.push(message);
const send=message=>dispatch(message);
function flush(next){
  const queued=queue;queue=[];dispatch=next;
  for(const message of queued)dispatch(message);
}
function size(){return {
  width:Math.max(1,innerWidth),height:Math.max(1,innerHeight),pixelRatio:Math.min(devicePixelRatio||1,2)
}}
function fromScene(message){
  switch(message.type){
    case 'ui':if(uiKeys.has(message.id))$(message.id).textContent=String(message.value);break;
    case 'progress':$('bar').style.width=(Math.max(0,Math.min(1,message.ratio))*100)+'%';break;
    case 'persist':
      if(saveKeys.has(message.key))try{localStorage.setItem(message.key,JSON.stringify(message.value))}catch{}
      break;
    case 'cue':cue(message.freq);break;
    case 'ambience':ambience(message);break;
    case 'ready':document.documentElement.dataset.castawayRenderer='worker';break;
    case 'fatal':recover(message.message);break;
  }
}
const pendingMoves=new Map();let movementFrame=0;
function flushMoves(){
  if(movementFrame)cancelAnimationFrame(movementFrame);
  movementFrame=0;
  for(const message of pendingMoves.values())send(message);
  pendingMoves.clear();
}
function createCanvas(){
  const canvas=document.createElement('canvas');
  canvas.style.width='100vw';canvas.style.height='100vh';canvas.style.touchAction='none';
  canvas.setAttribute('aria-label','Interactive Castaway Island scene');
  canvas.addEventListener('pointerdown',event=>{
    flushMoves();canvas.setPointerCapture(event.pointerId);
    send({type:'pointer',action:'down',id:event.pointerId,x:event.clientX,y:event.clientY});
  });
  canvas.addEventListener('pointermove',event=>{
    if(!canvas.hasPointerCapture(event.pointerId))return;
    pendingMoves.set(event.pointerId,{type:'pointer',action:'move',id:event.pointerId,x:event.clientX,y:event.clientY});
    if(!movementFrame)movementFrame=requestAnimationFrame(flushMoves);
  });
  const release=event=>{
    flushMoves();send({type:'pointer',action:'up',id:event.pointerId,x:event.clientX,y:event.clientY});
  };
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('wheel',event=>{
    event.preventDefault();
    const multiplier=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
    send({type:'wheel',delta:event.deltaY*multiplier});
  },{passive:false});
  if(surface)surface.replaceWith(canvas);else document.body.prepend(canvas);
  surface=canvas;return canvas;
}
createCanvas();
function sceneArgs(){
  return {canvas:surface,...size(),initialStoryState:read('castaway-original-story-v1'),
    initialNarrativeState:read('castaway-story-v1'),preview};
}
function recover(reason){
  if(recovering||runtime)return;
  recovering=true;
  console.warn('Offscreen rendering unavailable; using main-thread fallback.',reason);
  worker?.terminate();worker=null;
  flushMoves();
  createCanvas(); // HTMLCanvasElement ownership cannot be reclaimed after transfer.
  dispatch=message=>queue.push(message);
  import('./scene-runtime.js').then(({startScene})=>{
    runtime=startScene({...sceneArgs(),emit:fromScene});
    document.documentElement.dataset.castawayRenderer='main';
    flush(message=>runtime.handle(message));
    send({type:'visibility',visible:!document.hidden});
  }).catch(error=>{
    console.error('Castaway renderer failed',error);
    $('desc').textContent='Unable to display the island on this browser.';
  });
}
function start(){
  if(storyPreview.get('renderThread')==='main'){
    recover('explicit main-thread diagnostic');return;
  }
  if(typeof Worker==='undefined'||typeof surface.transferControlToOffscreen!=='function'){
    recover('OffscreenCanvas unsupported');return;
  }
  try{
    const instance=new Worker(new URL('./scene-worker.js',import.meta.url),{type:'module'});
    worker=instance;
    instance.onmessage=event=>fromScene(event.data);
    instance.onerror=event=>{event.preventDefault();recover(event.message||'Worker failed')};
    const args=sceneArgs();
    args.canvas=surface.transferControlToOffscreen();
    instance.postMessage({type:'init',...args},[args.canvas]);
    flush(message=>instance.postMessage(message));
    send({type:'visibility',visible:!document.hidden});
  }catch(error){recover(error)}
}
$('next').addEventListener('click',()=>send({type:'next'}));
$('pause').addEventListener('click',()=>send({type:'pause'}));
$('reset').addEventListener('click',()=>send({type:'reset'}));
$('night').addEventListener('click',()=>send({type:'night'}));
addEventListener('keydown',event=>{
  if(event.code==='Space'&&!event.repeat){event.preventDefault();send({type:'pause'})}
  else if(event.code==='ArrowRight'&&!event.repeat)send({type:'next'});
});
addEventListener('resize',()=>send({type:'resize',...size()}));
document.addEventListener('visibilitychange',()=>send({type:'visibility',visible:!document.hidden}));
start();
// Restricted to storyboard URLs: QA controls the worker clock without changing story state.
if(preview.id)window.__castawayPreviewSeek=time=>send({type:'preview-seek',time});
