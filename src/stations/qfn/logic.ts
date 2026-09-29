// QFN layout bench rules (Fabrication Bay). A board is a grid of routing cells; parts are
// footprints of pads that move and turn in 90° steps; traces are cell paths on a copper layer; a
// via joins the two layers at one cell. The checks are the real ones a layout review makes, at the
// level the game teaches:
// - connectivity: every pad of a net is joined by copper (a breadth-first search over the copper);
// - spacing: two nets never share a cell on a layer; nothing is routed under the QFN body on the top
//   layer; a via's pad is wider than a track, so it may not sit beside another net's pad;
// - orientation: a connector sits on a board edge with its mouth facing off the board;
// - reliability: a bypass capacitor only helps if the current loop from its pads to the chip's
//   supply and ground pins is short (a capacitor "somewhere on the net" is not decoupling), and a
//   hot QFN's exposed pad needs vias to carry heat into the other copper layer;
// - elegance: total track length plus vias at or under the reference route (par).
// Guardrail: this is a teaching grid. Real layouts must pass the fab house's DRC and an electrical
// review; cell sizes, loop limits and via counts here are this bench's rules, not universal values.
export type XY=[number,number];
export type Rot=0|1|2|3;
export type Layer=1|2;
/** A via costs as much as two cells of track (drilling and plating). */
export const VIA_COST=2;
export const cellKey=(c:XY)=>`${c[0]},${c[1]}`;
export const same=(a:XY,b:XY)=>a[0]===b[0]&&a[1]===b[1];
/** Quarter turns clockwise on screen (x right, y toward the player). */
export function turn(c:XY,r:Rot):XY{let [x,y]=c;for(let i=0;i<r;i++)[x,y]=[-y,x];return [x+0,y+0];}
const add=(a:XY,b:XY):XY=>[a[0]+b[0],a[1]+b[1]];
const adjacent=(a:XY,b:XY)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1;
const N4:XY[]=[[1,0],[-1,0],[0,1],[0,-1]];

export type PartKind='qfn'|'res'|'cap'|'conn';
export interface PinDef {id:string;label:string;cells:XY[]}
export interface PartDef {
  id:string;kind:PartKind;value:string;pins:PinDef[];
  /** Cells the package body covers with no pad (kept free of top-layer copper). */
  body:XY[];
  /** Connector mouth (local): the side the cable plugs into. */
  mouth?:XY;
  /** Through-hole pads exist on both copper layers. */
  through?:boolean;
  /** Fixed by the enclosure (can't be moved or turned). */
  locked?:boolean;
}
export interface Place {at:XY;rot:Rot}
export interface Trace {layer:Layer;net:string;cells:XY[]}
export interface Via {at:XY;net:string}
export interface Design {place:Record<string,Place>;traces:Trace[];vias:Via[]}
export interface Board {
  id:string;title:string;ask:string;teach:string;w:number;h:number;layers:1|2;
  parts:PartDef[];start:Record<string,Place>;nets:Record<string,string[]>;
  /** Supply pin pairs [supply, ground] that each need their own bypass cap within `max` cells of loop. */
  decouple?:{caps:string[];pairs:[string,string][];max:number};
  /** The exposed pad that needs at least `vias` thermal vias. */
  thermal?:{pin:string;vias:number};
  /** Elegance target: track cells + VIA_COST × vias of the reference route. */
  par:number;
}

// ---------- the part library ----------
/** 12-pin QFN, 5×5 cells: three pins per side, numbered counter-clockwise from pin 1 (top of the
 *  left side), and a 3×3 exposed pad (EP) underneath. Pins not named are NC. */
