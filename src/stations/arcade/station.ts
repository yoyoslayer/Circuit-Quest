// Overheating Arcade service bench ("candy resistors"). The broken cabinet's LED channel is opened up
// on the bench: SUPPLY → self-resetting FUSE → a three-position CHAIN socket → LED (or, for the coin
// hopper, a transistor's base), with an ACROSS slot wired straight across the LED.
// Pip takes chunky resistor blocks from four bins (47, 100, 220, 470 Ω), stands them in the chain
// (positions add; two blocks side by side in one position share the current), flips the LED if it is
// in backwards and switches the POWER on. The circuit is live: every change shows on the meter at once.
// A kid play-tests the cabinet while it runs in spec; then it can be signed off.
// Too much current trips the self-resetting fuse (it warms amber, cools and conducts again by itself);
// a block over its rating scorches and fails, a gross overload pops it off the board; an LED driven far
// past its rating pops and a spare goes in. Powering a cabinet on as found, to see its fault, is free:
// only faults the player builds count. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressArcade,type ArcadeRoom} from './room';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,INK,freezeBench} from '../../render/kit';
import {hot} from '../../render/actors';
import {JOBS,rushJob,BLOCKS,BLOCK_RATING,BLOCK_COST,PER_POSITION,HOUSE,read,judge,best,mA,ohms,watts,partsCost,positionR,starZone,TIER_WORD,motorDrive,popWhy,minCost,
  type Block,type Chain,type Job,type Setup,type Reading,type Verdict,type LedColor} from './logic';
