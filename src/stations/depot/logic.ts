// Delivery Depot rules: voltage, current and power, first met as delivery trucks on a loop.
//
// A small DC distribution board sits on the bench: a source (EMF E behind a small internal
// resistance) feeds a top rail; three bays hang between the top rail and the return rail; each
// bay can hold a device cart (lamp, motor, heater) or a stray crossover rail (a short), behind a
// barrier. Two rail sections are swappable: the FEED (source → bay 1, top) and the RETURN
// (bay 1 → source, bottom). A breaker trips when the source current passes its rating.
//
// The truck picture (drawn by the station, stated to the player):
//   · height of the road  ≈ electrical potential; a device's drop in height ≈ the voltage across it
//     (energy handed over per unit of charge);
//   · trucks per second past a point ≈ current (charge per second);
//   · cargo delivered per second ≈ power (V × I).
// Teaching guardrails (also stated to the player):
//   · It is an ANALOGY and it is imperfect: trucks (charge) are not used up at a device; the same
//     number leave as arrive, only their cargo (energy) is handed over. Voltage is not a number of
//     trucks. Trucks follow conventional current (+ to −); in metal wires electrons drift the other way.
//   · A voltage across an open gap moves nothing: no closed loop, no current.
//   · Devices are modelled as fixed resistances at their working point (a real lamp filament and a
//     real motor are not linear). Ratings, rail values and the breaker size are depot values.
// Pure module: no three.js and no DOM. The network solver is modified nodal analysis with Gaussian
// elimination (partial pivoting), the same method as the Waterworks.

export type RailKind='gap'|'thin'|'heavy';
export type DeviceKind='lamp'|'motor'|'heater'|'jumper';
/** A bay between the top and return rails. barrier: true when the barrier blocks the bay. */
export interface Bay {device:DeviceKind|null;barrier:boolean}
export interface Layout {e:number;on:boolean;feed:RailKind;ret:RailKind;bays:Bay[]}

// ---------- depot values ----------
export const SOURCE={rInt:.4,min:0,max:24,step:.1};
/** Breaker rating (A). */
export const BREAKER=4;
/** Rail sections: resistance (Ω) and current rating (A). The rails between bays are fixed heavy. */
export const RAILS:{[k in Exclude<RailKind,'gap'>]:{r:number;rating:number;name:string}}={
  thin:{r:.5,rating:1.2,name:'thin rail'},heavy:{r:.02,rating:6,name:'heavy rail'}};
export const DEVICES:{[k in DeviceKind]:{name:string;r:number;vNom?:number;iMax?:number}}={
  lamp:{name:'lamp',r:15,vNom:12,iMax:1},motor:{name:'motor',r:8,vNom:12,iMax:2},
  heater:{name:'heater',r:6,vNom:12,iMax:2.5},jumper:{name:'crossover rail',r:.01}};
/** Required devices must sit in this band; "on target" is within TARGET of 12 V. */
export const BAND={lo:11.5,hi:12.5,nom:12},TARGET=.25;
/** "Reliably" keeps 20 % headroom on the breaker and on every rail. */
export const MARGIN=.8;
const SWITCH_R=.001,LEAK=1e9;

