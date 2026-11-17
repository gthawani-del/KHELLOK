import assert from 'node:assert/strict';
import {createMatch,step,playerAttack, LIMIT} from '../src/combat-core.mjs';
let checks=0;function ok(x,msg){assert.ok(x,msg);checks++}
let s=createMatch();ok(s.p.hp===100 && s.c.hp===100,'initial health');ok(s.time===60,'round duration');
s.running=true;s.p.x=-.35;s.c.x=.35;s.c.stun=20;
ok(playerAttack(s,'jab'),'jab accepted');
for(let i=0;i<37;i++)step(s,{},1/60);
ok(s.c.hp===92,'jab inflicts expected 8 when unblocked');ok(s.metrics.pHits===1,'jab hits only once');
ok(s.p.stamina<100,'stamina spent');
const t=createMatch();t.running=true;t.p.x=-.4;t.c.x=.4;t.c.guard=true;t.c.guardFor=10;t.c.stun=0;playerAttack(t,'hook');
for(let i=0;i<45;i++)step(t,{},1/60);
ok(t.c.hp>87&&t.c.hp<100,'guard reduces damage');
const away=createMatch();away.running=true;away.c.stun=10;playerAttack(away,'jab');
for(let i=0;i<37;i++)step(away,{},1/60);
ok(away.c.hp===100,'out-of-range punch cannot hit');
const slow=createMatch();slow.running=true;for(let i=0;i<60*8;i++)step(slow,{back:true,left:true},1/60);
ok(Math.abs(slow.p.x)<=LIMIT&&Math.abs(slow.p.z)<=LIMIT,'arena clamp');
ok(Math.hypot(slow.p.x-slow.c.x,slow.p.z-slow.c.z)>=.75,'fighters do not overlap');
let p=createMatch();p.running=true;p.p.x=-.38;p.c.x=.38;p.c.stun=50;
for(let k=0;k<15;k++){p.p.stamina=100;playerAttack(p,'uppercut');for(let i=0;i<50;i++)step(p,{},1/60);if(p.finished)break}
ok(p.finished&&p.winner==='player','KOs end bout');
let byTime=createMatch();byTime.running=true;byTime.c.stun=100;for(let i=0;i<60*61;i++)step(byTime,{},1/60);
ok(byTime.finished&&byTime.winner==='draw','timed draw');
for(let n=1;n<=120;n++){const sim=createMatch(n,'easy');sim.running=true;for(let i=0;i<60*65&&!sim.finished;i++)step(sim,{},1/60);ok(sim.p.hp>=0&&sim.c.hp>=0&&sim.p.stamina>=0&&sim.c.stamina>=0,'bounded health/stamina')}
console.log('PASS '+checks+' combat assertions');

