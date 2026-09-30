// The Waterworks test bench (Thevenin and Norton, met as water first). A network of pipes and
// pumps hides behind frosted glass with only two ports. Pip fits loads to the ports (a shut valve,
// a bypass hose, three water wheels), reads pressure and flow, and tunes two carts until each
// behaves the same at the ports: the pressure cart (pump + series restriction) and the flow cart
// (fixed-flow pump + bypass). COMPARE runs all three wheels on the network and both carts. When
// both match, the glass clears on the same network drawn as a circuit, and Pip names V_th, R_th
// and I_N in volts, ohms and milliamps. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressWaterworks} from './room';
import {toon,box,rbox,cyl,sphere,part,group,canvasTex,INK,DMETAL} from '../../render/kit';
import {hot} from '../../render/actors';
import {NETS,KNOBS,WHEELS,SCALE,COST,blankRecord,bestCost,clampKnob,compare,checkAnswer,readDevice,solveWith,tier,fmt,
  type Carts,type Comparison,type Device,type Knob,type Load,type Net,type NetRecord,type Pt,type Reading} from './logic';
import './waterworks.css';
import {cheer,walkHint} from '../shared';

const BRASS='#d9a441',COPPER='#c9773f',NAVY='#2c3e66',AQUA='#43b8c4',CREAM='#fbf3e2',WATER='#5fd0e0';
/** The bench sits a little left of the camera's centre (the order panel is on the right). */
const OX=-.45;
/** The glass case leans back (tilt, radians from vertical) to face the bench camera; its drawing
 *  grid (8 × 3 units) maps onto the board inside it. Carts' control decks lean back by DECK. */
const CASE={x:-.34,z:.02,w:1.9,h:1.1,depth:.16,tilt:.8};
const DECK=1.0,PORTS={x:1.16,z:-.1};
const grid=(p:Pt)=>new T.Vector3(-.8+p[0]*.2,.15+p[1]*.25,.07);
const LOAD_NAMES:{[k:string]:string}={open:'Shut valve',short:'Bypass hose',2:'Wheel 2',6:'Wheel 6',12:'Wheel 12'};
const loadName=(l?:Load)=>l===undefined?'nothing fitted':LOAD_NAMES[String(l)];
const KNOB_NAMES:{[k in Knob]:string}={pP:'the pressure cart\'s pump pressure',pR:'the pressure cart\'s series restriction',fQ:'the flow cart\'s pump flow',fR:'the flow cart\'s bypass restriction',eV:'V_th (volts)',eR:'R_th (ohms)',eI:'I_N (milliamps)'};
const LOAD_HINTS:{[k:string]:string}={open:'Shut valve: closes the ports, so the gauge reads the open-port pressure',short:'Bypass hose: joins A to B, so the meter reads the short-port flow',2:'Wheel 2: a light load (restriction 2)',6:'Wheel 6: a medium load (restriction 6)',12:'Wheel 12: a heavy load (restriction 12)'};
const DEVICE_NAMES:{[d in Device]:string}={net:'Hidden network',pcart:'Pressure cart',fcart:'Flow cart'};
const UP=new T.Vector3(0,1,0);

