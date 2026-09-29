// Overheating Arcade rules: current-limiting resistors for LEDs and a transistor's base.
// Guardrails (what the station teaches, kept truthful at this level):
// - A series resistor limits current: I = (V_supply − V_f) ÷ R. It turns the extra voltage into heat
//   (P = I²R), so its power rating matters.
// - An LED only conducts one way (anode + to cathode −). Reversed, it stays dark.
// - A resistor ACROSS the LED does not limit the LED's current: with nothing in series the LED still
//   sits straight across the supply. It only adds a second, wasteful path.
// - A transistor's base–emitter junction behaves like a diode (~0.7 V), so a logic pin driving it
//   needs a base resistor too; the base current must be big enough to switch the motor fully on.
// - Simplified LED model: a fixed forward voltage, light roughly proportional to current. Real LEDs
//   have a curved I–V characteristic; the panel says so. Ratings, margins and battery capacity are
//   this arcade's house values, labelled as such.
export type Rating=.125|.25|1;
export const RATINGS:Rating[]=[.125,.25,1];
export const RATING_LABEL:Record<string,string>={'0.125':'⅛ W','0.25':'¼ W','1':'1 W'};
/** Parts cost in arcade credits for one resistor block of each size. */
export const RATING_COST:Record<string,number>={'0.125':1,'0.25':2,'1':5};
/** The blocks on the rack: E12 standard values (Ω). */
export const RACK=[10,22,47,68,100,150,220,330,470,680,820,1000,1200,2200];
export const HOUSE={
  /** Wiring and supply resistance (Ω): tiny, but it is all that limits a short. */
  wire:1,
  /** The channel's resettable fuse (PTC) trips above this current (A). */
  fuseTrip:.1,
  /** Below this LED current (A) the LED is too dim to count as lit. */
  lit:.002,
  /** House rule: a resistor should run at no more than 60 % of its power rating. */
  margin:.6,
  ambient:25,
  /** Temperature rise of a resistor at its full rated power (°C). */
  ratedRise:125,
  /** LED thermal resistance, junction to air (°C/W): a small 5 mm LED. */
  ledTheta:500,
  /** Thermal time constant of the parts on the bench (s). */
  tau:2,
  /** A channel must run in spec this long before it can be signed off (s). */
  soak:10,
  /** A 9 V alkaline battery, roughly (mAh). */
  battery:500,
};
export type LedColor='red'|'green'|'blue'|'white';
export interface Led {kind:'led';color:LedColor;vf:number;imax:number}
/** A logic pin driving an NPN transistor's base (the motor switch). */
export interface Base {kind:'base';vf:number;imax:number;imin:number;beta:number;motor:number}
export type Load=Led|Base;
export interface Part {r:number;rating:Rating}
export interface Setup {series?:Part;parallel?:Part;reversed:boolean}
export interface Job {id:string;title:string;cabinet:string;supply:number;battery?:boolean;load:Load;
  /** Current window (A) that gives the brightness (or motor drive) the cabinet asks for. */
  band:[number,number];start:Setup;story:string;ask:string}
export const LED_VF:Record<LedColor,number>={red:2,green:2.1,blue:3,white:3};
const led=(color:LedColor):Led=>({kind:'led',color,vf:LED_VF[color],imax:.02});
export const JOBS:Job[]=[
  {id:'bumper',title:'Pinball bumper',cabinet:'PINBALL',supply:5,load:led('red'),band:[.012,.02],
    start:{parallel:{r:150,rating:.125},reversed:false},
    story:'The last tech clipped a resistor across the LED. The fuse keeps clicking.',
    ask:'Red LED on 5 V: 12–20 mA'},
  {id:'rhythm',title:'Rhythm pad',cabinet:'RHYTHM',supply:3.3,load:led('blue'),band:[.01,.02],
    start:{series:{r:220,rating:.125},reversed:true},
    story:'This pad stays dark. Only 0.3 V is left over for the resistor on 3.3 V.',
    ask:'Blue LED on 3.3 V: 10–20 mA'},
  {id:'claw',title:'Claw machine',cabinet:'CLAW',supply:12,load:led('green'),band:[.01,.02],
    start:{series:{r:470,rating:.125},reversed:false},
    story:'The claw light glows too bright and its resistor smells warm.',
    ask:'Green LED on 12 V: 10–20 mA'},
  {id:'handheld',title:'Handheld',cabinet:'HANDHELD',supply:9,battery:true,load:led('red'),band:[.005,.015],
    start:{series:{r:470,rating:.125},reversed:false},
    story:'A 9 V battery handheld. Its power light alone flattens the battery in a day and a half.',
    ask:'Red LED on a 9 V battery: 5–15 mA, long battery life'},
  {id:'hopper',title:'Coin hopper',cabinet:'PRIZES',supply:5,load:{kind:'base',vf:.7,imax:.02,imin:.002,beta:100,motor:.2},band:[.004,.01],
    start:{reversed:false},
    story:'A 5 V logic pin (rated 20 mA) switches the hopper motor through a transistor. The motor needs 2 mA of base current.',
    ask:'Transistor base on a 5 V pin: 4–10 mA'},
];

