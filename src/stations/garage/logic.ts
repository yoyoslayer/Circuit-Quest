// Robot Garage rules. A delivery robot's drive motor (a coil with winding resistance and, while
// it spins, a back-EMF) is switched on its low side by a MOSFET. The controller that runs the
// robot shares the battery. When the MOSFET opens, the coil's current cannot stop at once: it
// keeps flowing and drives the switch node up (v = −L·di/dt) until something conducts it. Pip
// fits protection parts into four places on the harness board and captures the result on a scope.
//
// Places:  ACROSS MOTOR (two sockets in series: diode, zener) · ACROSS SWITCH (TVS or RC snubber)
//          · AT CONTROLLER (bulk capacitor) · the controller's GROUND route (shared or star).
//
// Model (simplified, labelled in game):
//   * Shutdown is simulated numerically: the motor current i obeys L·di/dt = V − E − R·i − v, the
//     switch node v comes from current balance at the node (a small stray capacitance plus every
//     path that conducts), solved implicitly each 1 µs step. Diodes are ideal thresholds with a
//     small on-resistance; the MOSFET avalanches above its breakdown voltage.
//   * The start-up surge is the stall current falling to the running current as the motor spins up
//     (exponential). Through a shared ground wire it sags the controller's supply; a capacitor at
//     the controller filters that sag (first-order low-pass).
// Teaching guardrails (docs/EXPANSION_PLAN.md):
//   * A decoupling/bulk capacitor supplies brief transient current and smooths short supply dips.
//     It is not a battery or regulator, and it does NOT give the coil's current a path: it does
//     nothing for the shutdown spike at the switch.
//   * A flyback diode gives the current a path, clamping the spike to about a diode drop above
//     the supply; but the current then decays slowly (low clamp voltage). A higher clamp (zener,
//     TVS) empties the coil faster at the price of a taller (still safe) spike.
//   * An absolute maximum is a stress limit, not a design target: "reliable" keeps 20 % margin.
//   * Numbers are this game's tuning values for one robot, not a datasheet.

export type PartId='diode'|'zener'|'tvs'|'snubber'|'cap';
export type SlotId='fly1'|'fly2'|'switch'|'ctrl';
export interface Part {id:PartId;label:string;name:string;slots:SlotId[];polar:boolean;
  /** Forward drop and reverse breakdown (V) for diode-like parts. */
  vf?:number;vbr?:number;cost:number}
export const PARTS:Record<PartId,Part>={
  diode:{id:'diode',label:'DIODE',name:'Flyback diode',slots:['fly1','fly2'],polar:true,vf:.7,vbr:400,cost:.4},
  zener:{id:'zener',label:'ZENER 24 V',name:'24 V zener',slots:['fly1','fly2'],polar:true,vf:.7,vbr:24,cost:.6},
  tvs:{id:'tvs',label:'TVS 33 V',name:'33 V TVS clamp',slots:['switch'],polar:true,vf:.7,vbr:33,cost:1.2},
  snubber:{id:'snubber',label:'RC SNUBBER',name:'RC snubber (10 Ω + 1 µF)',slots:['switch'],polar:false,cost:.8},
  cap:{id:'cap',label:'1000 µF',name:'1000 µF bulk capacitor',slots:['ctrl'],polar:true,cost:.9},
};
export const PART_IDS=Object.keys(PARTS) as PartId[];
export const SLOT_IDS:SlotId[]=['fly1','fly2','switch','ctrl'];
export const SLOT_NAMES:Record<SlotId,string>={fly1:'ACROSS MOTOR',fly2:'ACROSS MOTOR',switch:'ACROSS SWITCH',ctrl:'AT CONTROLLER'};
/** A fitted part. Not flipped = the band (cathode) toward +12 V across the motor, toward the switch
 *  node across the switch; the capacitor's + toward the 5 V rail. */
export interface Fit {part:PartId;flipped:boolean}
export interface Setup {fly1?:Fit;fly2?:Fit;switch?:Fit;ctrl?:Fit;star:boolean}

