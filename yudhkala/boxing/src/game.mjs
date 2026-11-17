import * as THREE from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createMatch,step,playerAttack,LIMIT,ACTIONS,BOUT_SECONDS,snapshot} from './combat-core.mjs';

const $=id=>document.getElementById(id);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0b0d12);
scene.fog=new THREE.FogExp2(0x0d1017,.029);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.insertBefore(renderer.domElement, document.body.firstChild);
const camera=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,50);
scene.add(new THREE.HemisphereLight(0xc9d6ee,0x342e30,2.2));
const ambient=new THREE.AmbientLight(0xffffff,.36);scene.add(ambient);
function light(color,intensity,x,y,z,cast=false){
 const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);l.castShadow=cast;
 if(cast){l.shadow.mapSize.set(1024,1024);l.shadow.camera.left=-6;l.shadow.camera.right=6;l.shadow.camera.top=6;l.shadow.camera.bottom=-6;l.shadow.camera.near=.1;l.shadow.camera.far=24;l.shadow.bias=-.001;}
 scene.add(l);return l;
}
light(0xffe0bd,3.1,-3,8,4,true);light(0xa3bedf,2.3,3,7,-4);light(0xffffff,.6,0,3,8);

const MAT=(color,roughness=.85,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const trim=MAT(0x1b1b22), gold=MAT(0xa58b60,.49,.48), burgundy=MAT(0x753c3b), blue=MAT(0x4d6586), ivory=MAT(0xe7e0cf);
const randMat=[MAT(0x262733),MAT(0x282932),MAT(0x2d3038),MAT(0x35363c),MAT(0x5a514d)];
function addMesh(geo,mat,x,y,z,shadow=true){
 const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(shadow){m.castShadow=true;m.receiveShadow=true;}scene.add(m);return m;
}
// Ring deck top is y=0, assets rigged in metres.
const base=addMesh(new THREE.BoxGeometry(7.05,.47,7.05),MAT(0x24232a,.93),0,-.30,0);
const canvas=addMesh(new THREE.BoxGeometry(6.60,.035,6.60),MAT(0x41434a,.95),0,-.025,0);
const matTexCanvas=document.createElement('canvas');matTexCanvas.width=1024;matTexCanvas.height=1024;
const mctx=matTexCanvas.getContext('2d');mctx.fillStyle='#47474d';mctx.fillRect(0,0,1024,1024);
mctx.fillStyle='#363941';for(let j=0;j<1050;j++){const x=(j*193)%1024,y=(j*1193)%1024;mctx.fillRect(x,y,3+(j%7),1+(j%5));}
mctx.lineWidth=12;mctx.strokeStyle='#7e7771';mctx.globalAlpha=.38;mctx.strokeRect(70,70,884,884);
mctx.save();mctx.translate(512,532);mctx.rotate(-Math.PI/2);mctx.globalAlpha=.14;mctx.fillStyle='#e7dbca';mctx.font='bold 110px Arial';mctx.textAlign='center';mctx.fillText('YUDHKALA',0,35);mctx.restore();
const matTexture=new THREE.CanvasTexture(matTexCanvas);matTexture.colorSpace=THREE.SRGBColorSpace;matTexture.anisotropy=4;canvas.material=new THREE.MeshStandardMaterial({map:matTexture,roughness:.96});
const apron=addMesh(new THREE.BoxGeometry(7.06,.27,7.06),MAT(0x1c2027),0,-.55,0);
const railMat=MAT(0x272931,.9,.3);
function rod(a,b,r,material){
 const d=new THREE.Vector3().subVectors(b,a);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),8),material);
 m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;scene.add(m);return m;
}
for(const sx of [-1,1])for(const sz of [-1,1]){
 const x=sx*3.21,z=sz*3.21;
 addMesh(new THREE.BoxGeometry(.15,1.88,.15),railMat,x,.83,z);
 const padMat=(sx===-1&&sz===1)?burgundy:(sx===1&&sz===-1)?blue:trim;
 const pad=addMesh(new THREE.BoxGeometry(.32,1.18,.32),padMat,x,1.10,z);
 pad.material=padMat;
 addMesh(new THREE.BoxGeometry(.46,.06,.46),gold,x,1.72,z,false);
}
for(let i=0;i<4;i++){
 const y=.38+i*.34, c=i===3?burgundy:i===0?blue:ivory;
 const ep=3.18;
 rod(new THREE.Vector3(-ep,y,-ep),new THREE.Vector3(ep,y,-ep),.021,c);
 const frontMat=c.clone();frontMat.transparent=true;frontMat.opacity=.25;frontMat.depthWrite=false;rod(new THREE.Vector3(-ep,y,ep),new THREE.Vector3(ep,y,ep),.021,frontMat);
 rod(new THREE.Vector3(-ep,y,-ep),new THREE.Vector3(-ep,y,ep),.021,c);
 rod(new THREE.Vector3(ep,y,-ep),new THREE.Vector3(ep,y,ep),.021,c);
}
const floor=addMesh(new THREE.PlaneGeometry(90,90),MAT(0x10131a,.98),0,-.67,0,false);
floor.rotation.x=-Math.PI/2;
// Two muted levels of audience. Deliberately secondary so fighter silhouettes remain readable.
const crowdGeo=new THREE.SphereGeometry(.12,7,5);
const crowdGroups=Array.from({length:5},()=>[]);
for(let tier=0;tier<3;tier++){
 const R=8.7+tier*2.3,h=1.2+tier*.70,count=72+tier*38;
 for(let i=0;i<count;i++){
  const theta=2*Math.PI*i/count+(tier*.026);
  const obj=new THREE.Object3D();
  obj.position.set(R*Math.cos(theta),h+.12*Math.sin(3*theta),R*Math.sin(theta));
  obj.scale.setScalar(1+tier*.1);obj.updateMatrix();
  crowdGroups[(i*13+tier*3)%5].push(obj.matrix.clone());
 }
}
crowdGroups.forEach((matrices,k)=>{
 const crowd=new THREE.InstancedMesh(crowdGeo,randMat[k],matrices.length);
 matrices.forEach((m,i)=>crowd.setMatrixAt(i,m));
 crowd.instanceMatrix.needsUpdate=true;crowd.castShadow=false;crowd.receiveShadow=false;
 scene.add(crowd);
});
for(let k=0;k<12;k++){
 let th=2*Math.PI*k/12, R=11;
 const cone=addMesh(new THREE.ConeGeometry(.30,1.0,12),MAT(0x262832,.7),R*Math.sin(th),4.4,R*Math.cos(th),false);
 cone.rotation.x=Math.PI;cone.castShadow=false;
}
const lineGlow=new THREE.PointLight(0xfed3a3,23,15,2);lineGlow.position.set(-3,6,3);scene.add(lineGlow);
const lineCool=new THREE.PointLight(0x99bedf,18,14,2);lineCool.position.set(3,6,-3);scene.add(lineCool);