// ---------- canvas helpers ----------
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
/** Label plate texture; the type shrinks until the words fit. */
function label(text:string,bg=CREAM,fg=INK,w=256,h=80){
  return canvasTex(w,h,c=>{drawPlate(c,text,bg,fg,w,h);});
}
/** V_th, R_th and I_N as written in the rules become a letter with a small lowered subscript. */
const SUB=/([VRI])_(th|N)/g;
function runs(text:string){const out:{t:string;sub:boolean}[]=[];let at=0;for(const m of text.matchAll(SUB)){out.push({t:text.slice(at,m.index)+m[1],sub:false},{t:m[2],sub:true});at=m.index!+m[0].length;}out.push({t:text.slice(at),sub:false});return out;}
function richWidth(c:CanvasRenderingContext2D,text:string,size:number){return runs(text).reduce((n,r)=>{c.font=FONT(r.sub?Math.round(size*.62):size);return n+c.measureText(r.t).width;},0);}
/** Draws centred text, subscripts included. */
function richText(c:CanvasRenderingContext2D,text:string,cx:number,cy:number,size:number){
  let x=cx-richWidth(c,text,size)/2;c.textAlign='left';c.textBaseline='middle';
  for(const r of runs(text)){const n=r.sub?Math.round(size*.62):size;c.font=FONT(n);c.fillText(r.t,x,cy+(r.sub?size*.28:0));x+=c.measureText(r.t).width;}
}
/** HTML for panels, toasts and prompts: escaped, with V<sub>th</sub>, R<sub>th</sub>, I<sub>N</sub>. */
const html=(text:string)=>text.replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]!)).replace(SUB,'$1<sub>$2</sub>');
function drawPlate(c:CanvasRenderingContext2D,text:string,bg:string,fg:string,w:number,h:number){
  c.clearRect(0,0,w,h);c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(18,h*.25));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
  let size=Math.round(h*.5);while(size>10&&richWidth(c,text,size)>w-30)size--;
  c.fillStyle=fg;richText(c,text,w/2,h/2+2,size);
}
const labels=new Map<string,T.Texture>();
const cachedLabel=(text:string,bg=CREAM,fg=INK,w=256,h=80)=>{const k=`${text}|${bg}|${fg}|${w}|${h}`;let t=labels.get(k);if(!t){t=label(text,bg,fg,w,h);labels.set(k,t);}return t;};
function flatMat(map:T.Texture){const m=new T.MeshBasicMaterial({map,transparent:true});m.userData.outlineParameters={visible:false};return m;}
/** A label plate: flat on the table (tilt ≈ -1.2) or standing (tilt 0). */
function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,w=.4,tilt=-1.15,bg?:string,fg?:string,h=w*80/256){
  const p=part(parent,new T.PlaneGeometry(w,h),flatMat(label(text,bg,fg,256,Math.round(256*h/w))),x,y,z,false);p.rotation.x=tilt;p.userData.noAO=true;return p;
}
/** A live canvas texture that is redrawn in place. */
class Live {canvas=document.createElement('canvas');tex:T.CanvasTexture;key='';
  constructor(w:number,h:number){this.canvas.width=w;this.canvas.height=h;this.tex=new T.CanvasTexture(this.canvas);this.tex.colorSpace=T.SRGBColorSpace;this.tex.anisotropy=4;}
  draw(key:string,fn:(c:CanvasRenderingContext2D,w:number,h:number)=>void){if(key===this.key)return;this.key=key;fn(this.canvas.getContext('2d')!,this.canvas.width,this.canvas.height);this.tex.needsUpdate=true;}
}
/** A round dial gauge with a needle and a digital line. */
function drawGauge(c:CanvasRenderingContext2D,w:number,title:string,unit:string,max:number,value:number|undefined,accent:string){
  const r=w/2;c.clearRect(0,0,w,w);
  c.fillStyle=INK;c.beginPath();c.arc(r,r,r-2,0,7);c.fill();c.fillStyle=BRASS;c.beginPath();c.arc(r,r,r-10,0,7);c.fill();c.fillStyle=CREAM;c.beginPath();c.arc(r,r,r-22,0,7);c.fill();
  const a0=Math.PI*.75,a1=Math.PI*2.25,ang=(v:number)=>a0+(a1-a0)*Math.min(1,Math.max(0,v/max));
  c.lineWidth=14;c.strokeStyle=accent;c.globalAlpha=.35;c.beginPath();c.arc(r,r,r-40,a0,a1);c.stroke();c.globalAlpha=1;
  c.strokeStyle=INK;c.fillStyle=INK;c.textAlign='center';c.textBaseline='middle';
  for(let k=0;k<=8;k++){const a=ang(max*k/8),big=k%2===0;c.lineWidth=big?6:3;c.beginPath();c.moveTo(r+Math.cos(a)*(r-30),r+Math.sin(a)*(r-30));c.lineTo(r+Math.cos(a)*(r-(big?52:44)),r+Math.sin(a)*(r-(big?52:44)));c.stroke();
    if(big){c.font=FONT(22,600);c.fillText(fmt(max*k/8,1),r+Math.cos(a)*(r-74),r+Math.sin(a)*(r-74));}}
  c.font=FONT(24);c.fillText(title,r,r-52);
  c.fillStyle=value===undefined?'#d9d2c2':INK;c.beginPath();c.roundRect(r-78,r+44,156,48,12);c.fill();
  c.fillStyle=value===undefined?INK:'#9ff3ea';c.font=FONT(30);c.fillText(value===undefined?'—':`${fmt(value)}`,r,r+69);
  c.fillStyle=INK;c.font=FONT(20,600);c.fillText(unit,r,r+110);
  if(value!==undefined){const a=ang(value);c.strokeStyle='#e5484d';c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(r-Math.cos(a)*18,r-Math.sin(a)*18);c.lineTo(r+Math.cos(a)*(r-46),r+Math.sin(a)*(r-46));c.stroke();}
  c.fillStyle=INK;c.beginPath();c.arc(r,r,13,0,7);c.fill();
}
const ohms=(r:number)=>r>=1000?`${fmt(r/1000)} kΩ`:`${fmt(r)} Ω`;
/** The reveal: the same network as a schematic (values in electrical units via SCALE). */
function drawSchematic(c:CanvasRenderingContext2D,w:number,h:number,net:Net|undefined){
  c.fillStyle=CREAM;c.fillRect(0,0,w,h);
  if(!net){ // Behind frosted glass: pale tiles.
    c.fillStyle='#d6eef0';const s=64;for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s)if(((x+y)/s)%2===0)c.fillRect(x,y,s,s);return;}
  c.fillStyle='rgba(44,62,102,.12)';for(let y=16;y<h;y+=32)for(let x=16;x<w;x+=32)c.fillRect(x-1.5,y-1.5,3,3);
  const X=(p:Pt)=>(.15+p[0]*.2)/1.9*w,Y=(p:Pt)=>(1-(.15+p[1]*.25)/1.1)*h;
  c.strokeStyle=NAVY;c.fillStyle=NAVY;c.lineWidth=7;c.lineCap='round';c.lineJoin='round';
  const line=(pts:Pt[])=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(X(p),Y(p)):c.moveTo(X(p),Y(p)));c.stroke();};
  net.wires.forEach(line);
  for(const d of net.parts){
    // The symbol sits in the middle of the longest segment; wire runs to it from both ends.
    let best=0,len=0;for(let k=0;k<d.path.length-1;k++){const l=Math.hypot(X(d.path[k+1])-X(d.path[k]),Y(d.path[k+1])-Y(d.path[k]));if(l>len){len=l;best=k;}}
    const a=d.path[best],b=d.path[best+1],ax=X(a),ay=Y(a),bx=X(b),by=Y(b),mx=(ax+bx)/2,my=(ay+by)/2,ux=(bx-ax)/len,uy=(by-ay)/len,half=d.part.kind==='R'?52:44;
    line(d.path.slice(0,best+1));line(d.path.slice(best+1));
    c.beginPath();c.moveTo(ax,ay);c.lineTo(mx-ux*half,my-uy*half);c.moveTo(mx+ux*half,my+uy*half);c.lineTo(bx,by);c.stroke();
    const nx=-uy,ny=ux;let text='';
    if(d.part.kind==='R'){c.beginPath();c.moveTo(mx-ux*half,my-uy*half);for(let k=1;k<=6;k++){const t=-half+k*(2*half/6)-half/6,s=k===6?0:(k%2?1:-1)*20;c.lineTo(mx+ux*t+nx*s,my+uy*t+ny*s);}c.lineTo(mx+ux*half,my+uy*half);c.stroke();text=ohms(d.part.r*SCALE.ohm);}
    else{c.fillStyle=CREAM;c.beginPath();c.arc(mx,my,half,0,7);c.fill();c.stroke();c.fillStyle=NAVY;
      // Path runs from node a (the + end / arrow head) to node b; flip so the symbol points at a.
      const ex=-ux,ey=-uy;
      if(d.part.kind==='V'){c.font=FONT(40);c.textAlign='center';c.textBaseline='middle';c.fillText('+',mx+ex*22,my+ey*22);c.fillText('−',mx-ex*22,my-ey*22);text=`${fmt(d.part.v*SCALE.V)} V`;}
      else{c.beginPath();c.moveTo(mx-ex*24,my-ey*24);c.lineTo(mx+ex*18,my+ey*18);c.stroke();c.beginPath();c.moveTo(mx+ex*26,my+ey*26);c.lineTo(mx+ex*8+nx*12,my+ey*8+ny*12);c.lineTo(mx+ex*8-nx*12,my+ey*8-ny*12);c.closePath();c.fill();text=`${fmt(d.part.i*SCALE.mA)} mA`;}}
    c.font=FONT(46);c.textAlign=Math.abs(ux)>.5?'center':'left';c.textBaseline='middle';c.fillStyle=INK;
    const off=Math.abs(ux)>.5?{x:0,y:-54}:{x:half+12,y:0};c.fillText(text,mx+off.x,my+off.y);c.fillStyle=NAVY;
  }
  for(const [name,p] of [['A',net.ports.a],['B',net.ports.b]] as const){c.fillStyle=CREAM;c.beginPath();c.arc(X(p),Y(p),16,0,7);c.fill();c.stroke();c.fillStyle=INK;c.font=FONT(46);c.textAlign='right';c.textBaseline='middle';c.fillText(name,X(p)-26,Y(p)-32);}
}

interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
interface KnobView {id:Knob;dial:T.Object3D;plate:T.Mesh;name:string}
interface Bubble {mesh:T.Mesh;part:number;t:number;pts:T.Vector3[];len:number}

export class Waterworks implements Station {
  readonly view={distance:7.2,pitch:1.02,lookY:.74};
  readonly limits={time:540,damage:1,cost:Math.ceil(NETS.length*bestCost()*1.25)};
  readonly table=new T.Vector3(0,1,-2.7);readonly stand={x:0,z:-1.5};readonly facing=Math.PI;
  index=0;device:Device='net';load?:Load;wheelsReady=false;active=false;revealed=false;mistakes=0;spent=0;
  carts:Carts={pP:KNOBS.pP.start,pR:KNOBS.pR.start,fQ:KNOBS.fQ.start,fR:KNOBS.fR.start};
  answer={eV:KNOBS.eV.start,eR:KNOBS.eR.start,eI:KNOBS.eI.start};
  records:NetRecord[]=NETS.map(()=>blankRecord());served:{net:string;tier:number;elecFirst:boolean}[]=[];lastCompare?:Comparison;
  readonly job:StationJob;
  private root=new T.Group();private bench=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;
  private knobs:KnobView[]=[];private lastKnob:Knob='pP';private drag?:{knob:Knob;x0:number;v0:number;plane:T.Plane};
  private pipes=new T.Group();private bubbles:Bubble[]=[];private flows:number[]=[];private glass!:T.MeshToonMaterial;private reveal=0;private revealT=0;
  private board=new Live(1024,592);private caseG=new T.Group();private caseSign=new Live(512,80);private gaugeP=new Live(256,256);private gaugeQ=new Live(256,256);
  private mount=new T.Group();private mounted?:T.Object3D;private spin=0;private loadTokens:T.Object3D[]=[];private selectors:T.Object3D[]=[];
  private hoses:{d:Device;mesh:T.Mesh[]}[]=[];private frontRow=new T.Group();private console=new T.Group();private compareBtn!:T.Object3D;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';private cart?:Game['props'][number];private cartRide=new T.Group();
  private nextAt=-1;
  constructor(private game:Game){
    this.job={goal:'Match three hidden networks at their two ports',
      steps:[
        {text:'Roll the load-wheel cart from the store to the test bench',done:()=>this.wheelsReady,at:()=>this.cart?.body.translation()??this.stand},
        {text:'Step up to the test bench (E)',done:()=>this.active||this.served.length>0,at:()=>this.stand},
        ...NETS.map((n,i)=>({text:`${n.name}: match both carts, then name the circuit`,done:()=>this.served.length>i,at:()=>this.stand}))],
      bonuses:[
        {text:'Every match within two compares',ok:()=>this.served.every(s=>s.tier>=2)},
        {text:'Elegant: two readings per network',ok:()=>this.served.every(s=>s.tier===3)},
        {text:'Circuit answers right first time',ok:()=>this.served.every(s=>s.elecFirst)}]};
    game.root.add(this.root);this.root.add(this.bench);this.bench.position.copy(this.table).add(new T.Vector3(OX,0,0));
    this.build();this.showNet();
  }
  dress(kit:RoomKit){return dressWaterworks(this.game,kit);}
  net(){return NETS[this.index];}
  record(){return this.records[this.index];}