const QFN_PINS:Record<number,XY>={1:[-2,-1],2:[-2,0],3:[-2,1],4:[-1,2],5:[0,2],6:[1,2],7:[2,1],8:[2,0],9:[2,-1],10:[1,-2],11:[0,-2],12:[-1,-2]};
export const EP_CELLS:XY[]=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)EP_CELLS.push([x,y]);
function qfn(id:string,value:string,labels:Record<number,string>,ep:string):PartDef{
  const pins:PinDef[]=Object.entries(QFN_PINS).map(([n,c])=>({id:n,label:labels[+n]??'NC',cells:[c]}));
  pins.push({id:'EP',label:ep,cells:EP_CELLS});
  return {id,kind:'qfn',value,pins,body:[[-2,-2],[2,-2],[-2,2],[2,2]],locked:true};
}
/** 0402-style two-pad part: pad 1 at the pivot, pad 2 one cell to the right (unturned). */
const twoPin=(id:string,kind:'res'|'cap',value:string,a:string,b:string):PartDef=>({id,kind,value,pins:[{id:'1',label:a,cells:[[0,0]]},{id:'2',label:b,cells:[[1,0]]}],body:[]});
/** Through-hole header: pins in a column, mouth facing left (unturned); pivot on the middle pin. */
function conn(id:string,value:string,labels:string[],locked=false):PartDef{
  const mid=Math.floor((labels.length-1)/2);
  return {id,kind:'conn',value,pins:labels.map((l,i)=>({id:String(i+1),label:l,cells:[[0,i-mid]]})),body:[],mouth:[-1,0],through:true,locked};
}

// ---------- the three boards ----------
const W=13,H=9,CHIP:XY=[6,4];
export const BOARDS:Board[]=[
  {id:'sensor',title:'Sensor breakout',w:W,h:H,layers:1,par:22,
    ask:'One copper layer: tracks can\'t cross. Place J1, R1 and C1 so every net routes.',
    teach:'Placement comes before routing: the order of the pins around the chip decides where the connector can go.',
    parts:[qfn('U1','temp sensor',{1:'VDD',2:'GND',9:'OUT'},'NC'),conn('J1','3-pin header',['VDD','GND','SIG']),twoPin('R1','res','100 Ω','OUT','SIG'),twoPin('C1','cap','100 nF','VDD','GND')],
    start:{U1:{at:CHIP,rot:0},J1:{at:[10,1],rot:1},R1:{at:[1,1],rot:1},C1:{at:[10,7],rot:0}},
    nets:{VDD:['U1.1','C1.1','J1.1'],GND:['U1.2','C1.2','J1.2'],OUT:['U1.9','R1.1'],SIG:['R1.2','J1.3']},
    decouple:{caps:['C1'],pairs:[['U1.1','U1.2']],max:4}},
  {id:'mcu',title:'Decoupling',w:W,h:H,layers:1,par:35,
    ask:'This chip has two supply pin pairs. Each needs its own 100 nF cap hugging its VDD and GND pins.',
    teach:'A bypass cap supplies brief bursts of current. It only helps when the loop through its pads and the chip\'s pins is short.',
    parts:[qfn('U1','microcontroller',{1:'VDD',2:'GND',7:'GND',8:'VDD',10:'RST'},'NC'),conn('J1','2-pin power',['VDD','GND']),twoPin('C1','cap','100 nF','VDD','GND'),twoPin('C2','cap','100 nF','VDD','GND'),twoPin('R1','res','10 kΩ','VDD','RST')],
    start:{U1:{at:CHIP,rot:0},J1:{at:[11,6],rot:0},C1:{at:[0,0],rot:0},C2:{at:[11,0],rot:0},R1:{at:[1,7],rot:0}},
    nets:{VDD:['U1.1','U1.8','C1.1','C2.1','R1.1','J1.1'],GND:['U1.2','U1.7','C1.2','C2.2','J1.2'],RST:['U1.10','R1.2']},
    decouple:{caps:['C1','C2'],pairs:[['U1.1','U1.2'],['U1.8','U1.7']],max:4}},
  {id:'driver',title:'Two layers',w:W,h:H,layers:2,par:42,
    ask:'The power passes through to a flipped connector, so VIN and GND must cross. Use layer 2 and vias, and cool the exposed pad.',
    teach:'A via lets a track change layer, so a crossing on one layer becomes a route. Thermal vias carry the chip\'s heat into the other copper.',
    parts:[qfn('U1','LED driver',{1:'VIN',2:'GND',9:'ISET'},'GND'),conn('J1','power in',['VIN','GND'],true),conn('J2','power out',['VIN','GND'],true),twoPin('C1','cap','1 µF','VIN','GND'),twoPin('R1','res','2 kΩ','ISET','GND')],
    start:{U1:{at:CHIP,rot:0},J1:{at:[0,3],rot:0},J2:{at:[12,4],rot:2},C1:{at:[5,8],rot:0},R1:{at:[1,0],rot:0}},
    nets:{VIN:['J1.1','J2.1','U1.1','C1.1'],GND:['J1.2','J2.2','U1.2','U1.EP','C1.2','R1.2'],ISET:['U1.9','R1.1']},
    decouple:{caps:['C1'],pairs:[['U1.1','U1.2']],max:4},thermal:{pin:'U1.EP',vias:4}},
];

