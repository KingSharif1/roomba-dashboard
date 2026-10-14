const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const H=document.documentElement;
const S={design:localStorage.d||'D',theme:localStorage.t||null,view:(location.hash.slice(1)||'home'),conn:'live',lat:14,mode:'Normal',cleaning:true,room:'Living room',speed:0.34,
 mapView:'3d',bot:{x:258,y:228},drawing:false,zones:[{x:330,y:40,w:150,h:56,n:'TV CABLES'},{x:380,y:470,w:110,h:110,n:'BATH MAT'}],cov:68,batt:82,sel:0,
 notes:null,set:{auto:true,chain:true,fun:true,toasts:true,boxes:true,low:false,motion:false,fast:false},rec:false,url:'https://stella.tail297c20.ts.net'};
if(!S.theme)S.theme=S.design==='F'?'dark':'light';
const ROOMS=[['Living room',0,0,520,360,'12.6 m²'],['Bedroom',520,0,380,260,'9.1 m²'],['Kitchen',520,260,380,360,'5.8 m²'],['Hall · Bath',0,360,520,260,'4.0 m²']];
const CENT={'Living room':[258,228],'Bedroom':[720,130],'Kitchen':[720,440],'Hall · Bath':[200,490],'Dock':[70,560]};
const ROUTES=[{n:'Evening',d:'Hall → Living → Kitchen',p:[[70,560],[70,420],[260,420],[260,230],[640,230],[640,420],[820,420]]},{n:'Quick',d:'Living room only',p:[[258,228],[120,120],[420,120],[420,320],[120,320],[258,228]]}];
const SESS=[['Today 13:05','Normal','Living room','12:40','21.4 m²','68%','Running'],['Today 09:12','Eco','Bedroom','18:02','11.8 m²','97%','Done'],['Yesterday 18:40','Turbo','Whole home','41:15','31.0 m²','94%','Done'],['Mon 20:10','Normal','Hall · Bath','09:30','6.2 m²','61%','Stuck · bath mat'],['Sun 11:00','Manual','Kitchen','06:48','4.1 m²','—','Manual'],['Sat 15:22','Normal','Whole home','39:50','30.2 m²','91%','Done'],['Fri 19:02','Eco','Bedroom','17:20','11.2 m²','95%','Done']];
const NOTES=[['Obstacle learned','Chair moved 40 cm toward the window in the living room. Path updated.','Today 09:12','Applied'],['Stuck spot','Bath mat edge: wheels slipped 3 runs in a row. Add a no-go zone?','Mon 20:10','Suggested'],['Carpet edge','Bedroom rug lifts at 0.4 m/s. Slow to Eco on the rug?','Sun','Suggested'],['Battery health','A full-home run uses 71% now vs 64% last week.','This week','Watch'],['Voice','"go to the couch" wasn\'t understood twice. Add "couch" as a Living room alias?','Yesterday','Suggested'],['Hardware','New Pi 4 on wall power + fan. No under-voltage since Oct 13.','Oct 13','Info']];
S.notes=NOTES.map(n=>[...n]);
const VIEWS=[['home','Home','⌂'],['map','Map','◇'],['camera','Camera','◉'],['history','History','≡'],['learning','Learning','✦'],['settings','Settings','⚙'],['offline','Offline','⊘']];

/* ---------- toasts ---------- */
function toast(title,msg='',steps){ if(!S.set.toasts&&!steps)return; const t=document.createElement('div');t.className='toast';
 t.innerHTML=`<span class=tdot>●</span><div><b>${title}</b>${msg?' · '+msg:''}${steps?`<div class=steps>${steps.map((s,i)=>`${i+1}. ${s}`).join('<br>')}</div>`:''}</div>`;
 $('#toasts').prepend(t);[...$('#toasts').children].slice(3).forEach(x=>x.remove()); setTimeout(()=>t.remove(),steps?5200:3200);}

