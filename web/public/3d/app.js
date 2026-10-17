// The page loads viewer.js, the minified bundle of this module.
import * as THREE from './three.module.js';
import {OrbitControls} from './OrbitControls.js';
import {LineSegments2} from './LineSegments2.js';
import {LineSegmentsGeometry} from './LineSegmentsGeometry.js';
import {LineMaterial} from './LineMaterial.js';
import {RoomEnvironment} from './RoomEnvironment.js';
import {root,parts,wheels} from './model.js?v3b';

const INFO={
  roomba:['Roomba 694','drives, docks, holds the battery'],
  wheels:['drive wheels','move Stella (Roomba motors)'],
  tape:['tape pads','hold the plate to the cover'],
  plate:['10" clear plate','deck for everything'],
  posts:['35 mm posts','lift the lidar above the stack'],
  lidar:['RPLIDAR C1','scans the room 360° for mapping'],
  lidarhead:['RPLIDAR C1','scans the room 360° for mapping'],
  pi:['Raspberry Pi 4','the brain: ROS 2, mapping, voice'],
  speaker:['ASHATA speaker','Stella\'s voice'],
  mic:['JOUNIVO mic','hears commands'],
  camera:['Pi Camera','sees ahead'],
  cp1:['CP2102 adapter #1','Roomba serial ↔ Pi USB'],
  cp2:['CP2102 adapter #2','LiDAR ↔ Pi USB'],
  powerbox:['power box','holds the power parts'],
  xh:['XH-M609','cuts power when the battery is low'],
  buck:['DROK buck','battery → 5.15 V for the Pi'],
  rocker:['rocker switch','main on/off'],
  fuse:['3 A fuse','protects against shorts'],
  battwires:['battery wires','direct tap from the battery'],
  usbc:['USB-C cable','5.15 V into the Pi'],
  dincable:['mini-DIN cable','Roomba serial ↔ adapter #1']
};
const LAYER={wheels:-70,tape:25,plate:50,posts:95,powerbox:85,xh:85,buck:85,rocker:85,fuse:85,pi:85,camera:85,cp1:85,cp2:85,lidar:150,speaker:130,mic:130,battwires:50,usbc:85,dincable:60};

const q=new URLSearchParams(location.search);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const info=document.getElementById('info');
const wash=document.getElementById('wash');

const scene=new THREE.Scene();
scene.add(root);
const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
r.setPixelRatio(Math.min(devicePixelRatio,2));
r.setClearColor(0x000000,0);
r.shadowMap.enabled=true;
r.outputColorSpace=THREE.SRGBColorSpace;
r.toneMapping=THREE.ACESFilmicToneMapping;
r.toneMappingExposure=1.0;
document.body.appendChild(r.domElement);

const cam=new THREE.PerspectiveCamera(32,1,1,5000);
cam.position.set(-560,470,-520);
const ctl=new OrbitControls(cam,r.domElement);
ctl.target.set(0,95,0);
ctl.enableDamping=true;
ctl.dampingFactor=0.08;
ctl.minDistance=280;
ctl.maxDistance=2600;
// Polar 0 looks down from the top. Keep the camera above the horizon so it
// can show the deck but cannot swing underneath the shell.
ctl.minPolarAngle=0.08;
ctl.maxPolarAngle=Math.PI/2-0.04;

const pm=new THREE.PMREMGenerator(r);
const envTex=pm.fromScene(new RoomEnvironment(),0.04).texture;
scene.environment=envTex;
scene.add(new THREE.HemisphereLight(0xfff8ee,0x8a96a8,0.9));
const sun=new THREE.DirectionalLight(0xfff4e0,2.2);
sun.position.set(-260,520,-200);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-300,right:300,top:300,bottom:-300,near:10,far:1400});
scene.add(sun);
const fill=new THREE.DirectionalLight(0xffffff,1.1);
fill.position.set(300,300,350);
scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.ShadowMaterial({opacity:.18}));
ground.rotation.x=-Math.PI/2;
ground.position.y=-75;
ground.receiveShadow=true;
scene.add(ground);
const grid=new THREE.GridHelper(1400,56,0x7ee7ff,0x1a3d6e);
grid.position.y=-75;
grid.visible=false;
scene.add(grid);