/** The robot (game tuning values). Running current = (V − E)/R = 3 A; stall = V/R = 6 A. */
export const MOTOR={V:12,R:2,L:5e-3,emf:6,spinUp:4e-3};
export const RUNNING=(MOTOR.V-MOTOR.emf)/MOTOR.R,STALL=MOTOR.V/MOTOR.R;
export const SWITCH={absMax:60,avalanche:75,rOn:.05};
/** Snubber and the controller's decoupling (feed resistance × capacitance = filter time). */
export const SNUB={R:10,C:1e-6},CTRL={feed:1,C:1000e-6,rail:5};
/** Pass/fail limits. */
export const SPEC={
  /** Above this switch-node spike, the kick couples into the controller and it resets. */
  spikeReset:50,
  /** "Reliable" keeps the spike under 80 % of the switch's absolute maximum. */
  spikeReliable:.8*SWITCH.absMax,
  /** The controller browns out if its 5 V rail sags by more than this. */
  dipReset:.6,dipReliable:.35,
  /** Motor current counts as "off" once under 10 % of the running current. */
  offFraction:.1,
  cycles:5,
};
/** Ground return resistance shared by motor and controller (Ω). */
export const STAR_R=.01;

export interface Job {id:string;title:string;ask:string;
  /** Resistance of the ground wire the controller shares with the motor (Ω). */
  shared:number;
  /** The motor current must die within this time at a stop (s), when the job has a stop line. */
  stopSpec?:number;hint:string}
export const JOBS:Job[]=[
  {id:'kickback',title:'Resets on shutdown',ask:'The controller resets every time the motor stops. Catch the spike on the scope, then give the coil\'s current a safe path.',
    shared:.05,hint:'Give the current a path: a flyback diode across the motor, band toward +12 V'},
  {id:'stopline',title:'Stop at the line',ask:'At the delivery stop, the brake only bites once the motor current has died. It must die within 1.0 ms.',
    shared:.05,stopSpec:1e-3,hint:'Too slow: a higher clamp empties the coil faster (a zener in breakdown, or a TVS)'},
  {id:'cargo',title:'Heavy cargo start',ask:'The new cargo bed moved the controller to the back, on a long ground wire shared with the motor. Now it resets when the motor STARTS.',
    shared:.15,stopSpec:1e-3,hint:'Flip the GROUND lever: give the controller its own wire back to the battery'},
];

// ---------- the parts in each place ----------
export const fitted=(s:Setup)=>SLOT_IDS.map(k=>s[k]).filter((f):f is Fit=>!!f);
export const partCount=(s:Setup)=>fitted(s).length;
export const cost=(s:Setup)=>Math.round(fitted(s).reduce((n,f)=>n+PARTS[f.part].cost,0)*10)/10;
/** Thresholds of the across-motor chain: conducts node → +12 V above `fwd` volts, the other way
 *  above `rev` volts (undefined = nothing fitted, no path). */
export function flyChain(s:Setup):{fwd:number;rev:number}|undefined{
  const parts=[s.fly1,s.fly2].filter((f):f is Fit=>!!f);if(!parts.length)return undefined;
  let fwd=0,rev=0;for(const f of parts){const p=PARTS[f.part];fwd+=f.flipped?p.vbr!:p.vf!;rev+=f.flipped?p.vf!:p.vbr!;}
  return {fwd,rev};
}
/** With the motor ON the switch node sits near 0 V, so the across-motor chain sees −12 V: if it
 *  conducts that way, it is a dead short across the battery (the fuse trips). */
export const shorted=(s:Setup)=>{const c=flyChain(s);return !!c&&c.rev<MOTOR.V;};
export const capReversed=(s:Setup)=>!!s.ctrl&&s.ctrl.part==='cap'&&s.ctrl.flipped;