// ---------- nodes and elements ----------
/** Node 0 is the source's − terminal (the return rail at the source). */
export const N={B0:0,EMF:1,TERM:2,T0:3,T:[4,5,6],D:[7,8,9],B:[10,11,12]} as const;
export const NODES=13;
export type Elem='int'|'breaker'|'feed'|'top12'|'top23'|'bar1'|'bar2'|'bar3'|'dev1'|'dev2'|'dev3'|'bot32'|'bot21'|'ret';
interface R {id:Elem;a:number;b:number;r:number}
function resistors(l:Layout,on=l.on):R[]{
  const out:R[]=[{id:'int',a:N.EMF,b:N.TERM,r:SOURCE.rInt}];
  if(on)out.push({id:'breaker',a:N.TERM,b:N.T0,r:SWITCH_R});
  if(l.feed!=='gap')out.push({id:'feed',a:N.T0,b:N.T[0],r:RAILS[l.feed].r});
  out.push({id:'top12',a:N.T[0],b:N.T[1],r:RAILS.heavy.r},{id:'top23',a:N.T[1],b:N.T[2],r:RAILS.heavy.r});
  l.bays.forEach((b,k)=>{if(!b.device)return;
    if(!b.barrier)out.push({id:`bar${k+1}` as Elem,a:N.T[k],b:N.D[k],r:SWITCH_R});
    out.push({id:`dev${k+1}` as Elem,a:N.D[k],b:N.B[k],r:DEVICES[b.device].r});});
  out.push({id:'bot32',a:N.B[2],b:N.B[1],r:RAILS.heavy.r},{id:'bot21',a:N.B[1],b:N.B[0],r:RAILS.heavy.r});
  if(l.ret!=='gap')out.push({id:'ret',a:N.B[0],b:N.B0,r:RAILS[l.ret].r});
  return out;
}

// ---------- linear solver ----------
/** Solves A·x = b in place (Gaussian elimination with partial pivoting). Throws if singular. */
export function gauss(A:number[][],b:number[]):number[]{
  const n=b.length;
  for(let c=0;c<n;c++){
    let piv=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[piv][c]))piv=r;
    if(Math.abs(A[piv][c])<1e-15)throw new Error('singular network');
    [A[c],A[piv]]=[A[piv],A[c]];[b[c],b[piv]]=[b[piv],b[c]];
    for(let r=c+1;r<n;r++){const f=A[r][c]/A[c][c];if(!f)continue;for(let k=c;k<n;k++)A[r][k]-=f*A[c][k];b[r]-=f*b[c];}
  }
  const x=new Array<number>(n).fill(0);
  for(let r=n-1;r>=0;r--){let s=b[r];for(let k=r+1;k<n;k++)s-=A[r][k]*x[k];x[r]=s/A[r][r];}
  return x;
}
export interface Solution {
  /** Node potentials (V), v[0] = 0. */
  v:number[];
  /** Current through each element present, from its a end to its b end (A). */
  i:Partial<Record<Elem,number>>;
}
/** Modified nodal analysis: the EMF between node EMF and ground, every resistor, and a very large
 *  leak from each node to ground so an isolated island (a cut-off stretch of rail) reads 0 V. */
export function solve(l:Layout,on=l.on):Solution{
  const rs=resistors(l,on),n=NODES-1,size=n+1;
  const A=Array.from({length:size},()=>new Array<number>(size).fill(0)),b=new Array<number>(size).fill(0);
  const at=(node:number)=>node-1;
  for(let k=1;k<NODES;k++)A[at(k)][at(k)]+=1/LEAK;
  for(const p of rs){const g=1/p.r;
    if(p.a)A[at(p.a)][at(p.a)]+=g;if(p.b)A[at(p.b)][at(p.b)]+=g;
    if(p.a&&p.b){A[at(p.a)][at(p.b)]-=g;A[at(p.b)][at(p.a)]-=g;}}
  // The EMF: v[EMF] − v[0] = E.
  A[at(N.EMF)][n]+=1;A[n][at(N.EMF)]+=1;b[n]=l.e;
  const x=gauss(A,b),v=[0,...x.slice(0,n)];
  const i:Partial<Record<Elem,number>>={};for(const p of rs)i[p.id]=(v[p.a]-v[p.b])/p.r;
  return {v,i};
}

