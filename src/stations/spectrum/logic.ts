// Spectrum Delivery rules. A transmitter tower by the dispatch desk sends a message to a receiver
// pod that Pip carries around the research hall. Between them stand real obstacles: a brick
// storeroom, a glass lab behind a metal shutter (with one small hatch), toaster smoke in the tea
// corner and a copper-mesh screened room. Pip picks the band, the matching detector head, the
// transmit power, opens or shuts the hatch, and stands mirror boards on floor marks.
//
// The model (simplified, and labelled as such for the player):
//   link margin (dB) = P_tx (dBm) + K_band − spreading − Σ obstacle losses − 1 dB per mirror
//                      − ambient light (visible band only, in a sunny room)
//   spreading = 20·log10(d) for radio and microwave (the wave spreads out in all directions);
//               10·log10(d) for the light and infrared links (wide LED beams, not lasers).
//   works = margin ≥ 0 dB; works reliably = margin ≥ 10 dB.
// Teaching guardrails:
//   * Every band is the same kind of wave: c = f·λ in vacuum (air is close enough).
//   * What an obstacle does depends on the band: brick passes radio and blocks light; window
//     glass passes visible and near-IR but absorbs 10 µm thermal IR; metal reflects them all; a
//     mesh with holes much smaller than the wavelength reflects radio and microwaves but lets light
//     through; smoke scatters short wavelengths most.
//   * A hole much smaller than half a wavelength does not let that wave through (the 3 m radio wave
//     cannot use a 30 cm hatch).
//   * A detector only responds to its own band.
//   * Mirrors here are optical mirrors for light and IR. The radio and microwave links use the
//     direct path; reflections of those bands are not modelled (the broadcast antenna spreads the
//     wave everywhere and the room's echoes are left out).
//   * Not every band is safe to stand beside: UV, X-rays and gamma rays appear only as exhibits.
//   * Numbers are this game's tuning values, not a real link budget.

export type Band='radio'|'micro'|'thermal'|'nir'|'vis';
export type Detector='dipole'|'patch'|'thermopile'|'nirdiode'|'visdiode';
export type Material='brick'|'wood'|'glass'|'metal'|'hatch'|'mesh'|'smoke';
export type Pad='store'|'lab'|'quiet';
export type Spot='A'|'B'|'C';
export interface P {x:number;z:number}

export const C_LIGHT=299_792_458;
export interface BandInfo {id:Band;name:string;short:string;lambda:number;detector:Detector;
  /** Link constant (dB at 1 mW and 1 m, detector sensitivity included). */
  k:number;
  /** Spreading exponent: 2 for a wave spreading everywhere, 1 for a wide beam. */
  n:number;
  /** Optical bands travel as a beam (line of sight, mirrors steer them). */
  beam:boolean;color:string;example:string;
  /** Wave-ribbon cycles on the bench (not to scale: a log-scale stand-in for λ). */
  cycles:number}
export const BANDS:Record<Band,BandInfo>={
  radio:{id:'radio',name:'Radio 100 MHz',short:'RADIO',lambda:C_LIGHT/100e6,detector:'dipole',k:36,n:2,beam:false,color:'#e5484d',example:'FM radio',cycles:1},
  micro:{id:'micro',name:'Microwave 2.4 GHz',short:'MICROWAVE',lambda:C_LIGHT/2.4e9,detector:'patch',k:38,n:2,beam:false,color:'#f08a4b',example:'Wi-Fi',cycles:2},
  thermal:{id:'thermal',name:'Thermal IR 10 µm',short:'THERMAL IR',lambda:10e-6,detector:'thermopile',k:26,n:1,beam:true,color:'#d9822b',example:'body heat',cycles:4},
  nir:{id:'nir',name:'Near IR 850 nm',short:'NEAR IR',lambda:850e-9,detector:'nirdiode',k:24,n:1,beam:true,color:'#b0406a',example:'TV remote',cycles:6.5},
  vis:{id:'vis',name:'Visible 530 nm',short:'VISIBLE',lambda:530e-9,detector:'visdiode',k:23,n:1,beam:true,color:'#3fae6a',example:'green light',cycles:9},
};
export const BAND_IDS=Object.keys(BANDS) as Band[];
export const frequency=(b:Band)=>C_LIGHT/BANDS[b].lambda;
export const DETECTORS:Record<Detector,{label:string;band:Band}>={
  dipole:{label:'Dipole antenna',band:'radio'},patch:{label:'Patch antenna',band:'micro'},thermopile:{label:'Thermopile',band:'thermal'},
  nirdiode:{label:'Near-IR photodiode',band:'nir'},visdiode:{label:'Green photodiode',band:'vis'}};
