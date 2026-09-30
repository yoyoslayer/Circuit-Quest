// Via service counter rules. A symmetric 4-layer board: L1 (top) · prepreg 0.1 mm · L2 · core 1.4 mm · L3 ·
// prepreg 0.1 mm · L4 (bottom), 1.6 mm finished. Limits below are this shop's fabrication profile,
// not universal constants; the game labels them that way.
export type Layer=1|2|3|4;
export type Drill='mech-0.30'|'mech-0.20'|'laser-0.10';
export type Finish='open'|'tented'|'plugged'|'filled-capped';
export type ViaKind='through'|'buried'|'micro'|'blind';
export const PADS=[.3,.45,.6] as const;
export const DRILLS:Drill[]=['mech-0.30','mech-0.20','laser-0.10'];
export const FINISHES:Finish[]=['open','tented','plugged','filled-capped'];
// Laser microvias register more precisely than mechanical drills, so the profile allows a smaller
// capture-pad ring for them.
export const PROFILE={minRing:.1,reliableRing:.125,microMinRing:.075,microReliableRing:.1,maxAspect:10,reliableAspect:8,laserAspect:1,name:'House profile B'};
const minRing=(d:Drill)=>isLaser(d)?PROFILE.microMinRing:PROFILE.minRing;
const reliableRing=(d:Drill)=>isLaser(d)?PROFILE.microReliableRing:PROFILE.reliableRing;
/** Depth (mm) between two layers in the finished board. */
const Z:Record<Layer,number>={1:0,2:.1,3:1.5,4:1.6};
export const depth=(a:Layer,b:Layer)=>+(Math.abs(Z[b]-Z[a])||0).toFixed(3);
export const drillSize=(d:Drill)=>Number(d.split('-')[1]);
export const isLaser=(d:Drill)=>d.startsWith('laser');

export interface Order {
  id:string;customer:string;from:Layer;to:Layer;
  /** The via sits inside a component pad, so solder must not wick into it. */
  inPad?:boolean;
  /** Fine-pitch part: the pad can be no bigger than this (mm). */
  maxPad?:number;
  /** Heatsink or shield above: no exposed via copper allowed. */
  covered?:boolean;
  /** Ground stitching: a row of this many identical vias tying the ground planes together. */
  stitch?:number;
  ask:string;
}
export interface Build {
  from?:Layer;to?:Layer;
  /** True once the stack is pressed together (laminated). */
  pressed:boolean;
  /** Whether the hole was drilled before the final press (sub-lamination) or after. */
  drilledPressed?:boolean;
  drill?:Drill;plated:boolean;
  /** Plated after the final press (a buried via's core can't be plated once sealed). */
  platedPressed?:boolean;
  pad?:number;finish?:Finish;count:number;
}
export const blank=():Build=>({pressed:false,plated:false,count:1});
export const kindOf=(from:Layer,to:Layer):ViaKind=>{const [a,b]=from<to?[from,to]:[to,from];
  if(a===1&&b===4)return 'through';if(a===2&&b===3)return 'buried';if(b-a===1)return 'micro';return 'blind';};
export const ring=(b:Build)=>b.pad!==undefined&&b.drill?+((b.pad-drillSize(b.drill))/2).toFixed(3):undefined;

export const COST={'mech-0.30':1,'mech-0.20':2,'laser-0.10':2,plate:1,press:0,open:0,tented:.5,plugged:1,'filled-capped':4} as const;
/** Process cost of one via (the row multiplies it). */
export function cost(b:Build){
  if(!b.drill)return 0;const each=COST[b.drill]+(b.plated?COST.plate:0)+(b.finish?COST[b.finish]:0);
  return +(each*Math.max(1,b.count)).toFixed(2);
}