import './arcade.css';
import {cheer,signOff,fault as benchFault} from '../shared';
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
/** The hopper's 12 V motor supply posts, at the board's right edge (board-local x). */
const MOTX=ACRX+.14;
/** A part placed by the player and later taken out again is scrap: half a credit. */
const SCRAP=BLOCK_COST*.5;

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
  readonly view:{distance:number;pitch:number;lookY:number;lookX?:number;width:number}={distance:5.9,pitch:.98,lookY:.3,lookX:0,width:4.4};
  /** While the kid play-tests, the bench camera eases left and back so the cabinet, its marquee and
   *  the kid are in frame with the board (R5-080); it eases back once the cabinet is signed off. */
  private static readonly REST={distance:5.9,pitch:.98,lookX:0};private static readonly SOAK={distance:7.2,pitch:.85,lookX:-1.8};
  private kidStartle=0;private cabMarquee?:T.Object3D;private signedAt=-9;
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
  private tripT=0;private runT=0;private explained=false;private faultCounted=false;private ledDead=0;private scorchT=0;
  /** False while the cabinet is as found: powering it on to look is free; faults count once the player changes it. */
  private touched=false;
  /** Which blocks on the board the player placed (taking one of those out again is scrap). */
  private mine:boolean[][]=[[],[],[]];private mineAcross=false;
  /** The ★ zone shows on the meter once this cabinet has passed a play test. */
  private passed=false;
  private flowMain!:Flow;private flowMotor!:Flow;private motorLoop=new T.Group();private fusePips:T.Mesh[]=[];private pinPost!:T.Mesh;private pinHot=unlitMat();private wisp!:Wisp;
  private spin=0;private flicker=0;private hop=0;
  private tray?:Game['props'][number];private trayRide=new T.Group();private ready=false;
  constructor(private game:Game){
    this.rush=game.level.id==='arcade-rush';this.jobs=this.rush?[]:[...JOBS];this.setup=clone(this.current()!.start);this.heat=zeroHeat(this.setup.chain);
    this.limits.cost=this.rush?24:Math.ceil(JOBS.reduce((n,j)=>n+partsCost({chain:best(j)??[],reversed:false}),0)*1.5);
    if(this.rush){this.limits.time=RUSH_TIME+30;this.limits.damage=3;}
    const carry={text:'Carry the tray of resistor blocks from the storeroom to the service bench',done:()=>this.trayReady,at:()=>this.game.held===this.tray?this.stand:this.tray?.body.translation()??this.stand};
    const step={text:'Step up to the service bench (E)',done:()=>this.active||this.served.length>0,at:()=>this.stand};
    // The bench's mains lead (R5-079): the bench can't power a cabinet until it is plugged in.
    const lead=game.leadStep();
    // The prize pyramid on the shelf behind the bench (R5-079): a chaos bonus anyone can see from the door.
    const pyramid={text:'Knock the prize pyramid over',ok:()=>this.prizesDown>=3};
    this.job=this.rush?{goal:`Arcade Rush: fix as many cabinets as you can in ${RUSH_TIME/60} minutes`,
      steps:[carry,...lead,step,{text:'Fix cabinets until the clock runs out',done:()=>this.complete(),at:()=>this.stand}],
      bonuses:[
        {text:'Eight cabinets or more',ok:()=>this.served.length>=8},
        {text:'Every one reliable',ok:()=>this.served.length>0&&this.served.every(s=>s.tier>=2)},
        pyramid]}:{goal:'Fix five arcade cabinets with candy resistors',
      steps:[carry,...lead,step,...JOBS.map((j,i)=>({text:`${j.title} — ${j.ask.replace(':',' ·')}`,done:()=>this.served.length>i,at:()=>this.stand}))],
      bonuses:[
        pyramid,
        {text:'Every cabinet in the ★ zone',ok:()=>this.served.every(s=>s.tier===3)},
        {text:'Fuse tripped no more than once',ok:()=>this.trips<=1}]};
    game.root.add(this.top);this.top.position.copy(this.table).add(new T.Vector3(OX,0,0));
    this.build();this.showJob();freezeBench(this.top,this,game,[this.binsGroup,...this.bins.values(),this.motorLoop]);
  }
  dress(kit:RoomKit){const r=dressArcade(this.game,kit);this.room=r;return {lightUp:r.lightUp};}
  current():Job|undefined{
    // Rush: the clock ends the shift, but a cabinet already in its play test gets to finish it.
    if(this.rush){if(this.shift()>=RUSH_TIME&&!this.overtime())return undefined;while(this.jobs.length<=this.index+2)this.jobs.push(rushJob(this.random,this.jobs.length,this.jobs[this.jobs.length-1]));}
    return this.jobs[this.index];}
  private overtime(){return this.powered&&this.soak>0&&this.shift()<RUSH_TIME+RUSH_SOAK+.5;}
  /** Rush shift clock (R5-220): it starts when the tray reaches the bench, so the fetch doesn't eat the
   *  shift; a player who never fetches it still gets a clock after 20 s. Story mode uses game time. */
  private rushFrom?:number;
  shift(){if(!this.rush)return this.game.time;if(this.rushFrom===undefined&&(this.trayReady||this.game.time>=20))this.rushFrom=this.game.time;return this.rushFrom===undefined?0:this.game.time-this.rushFrom;}
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
    for(const [z,c] of [[TOPZ,'#e5484d'],[GNDZ,'#2b2d42']] as const){const post=part(b,cyl(.04,.045,.05,14),toon(c),SUPX,.055,z);if(z===TOPZ)this.pinPost=post;part(b,cyl(.022,.022,.04,10),toon('#d9a441'),SUPX,.09,z);}
    // The self-resetting fuse: a yellow disc on two legs. Tripped, it warms amber and cools back to yellow.
    this.fuseDisc=part(b,cyl(.06,.06,.03,20,'z'),toon(LEMON),FUSEX,.09,TOPZ);
    for(const x of [-.03,.03])part(b,cyl(.006,.006,.06,6),toon('#c9ced8'),FUSEX+x,.055,TOPZ,false);
    this.fuseHalo=glow(b,'rgba(255,179,71,1)',.4,0);this.fuseHalo.position.set(FUSEX,.12,TOPZ);
    // Three pips beside the fuse count the trips the player caused (the bonus allows one).
    for(let k=0;k<3;k++){const pip=part(b,sphere(.016,10,8),toon('#3a4a40'),FUSEX-.05+k*.05,.04,TOPZ+.1,false);pip.userData.noAO=true;this.fusePips.push(pip);}
    // Current flows: dashes run along a closed, live loop (faster for more current).
    this.wisp=new Wisp(b);
    this.flowMain=new Flow(b,[[SUPX,TOPZ],[LEDX,TOPZ],[LEDX,GNDZ],[SUPX,GNDZ]],.11);
    // The coin hopper's motor loop: 12 V → motor → collector, emitter → ground. Thick, because it
    // carries the big current the small base current switches.
    const ml=this.motorLoop;b.add(ml);
    for(const [z,c] of [[TOPZ,'#e5484d'],[GNDZ,'#2b2d42']] as const){part(ml,cyl(.04,.045,.05,14),toon(c),MOTX,.055,z);part(ml,cyl(.022,.022,.04,10),toon('#d9a441'),MOTX,.09,z);}
    this.flowMotor=new Flow(ml,[[MOTX,TOPZ],[MOTX,MIDZ],[LEDX+.05,MIDZ],[LEDX,GNDZ],[MOTX,GNDZ]],.07,1.6);
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
    const mo=this.motor;this.top.add(mo);mo.position.set(BOARD.x+ACRX-.02,.075,BOARD.z+MIDZ+.02);mo.scale.setScalar(.55);part(mo,rbox(.42,.05,.34,.04),toon(PLUM),0,.025,0);
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
      // Its key on the rim (R5-246): bins 1–4 match Digit1–4.
      sign(bg,String(k+1),-.15,.115,-.12,.09,-Math.PI/2,'#ffe36e',INK,.09);
      this.bins.set(v,bg);this.click(bg,'pick',v);});
    r.visible=false;
  }
  /** Bench supply with its big POWER lever, and the SIGN OFF button in front of it. */
  private buildPower(){
    const p=group(this.top,POWERAT.x,.04,POWERAT.z-.18);part(p,rbox(.46,.2,.4,.06),toon(MINT),0,.1,0);part(p,box(.48,.03,.42),toon(PLUM),0,.205,0);
    const lv=group(p,0,.2,-.04);part(lv,rbox(.2,.04,.16,.03),toon(INK),0,.02,0);this.lever=group(lv,0,.04,0);part(this.lever,cyl(.018,.018,.2,10),toon('#c9ced8'),0,.1,0);part(this.lever,sphere(.05,14,10),toon('#e5484d'),0,.21,0);
    this.powerLamp=part(p,sphere(.035,12,8),toon('#5a4a60'),-.16,.23,.12);
    sign(p,'P',.15,.222,-.13,.11,-Math.PI/2,'#ffe36e',INK,.11);
    this.click(p,'power');
    // The sign-off button: a big round stamp with a tick on it.
    const s=group(this.top,POWERAT.x+.52,.04,POWERAT.z+.14);part(s,cyl(.17,.19,.06,24),toon(INK),0,.03,0);this.signBtn=part(s,cyl(.13,.13,.06,24),toon('#8a9a8e'),0,.08,0);this.click(s,'signoff');
    sign(s,'✓',0,.112,0,.16,-Math.PI/2,'#fffaf0',INK,.16);sign(s,'Enter',0,.065,.25,.24,-Math.PI/2,'#ffe36e',INK,.09);
  }
  /** The cabinet being serviced stands at the bench's left end, back open, ribbon cable to the board,
   *  with a kid waiting to play it. */
  private buildCabinet(){
    const t=this.table,c=group(this.game.root,t.x+OX-2.75,0,t.z-.35,.38);
    part(c,rbox(.95,1.2,.8,.08),toon('#ff9fc8'),0,.6,0);part(c,rbox(1,.1,.85,.05),toon(PLUM),0,.05,0);
    const head=group(c,0,1.2,-.05);head.rotation.x=.12;part(head,rbox(.95,.7,.7,.08),toon('#ff9fc8'),0,.35,0);
    this.cabScreen=part(head,box(.72,.46,.03),toon('#241a33'),0,.36,.35);
    part(c,rbox(.97,.08,.5,.03),toon(PLUM),0,1.2,.25);for(const [x,col] of [[-.2,'#e5484d'],[0,LEMON],[.2,'#3f7fd6']] as const)part(c,cyl(.05,.05,.04,16),toon(col),x,1.26,.35);
    const mq=group(c,0,2.02,.05);this.cabMarquee=mq;part(mq,rbox(1,.28,.3,.06),toon(PLUM),0,0,0);const face=part(mq,new T.PlaneGeometry(.92,.23),new T.MeshBasicMaterial({map:this.marquee.tex,toneMapped:false}),0,0,.155,false);(face.material as T.Material).userData.outlineParameters={visible:false};
    this.cabLamp=part(c,sphere(.07,14,10),toon('#5a4a60'),0,1.02,.41);this.cabHalo=glow(c,'rgba(255,140,150,1)',.9,0);this.cabHalo.position.set(0,1.02,.5);
    // The ribbon cable runs from the cabinet's open back, sags onto the bench top and plugs into a
    // connector on the board's supply edge.
    c.updateMatrixWorld(true);this.top.updateMatrixWorld(true);
    const toCab=(x:number,y:number,z:number)=>c.worldToLocal(this.top.localToWorld(new T.Vector3(x,y,z)));
    // Behind the bins, then forward between the bins and the board to its left edge by SUPPLY.
    const end=toCab(BOARD.x+SUPX-.15,.06,BOARD.z+TOPZ+.1);
    const cable=new T.CatmullRomCurve3([new T.Vector3(.35,.9,-.2),new T.Vector3(.75,1.0,-.05),toCab(-2.05,.04,-.42),toCab(-1.02,.04,-.4),toCab(-.97,.045,-.2),end]);
    const ribbon=part(c,new T.TubeGeometry(cable,40,.03,8),toon(GRAPE),0,0,0);ribbon.userData.noAO=true;
    const plug=part(c,rbox(.12,.05,.1,.015),toon(INK),end.x,end.y+.01,end.z);plug.rotation.y=-.38;
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
    const base=j?.load.kind==='base';this.ledGroup.visible=!!j&&!base;this.transistor.visible=!!base;this.motor.visible=!!base;this.motorLoop.visible=!!base;
    // A transistor base has no use for the ACROSS slot.
    this.acrossGroup.visible=!base;
    this.touched=false;this.passed=false;this.mine=this.setup.chain.map(p=>p.map(()=>false));this.mineAcross=false;this.unhover();
    if(j&&!base){const col=LED_HEX[(j.load as {color:LedColor}).color];(this.ledHalo.material as T.SpriteMaterial).color.set(col);this.ledLight.color.set(col);}
    this.redraw();
  }
  /** Something on the board changed: the play test starts over (the bench stays live). */
  private changed(){this.soak=0;this.soakDone=false;this.verdict=undefined;this.runT=0;this.explained=false;this.faultCounted=false;this.tripT=0;this.scorchT=0;}
  /** The player changed the board: from now on faults count, and an old message no longer applies. */
  private edited(){this.touched=true;if(this.toast)this.toast.hidden=true;this.changed();}
  /** A hovered part that is no longer on show (a hidden LED or slot) drops its hover. */
  private unhover(){if(this.hovered&&!visibleUp(this.hovered.obj)){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}
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
          if(j.load.kind!=='led')return false;
          if(this.held){if(this.setup.across){this.heat.across=0;if(this.mineAcross)this.spent+=SCRAP;}this.setup.across=this.held;this.mineAcross=true;this.held=undefined;this.edited();a.seat();break;}
          if(this.setup.across){this.setup.across=undefined;this.heat.across=0;if(this.mineAcross)this.spent+=SCRAP;this.mineAcross=false;this.edited();a.tone(300,.06,.04,'triangle');break;}
          a.voice('hm',1.4);return false;}
        if(typeof s!=='number'||s<0||s>2)return false;const p=this.setup.chain[s];
        if(this.held){if(p.length>=PER_POSITION){this.say('Two side by side is all a position holds.');a.voice('hm',1.4);return false;}
          p.push(this.held);this.heat.blocks[s].push(0);this.mine[s].push(true);this.held=undefined;this.edited();a.seat();break;}
        if(p.length){p.pop();this.heat.blocks[s].pop();if(this.mine[s].pop())this.spent+=SCRAP;this.edited();a.tone(300,.06,.04,'triangle');
          // Lifting the last block out of a live chain would short the LED straight across the
          // supply: the bench switches itself off first (the lever clacks back), so a swap is safe.
          if(this.powered&&this.setup.chain.every(q=>q.length===0)){this.powerOff();a.noise(.03,.07,2500,'highpass');a.tone(220,.09,.04);}
          break;}
        a.voice('hm',1.4);return false;}
      case 'flip':{if(j.load.kind!=='led')return false;this.setup.reversed=!this.setup.reversed;this.edited();a.tone(this.setup.reversed?440:560,.06,.04,'triangle');a.pop();break;}
      case 'power':{
        // Tripped, the PTC fuse comes back by itself once it cools, so P leaves the power on.
        if(this.powered&&this.tripped){a.voice('hm',1.4);return false;}
        if(this.powered){this.powerOff();a.noise(.03,.07,2500,'highpass');a.tone(220,.09,.04);break;}
        // No mains, no power: the lever clacks but nothing lights (the bench lead is unplugged).
        if(this.game.benchDead()){this.say("No power: the bench lead isn't plugged in.",'bad');return false;}
        this.powered=true;this.changed();a.noise(.03,.07,2500,'highpass');a.tone(420,.09,.04);break;}
      case 'signoff':{
        if(!this.soakDone||!this.verdict){a.voice('hm',1.4);return false;}
        // Rush has no fixed parts budget: a sign-off only costs what it spends over the leanest chain
        // that reaches the same tier, so fixing more cabinets never costs grade.
        const v=this.verdict;this.served.push({job:j.id,tier:v.tier,cost:v.cost});this.spent+=this.rush?Math.max(0,v.cost-minCost(j,v.tier)):v.cost;
        this.say(`${j.title}: ${TIER_WORD[v.tier]}${v.tier===3?' ★':''}`,'ok');
        // The milestone, a hitstop and confetti from the cabinet's own marquee, in the play-test framing (R5-080/093/094).
        signOff(this.game,this,LEMON,!this.rush&&this.served.length>=JOBS.length);this.signedAt=this.game.time;
        if(this.cabMarquee){const m=this.cabMarquee.getWorldPosition(new T.Vector3());this.game.burst({x:m.x,y:m.y+.2,z:m.z},LEMON,18,'confetti');this.game.burst({x:m.x,y:m.y,z:m.z},'#fff3c8',1,'flash');}
        // Story: the cabinet's own place on the back wall lights. Rush: the back wall is a progress
        // meter, one cabinet lighting for every two fixed.
        if(!this.rush)this.room?.light(this.index);else if(this.served.length%2===0)this.room?.light(this.served.length/2-1,j.cabinet);
        this.index++;this.powerOff();this.held=undefined;this.tripped=false;this.cooling=0;
        this.setup=clone(this.current()?.start??{chain:[[],[],[]],reversed:false});this.heat=zeroHeat(this.setup.chain);this.showJob();return true;}
      case 'clear':{if(!this.held)return false;this.held=undefined;a.tone(380,.05,.03,'triangle');break;}
      default:return false;
    }
    this.redraw();return true;
  }
  /** Counts a fault (a mistake, and a trip if it tripped) once per arrangement on the board. The
   *  cabinet as found is free to power on and look at: only setups the player built count. */
  private fault(trip:boolean){if(this.faultCounted)return;this.faultCounted=true;if(!this.touched)return;this.mistakes++;if(trip)this.trips++;}
  /** A message about the setup, marked as a diagnosis while the cabinet is still as found. */
  private explain(text:string){this.say(this.touched?text:`As found: ${text}`,'bad');}
  /** Too much current: the fuse trips with a click and warms; it conducts again once cool. */
  private trip(){
    const j=this.current()!,a=this.game.audio,first=!this.faultCounted;this.tripped=true;this.cooling=HOUSE.fuseCool;this.tripT=0;this.soak=0;this.fault(true);
    if(first)this.explain(judge(j,this.setup).problems[0]??'The fuse tripped.');
    a.ptcTrip();if(first)a.voice('groan',1.1);benchFault(this.game);this.kidStartle=.4;
    const at=this.boardWorld(FUSEX,TOPZ);this.game.burst({x:at.x,y:at.y+.15,z:at.z},'#fff3a3',12,'spark');if(first)this.game.alarm({x:this.table.x,z:this.table.z},5);
    this.marquee.draw('tilt',(c,w,h)=>drawMarquee(c,w,h,'TILT!',false,true));this.redraw();
  }
  /** A block failed: grossly overloaded it pops at once; a little over its rating it scorches and
   *  fails after a while. It comes off the board with a puff of smoke and the bench cuts out. */
  private popBlock(pos:Slot,slot=0,slow=false){
    const j=this.current()!,a=this.game.audio,r=read(j,this.setup);
    let v:Block,at:T.Vector3,p:number;
    if(pos==='across'){v=this.setup.across!;p=r.pP;this.setup.across=undefined;this.mineAcross=false;this.heat.across=0;at=this.boardWorld(ACRX,MIDZ);}
    else{v=this.setup.chain[pos][slot];p=r.blocks.find(b=>b.pos===pos&&b.slot===slot)?.p??0;this.setup.chain[pos].splice(slot,1);this.mine[pos]?.splice(slot,1);this.heat.blocks[pos].splice(slot,1);at=this.boardWorld(POSX[pos],TOPZ);}
    if(this.touched){this.mistakes++;this.spent+=BLOCK_COST;}this.powerOff();
    this.explain(slow?`The ${v} Ω block turned ${watts(p)} into heat (P = I²R) for ${HOUSE.scorchFail} s. It is a ¼ W part: it scorched and failed.`
      :`The ${v} Ω block turned ${watts(p)} into heat (P = I²R), far past its ¼ W rating: it popped.`);
    a.noise(.25,.1,900);a.pop();a.tone(150,.3,.05,'sawtooth');a.voice('alarm',1.2);benchFault(this.game);this.kidStartle=.4;
    // A small, low, short puff that drifts sideways, so it never hides the meter that explains the pop (R5-240).
    this.game.burst({x:at.x,y:at.y+.08,z:at.z},CANDY[v],8,'debris');this.game.burst({x:at.x,y:at.y+.1,z:at.z},'#8a8a96',3,'puff');this.game.alarm({x:this.table.x,z:this.table.z},5);this.redraw();
  }
  /** An LED driven far past its rating pops; a spare goes in after a moment. */
  private popLed(){
    const j=this.current()!,a=this.game.audio,why=popWhy(j,read(j,this.setup));
    if(this.touched){this.mistakes++;this.spent+=BLOCK_COST;}this.ledDead=1.2;this.powerOff();
    this.explain(why);
    a.noise(.15,.12,2600,'bandpass');a.tone(90,.25,.06,'square');a.voice('groan',1.2);
    benchFault(this.game);this.kidStartle=.4;
    const at=this.boardWorld(LEDX,MIDZ);this.game.burst({x:at.x,y:at.y+.15,z:at.z},'#ffffff',1,'flash');this.game.burst({x:at.x,y:at.y+.1,z:at.z},'#8a8a96',4,'puff');this.game.alarm({x:this.table.x,z:this.table.z},5);
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
    this.unhover();this.drawMeter();this.shown='';this.updatePanel();
  }
  private drawMeter(){
    const j=this.current(),r=this.reading(),hottest=Math.max(0,...this.heat.blocks.flat(),this.heat.across);
    const tier=this.verdict?.tier??-1;
    const key=JSON.stringify([this.index,this.live,this.tripped,Math.ceil(this.cooling*5),this.setup,Math.round(this.soak*5),this.soakDone,Math.round(this.heat.led*40),Math.round(hottest*40),this.passed,tier]);
    this.meter.draw(key,(c,w,h)=>drawMeter(c,w,h,j,r,{live:this.live,powered:this.powered,tripped:this.tripped,cooling:this.cooling,led:this.heat.led,block:hottest,soak:this.soak,soakDone:this.soakDone,soakTime:this.soakTime,s:this.setup,passed:this.passed,tier}));
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
    const m=map[code];if(!m)return false;
    // A S D X only place the block in hand; with empty hands they do nothing (WASD never empties a slot).
    if(m[0]==='slot'&&this.held===undefined)return true;
    this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;if(this.toast)this.toast.hidden=true;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';this.updatePanel();}
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
  /** Prize boxes knocked off their spot (R5-079): counted once each, never back. Three or more is the
   *  pyramid knocked over (the stack settles a few cm into itself at rest, so the margins are generous). */
  prizesDown=0;private prizeGone=new Set<number>();
  update(dt:number){
    if(!this.ready)this.setup0();
    // The bench lead was pulled out: the bench loses power (a harmless bit of chaos, no mistake).
    if(this.powered&&!this.game.benchLive()){this.powerOff();this.game.audio.tone(160,.3,.05,'triangle');}
    this.updatePrizes();
    // The play-test framing (R5-080): only while a play test is running or has passed, and only at the bench.
    // The framing holds for a 1.2 s beat after a sign-off, so the marquee confetti is seen (R5-087).
    {const want=(this.soak>0||this.game.time-this.signedAt<1.2)&&this.game.atBench?ArcadeBench.SOAK:ArcadeBench.REST,e=this.game.manual?1:1-Math.exp(-dt*3),v=this.view;
      v.distance+=(want.distance-v.distance)*e;v.pitch+=(want.pitch-v.pitch)*e;v.lookX=(v.lookX??0)+(want.lookX-(v.lookX??0))*e;}
    if(this.tray&&!this.trayReady){const q=this.tray.body.translation(),r=this.tray.body.rotation();this.trayRide.position.set(q.x,q.y,q.z);this.trayRide.quaternion.set(r.x,r.y,r.z,r.w);this.trayRide.visible=this.tray.mesh.visible;}
    const j=this.current(),r=this.reading(),time=this.game.time,k=1-Math.exp(-dt/HOUSE.tau),kl=1-Math.exp(-dt/HOUSE.ledTau);
    let playing=false;
    if(this.ledDead>0){this.ledDead-=dt;if(this.ledDead<=0){this.game.audio.pop();this.redraw();}}
    // The PTC fuse cools whether or not the bench is on; once cool it conducts again by itself.
    if(this.tripped){this.cooling-=dt;if(this.cooling<=0){this.tripped=false;this.cooling=0;this.game.audio.tone(640,.06,.03,'triangle');this.redraw();}}
    if(j&&r){
      if(this.live&&r.tripped){this.tripT+=dt;if(this.tripT>=.15)this.trip();}
      else if(this.live){
        this.tripT=0;this.runT+=dt;
        // Heat follows its steady value with the bench's time constant; parts cool when off.
        this.heat.led+=(r.level-this.heat.led)*kl;
        for(const b of r.blocks){const h=this.heat.blocks[b.pos];if(h&&h[b.slot]!==undefined)h[b.slot]+=(b.heat-h[b.slot])*k;}
        this.heat.across+=(r.pHeat-this.heat.across)*k;
        // Blocks: a gross overload pops one at once; above its rating it scorches, then fails.
        const all=this.heat.blocks.flatMap((p,pos)=>p.map((h,slot)=>({pos:pos as Slot,slot,h}))).concat(this.setup.across?[{pos:'across',slot:0,h:this.heat.across}]:[]);
        const pop=all.find(b=>b.h>HOUSE.blockPop),worst=all.reduce<typeof all[number]|undefined>((a,b)=>!a||b.h>a.h?b:a,undefined);
        if(worst&&worst.h>1)this.scorchT+=dt;else this.scorchT=0;
        if(pop)this.popBlock(pop.pos,pop.slot);
        else if(worst&&this.scorchT>HOUSE.scorchFail)this.popBlock(worst.pos,worst.slot,true);
        // The LED's die heats in a fraction of a second; far past its rating it burns out.
        else if(j.load.kind==='led'&&this.heat.led>HOUSE.ledPop)this.popLed();
        else{
          const v=judge(j,this.setup);
          // Explain a setup that does not work (why, never the fix), once it has run a moment.
          if(v.tier===0&&!this.explained&&this.runT>.6){this.explained=true;this.fault(false);this.explain(v.problems[0]);if(r.iLoad>j.load.imax)this.game.audio.voice('hm',.9);}
          if(v.tier>=1&&!this.soakDone){playing=true;this.soak+=dt;
            if(this.soak>=this.soakTime){this.soakDone=true;this.passed=true;this.verdict=v;this.say(`${TIER_WORD[v.tier]}${v.tier===3?' ★':''}${v.notes[0]?`: ${v.notes[0]}`:''}`,'ok');this.game.audio.bell(988,.4,.05);this.redraw();}}
          else if(this.soakDone)playing=true;
          // Rush overtime: the last cabinet signs itself off as soon as its play test passes.
          if(this.rush&&this.soakDone&&this.shift()>=RUSH_TIME){this.act('signoff');return;}
        }
      }else{this.heat.led-=this.heat.led*k;for(const p of this.heat.blocks)for(let i=0;i<p.length;i++)p[i]-=p[i]*k;this.heat.across-=this.heat.across*k;}
      this.animate(dt,j,r,playing,time);
    }
    this.drawMeter();this.updatePanel();
  }
  /** The LED, the cabinet, hot blocks, the fuse and the kid. */
  private animate(dt:number,j:Job,r:Reading,playing:boolean,time:number){
    // The LED (and the cabinet's lamp) glow with the current. An LED keeps its colour at any current:
    // overdriven it glares (a bigger halo that flickers), it never turns white.
    const on=this.live,level=on?r.level:0,over=level>1;this.flicker+=dt*30;
    const glowK=Math.min(1,level)*(over?.85+Math.sin(this.flicker*.8)*.15:1);
    this.ledDome.visible=this.ledDead<=0;
    this.flowMain.update(dt,on?r.i:0);
    if(j.load.kind==='led'){const col=LED_HEX[j.load.color];this.ledLight.distance=.8;
      if(level>.02){this.ledOn.color.set(col).multiplyScalar(.6+glowK*.55);this.ledDome.material=this.ledOn;}else this.ledDome.material=toon(tint(col));
      // Glare stays local (R5-240): the halo is capped at 0.6 m and 0.5 opacity, the light at 1.2.
      const halo=Math.min(3,level);(this.ledHalo.material as T.SpriteMaterial).opacity=level>.02?Math.min(.5,.2+halo*.15)*(over?.8+Math.sin(this.flicker)*.2:1):0;this.ledHalo.scale.setScalar(Math.min(.6,.3+halo*.15));this.ledLight.intensity=Math.min(1.2,level*1.6);
      if(level>.02){this.cabOn.color.set(col).multiplyScalar(.6+glowK*.55);this.cabLamp.material=this.cabOn;}else this.cabLamp.material=this.lampOff;(this.cabHalo.material as T.SpriteMaterial).color.set(col);(this.cabHalo.material as T.SpriteMaterial).opacity=Math.min(.9,glowK*.7);
    }else{
      // A typical transistor runs the motor fully from 2 mA; a weak one needs 5 mA. In between the
      // motor runs but judders: it would stall with a weaker part.
      const d=motorDrive(j.load,on?r.iLoad:0),marginal=d.typical>=1&&d.weak<1;
      this.spin+=dt*d.typical*14*(marginal?.6+.4*Math.abs(Math.sin(time*11)):1);this.coin.rotation.x=-this.spin;
      this.motor.rotation.z=marginal?Math.sin(time*47)*.04:0;
      this.flowMotor.update(dt,on?r.iLoad*j.load.beta*Math.min(1,d.typical):0);
      this.cabOn.color.set(LEMON).multiplyScalar(1.1);this.cabLamp.material=d.typical>=1?this.cabOn:this.lampOff;(this.cabHalo.material as T.SpriteMaterial).opacity=d.typical>=1?.5:0;(this.cabHalo.material as T.SpriteMaterial).color.set(LEMON);
      // An overloaded logic pin runs hot: its terminal glows orange and smokes.
      const pinHot=on&&r.iLoad>j.load.imax;if(pinHot){this.pinHot.color.set('#ff8a3d').multiplyScalar(1.2+Math.sin(time*9)*.2);this.pinPost.material=this.pinHot;}else this.pinPost.material=toon('#e5484d');
      if(pinHot&&Math.random()<dt*4){const at=this.boardWorld(SUPX,TOPZ);this.game.burst({x:at.x,y:at.y+.08,z:at.z},'#9a96a4',1,'smoke');}}
    // Hot blocks glow orange, then red, and smoke a little before they pop.
    const hotBody=(m:T.Mesh|undefined,v:Block|undefined,h:number)=>{if(!m||v===undefined)return;
      if(h>.6){const c=new T.Color(CANDY[v]).lerp(new T.Color(h>.9?'#ff4a2a':'#ff9a5b'),Math.min(1,(h-.6)*2.5));
        if(!(m.material instanceof T.MeshBasicMaterial))m.material=unlitMat();(m.material as T.MeshBasicMaterial).color.copy(c).multiplyScalar(.8+h*.4);}
      else if(m.material instanceof T.MeshBasicMaterial)m.material=toon(CANDY[v]);};
    this.setup.chain.forEach((p,pos)=>p.forEach((v,s)=>hotBody(this.bodies[pos][s],v,this.heat.blocks[pos]?.[s]??0)));
    hotBody(this.acrossBody,this.setup.across,this.heat.across);
    // A hot block gives off a thin wisp of smoke (small and local, so a scorching block can sit
    // there for seconds without clouding the bench).
    {const all=this.heat.blocks.flatMap((p,pos)=>p.map(h=>({h,x:POSX[pos],z:TOPZ}))).concat([{h:this.heat.across,x:ACRX,z:MIDZ}]),worst=all.reduce((a,b)=>b.h>a.h?b:a,{h:0,x:0,z:0});
      this.wisp.update(time,on&&worst.h>.8?Math.min(1,(worst.h-.8)*2):0,worst.x,worst.z);}
    // The fuse warms amber while it is tripped and fades back to yellow as it cools.
    const f=this.tripped?Math.min(1,this.cooling/HOUSE.fuseCool):0;
    if(f>0){this.fuseHot.color.set(LEMON).lerp(new T.Color('#ffb347'),Math.min(1,f*1.4)).multiplyScalar(1+f*.1);this.fuseDisc.material=this.fuseHot;}else this.fuseDisc.material=toon(LEMON);
    (this.fuseHalo.material as T.SpriteMaterial).opacity=f*.28;
    this.fusePips.forEach((p,i)=>{const want=i<this.trips?'#ff5a4a':'#3a4a40';if(p.userData.col!==want){p.userData.col=want;p.material=i<this.trips?hot(want,1.1):toon(want);}});
    this.cabScreen.material=on&&r.lit?this.screenOn:this.screenOff;
    // The kid: hops and mashes buttons while it plays, cheers when it passes (a shrug if it only just
    // works), slumps at a dark screen.
    const want=playing?1:0,meh=this.soakDone&&(this.verdict?.tier??0)<2,yay=this.soakDone&&!meh;this.hop+=(want-this.hop)*Math.min(1,dt*6);
    const bounce=Math.abs(Math.sin(time*(yay?9:7)))*(yay?.14:meh?.02:.07)*this.hop;
    this.kidStartle=Math.max(0,this.kidStartle-dt);const jump=this.kidStartle>0?Math.sin(this.kidStartle/.4*Math.PI)*.25:0;
    this.kidBody.position.y=.42+bounce+jump;this.kidBody.rotation.x=(1-this.hop)*.35;this.kidBody.rotation.z=meh?Math.sin(time*2.2)*.12:0;
    if(this.kidStartle>0)this.kidArms.forEach(a=>a.rotation.x=-2.8);else this.kidArms.forEach((a,i)=>a.rotation.x=yay?-2.8+Math.sin(time*9+i)*.2:meh?-1.5+Math.abs(Math.sin(time*2.2))*.5:-.9-this.hop*.3+Math.sin(time*16+i*2)*.25*this.hop);
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
    const key=JSON.stringify([this.active,this.index,this.setup,this.held,this.live,this.tripped,this.soakDone,this.trayReady,this.spent,this.served.length]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){const l=this.layer();if(!l){this.shown='';return;}this.panel=document.createElement('section');this.panel.className='station-panel panel arc-panel';l.append(this.panel);}
    this.panel.hidden=!j||!r;if(!j||!r)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const isLed=j.load.kind==='led',on=this.live,inBand=r.iLoad>=j.band[0]-1e-9&&r.iLoad<=j.band[1]+1e-9;
    const hottest=r.blocks.reduce((a,b)=>Math.max(a,b.p),0);
    // The clock lives on the HUD; the story job card already shows the ask, so only rush repeats it here.
    this.panel.innerHTML=`<header><small>${this.rush?`RUSH · ${this.served.length} fixed`:`${this.index+1}/${JOBS.length}`} · ${j.cabinet}</small>${this.rush?`<h4>${j.ask}</h4>`:''}${this.active?`<p>${j.story}</p>`:""}</header>`+
      (this.active&&this.trayReady?`<ul class="build">${row('Chain',chainText(this.setup.chain))}`+
        `${row('Current',on?`${mA(r.iLoad)} mA`:this.tripped?'fuse cooling':'off',on?inBand:undefined)}`+
        (on&&r.blocks.length?row('Hottest block',`${watts(hottest)} of ${watts(BLOCK_RATING)}`,hottest<=BLOCK_RATING*HOUSE.margin):'')+
        (j.battery&&on&&r.lifeH?row('Battery life',`≈ ${Math.round(r.lifeH)} h`):'')+
        `${row('Parts',`${partsCost(this.setup)} credit${partsCost(this.setup)===1?'':'s'}${this.spent?` · spent ${+this.spent.toFixed(1)}`:''}`)}</ul>`+
        `<p class="profile">${isLed?'I = (V − V<sub>f</sub>) ÷ R and P = I²R. Simplified LED: fixed V<sub>f</sub>, light ∝ current.':'I = (5 V − 0.7 V) ÷ R. Simplified: the base–emitter junction drops a fixed 0.7 V; β is 100 typical, 40 for a weak part.'} Blocks in a row add; side by side they share. House rule: blocks under ${HOUSE.margin*100} % of ¼ W.</p>`:'');
  }
  private hoverHint():Prompt|null{
    const h=this.hovered;if(!h||!this.active)return null;
    switch(h.act){
      case 'pick':{const v=Number(h.arg) as Block;return {key:String(BLOCKS.indexOf(v)+1),text:this.held===v?'Put it back':`Take a ${v} Ω block`};}
      case 'slot':{const s=h.arg as Slot;
        if(s==='across')return this.current()?.load.kind!=='led'?null:this.held!==undefined?{key:'X',text:'Put it across the LED'}:{key:'Click',text:this.setup.across?'Take it out':'Across the LED'};
        const p=this.setup.chain[s],key=POS_LETTERS[s];
        if(this.held!==undefined)return {key,text:p.length>=PER_POSITION?'Full':p.length?'Put it beside':'Put it here'};
        return {key:'Click',text:p.length?'Take a block out':'Empty: plain wire'};}
      case 'flip':return {key:'F',text:'Flip the LED'};
      case 'power':return this.powered&&this.tripped?{key:'',text:'Fuse cooling…'}:{key:'P',text:this.powered?'Power off':'Power on'};
      case 'signoff':return {key:'Enter',text:'Sign off'};
    }
    return null;
  }
  private updatePrizes(){const prizes=this.room?.prizes??[];
    prizes.forEach((p,k)=>{const t=p.body.translation(),r=p.body.rotation();p.mesh.position.set(t.x,t.y,t.z);p.mesh.quaternion.set(r.x,r.y,r.z,r.w);
      if(!this.prizeGone.has(k)&&(t.y<p.home.y-.3||Math.hypot(t.x-p.home.x,t.z-p.home.z)>.35)){this.prizeGone.add(k);this.prizesDown++;
        // The pyramid goes over: a ticket-machine jingle, confetti from the shelf, and the nearest players cheer.
        if(this.prizesDown===3){const g=this.game;g.audio.bell(1319,.3,.05);g.audio.bell(1568,.35,.05);g.burst({x:p.home.x,y:1.6,z:p.home.z},'#ffcf52',30,'confetti');g.cheerNear(p.home,7);}}});}
  prompt(atBench:boolean):Prompt|null{
    {const lead=this.game.leadPrompt(atBench);if(lead!==undefined)return lead;}
    const j=this.current();if(!j||this.game.won)return null;
    if(!atBench){const p=this.game.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z);
      if(this.game.held?.spec.id==='blocks')return {key:'E',text:near<2.4?'Set the tray on the bench':'Carry the tray'};
      if(!this.game.held&&this.game.nearest()?.spec.id==='blocks')return {key:'E',text:'Pick up the tray'};
      if(near<1.6)return {key:'E',text:'Work at the bench'};
      return null;}
    if(!this.trayReady)return {key:'E',text:'Fetch the resistor tray'};
    // The step prompt always says what its key does now; states with nothing to press show no key.
    if(this.soakDone)return {key:'Enter',text:'Sign off'};
    const hint=this.hoverHint();if(hint)return hint;
    if(this.held)return {key:'A S D',text:'Place it in the chain'};
    if(this.tripped)return {key:'',text:'Fuse cooling…'};
    if(this.powered)return this.soak>0?{key:'',text:'Play-testing…'}:{key:'P',text:'Power off'};
    return this.setup.chain.some(p=>p.length)?{key:'P',text:this.touched?'Power on':'Power on to see the fault'}:{key:'1–4',text:'Take a block'};
  }
  /** The win shot frames Pip with the lit back wall of fixed cabinets (R5-077). */
  winFocus(){return new T.Vector3(0,1.6,-6.4);}
  complete(){return this.rush?this.shift()>=RUSH_TIME&&!this.overtime():this.served.length>=JOBS.length;}
  /** Rush: cabinets fixed and seconds left, for the HUD clock and the result card. */
  rushStatus(){return this.rush?{served:this.served.length,left:Math.max(0,RUSH_TIME-this.shift())}:undefined;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){const j=this.current();return {index:this.index,prizesDown:this.prizesDown,job:j?.id??null,fix:j?best(j)??null:null,rush:this.rush,setup:clone(this.setup),held:this.held??null,powered:this.powered,live:this.live,
    tripped:this.tripped,cooling:+this.cooling.toFixed(2),soak:+this.soak.toFixed(2),soakDone:this.soakDone,verdict:this.verdict?{tier:this.verdict.tier,notes:this.verdict.notes}:null,
    served:this.served,mistakes:this.mistakes,trips:this.trips,spent:this.spent,trayReady:this.trayReady,reading:j?read(j,this.setup):null,
    heat:{led:this.heat.led,blocks:this.heat.blocks.map(p=>[...p]),across:this.heat.across}};}
}

