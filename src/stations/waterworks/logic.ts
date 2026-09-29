// Waterworks rules: Thevenin and Norton equivalents, first met as water.
//
// A hidden network sits behind frosted glass with only two ports (A and B). The player fits
// loads to the ports, reads pressure and flow, and tunes two simpler carts until each one behaves
// the same as the hidden network under every test load:
//   · the pressure cart: a fixed-pressure pump with a series restriction (Thevenin shape);
//   · the flow cart: a fixed-flow pump with a parallel bypass (Norton shape).
// Then the glass clears to show the same network as an electrical circuit, and the player names
// V_th, R_th and I_N in volts, ohms and milliamps.
//
// Teaching guardrails (also stated to the player):
//   · The water model is an ANALOGY: pressure ≈ voltage, flow ≈ current, restriction ≈ resistance.
//     It holds only for steady, linear cases. Real pipes and water wheels are not linear, and
//     nothing here claims water storage, inertia or viscosity describe circuits in general.
//   · The electrical side is exact for linear resistive networks with ideal sources:
//     V_th is the open-port voltage, I_N the short-circuit current, R_th = V_th / I_N, and the
//     Norton current is I_N = V_th / R_th.
// Pure module: no three.js and no DOM. The network solver is modified nodal analysis with
// Gaussian elimination (partial pivoting).

/** Node 0 is port B, the common return (ground). */
export type NodeId=number;
/** Two-terminal parts. V: node a sits v above node b (ideal source). I: pushes i out of node b,
 *  through the source, into node a (ideal source). R: a linear resistor/restriction. */
export type Part=
  {kind:'R';a:NodeId;b:NodeId;r:number}|
  {kind:'V';a:NodeId;b:NodeId;v:number}|
  {kind:'I';a:NodeId;b:NodeId;i:number};
/** A point on the case's schematic grid (x across, y up); pipes and the reveal share the layout. */
export type Pt=[number,number];
export interface Drawn {part:Part;path:Pt[]}
export interface Net {
  id:string;name:string;
  /** Number of nodes including ground (node 0). */
  nodes:number;
  /** Port A's node; port B is node 0. */
  port:NodeId;
  parts:Drawn[];
  /** Plain pipes (and wires) joining the parts on the drawing. */
  wires:Pt[][];
  /** Where ports A and B leave the drawing. */
  ports:{a:Pt;b:Pt};
  /** One line for the order card. */
  story:string;
}
/** A load on the ports: 'open' (a shut valve), 'short' (a bypass hose) or a restriction value. */
export type Load='open'|'short'|number;
export interface Reading {p:number;q:number}

// ---------- linear solver ----------
/** Solves A·x = b in place (Gaussian elimination with partial pivoting). Throws if singular. */
export function gauss(A:number[][],b:number[]):number[]{
  const n=b.length;
  for(let c=0;c<n;c++){
    let piv=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[piv][c]))piv=r;
    if(Math.abs(A[piv][c])<1e-12)throw new Error('singular network');
    [A[c],A[piv]]=[A[piv],A[c]];[b[c],b[piv]]=[b[piv],b[c]];
    for(let r=c+1;r<n;r++){const f=A[r][c]/A[c][c];if(!f)continue;for(let k=c;k<n;k++)A[r][k]-=f*A[c][k];b[r]-=f*b[c];}
  }
  const x=new Array<number>(n).fill(0);
  for(let r=n-1;r>=0;r--){let s=b[r];for(let k=r+1;k<n;k++)s-=A[r][k]*x[k];x[r]=s/A[r][r];}
  return x;
}
export interface Solution {
  /** Node voltages (pressures), v[0] = 0. */
  v:number[];
  /** Current (flow) through each part, from a to b through the part. For sources, the current
   *  leaving the source at node a. */
  i:number[];
}
/** Modified nodal analysis of a list of parts. */
export function solve(nodes:number,parts:Part[]):Solution{
  const vs=parts.map((p,k)=>p.kind==='V'?k:-1).filter(k=>k>=0),n=nodes-1,m=vs.length,size=n+m;
  const A=Array.from({length:size},()=>new Array<number>(size).fill(0)),b=new Array<number>(size).fill(0);
  const at=(node:NodeId)=>node-1;
  parts.forEach((p,k)=>{
    if(p.kind==='R'){const g=1/p.r;
      if(p.a)A[at(p.a)][at(p.a)]+=g;if(p.b)A[at(p.b)][at(p.b)]+=g;
      if(p.a&&p.b){A[at(p.a)][at(p.b)]-=g;A[at(p.b)][at(p.a)]-=g;}}
    else if(p.kind==='I'){if(p.a)b[at(p.a)]+=p.i;if(p.b)b[at(p.b)]-=p.i;}
    else{const row=n+vs.indexOf(k);
      // Branch current j flows from a through the source to b inside it; KCL rows get ±j.
      if(p.a){A[at(p.a)][row]+=1;A[row][at(p.a)]+=1;}if(p.b){A[at(p.b)][row]-=1;A[row][at(p.b)]-=1;}b[row]=p.v;}
  });
  const x=size?gauss(A,b):[];
  const v=[0,...x.slice(0,n)];
  const i=parts.map((p,k)=>p.kind==='R'?(v[p.a]-v[p.b])/p.r:p.kind==='I'?p.i:-x[n+vs.indexOf(k)]);
  return {v,i};
}
const loadPart=(net:Net,load:Load):Part|undefined=>load==='open'?undefined:load==='short'?{kind:'V',a:net.port,b:0,v:0}:{kind:'R',a:net.port,b:0,r:load};
/** Full solution with a load fitted (the load is the last part when present). */
export function solveWith(net:Net,load:Load){const lp=loadPart(net,load),parts=net.parts.map(d=>d.part);return solve(net.nodes,lp?[...parts,lp]:parts);}
/** Pressure across the ports and flow through the load (A → load → B). */
export function reading(net:Net,load:Load):Reading{
  const s=solveWith(net,load),p=s.v[net.port];
  if(load==='open')return {p,q:0};
  if(load==='short')return {p:0,q:-s.i[s.i.length-1]};
  return {p,q:p/load};
}
/** The equivalent seen from the ports: open-port pressure, short-port flow, and the resistance
 *  found independently by switching every source off (V → short, I → open) and pushing a 1-unit
 *  test flow into port A. */