/* ---------- connection ---------- */
const CONN={live:'Live',demo:'Demo',offline:'Offline',reconnecting:'Reconnecting'};
function bars(){const n={live:S.lat<30?4:3,demo:4,offline:0,reconnecting:1}[S.conn];return `<span class=sig>${[5,8,11,14].map((h,i)=>`<i style="height:${h}px" class="${i<n?'on':''}"></i>`).join('')}</span>`}
function connHTML(){return `<button class="conn c-${S.conn}" id=connbtn aria-label="Connection details">${bars()}<b>${CONN[S.conn]}</b><span class="lat mono sm">${S.conn==='live'?S.lat+' ms':S.conn==='demo'?'demo robot':S.conn==='offline'?'since 13:02':'…'}</span><span class="host mono sm">${S.conn==='demo'?'':'tailnet'}</span></button>`}
function popover(){const p=$('#popover');p.hidden=false;
 p.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><span class="conn c-${S.conn}" style="border:0;padding:0">${bars()}<b>${CONN[S.conn]}</b></span><button class=iconbtn onclick="$('#popover').hidden=true">✕</button></div>
 <div style="margin-top:10px" class=mono>
 <div class=row><span class=sm>Link</span><span>${S.conn==='demo'?'Demo robot (in browser)':'Tailscale · tailnet only'}</span></div>
 <div class=row><span class=sm>Host</span><span style="font-size:12px">${S.conn==='demo'?'—':S.url.replace('https://','')}</span></div>
 <div class=row><span class=sm>Latency</span><span>${S.conn==='live'?S.lat+' ms':'—'}</span></div>
 <div class=row><span class=sm>Signal</span><span>${S.conn==='live'?'Wi-Fi −52 dBm':'—'}</span></div>
 <div class=row><span class=sm>Last packet</span><span>${S.conn==='offline'?'13:02:41 CT':'just now'}</span></div>
 <div class=row><span class=sm>Streams</span><span style="font-size:12px">${S.conn==='offline'?'none':'status · lidar · camera'}</span></div></div>
 <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn inv" onclick="reconnect()">Reconnect</button><button class=btn onclick="setConn(S.conn==='demo'?'live':'demo')">${S.conn==='demo'?'Go Live':'Use Demo'}</button><button class="btn danger" onclick="setConn('offline')">Simulate offline</button></div>`;}
function setConn(c){S.conn=c;$('#popover').hidden=true;renderTop();if(c==='offline'){go('offline');toast('Stella went offline','controls paused')}else{toast(c==='demo'?'Demo mode':'Live','connected to '+(c==='demo'?'demo robot':'Stella'));if(S.view==='offline')go('home');else render()}}
function reconnect(){S.conn='reconnecting';$('#popover').hidden=true;renderTop();render();setTimeout(()=>{S.conn='live';S.lat=14;renderTop();toast('Reconnected','14 ms over Tailscale');if(S.view==='offline')go('home');else render()},1800)}
setInterval(()=>{if(S.conn==='live'){S.lat=Math.max(9,Math.min(42,S.lat+Math.round((Math.random()-.5)*8)));const l=$('#connbtn .lat');if(l)l.textContent=S.lat+' ms'}},2000);

/* ---------- top / nav ---------- */
function renderTop(){
 $('#top').innerHTML=`<div class=brand>STELLA</div>
 <div class=tnav>${VIEWS.map(([k,n])=>`<button data-go=${k} class="${S.view===k?'on':''}">${n}</button>`).join('')}</div>
 <div class=vstrip id=vstrip role=button aria-label="Talk to Stella"><span class=wave>${[0,.2,.4,.1,.3].map(d=>`<i style="animation-delay:${d}s"></i>`).join('')}</span><span class=vt>Tap or hold Space · “clean the kitchen, then dock”</span><span class="btn inv" style="padding:6px 12px">● Talk</span></div>
 <div class=topr style="display:flex;gap:8px;align-items:center">${connHTML()}
 <button class=iconbtn id=themebtn title="Light / dark">${S.theme==='dark'?'☀':'☾'}</button>
 <div class=seg title="Design"><button id=dD class="${S.design==='D'?'on':''}">D</button><button id=dF class="${S.design==='F'?'on':''}">F</button></div></div>`;
 $('#side').innerHTML=VIEWS.map(([k,n])=>`<button data-go=${k} class="${S.view===k?'on':''}">${n}</button>`).join('')+`<div style="margin-top:auto" class="sm mono">Unit 01 · Roomba 694<br>Pi 4 · ROS 2 Jazzy</div>`;
 $('#tabs').innerHTML=VIEWS.slice(0,6).map(([k,n,i])=>`<button data-go=${k} class="${S.view===k?'on':''}"><span>${i}</span>${n==='Learning'?'Learn':n}</button>`).join('');
 $('#connbtn').onclick=e=>{e.stopPropagation();$('#popover').hidden?popover():$('#popover').hidden=true};
 $('#themebtn').onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';localStorage.t=S.theme;apply()};
 $('#dD').onclick=()=>{S.design='D';localStorage.d='D';apply()}; $('#dF').onclick=()=>{S.design='F';localStorage.d='F';apply()};
 $('#vstrip').onclick=()=>openVoice();
}
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)go(g.dataset.go); if(!e.target.closest('#popover')&&!e.target.closest('#connbtn'))$('#popover').hidden=true});
function go(v){S.view=v;location.hash=v;renderTop();render();scrollTo(0,0)}
function apply(){H.dataset.design=S.design;H.dataset.theme=S.theme;renderTop();render()}

