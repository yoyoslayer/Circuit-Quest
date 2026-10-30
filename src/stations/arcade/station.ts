// Overheating Arcade service bench ("candy resistors"). The broken cabinet's LED channel is opened up
// on the bench: SUPPLY → self-resetting FUSE → a three-position CHAIN socket → LED (or, for the coin
// hopper, a transistor's base), with an ACROSS slot wired straight across the LED.
// Pip takes chunky resistor blocks from four bins (47, 100, 220, 470 Ω), stands them in the chain
// (positions add; two blocks side by side in one position share the current), flips the LED if it is
// in backwards and switches the POWER on. The circuit is live: every change shows on the meter at once.
// A kid play-tests the cabinet while it runs in spec; then it can be signed off.
// Too much current trips the PTC fuse (it glows, cools and conducts again by itself); an overloaded
// block pops off the board; an LED driven far past its rating pops and a spare goes in. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressArcade,type ArcadeRoom} from './room';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,INK} from '../../render/kit';
import {hot} from '../../render/actors';
import {JOBS,rushJob,BLOCKS,BLOCK_RATING,BLOCK_COST,PER_POSITION,HOUSE,read,judge,best,mA,ohms,watts,partsCost,positionR,starZone,TIER_WORD,
  type Block,type Chain,type Job,type Setup,type Reading,type Verdict,type LedColor} from './logic';
import './arcade.css';
import {cheer} from '../shared';
import {rng} from '../../render/textures';

/** Arcade Rush (level arcade-rush): three minutes of cabinets, each play-tested for a shorter run. */
export const RUSH_TIME=180,RUSH_SOAK=2;

const CREAM='#fbf3e2',PLUM='#3b2346',PINK='#ff7eb6',MINT='#6fe0c0',LEMON='#ffd84d',GRAPE='#9b7bf0';
const LED_HEX:Record<LedColor,string>={red:'#ff4b5c',green:'#4dff88',blue:'#4d9bff',white:'#fff6e0'};
/** Every block value has its own candy colour, the same on the bin, the block and the panel. */
const CANDY:Record<Block,string>={47:'#ff8fbf',100:'#7fe6c6',220:'#ffd95e',470:'#b39bff'};
/** The bench's contents sit a little left of the camera's centre (the order card is on the right). */
const OX=-.2;
/** Board layout (board-local metres): the top rail carries the supply, the bottom rail is ground. */
const BW=2.1,BD=.74,TOPZ=-.2,GNDZ=.16,MIDZ=(TOPZ+GNDZ)/2,LABZ=.29,SUPX=-.9,FUSEX=-.64,LEDX=.47,ACRX=.84;
/** The chain socket's three positions along the top rail, and where a side-by-side pair stands. */
const POSX=[-.36,-.1,.16],PAIRZ=.065,PADW=.22;
const BOARD={x:.12,z:.16};
const BINSAT={x:-1.5,z:.12},METER={x:.1,z:-.56},POWERAT={x:1.36,z:.38};
const BAND_COLORS=['#1d1d24','#8a4b2a','#e5484d','#ff8a3d','#ffd84d','#3fae5a','#3f7fd6','#8b5cc7','#9aa0ad','#fbfbf6'];
const POS_LETTERS=['A','S','D'];

// ---------- canvas helpers ----------
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
function drawPlate(c:CanvasRenderingContext2D,text:string,bg:string,fg:string,w:number,h:number){
  c.clearRect(0,0,w,h);c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(18,h*.25));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
  let size=Math.round(h*.56);c.font=FONT(size);while(size>10&&c.measureText(text).width>w-24){size--;c.font=FONT(size);}
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);
}
const labels=new Map<string,T.Texture>();
/** Label plate texture; the type shrinks until the words fit. Cached by content. */
function label(text:string,bg=CREAM,fg=INK,w=256,h=80){const k=`${text}|${bg}|${fg}|${w}|${h}`;let t=labels.get(k);if(!t){t=canvasTex(w,h,c=>drawPlate(c,text,bg,fg,w,h));labels.set(k,t);}return t;}
function flatMat(map:T.Texture){const m=new T.MeshBasicMaterial({map,transparent:true});m.userData.outlineParameters={visible:false};return m;}
/** A label plate lying on a surface (tilt -π/2) or leaning (tilt 0 = upright). */
function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,w=.4,tilt=-Math.PI/2,bg=CREAM,fg=INK,h=w*80/256){
  const p=part(parent,new T.PlaneGeometry(w,h),flatMat(label(text,bg,fg,256,Math.round(256*h/w))),x,y,z,false);p.rotation.x=tilt;p.userData.noAO=true;return p;
}
class Live {canvas=document.createElement('canvas');tex:T.CanvasTexture;key='';
  constructor(w:number,h:number){this.canvas.width=w;this.canvas.height=h;this.tex=new T.CanvasTexture(this.canvas);this.tex.colorSpace=T.SRGBColorSpace;this.tex.anisotropy=4;}
  draw(key:string,fn:(c:CanvasRenderingContext2D,w:number,h:number)=>void){if(key===this.key)return;this.key=key;fn(this.canvas.getContext('2d')!,this.canvas.width,this.canvas.height);this.tex.needsUpdate=true;}
}
/** Colour bands for an E12 value: two digits and a multiplier. */
function bands(r:number){const e=Math.floor(Math.log10(r))-1,d=Math.round(r/10**e);return [Math.floor(d/10),d%10,e];}
/** A candy resistor block: a chunky rounded body in its value's colour, painted with the real colour
 *  bands, brass end caps where the current goes in and out (along x), and its value on top. */
function blockMesh(r:Block){
  const g=new T.Group();
  const body=part(g,rbox(.17,.07,.1,.028),toon(CANDY[r]),0,.035,0);body.name='body';
  const [a,b,m]=bands(r);[a,b,m].forEach((d,k)=>part(g,box(.012,.052,.104),toon(BAND_COLORS[d]),-.06+k*.022,.03,0,false));
  part(g,box(.012,.052,.104),toon('#d9a441'),.06,.03,0,false);
  for(const x of [-.091,.091])part(g,rbox(.02,.044,.07,.008),toon('#e2b65a'),x,.032,0,false);
  const tag=sign(g,`${r}`,0,.0715,0,.12,-Math.PI/2,CREAM,INK,.07);tag.renderOrder=1;
  return g;
}

interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
type Slot=number|'across';
interface Heat {led:number;blocks:number[][];across:number}
const zeroHeat=(c:Chain):Heat=>({led:0,blocks:c.map(p=>p.map(()=>0)),across:0});

