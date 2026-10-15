/* RideNEMT driver — Fleetly interactive mock. Plain JS, no build. */
const P={ // lucide paths
signal:'<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>',battery:'<rect width="16" height="10" x="2" y="7" rx="2"/><path d="M22 11v2M6 11v2"/>',
nav:'<polygon points="3 11 22 2 13 21 11 13 3 11"/>',msg:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',car:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',back:'<path d="m15 18-6-6 6-6"/>',chev:'<path d="m9 18 6-6-6-6"/>',
check:'<path d="M20 6 9 17l-5-5"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',wheel:'<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1M5 8l3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6M13.76 17.5a5 5 0 0 0-6.88-6"/>',
note:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
settings:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
edit:'<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',route:'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
x:'<path d="M18 6 6 18M6 6l12 12"/>',alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',play:'<polygon points="6 3 20 12 6 21 6 3"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
plus:'<path d="M5 12h14M12 5v14"/>',minus:'<path d="M5 12h14"/>',locate:'<path d="M2 12h3M19 12h3M12 2v3M12 19v3"/><circle cx="12" cy="12" r="7"/>',
help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
fuel:'<path d="M3 22h12M4 9h10M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
mail:'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',lock:'<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
walk:'<circle cx="13" cy="4" r="2"/><path d="m7 21 3-6 3 2v4M9 11l3-3 3 3 3 1M10 15l-1-4"/>',flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
ban:'<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',userx:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5M22 8l-5 5"/>',
layers:'<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
cam:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
refresh:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
headset:'<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>'};
const I=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24">${P[n]||''}</svg>`;
const $=s=>document.querySelector(s);

/* ---------- data ---------- */
const STEPS=[['assigned','Assigned'],['en_route','En route'],['arrived','Arrived'],['picked_up','Picked up'],['in_transit','In transit'],['dropped_off','Dropped off'],['completed','Completed']];
const STEP_UI=[['Accepted','assigned'],['En route','en_route'],['Arrived','arrived'],['On board','picked_up|in_transit'],['Drop-off','dropped_off'],['Done','completed']];
const ACTION={assigned:['Accept & start trip','play'],en_route:['Arrived at pickup','pin'],arrived:['Rider picked up','user'],picked_up:['Start to drop-off','nav'],in_transit:['Arrived at drop-off','flag'],dropped_off:['Complete trip','check']};
const CHIP={assigned:['Assigned','c-v'],en_route:['En route','c-b'],arrived:['At pickup','c-o'],picked_up:['Picked up','c-pk'],in_transit:['In transit','c-b'],dropped_off:['At drop-off','c-o'],completed:['Completed','c-g'],no_show:['No-show','c-r'],cancelled:['Cancelled','c-n']};
const fresh=()=>({
 dark:localStorage.getItem('rn-theme')==='dark',authed:false,toured:false,askedLoc:false,askedNotif:false,
 tab:'trips',screen:'today',tripId:null,run:false,thread:null,editing:null,
 trips:[
 {id:1842,time:'8:30 AM',dropBy:'9:15 AM',rider:'Maria A.',phone:'(214) 555-0148',mob:'Wheelchair',mobI:'wheel',note:'Meet at the lobby door. Needs ramp, ~5 min to load.',
  pu:{a:'4100 Junius St, Dallas, TX 75226',c:[-96.7766,32.7900]},do:{a:'5201 Harry Hines Blvd, Dallas, TX 75235',c:[-96.8395,32.8130]},status:'assigned',miles:4.6,mins:14},
 {id:1857,time:'11:15 AM',dropBy:'11:45 AM',rider:'James O.',phone:'(214) 555-0193',mob:'Walker',mobI:'walk',note:'Second floor, apt 2B. Please call on arrival.',
  pu:{a:'4410 Gaston Ave, Dallas, TX 75246',c:[-96.7690,32.8006]},do:{a:'3500 Gaston Ave, Dallas, TX 75246',c:[-96.7830,32.7905]},status:'assigned',miles:1.4,mins:6},
 {id:1863,time:'2:40 PM',dropBy:'3:20 PM',rider:'Linda W.',phone:'(214) 555-0112',mob:'Ambulatory',mobI:'walk',note:'',
  pu:{a:'2727 Oak Lawn Ave, Dallas, TX 75219',c:[-96.8096,32.8113]},do:{a:'8200 Walnut Hill Ln, Dallas, TX 75231',c:[-96.7656,32.8803]},status:'assigned',miles:7.9,mins:19}],
 log:[['clock','c-v','Shift started','Vehicle VAN-12 · 6:58 AM','7:02 AM']],
 threads:[{id:'d',name:'Dispatch',sub:'North Dallas desk',unread:2,msgs:[['in','Morning! 3 trips on your board today.','7:05 AM'],['in','Maria A. needs the ramp — allow 5 min.','7:06 AM']]},
          {id:'s',name:'Driver support',sub:'App & account help',unread:0,msgs:[['in','Hi Sam, how can we help?','Yesterday']]}],
 notifs:[['bell','c-v','New trip assigned','Linda W. · 2:40 PM · Oak Lawn','7:40 AM',true],['msg','c-b','Dispatch','Maria A. needs the ramp — allow 5 min.','7:06 AM',true],['car','c-o','Vehicle check due','Pre-trip inspection for VAN-12','6:55 AM',false]],
 prefs:{tripAlerts:true,msgAlerts:true,sound:true,nav:'Google Maps',units:'Miles'},
 profile:{name:'Sam Reyes',email:'sam.reyes@ridenemt.com',phone:'(214) 555-0101',license:'TX DL •••• 4417 · exp 08/2028',company:'North Dallas NEMT',emergency:'Ana Reyes · (214) 555-0177'},
 vehicle:{unit:'VAN-12',make:'2022 Ford Transit · Wheelchair lift',plate:'TX · LKR-4821',odo:'48,112',fuel:62,checks:{Lift:true,Tires:true,Lights:false,Brakes:false,'Belts & straps':false,'First-aid kit':false}}
});
let S=fresh();
const trip=id=>S.trips.find(t=>t.id===id);
const now=()=>new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._);t._=setTimeout(()=>t.classList.remove('on'),1800)};
const spark=(pts,col)=>{const w=100,h=22,mx=Math.max(...pts),mn=Math.min(...pts),xs=pts.map((p,i)=>[i*w/(pts.length-1),h-2-(p-mn)/(mx-mn||1)*(h-4)]);const d=xs.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d} L${w} ${h} L0 ${h}Z" fill="${col}" opacity=".12"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`};