/* ---------- map ---------- */
function mapHTML(id,opts={}){return `<div class=map id=${id} data-view="${opts.view||S.mapView}" ${opts.h?`style="aspect-ratio:auto;height:${opts.h}px"`:''}><div class=stage><svg class=plan viewBox="-14 -14 928 648"></svg></div>${opts.tag===false?'':`<div class="tag card mono"><div class=lbl>Stella</div><b class=tr>${S.room}</b><br><span class=ts>${S.speed.toFixed(2)} m/s · cov ${S.cov}%</span></div>`}<div class="legend mono"><span><b style="color:var(--acc)">▮</b> Cleaned</span><span><b style="color:var(--bad)">▨</b> No-go</span><span>┄ Saved route</span><span>N ↑</span></div></div>`}
function svgInner(view){const D=S.design==='D';
 const pat=D?`<pattern id=pg width=14 height=14 patternUnits=userSpaceOnUse><circle cx=7 cy=7 r=1.3 fill="var(--dot)"/></pattern>`:`<pattern id=pg width=20 height=20 patternUnits=userSpaceOnUse><path d="M20 0H0V20" fill=none stroke="var(--dot)"/></pattern>`;
 const plan=view==='plan';
 let s=`<defs>${pat}<pattern id=cl width=20 height=20 patternUnits=userSpaceOnUse><rect width=15 height=20 fill="rgba(255,90,31,.22)"/></pattern><pattern id=ng width=12 height=12 patternUnits=userSpaceOnUse patternTransform="rotate(45)"><rect width=6 height=12 fill="rgba(214,51,31,.32)"/></pattern></defs>
 <rect x=0 y=0 width=900 height=620 fill="var(--floor)"/><rect x=0 y=0 width=900 height=620 fill="${plan?'none':'url(#pg)'}"/>`;
 ROOMS.forEach(([n,x,y,w,h,a],i)=>{s+=`<rect x=${x} y=${y} width=${w} height=${h} fill="${plan?['rgba(255,90,31,.06)','rgba(80,140,255,.07)','rgba(60,190,120,.07)','rgba(150,150,150,.08)'][i]:'none'}" stroke="var(--room)" stroke-width="${plan?3:2}"/><text class=rl x=${x+18} y=${y+36}>${n.toUpperCase()}</text>${plan?`<text class=rl x=${x+18} y=${y+64} style="font-size:17px;font-weight:400">${a}</text>`:''}`});
 if(!plan)s+=`<rect x=30 y=110 width=${Math.round(3*S.cov+90)} height=230 fill="url(#cl)"/>`;
 S.zones.forEach(z=>{s+=`<rect x=${z.x} y=${z.y} width=${z.w} height=${z.h} fill="url(#ng)" stroke="var(--bad)" stroke-width=2/><text class=zl x=${z.x} y=${z.y+z.h+20}>NO-GO · ${z.n}</text>`});
 s+=`<polyline points="${ROUTES[0].p.join(' ')}" fill=none stroke="var(--fg)" stroke-width=2.5 stroke-dasharray="9 8" opacity=.45/>`;
 s+=`<rect x=44 y=575 width=52 height=30 rx=4 fill="var(--inv)"/><text class=rl x=104 y=597 style="font-size:16px">DOCK</text>`;
 const {x,y}=S.bot,r=30;
 s+=`<g id=bot style="transition:transform .35s" transform="translate(${x} ${y})"><circle r=58 fill="rgba(255,90,31,.08)"/><circle r=38 fill="rgba(255,90,31,.18)"/><circle r=${r} fill="${D?'#e9eaee':'#f4f4f4'}" stroke="#8e939b" stroke-width=2/><circle cy=-19 r=6 fill="var(--acc)"/>
 ${[[-70,-70,1,1],[70,-70,-1,1],[-70,70,1,-1],[70,70,-1,-1]].map(([a,b,c,d])=>`<path d="M${a} ${b+d*24}V${b}H${a+c*24}" fill=none stroke="var(--fg)" stroke-width=3/>`).join('')}</g>`;
 return s.replace(/=([^"\s>]+)\/>/g,'="$1"/>')}
function drawMaps(){$$('.map').forEach(m=>{const v=m.dataset.view;m.querySelector('svg').innerHTML=svgInner(v);const tr=m.querySelector('.tr');if(tr){tr.textContent=S.room;m.querySelector('.ts').textContent=`${S.speed.toFixed(2)} m/s · cov ${S.cov}%`}})}
function roomAt(x,y){const r=ROOMS.find(([n,a,b,w,h])=>x>=a&&x<a+w&&y>=b&&y<b+h);return r?r[0]:S.room}
function moveBot(dx,dy){if(!guard())return;const k=S.speed/0.34*28;S.bot.x=Math.max(30,Math.min(870,S.bot.x+dx*k));S.bot.y=Math.max(30,Math.min(590,S.bot.y+dy*k));S.room=roomAt(S.bot.x,S.bot.y);drawMaps()}
let anim=null;
function runPath(pts,done){clearInterval(anim);let i=0;anim=setInterval(()=>{if(i>=pts.length){clearInterval(anim);done&&done();return}[S.bot.x,S.bot.y]=pts[i++];S.room=roomAt(S.bot.x,S.bot.y);drawMaps()},420)}
function guard(){if(S.conn==='offline'||S.conn==='reconnecting'){toast('Stella is offline','controls paused');return false}return true}
function startDraw(){S.drawing=true;$$('.map').forEach(m=>m.dataset.view='top');S.mapView='top';render();const m=$('#bigmap');m.classList.add('drawing');toast('Draw a no-go zone','drag a box on the map');
 const svg=m.querySelector('svg');let st=null,el=null;const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())};
 svg.onpointerdown=e=>{st=pt(e);el=document.createElementNS('http://www.w3.org/2000/svg','rect');el.setAttribute('fill','url(#ng)');el.setAttribute('stroke','var(--bad)');el.setAttribute('stroke-width',2);svg.appendChild(el);svg.setPointerCapture(e.pointerId)};
 svg.onpointermove=e=>{if(!st)return;const p=pt(e);el.setAttribute('x',Math.min(st.x,p.x));el.setAttribute('y',Math.min(st.y,p.y));el.setAttribute('width',Math.abs(p.x-st.x));el.setAttribute('height',Math.abs(p.y-st.y))};
 svg.onpointerup=e=>{if(!st)return;const p=pt(e);const z={x:Math.round(Math.min(st.x,p.x)),y:Math.round(Math.min(st.y,p.y)),w:Math.round(Math.abs(p.x-st.x)),h:Math.round(Math.abs(p.y-st.y)),n:'ZONE '+(S.zones.length+1)};st=null;
  if(z.w>15&&z.h>15){S.zones.push(z);toast('No-go zone saved',roomAt(z.x+z.w/2,z.y+z.h/2))} S.drawing=false;render()}}

/* ---------- shared blocks ---------- */
const seg=(id,opts,cur)=>`<div class=seg id=${id}>${opts.map(o=>`<button data-v="${o}" class="${o===cur?'on':''}">${o}</button>`).join('')}</div>`;
const liveSeg=()=>`<div class=seg style="width:150px" id=livedemo><button data-v=live class="${S.conn!=='demo'?'on':''}">LIVE</button><button data-v=demo class="${S.conn==='demo'?'on':''}">DEMO</button></div>`;
const statusNow=()=>S.conn==='offline'?'Offline':S.mode==='Dock'?'Docking':S.mode==='Manual'?'Manual drive':S.cleaning?`Cleaning · ${S.room}`:'Idle · '+S.room;
const modesB=()=>seg('modes',['Dock','Eco','Normal','Turbo','Manual'],S.mode);
const actB=()=>`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px" id=acts><button class="btn pri" data-a=clean>▶ Clean</button><button class="btn danger" data-a=stop>■ Stop</button><button class=btn data-a=spot>◎ Spot</button><button class=btn data-a=dock>⌂ Dock</button></div>`;
const sysB=()=>`<div class=card><div class=lbl style="margin-bottom:4px">System</div>${[['Battery',S.batt+'%','≈ 54 min left'],['Pi 4','52 °C','CPU 31% · no throttling'],['Lidar','10 Hz','RPLIDAR C1 · scanning'],['Link',S.conn==='live'?S.lat+' ms':CONN[S.conn],S.conn==='demo'?'Demo robot':'Tailscale']].map(([a,b,c])=>`<div class=row><span>${a}<br><span class=sm>${c}</span></span><b class=mono style="font-size:16px">${b}</b></div>`).join('')}</div>`;
const driveB=()=>`<div class=card><div class=lbl style="margin-bottom:12px">Manual drive</div><div style="display:flex;gap:18px;align-items:center"><div class=pad id=pad><span></span><button data-d="0,-1">▲</button><span></span><button data-d="-1,0">◀</button><button class=stop data-a=stop>STOP</button><button data-d="1,0">▶</button><span></span><button data-d="0,1">▼</button><span></span></div>
 <div style="flex:1;min-width:0"><div class=lbl>Speed</div><div class=mono style="font-size:22px;margin:4px 0 8px"><span id=spv>${S.speed.toFixed(2)}</span> <span class=sm>m/s</span></div><input type=range id=speed min=0.1 max=0.5 step=0.01 value=${S.speed}><div class=sm style="margin-top:6px">Arrows / WASD move · Space = talk</div></div></div></div>`;
const camB=(big)=>`<div class="cam ${S.rec?'rec':''}" id=cam><div class=scan></div><div class=hud><span><span style="color:#ff5a1f">●</span> ${S.conn==='offline'?'NO SIGNAL':'LIVE · 720p · 24 fps'}</span><span>PI CAMERA · FRONT</span></div>${S.set.boxes&&S.conn!=='offline'?`<div class=box id=b1 style="left:16%;top:56%;width:22%;height:26%;color:var(--acc)"><span>SOCK 0.91</span></div><div class=box id=b2 style="left:60%;top:30%;width:24%;height:46%;border-color:#fff;color:#fff"><span>CHAIR LEG 0.84</span></div>`:''}</div>`;
const voiceLog=()=>`<div class=card><div class=lbl style="margin-bottom:4px">Voice log</div><div class=mono style="font-size:12px">${VLOG.slice(0,4).map(([a,b])=>`<div class=row><span>“${a}”</span><span style="color:${b.includes('/')?'var(--acc)':'inherit'}">${b}</span></div>`).join('')}</div></div>`;
const VLOG=[['clean the kitchen, then dock','DONE'],['do a little dance','DONE'],['pick something on TV','SENT'],['stop','ALWAYS WINS']];
const alertsB=()=>`<div class=card><div class=lbl style="margin-bottom:4px">Alerts</div><div class=row><span>⚠ Bath mat: stuck 3× this week</span><button class=btn style="padding:5px 9px" data-go=learning>Fix</button></div><div class=row><span>Lidar reconnected</span><span class=sm>13:06</span></div><div class=row><span>Route “Evening” ready</span><span class=sm>12:00</span></div></div>`;
const cutB=()=>`<div class=cut><div class=rings>${[[0,0,360,'var(--line)'],[0,0,360,'var(--room)',50,'dashed'],[0,0,360,'var(--room)',100],[0,0,360,'var(--acc)',150],[120,120,120,'var(--fg)',205]].map(([l,t,w,c,z=0,st='solid'])=>`<i style="left:${l}px;top:${t}px;width:${w}px;height:${w}px;border-color:${c};border-style:${st};transform:translateZ(${z}px)"></i>`).join('')}</div>
 <div class="labels mono"><div>LIDAR · RPLIDAR C1 · 10 Hz</div><div style="color:var(--acc)">PI 4 · 52 °C · CPU 31%</div><div>ARDUINO MEGA · 115200</div><div>BATTERY · ${S.batt}% · 14.4 V</div><div>ROOMBA 694 · BRUSH + VAC</div></div>
 <div class="mono card" style="position:absolute;left:14px;top:14px;padding:10px 14px"><div class=lbl>Suction</div><div style="font-size:20px">${S.mode==='Turbo'?'3.1':S.mode==='Eco'?'1.4':'2.2'} <span class=sm>kPa</span></div></div></div>`;
const statsB=()=>`<div class=stats4>${[['Coverage',S.cov+'%'],['Area',(31.5*S.cov/100).toFixed(1)+' m²'],['Run time','12:40'],['ETA','6 min']].map(([a,b])=>`<div><div class=lbl>${a}</div><div class=big>${b}</div></div>`).join('')}</div>`;
const head=(t,s,tools='')=>`<div class=head><div><h1>${t}</h1><div class=sm style="font-size:14px;margin-top:2px">${s}</div></div><div class=tools>${tools}</div></div>`;

/* ---------- views ---------- */
function vHome(){
 if(S.design==='D')return `<div class="grid home-D">
 <div style="display:flex;flex-direction:column;gap:16px"><div class=card><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div class=lbl>Now</div><h2 style="font-size:20px;margin-top:2px" id=now>${statusNow()}</h2></div>${liveSeg()}</div><div class=lbl style="margin:14px 0 8px">Mode</div>${modesB()}<div style="margin-top:12px">${actB()}</div></div>${sysB()}${driveB()}</div>
 <div class=card style="padding:0;overflow:hidden;display:flex;flex-direction:column">${mapHTML('homemap')}<div style="padding:16px 22px;border-top:1px solid var(--line)">${statsB()}</div></div>
 <div class=col-r style="display:flex;flex-direction:column;gap:16px"><div class=card style="padding:14px"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><span class=lbl>Camera</span><button class=sm data-go=camera>Open ›</button></div>${camB()}</div>${voiceLog()}${alertsB()}</div></div>`;
 return head('Stella','Unit 01 · Roomba 694 + Pi 4 · <span id=now>'+statusNow()+'</span>',liveSeg())+`<div class="grid home-F"><div class=card style="padding:0;min-height:470px">${cutB()}</div>
 <div style="display:flex;flex-direction:column;gap:16px"><div class=card style="padding:0;overflow:hidden">${mapHTML('homemap',{tag:false})}</div><div class=card style="padding:12px">${camB()}</div></div></div>
 <div class="grid three" style="margin-top:16px"><div class=card><div class=lbl style="margin-bottom:10px">Mode & clean</div>${modesB()}<div style="margin-top:12px">${actB()}</div><div style="margin-top:16px">${statsB()}</div></div>${driveB()}${voiceLog()}</div>`}
function vMap(){return head('Map','Apartment · lidar map 2026-10-13 · 31.5 m² · 4 rooms',seg('mapview',['3D','Top','Plan'],{['3d']:'3D',top:'Top',plan:'Plan'}[S.mapView])+`<button class=btn id=draw>${S.drawing?'Drawing…':'+ Draw no-go zone'}</button>`)+`<div class="grid two"><div class=card style="padding:0;overflow:hidden">${mapHTML('bigmap')}</div>
 <div style="display:flex;flex-direction:column;gap:16px"><div class=card><div class=lbl style="margin-bottom:4px">Rooms</div>${ROOMS.map(r=>`<div class=row><span><b>${r[0]}</b><br><span class=sm>${r[5]}</span></span><button class=btn style="padding:6px 12px" data-room="${r[0]}">Clean</button></div>`).join('')}</div>
 <div class=card><div style="display:flex;justify-content:space-between"><span class=lbl>No-go zones</span><span class=sm>${S.zones.length}</span></div>${S.zones.map((z,i)=>`<div class=row><span>${z.n[0]+z.n.slice(1).toLowerCase()} · ${roomAt(z.x+z.w/2,z.y+z.h/2)}</span><button class=sm data-delz=${i}>Remove</button></div>`).join('')}</div>
 <div class=card><div class=lbl style="margin-bottom:4px">Saved routes</div>${ROUTES.map((r,i)=>`<div class=row><span><b>${r.n}</b><br><span class=sm>${r.d}</span></span><button class="btn ${i?'':'pri'}" style="padding:6px 12px" data-route=${i}>Run</button></div>`).join('')}</div></div></div>`}
function vCam(){return head('Camera','Pi camera · front · object detection '+(S.set.boxes?'on':'off'),`<button class=btn id=snap>Snapshot</button><button class="btn ${S.rec?'pri':''}" id=rec>${S.rec?'■ Stop rec':'● Record'}</button>`)+`<div class="grid two"><div class=card style="padding:12px">${camB(1)}</div>
 <div style="display:flex;flex-direction:column;gap:16px"><div class=card><div class=lbl style="margin-bottom:4px">Detections · today</div>${[['Sock · Living','0.91 · avoided'],['Chair leg · Living','0.84 · mapped'],['Cable · TV stand','0.77 · no-go'],['Shoe · Hall','0.88 · avoided']].map(([a,b])=>`<div class=row><span>${a}</span><span class=sm>${b}</span></div>`).join('')}</div>
 <div class=card><div class=lbl style="margin-bottom:10px">Stream</div>${seg('res',['480p','720p','1080p'],'720p')}<div class=row style="margin-top:8px"><span>Detection boxes</span><button class="toggle ${S.set.boxes?'on':''}" data-set=boxes></button></div><div class=row><span>Low-light boost</span><button class="toggle ${S.set.low?'on':''}" data-set=low></button></div></div>
 <div class=card style="padding:0;overflow:hidden">${mapHTML('cammap',{tag:false})}</div></div></div>`}
function vHist(){const s=SESS[S.sel];const bars=[120,160,90,170,130,150,110];
 return head('History','42 sessions · 1,036 m² cleaned since Sep 29',seg('range',['Day','Week','Month'],'Week')+'<button class=btn id=csv>Export CSV</button>')+`<div class="grid two"><div style="display:flex;flex-direction:column;gap:16px">
 <div class=card><div class=lbl style="margin-bottom:6px">Sessions · tap to inspect</div><div class="trow lbl" style="cursor:default"><span>When</span><span class=hm>Mode</span><span class=hm>Where</span><span class=hm>Time</span><span class=hm>Area</span><span class=hm>Cover</span><span>Result</span></div>
 ${SESS.map((r,i)=>`<div class="trow ${i===S.sel?'sel':''}" data-sel=${i}><span><b>${r[0]}</b><span class=sm style="display:block" >${r[2]} · ${r[3]}</span></span>${r.slice(1,6).map(c=>`<span class=hm>${c}</span>`).join('')}<span>${r[6]}</span></div>`).join('')}</div>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))"><div class=card><div class=lbl style="margin-bottom:14px">Coverage · this week</div><div class=bars>${bars.map((v,i)=>`<div class="${i===6?'hl':''}"><i style="height:${v}px"></i><span class=sm>${'Thu Fri Sat Sun Mon Tue Wed'.split(' ')[i]}</span></div>`).join('')}</div></div>
 <div class=card><div class=lbl style="margin-bottom:4px">Command log</div><div class=mono style="font-size:12px">${[['13:04 web','clean kitchen, then dock','ok'],['12:58 pi mic','do a little dance','ok'],['12:41 web','pick something on TV','ok'],['12:40 web','go to the couch','not understood']].map(([a,b,c])=>`<div class=row><span>${a}<br>“${b}”</span><span class=sm>${c}</span></div>`).join('')}</div></div></div></div>
 <div style="display:flex;flex-direction:column;gap:16px"><div class=card style="padding:0;overflow:hidden"><div class=lbl style="padding:12px 14px 0">Selected · ${s[0]}</div>${mapHTML('histmap',{tag:false,view:'top'})}</div>
 <div class=card><h2>${s[2]} · ${s[1]}</h2><div class=stats4 style="margin-top:12px">${[['Time',s[3]],['Area',s[4]],['Cover',s[5]],['Result',s[6].split(' ')[0]]].map(([a,b])=>`<div><div class=lbl>${a}</div><div style="font-size:20px;font-weight:500">${b}</div></div>`).join('')}</div>
 <div class=sm style="margin-top:12px">${s[6].includes('Stuck')?'Stuck on the bath mat edge at 20:19. Stella backed out and finished the hall.':'No problems. 0 stuck events, 4 obstacles avoided.'}</div><div style="display:flex;gap:8px;margin-top:12px"><button class=btn data-route=0>Replay path</button><button class=btn data-room="${s[2]==='Whole home'?'Living room':s[2]}">Clean again</button></div></div></div></div>`}
function vLearn(){return head('Learning','What Stella has noticed · apply a suggestion or dismiss it',`<span class=chip>${S.notes.filter(n=>n[3]==='Suggested').length} suggestions</span>`)+`<div class="grid three">${S.notes.map((n,i)=>`<div class=card style="${n[3]==='Dismissed'?'opacity:.5':''}"><div style="display:flex;justify-content:space-between;align-items:center"><span class=lbl>${n[0]}</span><span class=chip style="${n[3]==='Suggested'?'color:var(--acc);border-color:var(--acc)':''}">${n[3]}</span></div><div style="font-size:15px;margin:12px 0 16px">${n[1]}</div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class=sm>${n[2]}</span>${n[3]==='Suggested'?`<span style="display:flex;gap:8px"><button class=btn data-dis=${i}>Dismiss</button><button class="btn inv" data-app=${i}>Apply</button></span>`:`<button class=btn data-go=map>View on map</button>`}</div></div>`).join('')}</div>
 <div class="grid two" style="margin-top:16px"><div class=card><div class=lbl style="margin-bottom:4px">Build timeline</div>${[['First drive under ROS 2 + lidar scans','Sep 29'],['Pi 4 died (under-voltage), rebuilt with wall power + fan','Oct 11–13'],['Voice commands v1: stop, dock, status, find','Oct 13'],['First full lidar map of the apartment','Next']].map(([a,b])=>`<div class=row><span>${a}</span><span class=sm>${b}</span></div>`).join('')}</div>
 <div class=card><div class=lbl style="margin-bottom:4px">Model</div>${[['Map confidence','92%'],['Known obstacles','14'],['Stuck spots',S.notes[1][3]==='Applied'?'0 open':'1 open'],['Voice understood','94% · 7 days']].map(([a,b])=>`<div class=row><span>${a}</span><b>${b}</b></div>`).join('')}</div></div>`}
function vSet(){const T=(k,l,d='')=>`<div class=row><span>${l}${d?`<br><span class=sm>${d}</span>`:''}</span><button class="toggle ${S.set[k]?'on':''}" data-set=${k}></button></div>`;
 return head('Settings','Owner-only controls · changes save instantly','<button class=btn onclick="toast(\'Signed out\',\'demo only\')">Sign out</button>')+`<div class="grid three">
 <div style="display:flex;flex-direction:column;gap:16px"><div class=card><h2 style="margin-bottom:10px">Robot</h2><div class=lbl style="margin-bottom:6px">Robot URL</div><input class=input id=url value="${S.url}"><div class=row style="margin-top:8px"><span>Connection</span>${connHTML().replace('id=connbtn','')}</div><div class=row><span>Open in</span>${liveSeg()}</div>${T('auto','Auto-reconnect')}</div>
 <div class=card><h2 style="margin-bottom:6px">Owner</h2><div class=row><span>Name</span><b>King Sharif</b></div><div class=row><span>Controls</span><span>Owner only</span></div><div class=row><span>Visitors see</span><span>Demo robot</span></div></div></div>
 <div style="display:flex;flex-direction:column;gap:16px"><div class=card><h2 style="margin-bottom:10px">Appearance</h2><div class=lbl style="margin-bottom:6px">Theme</div>${seg('themeseg',['Light','Dark'],S.theme==='dark'?'Dark':'Light')}<div class=lbl style="margin:12px 0 6px">Design</div>${seg('designseg',['D · Isometric','F · Blueprint'],S.design==='D'?'D · Isometric':'F · Blueprint')}${T('motion','Reduce motion')}</div>
 <div class=card><h2 style="margin-bottom:10px">Voice</h2><div class=lbl style="margin-bottom:6px">Speech to text</div>${seg('vmode',['Private · on Stella','Fast · browser'],S.set.fast?'Fast · browser':'Private · on Stella')}<div class=sm style="margin:8px 0">${S.set.fast?'⚠ Fast mode sends your audio to Google (Chrome).':'Private keeps audio at home. 1–3 s slower.'}</div><div class=row><span>Wake word on Pi mic</span><b>“Stella”</b></div>${T('chain','Chained commands','“clean the kitchen, then dock”')}${T('fun','Fun commands','dance, pick something on TV')}</div></div>
 <div style="display:flex;flex-direction:column;gap:16px"><div class=card><h2 style="margin-bottom:6px">Safety & alerts</h2><div class=row><span>“Stop” always wins</span><span class=sm>Locked on</span></div><div class=row><span>Max manual speed</span><b>0.50 m/s</b></div><div class=row><span>Dock when battery hits</span><b>20%</b></div>${T('toasts','Toasts & alerts','stuck, offline, finished')}</div>
 <div class=card><h2 style="margin-bottom:6px">Hardware</h2>${[['Base','Roomba 694 · 600 board'],['Brain','Raspberry Pi 4 · ROS 2 Jazzy'],['Bridge','Arduino Mega 2560'],['Lidar','RPLIDAR C1'],['Camera','Pi camera module']].map(([a,b])=>`<div class=row><span>${a}</span><span class=sm>${b}</span></div>`).join('')}</div></div></div>`}
function vOff(){const rc=S.conn==='reconnecting';return `<div class="card offline"><div class=lbl style="color:${rc?'var(--warn)':'var(--bad)'}">${rc?'Reconnecting':'Offline'}</div><h1 style="margin:10px 0">${rc?'Looking for Stella…':S.conn==='offline'?'Stella isn’t answering':'Stella is connected'}</h1>
 <p class=sm style="font-size:14px">${S.conn==='offline'?'Last seen 13:02 CT on Tailscale (stella.tail297c20.ts.net). Controls are paused until she’s back.':rc?'Trying Tailscale…':'Everything is fine right now. Use “Simulate offline” in the connection menu to preview this screen.'}</p>
 <div style="display:flex;gap:10px;justify-content:center;margin-top:22px;flex-wrap:wrap"><button class="btn inv" id=retry>${rc?'Retrying…':'Retry now'}</button><button class=btn id=todemo>Switch to Demo</button>${S.conn!=='offline'&&!rc?`<button class="btn danger" id=simoff>Simulate offline</button>`:''}</div>
 <div class=mono style="text-align:left;margin-top:26px;font-size:12px"><div class=lbl style="margin-bottom:4px">Checklist</div><div class=row><span>Pi powered (wall + fan)?</span><span class=sm>check LED</span></div><div class=row><span>Phone on Tailscale?</span><span class=sm>tailnet only</span></div><div class=row><span>robot_api service running?</span><span class=sm>auto-starts at boot</span></div></div></div>`}

function render(){const v=S.view;$('#main').innerHTML={home:vHome,map:vMap,camera:vCam,history:vHist,learning:vLearn,settings:vSet,offline:vOff}[v]();drawMaps();bind()}
function bind(){
 const on=(sel,fn)=>$$(sel).forEach(e=>e.onclick=ev=>fn(e,ev));
 on('#modes button',b=>{if(!guard())return;S.mode=b.dataset.v;if(S.mode==='Dock')dockNow();toast('Mode · '+S.mode,{Dock:'heading to dock',Eco:'quiet, longer runtime',Normal:'balanced',Turbo:'max suction',Manual:'use the d-pad'}[S.mode]);render()});
 on('[data-a]',b=>act(b.dataset.a));
 on('[data-d]',b=>{const [x,y]=b.dataset.d.split(',').map(Number);if(S.mode!=='Manual'){S.mode='Manual';S.cleaning=false;render();toast('Manual drive','cleaning paused')}moveBot(x,y)});
 const sp=$('#speed');if(sp)sp.oninput=()=>{S.speed=+sp.value;$('#spv').textContent=S.speed.toFixed(2);drawMaps()};
 on('#livedemo button',b=>setConn(b.dataset.v==='demo'?'demo':'live'));
 on('#mapview button',b=>{S.mapView={'3D':'3d',Top:'top',Plan:'plan'}[b.dataset.v];render()});
 on('#draw',()=>startDraw());
 on('[data-room]',b=>{if(!guard())return;const r=b.dataset.room;S.cleaning=true;S.mode=S.mode==='Manual'||S.mode==='Dock'?'Normal':S.mode;toast('Cleaning '+r,'route planned around no-go zones');runPath([CENT[r]],()=>{S.room=r;drawMaps()});});
 on('[data-route]',b=>{if(!guard())return;const r=ROUTES[+b.dataset.route];toast('Running route “'+r.n+'”',r.d);runPath(r.p,()=>toast('Route “'+r.n+'” done'))});
 on('[data-delz]',b=>{S.zones.splice(+b.dataset.delz,1);toast('No-go zone removed');render()});
 on('[data-sel]',b=>{S.sel=+b.dataset.sel;render()});
 on('[data-app]',b=>{const n=S.notes[+b.dataset.app];n[3]='Applied';if(n[0]==='Stuck spot'&&!S.zones.find(z=>z.n==='BATH MAT'))S.zones.push({x:380,y:470,w:110,h:110,n:'BATH MAT'});toast('Applied',n[0]);render()});
 on('[data-dis]',b=>{S.notes[+b.dataset.dis][3]='Dismissed';toast('Dismissed');render()});
 on('[data-set]',b=>{const k=b.dataset.set;S.set[k]=!S.set[k];toast((S.set[k]?'On · ':'Off · ')+k);render()});
 on('#themeseg button',b=>{S.theme=b.dataset.v.toLowerCase();localStorage.t=S.theme;apply()});
 on('#designseg button',b=>{S.design=b.dataset.v[0];localStorage.d=S.design;apply()});
 on('#vmode button',b=>{S.set.fast=b.dataset.v.startsWith('Fast');render()});
 on('#snap',()=>toast('Snapshot saved','13:18 · living room'));on('#rec',()=>{S.rec=!S.rec;toast(S.rec?'Recording':'Recording saved');render()});
 on('#csv',()=>toast('Exported','stella-sessions.csv'));on('#res button',b=>{$$('#res button').forEach(x=>x.classList.toggle('on',x===b));toast('Stream '+b.dataset.v)});
 on('#retry',()=>reconnect());on('#todemo',()=>setConn('demo'));on('#simoff',()=>setConn('offline'));
 const u=$('#url');if(u)u.onchange=()=>{S.url=u.value;toast('Robot URL saved')};
}
function act(a){if(a!=='stop'&&!guard())return;
 if(a==='stop'){clearInterval(anim);S.cleaning=false;toast('Stopped','“stop” always wins')}
 if(a==='clean'){S.cleaning=true;if(S.mode==='Manual'||S.mode==='Dock')S.mode='Normal';toast('Cleaning started',S.room+' · '+S.mode);clearInterval(cov);cov=setInterval(()=>{if(S.cleaning&&S.cov<100){S.cov++;drawMaps()}},1500)}
 if(a==='spot'){S.cleaning=true;toast('Spot clean','1 m circle around Stella');const {x,y}=S.bot;runPath([...Array(9)].map((_,i)=>[x+Math.cos(i*.8)*40,y+Math.sin(i*.8)*40]).concat([[x,y]]))}
 if(a==='dock')dockNow();
 const n=$('#now');if(n)n.textContent=statusNow()}
let cov=null;
function dockNow(){S.cleaning=false;S.mode='Dock';toast('Docking','heading home');runPath([[S.bot.x,420],[70,420],CENT.Dock],()=>{S.room='Hall · Bath';toast('Docked','charging');const n=$('#now');if(n)n.textContent='Docked · charging'})}
document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const k={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}[e.key];if(k&&$('#voice').hidden){e.preventDefault();moveBot(...k)}
 if(e.code==='Space'&&$('#voice').hidden){e.preventDefault();openVoice()} if(e.key==='Escape')closeVoice()});

