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
Object.assign(P,{
cal:'<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
pen:'<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/>',
compose:'<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.38 2.62a1 1 0 0 1 3 3L12.36 14.64a2 2 0 0 1-.85.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/>',
building:'<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
eyeoff:'<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20M9.88 9.88a3 3 0 1 0 4.24 4.24"/>',
idcard:'<rect width="20" height="14" x="2" y="5" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4M14 14h4"/>',
heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
access:'<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1M5 8l3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6M13.76 17.5a5 5 0 0 0-6.88-6"/>',
bed:'<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',dollar:'<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',map:'<path d="M14.1 6.3 9.9 4.2a2 2 0 0 0-1.8 0L3.6 6.5a1 1 0 0 0-.6.9v12.4a1 1 0 0 0 1.4.9l4.1-2a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.3a1 1 0 0 0 .6-.9V5.2a1 1 0 0 0-1.4-.9l-4.1 2a2 2 0 0 1-1.8 0zM9 4v14M15 6v14"/>',
arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',hand:'<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',swap:'<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>',
asterisk:'<path d="M12 6v12M17.2 9l-10.4 6M6.8 9l10.4 6"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',checkcheck:'<path d="M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16"/>',
inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
key:'<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4M21 2l-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>'});
const $=s=>document.querySelector(s);
/* ===== data mirrors the real app (ridecuro-local) ===== */
const FLOW=['assigned','en_route_dropoff','arrived_dropoff','completed'];
// Real app (theme.js DRIVER_STEPS): 3 steps / 3 actions — Pickup, Arrive, Dropoff
const STEPS=[['Pickup',['assigned']],['Arrive',['en_route_dropoff']],['Dropoff',['arrived_dropoff']]];
const ST={assigned:['Assigned','c-v'],en_route_dropoff:['To drop-off','c-b'],arrived_dropoff:['At drop-off','c-b'],completed:['Completed','c-g'],cancelled:['Cancelled','c-n'],no_show:['No Show','c-r'],missed:['Missed','c-r']};
const BANNER={assigned:['amber','clock','Waiting to start — head to the pickup'],arrived_dropoff:['blue','check',"You're at the drop-off"],completed:['green','check','Trip completed successfully'],no_show:['red','eyeoff','Marked as no show'],cancelled:['red','x','Trip cancelled']};
const ACT={assigned:['Pickup','user','green'],en_route_dropoff:['Arrive','flag','blue'],arrived_dropoff:['Dropoff','checkcheck','blue']};
const pastT=(id,d,first,last,pu,doo,st,t)=>({id,day:d,time:t,first,last,pu,do:doo,status:st,appt:'',miles:0,pay:''});
const fresh=()=>({dark:localStorage.getItem('rn-theme')==='dark',authed:true,toured:true,tab:'trips',screen:'today',ttab:'today',pf:'all',todayEmpty:false,tripId:null,editing:false,step:0,
 trips:[{id:'FULL073397-14',day:'Thu, Oct 15',time:'9:30 PM',appt:'9:00 AM',first:'Kenneth',last:'Abrams',phone:'(817) 555-0142',until:'in 1h 25m',mob:'Ambulatory',miles:9.8,mins:18,pay:'$38.50',
   pu:{a:'5109 Boat Club Rd, Fort Worth, TX 76135',c:[-97.4239,32.8248]},do:{a:'900 8th Ave, Fort Worth, TX 76104',c:[-97.3434,32.7395]},status:'assigned',note:''}],
 upcoming:[],
 past:[Object.assign(pastT('FULL073397-14','Thu, Oct 1, 2026','Kenneth','Abrams',{a:'5109 Boat Club Rd, Fort Worth, TX 76135'},{a:'900 8th Ave, Fort Worth, TX 76104'},'missed','9:30 PM'),{appt:'9:00 AM'}),
  pastT('FULL073311-02','Wed, Sep 30, 2026','Gloria','Mendez',{a:'3200 Hulen St, Fort Worth, TX 76107'},{a:'1500 S Main St, Fort Worth, TX 76104'},'completed','10:15 AM'),
  pastT('FULL073298-07','Tue, Sep 29, 2026','Dwayne','Ellis',{a:'6100 Camp Bowie Blvd, Fort Worth, TX 76116'},{a:'1400 8th Ave, Fort Worth, TX 76104'},'completed','8:00 AM'),
  pastT('FULL073277-11','Mon, Sep 28, 2026','Rosa','Delgado',{a:'2401 N Main St, Fort Worth, TX 76164'},{a:'800 5th Ave, Fort Worth, TX 76104'},'completed','1:30 PM'),
  pastT('FULL073250-03','Fri, Sep 25, 2026','Harold','Kim',{a:'4800 Altamesa Blvd, Fort Worth, TX 76133'},{a:'1301 Pennsylvania Ave, Fort Worth, TX 76104'},'no_show','11:00 AM'),
  pastT('FULL073231-09','Thu, Sep 24, 2026','Evelyn','Brooks',{a:'7300 Grapevine Hwy, North Richland Hills, TX 76180'},{a:'900 8th Ave, Fort Worth, TX 76104'},'completed','9:45 AM'),
  pastT('FULL073219-05','Wed, Sep 23, 2026','Marcus','Ford',{a:'5400 Wedgmont Cir N, Fort Worth, TX 76133'},{a:'1201 Summit Ave, Fort Worth, TX 76102'},'cancelled','3:00 PM'),
  pastT('FULL073201-01','Tue, Sep 22, 2026','Linda','Tran',{a:'1700 W Rosedale St, Fort Worth, TX 76104'},{a:'3255 W Pioneer Pkwy, Arlington, TX 76013'},'completed','7:30 AM')],
 company:'Habibi Fleets',
 profile:{first:'Michael',last:'Nguyen',phone:'555-010-8801',dob:'—',address:'—',city:'—',state:'TX',zip:'—',license:'QPXNEAR001407',driverId:'2b788e65'},
 docs:[['Driver License','idcard'],['Vehicle Insurance','shield'],['Vehicle Registration','file'],['Medical Certificate','asterisk'],['Background Check','search']].map(([n,i])=>({n,i,st:'none'})),
 sig:true,
 vehicle:{plate:'ABCD-123',name:'2025 Toyota Sienna',color:'White',type:'Minivan',seats:4,wheel:true,stretch:false,assign:'Private assignment',comp:[['Insurance','Not set'],['Registration','Not set'],['Inspection','Not set']],synced:'7:35 PM'},
 prefs:{gps:true,assign:true,msgs:true,remind:true,remindAt:'30 min'},
 threads:[{id:'amo',name:'amo king',role:'Admin',msgs:[['out','Yoo','Jul 17','read']],unread:0}],thread:null,
 stats:{total:19,month:0}});
