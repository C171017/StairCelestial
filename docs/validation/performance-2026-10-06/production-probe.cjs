const { chromium, webkit } = require('/Users/c171017/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const output = '/Users/c171017/Project/c171017.com/docs/validation/performance-2026-10-06';
fs.mkdirSync(output, { recursive: true });
const [url='http://127.0.0.1:3100', label='baseline', profile='desktop', cpu='1', engine='chromium'] = process.argv.slice(2);
(async () => {
  const browser = await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
  const mobile=profile==='mobile';
  const context=await browser.newContext({viewport: mobile?{width:390,height:844}:{width:1440,height:1000},deviceScaleFactor:mobile?3:2,isMobile:mobile,hasTouch:mobile,reducedMotion:profile==='reduced'?'reduce':'no-preference'});
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>errors.push('REQUEST '+r.url()+' '+r.failure()?.errorText));page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text().slice(0,500));});
  if(engine==='chromium'&&Number(cpu)>1){const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(cpu)});}
  await page.addInitScript(()=>{
    // Production intentionally ignores reviewSeed. Fix only the one-value
    // arrangement RNG in this test context; do not alter application code.
    const random=crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues=(array)=>{if(array instanceof Uint32Array&&array.length===1){array[0]=8;return array;}return random(array);};
    window.__probe={phases:[],frames:[],sampling:false};
    let last=0,phase='';function tick(t){const p=document.querySelector('main')?.dataset.introPhase;if(p&&p!==phase){phase=p;window.__probe.phases.push({phase:p,ms:Math.round(t)});}if(window.__probe.sampling&&last)window.__probe.frames.push(t-last);last=t;requestAnimationFrame(tick);}requestAnimationFrame(tick);
  });
  await page.goto(url+'/?reviewSeed=8',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(700);await page.screenshot({path:`${output}/${label}-${profile}-eye.png`});
  let active=true;try{await page.waitForSelector('main[data-intro-phase="active"]',{timeout:45000});}catch{active=false;}
  await page.screenshot({path:`${output}/${label}-${profile}-day.png`});
  if(active){await page.waitForTimeout(2500);await page.evaluate(()=>{window.__probe.sampling=true});for(let i=0;i<18;i++){if(!mobile)await page.mouse.wheel(0,120);await page.waitForTimeout(350);}await page.waitForTimeout(6500);await page.evaluate(()=>{window.__probe.sampling=false});}
  const result=await page.evaluate(()=>{
    const probe=window.__probe,values=probe.frames.slice().sort((a,b)=>a-b);const q=p=>values[Math.min(values.length-1,Math.floor(values.length*p))]||null;
    return {phases:probe.phases,frames:values.length,meanMs:values.reduce((a,b)=>a+b,0)/values.length,p50Ms:q(.5),p95Ms:q(.95),over33Pct:100*values.filter(x=>x>33.4).length/values.length,over50Pct:100*values.filter(x=>x>50).length/values.length,canvas:[...document.querySelectorAll('canvas')].map(c=>({width:c.width,height:c.height,data:{...c.dataset}})),bodyText:document.body.innerText,resources:performance.getEntriesByType('resource').map(r=>({name:r.name.split('/').slice(-2).join('/'),transfer:r.transferSize,duration:Math.round(r.duration)})),quality:window.__sanctuaryQuality||null};
  });
  result.active=active;result.errors=errors;result.engine=engine;result.profile=profile;result.cpuThrottle=Number(cpu);result.url=url;
  fs.writeFileSync(`${output}/${label}-${profile}.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify({...result,resources:result.resources.filter(r=>r.name.includes('cloudscape')),bodyText:result.bodyText.slice(0,300)},null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