export class ArcadeBench implements Station {
  readonly view={distance:5.9,pitch:.98,lookY:.3};
  readonly limits={time:480,damage:2,cost:0};
  readonly stand={x:0,z:-1.55};readonly table=new T.Vector3(0,1,-2.45);readonly facing=Math.PI;
  index=0;setup:Setup;held?:Block;powered=false;soak=0;soakDone=false;verdict?:Verdict;heat:Heat;
  /** The PTC fuse: tripped while hot; it conducts again once `cooling` runs out. */
  tripped=false;cooling=0;
  served:{job:string;tier:number;cost:number}[]=[];mistakes=0;spent=0;trayReady=false;active=false;trips=0;
  readonly job:StationJob;
  readonly rush:boolean;private jobs:Job[];private random=rng(20261029);
  /** Seconds the kid plays the cabinet, in spec, before it can be signed off. */
  get soakTime(){return this.rush?RUSH_SOAK:HOUSE.soak;}
  private top=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;private room?:ArcadeRoom;
  private board=new Live(1024,360);private meter=new Live(900,520);private marquee=new Live(512,128);
  private binsGroup=new T.Group();private bins=new Map<Block,T.Group>();private heldMesh?:T.Group;private heldKey='';
  private posGroups:T.Group[]=[];private posContent:T.Group[]=[];private posKeys=['','',''];private links:T.Object3D[]=[];private bodies:T.Mesh[][]=[[],[],[]];
  private acrossGroup!:T.Group;private acrossContent!:T.Group;private acrossKey='';private acrossBody?:T.Mesh;
  private ledGroup=new T.Group();private ledDome!:T.Mesh;private ledHalo!:T.Sprite;private ledLight!:T.PointLight;private transistor=new T.Group();private motor=new T.Group();private coin!:T.Object3D;
  private fuseDisc!:T.Mesh;private fuseHot=unlitMat();private fuseHalo!:T.Sprite;private lever!:T.Object3D;private powerLamp!:T.Mesh;private signBtn!:T.Mesh;
  private cabLamp!:T.Mesh;private ledOn=unlitMat();private cabOn=unlitMat();private screenOn=hot('#3a2b58',1.2);private screenOff=toon('#241a33');private lampOff=toon('#5a4a60');private cabHalo!:T.Sprite;private cabScreen!:T.Mesh;
  private kid=new T.Group();private kidBody=new T.Group();private kidArms:T.Object3D[]=[];
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';
  /** Time the current fault has lasted (s), how long this setup has run, and whether it was explained. */
  private tripT=0;private runT=0;private explained=false;private faultCounted=false;private ledT=0;private ledDead=0;
  private spin=0;private flicker=0;private smokeT=0;private hop=0;
  private tray?:Game['props'][number];private trayRide=new T.Group();private ready=false;
  constructor(private game:Game){
    this.rush=game.level.id==='arcade-rush';this.jobs=this.rush?[]:[...JOBS];this.setup=clone(this.current()!.start);this.heat=zeroHeat(this.setup.chain);
    this.limits.cost=this.rush?24:Math.ceil(JOBS.reduce((n,j)=>n+partsCost({chain:best(j)??[],reversed:false}),0)*1.25);
    if(this.rush){this.limits.time=RUSH_TIME+10;this.limits.damage=3;}
    const carry={text:'Carry the tray of resistor blocks from the storeroom to the service bench',done:()=>this.trayReady,at:()=>this.tray?.body.translation()??this.stand};
    const step={text:'Step up to the service bench (E)',done:()=>this.active||this.served.length>0,at:()=>this.stand};
    this.job=this.rush?{goal:`Arcade Rush: fix as many cabinets as you can in ${RUSH_TIME/60} minutes`,
      steps:[carry,step,{text:'Fix cabinets until the clock runs out',done:()=>this.complete(),at:()=>this.stand}],
      bonuses:[
        {text:'Eight cabinets or more',ok:()=>this.served.length>=8},
        {text:'Every one reliable',ok:()=>this.served.length>0&&this.served.every(s=>s.tier>=2)},
        {text:'Fuse tripped no more than once',ok:()=>this.trips<=1}]}:{goal:'Fix five arcade cabinets with candy resistors',
      steps:[carry,step,...JOBS.map((j,i)=>({text:`${j.title}: ${j.ask}`,done:()=>this.served.length>i,at:()=>this.stand}))],
      bonuses:[
        {text:'Every cabinet reliable',ok:()=>this.served.every(s=>s.tier>=2)},
        {text:'Every cabinet in the ★ zone',ok:()=>this.served.every(s=>s.tier===3)},
        {text:'Fuse tripped no more than once',ok:()=>this.trips<=1}]};
    game.root.add(this.top);this.top.position.copy(this.table).add(new T.Vector3(OX,0,0));
    this.build();this.showJob();
  }
  dress(kit:RoomKit){const r=dressArcade(this.game,kit);this.room=r;return {lightUp:r.lightUp};}
  current():Job|undefined{
    if(this.rush){if(this.game.time>=RUSH_TIME)return undefined;while(this.jobs.length<=this.index+2)this.jobs.push(rushJob(this.random,this.jobs.length));}
    return this.jobs[this.index];}
  reading():Reading|undefined{const j=this.current();return j&&read(j,this.setup);}
  /** Current only flows while the bench is on and the fuse is cool. */
  private get live(){return this.powered&&!this.tripped&&this.ledDead<=0;}