/* ---------- theme ---------- */
function applyTheme(){document.body.dataset.theme=S.dark?'dark':'light';document.documentElement.dataset.theme=S.dark?'dark':'light';document.querySelector('meta[name=theme-color]').content=S.dark?'#0D0F17':'#F3F4F8'}
function toggleTheme(){S.dark=!S.dark;localStorage.setItem('rn-theme',S.dark?'dark':'light');applyTheme();render()}
function resetDemo(){const d=S.dark;S=fresh();S.dark=d;render()}

/* ---------- nav ---------- */
function go(screen,extra={}){Object.assign(S,{screen},extra);render();$('#view').scrollTop=0}
function tab(t){S.tab=t;go({trips:'today',messages:'messages',vehicle:'vehicle',account:'account'}[t])}
function renderTabs(){const hide=['login','tour'].includes(S.screen);const tb=$('#tabs');tb.classList.toggle('hide',hide);if(hide)return;
 const un=S.threads.reduce((a,t)=>a+t.unread,0);
 tb.innerHTML=[['trips','Trips','nav'],['messages','Messages','msg'],['vehicle','Vehicle','car'],['account','Account','user']].map(([k,l,i])=>`<button class="tab ${S.tab===k?'on':''}" onclick="tab('${k}')"><span class="pill">${I(i)}</span>${l}${k==='messages'&&un?`<span class="dot">${un}</span>`:''}</button>`).join('')}

/* ---------- sheets ---------- */
function sheet(html){$('#sheet').innerHTML=html;$('#sheet-wrap').classList.add('on')}
function closeSheet(){$('#sheet-wrap').classList.remove('on')}
function callRider(id){const t=trip(id);sheet(`<div class="sheet-ic c-g">${I('phone')}</div><h2>Call ${t.rider}?</h2><p>Your number stays private — the call routes through RideNEMT's masked line.</p><div class="btns"><button class="btn ghost" style="flex:1;height:50px" onclick="closeSheet()">Cancel</button><a class="btn" style="flex:1;text-decoration:none" href="tel:${t.phone.replace(/\D/g,'')}" onclick="closeSheet();toast('Calling ${t.rider}…')">${I('phone')}Call</a></div>`)}
function openMaps(addr){sheet(`<div class="sheet-ic c-v">${I('pin')}</div><h2>Open in maps</h2><p>${addr}</p><div style="display:grid;gap:8px"><a class="btn" style="text-decoration:none" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}">${I('nav')}Google Maps</a><a class="btn sec" style="text-decoration:none" target="_blank" href="https://maps.apple.com/?daddr=${encodeURIComponent(addr)}">Apple Maps</a><a class="btn sec" style="text-decoration:none" target="_blank" href="https://waze.com/ul?q=${encodeURIComponent(addr)}&navigate=yes">Waze</a><button class="btn ghost" style="width:100%;height:46px" onclick="closeSheet()">Cancel</button></div>`)}
const addrBtn=a=>`<button class="addr" onclick="event.stopPropagation();openMaps('${a}')">${a}${I('nav')}</button>`;
function askLocation(after){sheet(`<div class="sheet-ic c-b">${I('locate')}</div><h2>Share location during trips</h2><p>RideNEMT uses your location only while a trip is active, so dispatch can see ETAs and riders know you're close. You can change this anytime in Settings.</p><button class="btn" onclick="S.askedLoc=true;closeSheet();toast('Location: while using app');(${after})()">Allow while using app</button><button class="btn ghost" style="width:100%;margin-top:8px;height:46px" onclick="S.askedLoc=true;closeSheet();toast('Location off — ETAs unavailable');(${after})()">Not now</button>`)}
function askNotif(){sheet(`<div class="sheet-ic c-v">${I('bell')}</div><h2>Get new trip alerts</h2><p>You've been assigned a trip. Turn on notifications so you don't miss new assignments, changes or dispatch messages.</p><button class="btn" onclick="S.askedNotif=true;closeSheet();toast('Notifications on')">Turn on notifications</button><button class="btn ghost" style="width:100%;margin-top:8px;height:46px" onclick="S.askedNotif=true;closeSheet()">Not now</button>`)}