/** Current made visible: small glowing dashes that run along a closed loop on the board while current
 *  flows, faster for more current. Board-local points; the loop closes back to its first point. */
class Flow {
  group=new T.Group();private dashes:T.Mesh[]=[];private curve=new T.CurvePath<T.Vector3>();private phase=0;private length:number;
  constructor(parent:T.Object3D,pts:[number,number][],spacing:number,size=1){
    const v=pts.map(([x,z])=>new T.Vector3(x,.042,z));for(let i=0;i<v.length;i++)this.curve.add(new T.LineCurve3(v[i],v[(i+1)%v.length]));
    this.length=this.curve.getLength();const mat=hot('#fff3a3',1.5),n=Math.max(4,Math.round(this.length/spacing));
    for(let i=0;i<n;i++){const m=new T.Mesh(new T.BoxGeometry(.035*size,.006,.016*size),mat);m.userData.noAO=true;m.castShadow=false;this.dashes.push(m);this.group.add(m);}
    parent.add(this.group);this.group.visible=false;
  }
  /** `amps` through the loop; nothing shows when it is not flowing. */
  update(dt:number,amps:number){
    const on=amps>5e-4;this.group.visible=on;if(!on)return;
    this.phase=(this.phase+dt*Math.min(.9,.06+amps*10)/this.length)%1;const up=new T.Vector3(1,0,0);
    this.dashes.forEach((m,i)=>{const u=(this.phase+i/this.dashes.length)%1,p=this.curve.getPointAt(u),t=this.curve.getTangentAt(u);m.position.copy(p);m.quaternion.setFromUnitVectors(up,t);});
  }
}
/** A thin wisp of smoke over a hot part: a few small puffs that rise, swell a little and fade. */
class Wisp {
  private puffs:T.Mesh[]=[];private mat=new T.MeshBasicMaterial({color:'#b9b4c4',transparent:true,depthWrite:false});
  constructor(parent:T.Object3D){this.mat.userData.outlineParameters={visible:false};
    for(let i=0;i<5;i++){const m=new T.Mesh(new T.IcosahedronGeometry(1,1),this.mat.clone());m.userData.noAO=true;m.castShadow=false;m.visible=false;parent.add(m);this.puffs.push(m);}}
  update(time:number,k:number,x:number,z:number){
    this.puffs.forEach((m,i)=>{m.visible=k>0;if(!m.visible)return;const u=(time*.55+i/this.puffs.length)%1;
      m.position.set(x+Math.sin(u*6+i)*.03,.09+u*.38,z+Math.cos(u*5+i)*.02);m.scale.setScalar(.018+u*.05);(m.material as T.MeshBasicMaterial).opacity=k*.55*Math.sin(u*Math.PI);});
  }
}
function unlitMat(){const m=new T.MeshBasicMaterial({color:'#ffffff'});m.userData.outlineParameters={visible:false};return m;}
function clone(s:Setup):Setup{return {chain:s.chain.map(p=>[...p]),across:s.across,reversed:s.reversed};}
function visibleUp(o:T.Object3D){let p:T.Object3D|null=o;while(p){if(!p.visible)return false;p=p.parent;}return true;}
/** An unlit LED is its own colour, a little pale. */
function tint(hex:string){const c=new T.Color(hex).lerp(new T.Color('#ffffff'),.25);return `#${c.getHexString()}`;}
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
  const isLed=j?.load.kind!=='base';
  line([[SUPX,TOPZ],[POSX[0]-PADW/2,TOPZ]]);
  for(let k=0;k<2;k++)line([[POSX[k]+PADW/2,TOPZ],[POSX[k+1]-PADW/2,TOPZ]]);
  line([[LEDX,TOPZ],[LEDX,TOPZ+.05]]);line([[LEDX,GNDZ],[LEDX,GNDZ-.05]]);
  if(isLed){line([[POSX[2]+PADW/2,TOPZ],[ACRX,TOPZ],[ACRX,TOPZ+.05]]);line([[SUPX,GNDZ],[ACRX,GNDZ],[ACRX,GNDZ-.05]]);}
  else{
    // Two loops share the emitter's ground: the thin base loop (logic pin → chain → B → E) and the
    // thick motor loop (12 V → motor → C → E → ground), which carries the big current.
    line([[POSX[2]+PADW/2,TOPZ],[LEDX,TOPZ]]);line([[SUPX,GNDZ],[LEDX,GNDZ]]);
    c.strokeStyle='#ffcf7a';c.lineWidth=30;line([[MOTX,TOPZ],[MOTX,MIDZ],[LEDX+.06,MIDZ]]);line([[LEDX,GNDZ],[MOTX,GNDZ]]);c.lineWidth=16;c.strokeStyle='#f0b25a';
  }
  c.fillStyle='#f0b25a';for(const [x,z] of (isLed?[[LEDX,TOPZ],[LEDX,GNDZ],[ACRX,TOPZ],[ACRX,GNDZ]]:[[LEDX,TOPZ],[LEDX,GNDZ]]) as [number,number][]){c.beginPath();c.arc(X(x),Y(z),13,0,7);c.fill();}
  const text=(t:string,x:number,z:number,size=30,col='#fffaf0')=>{c.font=FONT(size);c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';c.fillText(t,X(x),Y(z));};
  text(j?`${j.supply} V`:'',SUPX,MIDZ,48,LEMON);
  text('+',SUPX-.11,TOPZ,44,'#ff9a9a');text('−',SUPX-.11,GNDZ,44,'#fffaf0');
  text(isLed?'+':'B',LEDX-.1,TOPZ+.06,34,'#ff9a9a');text(isLed?'−':'E',LEDX-.1,GNDZ-.05,34);
  if(!isLed){text('C',LEDX+.1,MIDZ-.075,34,'#ffcf7a');text('12 V',MOTX-.15,TOPZ-.1,36,LEMON);}
  // The chain's key letters, printed under each position and the ACROSS slot.
  POSX.forEach((x,k)=>text(POS_LETTERS[k],x,TOPZ+.19,26,'rgba(255,250,240,.55)'));if(isLed)text('X',ACRX+.12,MIDZ,26,'rgba(255,250,240,.55)');
  // Legend strip along the front edge.
  c.fillStyle='rgba(20,50,38,.55)';c.fillRect(0,Y(LABZ-.055),w,Y(LABZ+.055)-Y(LABZ-.055));
  text(j?.battery?'BATTERY':isLed?'SUPPLY':'LOGIC PIN',SUPX,LABZ,26);text('FUSE',FUSEX,LABZ,26);text('CHAIN',POSX[1],LABZ,30,LEMON);
  text(isLed?'LED':'TRANSISTOR',LEDX,LABZ,26);text(isLed?'ACROSS':'MOTOR',isLed?ACRX:MOTX-.08,LABZ,26);
}
function drawMarquee(c:CanvasRenderingContext2D,w:number,h:number,title:string,done:boolean,tilt=false){
  const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,tilt?'#ff3b5c':PINK);g.addColorStop(.5,tilt?'#ff8a3d':LEMON);g.addColorStop(1,tilt?'#ff3b5c':MINT);
  c.fillStyle=done?PLUM:g;c.fillRect(0,0,w,h);
  c.fillStyle='rgba(255,255,255,.55)';for(let x=12;x<w;x+=28){c.beginPath();c.arc(x,8,4,0,7);c.fill();c.beginPath();c.arc(x+14,h-8,4,0,7);c.fill();}
  let s=64;c.font=FONT(s);while(c.measureText(title).width>w-60){s--;c.font=FONT(s);}
  c.textAlign='center';c.textBaseline='middle';c.lineWidth=10;c.strokeStyle=PLUM;c.strokeText(title,w/2,h/2+3);c.fillStyle=done?LEMON:'#fffaf0';c.fillText(title,w/2,h/2+3);
}
interface MeterState {live:boolean;powered:boolean;tripped:boolean;cooling:number;led:number;block:number;soak:number;soakDone:boolean;soakTime:number;s:Setup;passed:boolean;tier:number}
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
  const bar=(y:number,label:string,frac:number,band:[number,number]|null,star:[number,number]|null,limit:number|null,dash:number|null,col:string,right:string,max=1.5,danger:number|null=null)=>{
    c.fillStyle='rgba(255,255,255,.7)';c.font=FONT(22,600);c.textAlign='left';c.fillText(label,20,y+20);
    const x0=250,x1=w-150,bw=x1-x0,X=(v:number)=>x0+Math.min(1,Math.max(0,v/max))*bw;
    c.fillStyle='#2c2046';c.beginPath();c.roundRect(x0,y,bw,40,12);c.fill();
    if(danger!==null){c.fillStyle='rgba(255,90,80,.3)';c.fillRect(X(danger),y,x1-X(danger),40);}
    if(band){c.fillStyle='rgba(111,224,192,.28)';c.fillRect(X(band[0]),y,X(band[1])-X(band[0]),40);}
    if(star){c.fillStyle='rgba(255,216,77,.38)';c.fillRect(X(star[0]),y,X(star[1])-X(star[0]),40);c.fillStyle=LEMON;c.font=FONT(22);c.textAlign='center';c.fillText('★',(X(star[0])+X(star[1]))/2,y-12);}
    c.fillStyle=col;c.beginPath();c.roundRect(x0,y+8,Math.max(0,X(frac)-x0),24,8);c.fill();
    if(dash!==null){c.strokeStyle='rgba(255,216,77,.85)';c.setLineDash([7,7]);c.lineWidth=3;c.beginPath();c.moveTo(X(dash),y-4);c.lineTo(X(dash),y+44);c.stroke();c.setLineDash([]);}
    if(limit!==null){c.strokeStyle='#ff6b6b';c.lineWidth=5;c.beginPath();c.moveTo(X(limit),y-6);c.lineTo(X(limit),y+46);c.stroke();}
    c.fillStyle='#fffaf0';c.font=FONT(24);c.textAlign='right';c.fillText(right,w-18,y+20);
  };
  const lvl=on?r.level:0,im=j.load.imax,band:[number,number]=[j.band[0]/im,j.band[1]/im],sz=starZone(j),star:[number,number]=[sz[0]/im,sz[1]/im];
  const inBand=lvl>=band[0]-1e-9&&lvl<=band[1]+1e-9;
  // The ★ zone shows once this cabinet has passed a play test: before that, the band is the target.
  bar(170,isLed?'LIGHT':'BASE',lvl,band,m.passed?star:null,1,null,inBand?MINT:LEMON,on?`${mA(r.iLoad)} mA`:'off');
  // LED LOAD: current against the LED's rating (dashed: rated; red zone: it burns out at once).
  if(isLed)bar(232,'LED LOAD',m.led,null,null,HOUSE.ledPop,1,m.led>HOUSE.ledPop*.8?'#ff6b6b':m.led>1?'#ff9a5b':'#ff9ec6',on||m.led>.05?`${m.led.toFixed(1)}× rated`:'—',3,HOUSE.ledPop);
  else{const d=on&&j.load.kind==='base'?motorDrive(j.load,r.iLoad):{typical:0,weak:0},full=d.weak>=1,marginal=d.typical>=1&&!full;
    bar(232,'MOTOR',d.typical,null,null,null,null,full?MINT:marginal?'#ffb347':LEMON,on?full?'FULL':marginal?'FULL (typical part)':`${Math.round(d.typical*100)} %`:'off',1);}
  bar(294,'BLOCK HEAT',m.block,null,null,1,HOUSE.margin,m.block>1?'#ff6b6b':m.block>HOUSE.margin?'#ff8a3d':'#b9a6f5',r.blocks.length||m.s.across?`${Math.round(HOUSE.ambient+m.block*HOUSE.ratedRise)} °C`:'—',HOUSE.blockPop,1);
  // The play-test strip and the fuse.
  const y=362;c.fillStyle='#2c2046';c.beginPath();c.roundRect(16,y,w-32,64,16);c.fill();
  // A pass that misses the band only plays: amber, not the green tick.
  const meh=m.soakDone&&m.tier<2,lowBand=on&&r.iLoad<j.band[0];
  c.fillStyle=meh?'#ffb347':m.soakDone?'#6dff9a':'#8b7be8';c.beginPath();c.roundRect(16,y,(w-32)*Math.min(1,m.soak/m.soakTime),64,16);c.fill();
  c.fillStyle=m.soakDone?'#1d1430':'#fffaf0';c.font=FONT(28);c.textAlign='left';
  c.fillText(meh?`PLAYS · ${inBand?'HOT BLOCK':lowBand?isLed?'DIM':'LOW DRIVE':'OVER BAND'}`:m.soakDone?'PLAY TEST PASSED ✓':m.soak>0?`PLAY TEST  ${m.soak.toFixed(1)} / ${m.soakTime} s`:on?'NOT PLAYABLE':m.tripped?'':'POWER OFF',34,y+33);
  c.textAlign='right';c.fillStyle=m.tripped?'#ff6b6b':m.soakDone?'#1d1430':'#8dffd0';c.fillText(m.tripped?`FUSE COOLING ${m.cooling.toFixed(1)} s`:'FUSE OK',w-34,y+33);
  c.fillStyle='rgba(255,255,255,.7)';c.font=FONT(22,600);c.textAlign='left';
  const foot=j.battery?(on&&r.lifeH?`BATTERY  ≈ ${Math.round(r.lifeH)} h`:`BATTERY  ${HOUSE.battery} mAh`):`SUPPLY  ${j.supply} V   ·   ${isLed?`LED Vf ${j.load.vf.toFixed(1)} V`:'BASE 0.7 V'}`;
  c.fillText(foot,20,h-40);c.textAlign='right';c.fillText(`BLOCKS  ¼ W`,w-20,h-40);
}