const wipeU={uMix:{value:0},uResolution:{value:new THREE.Vector2(1,1)}};
const wiped=new WeakSet();
function installWipe(mat,hex,alpha){
  if(!mat||wiped.has(mat)||mat.isShadowMaterial)return;
  wiped.add(mat);
  const uBlue={value:new THREE.Color(hex)};
  const uBlueA={value:alpha};
  mat.userData.wasTransparent=!!mat.transparent;
  mat.userData.wasDepthWrite=mat.depthWrite!==false;
  // Alpha is driven by uMix, so this program is compiled once and never rebuilt.
  if(alpha<0.95)mat.transparent=true;
  mat.onBeforeCompile=(shader)=>{
    shader.uniforms.uMix=wipeU.uMix;
    shader.uniforms.uResolution=wipeU.uResolution;
    shader.uniforms.uBlueColor=uBlue;
    shader.uniforms.uBlueOpacity=uBlueA;
    shader.fragmentShader='uniform float uMix;uniform vec2 uResolution;uniform vec3 uBlueColor;uniform float uBlueOpacity;\n'+shader.fragmentShader;
    const hook='#include <tonemapping_fragment>';
    if(shader.fragmentShader.indexOf(hook)===-1)return;
    shader.fragmentShader=shader.fragmentShader.replace(hook,hook+`
      {
        float x = gl_FragCoord.x / max(uResolution.x, 1.0);
        float threshold = uMix * 1.2 - 0.1;
        float wiped = 1.0 - smoothstep(threshold - 0.08, threshold + 0.08, x);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uBlueColor, wiped);
        gl_FragColor.a = mix(gl_FragColor.a, uBlueOpacity, wiped);
      }`);
  };
  mat.customProgramCacheKey=()=>'stellaWipe';
  mat.needsUpdate=true;
}

const meshes=[];
const edgeMat=new LineMaterial({color:0xe7fbff,linewidth:1.5,transparent:true,opacity:0.001,depthWrite:false});
edgeMat.resolution.set(innerWidth,innerHeight);
const seen=new Set();
const pending=[];
root.traverse(o=>{if(o.isMesh)pending.push(o);});
for(const o of pending){
  if(o.geometry&&o.geometry.type==='RingGeometry')o.userData.noHL=true;
  o.userData.solid=o.material;
  if(o.geometry&&o.geometry.type!=='RingGeometry'){
    const e=new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(o.geometry,25)),edgeMat);
    e.visible=false;
    e.raycast=()=>{};
    o.add(e);
    o.userData.edge=e;
  }
  meshes.push(o);
  const mats=Array.isArray(o.material)?o.material:[o.material];
  for(const mat of mats){
    if(!mat||seen.has(mat))continue;
    seen.add(mat);
    const op=mat.opacity===undefined?1:mat.opacity;
    const faint=op<0.3;
    installWipe(mat,faint?0x7ef6ff:0x14386e,faint?Math.min(0.5,Math.max(op,0.12)):0.22);
  }
}
root.traverse(o=>{
  if(!o.material||o.isMesh)return;
  const mats=Array.isArray(o.material)?o.material:[o.material];
  for(const mat of mats){
    if(!mat||seen.has(mat))continue;
    seen.add(mat);
    const op=mat.opacity===undefined?1:mat.opacity;
    installWipe(mat,0x7ef6ff,Math.max(op,0.45));
  }
});

let edgesOn=false,envOff=false;
function applyMix(v){
  wipeU.uMix.value=v;
  wash.style.transform='scaleX('+v+')';
  edgeMat.opacity=0.001+v*0.94;
  const edges=v>0.02;
  if(edges!==edgesOn){
    edgesOn=edges;
    for(const m of meshes)if(m.userData.edge)m.userData.edge.visible=edges;
  }
  const sheet=v>0.82;
  if(sheet!==envOff){
    envOff=sheet;
    grid.visible=sheet;
    ground.visible=!sheet;
  }
}
// Real materials stay on the meshes. Blueprint clones exist so their programs
// are compiled up front; the wipe itself only writes uMix.
const blueprintMats=new Map();
function blueprintOf(src){
  let bp=blueprintMats.get(src);
  if(bp)return bp;
  bp=src.clone();
  bp.transparent=true;
  bp.depthWrite=false;
  const op=src.opacity===undefined?1:src.opacity;
  bp.opacity=op<0.3?Math.min(0.5,Math.max(op,0.12)):0.22;
  if(bp.color)bp.color=new THREE.Color(op<0.3?0x7ef6ff:0x14386e);
  if(bp.emissive){bp.emissive=new THREE.Color(0x14386e);bp.emissiveIntensity=0.4;}
  installWipe(bp,op<0.3?0x7ef6ff:0x14386e,bp.opacity);
  blueprintMats.set(src,bp);
  return bp;
}
function prewarm(){
  scene.updateMatrixWorld(true);
  cam.updateMatrixWorld();
  applyMix(0);
  r.compile(scene,cam);
  r.render(scene,cam);
  const saved=[];
  for(const m of meshes){
    const src=m.userData.solid;
    if(!src||src.isShadowMaterial)continue;
    saved.push([m,m.material]);
    m.material=Array.isArray(src)?src.map(blueprintOf):blueprintOf(src);
  }
  applyMix(1);
  r.compile(scene,cam);
  r.render(scene,cam);
  for(const pair of saved)pair[0].material=pair[1];
  applyMix(0);
}