/* ---------- trip logic ---------- */
function stepIndex(s){return STEP_UI.findIndex(([,k])=>k.split('|').includes(s))}
function advance(id){const t=trip(id);const go2=()=>{const i=STEPS.findIndex(s=>s[0]===t.status);const nx=STEPS[i+1][0];t.status=nx;
  const L={en_route:['nav','c-b',`En route to ${t.rider}`,'Pickup · '+t.pu.a.split(',')[0]],arrived:['pin','c-o','Arrived at pickup',t.pu.a.split(',')[0]],picked_up:['user','c-pk',`Picked up ${t.rider}`,t.mob],in_transit:['nav','c-b','In transit to drop-off',t.do.a.split(',')[0]],dropped_off:['flag','c-o','Arrived at drop-off',t.do.a.split(',')[0]],completed:['check','c-g',`Trip ${t.id} completed`,t.miles+' mi']}[nx];
  S.log.unshift([...L,now()]);toast(STEPS[i+1][1]);render()};
 if(t.status==="assigned"&&!S.askedLoc){askLocation(go2);return}
 go2()}
// askLocation stringifies callbacks; use global hook instead
askLocation=function(after){window._after=after;sheet(`<div class="sheet-ic c-b">${I('locate')}</div><h2>Share location during trips</h2><p>RideNEMT uses your location only while a trip is active so dispatch sees your ETA and riders know you're close. Change anytime in Settings.</p><button class="btn" onclick="S.askedLoc=true;closeSheet();toast('Location: while using app');window._after()">Allow while using app</button><button class="btn ghost" style="width:100%;margin-top:8px;height:46px" onclick="S.askedLoc=true;closeSheet();window._after()">Not now</button>`)};
function exception(id){sheet(`<div class="sheet-ic c-r">${I('alert')}</div><h2>Can't complete this trip?</h2><p>Dispatch is notified right away. Only mark a no-show after waiting the required 10 minutes at pickup.</p><div style="display:grid;gap:8px"><button class="btn danger" onclick="setEx(${id},'no_show')">${I('userx')}Rider no-show</button><button class="btn ghost" style="width:100%;height:50px" onclick="setEx(${id},'cancelled')">${I('ban')}Cancel trip</button><button class="btn ghost" style="width:100%;height:46px;border:0" onclick="closeSheet()">Keep trip</button></div>`)}
function setEx(id,s){const t=trip(id);t.status=s;S.log.unshift([s==='no_show'?'userx':'ban',s==='no_show'?'c-r':'c-n',(s==='no_show'?'No-show · ':'Cancelled · ')+t.rider,'Dispatch notified',now()]);closeSheet();toast(CHIP[s][0]);render()}
function setStatus(id,s){trip(id).status=s;render()}

/* ---------- screens ---------- */
const V={};
V.login=()=>`<div class="hero"><span class="logo">R</span><div><h1>Welcome back</h1><p class="sub">Sign in to see today's trips.</p></div>
 <div class="field"><label>Email or phone</label><input value="sam.reyes@ridenemt.com"><label>Password</label><input type="password" value="password123"></div>
 <button class="btn" onclick="S.authed=true;go(S.toured?'today':'tour',{step:0})">Sign in</button><button class="link" onclick="sheet('<div class=&quot;sheet-ic c-v&quot;>${I('mail').replace(/"/g,'&quot;')}</div><h2>Reset password</h2><p>We will email you a reset link.</p><input value=&quot;sam.reyes@ridenemt.com&quot;><button class=&quot;btn&quot; style=&quot;margin-top:12px&quot; onclick=&quot;closeSheet();toast(\\'Reset link sent\\')&quot;>Send link</button>')">Forgot password?</button>
 <p class="sub" style="text-align:center;margin-top:20px">Need an account? Ask your dispatcher for an invite.</p></div>`;
const TOUR=[['nav','c-v',"Today's trips","Every ride assigned to you, in order — times, pickup and drop-off, and rider needs at a glance."],['play','c-g','Accept & start','Tap a trip, then one big button walks you through each step: en route, arrived, picked up, drop-off.'],['headset','c-b','Messages & support','Dispatch and driver support are one tap away. Call riders through a private masked line.']];
V.tour=()=>{const i=S.step||0,[ic,c,t,d]=TOUR[i];return `<div class="hero" style="justify-content:flex-start"><div class="row between"><span class="sub">${i+1} of 3</span><button class="link" onclick="S.toured=true;tab('trips')">Skip</button></div>
 <div class="tour-art ${c}">${I(ic,'big')}</div><h1>${t}</h1><p class="sub" style="font-size:15.5px;line-height:1.5">${d}</p>
 <div class="dots">${TOUR.map((_,j)=>`<i class="${j===i?'on':''}"></i>`).join('')}</div>
 <div class="btns">${i?`<button class="btn ghost" style="height:50px;flex:1" onclick="S.step--;render()">Back</button>`:''}<button class="btn" style="flex:2" onclick="${i<2?'S.step++;render()':"S.toured=true;tab('trips');setTimeout(()=>!S.askedNotif&&askNotif(),500)"}">${i<2?'Next':"Let's go"}</button></div></div>`};
