import * as THREE from './three.module.js';
import {OrbitControls} from './OrbitControls.js';
import {LineSegments2} from './LineSegments2.js';import {LineSegmentsGeometry} from './LineSegmentsGeometry.js';import {LineMaterial} from './LineMaterial.js';import {RoomEnvironment} from './RoomEnvironment.js';
import {root,parts,wheels} from './model.js';
const INFO={roomba:['Roomba 694','drives, docks, holds the battery'],wheels:['drive wheels','move Stella (Roomba motors)'],tape:['tape pads','hold the plate to the cover'],plate:['10" clear plate','deck for everything'],
posts:['35 mm posts','lift the lidar above the stack'],lidar:['RPLIDAR C1','scans the room 360° for mapping'],lidarhead:['RPLIDAR C1','scans the room 360° for mapping'],
pi:['Raspberry Pi 4','the brain: ROS 2, mapping, voice'],speaker:['ASHATA speaker','Stella\'s voice'],mic:['JOUNIVO mic','hears commands'],camera:['Pi Camera','sees ahead'],
mega:['Arduino Mega + shield','talks to the Roomba, reads sensors'],lcd:['16x2 LCD','shows status'],mpu:['MPU6050','senses tilt and turns'],powerbox:['power box','holds the power parts'],
xh:['XH-M609','cuts power when the battery is low'],buck:['DROK buck','battery → 5.15 V for the Pi'],rocker:['rocker switch','main on/off'],fuse:['3 A fuse','protects against shorts'],
battwires:['battery wires','direct tap from the battery'],usbc:['USB-C cable','5.15 V into the Pi'],dincable:['mini-DIN cable','Roomba serial ↔ Mega']};
const LAYER={wheels:-70,tape:25,plate:50,posts:95,powerbox:85,xh:85,buck:85,rocker:85,fuse:85,pi:85,camera:85,mega:85,mpu:125,lcd:150,lidar:150,speaker:130,mic:130,battwires:50,usbc:85,dincable:60};
const scene=new THREE.Scene();scene.add(root);
const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.shadowMap.enabled=true;r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.0;document.body.appendChild(r.domElement);
const cam=new THREE.PerspectiveCamera(32,1,1,5000);cam.position.set(-560,470,-520);
const ctl=new OrbitControls(cam,r.domElement);ctl.target.set(0,95,0);ctl.enableDamping=true;ctl.minDistance=200;ctl.maxPolarAngle=Math.PI*0.62;ctl.maxDistance=2000;
const pm=new THREE.PMREMGenerator(r);const envTex=pm.fromScene(new RoomEnvironment(),0.04).texture;scene.environment=envTex;scene.environmentIntensity=0.55;scene.add(new THREE.HemisphereLight(0xfff8ee,0x8a96a8,0.9));
const sun=new THREE.DirectionalLight(0xfff4e0,2.2);sun.position.set(-260,520,-200);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-300,right:300,top:300,bottom:-300});scene.add(sun);
const f=new THREE.DirectionalLight(0xffffff,1.1);f.position.set(300,300,350);scene.add(f);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.ShadowMaterial({opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-75;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(1400,56,0x6d5cff,0x2a2f78);grid.position.y=-75;grid.visible=false;scene.add(grid);
// blueprint materials
const meshes=[];const bpFill=new THREE.MeshBasicMaterial({color:0x6a5cff,transparent:true,opacity:.17,depthWrite:false});
const edgeMat=new LineMaterial({color:0xe6e4ff,linewidth:1.5,transparent:true,opacity:.95,depthWrite:false});edgeMat.resolution.set(innerWidth,innerHeight);
const _ms=[];root.traverse(o=>{if(o.isMesh)_ms.push(o);});_ms.forEach(o=>{if(o.geometry.type==='RingGeometry')o.userData.noHL=true;{o.userData.solid=o.material;const e=new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(o.geometry,25)),edgeMat);e.visible=false;e.raycast=()=>{};o.add(e);o.userData.edge=e;meshes.push(o);}
});
let bp=false;
function setMode(v){bp=v;document.body.classList.toggle('bp',bp);r.toneMapping=bp?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;scene.environment=bp?null:envTex;grid.visible=bp;ground.visible=!bp;mode.textContent=bp?'solid':'blueprint';
 for(const m of meshes){m.material=bp?bpFill:m.userData.solid;m.userData.edge.visible=bp;}}