function resize(){
 const w=innerWidth,h=innerHeight,aspect=w/h;
 camera.aspect=aspect;camera.fov=aspect<.72?73:aspect<1.2?60:42;
 camera.position.set(0,aspect<.72?3.45:3.9,aspect<.72?5.55:8.0);
 camera.lookAt(0,1.12,0);camera.updateProjectionMatrix();
 renderer.setPixelRatio(Math.min(devicePixelRatio,aspect<.72?1.15:1.5));
 renderer.setSize(w,h);
}
resize();window.addEventListener('resize',resize);

let match=createMatch(),actors=[],loadingDone=false,muted=false,paused=false,context=null;
const errors=[];window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
const loader=new GLTFLoader();
function recolorCpuTexture(model){
 model.traverse(node=>{
  if(!node.isMesh)return;
  node.castShadow=true;node.receiveShadow=true;
  const n=node.name.toLowerCase();
  if(n.includes('padded_mitt')||n.includes('tucked_thumb')||n.includes('cuff')){
    const mat=node.material.clone();mat.color.setHex(n.includes('cuff')?0x355072:0x24477d);node.material=mat;return;
  }
  if(n.includes('wrist_band')||n.includes('seam')){
   const mat=node.material.clone();mat.color.setHex(0xd5d4d0);node.material=mat;return;
  }
  if(node.isSkinnedMesh&&node.material.map){
   const old=node.material, im=old.map.image;
   try{
    const cc=document.createElement('canvas');cc.width=im.width;cc.height=im.height;
    const ctx=cc.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);
    const id=ctx.getImageData(0,0,cc.width,cc.height),a=id.data;
    for(let i=0;i<a.length;i+=4){
      const r=a[i],g=a[i+1],b=a[i+2];
      // Change cool magenta/maroon uniform fabric, preserve warm skin tones.
      if(r>40&&r>g*1.22&&b>g*1.02&&b>r*.37){
        const br=Math.max(0.3,Math.min(1.3,(r+g+b)/260));
        a[i]=Math.round(42*br);a[i+1]=Math.round(65*br);a[i+2]=Math.round(103*br);
      }
    }
    ctx.putImageData(id,0,0);
    const tex=new THREE.CanvasTexture(cc);tex.colorSpace=THREE.SRGBColorSpace;tex.flipY=old.map.flipY;tex.anisotropy=4;tex.needsUpdate=true;
    const m=old.clone();m.map=tex;node.material=m;
   }catch(err){errors.push('Texture recolor: '+err)}
  }
 });
}
function createActor(gltf,isCPU){
 const root=gltf.scene;scene.add(root);
 root.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});
 if(isCPU)recolorCpuTexture(root);
 const mixer=new THREE.AnimationMixer(root);
 const actions={};for(const clip of gltf.animations){actions[clip.name]=mixer.clipAction(clip);actions[clip.name].setLoop(clip.name==='idle'?THREE.LoopRepeat:THREE.LoopOnce,clip.name==='idle'?Infinity:1);actions[clip.name].clampWhenFinished=true;}
 const actor={root,mixer,actions,lastState:'',lastSeq:-1,current:null,isCPU};
 return actor;
}
function play(actor,name){
 const next=actor.actions[name]||actor.actions.idle;if(!next)return;
 if(actor.current===next)return;
 const prior=actor.current;
 next.reset();next.enabled=true;next.setEffectiveWeight(1);next.setEffectiveTimeScale(1);next.play();
 if(prior&&prior!==next)prior.crossFadeTo(next,.095,false);
 actor.current=next;
}
function syncActor(actor,f,other,dt){
 const x=f.x,z=f.z,dx=other.x-x,dz=other.z-z;
 actor.root.position.set(x,0,z);
 const target=Math.atan2(dx,dz);
 const old=actor.root.rotation.y,delta=Math.atan2(Math.sin(target-old),Math.cos(target-old));
 actor.root.rotation.y=old+delta*Math.min(1,dt*9);
 const desired=f.hp<=0?'knockdown':f.guard?'block':f.action;
 if(actor.lastState!==desired||actor.lastSeq!==f.actionSeq){
  play(actor,desired);actor.lastState=desired;actor.lastSeq=f.actionSeq;
 }
}
let initialFighterFailed=false;
function loadFighter(){
 if(window.__EMBEDDED_GLB__){
  const arr=Uint8Array.from(atob(window.__EMBEDDED_GLB__),c=>c.charCodeAt(0));
  return new Promise((resolve,reject)=>loader.parse(arr.buffer,'',resolve,reject));
 }
 return loader.loadAsync('./assets/fighter01_r2.glb');
}
Promise.all([loadFighter(),loadFighter()])
.then(([p,c])=>{
 actors=[createActor(p,false),createActor(c,true)];
 actors[0].root.position.set(-1.18,0,0);actors[1].root.position.set(1.18,0,0);
 actors[0].root.rotation.y=Math.PI/2;actors[1].root.rotation.y=-Math.PI/2;
 for(let i=0;i<actors.length;i++)play(actors[i],'idle');
 loadingDone=true;
 $('loading-message').textContent='Two rigged fighters loaded · Ready to play.';
 $('start-btn').disabled=false;
 window.__YK_READY__=true;
}).catch(err=>{initialFighterFailed=true;errors.push(String(err));$('loading-message').textContent='Unable to load the 3D asset. Use the supplied ZIP and open the standalone HTML.';$('start-btn').disabled=true;window.__YK_FAILED__=true});
$('start-btn').disabled=true;