// ---------- readings ----------
export interface DeviceReading {bay:number;kind:DeviceKind;v:number;i:number;p:number;required:boolean}
export interface Readings {
  sol:Solution;
  /** Source current and terminal voltage; source power is E × I. */
  current:number;terminal:number;pSource:number;
  devices:DeviceReading[];
  /** Power into the devices the job needs, and everything else (rails, source, other devices). */
  pUseful:number;waste:number;
  rails:{feed:number;ret:number};
}
export const isRequired=(k:DeviceKind|null)=>k==='lamp'||k==='motor';
export function readings(l:Layout,sol=solve(l)):Readings{
  const v=sol.v,cur=sol.i.int??0,devices:DeviceReading[]=[];
  l.bays.forEach((b,k)=>{if(!b.device)return;const dv=v[N.D[k]]-v[N.B[k]],di=dv/DEVICES[b.device].r;devices.push({bay:k,kind:b.device,v:dv,i:di,p:dv*di,required:isRequired(b.device)});});
  const pSource=l.e*cur,pUseful=devices.filter(d=>d.required).reduce((s,d)=>s+d.p,0);
  return {sol,current:cur,terminal:v[N.TERM],pSource,devices,pUseful,waste:pSource-pUseful,rails:{feed:sol.i.feed??0,ret:sol.i.ret??0}};
}
/** What happens when the breaker is (or stays) on: it trips if the source current passes its rating.
 *  surge holds the currents in the moment before it opened. */
export function evaluate(l:Layout):{trip:boolean;surge?:Readings;now:Readings}{
  if(!l.on)return {trip:false,now:readings(l)};
  const r=readings(l);
  if(Math.abs(r.current)>BREAKER)return {trip:true,surge:r,now:readings({...l,on:false})};
  return {trip:false,now:r};
}

// ---------- the meter ----------
export type Probe='source'|'feed'|'bay1'|'bay2'|'bay3'|'return';
export const PROBES:Probe[]=['source','feed','bay1','bay2','bay3','return'];
/** Voltage across and current through a probe point (a meter with two leads and a clamp). */
export function probe(l:Layout,r:Readings,p:Probe):{v:number;i:number}{
  const v=r.sol.v,i=r.sol.i;
  switch(p){
    case 'source':return {v:v[N.TERM],i:r.current};
    case 'feed':return {v:v[N.T0]-v[N.T[0]],i:i.feed??0};
    case 'return':return {v:v[N.B[0]]-v[N.B0],i:i.ret??0};
    default:{const k=Number(p.slice(3))-1,d=l.bays[k].device;return {v:v[N.T[k]]-v[N.B[k]],i:d?(v[N.D[k]]-v[N.B[k]])/DEVICES[d].r:0};}
  }
}

// ---------- the jobs ----------
export interface Job {id:string;name:string;story:string;goal:string;start:Layout;
  /** The job opens with the breaker already tripped by a short (the station plays the surge). */
  openingTrip?:boolean;
  /** Transfer: the final check has to be made in the plain meter view, probing each device. */
  meterCheck?:boolean}
const bay=(device:DeviceKind|null,barrier=false):Bay=>({device,barrier});
export const JOBS:Job[]=[
  {id:'socket',name:'Dead socket',goal:'Light the lamp at 12 V',
    story:'The lamp cart is on the rails and the depot reads 12 V, yet nothing moves.',
    start:{e:12,on:true,feed:'heavy',ret:'gap',bays:[bay('lamp'),bay(null),bay(null)]}},
  {id:'pair',name:'Two on the rails',goal:'Run the lamp and the motor together at 12 V',
    story:'The lamp and the motor must both get 12 V at a safe current. Someone left a heater running.',
    start:{e:12,on:true,feed:'thin',ret:'heavy',bays:[bay('lamp'),bay('heater'),bay('motor',true)]}},
  {id:'short',name:'The short',goal:'Find the short, then prove both devices with the meter',
    story:'The belt raced and the breaker tripped. Find what shorts the rails, clear it, then check both devices with the plain meter.',
    start:{e:13.8,on:true,feed:'heavy',ret:'heavy',bays:[bay('lamp'),bay('jumper'),bay('motor')]},openingTrip:true,meterCheck:true},
];
export const clone=(l:Layout):Layout=>({...l,bays:l.bays.map(b=>({...b}))});
export const clampE=(e:number)=>Math.min(SOURCE.max,Math.max(SOURCE.min,Math.round(e/SOURCE.step)*SOURCE.step));