export interface Verdict {tier:0|1|2|3;problems:string[];notes:string[];cost:number}
/** Physical and order checks only: what is wrong, and whether it works reliably. */
export function assess(order:Order,b:Build){
  const problems:string[]=[],notes:string[]=[];
  if(b.from===undefined||b.to===undefined||!b.drill){problems.push('Nothing drilled yet: pick the two layers to join, then drill.');return {problems,notes,reliable:false};}
  const [a,z]=b.from<b.to?[b.from,b.to]:[b.to,b.from],want=order.from<order.to?[order.from,order.to]:[order.to,order.from];
  const kind=kindOf(a,z),d=depth(a,z),size=drillSize(b.drill),aspect=+(d/size).toFixed(1);
  if(a!==want[0]||z!==want[1])problems.push(`The order joins L${want[0]}–L${want[1]}, but this via spans L${a}–L${z}.${z-a>want[1]-want[0]?' It also punches through layers where the customer has other nets.':''}`);
  if(!b.pressed)problems.push('The layers were never pressed together: press (laminate) the stack before it leaves the shop.');
  // How the hole was made has to be physically possible.
  if(isLaser(b.drill)){
    if(z-a!==1||kind==='buried')problems.push(`A laser only ablates one thin dielectric layer (about ${PROFILE.laserAspect}:1). It can't drill ${d} mm from L${a} to L${z}.`);
    else if(!b.drilledPressed)problems.push('Microvias are laser-drilled into the outer layer after pressing; this hole was drilled loose.');
  }else{
    if(kind==='micro')problems.push(`A mechanical bit can't stop in the ${d} mm layer between L${a} and L${z}. Microvias are laser-drilled.`);
    if(kind==='buried'&&b.drilledPressed)problems.push('L2–L3 are sealed inside the board once it is pressed. Buried vias are drilled and plated in the core before lamination.');
    if(kind==='through'&&!b.drilledPressed)problems.push(`A through via is drilled after the whole stack is pressed, or the holes in each layer won't line up.`);
    if(aspect>PROFILE.maxAspect)problems.push(`A ${size} mm hole through ${d} mm is ${aspect}:1. Plating can't coat a hole that deep and narrow; this shop's limit is ${PROFILE.maxAspect}:1.`);
  }
  if(!b.plated)problems.push('The barrel is bare glass-fibre. Without copper plating, nothing connects the layers.');
  else if(kind==='buried'&&b.platedPressed)problems.push(`The core was pressed before its hole was plated; the plating bath can't reach inside a sealed board.`);
  const r=ring(b);
  if(r===undefined)problems.push('No pad set: choose a pad size so the via has copper to land on.');
  else{
    if(r<minRing(b.drill))problems.push(`Annular ring ${r.toFixed(3)} mm is below ${PROFILE.name}'s ${minRing(b.drill)} mm minimum${isLaser(b.drill)?' for laser microvias':''}. Drill wander could break out of the pad.`);
    if(order.maxPad!==undefined&&b.pad!>order.maxPad)problems.push(`This fine-pitch part only has room for a ${order.maxPad} mm pad; ${b.pad} mm touches the neighbouring pins.`);
  }
  const finish=b.finish??'open';
  if(order.inPad&&finish!=='filled-capped')problems.push('Solder wicks down an open via in a pad. Via-in-pad needs the via filled and plated over (capped).');
  if(order.covered&&finish==='open')problems.push('Bare via copper under the heatsink or shield can short to it. Tent, plug or fill these vias.');
  if(order.stitch&&b.count<order.stitch)problems.push(`The order asks for ${order.stitch} stitching vias and this row has ${b.count}. Stitching is what the row does (ties the ground planes together), so it needs the full row.`);
  if(!order.stitch&&b.count>1)notes.push('Only one via was ordered; the extra copies cost drill time.');
  const reliable=!problems.length&&r!>=reliableRing(b.drill)&&(isLaser(b.drill)||aspect<=PROFILE.reliableAspect);
  if(!problems.length&&!reliable)notes.push(r!<reliableRing(b.drill)?`It works, but a ${r!.toFixed(3)} mm ring leaves little margin for drill wander.`:`It works, but ${aspect}:1 is near the plating limit; some barrels may come out thin.`);
  return {problems,notes,reliable};
}
/** Judges a finished sample against an order. tier 0 = rejected, 1 = works, 2 = works reliably,
 *  3 = reliable and no process it didn't need (cheapest reliable build). */