function tripCard(t,compact){const [l,c]=CHIP[t.status];const off=['completed','no_show','cancelled'].includes(t.status);
 return `<div class="card trip" style="${off?'opacity:.72':''}" onclick="go('trip',{tripId:${t.id}})"><div class="row between"><span class="time">${t.time}</span><span class="chip ${c}"><span class="d"></span>${l}</span></div>
 <div class="who">${t.rider} <span>· ${t.mob}</span></div>
 <div class="route"><div class="stop"><label>Pickup · ${t.time}</label>${addrBtn(t.pu.a)}</div><div class="stop drop"><label>Drop-off · by ${t.dropBy}</label>${addrBtn(t.do.a)}</div></div>
 ${t.note&&!compact?`<div class="note">${I('note')}<span>${t.note}</span></div>`:''}
 ${off?'':`<div class="tripfoot"><button class="btn sec sm" onclick="event.stopPropagation();callRider(${t.id})">${I('phone')}Call</button><button class="btn sm" style="flex:1" onclick="event.stopPropagation();go('trip',{tripId:${t.id}})">${t.status==='assigned'?'View & start':'Continue'}${I('chev')}</button></div>`}</div>`}
V.today=()=>{const done=S.trips.filter(t=>t.status==='completed').length,act=S.trips.filter(t=>!['completed','no_show','cancelled'].includes(t.status));
 const d=new Date();return `<div class="head"><div class="l"><div><h1>Today</h1><p class="sub">${d.toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'})} · your trips</p></div></div><div class="row"><button class="iconbtn" onclick="go('notifs')">${I('bell')}${S.notifs.some(n=>n[5])?'<span class="badge"></span>':''}</button><button class="avatar" onclick="tab('account')">S</button></div></div>
 <div class="kpis"><div class="kpi"><div class="k-ic c-v">${I('nav')}</div><b>${S.trips.length}</b><small>Trips today</small>${spark([2,4,3,5,4,6,S.trips.length],'#6D3BEB')}</div>
 <div class="kpi"><div class="k-ic c-g">${I('check')}</div><b>${done}</b><small>Completed</small>${spark([1,2,2,3,3,4,done+3],'#10B981')}</div>
 <div class="kpi"><div class="k-ic c-o">${I('clock')}</div><b>98%</b><small>On time</small>${spark([90,94,92,97,95,99,98],'#F59E0B')}</div></div>
 ${act.length>1?`<button class="card row" style="width:100%;text-align:left;background:linear-gradient(135deg,#7C4DFF,#5B2BD9);color:#fff" onclick="S.run=true;go('run')"><span class="lic" style="width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.18);display:grid;place-items:center">${I('route')}</span><span style="flex:1"><b style="font-size:16px">Your run · ${act.length} trips</b><small style="display:block;opacity:.85;margin-top:2px">${act.reduce((a,t)=>a+t.miles,0).toFixed(1)} mi · ${act[0].time} – ${act[act.length-1].dropBy}</small></span>${I('chev')}</button>`:''}
 <div class="sectitle"><h2>Trips</h2><span class="sub">${act.length} left</span></div>
 ${S.trips.map(t=>tripCard(t,true)).join('')}
 <div class="card"><div class="sectitle"><h2>Activity</h2><span class="live">Live</span></div>${S.log.slice(0,6).map(([i,c,t,s,tm])=>`<div class="act"><span class="ai ${c}">${I(i)}</span><span class="at">${t}<small>${s}</small></span><time>${tm}</time></div>`).join('')}</div>`};