/* ---------- voice mode ---------- */
const SCRIPTS=[{q:'Stella, clean the kitchen, then dock',r:'On it. Cleaning the kitchen first, then I’ll head back to my dock.',steps:['Clean kitchen','Return to dock'],run:()=>{S.cleaning=true;runPath([[260,420],[640,420],CENT.Kitchen,[640,420],[260,420],[70,420],CENT.Dock],()=>{S.room='Hall · Bath';toast('Chain 2/2 done','docked and charging')});VLOG.unshift(['clean the kitchen, then dock','1/2'])}},
 {q:'Stella, do a little dance',r:'Watch this.',steps:['Spin left','Spin right','Chirp'],run:()=>{const {x,y}=S.bot;runPath([[x+30,y],[x-30,y],[x,y+30],[x,y-30],[x,y]]);VLOG.unshift(['do a little dance','DONE'])}},
 {q:'Stella, pick something to watch on TV',r:'How about a nature documentary? Sending it to the living room TV.',steps:['Pick a show','Send to living room TV'],run:()=>VLOG.unshift(['pick something on TV','SENT'])},
 {q:'Stella, how’s your battery?',r:`Battery at ${S.batt} percent. I’m good for about 54 more minutes.`,steps:['Read status'],run:()=>VLOG.unshift(['how’s your battery','OK'])}];
