// The Delivery Depot dispatch bench (voltage, current and power, met as trucks first). A small DC
// distribution board sits on the counter: a source ramp lifts every truck (charge) to the height
// of the top rail (potential); three bays drop from the top rail to the return rail through
// device carts; trucks per second on each road is the current there, and the cargo each truck
// hands over at a device is the energy per charge (the voltage across it). Pip fits rail sections,
// lifts and lowers bay barriers, tunes the source, resets the breaker, and probes with the meter.
// The final job repeats the check in a plain meter view with no trucks at all. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressDepot} from './room';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,INK,DMETAL} from '../../render/kit';
import {hot} from '../../render/actors';
import {JOBS,DEVICES,RAILS,SOURCE,BREAKER,BAND,N,PROBES,BEST_COST,COST,clampE,clone,evaluate,judge,probe,isRequired,fmt,
  type DeviceKind,type Job,type Layout,type Probe,type RailKind,type Readings,type Verdict} from './logic';
import './depot.css';
import {cheer,walkHint} from '../shared';

const ORANGE='#f28c28',CREAM='#fbf3e2',BRICK='#b5573b',BLUE='#3f7fd6',NAVY='#2c3e66',STEEL='#63748f',CARGO='#ffc94d';
/** The board sits a little left of the camera's centre (the order panel is on the right). */
const OX=-.15;
// Board layout (bench-local): the source ramp on the left, three bays, the top rail at the back,
// the return rail at the front. Heights show potential: y = BASE + volts × K.
const XS=-1.6,XB=[-.72,.08,.88],ZT=-.42,ZD=-.2,ZB=.3,BASE=.1,K=.04;
const POS:[number,number][]=[[XS,ZB],[XS,ZB],[XS,ZT],[XS+.3,ZT],...XB.map(x=>[x,ZT] as [number,number]),...XB.map(x=>[x,ZD] as [number,number]),...XB.map(x=>[x,ZB] as [number,number])];
type Seg={id:string;a:number;b:number;kind:'ramp'|'switch'|'slot'|'rail'|'bar'|'dev'};
const SEGS:Seg[]=[{id:'ramp',a:N.B0,b:N.TERM,kind:'ramp'},{id:'breaker',a:N.TERM,b:N.T0,kind:'switch'},{id:'feed',a:N.T0,b:N.T[0],kind:'slot'},
  {id:'top12',a:N.T[0],b:N.T[1],kind:'rail'},{id:'top23',a:N.T[1],b:N.T[2],kind:'rail'},
  ...[0,1,2].flatMap(k=>[{id:`bar${k+1}`,a:N.T[k],b:N.D[k],kind:'bar' as const},{id:`dev${k+1}`,a:N.D[k],b:N.B[k],kind:'dev' as const}]),
  {id:'bot32',a:N.B[2],b:N.B[1],kind:'rail'},{id:'bot21',a:N.B[1],b:N.B[0],kind:'rail'},{id:'ret',a:N.B[0],b:N.B0,kind:'slot'}];
const PROBE_NAMES:Record<Probe,string>={source:'SOURCE',feed:'FEED',return:'RETURN',bay1:'BAY 1',bay2:'BAY 2',bay3:'BAY 3'};
const PROBE_ENDS:Record<Probe,[number,number]>={source:[N.TERM,N.B0],feed:[N.T0,N.T[0]],return:[N.B[0],N.B0],bay1:[N.T[0],N.B[0]],bay2:[N.T[1],N.B[1]],bay3:[N.T[2],N.B[2]]};
const DEVICE_COLORS:Record<DeviceKind,string>={lamp:'#ffc94d',motor:BLUE,heater:'#e5684d',jumper:'#c9ced8'};
/** Race: how long the belt visibly races before the breaker opens (seconds). */
const RACE=1.1;
const HOT_RAIL=hot('#ff6a3d',1.1);

// ---------- canvas helpers ----------
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
function drawPlate(c:CanvasRenderingContext2D,text:string,bg:string,fg:string,w:number,h:number){
  c.clearRect(0,0,w,h);c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(18,h*.25));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
  let size=Math.round(h*.46);c.font=FONT(size);while(size>10&&c.measureText(text).width>w-30){size--;c.font=FONT(size);}
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);
}
const labels=new Map<string,T.Texture>();
const label=(text:string,bg=CREAM,fg=INK,w=256,h=80)=>{const k=`${text}|${bg}|${fg}|${w}|${h}`;let t=labels.get(k);if(!t){t=canvasTex(w,h,c=>drawPlate(c,text,bg,fg,w,h));labels.set(k,t);}return t;};
function flatMat(map:T.Texture){const m=new T.MeshBasicMaterial({map,transparent:true});m.userData.outlineParameters={visible:false};return m;}
/** A label plate: flat on the table (tilt ≈ -1.2) or standing (tilt 0). */
function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,w=.4,tilt=-1.2,bg?:string,fg?:string,h=w*80/256){
  const cw=Math.max(256,Math.min(1024,Math.round(640*w)));
  const p=part(parent,new T.PlaneGeometry(w,h),flatMat(label(text,bg,fg,cw,Math.round(cw*h/w))),x,y,z,false);p.rotation.x=tilt;p.userData.noAO=true;return p;
}
/** A live canvas texture that is redrawn in place. */
class Live {canvas=document.createElement('canvas');tex:T.CanvasTexture;key='';
  constructor(w:number,h:number){this.canvas.width=w;this.canvas.height=h;this.tex=new T.CanvasTexture(this.canvas);this.tex.colorSpace=T.SRGBColorSpace;this.tex.anisotropy=4;}
  draw(key:string,fn:(c:CanvasRenderingContext2D,w:number,h:number)=>void){if(key===this.key)return;this.key=key;fn(this.canvas.getContext('2d')!,this.canvas.width,this.canvas.height);this.tex.needsUpdate=true;}
}
const volts=(v:number)=>`${Math.abs(v)<.005?'0.0':v.toFixed(Math.abs(v)>=100?0:1)} V`;
const amps=(i:number)=>`${Math.abs(i)<.0005?'0.00':Math.abs(i)>=10?i.toFixed(1):i.toFixed(2)} A`;
const watts=(p:number)=>`${Math.abs(p)<.05?'0':Math.abs(p)>=100?p.toFixed(0):p.toFixed(1)} W`;

interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
interface Truck {g:T.Object3D;crate:T.Mesh;t:number}
interface Lane {seg:Seg;trucks:Truck[]}
interface BayView {root:T.Group;housing:T.Group;kind:DeviceKind|null;bulb?:T.MeshBasicMaterial;halo?:T.Sprite;rotor?:T.Object3D;grille?:T.MeshBasicMaterial;
  barrier:T.Group;arm:T.Object3D;plate:Live;empty:T.Object3D}

