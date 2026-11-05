// Robot Garage rules. A delivery robot's drive motor (a coil with winding resistance and, while
// it spins, a back-EMF) is switched on its low side by a MOSFET. The controller that runs the
// robot shares the battery. When the MOSFET opens, the coil's current cannot stop at once: it
// keeps flowing and drives the switch node up (v = −L·di/dt) until something conducts it. Pip
// fits protection parts into the harness board and captures the result on a scope.
//
// Places:  ACROSS MOTOR (between +12 V and the switch node) · ACROSS SWITCH (between the node and
//          ground) · AT CONTROLLER (bulk capacitor) · the controller's GROUND route (shared or star).
//          Every protection part fits both protection places, either way round: where the coil's
//          current gets its path, and which way the part conducts, are the player's decisions.
//
// Model (simplified, labelled in game):
//   * Shutdown is simulated numerically: the coil current i obeys L·di/dt = V − E − R·i − v, the
//     switch node v comes from current balance at the node (a small stray capacitance plus every
//     path that conducts), solved implicitly each 1 µs step. Diodes are ideal thresholds with a
//     small on-resistance; the MOSFET avalanches above its breakdown voltage.
//   * The start-up surge is the stall current falling to the running current as the motor spins up
//     (exponential, tens of milliseconds). Through a shared ground wire it sags the controller's
//     supply; a capacitor at the controller filters that sag (first-order low-pass).
//   * Job 2 swaps the motor for the parking brake's holding coil (no back-EMF): a spring-applied
//     brake grabs only once that coil's current has died, so the release time is the coil's decay.
// Teaching guardrails (docs/EXPANSION_PLAN.md):
//   * A decoupling/bulk capacitor supplies brief transient current and smooths short supply dips.
//     It is not a battery or regulator, and it does NOT give the coil's current a path: it does
//     nothing for the shutdown spike at the switch.
//   * A flyback diode gives the current a path, clamping the spike to about a diode drop above
//     the supply; but the current then decays slowly (low clamp voltage). A higher clamp (zener,
//     TVS) empties the coil faster at the price of a taller (still safe) spike.
//   * A diode across the switch with its band at the node never conducts as the node rises (no
//     path); turned round it conducts forwards and the switch can never turn the coil off.
//   * An absolute maximum is a stress limit, not a design target: "reliable" keeps 20 % margin.
//   * Numbers are this game's tuning values for one robot, not a datasheet.

export type PartId='diode'|'clamp'|'tvs'|'snubber'|'cap';
export type SlotId='fly'|'switch'|'ctrl';
export interface Part {id:PartId;label:string;name:string;slots:SlotId[];polar:boolean;
  /** Forward drop and reverse breakdown (V) for diode-like parts: the voltage it takes to conduct
   *  from anode to band, and from band to anode. */
  vf?:number;vbr?:number;
  /** On-resistance while it conducts (Ω), for diode-like parts. */
  rOn?:number;cost:number}
/** The zener clamp is one package holding a diode and a 24 V zener back to back: the diode stops it
 *  conducting while the motor runs, the zener sets how high the kick may rise before it conducts.
 *  The TVS is unidirectional: forwards it is a plain diode, backwards it breaks down at 33 V. */
export const PARTS:Record<PartId,Part>={
  diode:{id:'diode',label:'DIODE',name:'Flyback diode',slots:['fly','switch'],polar:true,vf:.7,vbr:400,rOn:.05,cost:.4},
  clamp:{id:'clamp',label:'CLAMP 24 V',name:'24 V zener clamp',slots:['fly','switch'],polar:true,vf:.7+24,vbr:400+.7,rOn:.05,cost:1},
  tvs:{id:'tvs',label:'TVS 33 V',name:'33 V TVS clamp',slots:['fly','switch'],polar:true,vf:.7,vbr:33,rOn:.3,cost:1.2},
  snubber:{id:'snubber',label:'RC SNUBBER',name:'RC snubber (10 Ω + 1 µF)',slots:['fly','switch'],polar:false,cost:.8},
  cap:{id:'cap',label:'1000 µF',name:'1000 µF bulk capacitor',slots:['ctrl'],polar:true,cost:.9},
};
export const PART_IDS=Object.keys(PARTS) as PartId[];
export const SLOT_IDS:SlotId[]=['fly','switch','ctrl'];
export const SLOT_NAMES:Record<SlotId,string>={fly:'ACROSS MOTOR',switch:'ACROSS SWITCH',ctrl:'AT CONTROLLER'};
/** A fitted part. Not flipped = the band (or the capacitor's +) at the socket's left end: toward
 *  +12 V across the motor, toward the switch node across the switch, toward the 5 V rail at the
 *  controller. */