export const DETECTOR_IDS=Object.keys(DETECTORS) as Detector[];
/** Transmit power steps (mW) and their process cost (energy used per send). */
export const POWERS=[1,10,100] as const;
export type Power=typeof POWERS[number];
export const POWER_COST:Record<Power,number>={1:1,10:2,100:4};
export const dBm=(mw:number)=>10*Math.log10(mw);
export const SPEC={works:0,reliable:10};

/** Loss per crossing (dB); Infinity blocks. Simplified game values. */
export const LOSS:Record<Material,Record<Band,number>>={
  brick:{radio:4,micro:10,thermal:Infinity,nir:Infinity,vis:Infinity},
  wood:{radio:2,micro:5,thermal:Infinity,nir:Infinity,vis:Infinity},
  glass:{radio:1,micro:2,thermal:Infinity,nir:1,vis:1},
  metal:{radio:Infinity,micro:Infinity,thermal:Infinity,nir:Infinity,vis:Infinity},
  // The open hatch: a 30 cm hole in the metal shutter. Far smaller than half of radio's 3 m wave.
  hatch:{radio:Infinity,micro:8,thermal:0,nir:0,vis:0},
  mesh:{radio:Infinity,micro:Infinity,thermal:3,nir:3,vis:3},
  smoke:{radio:0,micro:0,thermal:1,nir:12,vis:25},
};
export const MATERIAL_NAMES:Record<Material,string>={brick:'brick wall',wood:'wooden door',glass:'glass partition',metal:'metal shutter',hatch:'shutter hatch',mesh:'mesh cage',smoke:'toaster smoke'};

// ---------- the hall (plan coordinates in metres; the room and the bench map draw from these) ----------
/** The transmitter tower beside the dispatch desk. */
export const TX:P={x:-.8,z:2.3};
export const PADS:Record<Pad,P>={store:{x:-8.2,z:-5.8},lab:{x:7,z:-6},quiet:{x:8.2,z:4.8}};
export const PAD_NAMES:Record<Pad,string>={store:'storeroom',lab:'glass lab',quiet:'quiet room'};
/** Where the pod waits at the start (the dock by the entrance). */
export const POD_HOME:P={x:-6.4,z:5.2};
export const HATCH={x0:5.1,x1:5.7,z:-3.2};
const hatchMid={x:(HATCH.x0+HATCH.x1)/2,z:HATCH.z};
/** Mirror marks on the floor. A sits on the line from the lab pad out through the hatch. */
export const SPOTS:Record<Spot,P>=(()=>{const d={x:hatchMid.x-PADS.lab.x,z:hatchMid.z-PADS.lab.z},l=Math.hypot(d.x,d.z);
  return {A:{x:+(hatchMid.x+d.x/l*3.7).toFixed(3),z:+(hatchMid.z+d.z/l*3.7).toFixed(3)},B:{x:-2.6,z:-1.6},C:{x:1,z:5.8}};})();