export class DeliveryDepot implements Station {
  readonly view={distance:7.3,pitch:1.1,lookY:.88};
  readonly limits={time:480,damage:1,cost:Math.ceil(BEST_COST*1.25)};
  readonly table=new T.Vector3(0,1,-2.7);readonly stand={x:0,z:-1.5};readonly facing=Math.PI;
  index=0;layout:Layout=clone(JOBS[0].start);tripped=false;probeAt:Probe='source';plain=false;active=false;mistakes=0;spent=0;
  carts={lamp:false,motor:false};served:{job:string;tier:number}[]=[];probed=new Set<Probe>();lastVerdict?:Verdict;
  readonly job:StationJob;
  private root=new T.Group();private board=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;
  private beams=new Map<string,T.Mesh>();private posts:T.Mesh[]=[];private joints:T.Mesh[]=[];private lanes:Lane[]=[];private trucks=new T.Group();
  private bays:BayView[]=[];private gapMarks:{[k in 'feed'|'ret']:T.Group}={} as never;private breakerLever!:T.Object3D;private breakerLamp!:T.MeshBasicMaterial;private breakerBox!:T.Group;
  private dial!:T.Object3D;private knobPlate!:T.Mesh;private drag?:{x0:number;v0:number;plane:T.Plane};
  private meterFace=new Live(320,360);private leads:T.Mesh[]=[];private leadKey='';private probeButtons=new Map<Probe,T.Mesh>();private railButtons:{slot:'feed'|'ret';kind:RailKind;mesh:T.Mesh}[]=[];
  private viewSwitch!:T.Object3D;private analogySign!:T.Mesh;private meterSign!:T.Mesh;private battery!:T.Group;private rampDeck!:T.Group;
  private now!:Readings;private surge?:Readings;tripLog='';private raceT=0;private surgeTimer=0;private nextAt=-1;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';
  private cartProps:{[k in 'lamp'|'motor']?:Game['props'][number]}={};private cartRides:{[k in 'lamp'|'motor']:T.Group}={lamp:new T.Group(),motor:new T.Group()};
  constructor(private game:Game){
    this.job={goal:'Dispatch power: three jobs on the depot board',
      steps:[
        {text:'Bring the lamp cart from the loading dock to the bench',done:()=>this.carts.lamp,at:()=>this.cartProps.lamp?.body.translation()??this.stand},
        {text:'Bring the motor cart from the loading dock to the bench',done:()=>this.carts.motor,at:()=>this.cartProps.motor?.body.translation()??this.stand},
        {text:'Step up to the dispatch bench (E)',done:()=>this.active||this.served.length>0,at:()=>this.stand},
        ...JOBS.map((j,i)=>({text:`${j.name}: ${j.goal.toLowerCase()}`,done:()=>this.served.length>i,at:()=>this.stand}))],
      bonuses:[
        {text:'Every job works reliably',ok:()=>this.served.every(s=>s.tier>=2)},
        {text:'Elegant: least wasted power every time',ok:()=>this.served.every(s=>s.tier===3)},
        {text:'No trips you caused, nothing sent back',ok:()=>this.mistakes===0}]};
    game.root.add(this.root);this.root.add(this.board);this.board.position.copy(this.table).add(new T.Vector3(OX,0,0));
    this.build();this.startJob();
  }
  dress(kit:RoomKit){return dressDepot(this.game,kit);}
  current():Job|undefined{return JOBS[this.index];}