  // ---------- the bench ----------
  private build(){
    const g=this.game,t=this.table,W=4.3,D=1.45,cx=t.x+OX,top=this.top;
    // Bench: plum cabinet with candy trim, pale wood top, a pink felt mat under the channel board.
    part(g.decorRoot,rbox(W,.94,D,.07),toon('#f1e4cc'),cx,.47,t.z);part(g.decorRoot,box(W-.1,.1,D-.08),toon(PLUM),cx,.05,t.z+.02);
    part(g.decorRoot,rbox(W+.1,.07,D+.1,.05),toon('#ecd6ad'),cx,.975,t.z);part(g.decorRoot,box(W+.08,.035,.03),toon(PINK),cx,.94,t.z+D/2+.05);
    for(let k=0;k<4;k++)part(g.decorRoot,box(.95,.54,.02),toon(['#ffd1e3','#cdf5e6','#fff0b8','#e3d9ff'][k]),cx-1.5+k*1,.5,t.z+D/2+.005);
    this.solid(W,1,D,cx,.5,t.z);
    part(top,rbox(2.3,.012,.92,.06),toon('#f7b7d2'),BOARD.x,.035,BOARD.z);
    this.buildBoard();this.buildMeter();this.buildBins();this.buildPower();this.buildCabinet();
  }
  /** The channel board: printed rails, the fuse, the chain socket, the ACROSS slot and the LED. */
  private buildBoard(){
    const b=group(this.top,BOARD.x,.045,BOARD.z);
    part(b,rbox(BW,.03,BD,.05),toon('#2f7a5b'),0,.015,0);
    const face=part(b,new T.PlaneGeometry(BW-.04,BD-.04),new T.MeshBasicMaterial({map:this.board.tex}),0,.031,0,false);face.rotation.x=-Math.PI/2;(face.material as T.Material).userData.outlineParameters={visible:false};face.userData.noAO=true;
    // Supply terminal: two brass posts (+ on the top rail, − on ground).
    for(const [z,c] of [[TOPZ,'#e5484d'],[GNDZ,'#2b2d42']] as const){part(b,cyl(.04,.045,.05,14),toon(c),SUPX,.055,z);part(b,cyl(.022,.022,.04,10),toon('#d9a441'),SUPX,.09,z);}
    // The PTC fuse: a yellow disc on two legs. Tripped, it glows red and cools back to yellow.
    this.fuseDisc=part(b,cyl(.06,.06,.03,20,'z'),toon(LEMON),FUSEX,.09,TOPZ);
    for(const x of [-.03,.03])part(b,cyl(.006,.006,.06,6),toon('#c9ced8'),FUSEX+x,.055,TOPZ,false);
    this.fuseHalo=glow(b,'rgba(255,90,60,1)',.5,0);this.fuseHalo.position.set(FUSEX,.12,TOPZ);
    // The chain socket: three pads in a row on the top rail. An empty pad is bridged by a wire link.
    POSX.forEach((x,k)=>{const pg=group(b,x,.036,TOPZ);part(pg,rbox(PADW,.012,.27,.04),toon('#173a2c'),0,0,0);
      for(const sx of [-1,1])part(pg,box(.02,.008,.24),toon('#d9a441'),sx*(PADW/2-.018),.008,0,false);
      const link=group(pg,0,0,0);part(link,cyl(.009,.009,.17,6,'x'),toon('#dfe3ea'),0,.03,0,false);for(const sx of [-.085,.085])part(link,cyl(.009,.009,.03,6),toon('#dfe3ea'),sx,.015,0,false);
      const content=group(pg,0,.006,0);this.posGroups.push(pg);this.posContent.push(content);this.links.push(link);this.click(pg,'slot',k);});
    // The ACROSS slot stands between the rails beside the LED, wired straight across it.
    this.acrossGroup=group(b,ACRX,.036,MIDZ);part(this.acrossGroup,rbox(.16,.012,.3,.04),toon('#173a2c'),0,0,0);
    this.acrossContent=group(this.acrossGroup,0,.006,0);this.acrossContent.rotation.y=Math.PI/2;this.click(this.acrossGroup,'slot','across');
    // The LED stands between the rails: dome, rim with a flat (cathode side), and two legs.
    const lg=this.ledGroup;b.add(lg);lg.position.set(LEDX,.03,MIDZ);
    for(const z of [-.1,.1])part(lg,cyl(.006,.006,.06,6),toon('#c9ced8'),0,.03,z,false);
    part(lg,box(.012,.01,.23),toon('#c9ced8'),0,.004,0,false);
    const rim=part(lg,cyl(.075,.075,.02,24),toon('#e8e2d6'),0,.07,0);rim.userData.noAO=true;
    part(lg,box(.02,.022,.08),toon('#e8e2d6'),0,.07,.072); // the flat on the rim marks the cathode
    this.ledDome=part(lg,sphere(.065,20,14),toon('#ffb3bb'),0,.09,0);this.ledDome.scale.y=1.25;
    const plus=part(lg,box(.05,.012,.014),toon('#e5484d'),.09,.05,-.1,false);part(lg,box(.014,.012,.05),toon('#e5484d'),.09,.05,-.1,false);plus.userData.noAO=true;
    this.ledHalo=glow(lg,'rgba(255,120,120,1)',.8,0);this.ledHalo.position.y=.14;
    this.ledLight=new T.PointLight('#ff5566',0,1.6,1.8);this.ledLight.position.set(0,.25,0);lg.add(this.ledLight);
    this.click(lg,'flip');
    // Coin hopper: a TO-92 transistor where the LED sits, and the hopper motor with its coin wheel.
    const tr=this.transistor;b.add(tr);tr.position.set(LEDX,.03,MIDZ);
    const bodyT=part(tr,cyl(.06,.06,.12,20),toon('#2b2d42'),0,.09,0);bodyT.scale.z=.6;part(tr,box(.12,.12,.012),toon('#2b2d42'),0,.09,.034);
    for(const x of [-.035,0,.035])part(tr,cyl(.005,.005,.05,6),toon('#c9ced8'),x,.025,0,false);
    const mo=this.motor;this.top.add(mo);mo.position.set(1.1,.04,-.46);part(mo,rbox(.42,.05,.34,.04),toon(PLUM),0,.025,0);
    part(mo,cyl(.075,.075,.22,18,'x'),toon('#9aa0ad'),-.04,.13,-.04);part(mo,cyl(.079,.079,.03,18,'x'),toon(INK),-.15,.13,-.04);
    this.coin=group(mo,.1,.13,-.04);part(this.coin,cyl(.1,.1,.02,24,'x'),toon('#d9a441'),0,0,0);for(let k=0;k<4;k++)part(this.coin,cyl(.022,.022,.024,10,'x'),toon('#fff0b8'),0,Math.cos(k*1.57)*.06,Math.sin(k*1.57)*.06);
  }
  /** The meter: an upright candy cabinet with a live screen, leaning back toward the camera. */
  private buildMeter(){
    const m=group(this.top,METER.x,.04,METER.z);part(m,rbox(1.56,.08,.42,.06),toon(PLUM),0,.04,0);
    const body=group(m,0,.08,-.04);body.rotation.x=-.42;part(body,rbox(1.5,.9,.16,.08),toon('#ffe3ee'),0,.45,0);part(body,box(1.38,.8,.03),toon(INK),0,.46,.08);
    const screen=part(body,new T.PlaneGeometry(1.32,.762),new T.MeshBasicMaterial({map:this.meter.tex,toneMapped:false}),0,.46,.097,false);(screen.material as T.Material).userData.outlineParameters={visible:false};screen.userData.noAO=true;
    part(body,box(1.52,.05,.18),toon(PINK),0,.92,0);
  }
  /** Four candy bins (they appear once the tray arrives), each heaped with blocks of one value. */
  private buildBins(){
    const r=this.binsGroup;this.top.add(r);r.position.set(BINSAT.x,.04,BINSAT.z);
    part(r,rbox(.98,.04,.76,.05),toon('#e9c38e'),0,.02,0);
    const pick=rng(7);
    BLOCKS.forEach((v,k)=>{const x=k%2?.23:-.23,z=k<2?-.18:.2,bg=group(r,x,.04,z);
      const col=CANDY[v],rim=new T.Color(col).multiplyScalar(.8).getStyle();
      part(bg,rbox(.42,.02,.32,.03),toon(rim),0,.01,0);
      for(const [w,d,bx,bz] of [[.42,.025,0,-.15],[.42,.025,0,.15],[.025,.32,-.2,0],[.025,.32,.2,0]] as const)part(bg,rbox(w,.1,d,.012),toon(col),bx,.06,bz);
      for(let n=0;n<4;n++){const blk=blockMesh(v);blk.position.set(-.1+(n%2)*.2+(pick()-.5)*.04,.02+Math.floor(n/2)*.04,-.06+Math.floor(n/2)*.1);blk.rotation.y=(pick()-.5)*.6;blk.scale.setScalar(.92);bg.add(blk);}
      this.bins.set(v,bg);this.click(bg,'pick',v);});
    r.visible=false;
  }
  /** Bench supply with its big POWER lever, and the SIGN OFF button in front of it. */
  private buildPower(){
    const p=group(this.top,POWERAT.x,.04,POWERAT.z-.18);part(p,rbox(.46,.2,.4,.06),toon(MINT),0,.1,0);part(p,box(.48,.03,.42),toon(PLUM),0,.205,0);
    const lv=group(p,0,.2,-.04);part(lv,rbox(.2,.04,.16,.03),toon(INK),0,.02,0);this.lever=group(lv,0,.04,0);part(this.lever,cyl(.018,.018,.2,10),toon('#c9ced8'),0,.1,0);part(this.lever,sphere(.05,14,10),toon('#e5484d'),0,.21,0);
    this.powerLamp=part(p,sphere(.035,12,8),toon('#5a4a60'),-.16,.23,.12);
    this.click(p,'power');
    // The sign-off button: a big round stamp with a tick on it.
    const s=group(this.top,POWERAT.x+.52,.04,POWERAT.z+.14);part(s,cyl(.17,.19,.06,24),toon(INK),0,.03,0);this.signBtn=part(s,cyl(.13,.13,.06,24),toon('#8a9a8e'),0,.08,0);this.click(s,'signoff');
    sign(s,'✓',0,.112,0,.16,-Math.PI/2,'#fffaf0',INK,.16);
  }
  /** The cabinet being serviced stands at the bench's left end, back open, ribbon cable to the board,
   *  with a kid waiting to play it. */
  private buildCabinet(){
    const t=this.table,c=group(this.game.root,t.x+OX-2.75,0,t.z-.35,.38);
    part(c,rbox(.95,1.2,.8,.08),toon('#ff9fc8'),0,.6,0);part(c,rbox(1,.1,.85,.05),toon(PLUM),0,.05,0);
    const head=group(c,0,1.2,-.05);head.rotation.x=.12;part(head,rbox(.95,.7,.7,.08),toon('#ff9fc8'),0,.35,0);
    this.cabScreen=part(head,box(.72,.46,.03),toon('#241a33'),0,.36,.35);
    part(c,rbox(.97,.08,.5,.03),toon(PLUM),0,1.2,.25);for(const [x,col] of [[-.2,'#e5484d'],[0,LEMON],[.2,'#3f7fd6']] as const)part(c,cyl(.05,.05,.04,16),toon(col),x,1.26,.35);
    const mq=group(c,0,2.02,.05);part(mq,rbox(1,.28,.3,.06),toon(PLUM),0,0,0);const face=part(mq,new T.PlaneGeometry(.92,.23),new T.MeshBasicMaterial({map:this.marquee.tex,toneMapped:false}),0,0,.155,false);(face.material as T.Material).userData.outlineParameters={visible:false};
    this.cabLamp=part(c,sphere(.07,14,10),toon('#5a4a60'),0,1.02,.41);this.cabHalo=glow(c,'rgba(255,140,150,1)',.9,0);this.cabHalo.position.set(0,1.02,.5);
    const cable=new T.CatmullRomCurve3([new T.Vector3(.35,.9,-.2),new T.Vector3(.9,.6,.1),new T.Vector3(1.45,.95,.3),new T.Vector3(1.8,1.05,.5)]);
    part(c,new T.TubeGeometry(cable,24,.03,8),toon(GRAPE),0,0,0);
    this.solid(1,2.2,.9,t.x+OX-2.75,1.1,t.z-.35);
    // The play tester: a small kid at the controls. They hop while the cabinet works and slump when it is dark.
    const k=this.kid;c.add(k);k.position.set(.05,0,.72);k.rotation.y=Math.PI;
    for(const x of [-.07,.07])part(k,cyl(.045,.04,.42,10),toon('#3f5a8a'),x,.21,0);
    const b=this.kidBody;k.add(b);b.position.y=.42;
    part(b,cyl(.13,.15,.36,14),toon('#ff8a3d'),0,.18,0);part(b,box(.27,.05,.02),toon(LEMON),0,.24,-.14,false);
    part(b,sphere(.13,16,12),toon('#f2c49b'),0,.5,0);const hair=part(b,sphere(.135,16,10),toon('#5b3a29'),0,.55,-.03);hair.scale.set(1,.7,1);
    for(const x of [-.17,.17]){const arm=group(b,x,.32,0);part(arm,cyl(.035,.03,.28,8),toon('#ff8a3d'),0,-.13,0);part(arm,sphere(.04,8,6),toon('#f2c49b'),0,-.28,0);arm.rotation.x=-.9;this.kidArms.push(arm);}
    this.solid(.36,1,.3,c.position.x+Math.sin(.38)*.72,.5,c.position.z+Math.cos(.38)*.72);
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}