export const SPOT_IDS=Object.keys(SPOTS) as Spot[];
export const MIRRORS=2;
export const SMOKE={x:2.4,z:3.4,r:1.3};
/** Walls as plan rectangles (for colliders and drawing) with the material a beam meets. */
export interface Wall {id:string;a:P;b:P;mat:Material[];thick:number}
export const STORE={x0:-11,x1:-4.6,z0:-8,z1:-3.2,door:[-11,-9.4] as [number,number],wood:[-6.4,-5] as [number,number]};
export const LAB={x0:2,x1:11,z0:-8,z1:-3.2,door:[9.4,11] as [number,number]};
export const QUIET={x0:5.5,x1:11,z0:1.5,z1:8,door:[9.4,11] as [number,number]};
export function walls(hatchOpen:boolean):Wall[]{
  const s=STORE,l=LAB,q=QUIET;
  return [
    {id:'store-front',a:{x:s.door[1],z:s.z1},b:{x:s.x1,z:s.z1},mat:['brick'],thick:.3},
    {id:'store-side-a',a:{x:s.x1,z:s.z0},b:{x:s.x1,z:s.wood[0]},mat:['brick'],thick:.3},
    {id:'store-door',a:{x:s.x1,z:s.wood[0]},b:{x:s.x1,z:s.wood[1]},mat:['wood'],thick:.12},
    {id:'store-side-b',a:{x:s.x1,z:s.wood[1]},b:{x:s.x1,z:s.z1},mat:['brick'],thick:.3},
    {id:'lab-side',a:{x:l.x0,z:l.z0},b:{x:l.x0,z:l.z1},mat:['brick'],thick:.3},
    // The shutter hangs on the hall side of the glass, so a beam meets the metal (or hatch) first.
    {id:'lab-front-a',a:{x:l.x0,z:l.z1},b:{x:HATCH.x0,z:l.z1},mat:['metal','glass'],thick:.16},
    {id:'lab-hatch',a:{x:HATCH.x0,z:l.z1},b:{x:HATCH.x1,z:l.z1},mat:[hatchOpen?'hatch':'metal','glass'],thick:.16},
    {id:'lab-front-b',a:{x:HATCH.x1,z:l.z1},b:{x:l.door[0],z:l.z1},mat:['metal','glass'],thick:.16},
    {id:'quiet-side',a:{x:q.x0,z:q.z0},b:{x:q.x0,z:q.z1},mat:['mesh'],thick:.1},
    {id:'quiet-front',a:{x:q.x0,z:q.z0},b:{x:q.door[0],z:q.z0},mat:['mesh'],thick:.1},
  ];
}

// ---------- geometry ----------
const cross=(a:P,b:P)=>a.x*b.z-a.z*b.x;
const sub=(a:P,b:P):P=>({x:a.x-b.x,z:a.z-b.z});
export const dist=(a:P,b:P)=>Math.hypot(a.x-b.x,a.z-b.z);
/** Where segment p→q crosses segment a→b (strictly inside both), as the fraction along p→q. */
export function crossing(p:P,q:P,a:P,b:P):number|undefined{
  const r=sub(q,p),s=sub(b,a),d=cross(r,s);if(Math.abs(d)<1e-12)return undefined;
  const t=cross(sub(a,p),s)/d,u=cross(sub(a,p),r)/d;return t>1e-6&&t<1-1e-6&&u>=0&&u<=1?t:undefined;
}
/** Does segment p→q pass through the smoke cloud? Returns the fraction of its closest approach. */
export function throughCloud(p:P,q:P,c:{x:number;z:number;r:number}):number|undefined{
  const d=sub(q,p),l2=d.x*d.x+d.z*d.z,t=Math.max(0,Math.min(1,((c.x-p.x)*d.x+(c.z-p.z)*d.z)/l2)),x=p.x+d.x*t,z=p.z+d.z*t;
  return Math.hypot(x-c.x,z-c.z)<c.r?t:undefined;
}
export interface Hit {mat:Material;at:P;loss:number;wall?:string}
/** Everything a leg meets, in order along it. */
export function legHits(p:P,q:P,band:Band,hatchOpen:boolean):Hit[]{
  const hits:(Hit&{t:number})[]=[];
  for(const w of walls(hatchOpen)){const t=crossing(p,q,w.a,w.b);if(t===undefined)continue;const at={x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t};
    for(const m of w.mat)hits.push({mat:m,at,loss:LOSS[m][band],wall:w.id,t});}
  const ts=throughCloud(p,q,SMOKE);if(ts!==undefined)hits.push({mat:'smoke',at:{x:p.x+(q.x-p.x)*ts,z:p.z+(q.z-p.z)*ts},loss:LOSS.smoke[band],t:ts});
  return hits.sort((a,b)=>a.t-b.t).map(({t:_t,...h})=>h);
}

// ---------- jobs ----------
export interface Job {id:string;pad:Pad;title:string;ask:string;message:string;
  /** Sunlight in the room swamps a plain visible-light detector (dB lost, visible band only). */
  ambient?:number;
  /** The shutter hatch matters for this delivery. */
  hatch?:boolean}
export const JOBS:Job[]=[
  {id:'store',pad:'store',title:'Through the brick wall',message:'STOCK CHECK AT 4',
    ask:'The storeroom keeper needs a message. The pod sits behind a solid brick wall.'},
  {id:'lab',pad:'lab',title:'Into the shuttered lab',message:'LAB TEA IS READY',ambient:6,hatch:true,
    ask:'The glass lab has its metal shutter down. Only a small hatch opens. The lab is sunny.'},
  {id:'quiet',pad:'quiet',title:'Past the smoke, into the quiet room',message:'ALL CLEAR, PIP',
    ask:'Burnt toast fills the tea corner with smoke, and the quiet room is a copper-mesh cage. Find a band that gets through both.'},
];