export function thevenin(net:Net){
  const vth=reading(net,'open').p,iN=reading(net,'short').q;
  const dead:Part[]=net.parts.map(d=>d.part).filter(p=>p.kind!=='I').map(p=>p.kind==='V'?{...p,v:0}:p);
  const rth=solve(net.nodes,[...dead,{kind:'I',a:net.port,b:0,i:1}]).v[net.port];
  return {vth,rth,iN};
}

// ---------- the carts ----------
export interface Carts {
  /** Pressure cart: pump pressure and series restriction. */
  pP:number;pR:number;
  /** Flow cart: pump flow and parallel bypass restriction. */
  fQ:number;fR:number;
}
export type Device='net'|'pcart'|'fcart';
/** Thevenin shape: pressure P behind a series restriction R. */
export function pressureCart(P:number,R:number,load:Load):Reading{
  if(load==='open')return {p:P,q:0};if(load==='short')return {p:0,q:P/R};
  const q=P/(R+load);return {p:q*load,q};
}
/** Norton shape: flow Q with a bypass restriction R across the ports. */
export function flowCart(Q:number,R:number,load:Load):Reading{
  if(load==='open')return {p:Q*R,q:0};if(load==='short')return {p:0,q:Q};
  const p=Q*R*load/(R+load);return {p,q:p/load};
}
export function readDevice(net:Net,c:Carts,d:Device,load:Load):Reading{
  return d==='net'?reading(net,load):d==='pcart'?pressureCart(c.pP,c.pR,load):flowCart(c.fQ,c.fR,load);
}

