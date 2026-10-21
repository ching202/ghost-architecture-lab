// Optional browser suite: npm install --no-save playwright@1.62.1
// Normal mode tests a running server. FIXTURE_MODE=1 serves exact dist bytes
// through Playwright routing when a sandbox forbids loopback sockets.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const evidence=resolve(root,'docs/evidence');await mkdir(evidence,{recursive:true});
const base=process.env.BASE_URL || 'http://127.0.0.1:4173';
const fixture=process.env.FIXTURE_MODE==='1';
const results=[];
const body='A thoughtful story about architecture and careful engineering.';
for(const [engine,type,executablePath] of [['chromium',chromium,process.env.CHROMIUM_PATH],['firefox',firefox,process.env.FIREFOX_PATH]]) {
  let browser;
  const result={engine,mode:fixture?'Exact static files via Playwright route fixture; not an HTTP hosting test':'HTTP server',checks:[],errors:[],consoleErrors:[],failedResponses:[],failedRequests:[],viewports:[]};
  results.push(result);
  try {
    browser=await type.launch({headless:true,...(executablePath?{executablePath}:{}),...(engine==='firefox'?{firefoxUserPrefs:{'gfx.webrender.software':true,'layers.acceleration.disabled':true}}:{})});result.version=browser.version();
    const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
    if(fixture) await context.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.origin!==base){await route.abort();return;}
      const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
      if(name.includes('..')) {await route.fulfill({status:403,body:'Forbidden'});return;}
      try{const bytes=await readFile(resolve(root,'dist',name));const contentType={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[extname(name)] || 'application/octet-stream';await route.fulfill({status:200,contentType,body:bytes});}catch{await route.fulfill({status:404,body:'Not found'});}
    });
    const page=await context.newPage();
    page.on('pageerror',e=>result.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(m.text());});
    page.on('response',r=>{if(r.status()>=400)result.failedResponses.push({url:r.url(),status:r.status()});});
    page.on('requestfailed',r=>result.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
    const check=async(name,fn)=>{await fn();result.checks.push({name,status:'pass'});console.log(`${engine}: PASS ${name}`);};
    await page.goto(base);await page.waitForFunction(()=>document.querySelector('#component-description').textContent.length>0);
    await check('all architecture components and request paths',async()=>{
      for(const button of await page.locator('[data-node]').all()){await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');}
      await page.locator('#publish-flow').click();assert.equal(await page.locator('#flow-title').innerText(),'Publish a post');
      assert.ok((await page.locator('#trace-steps').innerText()).includes('Admin API'));
      await page.locator('#read-flow').click();await page.locator('[data-node="services"]').click();
    });
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(evidence,`${engine}-desktop.png`),fullPage:true});
    await page.locator('[data-route="publishing"]').click();
    await check('empty input focuses title and reports both errors',async()=>{
      await page.getByRole('button',{name:'Save draft'}).click();
      assert.equal(await page.locator('#story-title').getAttribute('aria-invalid'),'true');
      assert.equal(await page.locator('#story-body').getAttribute('aria-invalid'),'true');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'story-title');
    });
    await check('whitespace and short story rejected',async()=>{
      await page.locator('#story-title').fill('   ');await page.locator('#story-body').fill('Short');await page.getByRole('button',{name:'Save draft'}).click();assert.equal(await page.locator('.story-card').count(),0);
    });
    await check('input length limits',async()=>{
      await page.locator('#story-title').fill('t'.repeat(150));await page.locator('#story-body').fill('x'.repeat(1200));
      assert.equal((await page.locator('#story-title').inputValue()).length,100);assert.equal((await page.locator('#story-body').inputValue()).length,1000);
    });
    const save=async(title)=>{await page.locator('#story-title').fill(title);await page.locator('#story-body').fill(body);await page.getByRole('button',{name:'Save draft'}).click();};
    await check('outage rejects create and preserves input',async()=>{
      await page.locator('#database-down').check();await save('Architecture story');assert.equal(await page.locator('.story-card').count(),0);assert.equal(await page.locator('#story-title').inputValue(),'Architecture story');assert.match(await page.locator('#lab-message').innerText(),/unavailable/);await page.locator('#database-down').uncheck();
    });
    await check('draft stays out of public view and duplicate slug is unique',async()=>{
      await page.getByRole('button',{name:'Save draft'}).click();assert.equal(await page.locator('.story-card').count(),1);assert.equal(await page.locator('.reader-card').count(),0);
      await save('Architecture story');assert.equal(await page.locator('.story-card').count(),2);assert.match(await page.locator('.slug').first().innerText(),/architecture-story-2/);
    });
    await check('outage rejects publish; recover, publish, unpublish',async()=>{
      await page.locator('#database-down').check();await page.locator('.story-actions button').first().click();assert.equal(await page.locator('.reader-card').count(),0);await page.locator('#database-down').uncheck();await page.locator('.story-actions button').first().click();assert.equal(await page.locator('.reader-card').count(),1);await page.locator('.story-actions button').first().click();assert.equal(await page.locator('.reader-card').count(),0);await page.locator('.story-actions button').first().click();
    });
    await check('HTML-like input renders safely and persists across reload',async()=>{
      await save('<img src=x onerror=alert(1)>');assert.equal(await page.locator('.story-card img').count(),0);assert.ok((await page.locator('.story-card').first().innerText()).includes('<img src=x onerror=alert(1)>'));
      await page.reload();await page.waitForSelector('.story-card');assert.equal(await page.locator('.story-card').count(),3);assert.equal(await page.locator('.reader-card').count(),1);
    });
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(evidence,`${engine}-publishing.png`),fullPage:true});
    await check('rapid repeat saves do not create extra valid drafts',async()=>{
      await page.getByRole('button',{name:'Save draft'}).dblclick();assert.equal(await page.locator('.story-card').count(),3);
    });
    await check('QA checkbox, notes, download, and persistence',async()=>{
      await page.locator('[data-route="qa"]').click();assert.equal(await page.locator('#qa-count').innerText(),'0');await page.locator('#qa-flow').check();await page.locator('#qa-notes').fill('Browser-suite test note. This is a test fixture, not student QA evidence.');
      const download=page.waitForEvent('download');await page.locator('#export-qa').click();assert.equal((await download).suggestedFilename(),'ghost-lab-qa-notes.json');await page.reload();assert.equal(await page.locator('#qa-count').innerText(),'1');assert.match(await page.locator('#qa-notes').inputValue(),/test fixture/);await page.locator('#reset-qa').click();assert.equal(await page.locator('#qa-count').innerText(),'0');
    });
    await check('responsive routes and no horizontal overflow',async()=>{
      for(const size of [{width:1920,height:1080},{width:768,height:1024},{width:390,height:844},{width:320,height:740}]){
        await page.setViewportSize(size);
        for(const route of ['architecture','publishing','audit','qa']){
          await page.locator(`[data-route="${route}"]`).click();const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`${route} overflow at ${size.width}`);
          if(size.width===390)await page.screenshot({path:resolve(evidence,`${engine}-mobile-${route}.png`),fullPage:true});
        }
        result.viewports.push({...size,horizontalOverflow:false});
      }
    });
    await check('skip link and keyboard navigation',async()=>{
      await page.goto(base);await page.keyboard.press('Tab');assert.match(await page.evaluate(()=>document.activeElement.textContent),/Skip to main content/);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
      await page.locator('[data-route="publishing"]').focus();await page.keyboard.press('Enter');await page.locator('#publishing').waitFor({state:'visible'});assert.equal(await page.locator('#publishing').isVisible(),true);
      await page.locator('.skip-link').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#publishing').isVisible(),true);assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
      await page.locator('#database-down').focus();await page.keyboard.press('Space');assert.equal(await page.locator('#database-down').isChecked(),true);await page.keyboard.press('Space');
      await page.locator('#reset-demo').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.story-card').count(),0);
    });
    await check('corrupted saved data recovers visibly',async()=>{
      await page.evaluate(()=>localStorage.setItem('ghost-lab.posts.v1','{invalid'));await page.reload();await page.waitForSelector('#storage-warning');assert.match(await page.locator('#storage-warning').innerText(),/could not be read/);assert.equal(await page.locator('.story-card').count(),0);
    });
    await check('blocked storage allows memory-only flow with visible warning',async()=>{
      await page.addInitScript(()=>{Object.defineProperty(Storage.prototype,'getItem',{value(){throw new DOMException('Blocked','SecurityError');}});Object.defineProperty(Storage.prototype,'setItem',{value(){throw new DOMException('Blocked','SecurityError');}});});
      await page.reload();await page.waitForSelector('#storage-warning');await save('Memory-only story');assert.equal(await page.locator('.story-card').count(),1);assert.match(await page.locator('#lab-message').innerText(),/memory only/);
    });
    result.navigationTiming=await page.evaluate(()=>{const p=performance.getEntriesByType('navigation')[0];return{domContentLoadedMs:Math.round(p.domContentLoadedEventEnd-p.startTime),loadMs:Math.round(p.loadEventEnd-p.startTime),resourceCount:performance.getEntriesByType('resource').length};});
    await check('clean runtime console and local asset responses',async()=>{assert.deepEqual(result.errors,[]);assert.deepEqual(result.consoleErrors,[]);assert.deepEqual(result.failedResponses,[]);assert.deepEqual(result.failedRequests,[]);});
    result.status='passed';
  }catch(e){result.status='failed';result.failure=e.message.split('\n')[0];if(/exitCode=3221225477/.test(e.message))result.environmentNote='Firefox process exited with Windows access violation 3221225477 before page navigation.';console.error(`${engine}: ${e.stack}`);}
  finally{if(browser)await browser.close();}
}
await writeFile(resolve(evidence,'browser-results.json'),JSON.stringify({runAt:new Date().toISOString(),results},null,2));
console.log(JSON.stringify(results.map(({engine,version,status,checks,failure})=>({engine,version,status,passedChecks:checks.length,failure})),null,2));
if(results.some(r=>r.status!=='passed'))process.exitCode=1;