let S=fresh();
const trip=()=>S.trips.find(t=>t.id===S.tripId)||S.trips[0];
const ini=t=>`${t.first} ${t.last[0]}.`;
const now=()=>new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._);t._=setTimeout(()=>t.classList.remove('on'),1800)};
const spark=(pts,col)=>{const w=100,h=20,mx=Math.max(...pts),mn=Math.min(...pts),xs=pts.map((p,i)=>[i*w/(pts.length-1),h-2-(p-mn)/(mx-mn||1)*(h-4)]);const d=xs.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d} L${w} ${h} L0 ${h}Z" fill="${col}" opacity=".12"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>`};
const chip=s=>`<span class="chip ${ST[s][1]}"><span class="d"></span>${ST[s][0]}</span>`;
const ic=(n,c,sz)=>`<span class="lic ${c}" ${sz?`style="width:${sz}px;height:${sz}px"`:''}>${I(n)}</span>`;
function applyTheme(){document.body.dataset.theme=S.dark?'dark':'light';document.querySelector('meta[name=theme-color]').content=S.dark?'#0E1018':'#F4F5F9'}
function toggleTheme(){setTheme(!S.dark)}
function setTheme(d){S.dark=d;localStorage.setItem('rn-theme',d?'dark':'light');render()}
function resetDemo(){const d=S.dark;S=fresh();S.dark=d;render()}
function go(screen,extra={}){Object.assign(S,{screen},extra);render();$('#view').scrollTop=0}
function tab(t){S.tab=t;go({trips:'today',messages:'messages',vehicle:'vehicle',profile:'account'}[t])}
function renderTabs(){const hide=['tour','login'].includes(S.screen);$('#tabs').classList.toggle('hide',hide);if(hide)return;
 $('#tabs').innerHTML=[['trips','Trips','nav'],['messages','Messages','msg'],['vehicle','Vehicle','car'],['profile','Profile','user']].map(([k,l,i])=>`<button class="tab ${S.tab===k?'on':''}" onclick="tab('${k}')"><span class="pill">${I(i)}</span>${l}</button>`).join('')}
function sheet(h){$('#sheet').innerHTML=h;$('#sheet-wrap').classList.add('on')}
function closeSheet(){$('#sheet-wrap').classList.remove('on')}
function confirmSheet(icn,c,title,body,okLabel,okCls,fn){window._ok=fn;sheet(`<div class="sheet-ic ${c}">${I(icn)}</div><h2>${title}</h2><p>${body}</p><div class="btns"><button class="btn ghost" style="flex:1;height:50px" onclick="closeSheet()">Cancel</button><button class="btn ${okCls||''}" style="flex:1" onclick="closeSheet();window._ok()">${okLabel}</button></div>`)}
function openMaps(a){sheet(`<div class="sheet-ic c-v">${I('map')}</div><h2>Open in Maps</h2><p>${a}</p><div style="display:grid;gap:8px"><a class="btn" style="text-decoration:none" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a)}">${I('nav')}Google Maps</a><a class="btn sec" style="text-decoration:none" target="_blank" href="https://waze.com/ul?q=${encodeURIComponent(a)}&navigate=yes">Waze</a><button class="btn ghost" style="width:100%;height:46px" onclick="closeSheet()">Cancel</button></div>`)}
const addr=(a,k)=>`<button class="addr" onclick="event.stopPropagation();openMaps('${a}')">${a}</button>`;
const head=(eyebrow,title,{back,right}={})=>`<div class="head"><div class="l">${back?`<button class="iconbtn" onclick="${back}">${I('back')}</button>`:''}<div style="min-width:0">${eyebrow?`<div class="eyebrow">${eyebrow}</div>`:''}<h1 class="${back?'h1s':''}">${title}</h1></div></div>${right||''}</div>`;
const route=(t)=>`<div class="route"><div class="stop pu"><label>Pickup${t.time?' · '+t.time:''}</label>${addr(t.pu.a)}</div><div class="stop do"><label>Drop-off</label>${addr(t.do.a)}</div></div>`;

/* ===== screens ===== */
const V={};
const TOUR=[
 ["Today's trips",'Assignments for today show up here with the time, the rider, and both addresses.',()=>`<div class="tcard"><div class="row between"><b style="font-size:20px">9:30 AM</b><span class="chip c-v">Assigned</span></div><b style="margin-top:6px;display:block">Maria G.</b><div class="row" style="gap:6px;margin:8px 0 12px"><span class="chip c-v">${I('access')}Wheelchair</span><span class="chip c-n">${I('nav')}4.2 mi</span></div><div class="route" style="margin:0"><div class="stop pu"><label>Pickup</label><b>900 8th Ave</b></div><div class="stop do"><label>Drop-off</label><b>Baylor Clinic</b></div></div></div>`],
 ['Accept and start a trip','Open a trip and use the big button. It always shows the next step.',()=>`<div class="tsteps">${[['Start trip','c-g',1],['Arrived','c-o',1],['Picked up','c-v',0],['Completed','c-n',0]].map(([l,c,d],i)=>`<div class="tstep ${i===2?'cur':''}"><span class="lic ${d?'c-g':c}" style="width:28px;height:28px">${d?I('check'):i+1}</span><b>${l}</b>${i===2?I('hand'):''}</div>`).join('')}</div>`],
 ['Messages and support','Dispatch is in Messages. You can reach them without leaving the app.',()=>`<div class="tdisp"><div class="tbub">${ic('clock','c-g',30)}<div><small>Dispatch sees</small><b>ETA 12 min</b></div></div><svg viewBox="0 0 260 80" class="tdots"><path d="M10 20 C80 70 160 70 240 30" stroke="currentColor" stroke-width="3" stroke-dasharray="1 12" stroke-linecap="round" fill="none"/></svg><div class="tbub out">On my way ${I('check')}</div></div>`]];
V.tour=()=>{const i=S.step,[t,d,art]=TOUR[i];return `<div class="hero" style="justify-content:flex-start;gap:0">
 <div class="row between" style="margin-bottom:14px"><button class="iconbtn" style="visibility:${i?'visible':'hidden'}" onclick="S.step--;render()">${I('back')}</button><div class="dots" style="margin:0">${TOUR.map((_,j)=>`<i class="${j===i?'on':''}"></i>`).join('')}</div><button class="link" onclick="S.toured=true;tab('trips')">Skip</button></div>
 <div class="tour-art">${art()}</div><h1 style="margin-top:24px">${t}</h1><p class="sub" style="font-size:16px;line-height:1.5;margin-top:8px">${d}</p><div style="flex:1"></div>
 <button class="btn" style="margin-top:24px" onclick="${i<2?'S.step++;render()':"S.toured=true;tab('trips')"}">${i<2?'Next':'Go to my trips'}${I('arrow')}</button>
 ${i===2?`<button class="btn ghost" style="width:100%;margin-top:8px;height:46px;border:0;background:none" onclick="S.toured=true;go('trip',{tab:'trips',tripId:S.trips[0].id})">Try a practice trip first</button>`:''}</div>`};