const base={};
for(const k in parts)base[k]=parts[k].position.y;
function explode(t){for(const k in parts){if(k==='lidarhead')continue;parts[k].position.y=base[k]+(LAYER[k]||0)*t;}}

const VIEWS={
  front:{pos:[0,320,-980]},
  top:{pos:[80,1280,40]},
  side:{pos:[1100,300,30]},
  iso:{pos:[-560,470,-520]}
};
let currentView='iso';
let explodeT=q.has('ex')?Math.max(0,Math.min(1,+q.get('ex')||0)):0;
let explodeGoal=explodeT;
let tween=null;
const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
function flyTo(name){
  const v=VIEWS[name];if(!v)return;
  currentView=name;
  tween={t:0,p0:cam.position.clone(),p1:new THREE.Vector3(v.pos[0],v.pos[1],v.pos[2])};
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.view===name)));
}

let modelView='real';
let lookFrom=0,lookTo=0,lookT0=0,lookBusy=false;
function setModelView(name){
  const nextName=name==='blueprint'?'blueprint':'real';
  const next=nextName==='blueprint'?1:0;
  modelView=nextName;
  document.documentElement.dataset.model=nextName;
  document.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.model===nextName)));
  if(reduce||Math.abs(wipeU.uMix.value-next)<0.001){
    lookBusy=false;
    applyMix(next);
  }else{
    lookFrom=wipeU.uMix.value;
    lookTo=next;
    lookT0=clock.elapsedTime;
    lookBusy=true;
  }
}