mode.onclick=()=>setMode(!bp);
let spinning=true;spin.onclick=()=>{spinning=!spinning;spin.textContent=spinning?'pause':'play';};
const base={};for(const k in parts)base[k]=parts[k].position.y;
function explode(t){for(const k in parts){if(k==='lidarhead')continue;parts[k].position.y=base[k]+(LAYER[k]||0)*t;}}
ex.oninput=()=>explode(+ex.value);
// picking
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let hover=null,locked=null;
const box=new THREE.Box3Helper(new THREE.Box3(),0xff7a59);box.visible=false;scene.add(box);
const tb=new THREE.Box3();function fit(k){box.box.makeEmpty();parts[k].updateWorldMatrix(true,true);parts[k].traverse(o=>{if(o.isMesh&&o.userData.solid&&!o.userData.noHL){tb.setFromObject(o);box.box.union(tb);}});}
function partOf(o){while(o&&!o.userData.part)o=o.parent;let k=o&&o.userData.part;return k==='lidarhead'?'lidar':k;}
function pick(e){const b=r.domElement.getBoundingClientRect();mouse.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(mouse,cam);
 const h=ray.intersectObjects(meshes,false).filter(i=>i.object.visible&&!(i.object.material.transparent&&i.object.material.opacity<.3&&!bp));return h.length?partOf(h[0].object):null;}
function show(k){box.visible=!!k;info.innerHTML=k?`<b>${INFO[k][0]}</b><span>${INFO[k][1]}</span>`:'';if(k){fit(k);}}
r.domElement.addEventListener('pointermove',e=>{hover=pick(e);r.domElement.style.cursor=hover?'pointer':'';if(!locked)show(hover);});
let down;r.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
r.domElement.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const k=pick(e);locked=(k&&k!==locked)?k:null;show(locked||k);});
// highlight via emissive pulse on selected part
const hl=new Map();
function setHL(k){for(const[m,mat]of hl){m.material=bp?bpFill:mat;}hl.clear();if(!k)return;parts[k].traverse(o=>{if(o.isMesh&&o.userData.solid&&!o.userData.noHL){hl.set(o,o.userData.solid);const c=(Array.isArray(o.userData.solid)?o.userData.solid[2]:o.userData.solid).clone();if(c.emissive){c.emissive=new THREE.Color(0xff7a59);c.emissiveIntensity=.55;}else c.color=new THREE.Color(0xff7a59);c.opacity=Math.max(c.opacity,.5);if(bp){c.transparent=true;c.opacity=.6;}o.material=c;}});}
let lastHL=null;
function resize(){r.setSize(innerWidth,innerHeight);edgeMat.resolution.set(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}addEventListener('resize',resize);resize();
const clock=new THREE.Clock();
r.setAnimationLoop(()=>{const dt=clock.getDelta();if(spinning){parts.lidarhead.rotation.y+=dt*6;for(const w of wheels)w.rotation.z-=dt*3;}
 const cur=locked||hover;if(cur!==lastHL){setHL(cur);lastHL=cur;}if(cur)fit(cur);
 ctl.update();r.render(scene,cam);});
const q=new URLSearchParams(location.search);if(q.has('bp'))setMode(true);if(q.has('ex'))explode(+q.get('ex')),ex.value=q.get('ex');if(q.has('sel')){locked=q.get('sel');show(locked);}
function applyTheme(){const t=localStorage.getItem('stella-theme')||'paper';document.documentElement.dataset.theme=t;setMode(t==='dark');}
if(q.has('embed')){applyTheme();addEventListener('storage',e=>{if(e.key==='stella-theme')applyTheme();});addEventListener('message',e=>{if(e.data&&e.data.theme)applyTheme();});}