function tripCard(t,past){const s=t.status;return `<div class="card trip" onclick="${past?'':`go('trip',{tripId:'${t.id}'})`}">
 <div class="row between"><div><div class="time">${t.time}</div>${past?`<div class="sub">${t.day}</div>`:`<div class="sub" style="color:var(--v);font-weight:600">${t.until||''}</div>`}</div>${chip(s)}</div>
 <div class="who">${ini(t)} <span>· #${t.id}</span></div>${route(t)}
 ${t.appt?`<div class="metarow"><span class="chip c-v">${I('cal')}Appt: ${t.appt}</span></div>`:''}${past?'':`<div class="metarow">${t.mob?`<span class="chip c-n">${I('asterisk')}${t.mob}</span>`:''}${t.miles?`<span class="chip c-n">${I('nav')}${t.miles} mi</span>`:''}</div>`}</div>`}
V.today=()=>{const list=S.ttab==='today'?(S.todayEmpty?[]:S.multi?RUNT.map(t=>Object.assign({day:'Thu, Oct 15',appt:'',miles:'',status:'assigned',until:''},t)):S.trips):S.upcoming;const d=new Date();
 return head(S.company,'Trips',{right:`<button class="iconbtn" onclick="go('past')">${I('history')}</button>`})+
 `<div class="seg"><button class="${S.ttab==='today'?'on':''}" onclick="S.ttab='today';render()">Today <span class="cnt">${S.todayEmpty?0:S.trips.length}</span></button><button class="${S.ttab==='future'?'on':''}" onclick="S.ttab='future';render()">Upcoming <span class="cnt">${S.upcoming.length}</span></button></div>
 <div class="kpis"><div class="kpi"><div class="kt"><small>Today</small><span class="kd" style="background:var(--v)"></span></div><b>${S.todayEmpty?0:S.trips.length}</b>${spark([1,2,1,3,2,1,S.todayEmpty?0:1],'#6D3BEB')}</div>
 <div class="kpi"><div class="kt"><small>Upcoming</small><span class="kd" style="background:var(--b)"></span></div><b>${S.upcoming.length}</b>${spark([2,1,3,2,1,1,0],'#2F6BFF')}</div>
 <div class="kpi"><div class="kt"><small>Past 30 days</small><span class="kd" style="background:var(--g)"></span></div><b>${S.past.length}</b>${spark([3,4,4,6,5,7,8],'#12A150')}</div></div>
 ${S.multi&&S.ttab==='today'?`<button class="card row runcta" onclick="go('runpreview')">${ic('route','c-v')}<span style="flex:1;text-align:left"><b>Combine into a run</b><small class="sub" style="display:block">${RUNT.length} trips · pickups within 15 min and 5 mi</small></span>${I('chev','chev')}</button>`:''}${list.length?`<div class="sectitle"><h2>${S.ttab==='today'?d.toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'}):'Next 7 days'}</h2><span class="sub">${list.length} trip${list.length>1?'s':''}</span></div>${list.map(t=>tripCard(t)).join('')}<button class="viewpast" onclick="go('past')">${I('history')}View ${S.past.length} past trips${I('chev')}</button>`
 :`<div class="card empty"><span class="lic c-v" style="width:56px;height:56px;margin:0 auto 12px">${I('cal')}</span><h2>No trips ${S.ttab==='today'?'for today':'coming up'}</h2><p class="sub" style="margin:6px auto 16px;max-width:260px">Trips will appear here when assigned to you</p><button class="btn sec sm" onclick="toast('Up to date')">${I('refresh')}Refresh</button></div>
 <button class="viewpast" onclick="go('past')">${I('history')}View ${S.past.length} past trips${I('chev')}</button>`}`};
V.past=()=>{const f=S.pf,l=S.past.filter(t=>f==='all'||(f==='completed'?t.status==='completed':['missed','no_show','cancelled'].includes(t.status)));
 return head('Finished','Past',{back:"go('today')"})+`<div class="seg"><button onclick="S.ttab='today';go('today')">Today <span class="cnt">${S.todayEmpty?0:S.trips.length}</span></button><button onclick="S.ttab='future';go('today')">Upcoming <span class="cnt">0</span></button></div><div class="filters">${[['all','All'],['completed','Completed'],['missed','Missed']].map(([k,lb])=>`<button class="${f===k?'on':''}" onclick="S.pf='${k}';render()">${lb} <span>${k==='all'?S.past.length:S.past.filter(t=>k==='completed'?t.status==='completed':t.status!=='completed').length}</span></button>`).join('')}</div>${l.map(t=>tripCard(t,1)).join('')}<button class="viewpast" onclick="go('today')">Back to today</button>`};
V.trip=()=>{const t=trip(),s=t.status,[bc,bi,bt]=BANNER[s]||[],a=ACT[s],fin=['completed','no_show','cancelled'].includes(s);const cur=STEPS.findIndex(x=>x[1].includes(s));
 return `<div class="tmap"><div id="map"></div><div class="maptop"><button class="iconbtn" onclick="go('today')">${I('back')}</button><div class="mapt"><div class="eyebrow">#${t.id}</div><b>${t.first} ${t.last}</b></div>${chip(s)}</div>
 <div class="mo ctl"><button onclick="M&&M.zoomIn()">${I('plus')}</button><button onclick="M&&M.zoomOut()">${I('minus')}</button><button onclick="fitMap()">${I('locate')}</button></div></div>
 <div class="tsheet"><div class="grab"></div>
 ${bt?`<div class="banner ${bc}">${I(bi)}<span>${bt}</span></div>`:''}
 ${fin?'':`<div class="eyebrow" style="margin-bottom:10px">Trip progress</div><div class="stepper three">${STEPS.map(([lb],j)=>`<div class="st ${j<cur?'done':j===cur?'cur':''}"><i>${j<cur?I('check'):''}</i>${j===cur?'Now · '+lb:lb}</div>`).join('')}</div>`}
 ${a?`<button class="btn ${a[2]}" onclick="advance()">${I(a[1])}${a[0]}</button>`:''}
 ${s==='assigned'?`<div class="btns" style="margin-top:8px"><button class="btn tx red" onclick="exc('no_show')">${I('eyeoff')}No-show</button><button class="btn tx" onclick="exc('cancelled')">${I('x')}Cancel trip</button></div>`:''}
 </div>
 <div class="tbody">
 <div class="card"><div class="eyebrow">Patient</div><div class="row between" style="margin-top:6px"><div><h2>${t.first} ${t.last}</h2><p class="sub">${t.phone}</p><span class="chip c-n" style="margin-top:6px">${I('asterisk')}${t.mob}</span></div><a class="btn sec sm" style="text-decoration:none" href="tel:${t.phone.replace(/\D/g,'')}">${I('phone')}Call</a></div></div>
 <div class="card"><div class="eyebrow">Schedule</div><div class="sgrid">${[['clock','Pickup time',t.day+' at '+t.time,'c-g'],['cal','Appointment',t.appt,'c-v'],['route','Distance',t.miles+' mi · ~'+t.mins+' min','c-b']].map(([i,l,v,c])=>`<div class="sg">${ic(i,c,30)}<div><small>${l}</small><b>${v}</b></div></div>`).join('')}</div></div>
 <div class="card"><div class="eyebrow">Locations</div>${[['pu','Pickup','green',s==='assigned'?'Next stop':'Already passed'],['do','Drop-off','blue',s==='assigned'?'After pickup':fin?'':'Next stop']].map(([k,l,c,tag])=>`<div class="loc"><span class="ldot ${c}"></span><div style="flex:1;min-width:0"><div class="row between"><label>${l}</label>${tag?`<span class="chip ${tag==='Next stop'?(c==='green'?'c-g':'c-b'):'c-n'}">${tag}</span>`:''}</div><b>${t[k].a}</b><button class="link" onclick="openMaps('${t[k].a}')">${I('map')} Open in Maps</button></div></div>`).join('')}</div></div>`};
function advance(){const t=trip();if(t.status==='assigned')return sigSheet();
 if(t.status==='en_route_dropoff')return confirmSheet('flag','c-b','Update Status','Confirm you have arrived at the drop-off?','Arrive','blue',()=>{t.status='arrived_dropoff';render()});
 if(t.status==='arrived_dropoff')return confirmSheet('checkcheck','c-g','Update Status','Complete this trip and drop off the passenger?','Dropoff','green',()=>{t.status='completed';toast('Trip Completed — great job!');render()})}
function sigSheet(){sheet(`<div class="sheet-ic c-g">${I('pen')}</div><h2>Patient Pickup Signature</h2><p>Ask the patient to sign to confirm pickup.</p><canvas id="sigc" class="sigpad"></canvas><div class="btns" style="margin-top:12px"><button class="btn ghost" style="flex:1;height:50px" onclick="sigClear()">Clear</button><button class="btn green" style="flex:2" onclick="closeSheet();trip().status='en_route_dropoff';toast('Picked up');render()">Confirm pickup</button></div>`);setTimeout(()=>sigInit('sigc'),50)}
function exc(k){confirmSheet(k==='no_show'?'eyeoff':'x',k==='no_show'?'c-r':'c-n',k==='no_show'?'Mark as no-show?':'Cancel this trip?',k==='no_show'?'Only after waiting at the pickup. Dispatch is notified right away.':'Dispatch is notified and the trip leaves your list.',k==='no_show'?'Mark no-show':'Cancel trip','danger',()=>{trip().status=k;render()})}
function t_reset(){trip().status='assigned';render()}
V.vehicle=()=>{const v=S.vehicle;return head('Synced · '+v.synced,'Vehicle',{})+
 `<div class="card vcard"><div class="row between"><span class="eyebrow">${v.assign}</span><span class="chip c-g"><span class="d"></span>Available</span></div>
 <div class="plate">${v.plate}</div><h2>${v.name}</h2><p class="sub">${v.color} · ${v.type} · ${v.seats} seats</p></div>
 <div class="kpis">${[['users','Seats',v.seats,'c-v'],['access','Wheelchair',v.wheel?'Yes':'No',v.wheel?'c-g':'c-n'],['bed','Stretcher',v.stretch?'Yes':'No',v.stretch?'c-g':'c-n']].map(([i,l,val,c])=>`<div class="kpi">${ic(i,c,30)}<b style="margin-top:8px">${val}</b><small>${l}</small></div>`).join('')}</div>
 <div class="card"><div class="sectitle"><h2>Compliance</h2></div>${v.comp.map(([n,s])=>`<button class="li" onclick="toast('Opens ${n} upload')">${ic(n==='Insurance'?'shield':n==='Registration'?'file':'search','c-o')}<span class="t">${n}<small>${s}</small></span><span class="chip c-o">Not set</span></button>`).join('')}</div>
 <div class="card"><button class="li" onclick="toast('Change vehicle')">${ic('swap','c-v')}<span class="t">Change vehicle</span>${I('chev','chev')}</button></div>`};
V.messages=()=>head('Inbox','Messages',{right:`<button class="iconbtn" onclick="toast('New message')">${I('compose')}</button>`})+
 `<div class="card">${S.threads.map(t=>`<button class="li" onclick="S.thread='${t.id}';go('chat')"><span class="avatar">${I('building')}</span><span class="t">${t.name}<small>${t.msgs.at(-1)[1]}</small></span><span class="sub">${t.msgs.at(-1)[2]}</span></button>`).join('')}</div>
`;
V.chat=()=>{const t=S.threads.find(x=>x.id===S.thread)||S.threads[0];return `<div class="head"><div class="l"><button class="iconbtn" onclick="go('messages')">${I('back')}</button><span class="avatar" style="width:40px;height:40px">${I('building')}</span><div><div class="eyebrow">${t.role}</div><h2>${t.name}</h2></div></div></div>
 <div class="chatbody"><div class="daysep"><span>Jul 17</span></div>${t.msgs.map(([d,m,tm,r])=>`<div class="bub ${d}">${m}<time>${tm}${d==='out'?' '+I(r==='read'?'checkcheck':'check'):''}</time></div>`).join('')}</div>
 <div class="composer"><div class="row"><input id="mi" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendMsg()"><button onclick="sendMsg()">${I('send')}</button></div></div>`};
function sendMsg(q){const v=q||$('#mi').value.trim();if(!v)return;const t=S.threads.find(x=>x.id===S.thread)||S.threads[0];t.msgs.push(['out',v,now(),'sent']);render();$('#view').scrollTop=1e5}
V.account=()=>{const p=S.profile,dn=S.docs.filter(x=>x.st!=='none').length,d=new Date();return head(d.toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'}),'Account',{right:`<button class="iconbtn" onclick="go('settings')">${I('settings')}</button>`})+
 `<div class="card row"><span class="avatar" style="width:54px;height:54px;font-size:19px">${p.first[0]}${p.last[0]}</span><div style="flex:1"><h2>${p.first} ${p.last}</h2><p class="sub">${S.company}</p></div></div>
 <div class="card row" style="background:var(--gs)"><span class="live" style="flex:1;font-size:14px">Online · available for trips</span><button class="link" onclick="toast('You are offline')">Tap off</button></div>
 <div class="kpis"><div class="kpi"><div class="kt"><small>Total trips</small></div><b>${S.stats.total}</b>${spark([8,10,11,13,15,17,19],'#6D3BEB')}</div><div class="kpi"><div class="kt"><small>This month</small></div><b>${S.stats.month}</b>${spark([4,6,3,5,2,1,S.stats.month],'#2F6BFF')}</div><div class="kpi"><div class="kt"><small>Documents</small></div><b>${dn}/5</b><div class="bar"><i style="width:${dn*20}%"></i></div></div></div>
 <div class="sectitle"><h2>Account</h2></div><div class="card">
 <button class="li" onclick="go('personal')">${ic('user','c-v')}<span class="t">Personal information<small>Name, phone, license, address</small></span>${I('chev','chev')}</button>
 <button class="li" onclick="go('docs')">${ic('file','c-o')}<span class="t">Documents<small>License, insurance, medical cert</small></span><span class="chip ${dn===5?'c-g':'c-o'}">${dn}/5</span></button>
 <button class="li" onclick="go('signature')">${ic('pen','c-g')}<span class="t">Driver signature<small>On file for trip completion</small></span><span class="chip ${S.sig?'c-g':'c-n'}">${S.sig?'Active':'Missing'}</span></button>
 <button class="li" onclick="tab('vehicle')">${ic('car','c-b')}<span class="t">Assigned vehicle<small>${S.vehicle.name} · ${S.vehicle.plate}</small></span>${I('chev','chev')}</button></div>
 <div class="sectitle"><h2>Appearance</h2></div><div class="card"><div class="seg" style="margin:0"><button class="${S.dark?'':'on'}" onclick="setTheme(false)">${I('sun')} Light</button><button class="${S.dark?'on':''}" onclick="setTheme(true)">${I('moon')} Dark</button></div></div>
 <div class="sectitle"><h2>Preferences</h2></div><div class="card"><button class="li" onclick="go('settings')">${ic('settings','c-n')}<span class="t">Settings<small>Notifications, GPS, password</small></span>${I('chev','chev')}</button></div>`};
const PF=[['first','First Name'],['last','Last Name'],['phone','Phone'],['dob','Date of Birth'],['address','Address',1],['city','City'],['state','State'],['zip','Zip'],['license','License',1],['driverId','Driver ID',1,1]];
V.personal=()=>{const p=S.profile,e=S.editing;return head('Account','Personal information',{back:"S.editing=false;go('account')",right:e?'':`<button class="iconbtn" onclick="S.editing=true;render()">${I('compose')}</button>`})+
 `<div class="card"><div class="pgrid">${PF.map(([k,l,full,ro])=>`<div class="pf ${full?'full':''}"><label>${l}</label>${e&&!ro?`<input id="p-${k}" value="${p[k]==='—'?'':p[k]}" placeholder="—">`:`<b>${p[k]}</b>`}</div>`).join('')}</div></div>
 ${e?`<div class="btns"><button class="btn ghost" style="flex:1;height:50px" onclick="S.editing=false;render()">Cancel</button><button class="btn" style="flex:2" onclick="PF.forEach(([k,,,ro])=>{if(!ro)S.profile[k]=$('#p-'+k).value||'—'});S.editing=false;toast('Saved');render()">Save changes</button></div>`:''}`};
V.docs=()=>{const dn=S.docs.filter(x=>x.st!=='none').length;return head('Account','Documents',{back:"go('account')"})+
 `<div class="card">${S.docs.map((d,i)=>`<div class="li">${ic(d.i,d.st==='none'?'c-o':'c-g')}<span class="t">${d.n}<small>${d.st==='none'?'Not uploaded':'Tap to view'}</small></span><button class="btn sec sm" onclick="S.docs[${i}].st='review';toast('${d.n} submitted for review.');render()">${I('upload')}${d.st==='none'?'Upload':'Re-upload'}</button></div>`).join('')}</div>
 `};
V.signature=()=>head('Account','Driver signature',{back:"go('account')"})+
 `<div class="card"><div class="row between"><div><h2>Signature on file</h2><p class="sub">Used automatically when you complete trips.</p></div></div>
 <canvas id="sigd" class="sigpad" style="margin-top:14px"></canvas>${S.sig?`<span class="chip c-g" style="margin-top:10px">${I('check')}Active signature</span>`:''}<div class="btns" style="margin-top:12px"><button class="btn" onclick="S.sig=true;toast('Signature updated')">${I('pen')}Update signature</button></div></div>`;
V.settings=()=>{const p=S.prefs,sw=(k,l,s)=>`<button class="li" onclick="S.prefs.${k}=!S.prefs.${k};render()"><span class="t">${l}<small>${s}</small></span><span class="sw ${p[k]?'on':''}"></span></button>`;const on=[p.assign,p.msgs,p.remind].filter(Boolean).length;
 return head('Account','Settings',{back:"tab('profile')"})+
 `<div class="kpis"><div class="kpi">${ic('locate',p.gps?'c-g':'c-n',30)}<b style="margin-top:8px">${p.gps?'On':'Off'}</b><small>GPS tracking</small></div><div class="kpi">${ic('bell','c-v',30)}<b style="margin-top:8px">${on}/3</b><small>Alerts on</small></div><div class="kpi">${ic(S.dark?'moon':'sun','c-b',30)}<b style="margin-top:8px">${S.dark?'Dark':'Light'}</b><small>Appearance</small></div></div>
 <div class="sectitle"><h2>Appearance</h2></div><div class="card"><p class="sub" style="margin:0 0 10px">The app opens in light. Dark is for night driving.</p><div class="seg" style="margin:0"><button class="${S.dark?'':'on'}" onclick="setTheme(false)">${I('sun')} Light</button><button class="${S.dark?'on':''}" onclick="setTheme(true)">${I('moon')} Dark</button></div></div>
 <div class="sectitle"><h2>Notifications</h2></div><div class="card">${sw('assign','Trip assignments','When dispatch assigns a new trip')}${sw('msgs','Messages','New chat from dispatch or admin')}${sw('remind','Trip reminders','Before scheduled pickup time')}
 ${p.remind?`<div class="li" style="display:block"><small class="sub">Remind me</small><div class="filters" style="margin:8px 0 0">${['15 min','30 min','1 hour','2 hours'].map(x=>`<button class="${p.remindAt===x?'on':''}" onclick="S.prefs.remindAt='${x}';render()">${x}</button>`).join('')}</div></div>`:''}</div>
 <div class="sectitle"><h2>Location</h2></div><div class="card">${sw('gps','GPS while on trip','Required for arrival checks and mileage')}</div>
 <div class="sectitle"><h2>Security</h2></div><div class="card"><button class="li" onclick="pwSheet()">${ic('key','c-v')}<span class="t">Change password<small>Update your login password</small></span>${I('chev','chev')}</button><div class="li">${ic('trash','c-n')}<span class="t">Clear local cache<small>Vehicle cache & reminder schedules only</small></span><button class="link" onclick="confirmSheet('trash','c-n','Clear local cache?','Removes cached vehicle data and reminder schedules on this device.','Clear','',()=>toast('Cache cleared'))">Clear</button></div></div>
 <div class="sectitle"><h2>About</h2></div><div class="card"><dl class="kv"><dt>App</dt><dd>RideNEMT Driver</dd><dt>Version</dt><dd>1.0.2</dd><dt>Driver ID</dt><dd>${S.profile.driverId}</dd></dl>
 <button class="li" style="margin-top:6px" onclick="replaySheet()">${ic('refresh','c-b')}<span class="t">Replay driver tour<small>How the app works and your permissions</small></span>${I('chev','chev')}</button><button class="li">${ic('shield','c-n')}<span class="t">Privacy & terms</span>${I('chev','chev')}</button><button class="li">${ic('headset','c-n')}<span class="t">Contact support</span>${I('chev','chev')}</button></div>
 <button class="btn danger" onclick="confirmSheet('logout','c-r','Sign out?','Clears this device session. Trip history stays on the server.','Sign out','danger',()=>toast('Signed out (demo)'))">${I('logout')}Sign out</button><p class="sub" style="text-align:center;margin:8px 0 4px">Clears this device session. Trip history stays on the server.</p>`};
function replaySheet(){confirmSheet('map','c-v','Replay driver tour?','See what the app does, then re-check your permissions, signature and vehicle.','Start tour','',()=>go('tour',{step:0}))}
function pwSheet(){sheet(`<div class="sheet-ic c-v">${I('key')}</div><h2>Change password</h2><div class="field"><label>Current Password</label><input type="password" placeholder="Enter current password"><label>New Password</label><input type="password" placeholder="At least 8 characters"><label>Confirm New Password</label><input type="password" placeholder="Re-enter new password"></div><button class="btn" style="margin-top:14px" onclick="closeSheet();toast('Password updated')">Update password</button>`)}
/* signature pad */
function sigInit(id){const c=document.getElementById(id);if(!c)return;const r=c.getBoundingClientRect();c.width=r.width*2;c.height=r.height*2;const x=c.getContext('2d');x.scale(2,2);x.lineWidth=2.2;x.lineCap='round';x.strokeStyle=S.dark?'#EDEEF4':'#141826';let dn=false;
 const pt=e=>{const b=c.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return[t.clientX-b.left,t.clientY-b.top]};
 c.onpointerdown=e=>{dn=true;x.beginPath();x.moveTo(...pt(e))};c.onpointermove=e=>{if(dn){x.lineTo(...pt(e));x.stroke()}};c.onpointerup=c.onpointerleave=()=>dn=false;
 if(id==='sigd'&&S.sig){x.beginPath();let p=[[40,90],[60,30],[70,100],[90,40],[100,95],[120,60],[150,70],[170,50],[200,80],[230,55]];x.moveTo(...p[0]);p.forEach(q=>x.lineTo(...q));x.stroke()}}
function sigClear(id='sigc'){const c=document.getElementById(id);c.getContext('2d').clearRect(0,0,c.width,c.height);if(id==='sigd')S.sig=false}
/* map */
let M=null;const rc={};
async function getRoute(a,b){const k=a+'|'+b;if(rc[k])return rc[k];try{const j=await (await fetch(`https://router.project-osrm.org/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`)).json();return rc[k]=j.routes[0].geometry.coordinates}catch(e){return rc[k]=[a,b]}}
function fitMap(){if(!M||!M._pts)return;const b=new maplibregl.LngLatBounds();M._pts.forEach(p=>b.extend(p));M.fitBounds(b,{padding:{top:90,bottom:40,left:40,right:60},pitch:55,bearing:-18,duration:500})}
function mk(c,col,l){const e=document.createElement('div');e.className='mk';e.style.background=col;e.innerHTML=l;return new maplibregl.Marker({element:e}).setLngLat(c).addTo(M)}
function mountMap(){if(S.screen==='run')return mountRunMap();if(M){M.remove();M=null}const el=$('#map');if(!el)return;if(!window.maplibregl){if(!window._mlInj){window._mlInj=1;const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';document.head.appendChild(l);const sc=document.createElement('script');sc.src='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';sc.onload=()=>mountMap();document.head.appendChild(sc)}return}const t=trip();
 M=new maplibregl.Map({container:el,style:'https://tiles.openfreemap.org/styles/'+(S.dark?'dark':'positron'),center:t.pu.c,zoom:12,pitch:55,bearing:-18,attributionControl:{compact:true}});const m=M;
 m.on('load',async()=>{try{m.addLayer({id:'b3d',type:'fill-extrusion',source:'openmaptiles','source-layer':'building',minzoom:12,paint:{'fill-extrusion-color':S.dark?'#2A2F42':'#DCDFE8','fill-extrusion-height':['coalesce',['get','render_height'],10],'fill-extrusion-opacity':.85}})}catch(e){}
  const r=await getRoute(t.pu.c,t.do.c);if(m!==M)return;m._pts=[t.pu.c,t.do.c];
  m.addSource('rt',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:r}}});
  m.addLayer({id:'rtc',type:'line',source:'rt',paint:{'line-color':'#fff','line-width':9,'line-opacity':S.dark?.2:.9},layout:{'line-cap':'round','line-join':'round'}});
  m.addLayer({id:'rt',type:'line',source:'rt',paint:{'line-color':'#6D3BEB','line-width':5},layout:{'line-cap':'round','line-join':'round'}});
  mk(t.pu.c,'#10B981',I('user'));mk(t.do.c,'#2F6BFF',I('flag'));fitMap()})}
async function getRouteN(pts){const k=pts.join('|');if(rc[k])return rc[k];try{const j=await (await fetch('https://router.project-osrm.org/route/v1/driving/'+pts.map(p=>p[0]+','+p[1]).join(';')+'?overview=full&geometries=geojson')).json();return rc[k]=j.routes[0].geometry.coordinates}catch(e){return rc[k]=pts}}
function mountRunMap(){if(M){M.remove();M=null}const el=$('#map');if(!el)return;if(!window.maplibregl){S.screen='trip';mountMap();S.screen='run';return}
 const pts=S.run.stops.map(s=>RUNT[s.i][s.k].c);M=new maplibregl.Map({container:el,style:'https://tiles.openfreemap.org/styles/'+(S.dark?'dark':'positron'),center:pts[0],zoom:11,pitch:50,bearing:-18,attributionControl:{compact:true}});const m=M;
 m.on('load',async()=>{const r=await getRouteN(pts);if(m!==M)return;m._pts=pts;m.addSource('rt',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:r}}});
  m.addLayer({id:'rtc',type:'line',source:'rt',paint:{'line-color':'#fff','line-width':9,'line-opacity':S.dark?.2:.9},layout:{'line-cap':'round','line-join':'round'}});
  m.addLayer({id:'rt',type:'line',source:'rt',paint:{'line-color':'#6D3BEB','line-width':5},layout:{'line-cap':'round','line-join':'round'}});
  S.run.stops.forEach(s=>{const e=mk(RUNT[s.i][s.k].c,s.st==='done'?'#9AA3B2':s.k==='pu'?'#10B981':'#2F6BFF','<b style="font-size:13px">'+s.seq+'</b>')});fitMap()})}