let robotState='dock';
function setState(s){
  robotState=s;
  document.querySelectorAll('[data-state]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.state===s)));
}

document.querySelectorAll('.grp-h').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const grp=btn.parentElement;
    const open=!grp.classList.contains('open');
    grp.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',String(open));
    btn.querySelector('i').textContent=open?'–':'+';
  });
});
document.querySelectorAll('[data-model]').forEach(b=>b.addEventListener('click',()=>setModelView(b.dataset.model)));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>flyTo(b.dataset.view)));
document.querySelectorAll('[data-state]').forEach(b=>b.addEventListener('click',()=>setState(b.dataset.state)));
const fullBtn=document.getElementById('fullBtn');
function syncFull(){
  const on=!!document.fullscreenElement;
  fullBtn.textContent=on?'Exit':'Full';
  fullBtn.setAttribute('aria-pressed',String(on));
  fullBtn.setAttribute('aria-label',on?'Exit fullscreen':'Fullscreen');
}
fullBtn.addEventListener('click',()=>{
  const el=document.documentElement;
  if(document.fullscreenElement){if(document.exitFullscreen)document.exitFullscreen();}
  else if(el.requestFullscreen)el.requestFullscreen().catch(()=>{});
  else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();
});
document.addEventListener('fullscreenchange',syncFull);
const ex=document.getElementById('ex');
function paintExplode(t){
  const n=Math.max(0,Math.min(1,+t||0));
  explodeGoal=n;
  explodeT=n;
  explode(n);
  ex.style.setProperty('--p',(n*100)+'%');
  ex.setAttribute('aria-valuenow',String(Math.round(n*100)));
}
function explodeFromX(clientX){
  const r=ex.getBoundingClientRect();
  if(!r.width)return;
  paintExplode((clientX-r.left)/r.width);
}
paintExplode(explodeT);
ex.addEventListener('pointerdown',e=>{
  if(e.button!=null&&e.button!==0)return;
  explodeFromX(e.clientX);
  try{ex.setPointerCapture(e.pointerId);}catch(err){}
});
ex.addEventListener('pointermove',e=>{
  if(!ex.hasPointerCapture(e.pointerId))return;
  explodeFromX(e.clientX);
});
ex.addEventListener('keydown',e=>{
  const step=e.shiftKey?0.1:0.02;
  if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();paintExplode(explodeT+step);}
  else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();paintExplode(explodeT-step);}
  else if(e.key==='Home'){e.preventDefault();paintExplode(0);}
  else if(e.key==='End'){e.preventDefault();paintExplode(1);}
});
const explodeBar=document.getElementById('explodeBar');
const sheet=document.getElementById('sheet');
const sheetTab=document.getElementById('sheetTab');
const mobileSheet=()=>matchMedia('(max-width:720px)').matches;
function setSheet(open){
  sheet.classList.toggle('open',open);
  sheetTab.setAttribute('aria-expanded',String(open));
  sheetTab.textContent=open?'Close':'Controls';
}
sheetTab.addEventListener('click',()=>{if(mobileSheet())setSheet(!sheet.classList.contains('open'));});
addEventListener('pointerdown',e=>{
  if(!mobileSheet()||!sheet.classList.contains('open'))return;
  if(sheet.contains(e.target)||explodeBar.contains(e.target))return;
  setSheet(false);
});
sheet.addEventListener('keydown',e=>{
  const items=[...sheet.querySelectorAll('button')].filter(b=>b.offsetParent!==null);
  const i=items.indexOf(document.activeElement);
  if(i<0)return;
  if(e.key==='ArrowDown'||e.key==='ArrowRight'){e.preventDefault();items[(i+1)%items.length].focus();}
  else if(e.key==='ArrowUp'||e.key==='ArrowLeft'){e.preventDefault();items[(i-1+items.length)%items.length].focus();}
});

const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
let hover=null,locked=null;
const box=new THREE.Box3Helper(new THREE.Box3(),0xff7a59);
box.visible=false;
scene.add(box);
const tb=new THREE.Box3();
function fit(k){
  if(!parts[k])return;
  box.box.makeEmpty();
  parts[k].updateWorldMatrix(true,true);
  parts[k].traverse(o=>{if(o.isMesh&&o.userData.solid&&!o.userData.noHL){tb.setFromObject(o);box.box.union(tb);}});
}
function partOf(o){while(o&&!o.userData.part)o=o.parent;const k=o&&o.userData.part;return k==='lidarhead'?'lidar':k;}
function hittable(obj){
  if(!obj.visible||obj.userData.noHL)return false;
  const mat=Array.isArray(obj.material)?obj.material[0]:obj.material;
  const op=mat&&mat.opacity!==undefined?mat.opacity:1;
  if(op<0.2)return false;
  if(op<0.3&&obj.geometry&&obj.geometry.type==='CylinderGeometry')return false;
  return true;
}
function pickAt(clientX,clientY,fan){
  const b=r.domElement.getBoundingClientRect();
  if(!b.width||!b.height)return null;
  const mobile=matchMedia('(max-width:720px)').matches;
  const n=fan?(mobile?2:1):0;
  const step=mobile?18:8;
  let best=null,bestD=Infinity;
  for(let iy=-n;iy<=n;iy++){
    for(let ix=-n;ix<=n;ix++){
      mouse.set(((clientX+ix*step)-b.left)/b.width*2-1,-((clientY+iy*step)-b.top)/b.height*2+1);
      ray.setFromCamera(mouse,cam);
      const hits=ray.intersectObjects(meshes,false).filter(i=>hittable(i.object));
      if(!hits.length)continue;
      const key=partOf(hits[0].object);
      const d=ix*ix+iy*iy;
      if(key&&INFO[key]&&d<bestD){best=key;bestD=d;}
    }
  }
  return best;
}
function show(k){
  box.visible=!!k&&!!parts[k];
  info.innerHTML=k&&INFO[k]?'<b>'+INFO[k][0]+'</b><span>'+INFO[k][1]+'</span>':'';
  if(k)fit(k);
}
r.domElement.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  hover=pickAt(e.clientX,e.clientY,false);
  r.domElement.style.cursor=hover?'pointer':'';
  if(!locked)show(hover);
});
let down=null;
r.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];tween=null;});
r.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>8)return;
  const k=pickAt(e.clientX,e.clientY,true);
  locked=(k&&k!==locked)?k:null;
  show(locked||k);
});