  // ---------- the bench ----------
  private build(){
    const g=this.game,t=this.table,W=4.9,D=1.45,cx=t.x+OX;
    // Counter: cream body with panels, a brick-red kick, pale wood top with an orange edge.
    part(g.decorRoot,rbox(W,.92,D,.06),toon('#efe3cb'),cx,.46,t.z);part(g.decorRoot,box(W-.1,.1,D-.08),toon(BRICK),cx,.05,t.z+.02);
    part(g.decorRoot,rbox(W+.1,.07,D+.1,.05),toon('#ecd6ad'),cx,.965,t.z);part(g.decorRoot,box(W+.08,.035,.03),toon(ORANGE),cx,.93,t.z+D/2+.05);
    for(let k=0;k<5;k++)part(g.decorRoot,box(.8,.52,.02),toon('#e4d4b6'),cx-1.92+k*.96,.5,t.z+D/2+.005);
    this.solid(W,1,D,cx,.5,t.z);
    const b=this.board;
    // The yard plate under the board: pale blue with painted lane lines.
    const yard=part(b,rbox(3.05,.03,1.12,.05),toon('#ffffff',{map:yardTexture()}),-.25,.015,-.06);yard.userData.noAO=true;
    b.add(this.trucks);this.buildTrack();this.buildSource();this.buildBays();this.buildMeter();
    // Parking spots for the two carts at the counter's ends.
    for(const s of ['lamp','motor'] as const){const p=this.parkAt(s);part(g.decorRoot,box(1.4,.012,1),toon(s==='lamp'?'#ffc94d':'#7fb0ee'),p.x,.006,p.z,false);}
  }
  parkAt(s:'lamp'|'motor'){return {x:this.table.x+OX+(s==='lamp'?-3.35:3.35),z:this.table.z};}
  /** Rails, posts and joints (placed every frame from the solved potentials). */
  private buildTrack(){
    const b=this.board;
    for(const s of SEGS){if(s.kind==='ramp')continue;const w=s.kind==='dev'||s.kind==='bar'?.07:.06;
      const m=part(b,box(1,.03,w),toon(STEEL),0,0,0);m.rotation.order='YZX';this.beams.set(s.id,m);
      if(s.id==='feed'||s.id==='ret'){const m2=m;this.click(m2,'swapRail',s.id==='feed'?'feed':'ret');}
      if(s.kind==='dev')this.click(m,'deviceClick',Number(s.id.slice(3)));}
    for(let n=0;n<POS.length;n++){if(n===N.EMF)continue;
      const post=part(b,cyl(.012,.012,1,8),toon(DMETAL),POS[n][0],.5,POS[n][1]);this.posts[n]=post;
      const j=part(b,sphere(.026,10,8),toon(n===N.B0||n===N.TERM?ORANGE:STEEL),POS[n][0],0,POS[n][1]);this.joints[n]=j;}
    // Gap markers (hazard blocks at both ends of an empty rail slot).
    for(const slot of ['feed','ret'] as const){const s=SEGS.find(x=>x.id===slot)!,gm=group(b);this.gapMarks[slot]=gm;
      for(const n of [s.a,s.b]){const blk=part(gm,box(.07,.07,.07),toon('#ffffff',{map:hazardTex()}),0,0,0);blk.userData.node=n;}}
    // Rail slot buttons: THIN and HEAVY for the feed (in front of the top rail, where the raised rail can't hide them) and the return (in front of it).
    const railBtn=(slot:'feed'|'ret',kind:'thin'|'heavy',x:number,z:number)=>{const m=part(b,rbox(.4,.03,.17,.03),toon(kind==='heavy'?STEEL:'#b8c0cc'),x,.015,z);
      const s=sign(m,`${kind==='heavy'?'HEAVY':'THIN'} ${slot==='feed'?'FEED':'RETURN'}`,0,.017,0,.39,-Math.PI/2,kind==='heavy'?'#3b4a63':'#eef1f5',kind==='heavy'?CREAM:INK,.15);s.rotation.x=-Math.PI/2;
      this.railButtons.push({slot,kind,mesh:m});this.click(m,'rail',[slot,kind]);};
    railBtn('feed','thin',-1.2,-.24);railBtn('feed','heavy',-1.2,-.05);railBtn('ret','thin',-1.4,.42);railBtn('ret','heavy',-.98,.42);
    this.analogySign=sign(b,'TRUCKS: AN ANALOGY',-2.1,.014,.64,.56,-Math.PI/2,NAVY,CREAM,.13);
    this.meterSign=sign(b,'PLAIN METER VIEW',-2.1,.014,.64,.56,-Math.PI/2,'#4fbf7f',CREAM,.13);this.meterSign.visible=false;
  }
  /** Source: the ramp that lifts the trucks, its knob, and the breaker booth on the top rail. */
  private buildSource(){
    const b=this.board;
    this.rampDeck=group(b);const ramp=part(this.rampDeck,box(1,.035,.13),toon(ORANGE),0,0,0);ramp.name='ramp';
    for(const s of [-1,1]){const r=part(this.rampDeck,box(1,.05,.015),toon('#c9621a'),0,.02,s*.07);r.name='rampside';}
    this.rampDeck.rotation.order='YZX';
    this.battery=group(b,XS,.1,(ZT+ZB)/2);part(this.battery,rbox(.16,.14,.36,.04),toon(NAVY),0,.07,0);part(this.battery,rbox(.1,.03,.06,.02),toon('#e5484d'),0,.155,-.13);
    sign(this.battery,'+  −',0,.15,.02,.14,-Math.PI/2,NAVY,CREAM,.2).rotation.z=Math.PI/2;this.battery.visible=false;
    // Knob deck at the far left: the source setting E.
    const deck=group(b,-2.12,.0,.4);deck.rotation.x=-Math.PI/2;
    part(deck,rbox(.52,.03,.64,.05),toon(NAVY),0,.2,0).rotation.x=Math.PI/2;
    sign(deck,'SOURCE  E',0,.44,.02,.5,0,'#1d2b4a',CREAM,.13);
    const kg=group(deck,0,.26,.02);part(kg,cyl(.1,.1,.02,24,'z'),toon(INK),0,0,.01);
    this.dial=group(kg,0,0,.03);part(this.dial,cyl(.085,.09,.05,24,'z'),toon(CREAM),0,0,0);part(this.dial,box(.018,.06,.012),toon('#e5484d'),0,.05,.027);this.click(this.dial,'knob');
    for(const [dy,delta,col] of [[0,-1,'#e5484d'],[0,1,'#4fbf7f']] as const){const btn=part(kg,box(.09,.09,.035),toon(col),delta*.19,dy,.02);sign(btn,delta<0?'−':'+',0,0,.019,.075,0,col,CREAM,.075);this.click(btn,'nudge',delta);}
    this.knobPlate=part(deck,new T.PlaneGeometry(.5,.14),flatMat(label('')),0,.08,.02,false);this.knobPlate.userData.noAO=true;
    // The breaker booth sits on the top rail between the source and the feed.
    const bx=group(b,XS+.15,0,ZT-.02);this.breakerBox=bx;part(bx,rbox(.2,.2,.16,.04),toon(CREAM),0,0,-.1);part(bx,box(.21,.03,.17),toon(ORANGE),0,.11,-.1);
    const lamp=new T.MeshBasicMaterial({color:'#6bd48f'});lamp.userData.outlineParameters={visible:false};this.breakerLamp=lamp;part(bx,sphere(.022,10,8),lamp,.06,.06,-.01);
    this.breakerLever=group(bx,-.03,0,-.01);part(this.breakerLever,box(.03,.1,.03),toon(INK),0,.05,0);part(this.breakerLever,box(.05,.035,.04),toon('#e5484d'),0,.1,0);
    this.click(bx,'breaker');
    // Its reset key sits out front by the source knob, where the camera always sees it: the dome
    // lamp shows on (green), off (grey) or tripped (red).
    const rb=group(b,-2.3,0,-.36);part(rb,cyl(.1,.11,.05,24),toon(INK),0,.025,0);part(rb,sphere(.075,16,10),lamp,0,.055,0);this.click(rb,'breaker');
    sign(b,`BREAKER ${BREAKER} A`,-2.01,.014,-.36,.34,-Math.PI/2,ORANGE,CREAM,.13);
  }
  /** Bays: barrier boom, device housing (lamp, motor, heater, or a stray crossover rail), readout plate. */
  private buildBays(){
    const b=this.board;
    for(let k=0;k<3;k++){const root=group(b,XB[k],0,0),housing=group(root);
      const barrier=group(root,.1,0,(ZT+ZD)/2);part(barrier,cyl(.02,.025,.12,10),toon(INK),0,.06,0);const arm=group(barrier,0,.11,0);
      part(arm,box(.2,.022,.022),toon('#ffffff',{map:hazardTex()}),-.1,0,0);
      this.click(barrier,'barrier',k+1);
      const empty=group(root,0,.004,(ZD+ZB)/2);part(empty,rbox(.24,.012,.4,.04),toon('#d9e2ec'),0,0,0);sign(empty,'EMPTY BAY',0,.01,0,.2,-Math.PI/2,'#eef1f5','#8a93a3').rotation.z=Math.PI/2;
      const plate=new Live(400,113);const pm=part(b,new T.PlaneGeometry(.74,.21),flatMat(plate.tex),XB[k],.014,.6,false);pm.rotation.x=-Math.PI/2;pm.userData.noAO=true;
      this.bays.push({root,housing,kind:null,barrier,arm,plate,empty});}
  }
  /** Fills a bay's housing for its device (rebuilt when the job changes). */
  private dressBay(k:number,kind:DeviceKind|null){
    const v=this.bays[k];v.housing.clear();v.kind=kind;v.bulb=v.halo=v.rotor=v.grille=undefined;
    const col=kind?DEVICE_COLORS[kind]:CREAM;
    if(kind&&kind!=='jumper'){const h=v.housing;
      for(const s of [-1,1])part(h,rbox(.04,.16,.16,.02),toon(col),s*.1,.08,0);
      part(h,rbox(.26,.035,.19,.03),toon(col),0,.17,0);part(h,box(.27,.012,.2),toon(INK),0,.19,0);
      if(kind==='lamp'){part(h,cyl(.02,.03,.05,10),toon(DMETAL),0,.22,0);const m=new T.MeshBasicMaterial({color:'#f4ecd2'});m.userData.outlineParameters={visible:false};v.bulb=m;part(h,sphere(.055,16,12),m,0,.28,0);
        v.halo=glow(h,'rgba(255,220,130,1)',.7,0);v.halo.position.y=.28;}
      if(kind==='motor'){part(h,cyl(.05,.05,.07,16,'x'),toon(NAVY),0,.24,0);const rotor=group(h,.045,.24,0);for(let q=0;q<3;q++){const bl=part(rotor,box(.01,.09,.03),toon(CREAM),0,0,0);bl.rotation.x=q*Math.PI*2/3;bl.position.set(0,Math.cos(q*2.09)*.03,Math.sin(q*2.09)*.03);}v.rotor=rotor;}
      if(kind==='heater'){const m=new T.MeshBasicMaterial({color:'#6b3a2e'});m.userData.outlineParameters={visible:false};v.grille=m;part(h,box(.2,.07,.03),m,0,.23,0);for(let q=0;q<4;q++)part(h,box(.012,.08,.035),toon(INK),-.075+q*.05,.23,0);}
      if(!this.clickables.some(c=>c.obj===h))this.click(h,'deviceClick',k+1);
    }
    v.empty.visible=!kind;v.barrier.visible=!!kind;
  }