// ---------- geometry ----------
export const partOf=(b:Board,id:string)=>b.parts.find(p=>p.id===id)!;
/** World cells of each pin of a part at a placement. */
export function pinCells(p:PartDef,at:Place):{pin:PinDef;cells:XY[]}[]{return p.pins.map(pin=>({pin,cells:pin.cells.map(c=>add(at.at,turn(c,at.rot)))}));}
export function footprint(p:PartDef,at:Place):XY[]{return [...pinCells(p,at).flatMap(q=>q.cells),...p.body.map(c=>add(at.at,turn(c,at.rot)))];}
export const inBoard=(b:Board,c:XY)=>c[0]>=0&&c[1]>=0&&c[0]<b.w&&c[1]<b.h;
/** Net of a pin reference ("U1.3"); unused pins get a private NC net nothing may join. */
export function netOfPin(b:Board,ref:string){for(const [n,refs] of Object.entries(b.nets))if(refs.includes(ref))return n;return `NC:${ref}`;}
export const isNC=(net:string)=>net.startsWith('NC:');
export function mouthOf(p:PartDef,at:Place):XY|undefined{return p.mouth&&turn(p.mouth,at.rot);}
export const blank=(b:Board):Design=>({place:structuredClone(b.start),traces:[],vias:[]});

interface Cu {net:string;what:'pad'|'trace'|'via'|'body';ref:string}
/** Who holds copper (or a package body) on each cell of each layer. */
export function occupancy(b:Board,d:Design){
  const L:Record<Layer,Map<string,Cu[]>>={1:new Map(),2:new Map()};
  const put=(l:Layer,c:XY,cu:Cu)=>{const k=cellKey(c),a=L[l].get(k);if(a){if(!a.some(x=>x.net===cu.net&&x.what===cu.what&&x.ref===cu.ref))a.push(cu);}else L[l].set(k,[cu]);};
  for(const p of b.parts){const at=d.place[p.id];
    for(const {pin,cells} of pinCells(p,at))for(const c of cells){const ref=`${p.id}.${pin.id}`,net=netOfPin(b,ref);put(1,c,{net,what:'pad',ref});if(p.through&&b.layers===2)put(2,c,{net,what:'pad',ref});}
    for(const c of p.body.map(c=>add(at.at,turn(c,at.rot))))put(1,c,{net:`BODY:${p.id}`,what:'body',ref:p.id});}
  d.traces.forEach((t,i)=>t.cells.forEach(c=>put(t.layer,c,{net:t.net,what:'trace',ref:`T${i}`})));
  d.vias.forEach((v,i)=>{put(1,v.at,{net:v.net,what:'via',ref:`V${i}`});put(2,v.at,{net:v.net,what:'via',ref:`V${i}`});});
  return L;
}
/** The net whose copper is on a cell (undefined when bare; NC and body cells count as blocked). */
export function netAt(b:Board,d:Design,l:Layer,c:XY):string|undefined{return occupancy(b,d)[l].get(cellKey(c))?.[0]?.net;}

