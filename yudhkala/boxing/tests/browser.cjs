const {spawn}=require('child_process');const path=require('path');const fs=require('fs');
const bin=process.env.PATH.split(':').find(x=>x.includes('/.npm/_npx/')&&x.endsWith('/node_modules/.bin'));
const {chromium}=require(path.join(path.dirname(bin),'playwright'));
const root='/home/user/yudhkala_match';
(async()=>{
 const server=spawn('python3',['-m','http.server','8989','--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
 const findings=[];
 try {
 await new Promise(r=>setTimeout(r,850));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
 for(const mode of ['desktop','mobile']){
  const ctx=await browser.newContext(mode==='desktop'?{viewport:{width:1280,height:720},deviceScaleFactor:1}:{viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:8989/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__YK_READY__||window.__YK_FAILED__,{timeout:60000});
  const loaded=await page.evaluate(()=>({loaded:window.__YK_READY__,failed:window.__YK_FAILED__,errors:window.__YK__.errors,clips:window.__YK__.actors.map(a=>a.clips),sizes:{width:innerWidth,scroll:document.documentElement.scrollWidth}}));
  await page.screenshot({path:root+'/tests/'+mode+'_intro.png'});
  await page.click('#start-btn');
  await page.waitForTimeout(700);
  const initial=await page.evaluate(()=>window.__YK__.state);
  if(mode==='desktop'){
    await page.keyboard.down('KeyW');await page.waitForTimeout(950);await page.keyboard.up('KeyW');
    await page.keyboard.press('KeyJ');await page.waitForTimeout(780);
    await page.keyboard.press('KeyK');await page.waitForTimeout(850);
  }else{
    const btn=page.locator('[data-move="forward"]');
    await btn.dispatchEvent('pointerdown',{pointerId:12});await page.waitForTimeout(900);await btn.dispatchEvent('pointerup',{pointerId:12});
    await page.locator('[data-attack="jab"]').click();await page.waitForTimeout(750);
  }
  const after=await page.evaluate(()=>window.__YK__.state);
  await page.screenshot({path:root+'/tests/'+mode+'_match.png'});
  const tapTargets=await page.evaluate(()=>[...document.querySelectorAll('#controls button')].map(el=>({name:el.textContent.trim().split('\n')[0],w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
  findings.push({mode,loaded,initial,after,errors,targets:tapTargets, fps:await page.evaluate(()=>window.__YK__.fps)});
  await ctx.close();
 }
 await browser.close();
 }catch(e){findings.push({fatal:String(e),stack:e.stack});process.exitCode=1}
 finally{server.kill();}
 fs.writeFileSync(root+'/tests/browser_results.json',JSON.stringify(findings,null,2));
 console.log(JSON.stringify(findings,null,2).slice(0,15000));
})();