  // ---------- job flow ----------
  private showJob(){
    const j=this.current();
    this.board.draw(`b${this.index}`,(c,w,h)=>drawBoard(c,w,h,j));
    this.marquee.draw(`m${this.index}`,(c,w,h)=>drawMarquee(c,w,h,j?j.cabinet:'ALL FIXED',!j));
    const base=j?.load.kind==='base';this.ledGroup.visible=!!j&&!base;this.transistor.visible=!!base;this.motor.visible=!!base;
    if(j&&!base){const col=LED_HEX[(j.load as {color:LedColor}).color];(this.ledHalo.material as T.SpriteMaterial).color.set(col);this.ledLight.color.set(col);}
    this.redraw();
  }
  /** Something on the board changed: the play test starts over (the bench stays live). */
  private changed(){this.soak=0;this.soakDone=false;this.verdict=undefined;this.runT=0;this.explained=false;this.faultCounted=false;this.tripT=0;this.ledT=0;}
  private powerOff(){this.powered=false;this.changed();}
  act(name:string,arg?:unknown):boolean{
    const a=this.game.audio,j=this.current();
    if(!j)return false;
    if(!this.trayReady){this.say('The resistor blocks are still in the storeroom.');a.voice('hm',1.4);return false;}
    switch(name){
      case 'pick':{const v=Number(arg) as Block;if(!BLOCKS.includes(v))return false;
        if(this.held===v){this.held=undefined;a.tone(380,.05,.03,'triangle');break;}
        this.held=v;a.pop();break;}
      case 'slot':{const s=arg as Slot;
        if(s==='across'){
          if(this.held){if(this.setup.across)this.heat.across=0;this.setup.across=this.held;this.held=undefined;this.changed();a.plug();break;}
          if(this.setup.across){this.setup.across=undefined;this.heat.across=0;this.changed();a.tone(300,.06,.04,'triangle');break;}
          a.voice('hm',1.4);return false;}
        if(typeof s!=='number'||s<0||s>2)return false;const p=this.setup.chain[s];
        if(this.held){if(p.length>=PER_POSITION){this.say('Two side by side is all a position holds.');a.voice('hm',1.4);return false;}
          p.push(this.held);this.heat.blocks[s].push(0);this.held=undefined;this.changed();a.plug();break;}
        if(p.length){p.pop();this.heat.blocks[s].pop();this.changed();a.tone(300,.06,.04,'triangle');break;}
        a.voice('hm',1.4);return false;}
      case 'flip':{if(j.load.kind!=='led')return false;this.setup.reversed=!this.setup.reversed;this.changed();a.tone(this.setup.reversed?440:560,.06,.04,'triangle');a.pop();break;}
      case 'power':{
        if(this.powered){this.powerOff();a.noise(.03,.07,2500,'highpass');a.tone(220,.09,.04);break;}
        this.powered=true;this.changed();a.noise(.03,.07,2500,'highpass');a.tone(420,.09,.04);break;}
      case 'signoff':{
        if(!this.soakDone||!this.verdict){a.voice('hm',1.4);return false;}
        const v=this.verdict;this.served.push({job:j.id,tier:v.tier,cost:v.cost});this.spent+=v.cost;
        this.say(`${j.title}: ${TIER_WORD[v.tier]}${v.tier===3?' ★':''}`,'ok');
        a.cheer();a.bell(1319,.5,.05);cheer(this.game,this,LEMON);
        this.room?.light(this.index%5);
        this.index++;this.powerOff();this.held=undefined;this.tripped=false;this.cooling=0;
        this.setup=clone(this.current()?.start??{chain:[[],[],[]],reversed:false});this.heat=zeroHeat(this.setup.chain);this.showJob();return true;}
      case 'clear':{if(!this.held)return false;this.held=undefined;a.tone(380,.05,.03,'triangle');break;}
      default:return false;
    }
    this.redraw();return true;
  }
  /** Counts a fault (a mistake, and a trip if it tripped) once per arrangement on the board. */
  private fault(trip:boolean){if(this.faultCounted)return;this.faultCounted=true;this.mistakes++;if(trip)this.trips++;}
  /** Too much current: the PTC fuse trips with a click and glows; it conducts again once cool. */
  private trip(){
    const j=this.current()!,a=this.game.audio,first=!this.faultCounted;this.tripped=true;this.cooling=HOUSE.fuseCool;this.tripT=0;this.soak=0;this.fault(true);
    if(first)this.say(judge(j,this.setup).problems[0]??'The fuse tripped.','bad');
    a.noise(.05,.12,1800,'bandpass');a.tone(120,.35,.07,'square');if(first)a.voice('groan',1.1);
    const at=this.boardWorld(FUSEX,TOPZ);this.game.burst({x:at.x,y:at.y+.15,z:at.z},'#fff3a3',12,'spark');if(first)this.game.alarm({x:this.table.x,z:this.table.z},3);
    this.marquee.draw('tilt',(c,w,h)=>drawMarquee(c,w,h,'TILT!',false,true));this.redraw();
  }
  /** A block ran past its rating: it pops off the board with a puff of smoke and the bench cuts out. */
  private popBlock(pos:Slot,slot=0){
    const j=this.current()!,a=this.game.audio,r=read(j,this.setup);
    let v:Block,at:T.Vector3,p:number;
    if(pos==='across'){v=this.setup.across!;p=r.pP;this.setup.across=undefined;this.heat.across=0;at=this.boardWorld(ACRX,MIDZ);}
    else{v=this.setup.chain[pos][slot];p=r.blocks.find(b=>b.pos===pos&&b.slot===slot)?.p??0;this.setup.chain[pos].splice(slot,1);this.heat.blocks[pos].splice(slot,1);at=this.boardWorld(POSX[pos],TOPZ);}
    this.mistakes++;this.spent+=BLOCK_COST;this.powerOff();
    this.say(`The ${v} Ω block turned ${watts(p)} into heat (P = I²R). It is a ¼ W part: it popped.`,'bad');
    a.noise(.25,.1,900);a.pop();a.tone(150,.3,.05,'sawtooth');a.voice('alarm',1.2);
    this.game.burst({x:at.x,y:at.y+.08,z:at.z},CANDY[v],8,'debris');this.game.burst({x:at.x,y:at.y+.12,z:at.z},'#8a8a96',8,'smoke');this.game.alarm({x:this.table.x,z:this.table.z},3);this.redraw();
  }
  /** An LED driven far past its rating pops; a spare goes in after a moment. */
  private popLed(){
    const j=this.current()!,a=this.game.audio,why=judge(j,this.setup).problems[0];
    this.mistakes++;this.spent+=BLOCK_COST;this.ledDead=1.2;this.powerOff();
    this.say(why??'The LED ran far past its rating and popped.','bad');
    a.noise(.15,.12,2600,'bandpass');a.tone(90,.25,.06,'square');a.voice('groan',1.2);
    const at=this.boardWorld(LEDX,MIDZ);this.game.burst({x:at.x,y:at.y+.15,z:at.z},'#ffffff',1,'flash');this.game.burst({x:at.x,y:at.y+.15,z:at.z},'#8a8a96',10,'smoke');this.game.alarm({x:this.table.x,z:this.table.z},3);
  }
  private boardWorld(x:number,z:number){return this.top.localToWorld(new T.Vector3(BOARD.x+x,.1,BOARD.z+z));}

