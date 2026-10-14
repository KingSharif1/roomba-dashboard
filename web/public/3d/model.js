import * as THREE from './three.module.js';
const V=new THREE.Vector3;
export const root=new THREE.Group();const scene={add:o=>CUR.add(o)};export const parts={};let CUR=root;export function P(k){if(!parts[k]){parts[k]=new THREE.Group();parts[k].userData.part=k;(k==='lidarhead'?parts.lidar:root).add(parts[k]);}CUR=parts[k];}
const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.6,metalness:0.05},o));
function add(geo,mat,x,y,z,ry=0,cast=true){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=cast;m.receiveShadow=true;scene.add(m);return m;}
// box by min/max (x,y,z): y is height in mm
function boxMM(x0,x1,y0,y1,z0,z1,mat){return add(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2);}
function cyl(r,y0,y1,x,z,mat,seg=64){return add(new THREE.CylinderGeometry(r,r,y1-y0,seg),mat,x,(y0+y1)/2,z);}
function tex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
function tube(pts,r,mat){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])));return add(new THREE.TubeGeometry(curve,80,r,10,false),mat,0,0,0);}
// ---------------- Roomba 694 ----------------
const dark=M(0x4a4e55,{roughness:0.4}), darker=M(0x232528,{roughness:0.5}), black=M(0x111214,{roughness:0.55});
P('roomba');
cyl(170,4,88,0,0,dark,96);
add(new THREE.TorusGeometry(166,4,16,120),dark,0,88,0).rotation.x=Math.PI/2;
cyl(166,88,92,0,0,M(0x2c2f33,{roughness:0.35}),96);
cyl(118,91.2,92.3,0,0,M(0x34373c,{roughness:0.3}),96);           // inner faceplate ring
const bump=add(new THREE.CylinderGeometry(172,172,46,96,1,true,Math.PI,Math.PI),M(0x2a2d32,{roughness:0.35,side:THREE.DoubleSide}),0,44,0);
cyl(13,92,94,-62,0,M(0x1b1d20,{roughness:0.25}),48);                // CLEAN button
cyl(4,93.6,94.2,-62,0,M(0x22c55e,{emissive:0x16a34a,emissiveIntensity:0.6}),24);
// mini-DIN port on cover (approx)
boxMM(32,48,90,93,131,145,black);
// ---------------- tape pads + clear plate ----------------
P('tape');
for(const a of [45,135,225,315]){const x=95*Math.cos(a*Math.PI/180),z=95*Math.sin(a*Math.PI/180);boxMM(x-12,x+12,92,94,z-12,z+12,M(0xb91c1c));}
const plateMat=new THREE.MeshPhysicalMaterial({color:0xe9f6ff,transparent:true,opacity:0.22,roughness:0.03,metalness:0,clearcoat:1,depthWrite:false});
P('plate');
const plate=add(new THREE.CylinderGeometry(127,127,6,128),plateMat,0,97,0,0,false);
for(const y of [94.2,99.8]){const g=new THREE.BufferGeometry().setFromPoints([...Array(129).keys()].map(i=>new THREE.Vector3(127*Math.cos(i/64*Math.PI),y,127*Math.sin(i/64*Math.PI))));scene.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0xcfeaff})));}
const H=100; // plate top
// ---------------- lidar posts + RPLIDAR C1 ----------------
const brass=M(0xc9a227,{metalness:0.7,roughness:0.3});
P('posts');
for(const x of [-21.5,21.5])for(const z of [-21.5,21.5])cyl(2.5,H,H+35,x,z,brass,20);
P('lidar');
boxMM(-27.8,27.8,H+35,H+49,-27.8,27.8,M(0x1d1f22,{roughness:0.4}));
P('lidarhead');
cyl(26,H+49,H+60,0,0,M(0x26292d,{roughness:0.35}));
cyl(25.6,H+60,H+69,0,0,M(0x0b0c0d,{roughness:0.1,metalness:0.3}));   // window band (laser at ~H+64.8)
cyl(26,H+69,H+76.3,0,0,M(0x2b2e32,{roughness:0.35}));
cyl(10,H+76.3,H+76.8,0,0,M(0x6b7280),32);
const laser=new THREE.Mesh(new THREE.RingGeometry(27,190,96),new THREE.MeshBasicMaterial({color:0xff2d2d,transparent:true,opacity:0.035,side:THREE.DoubleSide,depthWrite:false}));
laser.rotation.x=-Math.PI/2;laser.position.y=H+64.8;scene.add(laser);
const laserEdge=new THREE.Line(new THREE.BufferGeometry().setFromPoints([...Array(129).keys()].map(i=>new THREE.Vector3(190*Math.cos(i/64*Math.PI),H+64.8,190*Math.sin(i/64*Math.PI)))),new THREE.LineDashedMaterial({color:0xff2d2d,dashSize:6,gapSize:4}));laserEdge.computeLineDistances();scene.add(laserEdge);
// ---------------- Pi 4 in Vilros case (back) ----------------
P('pi');
boxMM(48,118,H,H+32,-47.5,47.5,M(0x25282d,{roughness:0.3}));
boxMM(50,116,H+31.5,H+32.3,-45.5,45.5,new THREE.MeshPhysicalMaterial({color:0x2b2f35,roughness:0.15,transparent:true,opacity:0.9}));
for(let i=0;i<6;i++)boxMM(118,118.8,H+6+i*4,H+8+i*4,-30,30,M(0x0d0e10));  // vents
boxMM(66,74,H+10,H+16,-48.6,-47.5,M(0x9ca3af,{metalness:0.6}));       // USB-C port
// speaker (ASHATA, white pillow) + mic (JOUNIVO puck)
P('speaker');
cyl(27,H+32,H+44,83,-20,M(0xf4f4f2,{roughness:0.7}));
const gr=tex(256,256,(g,w,h)=>{g.fillStyle='#f4f4f2';g.fillRect(0,0,w,h);g.fillStyle='#b8bcc2';for(let i=-6;i<=6;i++)for(let j=-6;j<=6;j++)if(i*i+j*j<=30){g.beginPath();g.arc(128+i*17,128+j*17,4,0,7);g.fill();}});
const sg=new THREE.Mesh(new THREE.CircleGeometry(26.5,64),new THREE.MeshStandardMaterial({map:gr,roughness:0.7}));sg.rotation.x=-Math.PI/2;sg.position.set(83,H+44.05,-20);scene.add(sg);
P('mic');
const mic=cyl(21,H+32,H+48,83,27,M(0x141518,{roughness:0.3}),6);
cyl(15,H+48,H+48.6,83,27,M(0x23262a,{roughness:0.6}),6);
cyl(2.2,H+48.4,H+49.2,83,15,M(0x22c55e,{emissive:0x22c55e,emissiveIntensity:1}),16);
// ---------------- camera on 2 M2.5 standoffs, just ahead of the Pi ----------------
P('camera');
for(const z of [-10.5,10.5])cyl(1.6,H,H+28,44.5,z,brass,16);
boxMM(41.5,42.6,H+4,H+29,-12.5,12.5,M(0x1e6b3a,{roughness:0.5}));
boxMM(37.5,41.5,H+12,H+20,-4,4,black);
add(new THREE.CylinderGeometry(3.4,3.4,3,24),M(0x0a0a0a,{roughness:0.1,metalness:0.5}),36,H+16,0).rotation.z=Math.PI/2;
tube([[42.6,H+28,0],[45,H+34,0],[47,H+34,0],[48.5,H+26,0]],1.1,M(0xf1f1f1));
// ---------------- Mega + proto shield + LCD + MPU (robot's left = +Z) ----------------
const pcbTex=(col,hole)=>tex(512,266,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);if(hole){g.fillStyle='rgba(230,200,120,.9)';for(let x=40;x<w-30;x+=11)for(let y=40;y<h-30;y+=11){g.beginPath();g.arc(x,y,2.6,0,7);g.fill();}}g.fillStyle='#111';g.fillRect(20,6,w-40,12);g.fillRect(20,h-18,w-40,12);});
P('mega');
boxMM(-60,42,H+8,H+9.6,32,85,new THREE.MeshStandardMaterial({map:pcbTex('#1d4ed8',false),roughness:0.5}));
boxMM(-58,40,H+9.6,H+20,33,36,black);boxMM(-58,40,H+9.6,H+20,81,84,black);
boxMM(-60,42,H+20,H+21.6,32,85,new THREE.MeshStandardMaterial({map:pcbTex('#2563eb',true),roughness:0.5}));
// LCD 16x2
P('lcd');
boxMM(-58,22,H+22,H+24,45,81,black);   // header row
boxMM(-58,22,H+30,H+31.6,45,81,M(0x1b7a3a,{roughness:0.5}));
const lcdT=tex(512,192,(g,w,h)=>{g.fillStyle='#0b0d0f';g.fillRect(0,0,w,h);g.fillStyle='#a3e635';g.fillRect(26,26,w-52,h-52);g.fillStyle='#1a2e05';g.font='bold 46px DejaVu Sans Mono';g.fillText('BAT 15.2V  OK',44,86);g.fillText('LIDAR ON  MAP',44,140);});
const lcdM=[black,black,new THREE.MeshStandardMaterial({map:lcdT,roughness:0.2,emissive:0x2a3d08,emissiveIntensity:0.3}),black,black,black];
const lcd=new THREE.Mesh(new THREE.BoxGeometry(71,7,26),lcdM);lcd.position.set(-18,H+35,63);lcd.castShadow=true;scene.add(lcd);
for(const x of [-55,19])for(const z of [47,79])cyl(1.4,H+21.6,H+30,x,z,brass,12);
// MPU6050 (GY-521)
P('mpu');
boxMM(24,40,H+23.6,H+25.2,36,57,M(0x1e40af,{roughness:0.5}));
boxMM(24,40,H+21.6,H+23.6,54,57,black);
boxMM(30,34,H+25.2,H+26.4,44,48,black);
// ---------------- power box (front-right = -Z), clear acrylic walls ----------------
P('powerbox');
const R=122, yr=x=>-Math.sqrt(R*R-x*x);
function boxShape(off){const s=new THREE.Shape();const x0=-108+off,x1=66-off,zt=-32-off;s.moveTo(x0,-zt);s.lineTo(x1,-zt);
 const a1=Math.atan2(-yr(66),66), a0=Math.atan2(-yr(-108),-108);s.lineTo(x1,-yr(x1)*((R-off)/R));s.absarc(0,0,R-off,Math.atan2(-yr(x1)*((R-off)/R),x1),Math.atan2(-yr(x0)*((R-off)/R),x0),false);s.lineTo(x0,-zt);return s;}
