// Overheating Arcade rules: current-limiting resistors for LEDs and a transistor's base, built from
// chunky resistor blocks ("candy resistors") in a chain socket at the back of each cabinet.
// Guardrails (what the station teaches, kept truthful at this level):
// - A series resistor limits current: I = (V_supply − V_f) ÷ R. It turns the extra voltage into heat
//   (P = I²R), so its power rating matters.
// - Blocks end to end ADD (series: R = R1 + R2). Two blocks side by side in one position SHARE the
//   current (parallel: R = R1·R2 ÷ (R1 + R2), smaller than either), and share the heat.
// - An LED only conducts one way (anode + to cathode −). Reversed, it stays dark.
// - A resistor ACROSS the LED does not limit the LED's current: with nothing in series the LED still
//   sits straight across the supply. It only adds a second, wasteful path.
// - A transistor's base–emitter junction behaves like a diode (~0.7 V), so a logic pin driving it
//   needs a base resistor too; the base current must be big enough to switch the motor fully on.
// - The fuse is a PTC: it trips on a fault, heats, and conducts again by itself once it cools.
// - Over-current shortens an LED's life (it runs hot); only a gross overload kills one outright.
// - Simplified LED model: a fixed forward voltage, light roughly proportional to current. Real LEDs
//   have a curved I–V characteristic; the panel says so. Ratings, margins and battery capacity are
//   this arcade's house values, labelled as such.

/** The block values in the bins (Ω). Every block is a ¼ W part and costs one credit. */
export const BLOCKS=[47,100,220,470] as const;
export type Block=typeof BLOCKS[number];
export const BLOCK_RATING=.25,BLOCK_COST=1;
/** The chain socket: up to three positions in series; each holds one block, or two side by side. */
export const POSITIONS=3,PER_POSITION=2;
export const HOUSE={
  /** Wiring and supply resistance (Ω): tiny, but it is all that limits a short. */
  wire:1,
  /** The channel's PTC fuse trips above this current (A) and conducts again after it cools (s). */
  fuseTrip:.1,fuseCool:2.5,
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
  /** An LED driven past this multiple of its rated current fails outright (it pops). */
  ledPop:2.5,
  /** A kid plays the cabinet this long (s) with everything in spec before it can be signed off. */
  soak:3,
  /** A 9 V alkaline battery, roughly (mAh). */
  battery:500,
};
export type LedColor='red'|'green'|'blue'|'white';
export interface Led {kind:'led';color:LedColor;vf:number;imax:number}
/** A logic pin driving an NPN transistor's base (the motor switch). */
export interface Base {kind:'base';vf:number;imax:number;imin:number;beta:number;motor:number}
export type Load=Led|Base;
/** The chain: each position lists the blocks standing in it (empty positions are bridged by wire). */
export type Chain=Block[][];
export interface Setup {chain:Chain;across?:Block;reversed:boolean}
export interface Job {id:string;title:string;cabinet:string;supply:number;battery?:boolean;load:Load;
  /** Current window (A) that gives the brightness (or motor drive) the cabinet asks for. */
  band:[number,number];start:Setup;story:string;ask:string}
export const LED_VF:Record<LedColor,number>={red:2,green:2.1,blue:3,white:3};
const led=(color:LedColor):Led=>({kind:'led',color,vf:LED_VF[color],imax:.02});
const empty=():Chain=>[[],[],[]];
export const JOBS:Job[]=[
  {id:'bumper',title:'Pinball bumper',cabinet:'PINBALL',supply:5,load:led('red'),band:[.012,.02],
    start:{chain:empty(),across:100,reversed:false},
    story:'The last tech clipped a block across the LED. The fuse keeps clicking.',
    ask:'Red LED on 5 V: 12–20 mA'},
  {id:'rhythm',title:'Rhythm pad',cabinet:'RHYTHM',supply:3.3,load:led('blue'),band:[.01,.02],
    start:{chain:[[47],[],[]],reversed:true},
    story:'This pad stays dark. Only 0.3 V is left over for the resistor on 3.3 V.',
    ask:'Blue LED on 3.3 V: 10–20 mA'},
  {id:'claw',title:'Claw machine',cabinet:'CLAW',supply:12,load:led('green'),band:[.01,.02],
    start:{chain:[[220],[],[]],reversed:false},
    story:'The claw light glows white-hot and its block smells warm.',
    ask:'Green LED on 12 V: 10–20 mA'},
  {id:'handheld',title:'Handheld',cabinet:'HANDHELD',supply:9,battery:true,load:led('red'),band:[.005,.015],
    start:{chain:[[220],[],[]],reversed:false},
    story:'A 9 V battery handheld. Its power light is blinding, and the battery is flat by lunch.',
    ask:'Red LED on a 9 V battery: 5–15 mA, long battery life'},
  {id:'hopper',title:'Coin hopper',cabinet:'PRIZES',supply:5,load:{kind:'base',vf:.7,imax:.02,imin:.002,beta:100,motor:.2},band:[.004,.01],
    start:{chain:empty(),reversed:false},
    story:'A 5 V logic pin (rated 20 mA) switches the hopper motor through a transistor. The motor needs 2 mA of base current.',
    ask:'Transistor base on a 5 V pin: 4–10 mA'},
];