  // ---------- drawing ----------
  private redraw(){
    const j=this.current();
    // Blocks in the chain and across the LED (rebuilt only when they change), and the one in hand.
    this.setup.chain.forEach((p,k)=>{const key=p.join(',');if(key===this.posKeys[k])return;this.posKeys[k]=key;
      const c=this.posContent[k];c.clear();this.bodies[k]=[];this.links[k].visible=p.length===0;
      p.forEach((v,s)=>{const m=blockMesh(v);m.position.z=p.length===2?(s?PAIRZ:-PAIRZ):0;c.add(m);this.bodies[k].push(m.getObjectByName('body') as T.Mesh);});
      // A side-by-side pair is joined at both ends by brass bus bars, so both blocks carry the current.
      if(p.length===2)for(const x of [-.1,.1])part(c,box(.025,.03,.2),toon('#d9a441'),x,.02,0,false);});
    const ak=this.setup.across?String(this.setup.across):'';
    if(ak!==this.acrossKey){this.acrossKey=ak;this.acrossContent.clear();this.acrossBody=undefined;
      if(this.setup.across){const m=blockMesh(this.setup.across);this.acrossContent.add(m);this.acrossBody=m.getObjectByName('body') as T.Mesh;}}
    const hk=this.held?String(this.held):'';
    if(hk!==this.heldKey){this.heldKey=hk;if(this.heldMesh){this.binsGroup.remove(this.heldMesh);this.heldMesh=undefined;}
      if(this.held){const at=this.bins.get(this.held)!.position;this.heldMesh=blockMesh(this.held);this.heldMesh.position.set(at.x,.3,at.z);this.heldMesh.scale.setScalar(1.25);
        const ring=part(this.heldMesh,new T.TorusGeometry(.12,.01,8,32),hot(LEMON,1.2),0,-.12,0,false);ring.rotation.x=Math.PI/2;this.binsGroup.add(this.heldMesh);}}
    this.ledGroup.rotation.y=this.setup.reversed?Math.PI:0;
    this.lever.rotation.x=this.powered?.6:-.6;this.powerLamp.material=this.powered?hot('#6dff9a',1.6):toon('#5a4a60');
    this.signBtn.material=this.soakDone?hot('#6dff9a',1.1):toon('#8a9a8e');
    if(j&&!this.tripped)this.marquee.draw(`m${this.index}`,(c,w,h)=>drawMarquee(c,w,h,j.cabinet,false));
    this.drawMeter();this.shown='';this.updatePanel();
  }
  private drawMeter(){
    const j=this.current(),r=this.reading(),hottest=Math.max(0,...this.heat.blocks.flat(),this.heat.across);
    const key=JSON.stringify([this.index,this.live,this.tripped,Math.ceil(this.cooling*5),this.setup,Math.round(this.soak*5),this.soakDone,Math.round(this.heat.led*40),Math.round(hottest*40)]);
    this.meter.draw(key,(c,w,h)=>drawMeter(c,w,h,j,r,{live:this.live,powered:this.powered,tripped:this.tripped,cooling:this.cooling,led:this.heat.led,block:hottest,soak:this.soak,soakDone:this.soakDone,soakTime:this.soakTime,s:this.setup}));
  }