// ---------- editing (what the tools may do) ----------
const layerOk=(b:Board,l:Layer)=>l<=b.layers;
/** Why a part can't go to a placement (undefined when it can). */
export function placeProblem(b:Board,d:Design,id:string,at:Place):string|undefined{
  const p=partOf(b,id);if(p.locked)return `${id} is fixed by the enclosure; it can't move.`;
  const cells=footprint(p,at);
  if(cells.some(c=>!inBoard(b,c)))return `${id} would hang off the board.`;
  const mine=new Set(cells.map(cellKey));
  for(const q of b.parts){if(q.id===id)continue;if(footprint(q,d.place[q.id]).some(c=>mine.has(cellKey(c))))return `${id} would sit on ${q.id}. Parts can't overlap.`;}
  const occ=occupancy(b,{...d,place:{...d.place,[id]:at}});
  for(const {pin,cells:pc} of pinCells(p,at)){const net=netOfPin(b,`${id}.${pin.id}`);
    for(const c of pc)for(const l of (p.through&&b.layers===2?[1,2]:[1]) as Layer[]){const other=occ[l].get(cellKey(c))?.find(x=>x.what!=='pad'&&x.net!==net);
      if(other)return `${id}'s ${pin.label} pad would land on ${other.net} copper and short them.`;}}
  return undefined;
}
/** A new track starts on copper of the net it will carry: a pad, a track end or a via. */
export function strokeNet(b:Board,d:Design,l:Layer,c:XY):{net?:string;why?:string}{
  if(!layerOk(b,l))return {why:'This board has one copper layer. Layer 2 unlocks on board 3.'};
  if(!inBoard(b,c))return {why:'That is off the board.'};
  const here=occupancy(b,d)[l].get(cellKey(c));
  if(!here)return {why:l===2?'Start a layer 2 track on a via or a connector pin (they reach both layers).':'Start a track on a pad or on copper of the net you want to extend.'};
  const cu=here[0];if(cu.what==='body')return {why:'That is the chip body. Start on one of its pins.'};
  if(isNC(cu.net))return {why:'That pin is not connected (NC). Nothing should join it.'};
  return {net:cu.net};
}
/** Whether a track of `net` may enter cell c on layer l. */
export function stepProblem(b:Board,d:Design,l:Layer,net:string,c:XY):string|undefined{
  if(!inBoard(b,c))return 'Tracks stay on the board.';
  const here=occupancy(b,d)[l].get(cellKey(c));if(!here)return undefined;
  const cu=here.find(x=>x.net!==net);if(!cu)return undefined;
  if(cu.what==='body')return 'No top-layer copper under the QFN body: only its own pads are there.'+(b.layers===2?' Layer 2 can pass under it.':'');
  if(isNC(cu.net))return `That is ${cu.ref.replace('.',' pin ')} (NC). Copper there would join it to ${net}.`;
  return `That cell is ${cu.net} copper. Joining it would short ${net} to ${cu.net}.`+(b.layers===1?' On one layer, go around.':' Change layer with a via to cross.');
}
export function traceProblem(b:Board,d:Design,t:Trace):string|undefined{
  if(!layerOk(b,t.layer))return strokeNet(b,d,t.layer,t.cells[0]).why;
  if(t.cells.length<2)return 'Drag across at least two cells to lay a track.';
  const s=strokeNet(b,d,t.layer,t.cells[0]);if(s.why)return s.why;if(s.net!==t.net)return `The track starts on ${s.net} copper, not ${t.net}.`;
  for(let i=1;i<t.cells.length;i++){if(!adjacent(t.cells[i-1],t.cells[i]))return 'Tracks run cell to cell, straight or at right angles.';
    const p=stepProblem(b,d,t.layer,t.net,t.cells[i]);if(p)return p;}
  return undefined;
}
export function viaProblem(b:Board,d:Design,c:XY):{net?:string;why?:string}{
  if(b.layers<2)return {why:'Vias need a second copper layer. It unlocks on board 3.'};
  if(!inBoard(b,c))return {why:'That is off the board.'};
  const occ=occupancy(b,d),k=cellKey(c),top=occ[1].get(k),bottom=occ[2].get(k);
  if(d.vias.some(v=>same(v.at,c)))return {why:'There is already a via here.'};
  const cu=(top??bottom)?.[0];
  if(!cu)return {why:'Put a via on a track (or the exposed pad) of the net that changes layer.'};
  if(cu.what==='body')return {why:'That is the chip body.'};
  if(isNC(cu.net))return {why:'That pin is NC; it needs no via.'};
  if(cu.what==='pad'){const p=partOf(b,cu.ref.split('.')[0]);
    if(p.through)return {why:'Connector pins are already plated holes that reach both layers.'};
    if(!b.thermal||cu.ref!==b.thermal.pin)return {why:'No via inside a small pad: solder would wick down it. Put the via one cell along the track.'};}
  for(const x of [...(top??[]),...(bottom??[])])if(x.net!==cu.net)return {why:`${x.net} copper is on the other layer here. A via would short it to ${cu.net}.`};
  return {net:cu.net};
}
/** Cuts copper at a cell on one layer (a via there goes too). Tracks split around the cut. */
export function erase(d:Design,l:Layer,c:XY):boolean{
  const vias=d.vias.filter(v=>!same(v.at,c));let hit=vias.length!==d.vias.length;
  const traces:Trace[]=[];
  for(const t of d.traces){if(t.layer!==l||!t.cells.some(x=>same(x,c))){traces.push(t);continue;}hit=true;
    let run:XY[]=[];for(const x of t.cells){if(same(x,c)){if(run.length>1)traces.push({...t,cells:run});run=[];}else run.push(x);}if(run.length>1)traces.push({...t,cells:run});}
  d.vias=vias;d.traces=traces;return hit;
}

