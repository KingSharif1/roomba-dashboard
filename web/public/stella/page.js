const NS='http://www.w3.org/2000/svg';
const el=(t,a={},p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;};
const tx=(p,x,y,s,cls='',extra={})=>{const t=el('text',{x,y,class:cls,...extra},p);t.textContent=s;return t;};
/* ---------- theme ---------- */
const root=document.documentElement,btn=document.getElementById('theme');
function setTheme(t){root.dataset.theme=t;localStorage.setItem('stella-theme',t);btn.textContent=t==='dark'?'◐ paper':'◑ colored';
 const f=document.querySelector('iframe.viewer');if(f&&f.contentWindow)f.contentWindow.postMessage({theme:t},'*');}
setTheme(localStorage.getItem('stella-theme')||'paper');
btn.onclick=()=>setTheme(root.dataset.theme==='dark'?'paper':'dark');
const viewer=document.querySelector('iframe.viewer');
if(viewer&&viewer.dataset.src&&!viewer.getAttribute('src')){
  const arm=()=>{viewer.src=viewer.dataset.src;};
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{
      if(es.some(e=>e.isIntersecting)){arm();io.disconnect();}
    },{rootMargin:'240px'});
    io.observe(viewer);
  }else arm();
}
/* ---------- layout (top view, mm; front = left; robot's right = top) ---------- */
const L=[
 ['tape','Tape pads','VHB · plate → cover',g=>{for(const a of[45,135,225,315]){const x=95*Math.cos(a*Math.PI/180),z=95*Math.sin(a*Math.PI/180);el('rect',{x:x-12,y:z-12,width:24,height:24,class:'sh',fill:'#f1a7a7'},g);}}],
 ['pi','Raspberry Pi 4','Vilros case · at the back',g=>{el('rect',{x:48,y:-47.5,width:70,height:95,rx:4,class:'sh',fill:'#3b4250'},g);}],
 ['speaker','Speaker','on the Pi',g=>{el('circle',{cx:83,cy:-20,r:27,class:'sh',fill:'#f4f2ec'},g);}],
 ['mic','USB mic','on the Pi',g=>{const p=[...Array(6)].map((_,i)=>[83+21*Math.cos(i*Math.PI/3),27+21*Math.sin(i*Math.PI/3)].join(',')).join(' ');el('polygon',{points:p,class:'sh',fill:'#22252a'},g);}],
 ['camera','Pi Camera','2 standoffs · faces forward',g=>{el('rect',{x:36,y:-12.5,width:8,height:25,class:'sh',fill:'#2f8a55'},g);}],
 ['mega','Arduino Mega + shield','beside the lidar',g=>{el('rect',{x:-60,y:32,width:102,height:53,rx:2,class:'sh',fill:'#3d6fd8'},g);}],
 ['lcd','16x2 LCD','on the shield',g=>{el('rect',{x:-58,y:45,width:80,height:36,class:'sh',fill:'#b9df5a'},g);}],
 ['mpu','MPU6050','on the shield',g=>{el('rect',{x:24,y:36,width:16,height:21,class:'sh',fill:'#2547a8'},g);}],
 ['box','Power box','front-right',g=>{const R=122,z=x=>-Math.sqrt(R*R-x*x);el('path',{d:`M-108,-32 L66,-32 L66,${z(66)} A${R},${R} 0 0,0 -108,${z(-108)} Z`,class:'sh',fill:'rgba(245,190,80,.18)'},g);}],
 ['fuse','3 A fuse','first after battery +',g=>{el('rect',{x:-104,y:-54,width:10,height:20,class:'sh',fill:'#a855f7'},g);}],
 ['xh','XH-M609 cutoff','12.8 V off · 13.4 V on',g=>{el('rect',{x:-88,y:-78,width:79,height:43,class:'sh',fill:'#3e63d6'},g);}],
 ['rocker','Rocker switch','at the box edge',g=>{el('rect',{x:-45,y:-108,width:22,height:17,class:'sh',fill:'#22252a'},g);}],
 ['buck','DROK 5 A buck','5.15 V · screen up',g=>{el('rect',{x:-4,y:-90,width:66,height:40,class:'sh',fill:'#5b8ff0'},g);}],
 ['posts','35 mm posts','4 × M2.5',g=>{for(const x of[-21.5,21.5])for(const z of[-21.5,21.5])el('circle',{cx:x,cy:z,r:3.2,class:'sh',fill:'#c9a227'},g);}],
 ['lidar','RPLIDAR C1','centered · on top',g=>{el('circle',{cx:0,cy:0,r:26,class:'sh',fill:'rgba(40,44,50,.55)'},g);}],
 ['din','Mini-DIN cable','Roomba port → Mega',g=>{el('path',{d:'M40,138 C40,118 38,100 34,86',class:'sh',fill:'none','stroke-width':4},g);el('rect',{x:32,y:131,width:16,height:14,class:'sh',fill:'#22252a'},g);}],
 ['batt','Battery wires','up the cover edge',g=>{el('path',{d:'M-168,-34 C-140,-36 -120,-36 -100,-44',class:'sh',fill:'none','stroke-width':4,style:'stroke:#dc2626'},g);}],
];
function layout(host){
 const wrap=document.createElement('div');wrap.className='layout';host.appendChild(wrap);
 const svg=el('svg',{viewBox:'-205 -205 410 410',role:'img','aria-label':'Top view layout'});wrap.appendChild(svg);
 el('circle',{cx:0,cy:0,r:170,fill:'rgba(60,66,76,.18)',stroke:'var(--ink)','stroke-width':1.2},svg);
 el('path',{d:'M0,-172 A172,172 0 0,0 0,172',fill:'none',stroke:'var(--ink)','stroke-width':5,opacity:.35},svg);
 el('circle',{cx:0,cy:0,r:127,fill:'rgba(180,215,240,.20)',stroke:'var(--blue)','stroke-width':1,'stroke-dasharray':'4 3'},svg);
 el('circle',{cx:-62,cy:0,r:12,fill:'none',stroke:'var(--mute)'},svg);tx(svg,-62,24,'CLEAN','mute',{'font-size':7,'text-anchor':'middle'});
 tx(svg,-196,6,'◀ FRONT','',{'font-size':10});tx(svg,0,-188,"robot's right",'mute',{'font-size':8,'text-anchor':'middle'});tx(svg,0,196,"robot's left",'mute',{'font-size':8,'text-anchor':'middle'});
 tx(svg,0,-132,'10 in plate','mute',{'font-size':7.5,'text-anchor':'middle'});
 const leg=document.createElement('div');leg.className='legend';wrap.appendChild(leg);
 const groups={};
 L.forEach(([k,n,s,draw],i)=>{const g=el('g',{class:'lp','data-k':k},svg);draw(g);groups[k]=g;
  const d=document.createElement('div');d.dataset.k=k;d.innerHTML=`<i>${String(i+1).padStart(2,'0')}</i><div>${n}<span>${s}</span></div>`;leg.appendChild(d);});
 const set=k=>{host.classList.toggle('focus',!!k);for(const g of Object.values(groups))g.classList.toggle('on',g.dataset.k===k);for(const d of leg.children)d.classList.toggle('on',d.dataset.k===k);};
 let lock=null;
 const bind=(e,k)=>{e.addEventListener('mouseenter',()=>!lock&&set(k));e.addEventListener('mouseleave',()=>!lock&&set(null));e.addEventListener('click',()=>{lock=lock===k?null:k;set(lock);});};
 for(const k in groups)bind(groups[k],k);for(const d of leg.children)bind(d,d.dataset.k);
}
/* ---------- wiring ---------- */
const N={
 batt:[30,30,250,84,'power','Roomba battery',['14.4 V Li-ion · 16.8 V full','red + / black −']],
 fuse:[30,190,250,64,'power','3 A inline fuse',['first part after battery +']],
 xh:[30,330,250,70,'power','XH-M609 cutoff',['off 12.8 V · back on 13.4 V']],
 rocker:[30,470,250,60,'power','Rocker switch',['main on/off']],
 buck:[30,600,250,72,'power','DROK 5 A buck',['set to 5.15 V · screen visible']],
 usbc:[30,750,250,64,'power','USB-C cable',['stripped · 5.15 V, ≥3 A']],
 din:[370,30,320,176,'data','Mini-DIN data cable',['black = Roomba TXD (out)','brown = Roomba RXD (in)','yellow / orange = GND','green = BRC · unused now','!purple / red = VPWR · NOT connected']],
 mega:[370,330,320,124,'data','Arduino Mega 2560 + shield',['RX1 19 · TX1 18','SDA 20 · SCL 21 · LCD 22–27','5V · GND']],
 pi:[370,690,320,140,'data','Raspberry Pi 4 · ROS 2',['4 USB · 3.5 mm jack · CSI','!power in: USB-C only','!never 5 V into GPIO']],
 mpu:[770,330,210,84,'sense','MPU6050',['I2C · on the shield']],
 lcd:[770,440,210,232,'sense','16x2 LCD',['RS→22 · E→23','D4–D7 → 24–27','R/W, VSS → GND','VDD → 5 V','V0 ← 10 kΩ pot','A → 5 V via 220 Ω','K → GND','!header soldered to shield']],
 lidar:[770,690,210,62,'sense','RPLIDAR C1',['USB adapter']],
 cam:[770,770,210,62,'sense','Pi Camera',['stock ribbon']],
 mic:[370,900,150,62,'sense','USB mic',['JOUNIVO']],
 spk:[540,900,150,62,'sense','Speaker',['ASHATA']],
 spare:[710,900,120,62,'','USB 4',['spare']],
};
const Wr=[
 ['pw','M155,114 V190',['batt','fuse'],[[155,134,'SOLDER · battery contacts','r'],[155,178,'SOLDER · fuse lead in','r']]],
 ['pw','M155,254 V330',['fuse','xh'],[[155,268,'SOLDER · fuse lead out','r']],[[155,318,'screw terminal']]],
 ['pw','M155,400 V470',['xh','rocker'],[],[[155,414,'screw terminal'],[155,458,'spade']]],
 ['pw','M155,530 V600',['rocker','buck'],[],[[155,544,'spade'],[155,588,'screw terminal']]],
 ['pw','M155,672 V750',['buck','usbc'],[[155,712,'SOLDER · USB-C → buck','r']]],
 ['pw','M280,782 H330 V760 H370',['usbc','pi'],[],[],[292,804,'5.15 V']],
 ['gd','M30,782 H20 V72 H30',['batt','usbc'],[],[],[0,0,'']],
 ['dt','M430,206 V330',['din','mega'],[[430,318,'']],[],[436,262,'black → RX1 19']],
 ['dt','M530,206 V330',['din','mega'],[[530,318,'']],[],[536,286,'brown ← TX1 18']],
 ['gd','M670,206 V330',['din','mega'],[[670,318,'']],[],[676,262,'GND']],
 ['dt','M650,454 V690',['mega','pi'],[],[[650,676,'USB plug']],[642,560,'USB 1 · power + data','end']],
 ['dt','M690,346 H770',['mega','mpu'],[],[],[700,341,'SDA 20']],
 ['dt','M690,364 H770',['mega','mpu'],[],[],[700,359,'SCL 21']],
 ['pw','M690,382 H770',['mega','mpu'],[],[],[700,377,'5 V']],
 ['gd','M690,400 H770',['mega','mpu'],[],[],[700,395,'GND']],
 ['dt','M690,420 C730,420 730,490 770,490',['mega','lcd'],[],[],[700,436,'22–27']],
 ['pw','M690,440 C725,440 735,560 770,560',['mega','lcd'],[],[],[0,0,'']],
 ['dt','M690,712 C730,712 730,721 770,721',['pi','lidar'],[],[],[702,708,'USB 2']],
 ['dt','M690,800 H770',['pi','cam'],[],[],[702,795,'CSI']],
 ['dt','M445,830 V900',['pi','mic'],[],[],[452,872,'USB 3']],
 ['dt','M615,830 V900',['pi','spk'],[],[],[622,872,'3.5 mm jack']],
 ['sp','M670,830 V860 H770 V900',['pi','spare'],[],[],[0,0,'']],
];
function wiring(host){
 const w=document.createElement('div');w.className='scroll wiringwrap';host.appendChild(w);
 const svg=el('svg',{viewBox:'0 0 1000 1000',role:'img','aria-label':'Wiring diagram'});w.appendChild(svg);
 el('rect',{x:16,y:166,width:280,height:526,fill:'none',stroke:'var(--pw)','stroke-dasharray':'7 5',rx:8,opacity:.7},svg);
 tx(svg,290,686,'POWER BOX','warn',{'font-size':11,'text-anchor':'end'});
 tx(svg,11,430,'GND returns to battery −','mute',{'font-size':11,transform:'rotate(-90 8 430)','text-anchor':'middle'});
 const wires=[];
 for(const [c,d,ids,sol=[],terms=[],lab] of Wr){const p=el('path',{d,class:'wire '+c},svg);wires.push([p,ids]);p.dataset.ids=ids.join(' ');
  if(lab&&lab[2]){const t=tx(svg,lab[0],lab[1],lab[2],'wl',lab[3]?{'text-anchor':lab[3]}:{});t.dataset.ids=ids.join(' ');wires.push([t,ids]);}
  for(const [x,y,s,side] of sol){el('circle',{cx:x,cy:y,r:6.5,class:'solder'},svg);if(s){const t=tx(svg,side==='r'?x+12:x-12,y+4,s,'wl',{'text-anchor':side==='r'?'start':'end',style:'fill:var(--accent)'});}}
  for(const [x,y,s] of terms){el('rect',{x:x-5,y:y-5,width:10,height:10,class:'term'},svg);tx(svg,x+10,y+4,s,'wl mute',{'font-size':10.5});}}
 const nodes={};
 for(const k in N){const [x,y,ww,h,cat,title,lines]=N[k];const g=el('g',{class:'node '+cat,'data-k':k},svg);
  el('rect',{x,y,width:ww,height:h,rx:8,class:'box'},g);tx(g,x+12,y+24,title,'title');
  lines.forEach((s,i)=>{const warn=s[0]==='!';tx(g,x+12,y+46+i*19,warn?s.slice(1):s,'s '+(warn?'warn':'mute'));});nodes[k]=g;}
 // note
 const n=el('g',{},svg);el('rect',{x:750,y:30,width:236,height:176,rx:8,fill:'none',stroke:'var(--sense)','stroke-width':1.4},n);
 ['Why a direct battery tap:','the data cable\'s power','pins go through a ~200 mA','fuse inside the Roomba;','Pi + lidar need ~1 A,','so they\'d trip it.'].forEach((s,i)=>tx(n,764,56+i*22,s,i?'s':'title',{'font-size':i?12.5:13}));
 const set=k=>{host.classList.toggle('focus',!!k);for(const kk in nodes)nodes[kk].classList.toggle('on',kk===k);
  for(const [p,ids] of wires)p.classList.toggle('on',!!k&&ids.includes(k));
  if(k)for(const [p,ids] of wires)if(ids.includes(k))for(const o of ids)nodes[o]&&nodes[o].classList.add('on');};
 let lock=null;
 for(const k in nodes){const g=nodes[k];g.addEventListener('mouseenter',()=>!lock&&set(k));g.addEventListener('mouseleave',()=>!lock&&set(null));g.addEventListener('click',()=>{lock=lock===k?null:k;set(lock);});}
}
layout(document.getElementById('layout'));wiring(document.getElementById('wiring'));
/* ---------- reveal ---------- */
document.querySelectorAll('.card svg *').forEach(p=>{try{const l=Math.ceil(p.getTotalLength());p.style.setProperty('--len',l);}catch(e){}});
if(location.search.includes('static'))document.documentElement.classList.add('static');const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const items=document.querySelectorAll('.rv,.card');
if(reduce||location.search.includes('static')||!('IntersectionObserver' in window))items.forEach(e=>e.classList.add('in'));
else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const d=+(e.target.dataset.d||0);setTimeout(()=>e.target.classList.add('in'),d);io.unobserve(e.target);}}),{threshold:.12});
 document.querySelectorAll('.cards .card').forEach((c,i)=>{c.classList.add('rv');c.dataset.d=i%4*110;});items.forEach(e=>io.observe(e));document.querySelectorAll('.cards .card').forEach(e=>io.observe(e));}
/* footer signature: write-on + glitch, replays every time you scroll to the bottom */
const mark=document.querySelector('footer.big .mark');
if(mark&&'IntersectionObserver' in window){
 const mio=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){mark.classList.remove('play');void mark.offsetWidth;mark.classList.add('play');}
 }),{threshold:.4});
 mio.observe(mark);
}else if(mark){mark.classList.add('play');}