/* ===== multi-trip run (per ARK round2/SPEC.md: compatible trips only; pickups in time order, then drop-offs nearest→farthest from last pickup; numbered stop list; server rejects skipping the next stop) ===== */
const RUNT=[{id:'FULL073397-14',first:'Kenneth',last:'Abrams',time:'9:30 PM',mob:'Ambulatory',pu:{a:'5109 Boat Club Rd, Fort Worth, TX 76135',c:[-97.4239,32.8248]},do:{a:'900 8th Ave, Fort Worth, TX 76104',c:[-97.3434,32.7395]}},
 {id:'FULL073402-03',first:'Gloria',last:'Mendez',time:'9:40 PM',mob:'Wheelchair',pu:{a:'4900 Jacksboro Hwy, Fort Worth, TX 76114',c:[-97.4005,32.7900]},do:{a:'1500 S Main St, Fort Worth, TX 76104',c:[-97.3273,32.7307]}},
 {id:'FULL073405-08',first:'Dwayne',last:'Ellis',time:'9:45 PM',mob:'Ambulatory',pu:{a:'3600 White Settlement Rd, Fort Worth, TX 76107',c:[-97.3855,32.7640]},do:{a:'1400 8th Ave, Fort Worth, TX 76104',c:[-97.3440,32.7300]}}];
