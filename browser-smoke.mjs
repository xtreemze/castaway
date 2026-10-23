import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
mkdirSync('screenshots',{recursive:true});
mkdirSync('screenshots/episodes',{recursive:true});
async function verifyWebGL(page,label){
 const result=await page.locator('canvas').evaluate(canvas=>{
  const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
  return {width:canvas.width,height:canvas.height,webgl:!!gl,renderer:gl?.getParameter(gl.RENDERER)||null,contextLost:gl?.isContextLost()??true};
 });
 assert.ok(result.width>0&&result.height>0,label+' canvas has no resolution');
 assert.ok(result.webgl&&!result.contextLost,label+' WebGL unavailable or context lost');
 console.log(label+' WebGL:',result.renderer,result.width+'x'+result.height);
}

const fixtures=[
  ['portable-shade',8,'The Portable Shade'],
  ['portable-shade',10,'The Portable Shade'],
  ['portable-shade',23,'The Portable Shade'],
  ['crab-handshake',21,'Diplomatic Relations'],
  ['sundial',21,'The Perfect Timepiece'],
  ['return-to-sender',11,'Return to Sender'],
  ['return-to-sender',13,'Return to Sender'],
  ['return-to-sender',14,'Return to Sender'],
  ['return-to-sender',24,'Return to Sender'],
  ['pier-to-nowhere',18,'The Magnificent Pier'],
  ['pier-to-nowhere',26,'The Magnificent Pier'],
  ['fish',5,'Gone fishing'],
  ['fish',21,'Gone fishing'],
  ['run',9,'Morning exercise'],
  ['run',12,'Morning exercise'],
  ['run',21,'Morning exercise'],
];
async function captureEpisodeFixtures(page,mode){
  for(const [id,time,title] of fixtures){
    await page.goto('http://127.0.0.1:4173/?event='+encodeURIComponent(id)+'&time='+time,
      {waitUntil:'load'});
    await page.waitForSelector('canvas',{timeout:20000});
    await page.waitForTimeout(450);
    assert.match(await page.locator('#name').innerText(),new RegExp(title));
    assert.equal(await page.locator('#pause').innerText(),'Resume');
    await verifyWebGL(page,mode+' '+id+' @ '+time);
    const frame=await page.evaluate(()=>window.__castawayFrameInspection?.());
    assert.ok(frame&&frame.distance>0,mode+' '+id+' camera inspection unavailable');
    assert.ok(frame.projected.every(([x,y])=>Math.abs(x)<.92&&Math.abs(y)<.75),
      mode+' '+id+' clipped beach, canopy or quay');
    await page.screenshot({path:'screenshots/episodes/'+mode+'-'+id+'-'+time+'s.png'});
  }
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
await captureEpisodeFixtures(page,'desktop');
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
await captureEpisodeFixtures(mobile,'mobile');
await mobile.setViewportSize({width:844,height:390});
await mobile.waitForTimeout(350);
const landscapeFrame=await mobile.evaluate(()=>window.__castawayFrameInspection?.());
assert.ok(landscapeFrame&&landscapeFrame.aspect>2);
assert.ok(landscapeFrame.projected.every(([x,y])=>Math.abs(x)<.92&&Math.abs(y)<.75),
  'landscape resize clipped story geometry');
await mobile.screenshot({path:'screenshots/episodes/mobile-landscape-run-21s.png'});
await mobile.setViewportSize({width:390,height:844});
await mobile.waitForTimeout(350);
const restoredFrame=await mobile.evaluate(()=>window.__castawayFrameInspection?.());
assert.ok(restoredFrame.projected.every(([x,y])=>Math.abs(x)<.92&&Math.abs(y)<.75),
  'restored portrait resize clipped story geometry');
await mobile.close();
assert.deepEqual(errors,[],errors.join('\n'));
await browser.close();console.log('Browser smoke test passed');