export interface Reading {
  /** Current from the supply (A), and through the LED or base (A). */
  i:number;iLoad:number;
  /** Voltage across and power in the series resistor, power in the parallel one (V, W). */
  vR:number;pR:number;pP:number;
  /** Voltage across the LED or base–emitter junction (V). */
  vLoad:number;
  /** Light (or motor drive) relative to the LED's or pin's rating (1 = rated current). */
  level:number;tripped:boolean;lit:boolean;
  /** Fraction of each resistor's power rating in use (0 when empty). */
  rHeat:number;pHeat:number;
  ledC:number;
  /** Hours on a battery (battery cabinets only). */
  lifeH?:number;
  /** Total power drawn from the supply (W). */
  pIn:number;
}
/** Solves the channel: supply → fuse → series R → LED (or base–emitter), with an optional R across the load. */
export function read(job:Job,s:Setup):Reading{
  const V=job.supply,vf=job.load.vf,rs=(s.series?.r??0)+HOUSE.wire,rp=s.parallel?.r;
  const conducts=!(job.load.kind==='led'&&s.reversed);
  let i=0,iLoad=0,vLoad=0;
  if(rp!==undefined){
    const divider=V*rp/(rs+rp);
    if(conducts&&divider>vf){i=(V-vf)/rs;iLoad=i-vf/rp;vLoad=vf;}
    else{i=V/(rs+rp);vLoad=divider;}
  }else if(conducts&&V>vf){i=(V-vf)/rs;iLoad=i;vLoad=vf;}
  else vLoad=V;
  const rSeries=s.series?.r??0,pR=i*i*rSeries,pP=rp?vLoad*vLoad/rp:0;
  const lit=job.load.kind==='led'?iLoad>=HOUSE.lit:iLoad>=job.load.imin;
  return {i,iLoad,vR:i*rSeries,pR,pP,vLoad,level:iLoad/job.load.imax,tripped:i>HOUSE.fuseTrip,lit,
    rHeat:s.series?pR/s.series.rating:0,pHeat:s.parallel?pP/s.parallel.rating:0,
    ledC:HOUSE.ambient+HOUSE.ledTheta*iLoad*vLoad,lifeH:job.battery&&i>0?HOUSE.battery/(i*1000):undefined,pIn:V*i};
}

export const mA=(a:number)=>{const v=a*1000;return v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2);};
export const mAr=(a:number)=>`${+(a*1000).toFixed(1)}`;
export const ohms=(r:number)=>r>=1000?`${+(r/1000).toFixed(2)} kΩ`:`${r} Ω`;
export const watts=(p:number)=>p>=1?`${p.toFixed(2)} W`:`${(p*1000).toFixed(p<.01?1:0)} mW`;

