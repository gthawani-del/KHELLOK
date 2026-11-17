export const BOUT_SECONDS=60;
export const LIMIT=2.67;
export const ACTIONS={
  jab:{damage:8,stamina:11,windup:.18,duration:.55,reach:1.68,arc:.48},
  hook:{damage:13,stamina:19,windup:.27,duration:.72,reach:1.47,arc:.60},
  uppercut:{damage:16,stamina:24,windup:.33,duration:.80,reach:1.33,arc:.56}
};
export function createMatch(seed=1024,difficulty="standard"){
 return {seed,difficulty,time:BOUT_SECONDS,running:false,finished:false,winner:null,log:[],p:newF(-1.18,0,"player"),c:newF(1.18,0,"cpu"),metrics:{pHits:0,cHits:0,pAttempts:0,cAttempts:0}};
}
const newF=(x,z,id)=>({id,x,z,hp:100,stamina:100,guard:false,action:"idle",actionTime:0,actionSeq:0,resolved:false,stun:0,dodgeTime:0,cooldown:0,blocked:0,landed:0,missed:0,steps:0,hitRecover:.36});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function rand(s){s.seed=(1664525*s.seed+1013904223)>>>0;return s.seed/4294967296}
function setAction(f,name,s){
 if(s.finished||!s.running||f.stun>0||f.hp<=0||f.action!=="idle"||f.cooldown>0)return false;
 if(name==="dodge"){
   if(f.stamina<16)return false;
   f.stamina-=16;f.action="dodge";f.actionTime=0;f.dodgeTime=.33;f.actionSeq++;f.cooldown=.10;return true;
 }
 const spec=ACTIONS[name];if(!spec||f.stamina<spec.stamina||f.guard)return false;
 f.stamina-=spec.stamina;f.action=name;f.actionTime=0;f.actionSeq++;f.resolved=false;f.cooldown=.10;
 s.metrics[f.id==="player"?"pAttempts":"cAttempts"]++;
 s.log.push({time:+(BOUT_SECONDS-s.time).toFixed(2),actor:f.id,event:name});
 return true;
}
export function playerAttack(s,name){return setAction(s.p,name,s)}
function move(f,dx,dz,dt,speed=1.86){
 if(f.stun>0||f.hp<=0||f.action==="knockdown")return;
 const penalty=f.guard?.64:([ "jab","hook","uppercut"].includes(f.action)? .35 :1);
 let len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len;}
 const oldX=f.x,oldZ=f.z;
 f.x=clamp(f.x+dx*speed*penalty*dt,-LIMIT,LIMIT);
 f.z=clamp(f.z+dz*speed*penalty*dt,-LIMIT,LIMIT);
 f.steps+=Math.hypot(f.x-oldX,f.z-oldZ);
}
function facing(a,b){return Math.atan2(b.x-a.x,b.z-a.z)}
function forwardDot(a,b){const v={x:b.x-a.x,z:b.z-a.z}; const m=Math.hypot(v.x,v.z)||1;return (v.x/m)*(b.x-a.x)/m+(v.z/m)*(b.z-a.z)/m}
function hit(s,a,b,name){
 const v=ACTIONS[name], d=dist(a,b);
 if(d>v.reach || d<.20){a.missed++;return}
 // Model auto-faces the opponent; no hit without spatial overlap and active attack frame.
 if(b.dodgeTime>.08){a.missed++;s.log.push({time:+(BOUT_SECONDS-s.time).toFixed(2),actor:b.id,event:"dodged"});return}
 let dmg=v.damage;const guard=b.guard && b.stun<=0;
 if(guard){dmg=Math.ceil(dmg*.22);b.blocked++}
 b.hp=clamp(b.hp-dmg,0,100);a.landed++;
 s.metrics[a.id==="player"?"pHits":"cHits"]++;
 if(!guard){b.stun=.17+(name==="uppercut"?.09:0);b.action="hit_reaction";b.actionTime=0;b.actionSeq++;b.resolved=true;b.hitRecover=name==="jab"?.30:name==="hook"?.48:.56;}
 s.log.push({time:+(BOUT_SECONDS-s.time).toFixed(2),actor:a.id,event:"hit",type:name,damage:dmg,blocked:guard});
 if(b.hp<=0){b.action="knockdown";b.actionTime=0;b.actionSeq++;s.finished=true;s.running=false;s.winner=a.id;}
}
function tickF(s,a,b,dt){
 a.cooldown=Math.max(0,a.cooldown-dt);
 a.stun=Math.max(0,a.stun-dt);
 a.dodgeTime=Math.max(0,a.dodgeTime-dt);
 if(a.action!=="idle"&&a.action!=="knockdown"){
   a.actionTime+=dt;
   const spec=ACTIONS[a.action];
   if(spec&&!a.resolved&&a.actionTime>=spec.windup){a.resolved=true;hit(s,a,b,a.action)}
   if(a.actionTime >= (spec?.duration||(a.action==="hit_reaction"?a.hitRecover:.52))){a.action="idle";a.actionTime=0;}
 }
 a.stamina=clamp(a.stamina+dt*(a.guard?4.5:9.5),0,100);
}
function updateAI(s,dt){
 const a=s.c,b=s.p;if(s.finished)return;
 const d=dist(a,b), ux=(b.x-a.x)/(d||1),uz=(b.z-a.z)/(d||1);
 const skill=s.difficulty==="easy"?.65:1;
 if(a.stun<=0&&a.action==="idle"){
   if(a.stamina>17 && !a.guard && d<1.6 && b.action!=="idle" && b.actionTime<.25 && rand(s)<.012*skill){a.guard=true;a.guardFor=.4}
   if(a.guard){a.guardFor-=dt;if(a.guardFor<=0)a.guard=false}
   if(!a.guard){
     if(d>1.12){move(a,ux,uz,dt,1.50*skill)}
     if(d<.91){move(a,-ux,-uz,dt,1.3)}
     move(a,uz,-ux,dt*(rand(s)>.5?1:-1),.33);
   }
   if(d<=1.65 && a.cooldown<=0 && a.stamina>28 && rand(s)<dt*(s.difficulty==="easy"?.70:1.35)){
     setAction(a,rand(s)<.66?"jab":rand(s)<.65?"hook":"uppercut",s);
     a.cooldown=.30+rand(s)*.30;
   }
 }else if(a.guard){a.guardFor-=dt;if(a.guardFor<=0)a.guard=false}
}
export function step(s,input={},dt=1/60){
 if(!s.running||s.finished)return s;
 dt=clamp(dt,0,.04);s.time=Math.max(0,s.time-dt);
 const a=s.p,b=s.c;const d=dist(a,b);const ux=(b.x-a.x)/(d||1),uz=(b.z-a.z)/(d||1);
 a.guard=!!input.block && a.action==="idle" && a.stamina>4;
 if(a.guard)a.stamina=Math.max(0,a.stamina-dt*5);
 const advance=(input.forward?1:0)-(input.back?1:0), strafe=(input.right?1:0)-(input.left?1:0);
 if(advance||strafe)move(a,ux*advance+uz*strafe,uz*advance-ux*strafe,dt);
 if(input.dodge && a.action==="idle")setAction(a,"dodge",s);
 updateAI(s,dt);
 // enforce minimum spacing: no players passing through one another
 const dd=dist(a,b);if(dd<.76){
   const x=(b.x-a.x)/(dd||1),z=(b.z-a.z)/(dd||1),p=(.76-dd)/2;
   a.x=clamp(a.x-x*p,-LIMIT,LIMIT);a.z=clamp(a.z-z*p,-LIMIT,LIMIT);
   b.x=clamp(b.x+x*p,-LIMIT,LIMIT);b.z=clamp(b.z+z*p,-LIMIT,LIMIT);
 }
 // Use two-phase resolution, allowing same-frame attacks, no CPU priority
 tickF(s,a,b,dt);if(!s.finished)tickF(s,b,a,dt);
 if(s.time<=0&&!s.finished){
   s.finished=true;s.running=false;s.winner=a.hp>b.hp?"player":a.hp<b.hp?"cpu":"draw";
 }
 return s;
}
export function snapshot(s){
 return {time:s.time,player:{hp:s.p.hp,stamina:s.p.stamina,action:s.p.action,x:s.p.x,z:s.p.z},cpu:{hp:s.c.hp,stamina:s.c.stamina,action:s.c.action,x:s.c.x,z:s.c.z},metrics:{...s.metrics},winner:s.winner,finished:s.finished};
}