let vi=0,vt=[],vphase='idle',amp=0,analyser=null,raf=null;
function openVoice(){if(!$('#voice').hidden)return;const v=$('#voice');v.hidden=false;vphase='listening';const sc=SCRIPTS[vi++%SCRIPTS.length];$('#vstate').textContent='Listening';$('#vsub').textContent='Speak now · tap anywhere to cancel';$('#vtext').textContent='';
 const words=sc.q.split(' ');words.forEach((w,i)=>vt.push(setTimeout(()=>{$('#vtext').textContent=words.slice(0,i+1).join(' ')},350+i*260)));
 const t1=350+words.length*260+500;
 vt.push(setTimeout(()=>{vphase='thinking';$('#vstate').textContent='Thinking';$('#vsub').textContent='Sending to Stella · private mode'},t1));
 vt.push(setTimeout(()=>{vphase='speaking';$('#vstate').textContent='Stella';$('#vtext').textContent=sc.r;$('#vsub').textContent='Speaking from the robot and here'},t1+1300));
 vt.push(setTimeout(()=>{closeVoice();toast(sc.steps.length>1?`Chained command · ${sc.steps.length} steps`:'Voice command',`“${sc.q.replace('Stella, ','')}”`,sc.steps);if(S.conn!=='offline')sc.run();if(S.view==='home')render()},t1+1300+2600));
 loop()}