  // ---------- pointer, keys, room ----------
  pointer(e:Pointer){
    const hits=e.ray.intersectObjects(this.clickables.filter(c=>visibleUp(c.obj)).map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.08);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found)this.act(found.act,found.arg);
  }
  key(code:string){
    const map:Record<string,[string,unknown?]>={Digit1:['pick',47],Digit2:['pick',100],Digit3:['pick',220],Digit4:['pick',470],
      KeyA:['slot',0],KeyS:['slot',1],KeyD:['slot',2],KeyX:['slot','across'],KeyF:['flip'],KeyP:['power'],Enter:['signoff'],Backspace:['clear']};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;if(active&&this.toast)this.toast.hidden=true;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';this.updatePanel();}
  dropped(p:Game['props'][number]){
    if(p.spec.id!=='blocks'||this.trayReady)return;const q=p.body.translation(),pl=this.game.player.translation(),t=this.table;
    if(Math.hypot(q.x-t.x,q.z-t.z)<2.6||Math.hypot(pl.x-this.stand.x,pl.z-this.stand.z)<2.2){
      this.trayReady=true;p.mesh.visible=false;p.body.setEnabled(false);this.trayRide.visible=false;this.binsGroup.visible=true;
      const at=this.top.localToWorld(new T.Vector3(BINSAT.x,.1,BINSAT.z));this.game.audio.plug();this.game.burst(at,LEMON,1,'ring');cheer(this.game,this,PINK);this.redraw();}
  }
  private setup0(){this.ready=true;this.tray=this.game.props.find(p=>p.spec.id==='blocks');
    // A few blocks ride on the tray until it reaches the bench.
    this.game.root.add(this.trayRide);([47,100,220,470,220,100] as Block[]).forEach((v,k)=>{const b=blockMesh(v);b.position.set(-.24+(k%3)*.24,.02,k<3?-.1:.1);this.trayRide.add(b);});
    this.redraw();}
  update(dt:number){
    if(!this.ready)this.setup0();
    if(this.tray&&!this.trayReady){const q=this.tray.body.translation(),r=this.tray.body.rotation();this.trayRide.position.set(q.x,q.y,q.z);this.trayRide.quaternion.set(r.x,r.y,r.z,r.w);this.trayRide.visible=this.tray.mesh.visible;}
    const j=this.current(),r=this.reading(),time=this.game.time,k=1-Math.exp(-dt/HOUSE.tau);
    let playing=false;
    if(this.ledDead>0){this.ledDead-=dt;if(this.ledDead<=0){this.game.audio.pop();this.redraw();}}
    // The PTC fuse cools whether or not the bench is on; once cool it conducts again by itself.
    if(this.tripped){this.cooling-=dt;if(this.cooling<=0){this.tripped=false;this.cooling=0;this.game.audio.tone(640,.06,.03,'triangle');this.redraw();}}
    if(j&&r){
      if(this.live&&r.tripped){this.tripT+=dt;if(this.tripT>=.15)this.trip();}
      else if(this.live){
        this.tripT=0;this.runT+=dt;
        // Heat follows its steady value with the bench's time constant; parts cool when off.
        this.heat.led+=(r.level-this.heat.led)*k;
        for(const b of r.blocks){const h=this.heat.blocks[b.pos];if(h&&h[b.slot]!==undefined)h[b.slot]+=(b.heat-h[b.slot])*k;}
        this.heat.across+=(r.pHeat-this.heat.across)*k;
        const over=this.heat.blocks.flatMap((p,pos)=>p.map((h,slot)=>({pos,slot,h}))).find(b=>b.h>1);
        if(over)this.popBlock(over.pos,over.slot);
        else if(this.heat.across>1)this.popBlock('across');
        else if(j.load.kind==='led'&&r.level>HOUSE.ledPop&&(this.ledT+=dt)>.5)this.popLed();
        else{
          const v=judge(j,this.setup);
          // Explain a setup that does not work (why, never the fix), once it has run a moment.
          if(v.tier===0&&!this.explained&&this.runT>.6){this.explained=true;this.fault(false);this.say(v.problems[0],'bad');if(r.iLoad>j.load.imax)this.game.audio.voice('hm',.9);}
          if(v.tier>=1&&!this.soakDone){playing=true;this.soak+=dt;
            if(this.soak>=this.soakTime){this.soakDone=true;this.verdict=v;this.say(`${TIER_WORD[v.tier]}${v.tier===3?' ★':''}${v.notes[0]?`: ${v.notes[0]}`:''}`,'ok');this.game.audio.bell(988,.4,.05);this.redraw();}}
          else if(this.soakDone)playing=true;
        }
      }else{this.heat.led-=this.heat.led*k;for(const p of this.heat.blocks)for(let i=0;i<p.length;i++)p[i]-=p[i]*k;this.heat.across-=this.heat.across*k;}
      this.animate(dt,j,r,playing,time);
    }
    this.drawMeter();this.updatePanel();
  }
  /** The LED, the cabinet, hot blocks, the fuse and the kid. */
  private animate(dt:number,j:Job,r:Reading,playing:boolean,time:number){
    // The LED (and the cabinet's lamp) glow with the current; over its rating it flickers white-hot.
    const on=this.live,lit=on?Math.min(1.6,r.level):0,over=this.heat.led>.9;this.flicker+=dt*30;
    const glowK=lit*(over?.8+Math.sin(this.flicker)*.2:1);
    this.ledDome.visible=this.ledDead<=0;
    if(j.load.kind==='led'){const col=LED_HEX[j.load.color];
      if(glowK>.02){this.ledOn.color.set(col).lerp(new T.Color('#ffffff'),over?Math.min(.7,(this.heat.led-.9)*1.2):0).multiplyScalar(.6+glowK*1.1);this.ledDome.material=this.ledOn;}else this.ledDome.material=toon(tint(col));
      (this.ledHalo.material as T.SpriteMaterial).opacity=Math.min(.95,glowK*.75);this.ledHalo.scale.setScalar(.4+glowK*.8);this.ledLight.intensity=glowK*3;
      if(glowK>.02){this.cabOn.color.set(col).multiplyScalar(.6+glowK);this.cabLamp.material=this.cabOn;}else this.cabLamp.material=this.lampOff;(this.cabHalo.material as T.SpriteMaterial).color.set(col);(this.cabHalo.material as T.SpriteMaterial).opacity=Math.min(.9,glowK*.7);
    }else{const drive=on?Math.min(1,r.iLoad*j.load.beta/j.load.motor):0;this.spin+=dt*drive*14;this.coin.rotation.x=-this.spin;
      this.cabOn.color.set(LEMON).multiplyScalar(1.4);this.cabLamp.material=drive>=1?this.cabOn:this.lampOff;(this.cabHalo.material as T.SpriteMaterial).opacity=drive>=1?.6:0;(this.cabHalo.material as T.SpriteMaterial).color.set(LEMON);}
    // Hot blocks glow orange, then red, and smoke a little before they pop.
    const hotBody=(m:T.Mesh|undefined,v:Block|undefined,h:number)=>{if(!m||v===undefined)return;
      if(h>.6){const c=new T.Color(CANDY[v]).lerp(new T.Color(h>.9?'#ff4a2a':'#ff9a5b'),Math.min(1,(h-.6)*2.5));
        if(!(m.material instanceof T.MeshBasicMaterial))m.material=unlitMat();(m.material as T.MeshBasicMaterial).color.copy(c).multiplyScalar(.8+h*.4);}
      else if(m.material instanceof T.MeshBasicMaterial)m.material=toon(CANDY[v]);};
    this.setup.chain.forEach((p,pos)=>p.forEach((v,s)=>hotBody(this.bodies[pos][s],v,this.heat.blocks[pos]?.[s]??0)));
    hotBody(this.acrossBody,this.setup.across,this.heat.across);
    this.smokeT-=dt;
    if(this.smokeT<=0&&on){const all=this.heat.blocks.flatMap((p,pos)=>p.map(h=>({h,x:POSX[pos],z:TOPZ}))).concat([{h:this.heat.across,x:ACRX,z:MIDZ}]),worst=all.reduce((a,b)=>b.h>a.h?b:a,{h:0,x:0,z:0});
      if(worst.h>.8){this.smokeT=.3;const at=this.boardWorld(worst.x,worst.z);this.game.burst({x:at.x,y:at.y+.08,z:at.z},'#b9b4c4',1,'smoke');}}
    // The fuse glows red while it is tripped and fades back to yellow as it cools.
    const f=this.tripped?Math.min(1,this.cooling/HOUSE.fuseCool):0;
    if(f>0){this.fuseHot.color.set(LEMON).lerp(new T.Color('#ff3b2a'),Math.min(1,f*1.4)).multiplyScalar(1+f*.8);this.fuseDisc.material=this.fuseHot;}else this.fuseDisc.material=toon(LEMON);
    (this.fuseHalo.material as T.SpriteMaterial).opacity=f*.8;
    this.cabScreen.material=on&&r.lit?this.screenOn:this.screenOff;
    // The kid: hops and mashes buttons while it plays, cheers when it passes, slumps at a dark screen.
    const want=playing?1:0;this.hop+=(want-this.hop)*Math.min(1,dt*6);
    const bounce=Math.abs(Math.sin(time*(this.soakDone?9:7)))*(this.soakDone?.14:.07)*this.hop;
    this.kidBody.position.y=.42+bounce;this.kidBody.rotation.x=(1-this.hop)*.35;
    this.kidArms.forEach((a,i)=>a.rotation.x=this.soakDone?-2.8+Math.sin(time*9+i)*.2:-.9-this.hop*.3+Math.sin(time*16+i*2)*.25*this.hop);
  }

  // ---------- panels ----------
  private say(text:string,tone:'ok'|'bad'|'info'='info'){
    if(!this.toast){const l=this.layer();if(!l)return;this.toast=document.createElement('div');this.toast.className='station-toast';l.append(this.toast);}
    this.toast.textContent=text;this.toast.dataset.tone=tone;this.toast.hidden=false;this.toastUntil=this.game.time+Math.max(4,text.length*.06);
  }
  private layer(){return document.querySelector<HTMLElement>('[data-layer="hud"]');}
  private updatePanel(){
    if(this.toast&&!this.toast.hidden&&this.game.time>this.toastUntil&&this.game.running)this.toast.hidden=true;
    const j=this.current(),r=this.reading();
    const key=JSON.stringify([this.active,this.index,this.setup,this.held,this.live,this.tripped,this.soakDone,this.trayReady,this.rush?Math.ceil(this.game.time):0]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){const l=this.layer();if(!l){this.shown='';return;}this.panel=document.createElement('section');this.panel.className='station-panel panel arc-panel';l.append(this.panel);}
    this.panel.hidden=!j||!r;if(!j||!r)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const isLed=j.load.kind==='led',on=this.live,inBand=r.iLoad>=j.band[0]-1e-9&&r.iLoad<=j.band[1]+1e-9;
    const hottest=r.blocks.reduce((a,b)=>Math.max(a,b.p),0);
    this.panel.innerHTML=`<header><small>${this.rush?`RUSH · ${Math.max(0,Math.ceil(RUSH_TIME-this.game.time))} s · ${this.served.length} fixed`:`${this.index+1}/${JOBS.length}`} · ${j.cabinet}</small><h4>${j.ask}</h4><p>${j.story}</p></header>`+
      (this.active&&this.trayReady?`<ul class="build">${row('Chain',chainText(this.setup.chain))}`+
        `${row('Current',on?`${mA(r.iLoad)} mA`:this.tripped?'fuse cooling':'off',on?inBand:undefined)}`+
        (on&&r.blocks.length?row('Hottest block',`${watts(hottest)} of ${watts(BLOCK_RATING)}`,hottest<=BLOCK_RATING*HOUSE.margin):'')+
        (j.battery&&on&&r.lifeH?row('Battery life',`≈ ${Math.round(r.lifeH)} h`):'')+
        `${row('Parts',`${partsCost(this.setup)} credit${partsCost(this.setup)===1?'':'s'}`)}</ul>`+
        `<p class="profile">${isLed?'I = (V − V<sub>f</sub>) ÷ R and P = I²R. Simplified LED: fixed V<sub>f</sub>, light ∝ current.':'I = (5 V − 0.7 V) ÷ R. Simplified: the base–emitter junction drops a fixed 0.7 V, β ≈ 100.'} Blocks in a row add; side by side they share. House rule: blocks under ${HOUSE.margin*100} % of ¼ W.</p>`:'');
  }
  private hoverHint():Prompt|null{
    const h=this.hovered;if(!h||!this.active)return null;
    switch(h.act){
      case 'pick':{const v=Number(h.arg) as Block;return {key:String(BLOCKS.indexOf(v)+1),text:this.held===v?'Put it back':`Take a ${v} Ω block`};}
      case 'slot':{const s=h.arg as Slot;
        if(s==='across')return {key:'X',text:this.held?'Put it across the LED':this.setup.across?'Take it out':'Across the LED'};
        const p=this.setup.chain[s],key=POS_LETTERS[s];
        if(this.held)return {key,text:p.length>=PER_POSITION?'Full':p.length?'Put it beside':'Put it here'};
        return {key,text:p.length?'Take a block out':'Empty: plain wire'};}
      case 'flip':return {key:'F',text:'Flip the LED'};
      case 'power':return {key:'P',text:this.powered?'Power off':'Power on'};
      case 'signoff':return {key:'Enter',text:'Sign off'};
    }
    return null;
  }
  prompt(atBench:boolean):Prompt|null{
    const j=this.current();if(!j||this.game.won)return null;
    if(!atBench){const p=this.game.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z);
      if(this.game.held?.spec.id==='blocks')return {key:'E',text:near<2.4?'Set the tray on the bench':'Carry the tray'};
      if(!this.game.held&&this.game.nearest()?.spec.id==='blocks')return {key:'E',text:'Pick up the tray'};
      if(near<1.6)return {key:'E',text:'Work at the bench'};
      return null;}
    if(!this.trayReady)return {key:'E',text:'Fetch the resistor tray'};
    const hint=this.hoverHint();if(hint)return hint;
    if(this.soakDone)return {key:'Enter',text:'Sign off'};
    if(this.held)return {key:'A S D',text:'Place it in the chain'};
    if(this.tripped)return {key:'P',text:'Fuse cooling'};
    if(this.powered)return {key:'P',text:this.soak>0?'Play test':'Power off'};
    return this.setup.chain.some(p=>p.length)?{key:'P',text:'Power on'}:{key:'1–4',text:'Take a block'};
  }
  complete(){return this.rush?this.game.time>=RUSH_TIME:this.served.length>=JOBS.length;}
  /** Rush: cabinets fixed and seconds left, for the HUD clock and the result card. */
  rushStatus(){return this.rush?{served:this.served.length,left:Math.max(0,RUSH_TIME-this.game.time)}:undefined;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){const j=this.current();return {index:this.index,job:j?.id??null,fix:j?best(j)??null:null,rush:this.rush,setup:clone(this.setup),held:this.held??null,powered:this.powered,live:this.live,
    tripped:this.tripped,cooling:+this.cooling.toFixed(2),soak:+this.soak.toFixed(2),soakDone:this.soakDone,verdict:this.verdict?{tier:this.verdict.tier,notes:this.verdict.notes}:null,
    served:this.served,mistakes:this.mistakes,trips:this.trips,spent:this.spent,trayReady:this.trayReady,reading:j?read(j,this.setup):null,
    heat:{led:this.heat.led,blocks:this.heat.blocks.map(p=>[...p]),across:this.heat.across}};}
}