// ---------- the shutdown transient ----------
export interface Trace {
  /** Samples every `dt` seconds from −0.5 ms (switch still on) to +5 ms. */
  t0:number;dt:number;v:number[];i:number[];
  /** Highest switch-node voltage (V). */
  peak:number;
  /** Time after turn-off for the motor current to fall below 10 % for good (s), or null if it never does. */
  offTime:number|null;
  avalanche:boolean;
}
const DT=1e-6,T_PRE=.5e-3,T_POST=5e-3,CP=10e-9,R_DIODE=.05,R_AV=.5;
/** Current leaving the switch node through the diode-like chain for a voltage `u` across it. */
const diodeI=(u:number,fwd:number,rev:number,r:number)=>u>fwd?(u-fwd)/r:u< -rev?(u+rev)/r:0;
export function shutdown(s:Setup):Trace{
  const {V,R,L,emf}=MOTOR,fly=flyChain(s),sw=s.switch,tvs=sw?.part==='tvs'?{fwd:sw.flipped?PARTS.tvs.vf!:PARTS.tvs.vbr!,rev:sw.flipped?PARTS.tvs.vbr!:PARTS.tvs.vf!}:undefined;
  const snub=sw?.part==='snubber',rs=SNUB.R+DT/SNUB.C;
  let i=RUNNING,v=i*SWITCH.rOn,vc=v,peak=v,avalanche=false;
  const v0=v,out:{v:number[];i:number[]}={v:[],i:[]},every=10;
  const pre=Math.round(T_PRE/DT),post=Math.round(T_POST/DT);
  for(let k=0;k<pre;k+=every){out.v.push(v0);out.i.push(i);}
  let lastOn=0;
  for(let k=1;k<=post;k++){
    // Implicit motor current as a function of the node voltage.
    const iNew=(x:number)=>(i+DT/L*(V-emf-x))/(1+DT*R/L);
    const leave=(x:number)=>{let n=CP*(x-v)/DT;
      if(x>SWITCH.avalanche)n+=(x-SWITCH.avalanche)/R_AV; // MOSFET avalanche (stress!)
      if(x< -.7)n+=(x+.7)/R_DIODE;                          // MOSFET body diode
      if(fly)n+=diodeI(x-V,fly.fwd,fly.rev,R_DIODE);
      if(tvs)n+=diodeI(x,tvs.fwd,tvs.rev,.3);
      if(snub)n+=(x-vc)/rs;
      return n;};
    let lo=-120,hi=600;for(let n=0;n<48;n++){const m=(lo+hi)/2;if(leave(m)-iNew(m)>0)hi=m;else lo=m;}
    const x=(lo+hi)/2;i=iNew(x);if(snub)vc+=(x-vc)/rs*DT/SNUB.C;v=x;
    if(v>SWITCH.avalanche+.01)avalanche=true;peak=Math.max(peak,v);
    if(Math.abs(i)>=SPEC.offFraction*RUNNING)lastOn=k;
    if(k%every===0){out.v.push(v);out.i.push(i);}
  }
  const offTime=lastOn>=post-1?null:lastOn*DT;
  return {t0:-T_PRE,dt:DT*every,v:out.v,i:out.i,peak,offTime,avalanche};
}
const traces=new Map<string,Trace>();
export const setupKey=(s:Setup)=>SLOT_IDS.map(k=>s[k]?`${s[k]!.part}${s[k]!.flipped?'-':'+'}`:'_').join('|')+(s.star?'|star':'|shared');
/** Shutdown depends only on the protection parts (not the capacitor or the ground route). */
export function shutdownCached(s:Setup):Trace{const k=`${setupKey({...s,ctrl:undefined,star:false})}`;let t=traces.get(k);if(!t){t=shutdown(s);traces.set(k,t);}return t;}

// ---------- the start-up surge ----------
/** Controller supply sag at start (V): the start surge through the ground wire it shares with the
 *  motor. The capacitor low-pass filters the surge's falling part; the steady running part stays. */