// ---------- checking ----------
type Node=string;const node=(l:Layer,c:XY):Node=>`${l}|${cellKey(c)}`;
/** Copper graph: track segments and vias weigh 1 cell of loop, a pad's own cells weigh 0. */
function graph(b:Board,d:Design){
  const g=new Map<Node,Map<Node,number>>(),link=(a:Node,z:Node,w:number)=>{if(!g.has(a))g.set(a,new Map());if(!g.has(z))g.set(z,new Map());const o=g.get(a)!.get(z);if(o===undefined||w<o){g.get(a)!.set(z,w);g.get(z)!.set(a,w);}};
  for(const p of b.parts)for(const {cells} of pinCells(p,d.place[p.id])){
    const layers:Layer[]=p.through&&b.layers===2?[1,2]:[1];
    for(const l of layers)cells.forEach((c,i)=>{g.has(node(l,c))||g.set(node(l,c),new Map());for(const e of cells.slice(i+1))if(adjacent(c,e))link(node(l,c),node(l,e),0);});
    if(layers.length===2)for(const c of cells)link(node(1,c),node(2,c),0);}
  for(const t of d.traces)for(let i=1;i<t.cells.length;i++)link(node(t.layer,t.cells[i-1]),node(t.layer,t.cells[i]),1);
  for(const v of d.vias)link(node(1,v.at),node(2,v.at),1);
  return g;
}
function components(g:Map<Node,Map<Node,number>>){
  const comp=new Map<Node,number>();let n=0;
  for(const s of g.keys()){if(comp.has(s))continue;const q=[s];comp.set(s,n);while(q.length){const a=q.pop()!;for(const z of g.get(a)!.keys())if(!comp.has(z)){comp.set(z,n);q.push(z);}}n++;}
  return comp;
}
/** Shortest copper path (in cells) between two node sets (0-1 weights), or Infinity. */
function pathLength(g:Map<Node,Map<Node,number>>,from:Node[],to:Node[]){
  const goal=new Set(to),dist=new Map<Node,number>(),dq:Node[]=[];for(const f of from){dist.set(f,0);dq.push(f);}
  while(dq.length){let bi=0;for(let i=1;i<dq.length;i++)if(dist.get(dq[i])!<dist.get(dq[bi])!)bi=i;const a=dq.splice(bi,1)[0],da=dist.get(a)!;
    if(goal.has(a))return da;for(const [z,w] of g.get(a)??[]){const nd=da+w;if(nd<(dist.get(z)??Infinity)){dist.set(z,nd);dq.push(z);}}}
  return Infinity;
}
const pinNodes=(b:Board,d:Design,ref:string):Node[]=>{const [pid,pin]=ref.split('.'),p=partOf(b,pid);const cells=pinCells(p,d.place[pid]).find(x=>x.pin.id===pin)!.cells;return cells.map(c=>node(1,c));};
export const length=(d:Design)=>d.traces.reduce((n,t)=>n+t.cells.length-1,0);
export const cost=(d:Design)=>length(d)+VIA_COST*d.vias.length;