const runFresh=()=>({stops:[['pu',0],['pu',1],['pu',2],['do',0],['do',2],['do',1]].map(([k,i],n)=>({seq:n+1,k,i,st:'todo'})),incompat:false});
S.run=runFresh();
const rcur=()=>S.run.stops.find(s=>s.st!=='done');
const onboard=()=>RUNT.map((t,i)=>i).filter(i=>S.run.stops.find(s=>s.k==='pu'&&s.i===i).st==='done'&&S.run.stops.find(s=>s.k==='do'&&s.i===i).st!=='done');
V.runpreview=()=>{const bad=S.run.incompat;return head('Trips','Combine into a run',{back:"go('today')"})+
 `<div class="card"><div class="sectitle"><h2>${RUNT.length} trips selected</h2><span class="chip ${bad?'c-r':'c-g'}"><span class="d"></span>${bad?'Not compatible':'Compatible'}</span></div>
 ${[['clock','Pickup windows fit','Within 15 min of each other',!bad],['locate','Pickups close together','All within 5 mi',true],['nav','Same direction','All heading toward downtown Fort Worth',!bad]].map(([i,l,s,ok])=>`<div class="li">${ic(ok?'check':'x',ok?'c-g':'c-r')}<span class="t">${l}<small>${ok?s:(i==='clock'?'Dwayne E. pickup is 40 min after Kenneth A.':'Dwayne E. drops off the opposite way')}</small></span></div>`).join('')}</div>
 <div class="card"><div class="eyebrow">Stop order</div><div class="runlist" style="margin-top:6px">${S.run.stops.map(s=>{const t=RUNT[s.i];return `<div class="rs"><span class="n ${s.k==='pu'?'c-g':'c-b'}">${s.seq}</span><div style="flex:1;min-width:0"><div class="row between"><b>${s.k==='pu'?'Pickup':'Drop-off'} · ${ini(t)}</b><span class="sub" style="margin:0">${s.k==='pu'?t.time:''}</span></div><div class="sub" style="color:var(--ink);font-weight:500">${t[s.k].a}</div></div></div>`}).join('')}</div>
 <p class="sub" style="margin-top:10px">Pickups go in time order. Drop-offs go nearest to farthest from the last pickup.</p></div>
 ${bad?`<div class="banner red">${I('alert')}<span>Run not created. Your trips stay as single trips.</span></div><button class="btn sec" onclick="S.run.incompat=false;render()">Back to my trips</button>`:`<button class="btn" onclick="S.run=runFresh();go('run')">${I('route')}Start run · ${S.run.stops.length} stops</button>`}`};