function closeVoice(){vt.forEach(clearTimeout);vt=[];vphase='idle';$('#voice').hidden=true;cancelAnimationFrame(raf)}
$('#vclose').onclick=e=>{e.stopPropagation();closeVoice()};$('#voice').onclick=e=>{if(e.target.id==='voice')closeVoice()};
$('#vmic').onclick=async e=>{e.stopPropagation();try{const st=await navigator.mediaDevices.getUserMedia({audio:true});const ac=new AudioContext();analyser=ac.createAnalyser();analyser.fftSize=256;ac.createMediaStreamSource(st).connect(analyser);$('#vmic').textContent='Mic on'}catch(err){toast('Mic unavailable','using the demo animation')}};
function loop(){const c=$('#blob'),dpr=devicePixelRatio||1,W=c.clientWidth;c.width=c.height=W*dpr;const x=c.getContext('2d');let t=0;
 const f=()=>{t+=.016;let a;if(analyser){const d=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(d);a=d.reduce((s,v)=>s+v,0)/d.length/90}else a={listening:.45+.4*Math.abs(Math.sin(t*3.1)*Math.sin(t*1.7+1)),thinking:.18,speaking:.35+.35*Math.abs(Math.sin(t*5)*Math.cos(t*2.3))}[vphase]||.1;
  amp+=(a-amp)*.12;x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,W);const cx=W/2,R=W*.26;
  const g=x.createRadialGradient(cx,cx,R*.2,cx,cx,R*1.9);const col=vphase==='thinking'?'120,140,255':'255,90,31';g.addColorStop(0,`rgba(${col},.55)`);g.addColorStop(1,`rgba(${col},0)`);x.fillStyle=g;x.fillRect(0,0,W,W);
  for(let L=0;L<3;L++){x.beginPath();for(let i=0;i<=120;i++){const th=i/120*Math.PI*2;const n=Math.sin(th*3+t*(1.5+L))*.5+Math.sin(th*5-t*(2+L*.7))*.3+Math.sin(th*2+t*.8)*.2;const r=R*(1+amp*.28*n+(vphase==='thinking'?.04*Math.sin(t*6):0))-L*6;const px=cx+Math.cos(th)*r,py=cx+Math.sin(th)*r;i?x.lineTo(px,py):x.moveTo(px,py)}
   x.closePath();if(L===0){const fg=x.createLinearGradient(0,0,W,W);fg.addColorStop(0,vphase==='thinking'?'#6b7cff':'#ff8a3d');fg.addColorStop(1,vphase==='thinking'?'#b46bff':'#ff3d6e');x.fillStyle=fg;x.fill()}else{x.strokeStyle=`rgba(255,255,255,${.5-L*.15})`;x.lineWidth=1.5;x.stroke()}}
  if(!$('#voice').hidden)raf=requestAnimationFrame(f)};f()}

/* ---------- boot ---------- */
setInterval(()=>{const b1=$('#b1');if(b1){b1.style.left=12+Math.random()*12+'%';b1.style.top=52+Math.random()*8+'%'}},1600);
const p=new URLSearchParams(location.search);if(p.get('d'))S.design=p.get('d');if(p.get('t'))S.theme=p.get('t');if(p.get('voice'))setTimeout(openVoice,300);
if(!VIEWS.find(v=>v[0]===S.view))S.view='home';
apply();