export interface NetState {net:string;pads:number;joined:number;done:boolean}
export interface Loop {pair:[string,string];cap?:string;loop:number;max:number}
export interface Report {
  /** 0 = does not work, 1 = works, 2 = works reliably, 3 = reliable and at or under par. */
  tier:0|1|2|3;problems:string[];notes:string[];nets:NetState[];loops:Loop[];
  thermal?:{vias:number;need:number};length:number;vias:number;cost:number;par:number;
}
export function check(b:Board,d:Design):Report{
  const problems:string[]=[],notes:string[]=[];
  // Placement and orientation.
  for(const p of b.parts){const at=d.place[p.id],cells=footprint(p,at);
    if(cells.some(c=>!inBoard(b,c)))problems.push(`${p.id} hangs off the board.`);
    const m=mouthOf(p,at);if(m&&!pinCells(p,at).every(({cells})=>cells.every(c=>!inBoard(b,add(c,m)))))
      problems.push(`${p.id} must sit on a board edge with its mouth facing out, or the cable can't plug in.`);}
  for(let i=0;i<b.parts.length;i++)for(let j=i+1;j<b.parts.length;j++){const a=new Set(footprint(b.parts[i],d.place[b.parts[i].id]).map(cellKey));
    if(footprint(b.parts[j],d.place[b.parts[j].id]).some(c=>a.has(cellKey(c))))problems.push(`${b.parts[i].id} and ${b.parts[j].id} overlap.`);}
  // Spacing: shorts, copper under the package body, via-to-pad clearance.
  const occ=occupancy(b,d),shorts=new Set<string>();
  for(const l of [1,2] as Layer[])for(const [k,list] of occ[l]){const nets=[...new Set(list.map(x=>x.net))];if(nets.length<2)continue;
    if(list.some(x=>x.what==='body'))problems.push(`Copper under ${list.find(x=>x.what==='body')!.ref}'s body at ${k} (layer ${l}).`);
    else{const s=nets.filter(n=>!n.startsWith('BODY')).map(n=>isNC(n)?`${n.slice(3)} (NC)`:n).sort().join(' and ');if(!shorts.has(s)){shorts.add(s);problems.push(`Short: ${s} touch at cell ${k} on layer ${l}.`);}}}
  for(const v of d.vias){const inOwnPad=occ[1].get(cellKey(v.at))?.some(x=>x.what==='pad'&&x.net===v.net&&x.ref===b.thermal?.pin);if(inOwnPad)continue;
    for(const n of N4){const c=add(v.at,n),near=occ[1].get(cellKey(c))?.find(x=>x.what==='pad'&&x.net!==v.net);
      if(near){problems.push(`Via at ${cellKey(v.at)} is too close to ${near.ref}'s pad: a via's ring is wider than a track. Move it a cell away.`);break;}}}
  // Connectivity per net.
  const g=graph(b,d),comp=components(g),nets:NetState[]=[];
  for(const [net,refs] of Object.entries(b.nets)){const ids=refs.map(r=>comp.get(pinNodes(b,d,r)[0])!);const counts=new Map<number,number>();ids.forEach(i=>counts.set(i,(counts.get(i)??0)+1));
    const joined=Math.max(...counts.values());nets.push({net,pads:refs.length,joined,done:joined===refs.length});
    if(joined<refs.length)problems.push(`${net} is not connected: ${counts.size} separate pieces (${joined} of ${refs.length} pads joined).`);}
  // Reliability: decoupling loops, thermal vias.
  const loops:Loop[]=[];let reliable=true;
  if(b.decouple){const {caps,pairs,max}=b.decouple;
    const loopOf=(cap:string,[s,gnd]:[string,string])=>pathLength(g,pinNodes(b,d,`${cap}.1`),pinNodes(b,d,s))+pathLength(g,pinNodes(b,d,`${cap}.2`),pinNodes(b,d,gnd));
    // Each pair gets its own cap; try every assignment and keep the one with the shortest worst loop.
    let best:{caps:string[];score:number}|undefined;
    for(const perm of permutations(caps,pairs.length)){const ls=pairs.map((p,i)=>loopOf(perm[i],p));const score=Math.max(...ls)*100+ls.reduce((a,z)=>a+z,0);if(!best||score<best.score)best={caps:perm,score};}
    pairs.forEach((p,i)=>{const cap=best?.caps[i],loop=cap?loopOf(cap,p):Infinity;loops.push({pair:p,cap,loop,max});
      if(loop>max){reliable=false;const [sp,gp]=p.map(r=>`${r.split('.')[0]} pin ${r.split('.')[1]}`);
        notes.push(loop===Infinity?`No bypass cap is wired to ${sp} and ${gp}.`:`${cap}'s loop to ${sp}/${gp} is ${loop} cells (≤ ${max} wanted). A far cap can't supply the chip's fast current bursts: move it beside those pins.`);}});}
  let thermal:Report['thermal'];
  if(b.thermal){const [pid,pin]=b.thermal.pin.split('.'),p=partOf(b,pid),pad=new Set(pinCells(p,d.place[pid]).find(x=>x.pin.id===pin)!.cells.map(cellKey));
    const n=d.vias.filter(v=>pad.has(cellKey(v.at))).length;thermal={vias:n,need:b.thermal.vias};
    if(n<b.thermal.vias){reliable=false;notes.push(`The exposed pad has ${n} thermal via${n===1?'':'s'}; it needs ${b.thermal.vias} to carry the chip's heat into layer 2. Without them it runs hot.`);}}
  const len=length(d),c=cost(d);
  let tier:Report['tier']=problems.length?0:reliable?2:1;
  if(tier===2&&c<=b.par)tier=3;
  if(tier===2)notes.push(`Track + vias cost ${c}; par is ${b.par}. Shorter routes and fewer vias are cheaper to make.`);
  return {tier,problems,notes,nets,loops,thermal,length:len,vias:d.vias.length,cost:c,par:b.par};
}
function permutations<T>(items:T[],k:number):T[][]{if(k===0)return [[]];const out:T[][]=[];items.forEach((x,i)=>{for(const rest of permutations([...items.slice(0,i),...items.slice(i+1)],k-1))out.push([x,...rest]);});return out;}

