// Signal Observatory rules. The rooftop receiver feeds a Morse decoder over one cable, which also
// carries 12 V DC for a latch (the dome-shutter relay). Motors couple noise into that cable.
// Pip plugs filter cans into two slots between the receiver and the decoder: one in SERIES with the
// line, one in SHUNT across the decoder (to ground). Each can is a resistor, a coil or a capacitor
// with a knob that steps through real E6 values; the bench shows the corner frequency each one sets.
//
// Everything is computed from the ideal-component formulas (plus each coil's small winding
// resistance), with the real source and load impedances:
//   Z_R = R,  Z_L = R_w + jωL,  Z_C = 1/(jωC),   H(f) = Z_p / (R_s + Z_series + Z_p),
//   Z_p = Z_shunt ∥ R_load.
// Teaching guardrails (docs/EXPANSION_PLAN.md):
//   * An inductor opposes CHANGES in current. Its reactance ωL grows with frequency, and once
//     the switch-on transient is over it carries steady DC. It does not "block AC" as a rule:
//     what a filter removes depends on the topology, the source and the load, and frequency.
//   * A capacitor in series passes changes but no steady DC, so a latch fed through it drops out.
//   * The antenna model is simplified (a quarter-wave whip over a ground plane, vertical
//     polarisation); the numbers are this game's tuning, not a link budget.
//   * c = fλ holds for every band; not every band is safe (UV, X-ray and gamma are ionising or
//     damaging), and the exhibits say so.