export interface Verdict {tier:0|1|2|3;problems:string[];notes:string[];cost:number}
export const partsCost=(s:Setup)=>(s.series?RATING_COST[String(s.series.rating)]:0)+(s.parallel?RATING_COST[String(s.parallel.rating)]:0);
/** Works (1), works reliably (2), elegant (3), or fails (0) with the reason in plain words. */
export function judge(job:Job,s:Setup):Verdict{
  const r=read(job,s),problems:string[]=[],notes:string[]=[],isLed=job.load.kind==='led',cost=partsCost(s);
  const what=isLed?'the LED':'the base';
  if(r.tripped){
    if(!s.series&&s.parallel)problems.push(`The resistor across ${isLed?'the LED':'the junction'} limits nothing: ${what} still sits straight across the supply. The fuse tripped. Put the limiter in SERIES.`);
    else if(!s.series)problems.push(`Nothing limits the current: ${isLed?'an LED':'a base–emitter junction'} straight across ${job.supply} V draws amps. The fuse tripped. Put a resistor in SERIES.`);
    else problems.push(`${ohms(s.series.r)} still lets ${mA(r.i)} mA through: the fuse tripped. Use a bigger resistor.`);
  }else if(isLed&&s.reversed&&!r.lit)problems.push('Dark: the LED is in backwards. Current only flows from the anode (+, long leg) to the cathode. FLIP it.');
  else if(!r.lit){
    if(s.parallel&&r.i>HOUSE.lit)problems.push(`The resistor across ${what} steals the current (${mA(r.i-r.iLoad)} mA) and wastes it. Take it out.`);
    else if(isLed)problems.push(`Too dim to see: ${mA(r.iLoad)} mA. A smaller series resistor lets more current through.`);
    else problems.push(`Only ${mA(r.iLoad)} mA into the base: the transistor is half on, so the motor crawls and the transistor heats. It needs ${mAr((job.load as Base).imin)} mA. Use a smaller base resistor.`);
  }else if(r.iLoad>job.load.imax)problems.push(isLed?`${mA(r.iLoad)} mA is over the LED's ${mAr(job.load.imax)} mA rating: it runs hot and dies early. Use a bigger series resistor: R = (V − Vf) / I.`
    :`${mA(r.iLoad)} mA is over the logic pin's ${mAr(job.load.imax)} mA rating. Use a bigger base resistor: R = (5 V − 0.7 V) / I.`);
  if(!problems.length){
    for(const [p,part,where] of [[r.pR,s.series,'series'],[r.pP,s.parallel,'parallel']] as const)
      if(part&&p>part.rating)problems.push(`The ${where} resistor turns ${watts(p)} into heat (P = I²R) but it is rated ${RATING_LABEL[String(part.rating)]}: it scorches. Use a bigger power rating or a larger value.`);
  }
  if(problems.length)return {tier:0,problems,notes,cost};
  const inBand=r.iLoad>=job.band[0]-1e-9&&r.iLoad<=job.band[1]+1e-9;
  const margins=[[r.rHeat,s.series,'series'],[r.pHeat,s.parallel,'parallel']] as const;
  if(!inBand)notes.push(r.iLoad<job.band[0]?`${mA(r.iLoad)} mA is under the ${mAr(job.band[0])}–${mAr(job.band[1])} mA band: too dim.`:`${mA(r.iLoad)} mA is over the ${mAr(job.band[0])}–${mAr(job.band[1])} mA band.`);
  for(const [h,part,where] of margins)if(part&&h>HOUSE.margin)notes.push(`The ${where} resistor runs at ${Math.round(h*100)} % of its rating: keep it under ${HOUSE.margin*100} %.`);
  if(notes.length)return {tier:1,problems,notes,cost};
  const b=best(job);
  if(s.parallel)notes.push('The resistor across the LED only wastes current: leave it out.');
  else if(s.series&&b&&s.series.r<b.r)notes.push(`${ohms(b.r)} is still in the band and wastes less power${job.battery?' (longer battery life)':''}.`);
  else if(s.series&&b&&s.series.rating>b.rating)notes.push(`A ${RATING_LABEL[String(b.rating)]} block has enough margin and costs less.`);
  return {tier:notes.length?2:3,problems,notes,cost};
}
/** Every rack option in the forward direction that works reliably, with no resistor across the load. */
export function reliable(job:Job){
  const out:{r:number;rating:Rating;i:number;cost:number}[]=[];
  for(const r of RACK)for(const rating of RATINGS){const s:Setup={series:{r,rating},reversed:false},v=tierNoBest(job,s);if(v>=2)out.push({r,rating,i:read(job,s).i,cost:RATING_COST[String(rating)]});}
  return out;
}
function tierNoBest(job:Job,s:Setup){const r=read(job,s);if(r.tripped||!r.lit||r.iLoad>job.load.imax)return 0;if(s.series&&r.pR>s.series.rating)return 0;
  const inBand=r.iLoad>=job.band[0]-1e-9&&r.iLoad<=job.band[1]+1e-9;return inBand&&(!s.series||r.rHeat<=HOUSE.margin)?2:1;}
/** The elegant answer: the standard value in the band that draws the least current (least wasted
 *  power, longest battery life), on the cheapest block with enough margin. */
export function best(job:Job):Part|undefined{
  const opts=reliable(job);if(!opts.length)return undefined;
  opts.sort((a,b)=>a.i-b.i||a.cost-b.cost);return {r:opts[0].r,rating:opts[0].rating};
}
/** Thermal ramp toward a steady fraction of the limit (first order, time constant HOUSE.tau). */
export const heatAt=(steady:number,t:number)=>steady*(1-Math.exp(-t/HOUSE.tau));
/** When a part heading for `steady` (× its limit) crosses the limit; Infinity if it never does. */
export const failTime=(steady:number)=>steady>1?-HOUSE.tau*Math.log(1-1/steady):Infinity;
export const TIER_WORD=['Fails','Works','Works reliably','Elegant'];
