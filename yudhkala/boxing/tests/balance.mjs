import {createMatch,step,playerAttack} from '../src/combat-core.mjs';
for(const difficulty of ['easy','standard']){
 const tally={player:0,cpu:0,draw:0};let totalPHits=0,totalCHits=0;
 for(let seed=1;seed<=200;seed++){
  const s=createMatch(seed,difficulty);s.running=true;
  for(let tick=0;tick<3600&&!s.finished;tick++){
    const d=Math.hypot(s.p.x-s.c.x,s.p.z-s.c.z);
    const approach=d>1.25;const block=(s.c.action==='hook'||s.c.action==='uppercut')&&s.c.actionTime<.22&&tick%3!==0;
    if(tick%42===0&&d<1.6)playerAttack(s,tick%126===0?'hook':'jab');
    step(s,{forward:approach,back:d<.72,block},1/60);
  }
  tally[s.winner]++;totalPHits+=s.metrics.pHits;totalCHits+=s.metrics.cHits;
 }
 console.log(difficulty,tally,'avgHits',totalPHits/200,totalCHits/200);
}