  /** The meter: a chunky multimeter with a live face, probe buttons, the view switch and DISPATCH. */
  private buildMeter(){
    const b=this.board,m=group(b,1.5,0,-.3);
    part(m,rbox(.62,.07,.5,.06),toon('#ffc629'),0,.035,0);
    const face=group(m,0,.07,.0);face.rotation.x=-.95;part(face,rbox(.6,.03,.62,.06),toon('#ffc629'),0,.3,0).rotation.x=Math.PI/2;
    part(face,rbox(.5,.012,.54,.04),toon(INK),0,.3,.02).rotation.x=Math.PI/2;
    const screen=part(face,new T.PlaneGeometry(.46,.5175),flatMat(this.meterFace.tex),0,.3,.03,false);screen.userData.noAO=true;
    // Leads leave from two sockets at the meter's front.
    this.leadFrom=[new T.Vector3(1.42,.08,-.08),new T.Vector3(1.58,.08,-.08)];
    part(b,cyl(.02,.02,.03,10),toon(INK),1.42,.075,-.08);part(b,cyl(.02,.02,.03,10),toon('#e5484d'),1.58,.075,-.08);
    const rows:Probe[][]=[['source','feed','return'],['bay1','bay2','bay3']];
    // Probe keys in a 3 × 2 grid in front of the meter; DISPATCH sits to their right, clear of them.
    rows.forEach((row,r)=>row.forEach((p,c)=>{const x=1.2+c*.32,z=.1+r*.18,btn=part(b,rbox(.3,.03,.16,.03),toon(CREAM),x,.015,z);
      const s=sign(btn,PROBE_NAMES[p],0,.017,0,.29,-Math.PI/2,CREAM,INK,.14);s.rotation.x=-Math.PI/2;this.probeButtons.set(p,btn);this.click(btn,'probe',p);}));
    // View switch (trucks ↔ meter) and the DISPATCH button.
    const vs=group(b,1.2,0,.47);part(vs,rbox(.3,.05,.14,.04),toon(NAVY),0,.025,0);this.viewSwitch=group(vs,0,.06,0);part(this.viewSwitch,rbox(.12,.04,.11,.03),toon(CREAM),0,0,0);
    this.click(vs,'view');sign(b,'TRUCKS · METER',1.66,.014,.47,.5,-Math.PI/2,NAVY,CREAM,.13);
    const d=group(b,2.2,0,.16);part(d,cyl(.15,.17,.06,24),toon(INK),0,.03,0);part(d,cyl(.12,.13,.06,24),toon('#4fbf7f'),0,.085,0);this.click(d,'dispatch');
    sign(b,'DISPATCH',2.2,.014,.44,.42,-Math.PI/2,'#4fbf7f',CREAM,.14);
  }
  private leadFrom:T.Vector3[]=[];
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}

  // ---------- jobs ----------
  private startJob(){
    const job=this.current();this.probed.clear();this.plain=false;this.probeAt='source';this.lastVerdict=undefined;this.surge=undefined;this.raceT=0;this.tripped=false;
    if(!job){this.settle(false);this.redraw();return;}
    this.layout=clone(job.start);this.layout.bays.forEach((b,k)=>this.dressBay(k,this.cartsReady()||!isRequired(b.device)?b.device:null));
    this.buildLanes();
    // The short job opens with the surge: the belt races, then the breaker trips.
    this.settle(false);
    if(job.openingTrip&&this.cartsReady()){this.game.audio.tone(90,.9,.06,'sawtooth');this.probeAt='bay2';}
    this.redraw();
  }
  cartsReady(){return this.carts.lamp&&this.carts.motor;}
  /** Re-solve; a breaker that is on trips when the source current passes its rating. */
  private settle(playerCaused:boolean){
    const ev=evaluate(this.layout);
    if(ev.trip){this.surge=ev.surge;this.raceT=RACE;this.surgeTimer=RACE;this.layout.on=false;this.tripped=true;
      if(playerCaused){this.mistakes++;}
      const s=ev.surge!,hot=s.devices.filter(d=>!isRequired(d.kind)).sort((a,b)=>b.i-a.i)[0];
      this.tripLog=`${amps(s.current)}${hot?`, ${amps(hot.i)} of it through bay ${hot.bay+1}`:''}`;
      this.say(`The belt races: ${amps(s.current)} is over the breaker's ${BREAKER} A, so it trips.${hot?` Bay ${hot.bay+1}'s ${DEVICES[hot.kind].name} carried ${amps(hot.i)} of it.`:''}`,'bad');
      const a=this.game.audio;a.noise(.5,.08,2400,'bandpass');setTimeout(()=>{a.thud(6);a.tone(120,.2,.07,'square');},RACE*600);
      this.game.alarm({x:this.table.x,z:this.table.z-1.2},2);}
    this.now=ev.now;
  }
  /** Lanes of trucks on every road that exists (gaps have none). */
  private buildLanes(){
    this.trucks.clear();this.lanes=[];
    for(const s of SEGS){
      if(s.id==='feed'&&this.layout.feed==='gap')continue;if(s.id==='ret'&&this.layout.ret==='gap')continue;
      if(s.kind==='bar'||s.kind==='dev'){const k=Number(s.id.slice(3))-1;if(!this.bays[k].kind)continue;}
      const a=POS[s.a],b=POS[s.b],len=Math.hypot(a[0]-b[0],a[1]-b[1])+(s.kind==='ramp'?.2:0),n=Math.max(1,Math.round(len/.2));
      const trucks:Truck[]=[];for(let q=0;q<n;q++){const {g,crate}=truckModel();this.trucks.add(g);trucks.push({g,crate,t:(q+.5)/n});}
      this.lanes.push({seg:s,trucks});
    }
  }

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const a=this.game.audio,job=this.current();
    if(!job)return false;
    if(!this.cartsReady()){this.say(`The ${this.carts.lamp?'motor':this.carts.motor?'lamp':'lamp and motor'} cart${this.carts.lamp||this.carts.motor?' is':'s are'} still on the loading dock: bring ${this.carts.lamp||this.carts.motor?'it':'them'} to the bench first.`);a.voice('hm',1.4);return false;}
    if(this.nextAt>=0)return false;
    const l=this.layout;let rebuild=false;
    switch(name){
      case 'nudge':{const d=arg as number;if(d!==1&&d!==-1)return false;l.e=clampE(l.e+d*SOURCE.step);a.tone(420+l.e*25,.04,.03,'triangle');break;}
      case 'set':{const e=Number(arg);if(!Number.isFinite(e))return false;l.e=clampE(e);break;}
      case 'breaker':{
        if(l.on){l.on=false;a.tone(200,.08,.05,'square');this.say('Breaker off: the depot stops sending trucks. The ramp keeps its height; the rails fall to zero.');break;}
        if(this.tripped){this.spent+=COST.reset;this.tripped=false;}
        l.on=true;a.noise(.05,.07,2500,'highpass');a.tone(460,.08,.04);break;}
      case 'rail':{const [slot,kind]=arg as ['feed'|'ret',RailKind];if(slot!=='feed'&&slot!=='ret')return false;if(!['gap','thin','heavy'].includes(kind))return false;
        if(l[slot]===kind)return true;l[slot]=kind;if(kind!=='gap')this.spent+=COST.rail;rebuild=true;a.thud(3);a.clatter();break;}
      case 'swapRail':{const slot=arg as 'feed'|'ret';const next:RailKind=l[slot]==='gap'?'thin':l[slot]==='thin'?'heavy':'thin';return this.act('rail',[slot,next]);}
      case 'barrier':{const k=Number(arg)-1,b=l.bays[k];if(!b?.device){this.say(`Bay ${k+1} is empty: nothing to block.`);return false;}
        b.barrier=!b.barrier;a.tone(b.barrier?300:520,.07,.04,'triangle');break;}
      case 'remove':{const k=Number(arg)-1,b=l.bays[k];if(!b)return false;
        if(b.device!=='jumper'){this.say(b.device?`The ${DEVICES[b.device].name} belongs on the board. Lower its barrier to take it out of the loop.`:`Bay ${k+1} is already empty.`);return false;}
        b.device=null;b.barrier=false;this.dressBay(k,null);rebuild=true;a.clatter();a.pop();
        this.say('Crossover rail removed: that bay no longer joins the top rail straight to the return.','ok');break;}
      case 'deviceClick':{const k=Number(arg);if(l.bays[k-1]?.device==='jumper')return this.act('remove',k);return this.act('probe',`bay${k}`);}
      case 'probe':{const p=arg as Probe;if(!PROBES.includes(p))return false;this.probeAt=p;a.tone(900,.04,.03);break;}
      case 'view':{const v=arg===undefined?!this.plain:arg==='meter';this.plain=v;a.noise(.08,.05,2600,'bandpass');a.tone(this.plain?340:520,.06,.04,'triangle');
        if(this.plain)this.say('Meter view: no trucks, no ramp. Just the circuit and a meter, as in any plant room.');break;}
      case 'dispatch':return this.dispatch();
      default:return false;
    }
    if(rebuild)this.buildLanes();
    this.settle(true);this.noteProbe();this.redraw();this.updatePanel();return true;
  }
  /** Job 3's transfer: probes taken in the plain meter view with the board powered count. */
  private noteProbe(){if(this.plain&&this.layout.on&&!this.tripped)this.probed.add(this.probeAt);}
  private dispatch(){
    const job=this.current()!,a=this.game.audio;
    if(job.meterCheck){
      const need=this.layout.bays.map((b,k)=>isRequired(b.device)?`bay${k+1}` as Probe:undefined).filter((p):p is Probe=>!!p);
      if(!this.plain||!need.every(p=>this.probed.has(p))){this.say(`Last check with the plain meter: switch the view to METER, probe ${need.map(p=>PROBE_NAMES[p]).join(' and ')} with the board on, then DISPATCH.`);a.voice('hm',1.3);return false;}
    }
    const v=judge(job,this.layout);this.lastVerdict=v;
    if(v.tier===0){this.mistakes++;this.say(`Sent back: ${v.problems[0]}`,'bad');a.tone(150,.3,.06,'square');a.voice('groan',1);this.game.alarm({x:this.table.x,z:this.table.z-1.2},2);this.redraw();this.updatePanel();return true;}
    this.served.push({job:job.id,tier:v.tier});
    this.say(`${['','Works','Works reliably','Elegant'][v.tier]}. ${v.notes[0]??''}`,'ok');
    a.cheer();a.bell(1319,.5,.05);cheer(this.game,this,'#ffb347');
    this.nextAt=this.game.time+1.4;this.redraw();this.updatePanel();return true;
  }

  // ---------- drawing ----------
  /** Potential shown at a node: the solved volts (or the surge during a race), flat in meter view. */
  private shown_(){return this.raceT>0&&this.surge?this.surge:this.now;}
  private y(n:number){if(this.plain)return BASE*.6;const v=this.shown_().sol.v[n];return BASE+Math.max(0,v)*K;}
  private node(n:number){return new T.Vector3(POS[n][0],this.y(n),POS[n][1]);}
  private amp(id:string):number{const r=this.shown_(),i=r.sol.i;if(id==='ramp')return i.int??0;return (i as Record<string,number|undefined>)[id]??0;}
  redraw(){
    const l=this.layout,r=this.shown_();
    // Beams follow the potentials; a gap slot hides its beam; hot rails glow.
    for(const s of SEGS){const m=this.beams.get(s.id);if(!m)continue;
      let visible=true,mat:T.Material=toon(STEEL),h=.03,w=.06;
      if(s.id==='feed'||s.id==='ret'){const kind=l[s.id];visible=kind!=='gap';const i=Math.abs(this.amp(s.id));
        if(kind==='thin'){h=.018;w=.03;mat=toon('#aab4c3');}if(kind!=='gap'&&i>RAILS[kind].rating)mat=HOT_RAIL;else if(kind!=='gap'&&i>RAILS[kind].rating*.8)mat=toon('#ffb347');
        this.gapMarks[s.id].visible=kind==='gap';}
      if(s.kind==='bar'||s.kind==='dev'){const k=Number(s.id.slice(3))-1,bay=l.bays[k];visible=!!this.bays[k].kind;
        if(s.kind==='bar'&&bay.barrier)visible=false;
        if(s.kind==='dev'&&bay.device==='jumper'){mat=toon('#ffffff',{map:hazardTex()});w=.08;}
        if(s.kind==='dev'&&bay.device&&bay.device!=='jumper'){mat=toon('#8d9bb2');}}
      if(s.kind==='switch'){visible=l.on;}
      if(this.plain){mat=toon('#c9773f');h=.02;w=.025;if(s.kind==='dev'&&l.bays[Number(s.id.slice(3))-1].device==='jumper')mat=toon('#c9773f');}
      m.visible=visible;if(visible){this.place(m,this.node(s.a),this.node(s.b));m.scale.y=h/.03;m.scale.z=w/(s.kind==='dev'||s.kind==='bar'?.07:.06);m.material=mat;}
    }
    // The ramp (a slope from the return up to the top rail), or a plain source box in meter view.
    this.rampDeck.visible=!this.plain;this.battery.visible=this.plain;
    this.place(this.rampDeck,this.node(N.B0),this.node(N.TERM),true);
    for(const [slot,gm] of Object.entries(this.gapMarks)){const s=SEGS.find(x=>x.id===slot)!;gm.children.forEach(c=>{const n=c.userData.node as number,p=this.node(n),o=this.node(n===s.a?s.b:s.a),d=o.clone().sub(p).normalize().multiplyScalar(.06);c.position.copy(p).add(d);});}
    for(let n=0;n<POS.length;n++){const post=this.posts[n];if(!post)continue;const y=this.y(n);post.scale.y=Math.max(.001,y);post.position.y=y/2;this.joints[n].position.y=y;
      post.visible=this.nodeUsed(n);this.joints[n].visible=post.visible;}
    // Bays: housings sit halfway down the device chute; barrier arms show blocked or open.
    l.bays.forEach((b,k)=>{const v=this.bays[k],d=this.node(N.D[k]),bb=this.node(N.B[k]),mid=d.clone().lerp(bb,.5);
      v.housing.position.set(0,mid.y-.02,mid.z);v.barrier.position.y=this.y(N.T[k])-.06;v.arm.rotation.z=b.barrier?0:-Math.PI/2*.95;
      const dv=r.devices.find(x=>x.bay===k),p=dv?dv.p:0,nom=b.device&&DEVICES[b.device].vNom?DEVICES[b.device].vNom!**2/DEVICES[b.device].r:1,f=Math.max(0,p/nom);
      if(v.bulb){v.bulb.color.set(f>.02?'#fff1b0':'#f4ecd2').multiplyScalar(f>.02?.9+Math.min(2.2,f*1.4):1);v.halo!.material.opacity=Math.min(.9,f*.55);}
      if(v.grille){v.grille.color.set(f>.02?'#ff5a2a':'#6b3a2e').multiplyScalar(f>.02?.8+Math.min(1.6,f):1);}
      const title=b.device?`BAY ${k+1} · ${DEVICES[b.device].name.toUpperCase()}`:`BAY ${k+1} · EMPTY`;
      const line=!b.device?'—':b.barrier?'barrier down':dv?`${volts(dv.v)} · ${amps(dv.i)}`:'—';
      const ok=dv&&isRequired(b.device)&&!b.barrier?(dv.v>=BAND.lo&&dv.v<=BAND.hi&&dv.i<=DEVICES[b.device!].iMax!):undefined;
      v.plate.draw(`${title}|${line}|${ok}`,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle=CREAM;c.beginPath();c.roundRect(4,4,w-8,h-8,18);c.fill();c.lineWidth=6;c.strokeStyle=INK;c.stroke();
        c.fillStyle=b.device?DEVICE_COLORS[b.device]:'#d9e2ec';c.beginPath();c.roundRect(4,4,w-8,52,[18,18,0,0]);c.fill();c.stroke();
        c.fillStyle=b.device==='motor'?CREAM:INK;c.font=FONT(34);c.textAlign='center';c.textBaseline='middle';c.fillText(title,w/2,32);
        c.fillStyle=ok===undefined?INK:ok?'#1f7a4d':'#c2383d';let fs=50;c.font=FONT(fs);while(fs>20&&c.measureText(line).width>w-24){fs--;c.font=FONT(fs);}c.fillText(line,w/2,84);});
    });
    // Breaker booth, knob, probe buttons, rail buttons, view switch.
    this.breakerLever.rotation.z=l.on?0:-1.1;this.breakerLamp.color.set(this.tripped?'#ff4b4b':l.on?'#6bd48f':'#8a8f9c');
    this.breakerBox.position.y=this.y(N.TERM)-.1+.0;
    const s=SOURCE;this.dial.rotation.z=-((l.e-s.min)/(s.max-s.min)-.5)*Math.PI*1.5;(this.knobPlate.material as T.MeshBasicMaterial).map=label(`E  ${fmt(l.e,1)} V`,CREAM,INK,256,64);
    this.probeButtons.forEach((m,p)=>{m.position.y=p===this.probeAt?.03:.015;(m.material as T.MeshToonMaterial)=toon(p===this.probeAt?'#ffc629':this.probed.has(p)&&this.current_()?.meterCheck?'#bfe8c9':CREAM);});
    for(const rb of this.railButtons)rb.mesh.position.y=l[rb.slot]===rb.kind?.03:.015;
    this.viewSwitch.position.x=this.plain?.08:-.08;this.analogySign.visible=!this.plain;this.meterSign.visible=this.plain;
    this.trucks.visible=!this.plain;
    this.drawMeter();this.drawLeads();this.shown='';
  }
  private current_(){return this.current();}
  private nodeUsed(n:number){return n!==N.EMF&&![0,1,2].some(k=>n===N.D[k]&&!this.bays[k].kind);}
  /** Places a unit-length object between two points (its local +x along a → b). */
  private place(o:T.Object3D,a:T.Vector3,b:T.Vector3,ramp=false){
    const d=b.clone().sub(a),hLen=Math.hypot(d.x,d.z),len=d.length();o.position.copy(a).add(b).multiplyScalar(.5);
    o.rotation.order='YZX';o.rotation.set(0,Math.atan2(-d.z,d.x),Math.atan2(d.y,hLen));
    if(ramp)o.scale.set(len+.16,1,1);else o.scale.x=Math.max(len,.001);
  }
  private drawMeter(){
    const job=this.current(),l=this.layout,r=this.now,p=this.probeAt,pr=probe(l,r,p);
    const off=!l.on,title=PROBE_NAMES[p];
    const key=JSON.stringify([title,pr.v.toFixed(2),pr.i.toFixed(3),off,this.tripped,!!job]);
    this.meterFace.draw(key,(c,w,h)=>{c.fillStyle='#cfe8d2';c.fillRect(0,0,w,h);c.fillStyle='rgba(20,60,40,.08)';for(let y=0;y<h;y+=6)c.fillRect(0,y,w,2);
      c.fillStyle='#1f3a2a';c.textAlign='left';c.textBaseline='alphabetic';c.font=FONT(30);c.fillText(title,18,44);
      c.textAlign='right';c.font=FONT(22,600);c.fillText(this.tripped?'TRIPPED':off?'BREAKER OFF':'LIVE',w-16,42);
      c.fillRect(16,56,w-32,3);
      const rows:[string,string][]=[[volts(pr.v).replace(' V',''),'V'],[amps(pr.i).replace(' A',''),'A'],[watts(pr.v*pr.i).replace(' W',''),'W']];
      rows.forEach(([n,u],q)=>{const y=128+q*92;c.textAlign='right';c.font=FONT(72);c.fillText(n,w-78,y);c.font=FONT(40);c.textAlign='left';c.fillText(u,w-66,y);});
    });
  }
  /** Two probe leads from the meter to the probed element's ends (black to −, red to +). */
  private drawLeads(){
    const [pa,pb]=PROBE_ENDS[this.probeAt],A=this.node(pa),B=this.node(pb);
    const key=`${this.probeAt}|${A.y.toFixed(3)}|${B.y.toFixed(3)}`;if(key===this.leadKey)return;this.leadKey=key;
    for(const m of this.leads){m.removeFromParent();m.geometry.dispose();}this.leads=[];
    const ends:[T.Vector3,T.Vector3,string][]=[[this.leadFrom[1],A,'#e5484d'],[this.leadFrom[0],B,INK]];
    // Each lead drops from the meter, runs low along the back edge (top-rail points) or between the
    // return rail and the bay chutes (return-side points), and climbs only at the probed point.
    for(const [from,to,col] of ends){const lane=to.z<0?-.71:.2,off=col===INK?.03:0,x0=1.02+off;
      const pts=[from,new T.Vector3(from.x,.05,from.z+.04),new T.Vector3(x0,.03,from.z+.02),new T.Vector3(x0,.03,lane+off),new T.Vector3(to.x+.1,.03,lane+off),new T.Vector3(to.x+.03,to.y+.07,to.z+(to.z<0?-.05:.05)),to];
      const c=new T.CatmullRomCurve3(pts,false,'centripetal');
      const m=part(this.board,new T.TubeGeometry(c,40,.009,6),toon(col),0,0,0,false);this.leads.push(m);
      const tip=part(m,cyl(.012,.004,.05,8),toon(col),to.x,to.y+.03,to.z,false);void tip;}
  }

  // ---------- pointer, keys, room ----------
  pointer(e:Pointer){
    if(this.drag){
      if(e.kind==='up'){this.drag=undefined;document.body.style.cursor='';return;}
      const hit=e.ray.ray.intersectPlane(this.drag.plane,new T.Vector3());
      if(hit&&e.kind==='move'){const steps=Math.round((hit.x-this.drag.x0)/.01),before=this.layout.e;this.layout.e=clampE(this.drag.v0+steps*SOURCE.step);
        if(this.layout.e!==before){this.game.audio.tone(420+this.layout.e*25,.03,.02,'triangle');this.settle(true);this.redraw();}}
      return;
    }
    const hits=e.ray.intersectObjects(this.clickables.filter(c=>this.visibleUp(c.obj)).map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered&&!this.isBeam(this.hovered.obj))this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);
      if(found&&!this.isBeam(found.obj))found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.1);this.hovered=found;}
    document.body.style.cursor=found&&this.active?(found.act==='knob'?'ew-resize':'pointer'):'';
    if(e.kind!=='down'||e.button!==0||!found)return;
    if(found.act==='knob'){if(!this.cartsReady()||this.nextAt>=0){this.act('nudge',0);return;}
      const at=found.obj.getWorldPosition(new T.Vector3()),plane=new T.Plane(new T.Vector3(0,1,0),-at.y),hit=e.ray.ray.intersectPlane(plane,new T.Vector3());
      this.drag={x0:hit?.x??at.x,v0:this.layout.e,plane};return;}
    this.act(found.act,found.arg);
  }
  private isBeam(o:T.Object3D){return [...this.beams.values()].includes(o as T.Mesh);}
  private visibleUp(o:T.Object3D){let p:T.Object3D|null=o;while(p){if(!p.visible)return false;p=p.parent;}return true;}
  key(code:string){
    const map:{[c:string]:[string,unknown?]}={ArrowRight:['nudge',1],ArrowUp:['nudge',1],Equal:['nudge',1],ArrowLeft:['nudge',-1],ArrowDown:['nudge',-1],Minus:['nudge',-1],
      KeyB:['breaker'],KeyF:['swapRail','feed'],KeyR:['swapRail','ret'],KeyX:['remove',this.layout.bays.findIndex(b=>b.device==='jumper')+1],Digit1:['barrier',1],Digit2:['barrier',2],Digit3:['barrier',3],KeyM:['view'],Enter:['dispatch'],
      KeyP:['probe',PROBES[(PROBES.indexOf(this.probeAt)+1)%PROBES.length]]};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;this.drag=undefined;if(!active){document.body.style.cursor='';if(this.hovered){if(!this.isBeam(this.hovered.obj))this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';}
  dropped(p:Game['props'][number]){
    const which=p.spec.id==='lampcart'?'lamp':p.spec.id==='motorcart'?'motor':undefined;if(!which||this.carts[which])return;
    const q=p.body.translation(),park=this.parkAt(which);
    if(Math.hypot(q.x-park.x,q.z-park.z)<2.4||Math.hypot(q.x-this.stand.x,q.z-this.stand.z)<2.4){
      this.carts[which]=true;p.body.setTranslation({x:park.x,y:.34,z:park.z},true);p.body.setRotation(new T.Quaternion(),true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);
      this.game.audio.plug();this.game.burst({x:park.x,y:.8,z:park.z},'#ffcf8a',1,'ring');
      if(this.cartsReady())this.startJob();else this.redraw();}
  }
  private ready=false;
  private setup(){this.ready=true;
    for(const s of ['lamp','motor'] as const){this.cartProps[s]=this.game.props.find(p=>p.spec.id===`${s}cart`);const ride=this.cartRides[s];this.game.root.add(ride);
      // The device rides on its cart until the cart is parked; then it appears in its bay.
      const m=new T.Group();ride.add(m);m.position.y=.42;
      if(s==='lamp'){part(m,cyl(.03,.05,.4,10),toon(DMETAL),0,.2,0);const bulb=new T.MeshBasicMaterial({color:'#f4ecd2'});bulb.userData.outlineParameters={visible:false};part(m,sphere(.14,16,12),bulb,0,.48,0);part(m,cyl(.1,.12,.08,16),toon('#ffc94d'),0,.36,0);}
      else{part(m,cyl(.2,.2,.36,20,'x'),toon(NAVY),0,.2,0);part(m,cyl(.22,.22,.05,20,'x'),toon('#ffc629'),.2,.2,0);part(m,cyl(.04,.04,.14,10,'x'),toon(DMETAL),.3,.2,0);}}
    this.redraw();}
  update(dt:number){
    if(!this.ready)this.setup();
    for(const s of ['lamp','motor'] as const){const c=this.cartProps[s],ride=this.cartRides[s];if(!c){ride.visible=false;continue;}
      const q=c.body.translation(),r=c.body.rotation();ride.position.set(q.x,q.y,q.z);ride.quaternion.set(r.x,r.y,r.z,r.w);ride.visible=!this.carts[s]&&c.mesh.visible;}
    if(this.raceT>0){this.raceT=Math.max(0,this.raceT-dt);if(this.raceT===0)this.redraw();else this.redraw();}
    if(this.nextAt>=0&&this.game.time>=this.nextAt){this.nextAt=-1;this.index++;this.startJob();}
    // Trucks roll along each road at a speed set by its current (trucks per second ∝ amps).
    if(!this.plain){for(const lane of this.lanes){const s=lane.seg,A=this.node(s.a),B=this.node(s.b),len=Math.max(.05,A.distanceTo(B)),i=this.amp(s.id);
      const speed=Math.max(-2.2,Math.min(2.2,i*.1));const dir=B.clone().sub(A),yaw=Math.atan2(-dir.z,dir.x)+(speed<0?Math.PI:0),pitch=Math.atan2(dir.y*(speed<0?-1:1),Math.hypot(dir.x,dir.z));
      for(const tr of lane.trucks){tr.t=((tr.t+dt*speed/len)%1+1)%1;const p=A.clone().lerp(B,tr.t);tr.g.position.set(p.x,p.y+.035,p.z);tr.g.rotation.set(0,yaw,pitch);
        // Cargo is the energy each truck carries: its height above the return (volts).
        const vHere=Math.max(0,(this.y(s.a)+(this.y(s.b)-this.y(s.a))*tr.t-BASE)/K);tr.crate.scale.y=Math.max(.006,vHere*.0026);tr.crate.position.y=.032+tr.crate.scale.y/2;tr.crate.visible=vHere>.3;}}}
    const r=this.shown_();r.devices.forEach(d=>{const v=this.bays[d.bay];if(v.rotor)v.rotor.rotation.x+=dt*d.v*1.2;});
    this.updatePanel();
  }

  // ---------- panels ----------
  private say(text:string,tone:'ok'|'bad'|'info'='info'){
    if(!this.toast){this.toast=document.createElement('div');this.toast.className='station-toast';this.layer()?.append(this.toast);}
    this.toast.textContent=text;this.toast.dataset.tone=tone;this.toast.hidden=false;this.toastUntil=this.game.time+Math.max(4,text.length*.06);
  }
  private layer(){return document.querySelector<HTMLElement>('[data-layer="hud"]');}
  private updatePanel(){
    if(this.toast&&!this.toast.hidden&&this.game.time>this.toastUntil&&this.game.running)this.toast.hidden=true;
    const job=this.current(),l=this.layout,r=this.now;
    const key=JSON.stringify([this.active,this.index,l,this.tripped,this.tripLog,this.plain,this.probeAt,[...this.probed],this.carts]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel dp-panel';this.layer()?.append(this.panel);}
    this.panel.hidden=!job;if(!job)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const head=`<header><small>JOB ${this.index+1}/${JOBS.length} · ${job.name.toUpperCase()}</small><h4>${job.goal}</h4><p>${job.story}</p></header>`;
    if(!this.active){this.panel.innerHTML=head;return;}
    const devs=l.bays.map((b,k)=>{if(!b.device||b.device==='jumper')return '';const d=r.devices.find(x=>x.bay===k)!,spec=DEVICES[b.device];
      const need=isRequired(b.device)?`needs ${BAND.lo}–${BAND.hi} V, ≤ ${spec.iMax} A`:'not needed';
      const ok=isRequired(b.device)?!b.barrier&&d.v>=BAND.lo&&d.v<=BAND.hi&&d.i<=spec.iMax!:b.barrier||Math.abs(d.i)<1e-3;
      return `<tr class="${ok?'ok':'no'}"><td><b>${cap(spec.name)}</b><small>${need}</small></td><td>${b.barrier?'blocked':volts(d.v)}</td><td>${b.barrier?'—':amps(d.i)}</td><td>${b.barrier?'—':watts(d.p)}</td></tr>`;}).join('');
    const pr=probe(l,r,this.probeAt);
    this.panel.innerHTML=head+
      `<table class="dp-table"><tr><th></th><th>V</th><th>A</th><th>W</th></tr><tr class="${l.on?'':'no'}"><td><b>Source</b><small>E ${fmt(l.e,1)} V · breaker ${this.tripped?'TRIPPED':l.on?'on':'off'}</small></td><td>${volts(r.terminal)}</td><td>${amps(r.current)}</td><td>${watts(r.pSource)}</td></tr>${devs}</table>`+
      `<p class="dp-loss">Lost as heat in the rails and the source: <b>${watts(r.pSource-r.devices.reduce((s,d)=>s+d.p,0))}</b></p>`+
      (this.tripped?`<p class="dp-warn">Breaker trip log: ${this.tripLog}.</p>`:'')+
      `<p class="dp-meter">Meter on <b>${PROBE_NAMES[this.probeAt]}</b>: ${volts(pr.v)} across, ${amps(pr.i)} through${Math.abs(pr.i)<1e-3&&Math.abs(pr.v)>1?' (voltage, but nothing flowing)':''}.</p>`+
      (job.meterCheck?`<p class="dp-check">Meter check: ${['bay1','bay3'].map(p=>`${PROBE_NAMES[p as Probe]} ${this.probed.has(p as Probe)?'✓':'·'}`).join('  ')}${this.plain?'':' (switch to METER view)'}</p>`:'')+
      `<p class="profile">${this.plain?'Plain meter: V across, A through, W = V × A.':'Analogy: a truck ≈ charge, its cargo ≈ energy, road height ≈ potential, trucks per second ≈ current. Trucks aren\'t used up at a device, and voltage isn\'t a number of trucks.'} Depot values; devices modelled as fixed loads.</p>`;
  }

  /** What the pointer is over, in words (the labels on the table are small). */
  private hoverHint():Prompt|null{
    const h=this.hovered;if(!h||!this.active)return null;const l=this.layout;
    switch(h.act){
      case 'knob':return {key:'←→',text:'Drag sideways (or press ← →) to set the source E (energy per unit of charge)'};
      case 'nudge':return {key:(h.arg as number)>0?'→':'←',text:`Click to ${(h.arg as number)>0?'raise':'lower'} the source by 0.1 V`};
      case 'breaker':return {key:'B',text:this.tripped?'Reset the breaker (clear what tripped it first)':l.on?'Switch the breaker off':'Switch the breaker on'};
      case 'rail':{const [slot,kind]=h.arg as ['feed'|'ret','thin'|'heavy'];const R=RAILS[kind];return {key:slot==='feed'?'F':'R',text:`Click to fit a ${kind} ${slot==='feed'?'feed':'return'} rail (${fmt(R.r,2)} Ω, rated ${R.rating} A)`};}
      case 'swapRail':return {key:h.arg==='feed'?'F':'R',text:'Click to swap this rail section (thin ↔ heavy)'};
      case 'barrier':{const k=h.arg as number,b=l.bays[k-1];return {key:String(k),text:b.barrier?`Lift bay ${k}'s barrier (close its loop)`:`Lower bay ${k}'s barrier (open its loop)`};}
      case 'deviceClick':{const k=h.arg as number;return l.bays[k-1]?.device==='jumper'?{key:'X',text:`Click to remove the crossover rail from bay ${k}`}:{key:'P',text:`Click to probe bay ${k} with the meter`};}
      case 'probe':return {key:'P',text:`Probe ${PROBE_NAMES[h.arg as Probe]}: volts across, amps through`};
      case 'view':return {key:'M',text:this.plain?'Back to the truck picture':'Plain meter view: no trucks, just the circuit'};
      case 'dispatch':return {key:'Enter',text:'DISPATCH: check the job'};
    }
    return null;
  }
  prompt(atBench:boolean):Prompt|null{
    const job=this.current();if(!job)return null;
    if(atBench&&this.cartsReady()){const h=this.hoverHint();if(h)return h;}
    if(!atBench){const p=this.game.player.translation(),held=this.game.held?.spec.id;
      if((held==='lampcart'||held==='motorcart')&&Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<3.4)return {key:'E',text:`Park the ${held==='lampcart'?'lamp':'motor'} cart by the bench`};
      if(Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6)return this.cartsReady()?{key:'E',text:'Work at the dispatch bench'}:{key:'E',text:'Work at the bench (the device carts are still on the dock)'};
      return walkHint(this.game,!this.carts.lamp?'Fetch the lamp cart from the loading dock (yellow arrow)':!this.carts.motor?'Fetch the motor cart from the loading dock (yellow arrow)':'Walk to the dispatch bench (yellow arrow)');}
    if(!this.cartsReady())return {key:'E',text:'Step back and bring the lamp and motor carts from the loading dock'};
    const l=this.layout,v=judge(job,l);
    if(job.id==='socket'){
      if(l.ret==='gap')return this.probeAt!=='return'?{key:'P',text:'Click RETURN on the meter (P steps the probe): volts across the gap, no current'}:{key:'R',text:'Fit a return rail: click THIN or HEAVY RETURN'};
      if(v.tier===0)return {key:'←→',text:'Tune the source until the lamp reads 12 V'};
      return {key:'Enter',text:v.tier<3?'Works. Closer to 12 V and less loss would be elegant; then DISPATCH':'DISPATCH the job'};}
    if(job.id==='pair'){
      if(!l.bays[1].barrier)return {key:'2',text:'The heater isn\'t needed: lower bay 2\'s barrier'};
      if(l.bays[2].barrier)return {key:'3',text:'Lift bay 3\'s barrier to put the motor in the loop'};
      if(this.tripped)return {key:'B',text:'Reset the breaker'};
      if(l.feed!=='heavy')return {key:'F',text:'The thin feed rail runs hot: click HEAVY FEED'};
      if(v.tier<3)return {key:'←→',text:'Tune the source until both devices read 12 V'};
      return {key:'Enter',text:'DISPATCH the job'};}
    if(l.bays.some(b=>b.device==='jumper'&&!b.barrier))return {key:'X',text:'Find the short: probe the bays, then click the bare crossover rail to remove it'};
    if(this.tripped||!l.on)return {key:'B',text:'Short cleared: reset the breaker'};
    if(!this.plain)return {key:'M',text:'Switch to the plain METER view for the final check'};
    if(!this.probed.has('bay1')||!this.probed.has('bay3'))return {key:'P',text:'Probe BAY 1 and BAY 3 with the meter'};
    if(v.tier<3)return {key:'←→',text:'Tune the source until both devices read 12 V on the meter'};
    return {key:'Enter',text:'DISPATCH the job'};
  }
  complete(){return this.served.length>=JOBS.length;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){const r=this.now,pr=probe(this.layout,r,this.probeAt);
    return {index:this.index,job:this.current()?.id??null,layout:clone(this.layout),tripped:this.tripped,plain:this.plain,probe:this.probeAt,probed:[...this.probed],
      meter:{v:+pr.v.toFixed(3),i:+pr.i.toFixed(4)},current:+r.current.toFixed(4),waste:+r.waste.toFixed(3),
      devices:r.devices.map(d=>({bay:d.bay+1,kind:d.kind,v:+d.v.toFixed(3),i:+d.i.toFixed(4)})),racing:this.raceT>0,
      carts:{...this.carts},served:this.served,mistakes:this.mistakes,spent:this.spent,lanes:this.lanes.length};}
}
const cap=(s:string)=>s[0].toUpperCase()+s.slice(1);

// ---------- models and textures ----------
let hazard:T.Texture|undefined;
function hazardTex(){if(!hazard)hazard=canvasTex(64,64,c=>{c.fillStyle='#ffc629';c.fillRect(0,0,64,64);c.fillStyle=INK;for(let k=-64;k<128;k+=24){c.beginPath();c.moveTo(k,0);c.lineTo(k+12,0);c.lineTo(k-52,64);c.lineTo(k-64,64);c.fill();}});return hazard;}
let yard:T.Texture|undefined;
function yardTexture(){if(!yard)yard=canvasTex(1024,360,c=>{c.fillStyle='#e6edf4';c.fillRect(0,0,1024,360);c.strokeStyle='rgba(63,127,214,.55)';c.lineWidth=6;c.setLineDash([26,18]);
  for(const y of [52,308])c.beginPath(),c.moveTo(20,y),c.lineTo(1004,y),c.stroke();c.setLineDash([]);c.strokeStyle='rgba(63,127,214,.25)';c.lineWidth=3;c.strokeRect(10,10,1004,340);});return yard;}
const truckParts=(()=>{let made:{body:T.BufferGeometry;cab:T.BufferGeometry;base:T.BufferGeometry;crate:T.BufferGeometry;mats:T.Material[]}|undefined;
  return ()=>made??=( {body:rbox(.09,.028,.06,.014),cab:rbox(.034,.042,.058,.012),base:box(.096,.014,.064),crate:new T.BoxGeometry(.042,1,.036),mats:[toon(ORANGE),toon(CREAM),toon(INK),toon(CARGO)]});})();
function truckModel(){
  const p=truckParts(),g=new T.Group();g.rotation.order='YZX';
  part(g,p.base,p.mats[2],0,.0,0,false);part(g,p.body,p.mats[0],-.006,.019,0,false);part(g,p.cab,p.mats[1],.032,.034,0,false);
  const crate=part(g,p.crate,p.mats[3],-.01,.04,0,false);return {g,crate};
}