export interface Setup {band:Band;detector:Detector;power:Power;hatchOpen:boolean;
  /** Floor marks with a mirror board standing on them. */
  mirrors:Spot[];
  /** Where the pod stands (a pad, or loose somewhere). */
  pod:Pad|null}
export interface Leg {a:P;b:P;hits:Hit[]}
export interface Route {path:P[];spots:Spot[];legs:Leg[];length:number;spread:number;loss:number;margin:number;
  /** The margin with each outright block counted as 1000 dB: ranks blocked routes by how close they came. */
  score:number;
  /** First obstacle that stops it outright (Infinity loss). */
  blocked?:Hit}
/** Margin along one route (no detector or ambient terms). */
function along(band:Band,power:Power,path:P[],spots:Spot[],hatchOpen:boolean):Route{
  const b=BANDS[band],legs:Leg[]=[];let length=0,loss=0,capped=0,blocked:Hit|undefined;
  for(let i=1;i<path.length;i++){const hits=legHits(path[i-1],path[i],band,hatchOpen);legs.push({a:path[i-1],b:path[i],hits});length+=dist(path[i-1],path[i]);
    for(const h of hits){loss+=h.loss;capped+=Math.min(1000,h.loss);if(!blocked&&!Number.isFinite(h.loss))blocked=h;}}
  loss+=spots.length;capped+=spots.length;const spread=b.n*10*Math.log10(Math.max(1,length)),base=dBm(power)+b.k-spread;
  return {path,spots,legs,length,spread,loss,margin:base-loss,score:base-capped,blocked};
}
/** Mirror orderings to try: none, each one, each ordered pair. */
function orders(spots:Spot[]):Spot[][]{
  const out:Spot[][]=[[]];for(const a of spots){out.push([a]);for(const b of spots)if(b!==a)out.push([a,b]);}return out;
}
/** The best route the transmitter can find for this band. Beams may bounce off standing mirrors
 *  (the tower and the mirror mounts aim themselves); radio and microwave take the direct path. */
export function bestRoute(job:Job,s:Pick<Setup,'band'|'power'|'hatchOpen'|'mirrors'>,to:P=PADS[job.pad]):Route{
  const tries=BANDS[s.band].beam?orders(s.mirrors):[[]];let best:Route|undefined;
  for(const o of tries){const r=along(s.band,s.power,[TX,...o.map(k=>SPOTS[k]),to],o,s.hatchOpen);
    // Strongest route wins; on a tie, fewer mirrors. Blocked routes rank by how close they came.
    if(!best||r.score>best.score+1e-9||(Math.abs(r.score-best.score)<1e-9&&r.spots.length<best.spots.length))best=r;}
  return best!;
}
export interface Reading {route:Route;margin:number;detectorOk:boolean;ambient:number;podOk:boolean}
export function read(job:Job,s:Setup):Reading{
  const route=bestRoute(job,s),detectorOk=DETECTORS[s.detector].band===s.band,ambient=s.band==='vis'?job.ambient??0:0;
  return {route,margin:detectorOk?route.margin-ambient:-Infinity,detectorOk,ambient,podOk:s.pod===job.pad};
}
export const tierOf=(margin:number):0|1|2=>margin>=SPEC.reliable?2:margin>=SPEC.works?1:0;
export const cost=(s:Pick<Setup,'power'>,r:Route)=>POWER_COST[s.power]+r.spots.length;