// ---------- matching ----------
/** Test loads used by COMPARE: three water wheels (each modelled as a fixed restriction). */
export const WHEELS=[2,6,12] as const;
export const LOADS:Load[]=['open','short',...WHEELS];
/** Two readings match when both pressure and flow agree within 2 % (or 0.02 near zero). */
export const TOL=.02;
const close=(a:number,b:number)=>Math.abs(a-b)<=Math.max(TOL*Math.abs(a),TOL);
export const same=(a:Reading,b:Reading)=>close(a.p,b.p)&&close(a.q,b.q);
export interface CompareRow {load:number;net:Reading;pcart:Reading;fcart:Reading;pOk:boolean;fOk:boolean}
export interface Comparison {rows:CompareRow[];pOk:boolean;fOk:boolean;problems:string[]}
export function compare(net:Net,c:Carts):Comparison{
  const rows=WHEELS.map(load=>{const n=reading(net,load),pc=pressureCart(c.pP,c.pR,load),fc=flowCart(c.fQ,c.fR,load);return {load,net:n,pcart:pc,fcart:fc,pOk:same(n,pc),fOk:same(n,fc)};});
  const pOk=rows.every(r=>r.pOk),fOk=rows.every(r=>r.fOk),problems:string[]=[];
  if(!pOk)problems.push(explain('pressure',rows.map(r=>({load:r.load,want:r.net,got:r.pcart,ok:r.pOk})),net,c));
  if(!fOk)problems.push(explain('flow',rows.map(r=>({load:r.load,want:r.net,got:r.fcart,ok:r.fOk})),net,c));
  return {rows,pOk,fOk,problems};
}
/** One or two plain sentences on why a cart misses, pointing at the measurement that fixes it. */
function explain(cart:'pressure'|'flow',rows:{load:number;want:Reading;got:Reading;ok:boolean}[],net:Net,c:Carts){
  const t=thevenin(net),name=cart==='pressure'?'The pressure cart':'The flow cart';
  const src=cart==='pressure'?c.pP:c.fQ*c.fR,r=cart==='pressure'?c.pR:c.fR;
  const hits=rows.filter(x=>x.ok).map(x=>x.load);
  const tail=hits.length?` It matches with the ${hits.join(' and ')} wheel only; one load can't pin down two knobs.`:'';
  if(!close(src,t.vth))return `${name} would read ${fmt(src)} kPa with the ports shut, but the network reads ${fmt(t.vth)}.${cart==='flow'?' Its shut-port pressure is flow × bypass.':' Shut the valve on the network and read the gauge.'}${tail}`;
  if(!close(r,t.rth))return `${name}'s ${cart==='pressure'?'series':'bypass'} restriction is off: under load its pressure sags ${r>t.rth?'more':'less'} than the network's. Compare one wheel's reading with the shut-port pressure.${tail}`;
  return `${name} is close but not within 2 %.${tail}`;
}
export const fmt=(x:number,d=2)=>{const s=x.toFixed(d);return s.includes('.')?s.replace(/\.?0+$/,''):s;};

// ---------- how the player got there ----------
/** Per network: every distinct load measured on the hidden network (in order), COMPARE presses,
 *  how many distinct measurements had been taken when both carts first matched, and electrical
 *  answers checked. */
export interface NetRecord {measured:Load[];tries:number;matchedAfter?:number;elecTries:number;elecOk:boolean}
export const blankRecord=():NetRecord=>({measured:[],tries:0,elecTries:0,elecOk:false});
/** The two-measurement method: the open-port (shut valve) pressure plus exactly one more reading
 *  (the short-port flow or one wheel) is enough to fix both equivalents:
 *    open + short:  R = P_open / Q_short;
 *    open + wheel:  R = R_wheel · (P_open / P_wheel − 1).
 *  Anything beyond two readings is guesswork the method didn't need. */
export function twoMeasurement(measured:Load[]){return measured.length===2&&measured.includes('open');}
export function estimate(openP:number,other:{load:Load;r:Reading}){
  const R=other.load==='short'?openP/other.r.q:other.load==='open'?NaN:other.load*(openP/other.r.p-1);
  return {P:openP,R,Q:openP/R};
}
/** Grade for one network: 0 = not matched, 1 = works (both carts match), 2 = works reliably
 *  (matched within MAX_TRIES compares: measurement-led, not trial and error), 3 = elegant
 *  (first compare, found with the two-measurement method). */
export const MAX_TRIES=2;
export function tier(r:NetRecord):0|1|2|3{
  if(r.matchedAfter===undefined)return 0;
  if(r.tries>MAX_TRIES)return 1;
  return r.tries===1&&twoMeasurement(r.measured.slice(0,r.matchedAfter))?3:2;
}

// ---------- the electrical reveal ----------
/** The same network drawn in electronics. Scale (stated on the reveal): 1 kPa → 1 V,
 *  1 restriction unit → 100 Ω, 1 L/min → 10 mA (so V = I·R holds on both sides). */
export const SCALE={V:1,ohm:100,mA:10};
export interface Answer {v:number;r:number;mA:number}
export function electrical(net:Net):Answer{const t=thevenin(net);return {v:t.vth*SCALE.V,r:t.rth*SCALE.ohm,mA:t.iN*SCALE.mA};}
export function checkAnswer(net:Net,a:Answer){
  const want=electrical(net),problems:string[]=[];
  if(!close(a.v,want.v))problems.push(`V_th is the voltage across the open terminals (no load). Here it is not ${fmt(a.v)} V.`);
  if(!close(a.r,want.r))problems.push(`R_th is what the terminals look like with every source switched off (batteries shorted, current sources opened). ${fmt(a.r)} Ω isn't it.`);
  if(!close(a.mA,want.mA))problems.push(close(a.v,want.v)&&close(a.r,want.r)?`I_N = V_th / R_th = ${fmt(a.v)} V / ${fmt(a.r)} Ω = ${fmt(a.v/a.r*1000)} mA.`:`I_N is the current through a short across the terminals, and always equals V_th / R_th.`);
  return {ok:!problems.length,problems};
}