export interface Fit {part:PartId;flipped:boolean}
export interface Setup {fly?:Fit;switch?:Fit;ctrl?:Fit;star:boolean}
/** What each socket's two ends connect to: left (the band end when not flipped), then right. */
export const SOCKET_ENDS:Record<SlotId,[string,string]>={fly:['+12 V','node'],switch:['node','ground'],ctrl:['5 V','ground']};
/** How a fitted part sits, in physical words (for the panel). */
export function orientation(slot:SlotId,f:Fit):string{
  const p=PARTS[f.part];if(!p.polar)return '';const [l,r]=SOCKET_ENDS[slot];
  return `${p.id==='cap'?'+':'band'} → ${f.flipped?r:l}`;
}

/** A coil the low-side switch drives. Game tuning values, not a datasheet. */
export interface Coil {id:'motor'|'brake';name:string;L:number;R:number;emf:number}
/** The robot's drive motor. Running current = (V − E)/R = 3 A; stall = V/R = 6 A. It takes about
 *  80 ms to spin up from a standstill, so the start surge lasts about that long. */
export const MOTOR={id:'motor' as const,name:'motor',V:12,R:2,L:5e-3,emf:6,spinUp:80e-3};
/** The spring-applied parking brake: springs press the shoes on, a coil (12 V, 0.5 A) holds them
 *  off. The brake grabs only once that coil's current has died. */
export const BRAKE:Coil={id:'brake',name:'brake coil',L:40e-3,R:24,emf:0};
export const coilRunning=(c:Coil)=>(MOTOR.V-c.emf)/c.R;
export const RUNNING=coilRunning(MOTOR),STALL=MOTOR.V/MOTOR.R;
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
  /** Coil current counts as "off" once under 10 % of its running current. */
  offFraction:.1,
  cycles:5,
};
/** Ground return resistance shared by motor and controller (Ω). */
export const STAR_R=.01;
/** Words the scope prints (kept here so the tests can check they never give the fix away). */
export const SCOPE_TEXT={fuseTitle:'FUSE TRIPPED',fuse:'Short across the battery',fuseSub:'The fuse resets itself as it cools'};

export interface Job {id:string;title:string;ask:string;
  /** Resistance of the ground wire the controller shares with the motor (Ω). */
  shared:number;
  /** The coil on the switch for this job (default: the drive motor). */
  coil?:Coil;
  /** The coil's current must die within this time after switch-off (s), when the job has one. */
  stopSpec?:number;
  /** The job is about the start-up: the scope stays on the START view once the stop is clean. */
  startScope?:boolean}
export const JOBS:Job[]=[
  {id:'kickback',title:'Resets on shutdown',ask:'The controller resets every time the motor stops.',
    shared:.05},
  {id:'stopline',title:'Brake at the line',ask:'At the delivery stop a spring brake grabs the wheels once its holding coil lets go. The brake coil is on the switch now, in the motor\'s place: its current must die within 2 ms of switch-off.',
    shared:.05,coil:BRAKE,stopSpec:2e-3},
  {id:'cargo',title:'Heavy cargo start',ask:'New cargo bed, new harness: the board is bare again, and the controller now sits at the back on a long ground wire shared with the motor. It resets when the motor starts.',
    shared:.15,startScope:true},
];
export const jobCoil=(j:Job):Coil=>j.coil??MOTOR;

// ---------- the parts in each place ----------
export const fitted=(s:Setup)=>SLOT_IDS.map(k=>s[k]).filter((f):f is Fit=>!!f);
export const partCount=(s:Setup)=>fitted(s).length;
export const cost=(s:Setup)=>Math.round(fitted(s).reduce((n,f)=>n+PARTS[f.part].cost,0)*10)/10;
/** A protection path from the switch node to `ref` (+12 V across the motor, ground across the
 *  switch): a diode-like threshold pair, or the RC snubber. */