/** Resistance of one position: a single block, or two side by side (parallel). */
export const positionR=(p:readonly number[])=>p.length===0?0:p.length===1?p[0]:p[0]*p[1]/(p[0]+p[1]);
/** The chain's total: positions add (series). 0 means no resistor at all (a bare wire link). */
export const chainR=(c:Chain)=>c.reduce((n,p)=>n+positionR(p),0);
export const blockCount=(c:Chain)=>c.reduce((n,p)=>n+p.length,0);
export interface BlockHeat {pos:number;slot:number;r:number;p:number;heat:number}
/** Power in every block for a chain current i: a position carries all of it, and a side-by-side pair
 *  splits it inversely to resistance (more current through the smaller block). */
export function blockHeat(c:Chain,i:number):BlockHeat[]{
  const out:BlockHeat[]=[];
  c.forEach((p,pos)=>{if(p.length===1){const pw=i*i*p[0];out.push({pos,slot:0,r:p[0],p:pw,heat:pw/BLOCK_RATING});}
    else if(p.length===2){const [a,b]=p,ia=i*b/(a+b),ib=i*a/(a+b);out.push({pos,slot:0,r:a,p:ia*ia*a,heat:ia*ia*a/BLOCK_RATING},{pos,slot:1,r:b,p:ib*ib*b,heat:ib*ib*b/BLOCK_RATING});}});
  return out;
}

export interface Reading {
  /** Current from the supply (A), and through the LED or base (A). */
  i:number;iLoad:number;
  /** Chain resistance (Ω), voltage across it and the power it turns into heat (V, W); power in the block across the load (W). */
  rChain:number;vR:number;pR:number;pP:number;
  /** Voltage across the LED or base–emitter junction (V). */
  vLoad:number;
  /** Light (or motor drive) relative to the LED's or pin's rating (1 = rated current). */
  level:number;tripped:boolean;lit:boolean;
  /** The hottest chain block, and the block across the load, as fractions of their rating. */
  rHeat:number;pHeat:number;blocks:BlockHeat[];
  ledC:number;
  /** Hours on a battery (battery cabinets only). */
  lifeH?:number;
  /** Total power drawn from the supply (W). */
  pIn:number;
}
/** Solves the channel: supply → fuse → chain → LED (or base–emitter), with an optional block across the load. */
export function read(job:Job,s:Setup):Reading{
  const V=job.supply,vf=job.load.vf,rc=chainR(s.chain),rs=rc+HOUSE.wire,rp=s.across;
  const conducts=!(job.load.kind==='led'&&s.reversed);
  let i=0,iLoad=0,vLoad=0;
  if(rp!==undefined){
    const divider=V*rp/(rs+rp);
    if(conducts&&divider>vf){i=(V-vf)/rs;iLoad=i-vf/rp;vLoad=vf;}
    else{i=V/(rs+rp);vLoad=divider;}
  }else if(conducts&&V>vf){i=(V-vf)/rs;iLoad=i;vLoad=vf;}
  else vLoad=V;
  const pR=i*i*rc,pP=rp?vLoad*vLoad/rp:0,blocks=blockHeat(s.chain,i);
  const lit=job.load.kind==='led'?iLoad>=HOUSE.lit:iLoad>=job.load.imin;
  return {i,iLoad,rChain:rc,vR:i*rc,pR,pP,vLoad,level:iLoad/job.load.imax,tripped:i>HOUSE.fuseTrip,lit,
    rHeat:Math.max(0,...blocks.map(b=>b.heat)),pHeat:rp?pP/BLOCK_RATING:0,blocks,
    ledC:HOUSE.ambient+HOUSE.ledTheta*iLoad*vLoad,lifeH:job.battery&&i>0?HOUSE.battery/(i*1000):undefined,pIn:V*i};
}