/** Unrouted connections (ratsnest): per net, the shortest links that would join its copper islands. */
export function ratsnest(b:Board,d:Design):{net:string;a:XY;b:XY}[]{
  const g=graph(b,d),comp=components(g),out:{net:string;a:XY;b:XY}[]=[];
  const parse=(n:Node):XY=>n.split('|')[1].split(',').map(Number) as XY;
  for(const [net,refs] of Object.entries(b.nets)){
    // Islands: every node of each component that holds one of this net's pads.
    const islands=new Map<number,XY[]>();
    for(const r of refs){const id=comp.get(pinNodes(b,d,r)[0])!;if(!islands.has(id))islands.set(id,[]);}
    for(const [n,id] of comp)if(islands.has(id))islands.get(id)!.push(parse(n));
    const groups=[...islands.values()];if(groups.length<2)continue;
    // Prim's tree over islands with Manhattan distance between their nearest cells.
    const inTree=[0],rest=groups.map((_,i)=>i).slice(1);
    while(rest.length){let best:{i:number;a:XY;b:XY;d:number}|undefined;
      for(const i of rest)for(const t of inTree)for(const a of groups[t])for(const z of groups[i]){const dd=Math.abs(a[0]-z[0])+Math.abs(a[1]-z[1]);if(!best||dd<best.d)best={i,a,b:z,d:dd};}
      out.push({net,a:best!.a,b:best!.b});inTree.push(best!.i);rest.splice(rest.indexOf(best!.i),1);}
  }
  return out;
}