V.trip=()=>{const t=trip(S.tripId);const [l,c]=CHIP[t.status];const ex=['no_show','cancelled'].includes(t.status);const si=stepIndex(t.status);
 const tgt=['assigned','en_route','arrived'].includes(t.status)?'pu':'do';
 return `<div class="head"><div class="l"><button class="iconbtn" onclick="go(S.run?'run':'today')">${I('back')}</button><div style="min-width:0"><h1 style="font-size:24px">${t.rider}</h1><p class="sub">Trip ${t.id} · ${t.mob}</p></div></div><button class="btn sec sm" onclick="callRider(${t.id})">${I('phone')}Call</button></div>
 <div class="map" id="map"><div class="mo tag"><span class="chip ${c}" style="padding:2px 0;background:none"><span class="d"></span>${l}</span></div><div class="mo eta">${tgt==='pu'?'To pickup':'To drop-off'}<small>${t.mins} min · ${t.miles} mi</small></div><div class="mo ctl"><button onclick="M&&M.zoomIn()">${I('plus')}</button><button onclick="M&&M.zoomOut()">${I('minus')}</button><button onclick="fitMap()">${I('locate')}</button></div></div>
 <div class="card">${ex?`<div class="row"><span class="lic ${c}" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center">${I(t.status==='no_show'?'userx':'ban')}</span><div style="flex:1"><b>${t.status==='no_show'?'Marked as no-show':'Trip cancelled'}</b><p class="sub">Dispatch has been notified.</p></div><button class="btn ghost" onclick="setStatus(${t.id},'assigned')">Undo</button></div>`
 :`<div class="stepper">${STEP_UI.map(([lb],j)=>`<div class="st ${j<si||t.status==='completed'?'done':j===si?'cur':''}"><i>${j<si||t.status==='completed'?I('check'):''}</i>${lb}</div>`).join('')}</div>`}</div>
 ${t.note?`<div class="card"><div class="row" style="align-items:flex-start">${'<span class="lic c-o" style="width:36px;height:36px;border-radius:11px;display:grid;place-items:center;flex:none">'+I('note')+'</span>'}<div><b>Ride note</b><p class="sub" style="font-size:14px;color:var(--ink);margin-top:3px">${t.note}</p></div></div></div>`:''}
 <div class="card"><div class="route" style="margin-top:0"><div class="stop"><label>Pickup · ${t.time}</label>${addrBtn(t.pu.a)}</div><div class="stop drop"><label>Drop-off · by ${t.dropBy}</label>${addrBtn(t.do.a)}</div></div></div>
 <div class="card"><dl class="kv"><dt>Mobility</dt><dd>${t.mob}</dd><dt>Distance</dt><dd>${t.miles} mi · ~${t.mins} min</dd><dt>Rider phone</dt><dd><button class="link" onclick="callRider(${t.id})">${t.phone}</button></dd></dl></div>
 ${ACTION[t.status]?`<div class="sticky"><button class="btn" onclick="advance(${t.id})">${I(ACTION[t.status][1])}${ACTION[t.status][0]}</button>${['assigned','en_route','arrived'].includes(t.status)?`<button class="btn ghost" style="width:100%;margin-top:8px;height:44px;border:0;background:none;color:var(--r)" onclick="exception(${t.id})">No-show or cancel</button>`:''}</div>`
 :t.status==='completed'?`<div class="card row" style="background:var(--gs)"><span style="color:var(--g)">${I('check')}</span><b style="color:var(--g)">Trip completed · ${t.miles} mi</b></div><button class="btn" onclick="nextTrip()">Next trip${I('chev')}</button>`:''}`};
function nextTrip(){const n=S.trips.find(t=>!['completed','no_show','cancelled'].includes(t.status));n?go('trip',{tripId:n.id}):go('today')}
V.run=()=>{const ts=S.trips;const act=ts.filter(t=>!['completed','no_show','cancelled'].includes(t.status));const cur=act[0];let n=0;
 return `<div class="head"><div class="l"><button class="iconbtn" onclick="S.run=false;go('today')">${I('back')}</button><div><h1 style="font-size:24px">Your run</h1><p class="sub">${ts.length} trips · ${ts.reduce((a,t)=>a+t.miles,0).toFixed(1)} mi total</p></div></div><span class="chip c-v">${ts.length-act.length}/${ts.length} done</span></div>
 <div class="map" id="map"><div class="mo eta">${cur?'Next: '+cur.rider:'Run complete'}<small>${cur?cur.time+' · '+cur.pu.a.split(',')[0]:'Nice work'}</small></div><div class="mo ctl"><button onclick="M&&M.zoomIn()">${I('plus')}</button><button onclick="M&&M.zoomOut()">${I('minus')}</button><button onclick="fitMap()">${I('locate')}</button></div></div>
 <div class="card runlist"><div class="sectitle"><h2>Stops in order</h2><span class="live">Live</span></div>${ts.map(t=>{const off=['completed','no_show','cancelled'].includes(t.status);return [['pu','Pickup',t.time],['do','Drop-off','by '+t.dropBy]].map(([k,lb,tm])=>{n++;return `<div class="rs" style="${off?'opacity:.55':''}"><span class="n ${off?'c-g':k==='pu'?'c-v':'c-b'}">${off?I('check'):n}</span><div style="flex:1;min-width:0"><div class="row between"><b>${lb} · ${t.rider}</b><span class="sub" style="margin:0">${tm}</span></div>${addrBtn(t[k].a)}<p class="sub">${t.mob}</p></div></div>`}).join('')}).join('')}</div>
 ${cur?`<div class="sticky"><button class="btn" onclick="go('trip',{tripId:${cur.id}})">${I('play')}${cur.status==='assigned'?'Start run · '+cur.rider:'Continue · '+cur.rider}</button></div>`:`<button class="btn" onclick="S.run=false;go('today')">Back to Today</button>`}`};
V.messages=()=>`<div class="head"><div><h1>Messages</h1><p class="sub">Dispatch and support only</p></div><button class="iconbtn" onclick="go('notifs')">${I('bell')}</button></div>
 <div class="card">${S.threads.map(t=>`<button class="li" onclick="t_open('${t.id}')"><span class="avatar" style="width:44px;height:44px;${t.id==='s'?'background:linear-gradient(135deg,#60A5FA,#3B82F6)':''}">${I(t.id==='d'?'headset':'help')}</span><span class="t">${t.name}<small>${t.msgs[t.msgs.length-1][1]}</small></span>${t.unread?`<span class="chip c-v">${t.unread}</span>`:`<span class="sub">${t.msgs[t.msgs.length-1][2]}</span>`}</button>`).join('')}</div>
 <div class="card row"><span class="lic c-r" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center">${I('phone')}</span><div style="flex:1"><b>Urgent?</b><p class="sub">Call dispatch directly</p></div><a class="btn sm" style="text-decoration:none" href="tel:2145550100">Call</a></div>`;