export function startDip(job:Job,s:Setup):number{
  const r=s.star?STAR_R:job.shared,tm=MOTOR.spinUp;let k=1;
  if(s.ctrl?.part==='cap'&&!s.ctrl.flipped){const tc=CTRL.feed*CTRL.C;
    // Peak of the low-passed exponential a·e^(−t/tm) through 1/(1 + s·tc).
    if(Math.abs(tm-tc)<1e-9)k=Math.exp(-1);else{const ts=Math.log(tm/tc)*tm*tc/(tm-tc);k=tm/(tm-tc)*(Math.exp(-ts/tm)-Math.exp(-ts/tc));}}
  return r*(RUNNING+(STALL-RUNNING)*k);
}
/** The same sag over time, for the scope's START view (0 → 20 ms). */
export function startTrace(job:Job,s:Setup,n=200,span=20e-3):number[]{
  const r=s.star?STAR_R:job.shared,tm=MOTOR.spinUp,cap=s.ctrl?.part==='cap'&&!s.ctrl.flipped,tc=CTRL.feed*CTRL.C,out:number[]=[];
  let y=0;const dt=span/n;
  for(let k=0;k<=n;k++){const x=(STALL-RUNNING)*Math.exp(-k*dt/tm);
    y=cap?y+(x-y)*(1-Math.exp(-dt/tc)):x; // the capacitor starts the surge from rest
    out.push(CTRL.rail-r*(RUNNING+y));}
  return out;
}

// ---------- the verdict ----------
export interface Verdict {tier:0|1|2|3;
  /** 'short' = fuse tripped; 'cap' = reversed electrolytic; 'stuck' = motor never stops;
   *  'stop' = reset at shutdown; 'start' = reset at start; 'slow' = missed the stop-line spec. */
  fault?:'short'|'cap'|'stuck'|'stop'|'start'|'slow';
  spike:number;offTime:number|null;dip:number;parts:number;problems:string[];notes:string[]}
const ms=(t:number)=>`${(t*1e3).toFixed(t<1e-3?2:1)} ms`;
export function judge(job:Job,s:Setup):Verdict{
  const parts=partCount(s),problems:string[]=[],notes:string[]=[];
  const base={parts,problems,notes};
  if(shorted(s)){const z=[s.fly1,s.fly2].some(f=>f?.part==='zener');
    problems.push(z&&!(s.fly1?.part==='diode'||s.fly2?.part==='diode')?'The zener is round the wrong way on its own: with the motor ON it conducts from +12 V straight to ground. Dead short, the fuse tripped.':
      'A part across the motor is backwards: with the motor ON it is a dead short from +12 V to ground, so the fuse tripped. The band (cathode) must face +12 V.');
    return {tier:0,fault:'short',spike:0,offTime:null,dip:0,...base};}
  if(capReversed(s)){problems.push('The electrolytic capacitor is in backwards: it would heat up and vent. Flip it so + faces the 5 V rail.');return {tier:0,fault:'cap',spike:0,offTime:null,dip:0,...base};}
  const tr=shutdownCached(s),dip=startDip(job,s),spike=+tr.peak.toFixed(1),out={spike,offTime:tr.offTime,dip:+dip.toFixed(2),...base};
  if(tr.offTime===null){problems.push('The motor never switched off: the TVS is backwards, so it conducts forwards like a closed switch. Flip it (band to the switch node).');return {tier:0,fault:'stuck',...out};}
  if(spike>SPEC.spikeReset){
    let why=`Shutdown spike: ${Math.round(spike)} V at the switch. The coil's current had nowhere to go, so the switch was forced into breakdown and the kick reset the controller.`;
    if(s.ctrl?.part==='cap')why+=' The capacitor at the controller doesn\'t help here: it can smooth brief supply dips, but it gives the coil\'s current no path.';
    else if(s.switch?.part==='snubber')why+=' The small RC snubber softens fast ringing but can\'t soak up the coil\'s stored energy.';
    else if(!s.fly1&&!s.fly2&&!s.switch)why+=' Give the current a path: a flyback diode across the motor.';
    problems.push(why);return {tier:0,fault:'stop',...out};}
  if(dip>SPEC.dipReset){
    let why=`Start surge: ${STALL} A through the shared ground wire sags the controller's supply by ${dip.toFixed(2)} V (it browns out past ${SPEC.dipReset} V).`;
    why+=s.ctrl?.part==='cap'?' The capacitor rides through part of it, but the surge lasts milliseconds and the running current stays: reroute the ground.':' Give the controller its own ground wire (star ground).';
    problems.push(why);return {tier:0,fault:'start',...out};}
  if(job.stopSpec&&tr.offTime>job.stopSpec){
    const plain=flyChain(s)&&flyChain(s)!.fwd<5;
    problems.push(`Motor current took ${ms(tr.offTime)} to die; the stop-line brake needs it under ${ms(job.stopSpec)}.${plain?' The diode clamps only 0.7 V above the supply, so the coil empties slowly. A higher clamp (a zener in breakdown, or a TVS) empties it faster.':''}`);
    return {tier:0,fault:'slow',...out};}
  // Works. Reliable: margins on the spike, the supply and the stop time.
  let tier:1|2|3=2;
  if(spike>SPEC.spikeReliable){tier=1;notes.push(`spike ${Math.round(spike)} V is past 80 % of the switch's ${SWITCH.absMax} V abs max`);}
  if(dip>SPEC.dipReliable){tier=1;notes.push(`supply sag ${dip.toFixed(2)} V leaves little margin`);}
  if(job.stopSpec&&tr.offTime>job.stopSpec*.8){tier=1;notes.push('stop time is right at the limit');}
  if(tier===2&&parts===fewestParts(job))tier=3;
  else if(tier===2)notes.push(`it works with ${fewestParts(job)} part${fewestParts(job)===1?'':'s'}`);
  return {tier,...out};
}