interface Path {ref:number;diode?:{fwd:number;rev:number;r:number};rc?:boolean}
function pathFor(f:Fit|undefined,where:'fly'|'switch'):Path|undefined{
  if(!f)return undefined;const p=PARTS[f.part],ref=where==='fly'?MOTOR.V:0;
  if(p.vf===undefined)return f.part==='snubber'?{ref,rc:true}:undefined;
  // Band at the node: conducts node → ref only in breakdown (vbr), ref → node forwards (vf).
  // Band at the far end: conducts node → ref forwards.
  const bandAtNode=where==='switch'?!f.flipped:f.flipped;
  return {ref,diode:bandAtNode?{fwd:p.vbr!,rev:p.vf!,r:p.rOn!}:{fwd:p.vf!,rev:p.vbr!,r:p.rOn!}};
}
/** Thresholds of the part across the motor: conducts node → +12 V above `fwd` volts, the other way
 *  above `rev` volts (undefined = nothing diode-like fitted, no path). */
export function flyChain(s:Setup):{fwd:number;rev:number}|undefined{const d=pathFor(s.fly,'fly')?.diode;return d&&{fwd:d.fwd,rev:d.rev};}
/** The same for the part across the switch (node → ground above `fwd`). */
export function switchChain(s:Setup):{fwd:number;rev:number}|undefined{const d=pathFor(s.switch,'switch')?.diode;return d&&{fwd:d.fwd,rev:d.rev};}
/** With the motor ON the switch node sits near 0 V, so the across-motor part sees −12 V: if it
 *  conducts that way, it is a dead short across the battery (the fuse trips). */
export const shorted=(s:Setup)=>{const c=flyChain(s);return !!c&&c.rev<MOTOR.V;};
export const capReversed=(s:Setup)=>!!s.ctrl&&s.ctrl.part==='cap'&&s.ctrl.flipped;

// ---------- the shutdown transient ----------
export interface Trace {
  /** Samples every `dt` seconds from −0.5 ms (switch still on) to +5 ms. */
  t0:number;dt:number;v:number[];i:number[];
  /** Highest switch-node voltage (V). */
  peak:number;
  /** Time after turn-off for the coil current to fall below 10 % for good (s), or null if it never does. */
  offTime:number|null;
  avalanche:boolean;
  /** Which way most of the coil's current went after turn-off: through the part across the motor,
   *  through the part across the switch, or (none) forced through the switch in breakdown. */
  path:'fly'|'switch'|'none';
  /** The coil's current while it was switched on (A). */
  running:number;
}
const DT=1e-6,T_PRE=.5e-3,T_POST=5e-3,CP=10e-9,R_DIODE=.05,R_AV=.5;
/** Current leaving the switch node through a diode-like part for a voltage `u` across it. */
const diodeI=(u:number,fwd:number,rev:number,r:number)=>u>fwd?(u-fwd)/r:u< -rev?(u+rev)/r:0;
export function shutdown(s:Setup,coil:Coil=MOTOR):Trace{
  const V=MOTOR.V,{R,L,emf}=coil,paths=[pathFor(s.fly,'fly'),pathFor(s.switch,'switch')],running=coilRunning(coil);
  const rs=SNUB.R+DT/SNUB.C;
  let i=running,v=i*SWITCH.rOn,peak=v,avalanche=false;
  const vc=paths.map(p=>p?.rc?v-p.ref:0),q=[0,0];let qAv=0; // snubber capacitor voltages; charge through each path
  const v0=v,out:{v:number[];i:number[]}={v:[],i:[]},every=10;
  const pre=Math.round(T_PRE/DT),post=Math.round(T_POST/DT);
  for(let k=0;k<pre;k+=every){out.v.push(v0);out.i.push(i);}
  const through=(n:number,x:number)=>{const p=paths[n];return !p?0:p.diode?diodeI(x-p.ref,p.diode.fwd,p.diode.rev,p.diode.r||R_DIODE):(x-p.ref-vc[n])/rs;};
  let lastOn=0;
  for(let k=1;k<=post;k++){
    // Implicit coil current as a function of the node voltage.
    const iNew=(x:number)=>(i+DT/L*(V-emf-x))/(1+DT*R/L);
    const leave=(x:number)=>{let n=CP*(x-v)/DT;
      if(x>SWITCH.avalanche)n+=(x-SWITCH.avalanche)/R_AV; // MOSFET avalanche (stress!)
      if(x< -.7)n+=(x+.7)/R_DIODE;                          // MOSFET body diode
      return n+through(0,x)+through(1,x);};
    let lo=-120,hi=600;for(let n=0;n<48;n++){const m=(lo+hi)/2;if(leave(m)-iNew(m)>0)hi=m;else lo=m;}
    const x=(lo+hi)/2;i=iNew(x);
    for(const n of [0,1]){const a=through(n,x);q[n]+=Math.max(0,a)*DT;if(paths[n]?.rc)vc[n]+=a*DT/SNUB.C;}
    if(x>SWITCH.avalanche)qAv+=(x-SWITCH.avalanche)/R_AV*DT;
    v=x;if(v>SWITCH.avalanche+.01)avalanche=true;peak=Math.max(peak,v);
    if(Math.abs(i)>=SPEC.offFraction*running)lastOn=k;
    if(k%every===0){out.v.push(v);out.i.push(i);}
  }
  const offTime=lastOn>=post-1?null:lastOn*DT;
  const path=qAv>=Math.max(q[0],q[1])?'none':q[0]>=q[1]?'fly':'switch';
  return {t0:-T_PRE,dt:DT*every,v:out.v,i:out.i,peak,offTime,avalanche,path,running};
}
const traces=new Map<string,Trace>();
export const setupKey=(s:Setup)=>SLOT_IDS.map(k=>s[k]?`${s[k]!.part}${s[k]!.flipped?'-':'+'}`:'_').join('|')+(s.star?'|star':'|shared');
/** Where the parts sit, ignoring which way round (a flip and re-PULSE is the same experiment). */
export const placementKey=(s:Setup)=>SLOT_IDS.map(k=>s[k]?.part??'_').join('|')+(s.star?'|star':'|shared');
/** Shutdown depends only on the protection parts and the coil (not the capacitor or the ground route). */
export function shutdownCached(s:Setup,coil:Coil=MOTOR):Trace{const k=`${coil.id}|${setupKey({...s,ctrl:undefined,star:false})}`;let t=traces.get(k);if(!t){t=shutdown(s,coil);traces.set(k,t);}return t;}