function t_open(id){S.thread=id;S.threads.find(t=>t.id===id).unread=0;go('thread')}
V.thread=()=>{const t=S.threads.find(x=>x.id===S.thread);return `<div class="head"><div class="l"><button class="iconbtn" onclick="go('messages')">${I('back')}</button><div><h2>${t.name}</h2><p class="sub">${t.sub} · <span class="live">online</span></p></div></div></div>
 <div id="msgs">${t.msgs.map(([d,m,tm])=>`<div class="bub ${d}">${m}<time>${tm}</time></div>`).join('')}</div>
 <div class="composer" style="flex-direction:column"><div class="quick">${["Running 5 min late","Arrived at pickup","Rider not answering","On my way"].map(q=>`<button onclick="sendMsg('${q}')">${q}</button>`).join('')}</div><div class="row"><input id="mi" placeholder="Message ${t.name}…" onkeydown="if(event.key==='Enter')sendMsg()"><button onclick="sendMsg()">${I('send')}</button></div></div>`};
function sendMsg(q){const v=q||$('#mi').value.trim();if(!v)return;const t=S.threads.find(x=>x.id===S.thread);t.msgs.push(['out',v,now()]);render();setTimeout(()=>{t.msgs.push(['in',t.id==='d'?'Got it, thanks Sam 👍':'Thanks — looking into it now.',now()]);if(S.screen==='thread'){render();$('#view').scrollTop=1e5}},1100);$('#view').scrollTop=1e5}
V.vehicle=()=>{const v=S.vehicle,ck=Object.entries(v.checks),done=ck.filter(c=>c[1]).length;return `<div class="head"><div><h1>Vehicle</h1><p class="sub">Assigned for today's shift</p></div><span class="chip c-g"><span class="d"></span>Active</span></div>
 <div class="card"><div class="row"><span class="lic c-v" style="width:52px;height:52px;border-radius:14px;display:grid;place-items:center">${I('car')}</span><div><h2>${v.unit}</h2><p class="sub">${v.make}</p></div></div>
 <div class="grid2" style="margin-top:14px"><div class="kpi" style="box-shadow:none;background:var(--soft)"><div class="k-ic c-b">${I('gauge')}</div><b>${v.odo}</b><small>Odometer (mi)</small></div><div class="kpi" style="box-shadow:none;background:var(--soft)"><div class="k-ic c-o">${I('fuel')}</div><b>${v.fuel}%</b><small>Fuel</small><div style="height:6px;border-radius:3px;background:var(--line);margin-top:8px"><div style="width:${v.fuel}%;height:100%;border-radius:3px;background:var(--o)"></div></div></div></div>
 <dl class="kv" style="margin-top:14px"><dt>Plate</dt><dd>${v.plate}</dd><dt>Capacity</dt><dd>1 wheelchair · 4 seated</dd></dl></div>
 <div class="card"><div class="sectitle"><h2>Pre-trip inspection</h2><span class="chip ${done===ck.length?'c-g':'c-o'}">${done}/${ck.length}</span></div>${ck.map(([k,on])=>`<button class="li" onclick="S.vehicle.checks['${k}']=!S.vehicle.checks['${k}'];render()"><span class="lic ${on?'c-g':'c-n'}">${I(on?'check':'clock')}</span><span class="t">${k}</span><span class="sw ${on?'on':''}"></span></button>`).join('')}
 <button class="btn" style="margin-top:12px" ${done<ck.length?'disabled style="margin-top:12px;opacity:.5"':''} onclick="toast('Inspection submitted')">Submit inspection</button></div>
 <div class="card"><button class="li" onclick="sheet('<div class=&quot;sheet-ic c-r&quot;>${I('wrench').replace(/"/g,'&quot;')}</div><h2>Report an issue</h2><p>Dispatch and fleet will be notified.</p><textarea rows=3 placeholder=&quot;What is wrong?&quot;></textarea><button class=&quot;btn&quot; style=&quot;margin-top:12px&quot; onclick=&quot;closeSheet();toast(\\'Issue reported\\')&quot;>Send report</button>')"><span class="lic c-r">${I('wrench')}</span><span class="t">Report an issue<small>Damage, warning light, lift problem</small></span>${I('chev','chev')}</button></div>`};
