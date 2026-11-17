const {spawn}=require('child_process'),path=require('path');
const bin=process.env.PATH.split(':').find(x=>x.includes('/.npm/_npx/')&&x.endsWith('/node_modules/.bin'));
const {chromium}=require(path.join(path.dirname(bin),'playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
 const results=[];
 for(let mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:720}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>errors.push('NETWORK_REQUEST '+r.url()));
  await page.goto('file:///home/user/yudhkala_match/YudhKala_Boxing_Play_Offline.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__YK_READY__===true||window.__YK_FAILED__===true,null,{timeout:45000});
  const pre=await page.evaluate(()=>({ready:window.__YK_READY__===true,errors:window.__YK__.errors,clips:window.__YK__.actors.map(a=>a.clips.length),canvas:!!document.querySelector('canvas')}));
  await page.click('#start-btn');
  const started=await page.evaluate(()=>window.__YK__.state);
  // Deterministic input test via actual UI and the pure simulation adapter
  await page.locator('[data-attack="jab"]').click();
  const after=await page.evaluate(()=>window.__YK__.state);
  const sim=await page.evaluate(()=>window.__YK__.stepManual(120,{forward:true}));
  const final=await page.evaluate(()=>window.__YK__.state);
  const tap=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth, buttons:[...document.querySelectorAll('#controls button')].map(e=>Math.min(e.getBoundingClientRect().height,e.getBoundingClientRect().width))}));
  await page.screenshot({path:'/home/user/yudhkala_match/tests/'+(mobile?'offline_mobile':'offline_desktop')+'.png'});
  results.push({mobile,pre,started,after,sim,final,tap,errors:errors.slice(0,10)});
  await context.close();
 }
 await browser.close();
 console.log(JSON.stringify(results,null,2).slice(0,14000));
})().catch(e=>{console.error(e.stack);process.exitCode=1});