// ---------- the start-up surge ----------
/** The surge's size and length for a job's coil: a motor starts at its stall current and falls to
 *  its running current as it spins up; the brake coil (no back-EMF) draws a steady current. */
const surge=(job:Job)=>{const c=jobCoil(job),run=coilRunning(c);return {run,extra:MOTOR.V/c.R-run,tm:MOTOR.spinUp};};
/** Controller supply sag at start (V): the start surge through the ground wire it shares with the
 *  motor. The capacitor low-pass filters the surge's falling part; the steady running part stays. */
export function startDip(job:Job,s:Setup):number{
  const r=s.star?STAR_R:job.shared,{run,extra,tm}=surge(job);let k=1;
  if(s.ctrl?.part==='cap'&&!s.ctrl.flipped){const tc=CTRL.feed*CTRL.C;
    // Peak of the low-passed exponential a·e^(−t/tm) through 1/(1 + s·tc).
    if(Math.abs(tm-tc)<1e-9)k=Math.exp(-1);else{const ts=Math.log(tm/tc)*tm*tc/(tm-tc);k=tm/(tm-tc)*(Math.exp(-ts/tm)-Math.exp(-ts/tc));}}
  return r*(run+extra*k);
}
/** The scope's START view spans this long after the motor starts (s). */
export const START_SPAN=300e-3;
/** The same sag over time, for the scope's START view (0 → START_SPAN). */
export function startTrace(job:Job,s:Setup,n=200,span=START_SPAN):number[]{
  const r=s.star?STAR_R:job.shared,{run,extra,tm}=surge(job),cap=s.ctrl?.part==='cap'&&!s.ctrl.flipped,tc=CTRL.feed*CTRL.C,out:number[]=[];
  let y=0;const dt=span/n;
  for(let k=0;k<=n;k++){const x=extra*Math.exp(-k*dt/tm);
    y=cap?y+(x-y)*(1-Math.exp(-dt/tc)):x; // the capacitor starts the surge from rest
    out.push(CTRL.rail-r*(run+y));}
  return out;
}