export const mA=(a:number)=>{const v=a*1000;return v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2);};
export const mAr=(a:number)=>`${+(a*1000).toFixed(1)}`;
export const ohms=(r:number)=>r>=1000?`${+(r/1000).toFixed(2)} kΩ`:`${+r.toFixed(r<100?1:0)} Ω`;
export const watts=(p:number)=>p>=1?`${p.toFixed(2)} W`:`${(p*1000).toFixed(p<.01?1:0)} mW`;
/** The elegant zone: the lowest third of the band. Least wasted power while still bright enough. */
export const starZone=(job:Job):[number,number]=>[job.band[0],job.band[0]+(job.band[1]-job.band[0])/3];

export interface Verdict {tier:0|1|2|3;problems:string[];notes:string[];cost:number}
export const partsCost=(s:Setup)=>(blockCount(s.chain)+(s.across?1:0))*BLOCK_COST;
/** Works (1), works reliably (2), elegant (3), or fails (0). Failures say why in plain words; they
 *  never prescribe the fix. */
export function judge(job:Job,s:Setup):Verdict{
  const r=read(job,s),problems:string[]=[],notes:string[]=[],isLed=job.load.kind==='led',cost=partsCost(s);
  const what=isLed?'the LED':'the base',none=blockCount(s.chain)===0;
  if(r.tripped){
    if(none&&s.across)problems.push(`The block across ${what} limits nothing: ${what} still sits straight across ${job.supply} V, so the fuse tripped.`);
    else if(none)problems.push(`Nothing in the chain limits the current: ${isLed?'an LED':'a base–emitter junction'} straight across ${job.supply} V draws amps, so the fuse tripped.`);
    else problems.push(`${ohms(r.rChain)} lets ${mA(r.i)} mA through: the fuse tripped.`);
  }else if(isLed&&s.reversed&&!r.lit)problems.push('Dark: the LED is in backwards. Current only flows from the anode (+, long leg) to the cathode.');
  else if(!r.lit){
    if(s.across&&r.i>HOUSE.lit)problems.push(`The block across ${what} steals the current (${mA(r.i-r.iLoad)} mA) and wastes it.`);
    else if(isLed)problems.push(`Too dim to see: ${mA(r.iLoad)} mA through ${ohms(r.rChain)}.`);
    else problems.push(`Only ${mA(r.iLoad)} mA into the base: the transistor is half on, so the motor crawls and the transistor heats. It needs ${mAr((job.load as Base).imin)} mA.`);
  }else if(r.iLoad>job.load.imax)problems.push(isLed?`${mA(r.iLoad)} mA is over the LED's ${mAr(job.load.imax)} mA rating: it runs hot and dies early. (I = (V − Vf) ÷ R)`
    :`${mA(r.iLoad)} mA is over the logic pin's ${mAr(job.load.imax)} mA rating. (I = (5 V − 0.7 V) ÷ R)`);
  if(!problems.length){
    const hot=r.blocks.find(b=>b.p>BLOCK_RATING);
    if(hot)problems.push(`A ${ohms(hot.r)} block turns ${watts(hot.p)} into heat (P = I²R), but it is a ¼ W part: it scorches.`);
    else if(s.across&&r.pP>BLOCK_RATING)problems.push(`The block across ${what} turns ${watts(r.pP)} into heat: it scorches.`);
  }
  if(problems.length)return {tier:0,problems,notes,cost};
  const inBand=r.iLoad>=job.band[0]-1e-9&&r.iLoad<=job.band[1]+1e-9;
  if(!inBand)notes.push(r.iLoad<job.band[0]?`${mA(r.iLoad)} mA is under the ${mAr(job.band[0])}–${mAr(job.band[1])} mA band: too dim.`:`${mA(r.iLoad)} mA is over the ${mAr(job.band[0])}–${mAr(job.band[1])} mA band.`);
  if(r.rHeat>HOUSE.margin)notes.push(`The hottest block runs at ${Math.round(r.rHeat*100)} % of its ¼ W rating; the house rule is ${HOUSE.margin*100} %.`);
  if(notes.length)return {tier:1,problems,notes,cost};
  if(s.across)notes.push('The block across the LED only wastes current.');
  else if(r.iLoad>starZone(job)[1]+1e-9)notes.push(`In the band, but above the ★ zone: a little more resistance wastes less power${job.battery?' and the battery lasts longer':''}.`);
  return {tier:notes.length?2:3,problems,notes,cost};
}