const controls={forward:false,back:false,left:false,right:false,block:false,dodge:false};
const keyMap={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'block'};
function sound(kind='hit'){
 if(muted)return;
 try{
  context=context||new (window.AudioContext||window.webkitAudioContext)();
  const o=context.createOscillator(),g=context.createGain(),t=context.currentTime;
  o.type=kind==='bell'?'sine':'triangle';
  const f=kind==='bell'?620:kind==='block'?170:kind==='miss'?120:90;
  o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(kind==='bell'?420:55,t+.17);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(kind==='bell'?.11:.065,t+.009);
  g.gain.exponentialRampToValueAtTime(.0001,t+(kind==='bell'?.8:.19));
  o.connect(g).connect(context.destination);o.start(t);o.stop(t+(kind==='bell'?.9:.21));
 }catch(e){}
}
function attack(name){
 if(!match.running||paused)return;
 if(name==='dodge'){controls.dodge=true;return}
 const ok=playerAttack(match,name);if(ok)sound('miss');
}
function updateHUD(){
 $('php').style.width=match.p.hp+'%';$('chp').style.width=match.c.hp+'%';$('pstam').style.width=match.p.stamina+'%';$('cstam').style.width=match.c.stamina+'%';
 $('pnum').textContent=Math.ceil(match.p.hp);$('cnum').textContent=Math.ceil(match.c.hp);
 const sec=Math.ceil(Math.max(0,match.time));
 $('timer').textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
}
function showToast(t,ms=700){
 const el=$('toasts');el.textContent=t;
 clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>el.textContent='',ms);
}
function start(){
 if(!loadingDone)return;const difficult=$('difficulty').value;
 match=createMatch(1024,difficult);match.running=true;paused=false;finishedOverlayShown=false;
 $('overlay').classList.add('hidden');$('pause-btn').textContent='Pause';
 for(let i=0;i<actors.length;i++){const actor=actors[i];actor.lastState='';actor.lastSeq=-1;actor.root.rotation.y=i===0?Math.PI/2:-Math.PI/2;actor.mixer.stopAllAction();actor.current=null;}
 for(const k in controls)controls[k]=false;
 syncActor(actors[0],match.p,match.c,0);syncActor(actors[1],match.c,match.p,0);
 previousLog=0;updateHUD();sound('bell');showToast('FIGHT!',1200);
}
$('start-btn').addEventListener('click',start);
$('restart-btn').addEventListener('click',()=>{if(loadingDone)start()});
$('pause-btn').addEventListener('click',()=>{
 if(!match.running||match.finished)return;
 paused=!paused;$('pause-btn').textContent=paused?'Resume':'Pause';showToast(paused?'PAUSED':'FIGHT!',550);
});
$('sound-btn').addEventListener('click',()=>{muted=!muted;$('sound-btn').textContent=muted?'Sound off':'Sound on'});
const movementBtns=document.querySelectorAll('[data-move]');
movementBtns.forEach(btn=>{
 const name=btn.dataset.move;
 const down=e=>{e.preventDefault();controls[name]=true;btn.classList.add('down');(()=>{try{if(e.isTrusted)btn.setPointerCapture?.(e.pointerId)}catch{}})()};
 const up=e=>{e.preventDefault();controls[name]=false;btn.classList.remove('down')};
 btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);
});
document.querySelectorAll('[data-attack]').forEach(btn=>btn.addEventListener('pointerdown',e=>{
 e.preventDefault();btn.classList.add('down');attack(btn.dataset.attack);
}));
document.querySelectorAll('[data-attack]').forEach(btn=>{const up=()=>btn.classList.remove('down');btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);});
window.addEventListener('keydown',e=>{
 const target=e.target?.tagName;if(target==='INPUT'||target==='SELECT')return;
 if(keyMap[e.code]){controls[keyMap[e.code]]=true;e.preventDefault()}
 if(e.repeat)return;
 if(e.code==='KeyJ')attack('jab');if(e.code==='KeyK')attack('hook');if(e.code==='KeyL')attack('uppercut');
 if(e.code==='ShiftLeft'||e.code==='ShiftRight')attack('dodge');
 if(e.code==='KeyP')$('pause-btn').click();
});
window.addEventListener('keyup',e=>{if(keyMap[e.code]){controls[keyMap[e.code]]=false;e.preventDefault()}});
window.addEventListener('blur',()=>{for(const k in controls)controls[k]=false;if(match.running)paused=true;$('pause-btn').textContent=paused?'Resume':'Pause'});
let prev=performance.now(),accumulator=0,previousLog=0,frameCt=0,fpsAcc=0,measuredFps=0,finishedOverlayShown=false;
function endBout(){
 if(finishedOverlayShown)return;finishedOverlayShown=true;
 const who=match.winner;
 const label=who==='player'?'YOU WIN':who==='cpu'?'CPU WINS':'DRAW';
 $('modal-title').textContent=label;
 $('modal-desc').textContent='Player '+Math.ceil(match.p.hp)+' HP · CPU '+Math.ceil(match.c.hp)+' HP. Clean hits: '+match.metrics.pHits+' vs '+match.metrics.cHits+'.';
 $('start-btn').textContent='REMATCH';$('overlay').classList.remove('hidden');$('loading-message').textContent='One-round local prototype. No betting, accounts or matchmaking.';
 sound('bell');showToast(label,2000);
}
function renderFrame(now){
 requestAnimationFrame(renderFrame);
 const dt=Math.min(.055,(now-prev)/1000);prev=now;fpsAcc+=dt;frameCt++;
 if(fpsAcc>=.85){measuredFps=Math.round(frameCt/fpsAcc);frameCt=0;fpsAcc=0;$('status').textContent='V0.1 · '+measuredFps+' FPS · WebGL · local bout';}
 if(match.running&&!paused&&loadingDone){
  accumulator+=dt;let n=0;while(accumulator>=1/60&&n<4){step(match,controls,1/60);accumulator-=1/60;n++}
  controls.dodge=false;
  const newLogs=match.log.slice(previousLog);
  for(const e of newLogs){if(e.event==='hit'){sound(e.blocked?'block':'hit');if(e.damage>=14)showToast(e.actor==='player'?'CLEAN UPPERCUT':'CPU CONNECTS',600)}}
  previousLog=match.log.length;
  if(!match.running&&match.finished){setTimeout(endBout,650)}
 }
 if(loadingDone){
  syncActor(actors[0],match.p,match.c,dt);syncActor(actors[1],match.c,match.p,dt);
  if(!paused){
   actors[0].mixer.update(dt);actors[1].mixer.update(dt);
  }
 }
 if(loadingDone && innerWidth/innerHeight<.72){
  const cx=(match.p.x+match.c.x)*.5,cz=(match.p.z+match.c.z)*.5;
  const spread=Math.abs(match.p.x-match.c.x);
  const dist=5.55+Math.max(0,spread-2.6)*.88;
  camera.position.lerp(new THREE.Vector3(cx,3.5,cz+dist),Math.min(1,dt*2.2));
  camera.lookAt(cx,1.12,cz);
 }
 updateHUD();renderer.render(scene,camera);
}
requestAnimationFrame(renderFrame);
window.__YK__={
 get state(){return snapshot(match)},get loaded(){return loadingDone},get errors(){return errors},get fps(){return measuredFps},
 get actors(){return actors.map(a=>({clips:Object.keys(a.actions),model:a.root}))},
 attack,stepManual:(n=1,input={})=>{for(let i=0;i<n;i++)step(match,input,1/60);updateHUD();return snapshot(match)},
 start, get logs(){return match.log.slice()},get paused(){return paused},get renderer(){return renderer}
};