// ---------- the verdict ----------
export interface Verdict {tier:0|1|2|3;
  /** 'short' = fuse tripped; 'cap' = reversed electrolytic; 'stuck' = the coil never switches off;
   *  'stop' = reset at shutdown; 'start' = reset at start; 'slow' = missed the stop-time spec. */
  fault?:'short'|'cap'|'stuck'|'stop'|'start'|'slow';
  spike:number;offTime:number|null;dip:number;parts:number;problems:string[];notes:string[]}
export const ms=(t:number)=>`${(t*1e3).toFixed(2)} ms`;
export function judge(job:Job,s:Setup):Verdict{
  const parts=partCount(s),problems:string[]=[],notes:string[]=[],coil=jobCoil(job);
  const base={parts,problems,notes};
  if(shorted(s)){problems.push('With the motor ON, the part across the motor conducts from +12 V straight to ground: a dead short, so the fuse tripped.');
    return {tier:0,fault:'short',spike:0,offTime:null,dip:0,...base};}
  if(capReversed(s)){problems.push('The electrolytic capacitor is in backwards: it heats up and vents.');return {tier:0,fault:'cap',spike:0,offTime:null,dip:0,...base};}
  const tr=shutdownCached(s,coil),dip=startDip(job,s),spike=+tr.peak.toFixed(1),out={spike,offTime:tr.offTime,dip:+dip.toFixed(2),...base};
  if(tr.offTime===null){problems.push(`The ${coil.name} never switched off: the part across the switch conducts forwards, like a closed switch.`);return {tier:0,fault:'stuck',...out};}
  if(spike>SPEC.spikeReset){
    let why=`Shutdown spike: ${Math.round(spike)} V at the switch. The coil's current had nowhere to go, so the switch was forced into breakdown and the kick reset the controller.`;
    const dead=([['fly',flyChain(s)],['switch',switchChain(s)]] as const).find(([,c])=>c&&c.fwd>SWITCH.avalanche);
    if(s.ctrl?.part==='cap'&&!s.fly&&!s.switch)why+=' The capacitor at the controller doesn\'t help here: it can smooth brief supply dips, but it gives the coil\'s current no path.';
    else if(s.switch?.part==='snubber'||s.fly?.part==='snubber')why+=' The small RC snubber softens fast ringing but can\'t soak up the coil\'s stored energy.';
    else if(dead)why+=` The part across the ${dead[0]==='fly'?'motor':'switch'} doesn't conduct as the node rises, so the coil still has no path.`;
    problems.push(why);return {tier:0,fault:'stop',...out};}
  if(dip>SPEC.dipReset){
    let why=`Start surge: ${STALL} A through the shared ground wire sags the controller's supply by ${dip.toFixed(2)} V (it browns out past ${SPEC.dipReset} V).`;
    if(s.ctrl?.part==='cap')why+=' The capacitor rides through the first instant, but the surge lasts as long as the motor takes to spin up, far longer than this capacitor can hold up.';
    problems.push(why);return {tier:0,fault:'start',...out};}
  if(job.stopSpec&&tr.offTime>job.stopSpec){
    const fc=flyChain(s),plain=tr.path==='fly'&&!!fc&&fc.fwd<5;
    problems.push(`The ${coil.name}'s current took ${ms(tr.offTime)} to die; the brake needs it under ${ms(job.stopSpec)}, so it grabbed late.${plain?' The part across the coil holds it only 0.7 V above the supply, so its energy drains slowly.':''}`);
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
  for(const fly of opts('fly'))for(const sw of opts('switch')){if(fly&&sw&&fly.part===sw.part)continue;
    for(const ctrl of opts('ctrl'))for(const star of [false,true])out.push({fly,switch:sw,ctrl,star});}
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
  if(shorted(s)||capReversed(s))return false;const tr=shutdownCached(s,jobCoil(job)),dip=startDip(job,s);
  if(tr.offTime===null||tr.peak>SPEC.spikeReliable||dip>SPEC.dipReliable)return false;
  return !job.stopSpec||tr.offTime<=job.stopSpec*.8;
}
/** Cheapest reliable setup for a job (for the grade's process-cost limit). */
export function cheapest(job:Job):{setup:Setup;cost:number}|undefined{
  let best:{setup:Setup;cost:number}|undefined;
  for(const s of allSetups()){const c=cost(s);if(best&&c>=best.cost)continue;if(reliable(job,s))best={setup:s,cost:c};}
  return best;
}
