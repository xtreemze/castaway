import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
mkdirSync('screenshots',{recursive:true});
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
assert.equal(await page.locator('#name').innerText()!=='',true);
await page.locator('#next').click();
assert.match(await page.locator('#name').innerText(),/Day/);
await page.locator('#pause').click();
assert.equal(await page.locator('#pause').innerText(),'Resume');
await page.locator('#night').click();
assert.equal(await page.locator('#night').innerText(),'Day');
await page.screenshot({path:'screenshots/desktop-1280x720.png',fullPage:true});
const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
mobile.on('pageerror',e=>errors.push('mobile: '+e.message));
await mobile.route('**/castaway/assets/**',route=>route.continue({url:route.request().url().replace('/castaway/assets/','/assets/')}));
await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
await mobile.waitForSelector('canvas',{timeout:20000});
await mobile.waitForTimeout(1800);
assert.equal(await mobile.locator('canvas').count(),1);
await mobile.locator('#next').click();
assert.match(await mobile.locator('#name').innerText(),/Day/);
await mobile.locator('#pause').click();
assert.equal(await mobile.locator('#pause').innerText(),'Resume');
await mobile.locator('#night').click();
assert.equal(await mobile.locator('#night').innerText(),'Day');
await mobile.screenshot({path:'screenshots/mobile-390x844.png',fullPage:true});
await mobile.close();
assert.deepEqual(errors,[],errors.join('\n'));
await browser.close();console.log('Browser smoke test passed');
