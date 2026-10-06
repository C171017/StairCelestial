const {chromium}=require('/Users/c171017/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('fs');
const out='/Users/c171017/Project/c171017.com/docs/validation/performance-2026-10-06';
const origin=process.argv[2]||'http://127.0.0.1:3101';
const chunks='/Users/c171017/Project/c171017.com/out/_next/static/chunks';
const optional=fs.readdirSync(chunks).find(f=>f.endsWith('.js')&&fs.readFileSync(chunks+'/'+f,'utf8').includes('atmospheric-'));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];
 async function run(name,work,options={}){const context=await browser.newContext({viewport:{width:900,height:750},deviceScaleFactor:1.5,...options});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));try{const details=await work(page,context);results.push({name,passed:true,details,errors});console.log(name+': PASS '+JSON.stringify(details));}catch(e){results.push({name,passed:false,error:String(e),errors});console.log(name+': FAIL '+e);}finally{await context.close();fs.writeFileSync(out+'/functional-checks.json',JSON.stringify(results,null,2));}}
 await run('loading-eye',async(page)=>{
   await page.route(/\.glb(?:\?|$)/,async route=>{await new Promise(r=>setTimeout(r,4500));await route.continue().catch(()=>{});});
   await page.goto(origin+'/?reviewSeed=8',{waitUntil:'domcontentloaded'});
   await page.waitForSelector('[data-eye-loading="true"]');await page.waitForTimeout(500);
   const paths=[];for(let i=0;i<7;i++){paths.push(await page.locator('#eye-consent-aperture path').getAttribute('d'));await page.waitForTimeout(150);}
   assert.ok(new Set(paths).size>1,'eye must move before core readiness');assert.equal(await page.locator('main').getAttribute('data-intro-phase'),'hidden');
   await page.screenshot({path:out+'/loading-eye-delayed.png'});
   await page.waitForSelector('main[data-intro-phase="active"]',{timeout:40000});
   return{distinctLoadingPaths:new Set(paths).size,entered:true};
 });
 await run('essential-failure-and-retry',async(page)=>{
   await page.route(/\.glb(?:\?|$)/,route=>route.abort());
   await page.goto(origin+'/?reviewSeed=8');await page.getByRole('button',{name:'Retry scene'}).waitFor({timeout:22000});
   const links=await page.locator('.original-intro-project-links a').allTextContents();assert.equal(links.length,4);await page.screenshot({path:out+'/loading-fallback.png'});
   await page.unroute(/\.glb(?:\?|$)/);await page.getByRole('button',{name:'Retry scene'}).click();
   await page.waitForSelector('main[data-intro-phase="active"]',{timeout:45000});return{links,retryEntered:true};
 });
 await run('optional-chunk-failure',async(page)=>{
   assert.ok(optional);await page.route('**/'+optional,route=>route.abort());await page.goto(origin+'/?reviewSeed=8');
   await page.waitForSelector('main[data-intro-phase="active"]',{timeout:45000});assert.equal(await page.getByRole('button',{name:'Retry scene'}).count(),0);assert.equal(await page.locator('canvas').count(),1);
   await page.screenshot({path:out+'/optional-failure-core-intact.png'});return{blockedChunk:optional,coreEntered:true};
 });
 await run('compressed-texture-fallback',async(page)=>{
   await page.route('**/*.ktx2',route=>route.abort());await page.goto(origin+'/?reviewSeed=8');
   await page.waitForSelector('main[data-intro-phase="active"]',{timeout:45000});
   const fallback=await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('cumulus-4096.webp')));assert.ok(fallback);return{webpFallbackRequested:true,entered:true};
 });
 await run('reduced-motion',async(page)=>{
   await page.goto(origin+'/?reviewSeed=8');await page.waitForSelector('main[data-intro-phase="active"]',{timeout:40000});
   await page.screenshot({path:out+'/reduced-motion.png'});return{entered:true,eyeDismissed:await page.locator('[data-eye-theme]').count()===0};
 },{reducedMotion:'reduce'});
 await browser.close();if(results.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