export function judge(order:Order,b:Build):Verdict{
  const {problems,notes,reliable}=assess(order,b),c=cost(b);
  if(problems.length)return {tier:0,problems,notes,cost:c};
  if(!reliable)return {tier:1,problems,notes,cost:c};
  const best=cheapest(order);if(!best||c<=best.cost+1e-6)return {tier:3,problems,notes,cost:c};
  notes.push(`Reliable. A leaner process exists (cost ${best.cost} vs ${c}): ${explainBest(best.build,b)}`);
  return {tier:2,problems,notes,cost:c};
}
function explainBest(best:Build,b:Build){
  if(b.finish!==best.finish)return `a ${best.finish} finish is enough here.`;
  if(b.drill!==best.drill)return `the ${best.drill?.replace('-',' ')} mm bit does this job.`;
  if(b.count!==best.count)return `${best.count} via${best.count>1?'s':''} will do.`;
  return 'try fewer process steps.';
}
/** Every build that passes an order, reliable and cheapest first (also proves each order is solvable). */
export function solutions(order:Order){
  const out:{build:Build;cost:number;reliable:boolean}[]=[];
  for(const drill of DRILLS)for(const pad of PADS)for(const finish of FINISHES)for(const drilledPressed of [false,true]){
    const build:Build={from:order.from,to:order.to,pressed:true,drilledPressed,drill,plated:true,pad,finish,count:order.stitch??1};
    const v=assess(order,build);if(!v.problems.length)out.push({build,cost:cost(build),reliable:v.reliable});}
  return out.sort((a,b)=>Number(b.reliable)-Number(a.reliable)||a.cost-b.cost);
}
const cheapestCache=new Map<string,{build:Build;cost:number}|undefined>();
export function cheapest(order:Order){
  if(!cheapestCache.has(order.id)){const best=solutions(order).find(s=>s.reliable);cheapestCache.set(order.id,best&&{build:best.build,cost:best.cost});}
  return cheapestCache.get(order.id);
}

/** The story shift: one new idea per customer (through → buried → micro → via-in-pad → stitching). */
export const SHIFT:Order[]=[
  {id:'lamp',customer:'Sato',from:1,to:4,ask:'Join the top layer to the bottom layer for a desk lamp.'},
  {id:'router',customer:'Mori',from:2,to:3,covered:true,ask:'Connect L2 to L3 only; both outer layers are packed with parts.'},
  {id:'bga',customer:'Aoki',from:1,to:2,maxPad:.3,ask:'Drop a fine-pitch BGA pin from L1 to L2. The pad must be 0.30 mm or smaller.'},
  {id:'qfn',customer:'Tanaka',from:1,to:4,inPad:true,ask:'Put a via inside the QFN\'s thermal pad so heat can sink to the bottom layer.'},
  {id:'stitch',customer:'Yamada',from:1,to:4,stitch:6,covered:true,ask:'Stitch the ground planes along the board edge with a row of 6 vias, under a metal shield.'},
];

/** Rush mode: endless orders mixed from the shift's ideas, seeded so a run can be replayed. */
const NAMES=['Sato','Mori','Aoki','Tanaka','Yamada','Ito','Kato','Saito','Nakamura','Kobayashi','Yoshida','Watanabe'];
export function rushOrder(rng:()=>number,n:number):Order{
  const pick=<V>(a:V[])=>a[Math.floor(rng()*a.length)],customer=pick(NAMES),id=`rush-${n}`;
  switch(pick(['through','through','buried','micro','pad','stitch'] as const)){
    case 'through':return rng()<.5?{id,customer,from:1,to:4,ask:'A plain through via, top to bottom.'}:{id,customer,from:1,to:4,covered:true,ask:'Top to bottom, under a metal shield.'};
    case 'buried':return {id,customer,from:2,to:3,covered:rng()<.5,ask:'L2 to L3 only; the outer layers are full.'};
    case 'micro':{const top=rng()<.5;return {id,customer,from:top?1:3,to:top?2:4,maxPad:.3,ask:`Fine-pitch part: L${top?1:3} to L${top?2:4}, pad no bigger than 0.30 mm.`};}
    case 'pad':return {id,customer,from:1,to:4,inPad:true,ask:'A via inside a thermal pad.'};
    case 'stitch':{const k=4+Math.floor(rng()*4);return {id,customer,from:1,to:4,stitch:k,covered:rng()<.5,ask:`Stitch the ground planes with a row of ${k} vias.`};}
  }
}