export type Kind='R'|'L'|'C';
export type Slot='series'|'shunt';
/** A filter can: what it is and its value (Ω, H or F). */
export interface Part {kind:Kind;value:number}
export const part=(kind:Kind,value:number):Part=>({kind,value});
export const KINDS:Kind[]=['R','L','C'];
/** The E6 series: the values real parts come in, six per decade. */
const E6=[1,1.5,2.2,3.3,4.7,6.8];
const decades=(from:number,to:number)=>{const out:number[]=[];for(let e=from;e<=to;e++)for(const m of E6)out.push(+(m*10**e).toPrecision(2));return out;};
/** The values each can's knob steps through. */
export const VALUES:Record<Kind,number[]>={R:decades(1,3),L:decades(-4,-2),C:decades(-8,-5)};
/** Where a fresh can's knob starts. */
export const DEFAULT:Record<Kind,number>={R:470,L:1e-3,C:100e-9};
/** Winding resistance of a coil (Ω): more turns, more copper. Game tuning. */
export const dcr=(henries:number)=>+(1+1100*henries).toFixed(2);
/** Parts cost: small parts are cheap; big coils and big capacitors cost more. */
export function partCost(p:Part){return p.kind==='R'?1:p.kind==='C'?(p.value>2e-6?2:1):p.value>=5e-3?3:2;}
/** Nearest knob value to v. */
export const snap=(k:Kind,v:number)=>VALUES[k].reduce((a,b)=>Math.abs(Math.log(b/v))<Math.abs(Math.log(a/v))?b:a);
const SI:[number,string][]=[[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n']];
export function valueText(p:Part){
  if(p.kind==='R')return p.value>=1000?`${+(p.value/1000).toPrecision(2)} kΩ`:`${p.value} Ω`;
  const unit=p.kind==='L'?'H':'F';for(const [k,s] of SI)if(p.value>=k*.999)return `${+(p.value/k).toPrecision(2)} ${s}${unit}`;return `${p.value} ${unit}`;
}
export const hz=(f:number)=>f>=1e3?`${+(f/1e3).toPrecision(2)} kHz`:`${Math.round(f)} Hz`;
/** Receiver output impedance, decoder+latch input impedance, the DC feed, and the latch spec. */
export const CIRCUIT={rs:50,rl:600,bias:12,latchMin:9};
export const C_LIGHT=299_792_458;

// ---------- a tiny complex-number kit ----------
export interface Cx {re:number;im:number}
const cx=(re:number,im=0):Cx=>({re,im});
const add=(a:Cx,b:Cx):Cx=>cx(a.re+b.re,a.im+b.im);
const mul=(a:Cx,b:Cx):Cx=>cx(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
const div=(a:Cx,b:Cx):Cx=>{const d=b.re*b.re+b.im*b.im;return cx((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);};
const abs=(a:Cx)=>Math.hypot(a.re,a.im);
const par=(a:Cx,b:Cx)=>div(mul(a,b),add(a,b));

/** Impedance of a module at frequency f (Hz). A capacitor at DC is an open circuit (Infinity). */
export function impedance(m:Part,f:number):Cx{
  const w=2*Math.PI*f;
  if(m.kind==='R')return cx(m.value);
  if(m.kind==='L')return cx(dcr(m.value),w*m.value);
  return f===0?cx(Infinity):cx(0,-1/(w*m.value));
}
export interface Filter {series?:Part;shunt?:Part}
/** The corner frequency a can sets in its slot, with the receiver's and decoder's resistances
 *  (−3 dB point of that one part alone). A resistor sets no corner: it only divides. */
export function corner(slot:Slot,p:Part):number|undefined{
  const {rs,rl}=CIRCUIT,r=slot==='series'?rs+rl:rs*rl/(rs+rl);
  if(p.kind==='C')return 1/(2*Math.PI*r*p.value);if(p.kind==='L')return (r+dcr(p.value))/(2*Math.PI*p.value);return undefined;
}
/** Low-pass or high-pass: what a can in a slot does to the frequencies above its corner. */
export const passes=(slot:Slot,p:Part):'low'|'high'|undefined=>p.kind==='R'?undefined:(slot==='series')===(p.kind==='L')?'low':'high';
/** Voltage at the decoder over the open-circuit receiver voltage, H(f) (complex). */
export function transfer(filter:Filter,f:number):Cx{
  const {rs,rl}=CIRCUIT,s=filter.series,p=filter.shunt;
  const zs=s?impedance(s,f):cx(0),zl=cx(rl);
  let zp=zl;if(p){const z=impedance(p,f);if(Number.isFinite(z.re))zp=par(z,zl);}
  if(!Number.isFinite(zs.re))return cx(0); // series capacitor at DC: nothing gets through
  return div(zp,add(cx(rs),add(zs,zp)));
}
/** |H(f)| relative to a plain cable (no modules): 1 means the filter leaves f untouched. */
export function gain(filter:Filter,f:number){return abs(transfer(filter,f))/abs(transfer({},f));}
export const dB=(x:number)=>20*Math.log10(Math.max(1e-9,x));
/** Steady DC volts reaching the latch. */
export const latchVolts=(filter:Filter)=>+(CIRCUIT.bias*abs(transfer(filter,0))).toFixed(2);

// ---------- antennas ----------
export type RodId='r3'|'r17'|'r75'|'r150';
export const RODS:Record<RodId,{length:number;label:string;band:string}>={
  r3:{length:.031,label:'3.1 cm',band:'2.4 GHz'},r17:{length:.173,label:'17 cm',band:'433 MHz'},
  r75:{length:.75,label:'75 cm',band:'100 MHz'},r150:{length:1.5,label:'1.5 m',band:'50 MHz'}};
export const ROD_IDS=Object.keys(RODS) as RodId[];
export const wavelength=(hz:number)=>C_LIGHT/hz;
export const quarterWave=(hz:number)=>wavelength(hz)/4;
/** Simplified whip model: a monopole near λ/4 is resonant and matches the receiver; far from it,
 *  most of the signal reflects. Cross-polarised (horizontal rod, vertical beacon) loses ~20 dB. */
export function antennaFactor(rod:RodId,vertical:boolean,hz:number){
  const r=Math.log(RODS[rod].length/quarterWave(hz))/.35;
  return Math.exp(-r*r)*(vertical?1:.1);
}

// ---------- the jobs ----------
export interface Tone {f:number;a:number}
export interface Job {
  id:string;title:string;ask:string;
  /** The decoded message and the Morse tone's pitch (Hz) after the receiver's detector. */
  message:string;fs:number;
  /** Interference tones at the decoder with a plain cable (signal amplitude = 1). */
  noise:Tone[];
  /** The noise comes from the motor cart, so it falls with distance and a cleaner cable route. */
  cart?:boolean;
  /** The DC-fed latch must hold (≥ latchMin volts). */
  latch?:boolean;
  /** The beacon's carrier frequency (Hz): the antenna rod and its orientation matter. */
  beacon?:number;
}
/** Commutator (brush) noise: a fundamental and falling harmonics. */
const brush=(f:number,a:number,n=5):Tone[]=>Array.from({length:n},(_,k)=>({f:f*(k+1),a:a/(k+1)}));
export const JOBS:Job[]=[
  {id:'garble',title:'Clean up the garbled message',ask:'Motor noise buries the Morse. Move the cart, reroute the cable, filter the line.',
    message:'CQ CQ DE PIP',fs:700,noise:brush(9000,3.2),cart:true},
  {id:'latch',title:'Keep the shutter latch powered',ask:'The dome motor whines at 4 kHz. Filter it out, but the 12 V latch on the same line must still hold.',
    message:'DOME OPEN',fs:700,noise:brush(4000,1.4,4),latch:true},
  {id:'beacon',title:'Tune the antenna to the 100 MHz beacon',ask:'A new beacon transmits at 100 MHz, vertically polarised. Fit and orient the right whip.',
    message:'STARS CLEAR',fs:700,noise:brush(4000,1.4,4),latch:true,beacon:100e6},
];
/** Decoding thresholds at the decoder (signal-to-noise, and the tone must still be loud enough). */
export const SPEC={decodeSnr:6,reliableSnr:12,minLevel:.5};
/** Noise picked up from the motor cart: falls off with distance (tuning, not a field model) and
 *  halves (−6 dB) when the cable is rerouted away from the motor. */
export function cartCoupling(distance:number,rerouted:boolean){return Math.min(1,1.2/Math.max(.3,distance))*(rerouted?.5:1);}
export const CART_SAFE=4;

export interface Setup extends Filter {rerouted:boolean;cartDistance:number;rod:RodId;vertical:boolean}
export interface Reading {level:number;noise:number;snr:number;latch:number;latchOk:boolean;antenna:number;
  /** Per-tone amplitudes before and after the filter, for the scope's spectrum. */
  tones:{f:number;before:number;after:number;signal:boolean}[]}
export function read(job:Job,s:Setup):Reading{
  // The dome motor's hum reaches the receiver through its own mount, so rerouting only helps with the cart.
  const ant=job.beacon?antennaFactor(s.rod,s.vertical,job.beacon):1,scale=job.cart?cartCoupling(s.cartDistance,s.rerouted):1;
  const tones=[{f:job.fs,before:ant,after:ant*gain(s,job.fs),signal:true},...job.noise.map(t=>({f:t.f,before:t.a*scale,after:t.a*scale*gain(s,t.f),signal:false}))];
  const level=tones[0].after,noise=Math.hypot(...tones.slice(1).map(t=>t.after)),snr=+dB(level/Math.max(1e-6,noise)).toFixed(1);
  const latch=latchVolts(s);return {level,noise,snr,latch,latchOk:latch>=CIRCUIT.latchMin,antenna:ant,tones};
}
export const cost=(f:Filter)=>(f.series?partCost(f.series):0)+(f.shunt?partCost(f.shunt):0);

export interface Verdict {tier:0|1|2|3;problems:string[];notes:string[];snr:number;cost:number}
function describe(f:Filter){
  const s=f.series,p=f.shunt;
  if(s?.kind==='L'&&p?.kind==='C')return 'LC low-pass';if(s?.kind==='R'&&p?.kind==='C')return 'RC low-pass';
  if(!s&&p?.kind==='C')return 'shunt-C low-pass';if(s?.kind==='C')return 'high-pass (series C)';if(p?.kind==='L')return 'high-pass (shunt L)';
  if(!s&&!p)return 'none (wire link)';return 'filter';
}
export const filterName=describe;
/** Judges the decode against the job: tier 0 = not decoded, 1 = decodes, 2 = decodes with margin
 *  (and the latch holds where it must), 3 = reliable with the cheapest parts that can do it. */
export function judge(job:Job,s:Setup):Verdict{
  const r=read(job,s),problems:string[]=[],notes:string[]=[],c=cost(s);
  const sm=s.series,pm=s.shunt;
  if(job.beacon&&r.antenna<.3)problems.push(s.vertical||RODS[s.rod].length/quarterWave(job.beacon)<.7||RODS[s.rod].length/quarterWave(job.beacon)>1.4
    ?`A ${RODS[s.rod].label} whip is far from a quarter wave at ${job.beacon/1e6} MHz (λ = c/f = ${wavelength(job.beacon).toFixed(1)} m, so λ/4 ≈ ${quarterWave(job.beacon).toFixed(2)} m). Most of the signal reflects.`
    :'The beacon is vertically polarised; a horizontal whip catches only a sliver of it.');
  if(job.latch&&!r.latchOk)problems.push(sm?.kind==='C'
    ?`The latch dropped out: a series capacitor passes changes but no steady DC, so only ${r.latch} V reaches it (needs ${CIRCUIT.latchMin} V).`
    :sm?.kind==='R'?`The latch dropped out: the ${valueText(sm)} resistor and the 600 Ω load split the 12 V, leaving ${r.latch} V (needs ${CIRCUIT.latchMin} V).`
    :pm?.kind==='L'?`The latch dropped out: a shunt inductor carries steady DC straight to ground, leaving ${r.latch} V.`
    :`Only ${r.latch} V reaches the latch; it needs ${CIRCUIT.latchMin} V.`);
  // The latch is checked before the tone: it is the lesson of the DC-fed jobs.
  if(r.level<SPEC.minLevel&&!problems.length)problems.push(`The tone itself is down to ${Math.round(r.level*100)}% at ${job.fs} Hz: this filter cuts the message too.`);
  if(r.snr<SPEC.decodeSnr&&!problems.length)problems.push(sm?.kind==='C'||pm?.kind==='L'
    ?`Signal/noise is ${r.snr} dB. A high-pass lets the motor noise straight through: it sits above the ${job.fs} Hz tone.`
    :`Signal/noise is ${r.snr} dB; the decoder needs ${SPEC.decodeSnr} dB. The motor noise sits at ${hz(job.noise[0].f)} and up, above the ${job.fs} Hz tone.`);
  if(problems.length)return {tier:0,problems,notes,snr:r.snr,cost:c};
  if(r.snr<SPEC.reliableSnr){notes.push(`It decodes, but ${r.snr} dB leaves little margin (reliable is ${SPEC.reliableSnr} dB).`);return {tier:1,problems,notes,snr:r.snr,cost:c};}
  // The lean answer assumes the room step was done (the motor cart moved away).
  const best=cheapest(job,{cartDistance:Math.max(s.cartDistance,CART_SAFE)});
  if(best&&c>best.cost){notes.push(`Reliable. Cheaper parts can do it too (cost ${best.cost} vs ${c}).`);return {tier:2,problems,notes,snr:r.snr,cost:c};}
  return {tier:3,problems,notes,snr:r.snr,cost:c};
}
/** Every filter, route and antenna the bench offers that passes this job reliably, cheapest
 *  first. The room state (how far the cart is) is taken from `s`. Antennas: for a beacon job the
 *  right whip, upright, is assumed (it costs nothing extra); the bench checks the real one. */
const ALL_PARTS:Part[]=KINDS.flatMap(k=>VALUES[k].map(v=>part(k,v)));
const solved=new Map<string,{setup:Setup;cost:number;snr:number}[]>();
export function solutions(job:Job,s:Pick<Setup,'cartDistance'>){
  const key=`${job.id}|${s.cartDistance}`;let out=solved.get(key);if(out)return out;out=[];
  const opts=[undefined,...ALL_PARTS],rod=job.beacon?ROD_IDS.reduce((a,b)=>antennaFactor(b,true,job.beacon!)>antennaFactor(a,true,job.beacon!)?b:a):'r75' as RodId;
  for(const series of opts)for(const shunt of opts)for(const rerouted of job.cart?[false,true]:[false]){
    const setup:Setup={series,shunt,rerouted,rod,vertical:true,cartDistance:s.cartDistance},r=read(job,setup);
    if(r.level>=SPEC.minLevel&&r.snr>=SPEC.reliableSnr&&(!job.latch||r.latchOk)&&(!job.beacon||r.antenna>=.3))out.push({setup,cost:cost(setup),snr:r.snr});}
  out.sort((a,b)=>a.cost-b.cost||b.snr-a.snr);solved.set(key,out);return out;
}
export function cheapest(job:Job,s:Pick<Setup,'cartDistance'>){
  const best=solutions(job,s)[0];if(!best)return undefined;
  const f=best.setup,parts=[f.series&&`${valueText(f.series)} ${f.series.kind} in series`,f.shunt&&`${valueText(f.shunt)} ${f.shunt.kind} in shunt`].filter(Boolean).join(' + ')||'no cans';
  return {...best,hint:`${parts}${f.rerouted&&job.cart?', cable rerouted':''}`};
}

// ---------- the switch-on transient (for the scope's STEP view) ----------
/** Simulates the 12 V feed switching on through the filter into the load: returns samples of
 *  the load voltage and the series-element current over `span` seconds. Semi-implicit Euler on
 *  the circuit's state variables (inductor currents, capacitor voltages). */
export function stepResponse(f:Filter,span=stepSpan(f),n=240){
  const {rs,rl,bias}=CIRCUIT,s=f.series,p=f.shunt;
  const rload=p?.kind==='R'?1/(1/rl+1/p.value):rl,ra=rs+(s?.kind==='R'?s.value:0)+(s?.kind==='L'?dcr(s.value):0);
  // State: series-L current, series-C voltage, shunt-C voltage, shunt-L current.
  let iL=0,vCs=0,vCp=0,iLp=0;
  /** Load voltage and series current from the state (the rest of the circuit is resistive). */
  const node=()=>{const vin=bias-(s?.kind==='C'?vCs:0);
    if(p?.kind==='C')return {v:vCp,i:s?.kind==='L'?iL:(vin-vCp)/ra};
    if(s?.kind==='L')return {v:(iL-iLp)*rload,i:iL};
    const v=(vin/ra-iLp)/(1/ra+1/rload);return {v,i:(vin-v)/ra};};
  const out:{t:number;v:number;i:number}[]=[{t:0,...node()}],sub=400,dt=span/(n*sub);
  for(let k=1;k<=n;k++){
    for(let j=0;j<sub;j++){const {v,i}=node();
      if(s?.kind==='L')iL+=dt*(bias-ra*iL-v)/s.value;
      if(s?.kind==='C')vCs+=dt*i/s.value;
      if(p?.kind==='C')vCp+=dt*(i-v/rload)/p.value;
      if(p?.kind==='L')iLp+=dt*(v-dcr(p.value)*iLp)/p.value;}
    out.push({t:k*span/n,...node()});
  }
  return out;
}
/** A scope timebase long enough to see the slowest part of the transient settle. */
export function stepSpan(f:Filter){
  const {rs,rl}=CIRCUIT,taus:number[]=[2e-4];
  for(const [m,slot] of [[f.series,'series'],[f.shunt,'shunt']] as const){if(!m)continue;
    if(m.kind==='L')taus.push(m.value/(slot==='series'?rs+rl+dcr(m.value):rs*rl/(rs+rl)+dcr(m.value)));
    if(m.kind==='C')taus.push(m.value*(slot==='series'?rs+rl:rs*rl/(rs+rl)));}
  if(f.series?.kind==='L'&&f.shunt?.kind==='C')taus.push(Math.PI*Math.sqrt(f.series.value*f.shunt.value));
  return Math.min(.04,Math.max(1e-3,5*Math.max(...taus)));
}

// ---------- Morse, for the decoder readout and the speaker ----------
const MORSE:Record<string,string>={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..'};
/** Key-down intervals in dot units: [start, length] pairs, plus the total length of the loop. */
export function morse(text:string){
  const marks:[number,number][]=[];let t=0;
  for(const ch of text){if(ch===' '){t+=4;continue;}const code=MORSE[ch];if(!code)continue;
    for(const s of code){const len=s==='.'?1:3;marks.push([t,len]);t+=len+1;}t+=2;}
  return {marks,length:t+6};
}
/** What the decoder prints: each character is right or garbled depending on the SNR (stable per
 *  `epoch` so the readout flickers slowly rather than every frame). */
export function decoded(text:string,snr:number,epoch:number){
  const bad=Math.min(1,Math.max(0,(SPEC.reliableSnr-snr)/(SPEC.reliableSnr-SPEC.decodeSnr+6)));
  const junk='#?%*~';let out='';
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch===' '){out+=' ';continue;}
    const h=Math.sin((i+1)*12.9898+epoch*78.233)*43758.5453,r=h-Math.floor(h);out+=r<bad?junk[Math.floor(r*997)%junk.length]:ch;}
  return out;
}