const SECT={personal:['Personal info','user','c-v',[['name','Full name'],['phone','Phone'],['email','Email']]],license:['License & company','file','c-b',[['license','Driver license'],['company','Company']]],emergency:['Emergency contact','shield','c-r',[['emergency','Contact']]]};
V.account=()=>{const p=S.profile,done=S.trips.filter(t=>t.status==='completed'),mi=done.reduce((a,t)=>a+t.miles,0);
 return `<div class="head"><div><h1>Account</h1><p class="sub">Your profile and stats</p></div><button class="iconbtn" onclick="go('settings')">${I('settings')}</button></div>
 <div class="card row"><span class="avatar" style="width:56px;height:56px;font-size:20px">SR</span><div style="flex:1"><h2>${p.name}</h2><p class="sub">${p.company} · Driver</p></div><span class="chip c-g"><span class="d"></span>On shift</span></div>
 <div class="kpis"><div class="kpi"><div class="k-ic c-v">${I('nav')}</div><b>${done.length}/${S.trips.length}</b><small>Trips today</small>${spark([3,5,4,6,5,6,S.trips.length],'#6D3BEB')}</div><div class="kpi"><div class="k-ic c-g">${I('clock')}</div><b>98%</b><small>On-time</small>${spark([91,93,96,94,97,98,98],'#10B981')}</div><div class="kpi"><div class="k-ic c-b">${I('route')}</div><b>${mi.toFixed(1)}</b><small>Miles today</small>${spark([18,22,15,30,26,24,mi||2],'#3B82F6')}</div></div>
 ${Object.entries(SECT).map(([k,[t,ic,c,f]])=>`<div class="card"><div class="sectitle"><div class="row"><span class="lic ${c}" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center">${I(ic)}</span><h2>${t}</h2></div>${S.editing===k?'':`<button class="btn ghost sm" onclick="S.editing='${k}';render()">${I('edit')}Edit</button>`}</div>
 ${S.editing===k?`${f.map(([fk,fl])=>`<div class="field"><label>${fl}</label><input id="f-${fk}" value="${p[fk]}"></div>`).join('')}<div class="btns" style="margin-top:12px"><button class="btn ghost" style="flex:1;height:46px" onclick="S.editing=null;render()">Cancel</button><button class="btn" style="flex:1;height:46px" onclick="saveSect('${k}')">Save</button></div>`
 :`<dl class="kv">${f.map(([fk,fl])=>`<dt>${fl}</dt><dd>${p[fk]}</dd>`).join('')}</dl>`}</div>`).join('')}
 <div class="card">${[['settings','Settings','c-n',"go('settings')"],['bell','Notifications','c-v',"go('notifs')"],['refresh','Replay app tour','c-b',"S.step=0;go('tour')"],['logout','Sign out','c-r',"S.authed=false;go('login')"]].map(([i,l,c,a])=>`<button class="li" onclick="${a}"><span class="lic ${c}">${I(i)}</span><span class="t">${l}</span>${I('chev','chev')}</button>`).join('')}</div>`};
function saveSect(k){SECT[k][3].forEach(([fk])=>S.profile[fk]=$('#f-'+fk).value);S.editing=null;toast('Saved');render()}
V.settings=()=>{const p=S.prefs;const sw=(k,l,s)=>`<button class="li" onclick="S.prefs.${k}=!S.prefs.${k};render()"><span class="t">${l}<small>${s}</small></span><span class="sw ${p[k]?'on':''}"></span></button>`;
 return `<div class="head"><div class="l"><button class="iconbtn" onclick="tab('account')">${I('back')}</button><h1 style="font-size:24px">Settings</h1></div></div>
 <div class="sectitle"><h2>Appearance</h2></div><div class="seg"><button class="${S.dark?'':'on'}" onclick="S.dark&&toggleTheme()">${I('sun')} Light</button><button class="${S.dark?'on':''}" onclick="!S.dark&&toggleTheme()">${I('moon')} Dark</button></div>
 <div class="card">${sw('tripAlerts','New trip alerts','Assignments and changes')}${sw('msgAlerts','Message alerts','Dispatch and support')}${sw('sound','Alert sound','Play a sound for new trips')}</div>
 <div class="card"><button class="li" onclick="cycleNav()"><span class="t">Navigation app<small>Used when you tap an address</small></span><span class="sub">${p.nav}</span>${I('chev','chev')}</button><button class="li" onclick="askLocation(()=>{})"><span class="t">Location access<small>${S.askedLoc?'While using the app':'Not set yet'}</small></span>${I('chev','chev')}</button><button class="li" onclick="askNotif()"><span class="t">Notifications permission<small>${S.askedNotif?'Allowed':'Not set yet'}</small></span>${I('chev','chev')}</button></div>
 <div class="card"><button class="li" onclick="go('login',{authed:false})"><span class="t">Change password</span>${I('chev','chev')}</button><button class="li"><span class="t">Privacy policy</span>${I('chev','chev')}</button><button class="li"><span class="t">App version<small>2.4.0 (mock)</small></span></button></div>`};
function cycleNav(){const o=['Google Maps','Apple Maps','Waze'];S.prefs.nav=o[(o.indexOf(S.prefs.nav)+1)%3];render()}
V.notifs=()=>`<div class="head"><div class="l"><button class="iconbtn" onclick="go(S.tab==='messages'?'messages':'today')">${I('back')}</button><h1 style="font-size:24px">Notifications</h1></div><button class="link" onclick="S.notifs.forEach(n=>n[5]=false);render()">Mark all read</button></div>
 <div class="card">${S.notifs.map(([i,c,t,s,tm,u])=>`<div class="act"><span class="ai ${c}">${I(i)}</span><span class="at">${t}${u?' <span style="color:var(--v)">•</span>':''}<small>${s}</small></span><time>${tm}</time></div>`).join('')}</div>`;