V.run=()=>{const c=rcur(),ob=onboard(),done=S.run.stops.filter(s=>s.st==='done').length;
 let act='';if(c){const t=RUNT[c.i];act=c.k==='pu'?['Pickup · '+ini(t),'user','green']:c.st==='todo'?['Arrive · '+ini(t),'flag','blue']:['Dropoff · '+ini(t),'checkcheck','blue']}
 return `<div class="tmap"><div id="map"></div><div class="maptop"><button class="iconbtn" onclick="go('today')">${I('back')}</button><div class="mapt"><div class="eyebrow">Run · ${RUNT.length} trips</div><b>${c?'Stop '+c.seq+' of '+S.run.stops.length:'Run complete'}</b></div><span class="chip ${c?'c-v':'c-g'}">${done}/${S.run.stops.length}</span></div>
 <div class="mo ctl"><button onclick="M&&M.zoomIn()">${I('plus')}</button><button onclick="M&&M.zoomOut()">${I('minus')}</button><button onclick="fitMap()">${I('locate')}</button></div></div>
 <div class="tsheet"><div class="grab"></div>
 ${c?`${c.k==='do'&&c.st==='arrived'?`<div class="banner blue">${I('check')}<span>You're at the drop-off · ${ini(RUNT[c.i])}</span></div>`:c.seq===1&&c.st==='todo'?`<div class="banner amber">${I('clock')}<span>Waiting to start — head to the pickup</span></div>`:''}
 <div class="eyebrow">Next stop · ${c.k==='pu'?'Pickup':'Drop-off'}</div><div class="row between" style="margin:4px 0 12px"><div style="min-width:0"><h2>${ini(RUNT[c.i])} <span class="sub" style="font-weight:500">· ${RUNT[c.i].mob}</span></h2><button class="addr" onclick="openMaps('${RUNT[c.i][c.k].a}')">${RUNT[c.i][c.k].a}</button></div><a class="btn sec sm" style="text-decoration:none" href="tel:0">${I('phone')}Call</a></div>
 <button class="btn ${act[2]}" onclick="runAdvance()">${I(act[1])}${act[0]}</button>`
 :`<div class="banner green">${I('check')}<span>Run completed · ${RUNT.length} trips</span></div><button class="btn sec" onclick="go('today')">Back to trips</button>`}
 </div>
 <div class="tbody">
 <div class="card"><div class="sectitle"><h2>On board</h2><span class="chip c-v">${ob.length} of ${RUNT.length}</span></div>${ob.length?`<div class="metarow" style="margin:0">${ob.map(i=>`<span class="chip c-g">${I('user')}${ini(RUNT[i])}</span>`).join('')}</div>`:`<p class="sub">${c?'No riders on board yet.':'Everyone has been dropped off.'}</p>`}</div>
 <div class="card"><div class="eyebrow">Stops</div><div class="runlist" style="margin-top:6px">${S.run.stops.map(s=>{const t=RUNT[s.i],cur=c&&s.seq===c.seq,dn=s.st==='done';return `<div class="rs" style="${dn?'opacity:.55':''}${cur?';background:var(--vs);margin:0 -10px;padding:12px 10px;border-radius:12px':''}"><span class="n ${dn?'c-g':s.k==='pu'?'c-g':'c-b'}">${dn?I('check'):s.seq}</span><div style="flex:1;min-width:0"><div class="row between"><b>${s.k==='pu'?'Pickup':'Drop-off'} · ${ini(t)}</b>${cur?'<span class="chip c-v">Next</span>':dn?'<span class="sub" style="margin:0">Done</span>':`<span class="sub" style="margin:0">${s.k==='pu'?t.time:''}</span>`}</div><div class="sub" style="color:var(--ink);font-weight:500">${t[s.k].a}</div><div class="sub">#${t.id}</div></div></div>`}).join('')}</div>
 <p class="sub" style="margin-top:10px">${I('info')} Stops must be done in order.</p></div></div>`};
function runAdvance(){const c=rcur(),t=RUNT[c.i];
 if(c.k==='pu'){window._runSig=1;return sheet(`<div class="sheet-ic c-g">${I('pen')}</div><h2>Patient Pickup Signature</h2><p>Ask the patient to sign to confirm pickup.</p><canvas id="sigc" class="sigpad"></canvas><div class="btns" style="margin-top:12px"><button class="btn ghost" style="flex:1;height:50px" onclick="sigClear()">Clear</button><button class="btn green" style="flex:2" onclick="closeSheet();rcur().st='done';toast('Picked up ${ini(t)}');render()">Confirm pickup</button></div>`),setTimeout(()=>sigInit('sigc'),50)}
 if(c.st==='todo')return confirmSheet('flag','c-b','Update Status',`Confirm you have arrived at the drop-off for ${ini(t)}?`,'Arrive','blue',()=>{c.st='arrived';render()});
 confirmSheet('checkcheck','c-g','Update Status',`Complete this trip and drop off ${ini(t)}?`,'Dropoff','green',()=>{c.st='done';toast('Trip Completed');render()})}
function runSet(n,arr){S.run=runFresh();S.run.stops.forEach((s,j)=>{if(j<n)s.st='done'});if(arr)S.run.stops[n].st='arrived';go('run',{tab:'trips'})}
/* render + jump list */
const JUMP=[['Today · 3 trips',()=>{S.multi=true;S.ttab='today';tab('trips')}],['Run preview',()=>{S.multi=true;S.run=runFresh();go('runpreview',{tab:'trips'})}],['Run not compatible',()=>{S.multi=true;S.run=runFresh();S.run.incompat=true;go('runpreview',{tab:'trips'})}],['Run start',()=>runSet(0)],['Run pickup signature',()=>{runSet(0);runAdvance()}],['Run 2 on board',()=>runSet(2)],['Run all on board',()=>runSet(3)],['Run arrive confirm',()=>{runSet(3);runAdvance()}],['Run at dropoff',()=>runSet(3,1)],['Run 1 left',()=>runSet(5)],['Run complete',()=>runSet(6)],['Tour 1',()=>go('tour',{step:0})],['Tour 2',()=>go('tour',{step:1})],['Tour 3',()=>go('tour',{step:2})],
 ['Today',()=>{S.todayEmpty=false;S.ttab='today';tab('trips')}],['Today empty',()=>{S.todayEmpty=true;S.ttab='today';tab('trips')}],['Upcoming',()=>{S.ttab='future';tab('trips')}],['Past',()=>{S.tab='trips';S.pf='all';go('past')}],['Past completed',()=>{S.tab='trips';S.pf='completed';go('past')}],['Past missed',()=>{S.tab='trips';S.pf='missed';go('past')}],
 ...FLOW.concat(['no_show','cancelled']).map(s=>['Trip '+ST[s][0],()=>{S.trips[0].status=s;go('trip',{tab:'trips',tripId:S.trips[0].id})}]),
 ['Pickup signature',()=>{S.trips[0].status='assigned';go('trip',{tab:'trips',tripId:S.trips[0].id});sigSheet()}],
 ['Arrive confirm',()=>{S.trips[0].status='en_route_dropoff';go('trip',{tab:'trips',tripId:S.trips[0].id});advance()}],
 ['Dropoff confirm',()=>{S.trips[0].status='arrived_dropoff';go('trip',{tab:'trips',tripId:S.trips[0].id});advance()}],
 ['No-show confirm',()=>{S.trips[0].status='assigned';go('trip',{tab:'trips',tripId:S.trips[0].id});exc('no_show')}],
 ['Cancel confirm',()=>{S.trips[0].status='assigned';go('trip',{tab:'trips',tripId:S.trips[0].id});exc('cancelled')}],
 ['Open in Maps',()=>{S.trips[0].status='assigned';go('trip',{tab:'trips',tripId:S.trips[0].id});openMaps(S.trips[0].pu.a)}],
 ['Vehicle',()=>tab('vehicle')],['Messages',()=>tab('messages')],['Chat',()=>{S.tab='messages';S.thread='amo';go('chat')}],
 ['Account',()=>tab('profile')],['Personal info',()=>go('personal',{tab:'profile',editing:false})],['Personal edit',()=>go('personal',{tab:'profile',editing:true})],['Documents',()=>go('docs',{tab:'profile'})],['Signature',()=>go('signature',{tab:'profile'})],
 ['Settings',()=>go('settings',{tab:'profile'})],['Change password',()=>{go('settings',{tab:'profile'});pwSheet()}],['Clear cache',()=>{go('settings',{tab:'profile'});confirmSheet('trash','c-n','Clear local cache?','Removes cached vehicle data and reminder schedules on this device.','Clear','',()=>{})}],['Replay tour modal',()=>{go('settings',{tab:'profile'});replaySheet()}],['Sign out',()=>{go('settings',{tab:'profile'});confirmSheet('logout','c-r','Sign out?','Clears this device session. Trip history stays on the server.','Sign out','danger',()=>{})}]];
function render(){applyTheme();const v=$('#view');v.className=['trip','run'].includes(S.screen)?'nopad':'';v.innerHTML=V[S.screen]();renderTabs();
 if(['trip','run'].includes(S.screen))mountMap();else if(M){M.remove();M=null}if(S.screen==='signature')setTimeout(()=>sigInit('sigd'),0);if(S.screen==='chat')v.scrollTop=1e5}
$('#jump').innerHTML=JUMP.map(([l],i)=>`<button onclick="closeSheet();JUMP[${i}][1]()">${l}</button>`).join('');
document.querySelectorAll('[data-i]').forEach(e=>e.outerHTML=I(e.dataset.i));
const q=new URLSearchParams(location.search);if(q.get('bare'))document.body.classList.add('bare');if(q.get('compact'))document.body.classList.add('compact');if(q.get('theme'))S.dark=q.get('theme')==='dark';
const slug=x=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
if(q.get('s')){const j=JUMP.find(x=>slug(x[0])===q.get('s'));j?j[1]():render()}else render();