// ---------- judging ----------
export interface Verdict {tier:0|1|2|3;problems:string[];notes:string[];readings:Readings}
export const fmt=(x:number,d=2)=>{const s=x.toFixed(d);return s.includes('.')?s.replace(/\.?0+$/,''):s;};
const V=(x:number)=>`${fmt(x,1)} V`,A=(x:number)=>`${fmt(x,2)} A`,W=(x:number)=>`${fmt(x,1)} W`;
const cap=(s:string)=>s[0].toUpperCase()+s.slice(1);
/** Configurations that deliver the job cleanly: reliable, every required device on target, and
 *  no power into devices nobody asked for. */
function clean(l:Layout,r:Readings){
  return r.devices.every(d=>d.required?Math.abs(d.v-BAND.nom)<=TARGET+1e-9:Math.abs(d.i)<1e-3);
}
/** Judge a layout for a job. Works: breaker on, every required device in its band and under its
 *  current rating. Reliably: 20 % headroom on the breaker and on every rail. Elegant: every
 *  required device on 12 V (±0.25), no power into other devices, and the least wasted power the
 *  depot allows (within 10 %: best found by the solver). */
export function judge(job:Job,l:Layout):Verdict{
  const ev=evaluate(l),r=ev.now,problems:string[]=[],notes:string[]=[];
  const verdict=(tier:0|1|2|3):Verdict=>({tier,problems,notes,readings:ev.surge??r});
  if(ev.trip){const s=ev.surge!,hot=s.devices.filter(d=>d.kind==='jumper'||d.kind==='heater').sort((a,b)=>b.i-a.i)[0];
    problems.push(`The breaker trips: ${A(s.current)} is over its ${BREAKER} A rating.${hot?` Bay ${hot.bay+1}'s ${DEVICES[hot.kind].name} takes ${A(hot.i)} of it.`:''}`);return verdict(0);}
  if(!l.on){problems.push('The breaker is off, so no truck leaves the depot. Switch it on.');return verdict(0);}
  const req=l.bays.map((b,k)=>({b,k})).filter(x=>isRequired(x.b.device));
  for(const {b,k} of req){const name=DEVICES[b.device!].name,d=r.devices.find(x=>x.bay===k)!;
    if(b.barrier){problems.push(`Bay ${k+1}'s barrier blocks the ${name}: no loop through it, so no current. Lift the barrier.`);continue;}
    if(Math.abs(d.i)<1e-3){const gap=l.feed==='gap'?'feed':l.ret==='gap'?'return':'';
      const across=gap==='feed'?r.sol.v[N.T0]-r.sol.v[N.T[0]]:gap==='return'?r.sol.v[N.B[0]]:0;
      problems.push(gap?`The ${gap} rail has a gap: ${V(across)} across it, but no closed loop, so no current. Fit a rail section.`:`No current reaches the ${name}: the loop isn't closed.`);continue;}
    const spec=DEVICES[b.device!];
    if(d.i>spec.iMax!+1e-9)problems.push(`The ${name} draws ${A(d.i)}, over its ${spec.iMax} A rating. Turn the source down.`);
    else if(d.v<BAND.lo)problems.push(`The ${name} gets ${V(d.v)}, under its ${BAND.lo}–${BAND.hi} V band: ${V(l.e-d.v)} of the source's ${V(l.e)} is lost on the way (inside the source and in the rails).`);
    else if(d.v>BAND.hi)problems.push(`The ${name} gets ${V(d.v)}, over its ${BAND.lo}–${BAND.hi} V band. Turn the source down.`);
  }
  if(problems.length)return verdict(0);
  // Works. Reliability: headroom on the breaker and on each swappable rail.
  const rail=(which:'feed'|'ret')=>{const k=l[which];if(k==='gap')return;const i=Math.abs(r.rails[which]),rt=RAILS[k].rating;
    if(i>rt)notes.push(`${cap(which==='feed'?'the feed':'the return')} rail carries ${A(i)}, over the ${RAILS[k].name}'s ${rt} A rating: it runs hot. Fit a heavy rail.`);
    else if(i>rt*MARGIN)notes.push(`${cap(which==='feed'?'the feed':'the return')} rail carries ${A(i)}, too close to its ${rt} A rating.`);};
  rail('feed');rail('ret');
  if(Math.abs(r.current)>BREAKER*MARGIN)notes.push(`${A(r.current)} is within the breaker's ${BREAKER} A, but without 20 % headroom.`);
  if(notes.length)return verdict(1);
  const extra=r.devices.find(d=>!d.required&&Math.abs(d.i)>=1e-3);
  if(extra){notes.push(`The ${DEVICES[extra.kind].name} in bay ${extra.bay+1} burns ${W(extra.p)} nobody asked for. Lower its barrier.`);return verdict(2);}
  const off=r.devices.filter(d=>d.required&&Math.abs(d.v-BAND.nom)>TARGET);
  if(off.length){notes.push(`In band, but aim for 12 V: ${off.map(d=>`the ${DEVICES[d.kind].name} reads ${V(d.v)}`).join(', ')}.`);return verdict(2);}
  const b=best(job);
  if(r.waste>b.waste*1.1+.05){const thin=(['feed','ret'] as const).filter(w=>l[w]==='thin');
    notes.push(`${W(r.waste)} is lost as heat before it reaches the devices; the depot can do it with ${W(b.waste)}.${thin.length?` The thin ${thin.map(w=>w==='ret'?'return':'feed').join(' and ')} rail wastes the difference.`:''}`);return verdict(2);}
  notes.push(`${W(r.pUseful)} delivered, only ${W(r.waste)} lost on the way.`);
  return verdict(3);
}

// ---------- the solver ----------
/** Every layout the player can make for a job: swappable rails, barriers on occupied bays, a
 *  crossover rail kept or removed, and every source setting on the knob grid. Returns the cleanest
 *  layout (least wasted power among clean, reliable ones). Proves each job is solvable as built. */
const bestCache=new Map<string,{layout:Layout;waste:number}>();
export function best(job:Job){
  const hit=bestCache.get(job.id);if(hit)return hit;
  let found:{layout:Layout;waste:number}|undefined;
  const occupied=job.start.bays.map((b,k)=>b.device?k:-1).filter(k=>k>=0);
  for(const feed of ['thin','heavy'] as const)for(const ret of ['thin','heavy'] as const)
    for(let mask=0;mask<1<<occupied.length;mask++)for(const clear of job.start.bays.some(b=>b.device==='jumper')?[false,true]:[false]){
      const bays=job.start.bays.map((b,k)=>({device:clear&&b.device==='jumper'?null:b.device,barrier:occupied.includes(k)?!!(mask>>occupied.indexOf(k)&1):false}));
      // Only settings near the band can be clean; scan the knob grid there.
      for(let e=BAND.lo;e<=SOURCE.max+1e-9;e+=SOURCE.step){
        const l:Layout={e:clampE(e),on:true,feed,ret,bays},ev=evaluate(l);if(ev.trip)continue;
        const r=ev.now;if(!r.devices.some(d=>d.required))continue;
        if(!clean(l,r)||!reliable(l,r))continue;
        if(!found||r.waste<found.waste-1e-9)found={layout:clone(l),waste:r.waste};
      }
    }
  if(!found)throw new Error(`job ${job.id} has no clean answer`);
  bestCache.set(job.id,found);return found;
}
function reliable(l:Layout,r:Readings){
  if(Math.abs(r.current)>BREAKER*MARGIN)return false;
  for(const w of ['feed','ret'] as const){const k=l[w];if(k!=='gap'&&Math.abs(r.rails[w])>RAILS[k].rating*MARGIN)return false;}
  return l.bays.every((b,k)=>!isRequired(b.device)||!b.barrier)&&r.devices.every(d=>!d.required||(d.v>=BAND.lo&&d.v<=BAND.hi&&d.i<=DEVICES[d.kind].iMax!));
}

// ---------- process cost ----------
/** Fitting a rail section costs 1; a breaker reset (someone has to walk to the panel) costs 2. */
export const COST={rail:1,reset:2};
/** Least process cost for the whole shift: one rail in job 1, one rail swap in job 2, one reset in job 3. */
export const BEST_COST=COST.rail+COST.rail+COST.reset;
