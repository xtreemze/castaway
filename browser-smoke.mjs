import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {EVENTS} from './story-catalog.mjs';
import {beatForTime} from './story-director.mjs';
import { mkdirSync } from 'node:fs';
mkdirSync('screenshots',{recursive:true});
async function verifyWebGL(page,label){
 await page.waitForFunction(()=>['worker','main'].includes(document.documentElement.dataset.castawayRenderer),null,{timeout:20000});
 const result=await page.locator('canvas').evaluate(canvas=>{
  const backend=document.documentElement.dataset.castawayRenderer;
  let gl=null,transferred=false;
  try{gl=canvas.getContext('webgl2')||canvas.getContext('webgl')}
  catch(error){transferred=error.name==='InvalidStateError'}
  return {backend,width:canvas.width,height:canvas.height,
    webgl:!!gl,contextLost:gl?.isContextLost()??false,transferred};
 });
 assert.ok(result.width>0&&result.height>0,label+' canvas has no resolution');
 if(result.backend==='worker'){
  assert.ok(result.transferred,label+' worker must own the transferred canvas');
 }else{
  assert.ok(result.webgl&&!result.contextLost,label+' main-thread WebGL unavailable or lost');
 }
 console.log(label+' renderer:',result.backend,result.width+'x'+result.height);
}
const crabScene=EVENTS.find(e=>e.id==='crab-handshake');
async function snapshotCrabBeat(page,seconds,label){
 await page.evaluate(time=>window.__castawayPreviewSeek(time),seconds);
 const expected=crabScene.phases[beatForTime(seconds)];
 await page.waitForFunction(text=>document.querySelector('#desc')?.textContent===text,expected,{timeout:10000});
 assert.match(await page.locator('#name').innerText(),/Diplomatic Relations/);
 assert.equal(await page.locator('#pause').innerText(),'Resume');
 await page.waitForTimeout(180); // permit a fully rendered animation frame
 await page.screenshot({path:'screenshots/crab-'+label+'-'+String(seconds).replace('.','_')+'.png'});
}
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
// CI serves the dist directory at / while the published bundle uses /castaway/.
// Map asset requests to the local dist root without changing production URLs.
await page.route('**/castaway/assets/**', route =>
  route.continue({url:route.request().url().replace('/castaway/assets/','/assets/')}
));
await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
await page.waitForSelector('canvas',{timeout:20000});
await page.waitForTimeout(3500);
assert.equal(await page.locator('canvas').count(),1);
await verifyWebGL(page,'desktop');
// Exercise live preference changes while the renderer is active in a worker.
await page.emulateMedia({reducedMotion:'reduce'});
await verifyWebGL(page,'desktop with reduced motion');
await page.emulateMedia({reducedMotion:'no-preference'});
assert.equal(await page.locator('#name').innerText()!=='',true);
await page.locator('#next').click();
assert.match(await page.locator('#name').innerText(),/Day/);
await page.locator('#pause').click();
await page.waitForFunction(()=>document.querySelector('#pause')?.textContent==='Resume');
await page.locator('#night').click();
await page.waitForFunction(()=>document.querySelector('#night')?.textContent==='Day');
await page.screenshot({path:'screenshots/desktop-1280x720.png',fullPage:true});
// Release the active WebGL worker before capturing the long static manual.
// The same page is navigated back to the island for later story fixtures.
await page.goto('about:blank',{waitUntil:'load'});
// The field guide must be part of the deployed static bundle, not only the source tree.
const guide=await browser.newPage({viewport:{width:1280,height:800}});
guide.on('pageerror',e=>errors.push('manual: '+e.message));
const guideResponse=await guide.goto('http://127.0.0.1:4173/manual.html',{waitUntil:'load'});
assert.equal(guideResponse?.status(),200,'manual should be included in dist/');
assert.match(await guide.locator('h1').innerText(),/Castaway\s+Island/);
assert.equal(await guide.locator('article.entry').count(),5,'all five original field notes must appear');
assert.equal(await guide.locator('.qa').count(),5,'all five FAQ answers must be present in the static manual');
assert.equal(await guide.locator('a[href="./"]').count()>0,true,'manual needs a return-to-island link');
await guide.screenshot({path:'screenshots/manual-desktop-1280x800.png',fullPage:true});
await guide.setViewportSize({width:390,height:844});
const guideWidth=await guide.evaluate(()=>({
  scroll:document.documentElement.scrollWidth,
  viewport:document.documentElement.clientWidth
}));
assert.ok(guideWidth.scroll<=guideWidth.viewport+2,'manual overflows portrait viewport: '+JSON.stringify(guideWidth));
await guide.screenshot({path:'screenshots/manual-mobile-390x844.png',fullPage:true});
await guide.emulateMedia({media:'print'});
assert.equal(await guide.locator('.mast').evaluate(e=>getComputedStyle(e).display),'none','print should hide navigation');
assert.equal(await guide.locator('.qa').first().isVisible(),true,'print must retain FAQ answers');
await guide.close();
const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
mobile.on('pageerror',e=>errors.push('mobile: '+e.message));
await mobile.route('**/castaway/assets/**',route=>route.continue({url:route.request().url().replace('/castaway/assets/','/assets/')}));
await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
await mobile.waitForSelector('canvas',{timeout:20000});
await mobile.waitForTimeout(1800);
assert.equal(await mobile.locator('canvas').count(),1);
await verifyWebGL(mobile,'mobile');
await mobile.locator('#next').click();
assert.match(await mobile.locator('#name').innerText(),/Day/);
await mobile.locator('#pause').click();
await mobile.waitForFunction(()=>document.querySelector('#pause')?.textContent==='Resume');
await mobile.locator('#night').click();
await mobile.waitForFunction(()=>document.querySelector('#night')?.textContent==='Day');
await mobile.screenshot({path:'screenshots/mobile-390x844.png',fullPage:true});
await mobile.goto('http://127.0.0.1:4173/?storyPreview=crab-handshake&storyTime=0',{waitUntil:'load'});
await mobile.waitForSelector('canvas');
for(const t of [8,20,25])await snapshotCrabBeat(mobile,t,'mobile');
await mobile.close();
await page.goto('http://127.0.0.1:4173/?storyPreview=crab-handshake&storyTime=0',{waitUntil:'load'});
await page.waitForSelector('canvas');
for(const t of [2,8,15,19.2,20,25,29])await snapshotCrabBeat(page,t,'desktop');
// A preview must never award progression even when playback reaches the boundary.
const before=await page.evaluate(()=>[
 localStorage.getItem('castaway-world-v2'),
 localStorage.getItem('castaway-story-v1'),
 localStorage.getItem('castaway-original-story-v1'),
]);
await page.evaluate(()=>window.__castawayPreviewSeek(29.99));
await page.locator('#pause').click();
await page.waitForFunction(()=>!document.querySelector('#name')?.textContent?.startsWith('Preview'),null,{timeout:10000});
const after=await page.evaluate(()=>[
 localStorage.getItem('castaway-world-v2'),
 localStorage.getItem('castaway-story-v1'),
 localStorage.getItem('castaway-original-story-v1'),
]);
assert.deepEqual(after,before,'Read-only preview must not write any story save');
// Verify the tide is rendered at deterministic high/low-water story beats.
await page.goto('http://127.0.0.1:4173/?storyPreview=pier-to-nowhere&storyTime=16',{waitUntil:'load'});
await page.waitForFunction(()=>document.querySelector('#name')?.textContent?.includes('Preview'),null,{timeout:20000});
await verifyWebGL(page,'pier at high tide');
await page.waitForTimeout(180);
await page.screenshot({path:'screenshots/pier-high-tide-desktop.png'});
await page.evaluate(()=>window.__castawayPreviewSeek(27));
await page.waitForTimeout(180);
await page.screenshot({path:'screenshots/pier-low-tide-desktop.png'});
// Sample meaningful original-prop contacts only after the render worker has painted.
for(const [id,t,label] of [
 ['portable-shade',9,'leaf-grasp'],
 ['return-to-sender',12.5,'paper-cork-handoff'],
 ['pier-to-nowhere',27,'pier-sign'],
]){
 await page.goto('http://127.0.0.1:4173/?storyPreview='+id+'&storyTime='+t,{waitUntil:'load'});
 await page.waitForFunction(()=>document.documentElement.dataset.castawayFrame==='ready',null,{timeout:20000});
 await page.screenshot({path:'screenshots/original-'+label+'-desktop.png'});
}
const propMobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
propMobile.on('pageerror',e=>errors.push('prop mobile: '+e.message));
await propMobile.route('**/castaway/assets/**',route=>route.continue({url:route.request().url().replace('/castaway/assets/','/assets/')}));
await propMobile.goto('http://127.0.0.1:4173/?storyPreview=return-to-sender&storyTime=12.5',{waitUntil:'load'});
await propMobile.waitForFunction(()=>document.documentElement.dataset.castawayFrame==='ready',null,{timeout:20000});
await propMobile.screenshot({path:'screenshots/original-paper-cork-handoff-mobile.png'});
await propMobile.close();
// Exercise the same scene runtime without worker canvas transfer.
await page.goto('http://127.0.0.1:4173/?renderThread=main',{waitUntil:'load'});
await verifyWebGL(page,'forced-main-thread fallback');
await page.emulateMedia({reducedMotion:'reduce'});
await verifyWebGL(page,'fallback with reduced motion');
await page.emulateMedia({reducedMotion:'no-preference'});
assert.equal(await page.locator('#name').innerText()!=='',true);
// A canonical snapshot must survive worker and explicit main-thread fallback reloads.
// Use isolated browser contexts so legacy migration and a saved active episode are real.
for(const mode of ['worker','main']){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const resume=await context.newPage();
 resume.on('pageerror',error=>errors.push(mode+' resume: '+error.message));
 await resume.route('**/castaway/assets/**',route=>route.continue({url:route.request().url().replace('/castaway/assets/','/assets/')}));
 const suffix=mode==='main'?'?renderThread=main':'';
 const url='http://127.0.0.1:4173/'+suffix;
 await resume.goto(url,{waitUntil:'load'});
 // Seed only v1 data; the next boot must migrate without modifying those keys.
 await resume.evaluate(()=>{
  localStorage.clear();
  localStorage.setItem('castaway-story-v1',JSON.stringify({day:7,coconuts:3,raftProgress:2,seen:{2:2}}));
  localStorage.setItem('castaway-original-story-v1',JSON.stringify({seed:321,played:['crab-handshake'],flags:['crab_met'],lastMechanism:'status-inversion',episode:1}));
 });
 await resume.reload({waitUntil:'load'});
 await resume.waitForFunction(()=>document.documentElement.dataset.castawayFrame==='ready',null,{timeout:20000});
 assert.equal(await resume.evaluate(()=>document.documentElement.dataset.castawayRenderer),mode);
 await resume.waitForFunction(()=>JSON.parse(localStorage.getItem('castaway-world-v2')||'null')?.current?.family==='legacy',null,{timeout:10000});
 const migrated=await resume.evaluate(()=>JSON.parse(localStorage.getItem('castaway-world-v2')));
 assert.equal(migrated.version,2);
 assert.equal(migrated.narrative.day,7);
 assert.equal(migrated.narrative.coconuts,3);
 assert.equal(migrated.narrative.raftProgress,2);
 assert.ok(migrated.original.flags.includes('crab_met'));
 assert.equal(migrated.current.id,'0');
 assert.equal(await resume.evaluate(()=>JSON.parse(localStorage.getItem('castaway-story-v1')).day),7,'v1 migration must be read-only');
 await resume.locator('#next').click();
 await resume.waitForFunction(()=>JSON.parse(localStorage.getItem('castaway-world-v2')||'null')?.current?.family==='original',null,{timeout:10000});
 await resume.locator('#pause').click();
 await resume.waitForFunction(()=>document.querySelector('#pause')?.textContent==='Resume',null,{timeout:10000});
 const saved=await resume.evaluate(()=>JSON.parse(localStorage.getItem('castaway-world-v2')));
 assert.equal(saved.narrative.day,7,'skipping an incomplete legacy episode cannot award a day');
 assert.ok(saved.current.id,'original episode should have a stable ID');
 await resume.reload({waitUntil:'load'});
 await resume.waitForFunction(()=>document.documentElement.dataset.castawayFrame==='ready',null,{timeout:20000});
 assert.match(await resume.locator('#name').innerText(),/Day 7/);
 const reloaded=await resume.evaluate(()=>JSON.parse(localStorage.getItem('castaway-world-v2')));
 assert.equal(reloaded.current.family,'original','original episode must resume after reload');
 assert.equal(reloaded.current.id,saved.current.id,'the same original episode must resume');
 assert.ok(reloaded.current.elapsed>=saved.current.elapsed-.5,'active elapsed time must not reset');
 if(mode==='worker'){
  // Force a real uncaught worker error after the checkpointed original scene
  // has resumed. The shell must recover on a fresh main-thread canvas without
  // reloading the document or awarding the scene twice.
  const activeWorker=resume.workers()[0];
  assert.ok(activeWorker,'the default renderer should create a Web Worker');
  await activeWorker.evaluate(()=>setTimeout(()=>{throw new Error('intentional-worker-recovery-test')},20));
  await resume.waitForFunction(()=>document.documentElement.dataset.castawayRenderer==='main',null,{timeout:20000});
  const recovered=await resume.evaluate(()=>JSON.parse(localStorage.getItem('castaway-world-v2')));
  assert.equal(recovered.current.family,'original','worker recovery must retain the original episode');
  assert.equal(recovered.current.id,saved.current.id,'worker recovery must not switch the story');
  assert.equal(recovered.narrative.day,7,'worker recovery must not award a day');
 }
 await resume.locator('#next').click();
 await resume.waitForFunction(()=>JSON.parse(localStorage.getItem('castaway-world-v2')||'null')?.current?.family==='legacy',null,{timeout:10000});
 assert.equal(await resume.evaluate(()=>JSON.parse(localStorage.getItem('castaway-world-v2')).narrative.day),7,
  'skipping an incomplete original episode cannot award a day');
 // The previous live episode may deliver one last elapsed-time checkpoint
 // during navigation. That is legitimate. Compare committed story fields across
 // the navigation, then demand byte-for-byte immutability while preview runs.
 const stable=await resume.evaluate(()=>JSON.parse(localStorage.getItem('castaway-world-v2')));
 const previewUrl='http://127.0.0.1:4173/?'+(mode==='main'?'renderThread=main&':'')+
  'storyPreview=crab-handshake&storyTime=29.9';
 await resume.goto(previewUrl,{waitUntil:'load'});
 await resume.waitForFunction(()=>document.documentElement.dataset.castawayFrame==='ready',null,{timeout:20000});
 const previewStartRaw=await resume.evaluate(()=>localStorage.getItem('castaway-world-v2'));
 const previewStart=JSON.parse(previewStartRaw);
 assert.deepEqual({
   chapter:previewStart.chapter,narrative:previewStart.narrative,original:previewStart.original,
   family:previewStart.current.family,id:previewStart.current.id,
 },{
   chapter:stable.chapter,narrative:stable.narrative,original:stable.original,
   family:stable.current.family,id:stable.current.id,
 },mode+' preview startup must not modify committed story or active identity');
 await resume.locator('#pause').click();
 await resume.waitForFunction(()=>!document.querySelector('#name')?.textContent?.startsWith('Preview'),null,{timeout:10000});
 assert.equal(await resume.evaluate(()=>localStorage.getItem('castaway-world-v2')),previewStartRaw,
  mode+' preview playback must never write progression');
 await context.close();
}
assert.deepEqual(errors,[],errors.join('\n'));
await browser.close();console.log('Browser smoke test passed');