const outer=boxShape(0), inner=boxShape(3);outer.holes.push(new THREE.Path(inner.getPoints(64)));
const wallG=new THREE.ExtrudeGeometry(outer,{depth:34,bevelEnabled:false,curveSegments:64});
const wall=new THREE.Mesh(wallG,new THREE.MeshPhysicalMaterial({color:0xfff3c4,transparent:true,opacity:0.28,roughness:0.05,depthWrite:false,side:THREE.DoubleSide}));
wall.rotation.x=-Math.PI/2;wall.position.y=H;scene.add(wall);
const we=new THREE.LineSegments(new THREE.EdgesGeometry(wallG,30),new THREE.LineBasicMaterial({color:0xd97706}));we.rotation.x=-Math.PI/2;we.position.y=H;scene.add(we);
// XH-M609
P('xh');
boxMM(-88,-9,H+2,H+3.6,-78,-35,M(0x1d4ed8,{roughness:0.5}));
const segT=(txt,col,bg)=>tex(256,96,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=col;g.font='bold 64px DejaVu Sans Mono';g.fillText(txt,24,72);});
const xh=new THREE.Mesh(new THREE.BoxGeometry(32,8,14),[black,black,new THREE.MeshStandardMaterial({map:segT('12.8','#ff3b3b','#140000'),emissive:0x550000,emissiveIntensity:0.4}),black,black,black]);xh.position.set(-60,H+7.6,-60);xh.castShadow=true;scene.add(xh);
boxMM(-86,-74,H+3.6,H+13,-50,-38,M(0x16a34a));boxMM(-24,-12,H+3.6,H+13,-50,-38,M(0x16a34a));
cyl(2.5,H+3.6,H+9,-30,-70,M(0x2563eb),20);cyl(2.5,H+3.6,H+9,-20,-70,M(0x2563eb),20);
// DROK buck in clear case with screen
P('buck');
boxMM(-2,60,H+2,H+4,-88,-52,M(0x1e3a8a));
const buckT=tex(256,128,(g,w,h)=>{g.fillStyle='#0b1e4d';g.fillRect(0,0,w,h);g.fillStyle='#38bdf8';g.fillRect(10,10,w-20,h-20);g.fillStyle='#0b1e4d';g.font='bold 56px DejaVu Sans';g.fillText('5.15V',30,84);});
const scr=new THREE.Mesh(new THREE.BoxGeometry(30,6,18),[black,black,new THREE.MeshStandardMaterial({map:buckT,emissive:0x0c4a6e,emissiveIntensity:0.5}),black,black,black]);scr.position.set(22,H+7,-70);scene.add(scr);
boxMM(42,50,H+4,H+10,-86,-80,M(0x9ca3af));boxMM(52,58,H+4,H+10,-86,-80,M(0x9ca3af));
boxMM(-4,62,H,H+24,-90,-50,new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:0.18,roughness:0.02,depthWrite:false}));
// rocker at box edge
P('rocker');
boxMM(-45,-23,H,H+14,-108,-91,black);
const rk=boxMM(-43,-25,H+14,H+18,-106,-93,M(0x1f2125,{roughness:0.3}));rk.rotation.x=0.18;
// 3 A inline fuse
P('fuse');
boxMM(-104,-94,H,H+9,-54,-34,M(0x18181b,{roughness:0.4}));boxMM(-102,-96,H+9,H+11,-50,-38,M(0xa855f7));
// ---------------- wires ----------------
const red=M(0xdc2626,{roughness:0.4}), blk=M(0x18181b,{roughness:0.4}), grey=M(0x2a2c30,{roughness:0.5});
const dir=[-0.979,-0.203];
const W=(r,y,o=0)=>[dir[0]*r+o*0.2,y,dir[1]*r+o];
P('battwires');
tube([W(171.5,30,0),W(172.5,70,0),W(172,92.5,0),W(150,93.6,0),W(130,94.5,0),W(126,101.5,0),[-112,H+3,-30],[-99,H+5,-34]],1.6,red);
tube([W(171.5,30,4),W(172.5,70,4),W(172,92.5,4),W(150,93.6,4),W(130,94.5,4),W(126,101.5,4),[-110,H+3,-24],[-86,H+5,-37]],1.6,blk);
P('powerbox');
tube([[-99,H+6,-54],[-97,H+7,-62],[-88,H+6,-64]],1.3,red);
tube([[-40,H+6,-78],[-38,H+8,-86],[-34,H+12,-91]],1.3,red);
tube([[-23,H+10,-100],[-12,H+9,-96],[-4,H+6,-80]],1.3,red);
P('usbc');
tube([[60,H+6,-62],[66,H+10,-58],[68,H+13,-50],[70,H+13,-48]],1.8,blk);   // stripped USB-C buck -> Pi
P('dincable');
tube([[40,92.5,131],[40,96,118],[39,H+6,100],[37,H+12,88],[34,H+15,84]],2.2,grey);  // mini-DIN cable
P('wheels');
const tire=M(0x1a1a1a,{roughness:0.8}),hub=M(0x6b7280,{metalness:0.4,roughness:0.4});
export const wheels=[];
for(const z of [-117,117]){const w=new THREE.Group();w.position.set(0,32,z);
 const t=new THREE.Mesh(new THREE.CylinderGeometry(34,34,18,40),tire);t.rotation.x=Math.PI/2;w.add(t);
 for(let k=0;k<6;k++){const s=new THREE.Mesh(new THREE.BoxGeometry(6,60,19),hub);s.rotation.z=k*Math.PI/6;w.add(s);}
 CUR.add(w);wheels.push(w);}
const cast=new THREE.Mesh(new THREE.SphereGeometry(12,20,14),hub);cast.position.set(-120,12,0);CUR.add(cast);
P('roomba');