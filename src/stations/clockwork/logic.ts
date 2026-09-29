// Clockwork Kitchen rules (pure: no three.js, no DOM). An oven controller times each cook by
// counting ticks: it waits for cookSeconds × 1000 ticks, because its firmware assumes one tick
// every millisecond. The tick is the clock source divided by a whole number (the prescaler), so
// the cook is only as right as (1) the source's frequency, which starts off by its tolerance and
// wanders as the board warms, (2) the divider, which can only divide by whole numbers, and
// (3) the clock line, which picks up extra edges if it runs past the mixer motor.
//
// Teaching guardrails (said in the station too):
// - A controller needs a timing reference; it may be internal (built into the chip) or external.
// - A crystal is stable, but it is not fitted by default: where the internal RC meets the spec it
//   is the right answer. Firmware and clock division decide what happens on each tick.
// - Accuracy figures are typical module values, used as game tuning, not a datasheet. Real crystals
//   drift along a curve with temperature; here every source drifts in a straight line (simplified).
// - Timing error accumulates: a fractional error × the cook time = seconds off at the end.

export type SourceId='rc'|'res8'|'xtal12'|'watch';
export interface Source {id:SourceId;label:string;short:string;hz:number;
  /** Initial tolerance (±fraction at 25 °C) and drift per °C away from 25 °C (fraction; sign = direction on this unit). */
  tol:number;drift:number;
  /** This particular unit's actual offset at 25 °C (inside its tolerance). */
  offset:number;cost:number;external:boolean}
export const SOURCES:Record<SourceId,Source>={
  rc:{id:'rc',label:'Internal RC 8 MHz',short:'INTERNAL RC',hz:8e6,tol:.01,drift:-3e-4,offset:.003,cost:0,external:false},
  res8:{id:'res8',label:'Ceramic resonator 8 MHz',short:'RESONATOR',hz:8e6,tol:.005,drift:-2e-5,offset:.002,cost:2,external:true},
  xtal12:{id:'xtal12',label:'Crystal 12 MHz',short:'CRYSTAL',hz:12e6,tol:3e-5,drift:-5e-7,offset:1e-5,cost:3,external:true},
  watch:{id:'watch',label:'Watch crystal 32.768 kHz',short:'WATCH XTAL',hz:32768,tol:2e-5,drift:-4e-7,offset:5e-6,cost:2,external:true},
};
export const SOURCE_IDS:SourceId[]=['rc','res8','xtal12','watch'];
/** Prescaler settings on the divider knob. */
export const DIVIDERS=[32,4000,8000,12000,16000];
/** The firmware's assumed tick rate (Hz): one tick per millisecond. */
export const TICK_HZ=1000;
/** Extra counts from a clock line routed past the running mixer motor (fraction; simplified). */
export const GLITCH=.015;
export const ROOM_T=25;

export interface Setup {source?:SourceId;divider:number;clear:boolean}
export interface Job {id:string;title:string;ask:string;
  /** Nominal cook per tray (s) and the allowed timing error (±fraction). */
  cookS:number;tol:number;
  /** Board temperature during trays 1–3 (°C), and the range the spec must hold over. */
  temps:[number,number,number];range:[number,number];mixer:boolean;
  /** The setup the job opens with (undefined keeps the previous job's). */
  start?:Setup;
  /** Opens with the night shift's run replayed (the drifting-clock job). */
  replay?:boolean}
export const JOBS:Job[]=[
  {id:'eggs',title:'Egg timer: soft-boiled, 3 min',ask:'The egg timer\'s controller has no clock selected, so it never ticks. Eggs forgive ±2 %.',
    cookS:180,tol:.02,temps:[26,27,28],range:[20,35],mixer:false,start:{divider:8000,clear:false}},
  {id:'oven',title:'Conveyor oven: 10 min bake, ±0.2 %',ask:'The big oven bakes for 10 minutes and warms its own board to 70 °C. Bread needs the cook time within ±0.2 %.',
    cookS:600,tol:.002,temps:[45,60,70],range:[25,70],mixer:false},
  {id:'pastry',title:'Pastry line: tray 3 keeps burning',ask:'The night shift saved a part: internal RC. Trays 1 and 2 came out fine, tray 3 burnt. Pastry forgives ±1 %.',
    cookS:300,tol:.01,temps:[35,55,70],range:[25,70],mixer:true,start:{source:'rc',divider:8000,clear:false},replay:true},
];

/** Source frequency error (fraction) at a board temperature, for this unit or a worst-case corner. */
export function freqError(s:Source,temp:number,corner?:-1|1){
  const dt=temp-ROOM_T;return corner===undefined?s.offset+s.drift*dt:corner*(s.tol+Math.abs(s.drift*dt));
}
/** Ideal tick rate from the divider (no source error) and its quantisation error vs 1 kHz. */
export const tickHz=(s:Source,divider:number)=>s.hz/divider;
export const dividerError=(s:Source,divider:number)=>tickHz(s,divider)/TICK_HZ-1;
/** The divider that gets closest to 1 kHz for a source (the right setting when one divides exactly). */
export const bestDivider=(s:Source)=>DIVIDERS.reduce((b,d)=>Math.abs(dividerError(s,d))<Math.abs(dividerError(s,b))?d:b,DIVIDERS[0]);
export const glitching=(job:Job,setup:Setup)=>!!setup.source&&SOURCES[setup.source].external&&job.mixer&&!setup.clear;