/** Every chain the bins can build: up to three positions, each empty, one block, or a side-by-side pair. */
const POSITION_OPTIONS:Block[][]=[[],...BLOCKS.map(b=>[b]),...BLOCKS.flatMap((a,i)=>BLOCKS.slice(i).map(b=>[a,b]))];
export function allChains():Chain[]{
  const out:Chain[]=[];for(const a of POSITION_OPTIONS)for(const b of POSITION_OPTIONS)for(const c of POSITION_OPTIONS)out.push([a,b,c]);return out;
}
let cache:Chain[]|undefined;
/** True when the chain's blocks start at position 1 with no gaps (how a person fills the socket). */
const packed=(c:Chain)=>c.every((p,k)=>p.length===0||c.slice(0,k).every(q=>q.length>0));
/** The elegant answer with the fewest blocks (ties: the least current), packed from position 1, or
 *  undefined if none exists. */
export function best(job:Job):Chain|undefined{
  cache??=allChains();let pick:{c:Chain;n:number;i:number}|undefined;
  for(const c of cache){if(!packed(c))continue;const s={chain:c,reversed:false};if(judge(job,s).tier!==3)continue;const n=blockCount(c),i=read(job,s).iLoad;
    if(!pick||n<pick.n||(n===pick.n&&i<pick.i))pick={c,n,i};}
  return pick?.c;
}
/** Every chain that works reliably or better (no block across the load). */
export function reliable(job:Job){cache??=allChains();return cache.filter(c=>judge(job,{chain:c,reversed:false}).tier>=2);}
/** Thermal ramp toward a steady fraction of the limit (first order, time constant HOUSE.tau). */
export const heatAt=(steady:number,t:number)=>steady*(1-Math.exp(-t/HOUSE.tau));
/** When a part heading for `steady` (× its limit) crosses the limit; Infinity if it never does. */
export const failTime=(steady:number)=>steady>1?-HOUSE.tau*Math.log(1-1/steady):Infinity;
export const TIER_WORD=['Fails','Works','Works reliably','Elegant'];

// ---------- rush (level arcade-rush) ----------
const RUSH_CABINETS=['PINBALL','RHYTHM','CLAW','RACER','SKEE','DANCE','LIGHTGUN','PUSHER','AIR HOCKEY','TOKEN'];
const RUSH_FAULTS=['across','backwards','hot','dim','empty'] as const;
/** An endless supply of LED cabinets for rush: random supply, colour, brightness window and fault,
 *  only ever one the bins can fix elegantly. */
export function rushJob(rng:()=>number,n:number):Job{
  const pick=<V>(a:readonly V[])=>a[Math.floor(rng()*a.length)];
  for(;;){
    const color=pick(['red','green','blue','white'] as const),supply=pick(LED_VF[color]>2.5?[5,9,12]:[3.3,5,9,12]),
      band:[number,number]=pick([[.01,.02],[.008,.016],[.012,.02]]),cabinet=pick(RUSH_CABINETS),fault=pick(RUSH_FAULTS);
    const job:Job={id:`rush-${n}`,title:cabinet[0]+cabinet.slice(1).toLowerCase(),cabinet,supply,load:led(color),band,start:{chain:empty(),reversed:false},story:'',
      ask:`${color[0].toUpperCase()+color.slice(1)} LED on ${supply} V: ${Math.round(band[0]*1000)}–${Math.round(band[1]*1000)} mA`};
    const fix=best(job);if(!fix)continue;
    switch(fault){
      case 'across':job.start={chain:empty(),across:pick(BLOCKS),reversed:false};job.story='Someone fitted a block across the LED. The fuse keeps clicking.';break;
      case 'backwards':job.start={chain:fix.map(p=>[...p]),reversed:true};job.story='Right blocks, but the LED went in backwards. It stays dark.';break;
      case 'hot':job.start={chain:[[47],[],[]],reversed:false};job.story='Too bright, and the block smells warm.';break;
      case 'dim':job.start={chain:[[470],[470],[470]],reversed:false};job.story='Barely glowing. The player says it looks broken.';break;
      case 'empty':job.story='The chain socket is empty.';break;
    }
    if(judge(job,job.start).tier>=2)continue;
    return job;
  }
}