function unlitMat(){const m=new T.MeshBasicMaterial({color:'#ffffff'});m.userData.outlineParameters={visible:false};return m;}
function clone(s:Setup):Setup{return {chain:s.chain.map(p=>[...p]),across:s.across,reversed:s.reversed};}
function visibleUp(o:T.Object3D){let p:T.Object3D|null=o;while(p){if(!p.visible)return false;p=p.parent;}return true;}
/** An unlit LED is its own colour, pale. */
function tint(hex:string){const c=new T.Color(hex).lerp(new T.Color('#ffffff'),.55);return `#${c.getHexString()}`;}
/** The chain as a sum: positions add, a side-by-side pair is shown as a ‖ b. */
function chainText(c:Chain){
  const parts=c.filter(p=>p.length).map(p=>p.length===2?`(${p[0]}‖${p[1]})`:`${p[0]}`);
  if(!parts.length)return 'wire only';
  const total=c.reduce((n,p)=>n+positionR(p),0);
  return parts.length===1&&c.every(p=>p.length<2)?ohms(total):`${parts.join(' + ')} = ${ohms(total)}`;
}

/** The printed channel board: rails, part outlines and short legends. */
function drawBoard(c:CanvasRenderingContext2D,w:number,h:number,j:Job|undefined){
  c.fillStyle='#2f7a5b';c.fillRect(0,0,w,h);
  c.fillStyle='rgba(255,255,255,.05)';for(let y=12;y<h;y+=24)for(let x=12;x<w;x+=24)c.fillRect(x-1,y-1,2,2);
  const X=(x:number)=>(x+BW/2-.02)/(BW-.04)*w,Y=(z:number)=>(z+BD/2-.02)/(BD-.04)*h;
  c.strokeStyle='#f0b25a';c.lineWidth=16;c.lineCap='round';c.lineJoin='round';
  const line=(pts:[number,number][])=>{c.beginPath();pts.forEach(([x,z],i)=>i?c.lineTo(X(x),Y(z)):c.moveTo(X(x),Y(z)));c.stroke();};
  // Top rail: supply → fuse → each chain position in turn → the LED's + leg and the ACROSS slot.
  line([[SUPX,TOPZ],[POSX[0]-PADW/2,TOPZ]]);
  for(let k=0;k<2;k++)line([[POSX[k]+PADW/2,TOPZ],[POSX[k+1]-PADW/2,TOPZ]]);
  line([[POSX[2]+PADW/2,TOPZ],[ACRX,TOPZ],[ACRX,TOPZ+.05]]);line([[LEDX,TOPZ],[LEDX,TOPZ+.05]]);
  line([[SUPX,GNDZ],[ACRX,GNDZ],[ACRX,GNDZ-.05]]);line([[LEDX,GNDZ],[LEDX,GNDZ-.05]]);
  const isLed=j?.load.kind!=='base';
  c.fillStyle='#f0b25a';for(const [x,z] of [[LEDX,TOPZ],[LEDX,GNDZ],[ACRX,TOPZ],[ACRX,GNDZ]] as [number,number][]){c.beginPath();c.arc(X(x),Y(z),13,0,7);c.fill();}
  const text=(t:string,x:number,z:number,size=30,col='#fffaf0')=>{c.font=FONT(size);c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';c.fillText(t,X(x),Y(z));};
  text(j?`${j.supply} V`:'',SUPX,MIDZ,48,LEMON);
  text('+',SUPX-.11,TOPZ,44,'#ff9a9a');text('−',SUPX-.11,GNDZ,44,'#fffaf0');
  text(isLed?'+':'B',LEDX-.1,TOPZ+.06,34,'#ff9a9a');text(isLed?'−':'E',LEDX-.1,GNDZ-.05,34);
  // The chain's key letters, printed under each position and the ACROSS slot.
  POSX.forEach((x,k)=>text(POS_LETTERS[k],x,TOPZ+.19,26,'rgba(255,250,240,.55)'));text('X',ACRX+.12,MIDZ,26,'rgba(255,250,240,.55)');
  // Legend strip along the front edge.
  c.fillStyle='rgba(20,50,38,.55)';c.fillRect(0,Y(LABZ-.055),w,Y(LABZ+.055)-Y(LABZ-.055));
  text(j?.battery?'BATTERY':isLed?'SUPPLY':'LOGIC PIN',SUPX,LABZ,26);text('FUSE',FUSEX,LABZ,26);text('CHAIN',POSX[1],LABZ,30,LEMON);
  text(isLed?'LED':'TRANSISTOR',LEDX,LABZ,26);text('ACROSS',ACRX,LABZ,26);
}
function drawMarquee(c:CanvasRenderingContext2D,w:number,h:number,title:string,done:boolean,tilt=false){
  const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,tilt?'#ff3b5c':PINK);g.addColorStop(.5,tilt?'#ff8a3d':LEMON);g.addColorStop(1,tilt?'#ff3b5c':MINT);
  c.fillStyle=done?PLUM:g;c.fillRect(0,0,w,h);
  c.fillStyle='rgba(255,255,255,.55)';for(let x=12;x<w;x+=28){c.beginPath();c.arc(x,8,4,0,7);c.fill();c.beginPath();c.arc(x+14,h-8,4,0,7);c.fill();}
  let s=64;c.font=FONT(s);while(c.measureText(title).width>w-60){s--;c.font=FONT(s);}
  c.textAlign='center';c.textBaseline='middle';c.lineWidth=10;c.strokeStyle=PLUM;c.strokeText(title,w/2,h/2+3);c.fillStyle=done?LEMON:'#fffaf0';c.fillText(title,w/2,h/2+3);
}
interface MeterState {live:boolean;powered:boolean;tripped:boolean;cooling:number;led:number;block:number;soak:number;soakDone:boolean;soakTime:number;s:Setup}
/** The live meter: current, chain resistance and the hottest block's power; then light against the
 *  band (with its ★ zone), LED heat (or motor speed) and block heat against the house margin. */