/* ---------- map ---------- */
let M=null;const routeCache={};
async function route(a,b){const k=a+'|'+b;if(routeCache[k])return routeCache[k];try{const r=await fetch(`https://router.project-osrm.org/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`);const j=await r.json();return routeCache[k]=j.routes[0].geometry.coordinates}catch(e){return routeCache[k]=[a,b]}}
function fitMap(){if(!M||!M._pts)return;const b=new maplibregl.LngLatBounds();M._pts.forEach(p=>b.extend(p));M.fitBounds(b,{padding:50,pitch:58,bearing:-20,duration:600})}
function marker(c,col,lbl){const e=document.createElement('div');e.style.cssText=`width:30px;height:30px;border-radius:50%;background:${col};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);color:#fff;font:700 12px Inter;display:grid;place-items:center`;e.textContent=lbl;return new maplibregl.Marker({element:e}).setLngLat(c).addTo(M)}
async function mountMap(){const el=$('#map');if(M){M.remove();M=null}if(!el||!window.maplibregl)return;
 const segs=S.screen==='run'?S.trips.map(t=>[t.pu.c,t.do.c]):[[trip(S.tripId).pu.c,trip(S.tripId).do.c]];
 M=new maplibregl.Map({container:el,style:'https://tiles.openfreemap.org/styles/'+(S.dark?'dark':'positron'),center:segs[0][0],zoom:13,pitch:58,bearing:-20,attributionControl:{compact:true},interactive:true});
 const m=M;m.on('load',async()=>{
  try{if(!m.getLayer('b3d'))m.addLayer({id:'b3d',type:'fill-extrusion',source:'openmaptiles','source-layer':'building',minzoom:13,paint:{'fill-extrusion-color':S.dark?'#2A2F42':'#E4E6EE','fill-extrusion-height':['coalesce',['get','render_height'],10],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':.9}})}catch(e){}
  const pts=[];let coords=[];for(const [a,b] of segs){const r=await route(a,b);coords=coords.concat(r);pts.push(a,b)}
  if(m!==M)return;m._pts=pts;
  m.addSource('rt',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:coords}}});
  m.addLayer({id:'rt-c',type:'line',source:'rt',paint:{'line-color':'#fff','line-width':9,'line-opacity':S.dark?.15:.9},layout:{'line-cap':'round','line-join':'round'}});
  m.addLayer({id:'rt',type:'line',source:'rt',paint:{'line-color':'#7C4DFF','line-width':5},layout:{'line-cap':'round','line-join':'round'}});
  if(S.screen==='run'){let n=0;segs.forEach(([a,b])=>{marker(a,'#6D3BEB',++n);marker(b,'#3B82F6',++n)})}else{marker(segs[0][0],'#6D3BEB','P');marker(segs[0][1],'#3B82F6','D')}
  fitMap()})}

/* ---------- render ---------- */
const JUMP=[['Login',()=>{S.authed=false;go('login')}],['Tour 1/3',()=>go('tour',{step:0})],['Tour 3/3',()=>go('tour',{step:2})],['Today',()=>tab('trips')],['Run',()=>go('run',{tab:'trips',run:true})],
 ...['assigned','en_route','arrived','picked_up','in_transit','dropped_off','completed','no_show','cancelled'].map(s=>['Trip · '+CHIP[s][0],()=>{trip(1842).status=s;go('trip',{tab:'trips',tripId:1842,run:false})}]),
 ['Messages',()=>tab('messages')],['Chat',()=>{S.tab='messages';t_open('d')}],['Vehicle',()=>tab('vehicle')],['Account',()=>tab('account')],['Edit section',()=>{S.editing='personal';tab('account')}],['Settings',()=>go('settings',{tab:'account'})],['Notifications',()=>go('notifs')],
 ['Location ask',()=>{tab('trips');askLocation(()=>{})}],['Notification ask',()=>{tab('trips');askNotif()}],['Call sheet',()=>{tab('trips');callRider(1842)}],['Map sheet',()=>{tab('trips');openMaps(trip(1842).pu.a)}],['No-show sheet',()=>{trip(1842).status='arrived';go('trip',{tripId:1842});exception(1842)}]];
function render(){applyTheme();closeSheet.call&&0;const v=$('#view');v.innerHTML=V[S.screen]();renderTabs();if(['trip','run'].includes(S.screen))mountMap();else if(M){M.remove();M=null}
 if(S.screen==='thread')v.scrollTop=1e5}
$('#jump').innerHTML=JUMP.map(([l],i)=>`<button onclick="closeSheet();JUMP[${i}][1]()">${l}</button>`).join('');
document.querySelectorAll('[data-i]').forEach(e=>e.outerHTML=I(e.dataset.i));
const q=new URLSearchParams(location.search);if(q.get('theme'))S.dark=q.get('theme')==='dark';
if(q.get('s')){S.authed=true;S.toured=true;S.askedLoc=true;S.askedNotif=true;const j=JUMP.find(x=>x[0].toLowerCase().replace(/\W/g,'')===q.get('s'));j?j[1]():render()}else render();