/** Why a band stops at a material, in one or two plain sentences. */
export function whyBlocked(m:Material,band:Band):string{
  const n=BANDS[band].short.toLowerCase();
  switch(m){
    case 'brick':return `Brick is opaque to ${n}: the beam stops at the wall. Radio's long wave passes through brick.`;
    case 'wood':return `Wood is opaque to ${n}.`;
    case 'glass':return 'Window glass lets visible and near-IR light through, but it absorbs 10 µm thermal infrared.';
    case 'metal':return band==='radio'||band==='micro'?`Metal reflects ${n}: the shutter stops it. Light could use the hatch, if it can get to it.`:`Metal reflects ${n}: the closed shutter stops the beam. Open the hatch and send the beam through it.`;
    case 'hatch':return 'The hatch is 30 cm across. Radio\'s 3 m wave can\'t pass a hole much smaller than half a wavelength.';
    case 'mesh':return `The quiet room is a mesh cage: its holes are far smaller than the ${n} wavelength, so the mesh reflects it. Light passes between the wires.`;
    case 'smoke':return 'Smoke scatters it away.';
  }
}
export interface Verdict {tier:0|1|2|3;problems:string[];notes:string[];margin:number;cost:number}
export function judge(job:Job,s:Setup):Verdict{
  const r=read(job,s),c=cost(s,r.route),problems:string[]=[],notes:string[]=[],margin=+r.margin.toFixed(1);
  if(!r.podOk)problems.push(`The receiver pod isn't on the ${PAD_NAMES[job.pad]} pad.`);
  else if(!r.detectorOk){const d=DETECTORS[s.detector],want=DETECTOR_IDS.find(k=>DETECTORS[k].band===s.band)!;
    problems.push(`A ${d.label.toLowerCase()} only responds to ${BANDS[d.band].name.toLowerCase()}; it can't hear ${BANDS[s.band].name.toLowerCase()}. Fit the ${DETECTORS[want].label.toLowerCase()}.`);}
  else if(r.route.blocked)problems.push(`${MATERIAL_NAMES[r.route.blocked.mat][0].toUpperCase()+MATERIAL_NAMES[r.route.blocked.mat].slice(1)}: ${whyBlocked(r.route.blocked.mat,s.band)}`);
  else if(r.margin<SPEC.works){const smoke=r.route.legs.some(l=>l.hits.some(h=>h.mat==='smoke'));
    problems.push(`Too weak: ${margin} dB. ${smoke&&(s.band==='vis'||s.band==='nir')?'Smoke scatters short wavelengths hardest; long-wave thermal IR slips through. ':''}${r.ambient?'Sunlight swamps the green photodiode here. ':''}More power, fewer losses, or another band.`);}
  if(problems.length)return {tier:0,problems,notes,margin,cost:c};
  if(r.margin<SPEC.reliable){notes.push(`Received, but only ${margin} dB of margin (reliable needs ${SPEC.reliable} dB).`);return {tier:1,problems,notes,margin,cost:c};}
  const best=leanest(job,s);
  if(best&&(best.power<s.power||(best.power===s.power&&best.mirrors<r.route.spots.length))){notes.push(`Reliable. Leaner: ${best.hint}.`);return {tier:2,problems,notes,margin,cost:c};}
  return {tier:3,problems,notes,margin,cost:c};
}

// ---------- the solver ----------
/** Every reliable way to make this delivery with the hall as it could be set up: any band (with
 *  its matching detector), any power, hatch open or shut, and up to MIRRORS boards on the marks.
 *  Sorted leanest first: lowest power, then fewest mirrors in the beam. */
export function solutions(job:Job){
  const out:{setup:Setup;margin:number;power:Power;mirrors:number;cost:number}[]=[];
  const subsets:Spot[][]=[[]];for(const a of SPOT_IDS){subsets.push([a]);for(const b of SPOT_IDS)if(a<b)subsets.push([a,b]);}
  for(const band of BAND_IDS)for(const power of POWERS)for(const hatchOpen of [false,true])for(const mirrors of subsets){
    const setup:Setup={band,detector:BANDS[band].detector,power,hatchOpen,mirrors,pod:job.pad},r=read(job,setup);
    if(r.margin>=SPEC.reliable)out.push({setup,margin:r.margin,power,mirrors:r.route.spots.length,cost:cost(setup,r.route)});}
  return out.sort((a,b)=>a.power-b.power||a.mirrors-b.mirrors||b.margin-a.margin);
}
export function leanest(job:Job,_s?:Setup){
  const best=solutions(job)[0];if(!best)return undefined;const s=best.setup;
  return {...best,hint:`${BANDS[s.band].name} at ${s.power} mW${best.mirrors?` with ${best.mirrors} mirror${best.mirrors>1?'s':''}`:''}`};
}

// ---------- display helpers ----------
const SI:[number,string][]=[[1e12,'T'],[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n']];
export function si(v:number,unit:string){for(const [k,s] of SI)if(v>=k*.9995)return `${+(v/k).toPrecision(3)} ${s}${unit}`;return `${v.toExponential(1)} ${unit}`;}
export const lambdaText=(b:Band)=>si(BANDS[b].lambda,'m');
export const freqText=(b:Band)=>si(frequency(b),'Hz');
