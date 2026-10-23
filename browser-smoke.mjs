import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {EVENTS} from './story-catalog.mjs';
import {beatForTime} from './story-director.mjs';
import { mkdirSync } from 'node:fs';
mkdirSync('screenshots',{recursive:true});
async function verifyWebGL(page,label){
 const result=await page.locator('canvas').evaluate(canvas=>{
  const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
  return {width:canvas.width,height:canvas.height,webgl:!!gl,renderer:gl?.getParameter(gl.RENDERER)||null,contextLost:gl?.isContextLost()??true};
 });
 assert.ok(result.width>0&&result.height>0,label+' canvas has no resolution');
 assert.ok(result.webgl&&!result.contextLost,label+' WebGL unavailable or context lost');
 console.log(label+' WebGL:',result.renderer,result.width+'x'+result.height);
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
assert.equal(await page.locator('#pause').innerText(),'Resume');
await page.locator('#night').click();
assert.equal(await page.locator('#night').innerText(),'Day');
await page.screenshot({path:'screenshots/desktop-1280x720.png',fullPage:true});
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
assert.equal(await mobile.locator('#pause').innerText(),'Resume');
await mobile.locator('#night').click();
assert.equal(await mobile.locator('#night').innerText(),'Day');
await mobile.screenshot({path:'screenshots/mobile-390x844.png',fullPage:true});
for(const t of [8,20,25])await snapshotCrabBeat(mobile,t,'mobile');
await mobile.close();
for(const t of [2,8,15,19.2,20,25,29])await snapshotCrabBeat(page,t,'desktop');
assert.deepEqual(errors,[],errors.join('\n'));
await browser.close();console.log('Browser smoke test passed');