// ---------- dials ----------
export type Knob='pP'|'pR'|'fQ'|'fR'|'eV'|'eR'|'eI';
export const KNOBS:{[k in Knob]:{min:number;max:number;step:number;unit:string;label:string;start:number}}={
  pP:{min:0,max:40,step:.5,unit:'kPa',label:'PUMP',start:10},
  pR:{min:.5,max:20,step:.5,unit:'',label:'SERIES',start:5},
  fQ:{min:0,max:12,step:.25,unit:'L/min',label:'PUMP',start:2},
  fR:{min:.5,max:20,step:.5,unit:'',label:'BYPASS',start:5},
  eV:{min:0,max:40,step:.5,unit:'V',label:'V_th',start:10},
  eR:{min:25,max:2000,step:25,unit:'Ω',label:'R_th',start:500},
  eI:{min:0,max:150,step:2.5,unit:'mA',label:'I_N',start:20},
};
export function clampKnob(k:Knob,x:number){const s=KNOBS[k];return Math.min(s.max,Math.max(s.min,Math.round(x/s.step)*s.step));}
const onGrid=(k:Knob,x:number)=>Math.abs(clampKnob(k,x)-x)<1e-9;
/** The solver: the exact dial settings for both carts and the electrical answer. It also proves the
 *  settings sit on the dial grid (every network is solvable with the knobs as built). */
export function solution(net:Net){
  const t=thevenin(net),e=electrical(net);
  const carts:Carts={pP:t.vth,pR:t.rth,fQ:t.iN,fR:t.rth};
  const dials={...carts,eV:e.v,eR:e.r,eI:e.mA};
  const reachable=(Object.keys(dials) as Knob[]).every(k=>onGrid(k,dials[k as keyof typeof dials]));
  return {carts,answer:e,reachable};
}
/** Best process cost for one network: two hidden readings and one COMPARE. */
export const COST={reading:1,compare:2};
export const bestCost=()=>2*COST.reading+COST.compare;

// ---------- the three hidden networks ----------
// Drawings use a grid about 8 wide and 4 tall; port A leaves at the top right, B at the bottom
// right. Values are water units: kPa, L/min, and restriction units (kPa per L/min).
const R=(a:number,b:number,r:number,...path:Pt[]):Drawn=>({part:{kind:'R',a,b,r},path});
const V=(a:number,b:number,v:number,...path:Pt[]):Drawn=>({part:{kind:'V',a,b,v},path});
const I=(a:number,b:number,i:number,...path:Pt[]):Drawn=>({part:{kind:'I',a,b,i},path});
export const NETS:Net[]=[
  {id:'header',name:'Header tank',nodes:3,port:2,story:'A tank on the roof feeds the ports through a narrow main, with a drain leak across them.',
    // Pump 12 kPa — series 2 — node A — leak 6 to return.  V_th 9, R_th 1.5, I_N 6.
    parts:[V(1,0,12,[1,3],[1,0]),R(1,2,2,[1,3],[5,3]),R(2,0,6,[5,3],[5,0])],
    wires:[[[1,0],[5,0]],[[5,3],[8,3]],[[5,0],[8,0]]],ports:{a:[8,3],b:[8,0]}},
  {id:'twin',name:'Twin pumps',nodes:5,port:4,story:'Two pumps at different pressures push into one junction, then a long pipe to the ports.',
    // 18 kPa behind 3, 6 kPa behind 6, into a junction, then 2 in series.  V_th 14, R_th 4, I_N 3.5.
    parts:[V(1,0,18,[0,3],[0,0]),R(1,3,3,[0,3],[3,3]),V(2,0,6,[4.5,1.4],[4.5,0]),R(2,3,6,[4.5,1.4],[4.5,3]),R(3,4,2,[4.5,3],[7,3])],
    wires:[[[0,0],[8,0]],[[3,3],[4.5,3]],[[7,3],[8,3]]],ports:{a:[8,3],b:[8,0]}},
  {id:'booster',name:'Booster loop',nodes:5,port:4,story:'A fixed-flow booster, a leak, a mains pump and a long pipe, all hidden behind two ports.',
    // Flow 4 into N1 with a 5 leak, 3 to N2; 30 kPa behind 12 into N2; then 1.2 to A.  V_th 24, R_th 6, I_N 4.
    parts:[I(1,0,4,[0,3],[0,0]),R(1,0,5,[2.4,3],[2.4,0]),R(1,2,3,[2.4,3],[4.5,3]),V(3,0,30,[6,1.3],[6,0]),R(3,2,12,[6,1.3],[6,3]),R(2,4,1.2,[6,3],[7.6,3])],
    wires:[[[0,0],[8,0]],[[0,3],[2.4,3]],[[4.5,3],[6,3]],[[7.6,3],[8,3]]],ports:{a:[8,3],b:[8,0]}},
];