// ---------- reference routes (the explicit solutions that set each board's par) ----------
const run=(layer:Layer,net:string,...pts:XY[]):Trace=>{const cells:XY[]=[pts[0]];for(let i=1;i<pts.length;i++){const [x0,y0]=pts[i-1],[x1,y1]=pts[i];let x=x0,y=y0;while(x!==x1||y!==y1){if(x!==x1)x+=Math.sign(x1-x);else y+=Math.sign(y1-y);cells.push([x,y]);}}return {layer,net,cells};};
/** Hand-routed designs, checked by the unit tests: each is reliable and costs exactly par. */
export const REFERENCE:Record<string,Design>={
  sensor:{place:{U1:{at:CHIP,rot:0},J1:{at:[3,8],rot:3},C1:{at:[2,4],rot:0},R1:{at:[9,3],rot:1}},
    traces:[run(1,'VDD',[4,3],[2,3],[2,8]),run(1,'GND',[4,4],[3,4],[3,8]),run(1,'OUT',[8,3],[9,3]),run(1,'SIG',[9,4],[9,7],[4,7],[4,8])],vias:[]},
  mcu:{place:{U1:{at:CHIP,rot:0},J1:{at:[0,3],rot:0},C1:{at:[2,3],rot:1},C2:{at:[9,4],rot:1},R1:{at:[7,0],rot:1}},
    traces:[run(1,'VDD',[4,3],[0,3]),run(1,'GND',[4,4],[0,4]),run(1,'VDD',[3,3],[3,0],[9,0],[9,4],[8,4]),run(1,'GND',[3,4],[3,7],[9,7],[9,5],[8,5]),run(1,'RST',[7,1],[7,2])],vias:[]},
  driver:{place:{U1:{at:CHIP,rot:0},J1:{at:[0,3],rot:0},J2:{at:[12,4],rot:2},C1:{at:[2,3],rot:1},R1:{at:[9,3],rot:3}},
    traces:[run(1,'VIN',[4,3],[0,3]),run(1,'GND',[4,4],[0,4]),run(1,'GND',[4,4],[5,4]),run(1,'VIN',[3,3],[3,1],[11,1],[11,4],[12,4]),
      run(2,'GND',[7,4],[10,4],[10,3],[12,3]),run(1,'ISET',[8,3],[9,3]),run(1,'GND',[9,2],[10,2]),run(2,'GND',[10,2],[10,3])],
    vias:[[7,4],[6,4],[6,3],[6,5],[10,2]].map(at=>({at:at as XY,net:'GND'}))},
};