// ---------- the solver ----------
/** Every distinct setup: each part at most once, in any of its places, either way round. */
export function allSetups():Setup[]{
  const opts=(slot:SlotId)=>[undefined,...PART_IDS.filter(p=>PARTS[p].slots.includes(slot)).flatMap(p=>PARTS[p].polar?[{part:p,flipped:false},{part:p,flipped:true}]:[{part:p,flipped:false}])] as (Fit|undefined)[];
  const out:Setup[]=[];
  for(const fly1 of opts('fly1'))for(const fly2 of opts('fly2')){if(fly1&&fly2&&fly1.part===fly2.part)continue;
    for(const sw of opts('switch'))for(const ctrl of opts('ctrl'))for(const star of [false,true])out.push({fly1,fly2,switch:sw,ctrl,star});}
  return out;
}
const fewest=new Map<string,number>();
/** The fewest parts that pass this job reliably (tier ≥ 2 before the elegance check). */
export function fewestParts(job:Job):number{
  let n=fewest.get(job.id);if(n!==undefined)return n;n=Infinity;
  for(const s of allSetups()){const p=partCount(s);if(p>=n)continue;if(reliable(job,s))n=p;}
  fewest.set(job.id,n);return n;
}
/** Passes with margin (the checks judge() makes before the elegance check). */
export function reliable(job:Job,s:Setup):boolean{
  if(shorted(s)||capReversed(s))return false;const tr=shutdownCached(s),dip=startDip(job,s);
  if(tr.offTime===null||tr.peak>SPEC.spikeReliable||dip>SPEC.dipReliable)return false;
  return !job.stopSpec||tr.offTime<=job.stopSpec*.8;
}
/** Cheapest reliable setup for a job (for the grade's process-cost limit). */
export function cheapest(job:Job):{setup:Setup;cost:number}|undefined{
  let best:{setup:Setup;cost:number}|undefined;
  for(const s of allSetups()){const c=cost(s);if(best&&c>=best.cost)continue;if(reliable(job,s))best={setup:s,cost:c};}
  return best;
}