/** Cook-time error (fraction; + means the cook runs long) given a source frequency error. */
export function cookError(job:Job,setup:Setup,fe:number){
  if(!setup.source)return Infinity;
  const s=SOURCES[setup.source],rate=tickHz(s,setup.divider)*(1+fe)*(glitching(job,setup)?1+GLITCH:1);
  return TICK_HZ/rate-1;
}
export type Doneness='golden'|'burnt'|'raw';
export interface TrayResult {temp:number;error:number;seconds:number;ticks:number;doneness:Doneness}
/** One belt run: three trays, each cooked at its board temperature on this actual unit. */
export function run(job:Job,setup:Setup):TrayResult[]{
  return job.temps.map(temp=>{
    const e=setup.source?cookError(job,setup,freqError(SOURCES[setup.source],temp)):Infinity;
    const doneness:Doneness=!isFinite(e)?'raw':Math.abs(e)<=job.tol?'golden':e>0?'burnt':'raw';
    return {temp,error:e,seconds:isFinite(e)?job.cookS*(1+e):0,ticks:job.cookS*TICK_HZ,doneness};
  });
}
/** Worst cook error over the job's temperature range and the source's tolerance (fraction, magnitude). */
export function worstError(job:Job,setup:Setup){
  if(!setup.source)return Infinity;const s=SOURCES[setup.source];let w=0;
  for(const t of job.range)for(const c of [-1,1] as const)w=Math.max(w,Math.abs(cookError(job,setup,freqError(s,t,c))));
  return w;
}
export const cost=(setup:Setup)=>setup.source?SOURCES[setup.source].cost:0;

export interface Verdict {tier:0|1|2|3;trays:TrayResult[];worst:number;cost:number;problems:string[];notes:string[]}
const pct=(x:number,d=2)=>`${x>=0?'+':'−'}${Math.abs(x*100).toFixed(d)} %`;
export const pctText=pct;
export function judge(job:Job,setup:Setup):Verdict{
  const trays=run(job,setup),worst=worstError(job,setup),c=cost(setup),problems:string[]=[],notes:string[]=[];
  if(!setup.source){problems.push('No clock is selected, so the timer never ticks and nothing cooks. Pick the internal RC or fit a module.');
    return {tier:0,trays,worst,cost:c,problems,notes};}
  const s=SOURCES[setup.source],q=dividerError(s,setup.divider);
  if(Math.abs(q)>job.tol){
    problems.push(s.id==='watch'?`${s.hz/1000} kHz ÷ ${setup.divider} = ${(tickHz(s,setup.divider)/1000).toFixed(3)} kHz: no whole-number divider gives exactly 1 kHz, so every tick is ${pct(q,1)} off.`:
      `${s.hz/1e6} MHz ÷ ${setup.divider} = ${+(tickHz(s,setup.divider)/1000).toFixed(3)} kHz, not 1 kHz: the firmware counts ${pct(q,0)} too ${q>0?'fast, so trays come out raw':'slow, so trays burn'}. Set the divider to ÷${bestDivider(s)}.`);}
  if(glitching(job,setup))problems.push('The clock line runs past the mixer motor: its noise adds extra edges, the timer counts too fast and trays come out raw. Route it clear.');
  const bad=trays.map((t,i)=>({t,i})).filter(x=>x.t.doneness!=='golden');
  if(bad.length&&!problems.length){const b=bad[0];problems.push(`Tray ${b.i+1} came out ${b.t.doneness} (${pct(b.t.error)} at ${b.t.temp} °C): the ${s.label.toLowerCase()} drifts ${s.drift<0?'slow':'fast'} as the oven warms its board.`);}
  if(bad.length)return {tier:0,trays,worst,cost:c,problems,notes};
  if(worst>job.tol){notes.push(`Worst case over ${job.range[0]}–${job.range[1]} °C is ${pct(worst,2).slice(1)}, outside ±${+(job.tol*100).toFixed(2)} %: this unit got lucky.`);
    return {tier:1,trays,worst,cost:c,problems,notes};}
  const best=cheapest(job);
  if(best&&c>best.cost){notes.push(`It holds the spec, but a cheaper source would too (${SOURCES[best.setup.source!].label}).`);return {tier:2,trays,worst,cost:c,problems,notes};}
  notes.push(s.external?'The cheapest source that holds the spec.':'The built-in RC is enough here: no part needed.');
  return {tier:3,trays,worst,cost:c,problems,notes};
}
/** Brute-force solver: every source × divider × route; the cheapest setup that is reliable. */
export function solutions(job:Job){
  const out:{setup:Setup;cost:number;tier:number}[]=[];
  for(const source of SOURCE_IDS)for(const divider of DIVIDERS)for(const clear of [false,true]){const setup={source,divider,clear},trays=run(job,setup);
    if(trays.every(t=>t.doneness==='golden'))out.push({setup,cost:cost(setup),tier:worstError(job,setup)<=job.tol?2:1});}
  return out;
}
export function cheapest(job:Job){
  return solutions(job).filter(s=>s.tier>=2).sort((a,b)=>a.cost-b.cost||Number(a.setup.clear)-Number(b.setup.clear))[0];
}