  // ---------- the bench ----------
  // Back row: the glass case (tilted to face the bench camera) and the port manifold with its gauges.
  // Front corners: the pressure cart (left) and the flow cart (right), low so the HUD cards don't
  // cover them. Front middle: the loads, the port selector and COMPARE (later: the circuit console).
  private build(){
    const g=this.game,t=this.table,W=4.9,D=1.45,cx=t.x+OX;
    // Counter: cream body with panels, navy kick, pale wood top with a brass edge.
    part(g.decorRoot,rbox(W,.92,D,.06),toon('#efe3cb'),cx,.46,t.z);part(g.decorRoot,box(W-.1,.1,D-.08),toon(NAVY),cx,.05,t.z+.02);
    part(g.decorRoot,rbox(W+.1,.07,D+.1,.05),toon('#ecd6ad'),cx,.965,t.z);part(g.decorRoot,box(W+.08,.035,.03),toon(BRASS),cx,.93,t.z+D/2+.05);
    for(let k=0;k<5;k++)part(g.decorRoot,box(.8,.52,.02),toon('#e4d4b6'),cx-1.92+k*.96,.5,t.z+D/2+.005);
    this.solid(W,1,D,cx,.5,t.z);
    this.buildCase();this.buildPorts();
    this.buildCart('pcart',-1.88);this.buildCart('fcart',1.88);
    this.bench.add(this.frontRow);this.buildFrontRow();this.bench.add(this.console);this.buildConsole();
    // Parking spot for the load-wheel cart at the bench's right end.
    part(g.decorRoot,box(1.4,.012,1),toon('#ffc629'),this.parkAt().x,.006,this.parkAt().z,false);
  }
  private parkAt(){return {x:this.table.x+OX+3.3,z:this.table.z};}
  private buildCase(){
    const c=this.caseG,{w,h,depth}=CASE;
    this.bench.add(c);c.position.set(CASE.x,.07,CASE.z);c.rotation.x=-CASE.tilt;
    part(this.bench,rbox(w+.16,.08,.5,.05),toon(NAVY),CASE.x,.04,CASE.z-.16);
    part(c,box(w+.06,h+.06,.04),toon('#efe3cb'),0,h/2,-.03);
    const face=part(c,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:this.board.tex}),0,h/2,-.008,false);(face.material as T.Material).userData.outlineParameters={visible:false};face.userData.noAO=true;
    // Brass frame around the glass, and the frosted pane (its own materials, so the reveal can fade it).
    for(const sx of [-1,1])part(c,box(.05,h+.1,depth+.04),toon(BRASS),sx*(w/2+.03),h/2,depth/2-.02);
    for(const y of [-.02,h+.02])part(c,box(w+.1,.05,depth+.04),toon(BRASS),0,y,depth/2-.02);
    this.glass=toon('#d9f1f3').clone();this.glass.transparent=true;this.glass.opacity=.62;this.glass.depthWrite=false;this.glass.userData.outlineParameters={visible:false};
    part(c,box(w,h,.012),this.glass,0,h/2,depth,false).userData.noAO=true;
    c.add(this.pipes);
    const s=part(c,new T.PlaneGeometry(1.3,.2),flatMat(this.caseSign.tex),0,h+.16,depth/2,false);s.userData.noAO=true;
  }
  /** Port manifold with the fitted load, a gauge board (pressure and flow), and the hoses. */
  private buildPorts(){
    const b=this.bench,m=PORTS;
    part(b,rbox(.5,.24,.34,.05),toon(BRASS),m.x,.12,m.z);
    for(const [dx,name] of [[-.15,'A'],[.15,'B']] as const){part(b,cyl(.04,.04,.05,12,'z'),toon(COPPER),m.x+dx,.13,m.z+.19);sign(b,name,m.x+dx,.13,m.z+.22,.09,0,CREAM,INK,.07);}
    b.add(this.mount);this.mount.position.set(m.x,.26,m.z);
    // Gauge board on two posts behind the manifold, tilted like the case.
    for(const sx of [-.28,.28])part(b,box(.05,.56,.05),toon(NAVY),m.x+sx,.28,m.z-.3);
    const board=group(b,m.x,.52,m.z-.3);board.rotation.x=-CASE.tilt;
    part(board,rbox(.9,.03,.48,.05),toon(NAVY),0,.2,-.02).rotation.x=Math.PI/2;
    for(const [gx,live] of [[-.215,this.gaugeP],[.215,this.gaugeQ]] as const){const gg=group(board,gx,.2,0);
      part(gg,cyl(.215,.215,.04,28,'z'),toon(INK),0,0,.01);const f=part(gg,new T.CircleGeometry(.205,40),new T.MeshBasicMaterial({map:live.tex}),0,0,.032,false);(f.material as T.Material).userData.outlineParameters={visible:false};f.userData.noAO=true;}
    // Pipes from the case's ports to the manifold, and a hose from each cart.
    const port=(p:Pt)=>this.bench.worldToLocal(this.caseG.localToWorld(grid(p)));
    this.caseG.updateMatrixWorld(true);const net=NETS[0],pa=port(net.ports.a),pb=port(net.ports.b);
    const edge=CASE.x+CASE.w/2+.02;
    // Both run down the case's right-hand frame, clear of the gauges, into the manifold's side.
    const netHose=[...this.tube([pa,new T.Vector3(edge+.06,pa.y,pa.z),new T.Vector3(edge+.08,.3,-.3),new T.Vector3(m.x-.27,.17,m.z-.05)],.026),
      ...this.tube([pb,new T.Vector3(edge+.05,pb.y,pb.z),new T.Vector3(m.x-.27,.08,m.z+.06)],.026)];
    const pc=this.tube([new T.Vector3(-1.5,.2,0),new T.Vector3(-1.45,.05,-.55),new T.Vector3(-.4,.04,-.68),new T.Vector3(m.x-.1,.05,-.62),new T.Vector3(m.x,.12,m.z-.16)],.032);
    const fc=this.tube([new T.Vector3(1.5,.2,0),new T.Vector3(1.42,.06,-.06),new T.Vector3(m.x+.25,.12,m.z)],.032);
    this.hoses=[{d:'net',mesh:netHose},{d:'pcart',mesh:pc},{d:'fcart',mesh:fc}];
    this.redrawGauges();
  }
  private tube(pts:T.Vector3[],r:number){const curve=new T.CatmullRomCurve3(pts,false,'centripetal',.2);return [part(this.bench,new T.TubeGeometry(curve,48,r,10),toon(COPPER),0,0,0)];}
  /** A low trolley with its name on the front and a sloped control deck (two knobs) on top. */
  private buildCart(d:'pcart'|'fcart',x:number){
    const b=group(this.bench,x,0,.16),body=d==='pcart'?NAVY:AQUA;
    const hull=part(b,rbox(1.12,.2,.58,.06),toon(body),0,.15,0);part(b,box(1.14,.025,.6),toon(BRASS),0,.26,0);
    for(const [wx,wz] of [[-.44,-.25],[.44,-.25],[-.44,.25],[.44,.25]])part(b,cyl(.06,.06,.05,14,'z'),toon(INK),wx,.06,wz);
    const deck=group(b,0,.27,.02);deck.rotation.x=-DECK;
    part(deck,rbox(1.1,.03,.5,.05),toon(body),0,.23,-.015).rotation.x=Math.PI/2;
    sign(deck,d==='pcart'?'PRESSURE CART · pump + series':'FLOW CART · pump + bypass',0,.39,.01,.98,0,d==='pcart'?'#1d2b4a':'#1d6f7a',CREAM,.11);
    if(d==='pcart'){this.knob(deck,'pP',-.27,.17,'PUMP');this.knob(deck,'pR',.27,.17,'SERIES');}else{this.knob(deck,'fQ',-.27,.17,'PUMP');this.knob(deck,'fR',.27,.17,'BYPASS');}
    this.click(hull,'device',d);
  }
  /** A knob: drag it sideways to turn it, or click − / +; its plate shows the value. */
  private knob(parent:T.Object3D,id:Knob,x:number,y:number,name:string){
    const g=group(parent,x,y,0);
    part(g,cyl(.085,.085,.02,24,'z'),toon(INK),0,.02,.01);
    const dial=group(g,0,.02,.03);part(dial,cyl(.07,.076,.05,24,'z'),toon(CREAM),0,0,0);part(dial,box(.016,.055,.012),toon('#e5484d'),0,.04,.027);
    for(const [dx,delta,col] of [[-.15,-1,'#e5484d'],[.15,1,'#4fbf7f']] as const){const btn=part(g,box(.075,.075,.035),toon(col),dx,.02,.02);sign(btn,delta<0?'−':'+',0,0,.019,.065,0,col,CREAM,.065);this.click(btn,'nudge',[id,delta]);}
    const plate=part(g,new T.PlaneGeometry(.5,.13),flatMat(cachedLabel('')),0,-.115,.02,false);plate.userData.noAO=true;
    this.knobs.push({id,dial,plate,name});this.click(dial,'knob',id);
  }
  private buildFrontRow(){
    const r=this.frontRow,z=.4;
    const loads:Load[]=['open','short',...WHEELS],short:{[k:string]:string}={open:'VALVE',short:'HOSE',2:'WHEEL 2',6:'WHEEL 6',12:'WHEEL 12'};
    loads.forEach((l,k)=>{const x=-1.26+k*.3,tok=group(r,x,0,z);part(tok,cyl(.115,.125,.035,22),toon('#e8dcc4'),0,.018,0);const m=this.loadModel(l);m.position.y=.16;m.scale.setScalar(.85);tok.add(m);
      this.click(tok,'load',l);this.loadTokens.push(tok);sign(r,short[String(l)],x,.05,z+.2,.29,-.85,CREAM,INK,.12);});
    // What's on the ports: three lever valves.
    (['net','pcart','fcart'] as Device[]).forEach((d,k)=>{const x=.24+k*.27,v=group(r,x,0,z);part(v,cyl(.075,.09,.05,18),toon(DMETAL),0,.025,0);const lever=group(v,0,.05,0);part(lever,cyl(.017,.017,.2,8),toon(INK),0,.1,0);part(lever,sphere(.048,12,10),toon(d==='net'?BRASS:d==='pcart'?NAVY:AQUA),0,.21,0);
      this.selectors.push(lever);this.click(v,'device',d);sign(r,d==='net'?'NETWORK':d==='pcart'?'P-CART':'F-CART',x,.05,z+.2,.265,-.85,CREAM,INK,.12);});
    const cmp=group(r,1.1,0,z-.02);part(cmp,cyl(.17,.19,.07,24),toon(INK),0,.035,0);part(cmp,cyl(.14,.15,.07,24),toon('#ffc629'),0,.095,0);this.compareBtn=cmp;this.click(cmp,'compare');
    sign(r,'COMPARE',1.1,.05,z+.22,.38,-.85,'#ffc629',INK,.12);
  }
  /** Electrical console: rises in the front middle when the glass clears. */
  private buildConsole(){
    const c=this.console,deck=group(c,-.25,.05,.36);deck.rotation.x=-DECK;
    part(deck,rbox(2.1,.03,.46,.06),toon(NAVY),0,.2,-.015).rotation.x=Math.PI/2;
        this.knob(deck,'eV',-.68,.17,'V_th');this.knob(deck,'eR',0,.17,'R_th');this.knob(deck,'eI',.68,.17,'I_N');
    const check=group(c,1.08,0,.28);part(check,cyl(.17,.19,.07,24),toon(INK),0,.035,0);part(check,cyl(.14,.15,.07,24),toon('#4fbf7f'),0,.095,0);this.click(check,'check');
    sign(c,'CHECK',1.08,.05,.58,.38,-.85,'#4fbf7f',CREAM,.12);
    c.visible=false;
  }
  /** Small models for loads: a shut valve, a U-hose, and wheels sized by restriction. */
  private loadModel(l:Load){
    const g=new T.Group();
    if(l==='open'){part(g,cyl(.03,.03,.12,10),toon(COPPER),0,-.08,0);part(g,new T.TorusGeometry(.07,.016,8,24),toon('#e5484d'),0,0,0);part(g,box(.14,.018,.018),toon('#e5484d'),0,0,0);part(g,box(.018,.14,.018),toon('#e5484d'),0,0,0);}
    else if(l==='short'){const c=new T.CatmullRomCurve3([new T.Vector3(-.08,-.12,0),new T.Vector3(-.09,.06,0),new T.Vector3(0,.12,0),new T.Vector3(.09,.06,0),new T.Vector3(.08,-.12,0)]);part(g,new T.TubeGeometry(c,24,.025,8),toon(AQUA));}
    else{const rad=l===2?.08:l===6?.105:.13,wheel=new T.Group();g.add(wheel);wheel.name='wheel';
      part(wheel,new T.TorusGeometry(rad,.014,8,28),toon(l===2?'#9fd8a0':l===6?BRASS:'#e5684d'),0,0,0);part(wheel,cyl(.025,.025,.05,12,'z'),toon(INK));
      for(let k=0;k<8;k++){const p=part(wheel,box(.022,rad*1.25,.05),toon(CREAM),Math.cos(k*.785)*rad*.55,Math.sin(k*.785)*rad*.55,0);p.rotation.z=k*.785+Math.PI/2;}
      part(g,box(.03,.18,.03),toon(DMETAL),0,-.1,-.04);}
    return g;
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}

  // ---------- the hidden network ----------
  /** Builds the pipes for the current network (and frosts the glass again). */
  private showNet(){
    const net=this.net();this.pipes.clear();this.bubbles=[];this.reveal=0;this.revealT=0;this.revealed=false;
    this.glass.opacity=.62;this.pipes.visible=true;this.console.visible=false;this.frontRow.visible=true;
    this.board.draw('tiles',(c,w,h)=>drawSchematic(c,w,h,undefined));
    this.caseSign.draw(`hidden${this.index}`,(c,w,h)=>drawPlate(c,net?`HIDDEN NETWORK ${this.index+1} OF ${NETS.length}`:'ALL NETWORKS MATCHED',NAVY,CREAM,w,h));
    if(!net)return;
    const pipeMat=toon(COPPER),joint=(p:T.Vector3)=>part(this.pipes,sphere(.03,10,8),pipeMat,p.x,p.y,p.z);
    const run=(pts:Pt[])=>{const v=pts.map(grid);for(let k=0;k<v.length-1;k++)this.pipe(v[k],v[k+1],.022,pipeMat);v.forEach(joint);return v;};
    net.wires.forEach(run);
    net.parts.forEach((d,i)=>{const v=run(d.path);
      let best=0,len=0;for(let k=0;k<v.length-1;k++){const l=v[k].distanceTo(v[k+1]);if(l>len){len=l;best=k;}}
      const mid=v[best].clone().lerp(v[best+1],.5),dir=v[best+1].clone().sub(v[best]).normalize();
      if(d.part.kind==='R'){const orifice=group(this.pipes,mid.x,mid.y,mid.z);orifice.quaternion.setFromUnitVectors(UP,dir);
        part(orifice,cyl(.045,.045,.035,14),toon(BRASS),0,-.05,0);part(orifice,cyl(.045,.045,.035,14),toon(BRASS),0,.05,0);part(orifice,cyl(.012,.012,.07,8),toon(BRASS),0,0,0);}
      else if(d.part.kind==='V'){part(this.pipes,cyl(.085,.085,.1,20,'z'),toon(NAVY),mid.x,mid.y,mid.z);part(this.pipes,cyl(.05,.05,.02,16,'z'),toon('#ffc629'),mid.x,mid.y,mid.z+.055);}
      else{part(this.pipes,rbox(.15,.15,.1,.04),toon('#ff9a4d'),mid.x,mid.y,mid.z);part(this.pipes,cyl(.045,.045,.02,12,'z'),toon(CREAM),mid.x,mid.y,mid.z+.055);}
      const total=v.slice(1).reduce((n,p,k)=>n+p.distanceTo(v[k]),0);
      for(let k=0;k<3;k++){const m=part(this.pipes,sphere(.02,8,6),hot('#bff4ff',1.2),0,0,0,false);this.bubbles.push({mesh:m,part:i,t:k/3,pts:v,len:total});}
    });
    this.updateFlows();
  }
  private pipe(a:T.Vector3,b:T.Vector3,r:number,mat:T.Material){const len=a.distanceTo(b);if(len<1e-4)return;const m=part(this.pipes,cyl(r,r,len,10),mat,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);m.quaternion.setFromUnitVectors(UP,b.clone().sub(a).normalize());}
  /** Flow in each hidden part under the fitted load (bubbles run along the drawing a → b). */
  private updateFlows(){
    const net=this.net();if(!net)return;
    const load=this.device==='net'&&this.load!==undefined?this.load:'open',s=solveWith(net,load);
    this.flows=net.parts.map((d,k)=>d.part.kind==='R'?s.i[k]:-s.i[k]);
  }

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const a=this.game.audio,net=this.net();
    if(!net)return false;
    if(!this.wheelsReady){this.say('The test loads are still in the store: roll the load-wheel cart over to the bench.');a.voice('hm',1.4);return false;}
    if(this.nextAt>=0)return false;
    const benchOnly=['load','device','compare'],elec=['check'];
    if(this.revealed&&benchOnly.includes(name)){this.say('The glass is clear: name this circuit on the console first (V_th, R_th, I_N), then CHECK.');return false;}
    if(!this.revealed&&elec.includes(name)){this.say('The circuit is still hidden. Match both carts and COMPARE to clear the glass.');return false;}
    switch(name){
      case 'load':{const l=arg as Load;if(!(l==='open'||l==='short'||WHEELS.includes(l as 2)))return false;this.load=l;this.logReading();a.noise(.25,.05,700,'lowpass');a.pop();break;}
      case 'device':{const d=arg as Device;if(!DEVICE_NAMES[d])return false;if(this.device===d)return true;this.device=d;this.logReading();a.noise(.08,.05,2600,'bandpass');a.tone(300,.08,.04,'triangle');break;}
      case 'nudge':{const [k,delta]=arg as [Knob,number];if(!this.knobAllowed(k))return false;this.setKnob(k,this.knobValue(k)+delta*KNOBS[k].step);a.tone(520+delta*60,.04,.03,'triangle');break;}
      case 'set':{const [k,v]=arg as [Knob,number];if(!this.knobAllowed(k))return false;this.setKnob(k,v);break;}
      case 'compare':{const rec=this.record();rec.tries++;this.spent+=COST.compare;const c=compare(net,this.carts);this.lastCompare=c;
        if(c.pOk&&c.fOk){rec.matchedAfter=rec.measured.length;const tr=tier(rec);this.revealT=1;this.revealed=true;this.device='net';
          this.say(`Both carts match under every wheel. ${['','Works','Works reliably','Elegant: two readings did it'][tr]}. The glass clears: here is the same network as a circuit.`,'ok');
          a.bell(1175,.5,.05);a.jingle();cheer(this.game,this,'#9ff3ea');}
        else{this.say(c.problems.slice(0,1).join(' '),'bad');a.tone(170,.25,.06,'square');}
        break;}
      case 'check':{const rec=this.record();rec.elecTries++;const v=checkAnswer(net,{v:this.answer.eV,r:this.answer.eR,mA:this.answer.eI});
        if(!v.ok){this.mistakes++;this.say(v.problems[0],'bad');a.tone(150,.3,.06,'square');this.game.alarm({x:this.table.x,z:this.table.z-1.2},2);break;}
        rec.elecOk=true;const tr=tier(rec);this.served.push({net:net.id,tier:tr,elecFirst:rec.elecTries===1});
        this.say(`Right: V_th ${fmt(this.answer.eV)} V behind R_th ${ohms(this.answer.eR)}, or I_N ${fmt(this.answer.eI)} mA across the same R_th. Same equivalent the carts found.`,'ok');
        a.cheer();a.bell(1319,.5,.05);cheer(this.game,this,'#ffcf52');
        this.nextAt=this.game.time+1.2;break;}
      default:return false;
    }
    this.updateFlows();this.redraw();return true;
  }
  private knobAllowed(k:Knob){
    if(!KNOBS[k])return false;const e=k[0]==='e';
    if(e&&!this.revealed){this.say('The circuit console opens once both carts match.');return false;}
    if(!e&&this.revealed){this.say('The carts are done for this network: set the circuit console (V_th, R_th, I_N).');return false;}
    return true;
  }
  knobValue(k:Knob){return k[0]==='e'?this.answer[k as 'eV'|'eR'|'eI']:this.carts[k as keyof Carts];}
  private setKnob(k:Knob,v:number){const x=clampKnob(k,v);if(k[0]==='e')this.answer[k as 'eV'|'eR'|'eI']=x;else this.carts[k as keyof Carts]=x;this.lastKnob=k;}
  /** A hidden-network reading is logged (and costs a test run) the first time each load is fitted. */
  private logReading(){
    if(this.device!=='net'||this.load===undefined)return;const rec=this.record();
    if(!rec.measured.includes(this.load)){rec.measured.push(this.load);this.spent+=COST.reading;}
  }
  reading():Reading|undefined{const net=this.net();return net&&this.load!==undefined?readDevice(net,this.carts,this.device,this.load):undefined;}

  // ---------- drawing ----------
  private redraw(){
    for(const k of this.knobs){const s=KNOBS[k.id],v=this.knobValue(k.id);k.dial.rotation.z=-((v-s.min)/(s.max-s.min)-.5)*Math.PI*1.5;
      (k.plate.material as T.MeshBasicMaterial).map=cachedLabel(`${k.name}  ${k.id==='eR'?ohms(v):`${fmt(v)}${s.unit?' '+s.unit:''}`}`,CREAM,INK,320,83);}
    this.selectors.forEach((l,k)=>{const on=(['net','pcart','fcart'] as Device[])[k]===this.device;l.rotation.z=on?0:.7;l.position.y=on?.06:.05;});
    this.loadTokens.forEach((t,k)=>{const on=(['open','short',...WHEELS] as Load[])[k]===this.load;t.position.y=on?.03:0;t.visible=this.wheelsReady;});
    for(const h of this.hoses)for(const m of h.mesh)m.material=toon(h.d===this.device?WATER:COPPER);
    // The fitted load sits on the manifold.
    if(this.mounted){this.mount.remove(this.mounted);this.mounted=undefined;}
    if(this.load!==undefined){this.mounted=this.loadModel(this.load);this.mounted.scale.setScalar(1.25);this.mount.add(this.mounted);}
    this.redrawGauges();this.shown='';
  }
  private redrawGauges(){const r=this.reading();
    this.gaugeP.draw(`p${r?.p.toFixed(3)}`,c=>drawGauge(c,256,'PRESSURE','kPa',40,r?.p,AQUA));
    this.gaugeQ.draw(`q${r?.q.toFixed(3)}`,c=>drawGauge(c,256,'FLOW','L/min',12,r?.q,BRASS));}

  // ---------- pointer, keys, room ----------
  pointer(e:Pointer){
    if(this.drag){
      if(e.kind==='up'){this.drag=undefined;document.body.style.cursor='';return;}
      const hit=e.ray.ray.intersectPlane(this.drag.plane,new T.Vector3());
      if(hit&&e.kind==='move'){const k=this.drag.knob,s=KNOBS[k],steps=Math.round((hit.x-this.drag.x0)/.012);const before=this.knobValue(k);this.setKnob(k,this.drag.v0+steps*s.step);
        if(this.knobValue(k)!==before){this.game.audio.tone(480+(this.knobValue(k)-s.min)/(s.max-s.min)*500,.03,.02,'triangle');this.redraw();}}
      return;
    }
    const hits=e.ray.intersectObjects(this.clickables.filter(c=>c.obj.visible&&this.visibleUp(c.obj)).map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.1);this.hovered=found;}
    document.body.style.cursor=found&&this.active?(found.act==='knob'?'ew-resize':'pointer'):'';
    if(e.kind!=='down'||e.button!==0||!found)return;
    if(found.act==='knob'){const k=found.arg as Knob;if(!this.wheelsReady){this.act('nudge',[k,0]);return;}if(!this.knobAllowed(k))return;
      const at=found.obj.getWorldPosition(new T.Vector3()),plane=new T.Plane(new T.Vector3(0,1,0),-at.y),hit=e.ray.ray.intersectPlane(plane,new T.Vector3());
      this.lastKnob=k;this.drag={knob:k,x0:hit?.x??at.x,v0:this.knobValue(k),plane};return;}
    this.act(found.act,found.arg);
  }
  private visibleUp(o:T.Object3D){let p:T.Object3D|null=o;while(p){if(!p.visible)return false;p=p.parent;}return true;}
  key(code:string){
    const loads:Load[]=['open','short',...WHEELS];
    const map:{[c:string]:[string,unknown?]}={Digit1:['load',loads[0]],Digit2:['load',loads[1]],Digit3:['load',loads[2]],Digit4:['load',loads[3]],Digit5:['load',loads[4]],
      KeyN:['device','net'],KeyP:['device','pcart'],KeyF:['device','fcart'],KeyC:['compare'],Enter:['check'],
      ArrowRight:['nudge',[this.lastKnob,1]],ArrowUp:['nudge',[this.lastKnob,1]],Equal:['nudge',[this.lastKnob,1]],ArrowLeft:['nudge',[this.lastKnob,-1]],ArrowDown:['nudge',[this.lastKnob,-1]],Minus:['nudge',[this.lastKnob,-1]]};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;this.drag=undefined;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}
    // At the bench the console knobs belong to the circuit once revealed; start on a useful knob.
    if(active)this.lastKnob=this.revealed?'eV':this.lastKnob;this.shown='';}
  dropped(p:Game['props'][number]){
    if(p.spec.id!=='wheels'||this.wheelsReady)return;const q=p.body.translation(),park=this.parkAt();
    if(Math.hypot(q.x-park.x,q.z-park.z)<2.4||Math.hypot(q.x-this.stand.x,q.z-this.stand.z)<2.2){
      this.wheelsReady=true;p.body.setTranslation({x:park.x,y:.34,z:park.z},true);p.body.setRotation(new T.Quaternion(),true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);
      this.game.audio.plug();this.game.burst({x:park.x,y:.8,z:park.z},'#9ff3ea',1,'ring');this.redraw();}
  }
  private ready=false;
  private setup(){this.ready=true;this.cart=this.game.props.find(p=>p.spec.id==='wheels');
    // Three wheels ride on the cart until it is parked, then they appear on the bench.
    this.game.root.add(this.cartRide);for(const [k,l] of ([[0,2],[1,6],[2,12]] as const)){const m=this.loadModel(l);m.position.set(-.35+k*.35,.55,0);m.scale.setScalar(1.6);this.cartRide.add(m);}
    this.redraw();}
  update(dt:number){
    if(!this.ready)this.setup();
    if(this.cart){const q=this.cart.body.translation(),r=this.cart.body.rotation();this.cartRide.position.set(q.x,q.y,q.z);this.cartRide.quaternion.set(r.x,r.y,r.z,r.w);this.cartRide.visible=!this.wheelsReady&&this.cart.mesh.visible;}
    // Reveal: the frost fades, the pipes give way to the circuit drawing, the console rises.
    if(this.revealT>0&&this.reveal<1){this.reveal=Math.min(1,this.reveal+dt*.9);const r=this.reveal;this.glass.opacity=.62-.57*r;
      if(r>.45&&this.pipes.visible){this.pipes.visible=false;const net=this.net();this.board.draw(`net${this.index}`,(c,w,h)=>drawSchematic(c,w,h,net));
        this.caseSign.draw(`elec${this.index}`,(c,w,h)=>drawPlate(c,'THE SAME NETWORK, AS A CIRCUIT','#4fbf7f',CREAM,w,h));this.frontRow.visible=false;this.console.visible=true;this.lastKnob='eV';this.redraw();}
      this.console.position.y=-.3*(1-Math.min(1,Math.max(0,(r-.45)/.55)));}
    if(this.nextAt>=0&&this.game.time>=this.nextAt){this.nextAt=-1;this.index++;this.device='net';this.load=undefined;this.lastCompare=undefined;this.lastKnob='pP';
      this.answer={eV:KNOBS.eV.start,eR:KNOBS.eR.start,eI:KNOBS.eI.start};this.showNet();this.redraw();}
    // Bubbles run along the pipes at the solved flow; the fitted wheel turns with the port flow.
    for(const b of this.bubbles){const f=this.flows[b.part]??0;b.t=((b.t+dt*f*.12/Math.max(.2,b.len))%1+1)%1;let d=b.t*b.len;
      for(let k=0;k<b.pts.length-1;k++){const l=b.pts[k].distanceTo(b.pts[k+1]);if(d<=l||k===b.pts.length-2){b.mesh.position.copy(b.pts[k]).lerp(b.pts[k+1],Math.min(1,d/Math.max(l,1e-6)));break;}d-=l;}}
    const r=this.reading();if(this.mounted){const w=this.mounted.getObjectByName('wheel');if(w&&r){this.spin+=dt*r.q*1.4;w.rotation.z=-this.spin;}}
    this.updatePanel();
  }

  // ---------- panels ----------
  private say(text:string,tone:'ok'|'bad'|'info'='info'){
    if(!this.toast){this.toast=document.createElement('div');this.toast.className='station-toast';this.layer()?.append(this.toast);}
    this.toast.innerHTML=html(text);this.toast.dataset.tone=tone;this.toast.hidden=false;this.toastUntil=this.game.time+Math.max(4,text.length*.06);
  }
  private layer(){return document.querySelector<HTMLElement>('[data-layer="hud"]');}
  private updatePanel(){
    if(this.toast&&!this.toast.hidden&&this.game.time>this.toastUntil&&this.game.running)this.toast.hidden=true;
    const net=this.net(),r=this.reading(),rec=this.record();
    const key=JSON.stringify([this.active,this.index,this.device,this.load,this.carts,this.answer,this.revealed,this.wheelsReady,rec?.measured,rec?.tries,!!this.lastCompare,this.pipes.visible]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel ww-panel';this.layer()?.append(this.panel);}
    this.panel.hidden=!net;if(!net)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const head=`<header><small>NETWORK ${this.index+1}/${NETS.length} · ${net.name.toUpperCase()}</small>`;
    if(this.revealed&&!this.pipes.visible){
      this.panel.innerHTML=`${head}<h4>Name it in electronics</h4><p>The case shows the same network as a circuit. Set the console: the source and resistor a load would see (Thevenin), and the matching Norton current.</p></header>`+
        (this.active?`<ul class="build">${row(html('V_th'),`${fmt(this.answer.eV)} V`)}${row(html('R_th'),ohms(this.answer.eR))}${row(html('I_N'),`${fmt(this.answer.eI)} mA`)}${row(html('V_th ÷ R_th'),`${fmt(this.answer.eV/this.answer.eR*1000)} mA`)}</ul>`+
        `<p class="profile">Scale used here: 1 kPa → 1 V, 1 restriction unit → 100 Ω, 1 L/min → 10 mA. Your carts read ${fmt(this.carts.pP)} kPa behind ${fmt(this.carts.pR)}, and ${fmt(this.carts.fQ)} L/min across ${fmt(this.carts.fR)}.</p>`:'');
      return;}
    const log=rec.measured.map(l=>{const x=readDevice(net,this.carts,'net',l);return `<tr><td>${loadName(l)}</td><td>${fmt(x.p)}</td><td>${fmt(x.q)}</td></tr>`;}).join('');
    const cmp=this.lastCompare?`<table class="ww-table"><caption>Last compare (kPa · L/min)</caption><tr><th>Wheel</th><th>Network</th><th>P-cart</th><th>F-cart</th></tr>${this.lastCompare.rows.map(x=>`<tr><td>${x.load}</td><td>${fmt(x.net.p,1)} · ${fmt(x.net.q,1)}</td><td class="${x.pOk?'ok':'no'}">${fmt(x.pcart.p,1)} · ${fmt(x.pcart.q,1)}</td><td class="${x.fOk?'ok':'no'}">${fmt(x.fcart.p,1)} · ${fmt(x.fcart.q,1)}</td></tr>`).join('')}</table>`:'';
    this.panel.innerHTML=`${head}<h4>Build two carts that act the same at the ports</h4><p>${net.story}</p></header>`+
      (this.active?`<ul class="build">${row('On the ports',DEVICE_NAMES[this.device])}${row('Load',loadName(this.load),this.load!==undefined)}${row('Pressure',r?`${fmt(r.p)} kPa`:'—')}${row('Flow',r?`${fmt(r.q)} L/min`:'—')}`+
        `${row('Pressure cart',`${fmt(this.carts.pP)} kPa · series ${fmt(this.carts.pR)}`)}${row('Flow cart',`${fmt(this.carts.fQ)} L/min · bypass ${fmt(this.carts.fR)}`)}</ul>`+
        (log?`<table class="ww-table"><caption>Network readings</caption><tr><th>Load</th><th>kPa</th><th>L/min</th></tr>${log}</table>`:'')+cmp+
        `<p class="profile">Analogy: pressure ≈ voltage, flow ≈ current, restriction ≈ resistance. It holds for steady, linear cases only.</p>`:'');
  }

  /** What the pointer is over, in words (the labels on the table are small). */
  private hoverHint():Prompt|null{
    const h=this.hovered;if(!h||!this.active)return null;
    switch(h.act){
      case 'load':return {key:String((['open','short',...WHEELS] as Load[]).indexOf(h.arg as Load)+1),text:`Click to fit it. ${LOAD_HINTS[String(h.arg)]}`};
      case 'device':return {key:h.arg==='net'?'N':h.arg==='pcart'?'P':'F',text:`Click to put the ${DEVICE_NAMES[h.arg as Device].toLowerCase()} on the ports`};
      case 'knob':return {key:'←→',text:html(`Drag sideways (or press ← →) to set ${KNOB_NAMES[h.arg as Knob]}`)};
      case 'nudge':{const [k,d]=h.arg as [Knob,number];return {key:d>0?'→':'←',text:html(`Click to ${d>0?'raise':'lower'} ${KNOB_NAMES[k]} one step`)};}
      case 'compare':return {key:'C',text:'COMPARE: run all three wheels on the network and on both carts'};
      case 'check':return {key:'Enter',text:html('CHECK your V_th, R_th and I_N')};
    }
    return null;
  }
  prompt(atBench:boolean):Prompt|null{
    if(!this.net())return null;
    if(atBench&&this.wheelsReady){const h=this.hoverHint();if(h)return h;}
    if(!atBench){const p=this.game.player.translation(),park=this.parkAt();
      if(this.game.held?.spec.id==='wheels'&&(Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<2.4||Math.hypot(p.x-park.x,p.z-park.z)<2.4))return {key:'E',text:'Park the load-wheel cart by the bench'};
      if(Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6)return this.wheelsReady?{key:'E',text:'Work at the test bench'}:{key:'E',text:'Work at the bench (the load wheels are still in the store)'};
      return walkHint(this.game,this.wheelsReady?'Walk to the test bench (yellow arrow)':'Fetch the load-wheel cart from the store (yellow arrow)');}
    if(!this.wheelsReady)return {key:'E',text:'Step back and fetch the load-wheel cart from the store'};
    if(this.revealed)return {key:'Enter',text:html('Set V_th, R_th and I_N (drag a knob or − / +), then CHECK')};
    const rec=this.record();
    if(!rec.measured.length)return {key:'1–5',text:'Click a load to fit it to the ports (shut valve, hose or a wheel) and read the gauges'};
    if(rec.measured.length<2)return {key:'1–5',text:'Take one more reading: the shut valve plus one wheel is enough'};
    return {key:'C',text:'Tune both carts (drag a knob or − / +), try them on the ports, then COMPARE'};
  }
  complete(){return this.served.length>=NETS.length;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){return {index:this.index,device:this.device,load:this.load??null,reading:this.reading()??null,carts:{...this.carts},answer:{...this.answer},revealed:this.revealed,
    records:this.records.map(r=>({...r,tier:tier(r)})),served:this.served,wheelsReady:this.wheelsReady,mistakes:this.mistakes,spent:this.spent,
    compare:this.lastCompare?{pOk:this.lastCompare.pOk,fOk:this.lastCompare.fOk}:null};}
}
