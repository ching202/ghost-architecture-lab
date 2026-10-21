import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const errors=[];const checks=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('../preview.html',import.meta.url).href);
  await page.waitForFunction(()=>document.querySelector('#component-description').textContent.length>0,null,{timeout:5000});checks.push('architecture initialized from file URL');
  await page.locator('[data-route="publishing"]').click();await page.locator('#reset-demo').click();
  await page.locator('#story-title').fill('Offline preview works');await page.locator('#story-body').fill('A complete story testing the standalone preview without a server.');await page.getByRole('button',{name:'Save draft'}).click();
  assert.equal(await page.locator('.story-card').count(),1);assert.equal(await page.locator('.reader-card').count(),0);checks.push('draft saved and hidden');
  await page.locator('.story-actions button').click();assert.equal(await page.locator('.reader-card').count(),1);checks.push('publication visible');
  await page.reload();await page.waitForSelector('.reader-card');assert.equal(await page.locator('.reader-card').count(),1);checks.push('local file storage restored');
  await page.locator('#reset-demo').click();assert.equal(await page.locator('.story-card').count(),0);checks.push('reset cleared stories');
  await page.locator('[data-route="architecture"]').click();await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:fileURLToPath(new URL('../docs/evidence/offline-preview.png',import.meta.url)),fullPage:true});
  assert.deepEqual(errors,[]);checks.push('no uncaught JavaScript errors');
  const report={runAt:new Date().toISOString(),browser:browser.version(),mode:'Standalone preview.html opened directly by file URL',status:'passed',checks,errors};
  await writeFile(new URL('../docs/evidence/offline-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