const hl=new Map();
function setHL(k){
  for(const [m,mat] of hl)m.material=mat;
  hl.clear();
  if(!k||!parts[k])return;
  parts[k].traverse(o=>{
    if(!o.isMesh||!o.userData.solid||o.userData.noHL)return;
    hl.set(o,o.userData.solid);
    const src=Array.isArray(o.userData.solid)?o.userData.solid[2]||o.userData.solid[0]:o.userData.solid;
    const c=src.clone();
    if(c.emissive){c.emissive=new THREE.Color(0xff7a59);c.emissiveIntensity=.55;}
    else if(c.color)c.color=new THREE.Color(0xff7a59);
    c.opacity=Math.max(c.opacity||1,.55);
    installWipe(c,0xff9a72,Math.max(c.opacity,.55));
    o.material=c;
  });
}
let lastHL=null;

function resize(){
  r.setSize(innerWidth,innerHeight);
  edgeMat.resolution.set(innerWidth,innerHeight);
  wipeU.uResolution.value.set(r.domElement.width,r.domElement.height);
  cam.aspect=innerWidth/Math.max(1,innerHeight);
  cam.updateProjectionMatrix();
}
addEventListener('resize',resize);
resize();

function applyTheme(t){
  const next=t||localStorage.getItem('stella-theme')||'paper';
  if(next!=='dark'&&next!=='paper')return;
  document.documentElement.dataset.theme=next;
}
applyTheme();
addEventListener('message',e=>{const t=e.data&&e.data.theme;if(t==='dark'||t==='paper')applyTheme(t);});
addEventListener('storage',e=>{if(e.key==='stella-theme')applyTheme(e.newValue);});

const clock=new THREE.Clock();
prewarm();
if(q.has('mix'))applyMix(Math.max(0,Math.min(1,+q.get('mix'))));
else if(q.has('bp'))setModelView('blueprint');
else applyMix(0);
if(q.has('sel')){locked=q.get('sel');show(locked);}
explode(explodeT);

let revealed=false;
function reveal(){
  if(revealed)return;
  revealed=true;
  const boot=document.getElementById('boot');
  if(!boot)return;
  boot.classList.add('done');
  boot.setAttribute('aria-busy','false');
}
r.setAnimationLoop(()=>{
  const dt=Math.min(0.05,clock.getDelta());
  const t=clock.elapsedTime;
  if(lookBusy){
    const k=Math.min(1,(t-lookT0)/1);
    applyMix(lookFrom+(lookTo-lookFrom)*ease(k));
    if(k>=1){applyMix(lookTo);lookBusy=false;}
  }
  explodeT+=(explodeGoal-explodeT)*(reduce?1:Math.min(1,dt*2.4));
  if(Math.abs(explodeGoal-explodeT)<0.001)explodeT=explodeGoal;
  explode(explodeT);

  if(!reduce&&parts.lidarhead&&(robotState==='running'||robotState==='cleaning'))parts.lidarhead.rotation.y+=dt*4;
  if(!reduce&&(robotState==='running'||robotState==='cleaning')){
    const spin=robotState==='cleaning'?5:4;
    for(const w of wheels)w.rotation.z-=dt*spin;
  }
  const yaw=!reduce&&robotState==='cleaning'?Math.sin(t*0.7)*0.35:0;
  root.rotation.y+=(yaw-root.rotation.y)*0.12;
  const sway=!reduce&&robotState==='stuck'?Math.sin(t*18)*6:0;
  root.position.x+=(sway-root.position.x)*0.2;
  const bob=!reduce&&robotState==='running'?Math.abs(Math.sin(t*7))*4:0;
  root.position.y+=(bob-root.position.y)*0.18;

  if(tween){
    tween.t=Math.min(1,tween.t+dt/1.05);
    cam.position.lerpVectors(tween.p0,tween.p1,ease(tween.t));
    if(tween.t>=1)tween=null;
  }
  const cur=locked||hover;
  if(cur!==lastHL){setHL(cur);lastHL=cur;}
  if(cur)fit(cur);
  ctl.update();
  r.render(scene,cam);
  reveal();
});
window.__stella3d=true;
