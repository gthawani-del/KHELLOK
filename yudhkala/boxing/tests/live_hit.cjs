const path=require('path');const bin=process.env.PATH.split(':').find(x=>x.includes('/.npm/_npx/')&&x.endsWith('/node_modules/.bin'));const {chromium}=require(path.join(path.dirname(bin),'playwright'));
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:940,height:600}});
page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));
await page.goto('file:///home/user/yudhkala_match/YudhKala_Boxing_Play_Offline.html');
await page.waitForFunction(()=>window.__YK_READY__,null,{timeout:40000});
const r=await page.evaluate(()=>{
 const game=window.__YK__;game.start();game.stepManual(120,{forward:true});
 const early=game.state;let attempts=0;
 for(let i=0;i<13&&!game.state.finished;i++){
  game.attack('jab');game.stepManual(45,{});attempts++;
 }
 const late=game.state;return{early,late,attempts,log:game.logs.filter(x=>x.event==='hit').slice(0,12),drawCalls:game.renderer.info.render.calls};
});
console.log(JSON.stringify(r,null,2));
if(r.late.metrics.pHits<1)process.exitCode=2;
await browser.close();
})();
