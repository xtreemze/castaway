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
 const path='http://127.0.0.1:4173/?storyPreview=crab-handshake&storyTime='+seconds;
 await page.goto(path,{waitUntil:'load'});
 await page.waitForSelector('canvas',{timeout:20000});
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
assert.equal(await page.locator('#name').innerText()!=='',true);
await page.locator('#next').click();
assert.match(await page.locator('#name').innerText(),/Day/);
await page.locator('#pause').click();
await page.waitForFunction(()=>document.querySelector('#pause')?.textContent==='Resume');
await page.locator('#night').click();
await page.waitForFunction(()=>document.querySelector('#night')?.textContent==='Day');
await page.screenshot({path:'screenshots/desktop-1280x720.png',fullPage:true});
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
for(const t of [8,20,25])await snapshotCrabBeat(mobile,t,'mobile');
await mobile.close();
for(const t of [2,8,15,19.2,20,25,29])await snapshotCrabBeat(page,t,'desktop');
assert.deepEqual(errors,[],errors.join('\n'));
await browser.close();console.log('Browser smoke test passed');