function drawMeter(c:CanvasRenderingContext2D,w:number,h:number,j:Job|undefined,r:Reading|undefined,m:MeterState){
  c.fillStyle='#1d1430';c.fillRect(0,0,w,h);
  if(!j||!r){c.fillStyle=LEMON;c.font=FONT(60);c.textAlign='center';c.textBaseline='middle';c.fillText('ALL FIXED',w/2,h/2);return;}
  const on=m.live,isLed=j.load.kind==='led',hottest=r.blocks.reduce((a,b)=>Math.max(a,b.p),0);
  c.textBaseline='middle';
  const tile=(x:number,label:string,value:string,unit:string,col:string)=>{c.fillStyle='#2c2046';c.beginPath();c.roundRect(x,16,280,118,18);c.fill();
    c.fillStyle='rgba(255,255,255,.6)';c.textAlign='left';c.font=FONT(22,600);c.fillText(label,x+18,40);
    c.fillStyle=col;c.font=FONT(58);c.fillText(value,x+18,92);const vw=c.measureText(value).width;c.font=FONT(28,600);c.fillStyle='rgba(255,255,255,.75)';c.fillText(unit,x+26+vw,98);};
  tile(16,isLed?'CURRENT':'BASE CURRENT',on?mA(r.iLoad):m.tripped?'TRIP':'—',on?'mA':'',m.tripped?'#ff6b6b':'#8dffd0');
  const rc=r.rChain;tile(310,'CHAIN',rc>=1000?(rc/1000).toFixed(2):rc.toFixed(rc<100&&rc%1?1:0),rc>=1000?'kΩ':'Ω',LEMON);
  tile(604,'HOTTEST BLOCK',on&&r.blocks.length?(hottest*1000).toFixed(hottest<.01?1:0):'—',on&&r.blocks.length?'mW':'',PINK);
  const bar=(y:number,label:string,frac:number,band:[number,number]|null,star:[number,number]|null,limit:number|null,dash:number|null,col:string,right:string)=>{
    c.fillStyle='rgba(255,255,255,.7)';c.font=FONT(22,600);c.textAlign='left';c.fillText(label,20,y+20);
    const x0=250,x1=w-150,bw=x1-x0,max=1.5,X=(v:number)=>x0+Math.min(1,Math.max(0,v/max))*bw;
    c.fillStyle='#2c2046';c.beginPath();c.roundRect(x0,y,bw,40,12);c.fill();
    if(band){c.fillStyle='rgba(111,224,192,.28)';c.fillRect(X(band[0]),y,X(band[1])-X(band[0]),40);}
    if(star){c.fillStyle='rgba(255,216,77,.38)';c.fillRect(X(star[0]),y,X(star[1])-X(star[0]),40);c.fillStyle=LEMON;c.font=FONT(22);c.textAlign='center';c.fillText('★',(X(star[0])+X(star[1]))/2,y-12);}
    c.fillStyle=col;c.beginPath();c.roundRect(x0,y+8,Math.max(0,X(frac)-x0),24,8);c.fill();
    if(dash!==null){c.strokeStyle='rgba(255,216,77,.85)';c.setLineDash([7,7]);c.lineWidth=3;c.beginPath();c.moveTo(X(dash),y-4);c.lineTo(X(dash),y+44);c.stroke();c.setLineDash([]);}
    if(limit!==null){c.strokeStyle='#ff6b6b';c.lineWidth=5;c.beginPath();c.moveTo(X(limit),y-6);c.lineTo(X(limit),y+46);c.stroke();}
    c.fillStyle='#fffaf0';c.font=FONT(24);c.textAlign='right';c.fillText(right,w-18,y+20);
  };
  const lvl=on?r.level:0,im=j.load.imax,band:[number,number]=[j.band[0]/im,j.band[1]/im],sz=starZone(j),star:[number,number]=[sz[0]/im,sz[1]/im];
  const inBand=lvl>=band[0]-1e-9&&lvl<=band[1]+1e-9;
  bar(170,isLed?'LIGHT':'BASE',lvl,band,star,1,null,inBand?MINT:LEMON,on?`${mA(r.iLoad)} mA`:'off');
  if(isLed){const ledC=HOUSE.ambient+m.led*HOUSE.ledTheta*j.load.imax*j.load.vf;bar(232,'LED HEAT',m.led,null,null,1,null,m.led>.9?'#ff6b6b':'#ff9ec6',`${Math.round(ledC)} °C`);}
  else{const drive=on&&j.load.kind==='base'?Math.min(1,r.iLoad*j.load.beta/j.load.motor):0;bar(232,'MOTOR',drive,null,null,null,null,drive>=1?MINT:LEMON,on?drive>=1?'FULL':`${Math.round(drive*100)} %`:'off');}
  bar(294,'BLOCK HEAT',m.block,null,null,1,HOUSE.margin,m.block>HOUSE.margin?'#ff8a3d':'#b9a6f5',r.blocks.length||m.s.across?`${Math.round(HOUSE.ambient+m.block*HOUSE.ratedRise)} °C`:'—');
  // The play-test strip and the fuse.
  const y=362;c.fillStyle='#2c2046';c.beginPath();c.roundRect(16,y,w-32,64,16);c.fill();
  c.fillStyle=m.soakDone?'#6dff9a':'#8b7be8';c.beginPath();c.roundRect(16,y,(w-32)*Math.min(1,m.soak/m.soakTime),64,16);c.fill();
  c.fillStyle=m.soakDone?'#1d1430':'#fffaf0';c.font=FONT(28);c.textAlign='left';
  c.fillText(m.soakDone?'PLAY TEST PASSED ✓':m.soak>0?`PLAY TEST  ${m.soak.toFixed(1)} / ${m.soakTime} s`:on?'NOT PLAYABLE':m.tripped?'':'POWER OFF',34,y+33);
  c.textAlign='right';c.fillStyle=m.tripped?'#ff6b6b':m.soakDone?'#1d1430':'#8dffd0';c.fillText(m.tripped?`FUSE COOLING ${m.cooling.toFixed(1)} s`:'FUSE OK',w-34,y+33);
  c.fillStyle='rgba(255,255,255,.7)';c.font=FONT(22,600);c.textAlign='left';
  const foot=j.battery?(on&&r.lifeH?`BATTERY  ≈ ${Math.round(r.lifeH)} h`:`BATTERY  ${HOUSE.battery} mAh`):`SUPPLY  ${j.supply} V   ·   ${isLed?`LED Vf ${j.load.vf.toFixed(1)} V`:'BASE 0.7 V'}`;
  c.fillText(foot,20,h-40);c.textAlign='right';c.fillText(`BLOCKS  ¼ W`,w-20,h-40);
}
