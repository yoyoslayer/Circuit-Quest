// Robot Garage bench. The delivery robot sits on the rolling-road test stand behind the bench,
// wired to a harness board on the table: BATTERY → FUSE → MOTOR → switch node → SWITCH (MOSFET)
// → ground, with the CONTROLLER on the right. Pip fits protection parts from the tray into three
// places (ACROSS MOTOR, ACROSS SWITCH, AT CONTROLLER), flips polarity, picks the controller's ground
// route, runs the motor once with PULSE and certifies the fix with TEST (five start/stop cycles).
// Current shows as pulses of light along the copper: when the switch opens they keep circling the
// motor through whatever gives them a path, fading as the coil empties; with no path they pile up
// at the switch, which avalanches (it flashes hot: the coil's energy is dumped in the switch itself), and the robot's controller reboots. The scope replays the last
// stop (or start). The PTC fuse resets itself once it cools. After the third job the robot drives
// its delivery route around the garage to the dock. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressGarage,robotMesh,STAND,PAD,ROUTE,YELLOW,TEAL,CREAM,type RobotParts} from './room';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,INK,DMETAL,freezeBench} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import {signOff,fault as benchFault} from '../shared';
import {parcelStack} from '../../levels/garage';
import {JOBS,PARTS,PART_IDS,SPEC,SWITCH,MOTOR,STALL,CTRL,SCOPE_TEXT,START_SPAN,judge,cost,cheapest,shutdownCached,startTrace,startDip,setupKey,placementKey,partCount,orientation,jobCoil,coilRunning,ms,
  type PartId,type SlotId,type Fit,type Setup,type Verdict,type Job,type Trace} from './logic';

const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
const COPPER='#e9a55a',BOARD='#2f7a5b',PAD_OFF='#cfe6d8',PAD_HOT='#ffd66b';
/** Label decal texture (auto-fits the words to the plate). */
function label(text:string,bg=CREAM,fg=INK,w=256,h=80){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(18,h*.3));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    let size=Math.round(h*.52);c.font=FONT(size);while(size>10&&c.measureText(text).width>w-24){size--;c.font=FONT(size);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);});
}
const labels=new Map<string,T.Texture>();
const cachedLabel=(text:string,bg=CREAM,fg=INK,w=256,h=80)=>{const k=`${text}|${bg}|${fg}|${w}|${h}`;let t=labels.get(k);if(!t){t=label(text,bg,fg,w,h);labels.set(k,t);}return t;};
/** A flat label plate lying on the table (tilt −π/2) or leaning back. */
function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,w=.4,h=.1,bg=CREAM,fg=INK,tilt=-Math.PI/2){
  const m=new T.MeshBasicMaterial({map:cachedLabel(text,bg,fg,512,Math.round(512*h/w)),transparent:true});m.userData.outlineParameters={visible:false};
  const p=part(parent,new T.PlaneGeometry(w,h),m,x,y,z,false);p.rotation.x=tilt;p.userData.noAO=true;return p;
}
const setSign=(p:T.Mesh,text:string,bg=CREAM,fg=INK,w=512,h=128)=>{(p.material as T.MeshBasicMaterial).map=cachedLabel(text,bg,fg,w,h);};
/** A part on its little carrier plate: the component on the back half, its name on the front half.
 *  Its band (cathode) or + lead is at −x, the left end, when it is not flipped. */
function partMesh(id:PartId){
  const g=new T.Group(),p=PARTS[id];
  part(g,rbox(.32,.05,.24,.03),toon('#efe2c8'),0,.025,0);
  const body=group(g,0,.08,-.045);body.name='body';
  // Bands are wide and bright white so which end they sit at reads from the bench camera.
  const BAND=toon('#ffffff');
  if(id==='diode'){part(body,cyl(.04,.04,.19,14,'x'),toon('#2b2d42'));part(body,cyl(.047,.047,.055,14,'x'),BAND,-.068,0,0);}
  // The clamp: an orange zener and a black diode joined in one sleeve, its band at the left end.
  if(id==='clamp'){part(body,cyl(.038,.038,.1,14,'x'),toon('#f08a4b'),-.045,0,0);part(body,cyl(.045,.045,.05,14,'x'),BAND,-.075,0,0);part(body,cyl(.036,.036,.09,14,'x'),toon('#2b2d42'),.05,0,0);part(body,cyl(.038,.038,.016,14,'x'),toon(INK),.008,0,0);}
  if(id==='tvs'){part(body,rbox(.18,.07,.1,.02),toon('#3a3d55'),0,0,0);part(body,box(.055,.076,.106),BAND,-.06,0,0);}
  if(id==='snubber'){part(body,cyl(.03,.03,.12,12,'x'),toon('#e8c79a'),-.06,0,0);for(const [x,c] of [[-.09,'#8a4b2a'],[-.066,INK],[-.042,'#8a4b2a']] as const)part(body,cyl(.032,.032,.012,12,'x'),toon(c),x,0,0);part(body,rbox(.08,.08,.06,.015),toon('#5b9cf0'),.06,0,0);}
  if(id==='cap'){const c=group(body,0,.02,0);part(c,cyl(.055,.055,.16,18,'x'),toon('#3f6fd6'));part(c,box(.16,.02,.022),toon('#e9edf3'),0,.048,0);part(c,cyl(.057,.057,.014,18,'x'),toon('#e9edf3'),.08,0,0);
    // The + mark turns with the can (a symmetric glyph, so it reads from either side).
    const plus=sign(body,'+',-.125,.01,0,.06,.06,'#fffaf0',INK,-1.1);(plus.material as T.Material).side=T.DoubleSide;}
  const tag=sign(g,p.label,0,.06,.07,.31,.1,CREAM,INK,-1.2);tag.name='tag';
  return g;
}
interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
interface Capture {job:number;key:string;verdict:Verdict;trace?:Trace;start:number[];at:number}
const ROUTE_LEN=ROUTE.slice(1).reduce((n,[x,z],k)=>n+Math.hypot(x-ROUTE[k][0],z-ROUTE[k][1]),0);
const DRIVE_SPEED=3.2,DRIVE_TIME=ROUTE_LEN/DRIVE_SPEED+.8;
/** Keyboard keys for the three sockets (as in key()). */
const SLOT_KEYS:Record<SlotId,string>={fly:'A',switch:'S',ctrl:'D'};
/** Board-space copper loops the current pulses follow (x, z; closed). */
type Loop=[number,number][];
const MAINZ=.04,TOPZ=-.19,GNDZ=.22,STARZ=.35;
/** The motor's return from the junction (.62) back to the battery's − (−1.28): a short straight
 *  wire, or in job 3 a long meandering one (the cargo bed moved the controller to the back). */
function groundRun(long:boolean):Loop{
  if(!long)return [[.62,GNDZ],[-1.28,GNDZ]];
  const out:Loop=[[.62,GNDZ]];let hi=false;for(let x=.5;x>-1.15;x-=.15){out.push([x,hi?.3:GNDZ]);hi=!hi;out.push([x,hi?.3:GNDZ]);}
  if(hi)out.push([-1.15,.3],[-1.15,GNDZ]);out.push([-1.28,GNDZ]);return out;
}
const runLoop=(long:boolean):Loop=>[[-1.2,MAINZ],[.62,MAINZ],...groundRun(long),[-1.28,MAINZ]];
const FLY_LOOP:Loop=[[-1.02,MAINZ],[-.2,MAINZ],[-.2,TOPZ],[-1.02,TOPZ]];
const swLoop=(long:boolean):Loop=>[[-1.2,MAINZ],[.06,MAINZ],[.06,TOPZ],[.62,TOPZ],...groundRun(long),[-1.28,MAINZ]];
/** The controller's own (small) return current: through the shared wire, or its own star wire. */
const ctrlPath=(long:boolean,star:boolean):Loop=>star?[[1.14,.16],[1.14,STARZ],[-1.42,STARZ],[-1.42,GNDZ],[-1.3,GNDZ]]:[[1.0,.16],[1.0,GNDZ],...groundRun(long)];
const pathLen=(l:Loop,closed=true)=>l.reduce((n,[x,z],k)=>{if(!closed&&k===l.length-1)return n;const [x1,z1]=l[(k+1)%l.length];return n+Math.hypot(x1-x,z1-z);},0);
const loopLen=(l:Loop)=>pathLen(l);
function along(l:Loop,u:number,out:T.Vector3,closed=true){let d=((u%1)+1)%1*pathLen(l,closed);
  for(let k=0;k<l.length-(closed?0:1);k++){const [x0,z0]=l[k],[x1,z1]=l[(k+1)%l.length],seg=Math.hypot(x1-x0,z1-z0);if(d<=seg){const f=seg?d/seg:0;return out.set(x0+(x1-x0)*f,0,z0+(z1-z0)*f);}d-=seg;}
  return out.set(l[0][0],0,l[0][1]);}
/** Seconds on screen per real second of the shutdown (the pulses replay it slowed right down). */
const SLOWMO=1200;
const DOTS=18,CTRL_DOTS=8,FUSE_COOL=2.5,RUN_TIME=.8;
/** Bench time charged for a PULSE that tries a new placement, past the first two per job; and for
 *  a tripped fuse or a vented capacitor at PULSE (scrap, not a mistake). */
const GND_HOT=new T.Color('#ff2a1a');
const PULSE_FEE=.1,SCRAP_FEE=.3,FREE_PLACEMENTS=2;
const msText=(t:number|null)=>t===null?'never':ms(t);
/** Small round marks at each socket's two ends: what that end connects to. */
const endMark=(kind:'+'|'node'|'gnd')=>canvasTex(96,96,c=>{c.clearRect(0,0,96,96);c.beginPath();c.arc(48,48,42,0,7);c.fillStyle=kind==='+'?'#e5484d':kind==='node'?YELLOW:'#c9ced8';c.fill();c.lineWidth=7;c.strokeStyle=INK;c.stroke();
  c.strokeStyle=kind==='+'?'#fffaf0':INK;c.lineWidth=11;c.lineCap='round';c.beginPath();
  if(kind==='+'){c.moveTo(48,24);c.lineTo(48,72);c.moveTo(24,48);c.lineTo(72,48);}
  else if(kind==='node'){c.fillStyle=INK;c.arc(48,48,13,0,7);c.fill();}
  else{c.lineWidth=8;c.moveTo(48,18);c.lineTo(48,40);c.moveTo(22,42);c.lineTo(74,42);c.moveTo(31,57);c.lineTo(65,57);c.moveTo(40,72);c.lineTo(56,72);}
  c.stroke();});
function visibleUp(o:T.Object3D){let p:T.Object3D|null=o;while(p){if(!p.visible)return false;p=p.parent;}return true;}
const shuffled=<X,>(a:X[])=>{const b=a.slice();for(let k=b.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[b[k],b[j]]=[b[j],b[k]];}return b;};

export class GarageBench implements Station {
  readonly view={distance:6.8,pitch:.86,lookY:.4,width:4.4};
  // Time: about 1.5× a slow first-time clean run (carry the robot, read three asks, a few PULSEs each).
  readonly limits={time:240,damage:1,cost:Math.ceil(JOBS.reduce((n,j)=>n+(cheapest(j)?.cost??0),0)*1.25*10)/10};
  readonly stand={x:0,z:-1.55};readonly table=new T.Vector3(0,1,-2.45);readonly facing=Math.PI;
  slots:Partial<Record<SlotId,Fit>>={};star=false;held?:PartId;fuse=true;cooling=0;scopeMode:'stop'|'start'='stop';
  jobIndex=0;logged:{job:string;verdict:Verdict}[]=[];mistakes=0;spent=0;onStand=false;driving=false;driveT=0;delivered=false;active=false;
  capture?:Capture;captures=0;lastSlot?:SlotId;
  /** The tray's order this run (keys 1–5 follow it), and which way round each part lies in the tray
   *  (true = band/+ at the right end). A part is fitted the way it lies; F turns the part in hand. */
  order:PartId[]=shuffled(PART_IDS);trayFlip:Record<PartId,boolean>={diode:false,clamp:false,tvs:false,snubber:false,cap:false};
  /** Placements PULSEd in this job (ignoring which way round), for the bench-time fee. */
  private tried=new Set<string>();
  /** The coil never switched off: it keeps running until the setup changes. */
  stuck=false;
  readonly job:StationJob;
  private root=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;
  private parts=new Map<PartId,T.Group>();private trayAt=new Map<PartId,T.Vector3>();private slotAt=new Map<SlotId,{pos:T.Vector3;pad:T.Mesh}>();
  private flipBtns=new Map<SlotId,T.Object3D>();private marks=new Map<SlotId,T.Mesh>();private shared!:T.Object3D;private starWire!:T.Object3D;private lever!:T.Object3D;private routeSign!:T.Mesh;
  private fuseDisc!:T.Mesh;private fuseHot=hot('#ff3b2a',1.4);private ctrlLamp!:T.Mesh;private cycleLamps:T.Mesh[]=[];
  /** The coil on the switch (the motor, or the brake coil in job 2), its sign and its section name. */
  private motorMesh!:T.Object3D;private brakeMesh!:T.Object3D;private brakeMat=toon('#e9a55a').clone();private coilSign!:T.Mesh;private flySection!:T.Mesh;
  /** The shared ground wire: short or long (job 3), tinted as the start surge lifts it. */
  private gndShort!:T.Object3D;private gndLong!:T.Object3D;private gndMat=toon(COPPER).clone();private gndHeat=0;private leverWiggle=0;
  private ctrlDots:T.Mesh[]=[];private ctrlU=0;private bumpCool=0;private harness?:T.Object3D;
  private mats={lampOn:hot('#8dffb0',1.4),lampBad:hot('#ff7a6b',1.4),lampOff:toon('#4a4f63'),eye:hot('#7fffe8',1.6),eyeBad:hot('#ff5a4d',1.6),eyeDead:toon('#34424a'),ok:hot('#8dffb0',1.6),bad:hot('#ff5a4d',2),off:toon('#4a4f63')};
  /** Current pulses on the copper, the arc across the switch, and the robot's dizzy reboot. */
  private dots:T.Mesh[]=[];private dotU:number[]=[];private dotMat=hot('#9ff3ea',2);
  private flow:{loop:Loop;amp:number;decay:number;run:boolean}={loop:runLoop(false),amp:0,decay:0,run:false};
  private kickT=-1;private kickV?:Verdict;private kickLoop:Loop|null=null;private kickLong=false;private kickBrake=false;private kickShared=0;private kickTrace?:Trace;private arc=new T.Group();private arcSegs:T.Mesh[]=[];private arcGlow!:T.Sprite;private arcT=0;private arcMax=.6;private arcLight!:T.PointLight;private dizzy=0;private fetBody!:T.Mesh;private fetHot=hot('#ff8a3d',1.25);private fetCold=toon(INK);
  /** The bench beat after a TEST pass (R5-087): the passed board stays fitted until the cycles finish. */
  private beatSlots?:GarageBench['slots'];private beatUntil=0;private pendingDrive=false;private whirrT=0;private headSpin=0;
  /** The robot's heading on its drive, integrated here, and the seconds it spent pointing well off
   *  its travel direction (snapshot: the drive must not crab-walk). */
  private driveYaw=0;private driveSlip=0;
  private scopeCanvas!:HTMLCanvasElement;private scopeTex!:T.CanvasTexture;private scopeKey='';private sweep=1;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';
  private bot?:Game['props'][number];private robot:RobotParts;private spin=0;private motorOn=0;private resetFlash=0;private cycleT=-1;private cycleFail=false;private ready=false;
  constructor(private game:Game){
    this.job={goal:'Stop the delivery robot resetting, then send it on its route',
      steps:[
        {text:'Carry the delivery robot onto the test stand behind the bench',done:()=>this.onStand,at:()=>this.game.held===this.bot?STAND:this.bot?.body.translation()??PAD},
        // The bench's mains lead (R5-079): no PULSE until it is plugged in at the wall.
        ...game.leadStep(),
        {text:'Sit at the garage bench (E)',done:()=>(this.active&&this.onStand)||this.logged.length>0,at:()=>this.stand},
        ...JOBS.map((j,i)=>({text:`Job ${i+1}: ${j.title}`,done:()=>this.logged.length>i,at:()=>this.stand})),
        {text:'Watch the robot drive its delivery route',done:()=>this.delivered,at:()=>this.bot?.body.translation()??STAND}],
      bonuses:[
        // A chaos bonus in the room (R5-079): bowl the parcel stack off the robot's painted route before it drives.
        {text:"Bowl the parcel stack off the robot's route",ok:()=>this.parcelsBowled},
        {text:'Elegant: the fewest parts each time',ok:()=>this.logged.length===JOBS.length&&this.logged.every(l=>l.verdict.tier===3)},
        {text:'No failed test',ok:()=>this.mistakes===0}]};
    this.rollTray();
    this.robot=robotMesh(TEAL,undefined,true);game.root.add(this.root);game.root.add(this.robot.root);
    this.buildBench();this.redraw();freezeBench(this.root,this,game,[this.gndShort,this.gndLong,this.starWire,this.shared,this.brakeMesh,this.motorMesh]);
  }
  dress(kit:RoomKit){return dressGarage(this.game,kit);}
  current():Job|undefined{return JOBS[this.jobIndex];}
  /** The job the board is wired for: the current one, or the last one once all have passed. */
  private boardJob():Job{return this.current()??JOBS[JOBS.length-1];}
  setup():Setup{return {...this.slots,star:this.star};}
  /** Each job the parts come back to the tray lying either way round: reading the band is the job. */
  private rollTray(){for(const id of PART_IDS)this.trayFlip[id]=PARTS[id].polar&&Math.random()<.5;}
  private long(){return this.boardJob().shared>.1;}

  // ---------- the bench ----------
  private buildBench(){
    const g=this.game,t=this.table,top=group(this.root,t.x,t.y,t.z);
    // Desk: pale wood top on a cream cabinet with a yellow kick stripe; a teal mat under the tray.
    part(g.decorRoot,rbox(4.3,1,1.25,.08),toon('#efe2c8'),t.x,.5,t.z);part(g.decorRoot,rbox(4.4,.07,1.35,.05),toon('#e2c08e'),t.x,1.0,t.z);
    part(g.decorRoot,box(4.32,.08,.04),toon(YELLOW),t.x,.1,t.z+.63);for(const x of [-1.07,1.07])part(g.decorRoot,box(.03,.8,.02),toon('#d8c6a4'),t.x+x,.5,t.z+.63);
    this.solid(4.3,1.05,1.25,t.x,.52,t.z);
    part(top,rbox(1.16,.012,.72,.06),toon('#2b4a55'),1.52,.04,.25);
    // ---- Harness board, front: battery → fuse → motor → switch node → switch → ground; controller on the right.
    const bx=-.62,bz=.25,board=group(top,bx,.046,bz),y=.034;
    part(board,rbox(2.94,.03,.76,.05),toon(BOARD),0,.015,0);
    const cu=toon(COPPER),TOP=TOPZ,MAIN=MAINZ,GND=GNDZ;
    const trace=(x0:number,z0:number,x1:number,z1:number,parent:T.Object3D=board,mat=cu,w=.04,h=.008)=>{const len=Math.hypot(x1-x0,z1-z0),m=part(parent,box(len+w,h,w),mat,(x0+x1)/2,y+(h-.008)/2,(z0+z1)/2,false);m.rotation.y=-Math.atan2(z1-z0,x1-x0);return m;};
    trace(-1.2,MAIN,.62,MAIN);trace(.62,TOP,.62,GND);
    // The motor's return to the battery: the stretch the controller's ground shares in "shared" mode.
    this.gndShort=group(board,0,0,0);this.gndLong=group(board,0,0,0);
    for(const [g2,long] of [[this.gndShort,false],[this.gndLong,true]] as const){const r=groundRun(long);for(let k=1;k<r.length;k++)trace(r[k-1][0],r[k-1][1],r[k][0],r[k][1],g2,this.gndMat);}
    trace(-1.02,MAIN,-1.02,TOP);trace(-1.02,TOP,-.2,TOP);trace(-.2,TOP,-.2,MAIN);   // across-motor path
    trace(.06,MAIN,.06,TOP);trace(.06,TOP,.62,TOP);                                   // across-switch path
    // Battery with its + and − terminals, and the resettable fuse on its + lead.
    const bat=group(board,-1.3,y,.12);part(bat,rbox(.22,.13,.36,.04),toon('#3a3d55'),0,.065,0);part(bat,rbox(.23,.02,.11,.02),toon('#e5484d'),0,.13,-.11);
    sign(bat,'12 V',0,.14,.05,.2,.09,YELLOW,INK,-1.2);
    // The PTC fuse: a yellow disc on two legs. Tripped, it glows red; once cool it conducts again.
    this.fuseDisc=part(board,cyl(.055,.055,.028,20,'z'),toon(YELLOW),-1.12,y+.075,MAIN);for(const d of [-.025,.025])part(board,cyl(.005,.005,.06,6),toon('#c9ced8'),-1.12+d,y+.03,MAIN,false);
    // The motor (a can on its side) between +12 V and the switch node.
    const mot=group(board,-.61,y,MAIN);part(mot,cyl(.085,.085,.26,18,'x'),glossyToon('#9aa3b2',{spec:.7,size:.97}),0,.09,0);part(mot,cyl(.087,.087,.04,18,'x'),toon(INK),-.13,.09,0);part(mot,cyl(.014,.014,.07,8,'x'),toon('#dfe3ea'),.165,.09,0);this.motorMesh=mot;
    // Job 2's brake coil in the motor's place: a copper-wound bobbin between two ink flanges.
    const brk=group(board,-.61,y,MAIN);part(brk,cyl(.07,.07,.2,18,'x'),this.brakeMat,0,.09,0);for(const x of [-.11,.11])part(brk,cyl(.09,.09,.02,18,'x'),toon(INK),x,.09,0);
    for(let k=0;k<6;k++)part(brk,cyl(.072,.072,.006,18,'x'),toon('#b87436'),-.08+k*.032,.09,0,false);part(brk,box(.2,.03,.14),toon(DMETAL),0,.015,0);brk.visible=false;this.brakeMesh=brk;
    this.coilSign=sign(board,'MOTOR',-.61,y+.02,.16,.3,.1,'#fffaf0',INK,-1.2);
    // Switch node test point (the scope's probe clips on here) and the MOSFET switch.
    part(board,cyl(.035,.035,.02,14),toon(YELLOW),-.06,y+.01,MAIN);part(board,cyl(.014,.014,.14,8),toon('#dfe3ea'),-.06,y+.08,MAIN);
    sign(board,'NODE',-.06,y+.02,.16,.22,.09,YELLOW,INK,-1.2);
    const fet=group(board,.34,y,MAIN);this.fetBody=part(fet,rbox(.18,.07,.12,.015),this.fetCold,0,.035,0);part(fet,box(.18,.014,.07),toon('#dfe3ea'),0,.014,-.09);
    sign(board,'SWITCH',.34,y+.02,.16,.3,.1,'#fffaf0',INK,-1.2);
    // Controller with its status lamp; the capacitor socket across its supply.
    const ctl=group(board,1.0,y,.04);part(ctl,rbox(.34,.07,.24,.03),toon('#2b2d42'),0,.035,0);for(let k=0;k<4;k++)for(const s of [-1,1])part(ctl,box(.024,.02,.05),toon('#dfe3ea'),-.12+k*.08,.01,s*.13);
    sign(ctl,'CONTROLLER',0,.075,.05,.33,.09,'#3a3d55','#fbf3e2',-1.2);this.ctrlLamp=part(ctl,sphere(.035,12,10),hot('#8dffb0',1.6),.12,.09,-.07,false);
    trace(1.0,TOP,1.0,-.08);
    // Ground routes: shared (joins the motor's return) or star (its own wire back to the battery).
    this.shared=group(board,0,0,0);trace(1.0,.16,1.0,GND,this.shared);trace(.62,GND,1.0,GND,this.shared);
    // The star wire: a thick, raised blue lead along the board's front edge, clear of every label.
    this.starWire=group(board,0,0,0);const blue=toon('#3f7fd6');
    for(const [a,b,c2,d] of [[1.14,.16,1.14,STARZ],[-1.42,STARZ,1.14,STARZ],[-1.42,STARZ,-1.42,GND],[-1.42,GND,-1.3,GND]] as const)trace(a,b,c2,d,this.starWire,blue,.055,.03);
    // The ground-route lever beside the controller: a big lever with a yellow knob.
    const lv=group(board,1.32,y,.1);part(lv,rbox(.2,.06,.2,.04),toon(INK),0,.03,0);this.lever=group(lv,0,.06,0);part(this.lever,cyl(.022,.022,.3,8),toon(DMETAL),0,.15,0);part(this.lever,sphere(.06,14,10),toon(YELLOW),0,.3,0);this.click(lv,'ground');
    this.routeSign=sign(board,'GROUND: SHARED',1.325,y+.02,.25,.27,.1,'#ffe7a8',INK,-1.2);this.click(this.routeSign,'ground');
    // Sockets: an empty socket is a pale pad with two clips; it glows when the held part fits.
    const dashed=canvasTex(256,184,c=>{c.clearRect(0,0,256,184);c.strokeStyle='rgba(29,58,51,.75)';c.lineWidth=9;c.setLineDash([22,14]);c.beginPath();c.roundRect(12,12,232,160,26);c.stroke();
      c.setLineDash([]);c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(128,62);c.lineTo(128,122);c.moveTo(98,92);c.lineTo(158,92);c.stroke();});
    // Each socket's ends carry a mark for what they connect to (+12 V red +, the yellow node, ground),
    // so the band on a part can be read against them.
    const marks={'+':endMark('+'),node:endMark('node'),gnd:endMark('gnd')};
    const ends:Record<SlotId,[keyof typeof marks,keyof typeof marks]>={fly:['+','node'],switch:['node','gnd'],ctrl:['+','gnd']};
    const socket=(id:SlotId,x:number,z:number)=>{const pad=part(board,rbox(.46,.016,.26,.04),toon(PAD_OFF),x,y+.004,z);this.click(pad,'slot',id);
      const mark=part(board,new T.PlaneGeometry(.34,.24),new T.MeshBasicMaterial({map:dashed,transparent:true}),x,y+.014,z,false);mark.rotation.x=-Math.PI/2;(mark.material as T.Material).userData.outlineParameters={visible:false};mark.userData.noAO=true;this.marks.set(id,mark);
      ends[id].forEach((k,n)=>{const m=new T.MeshBasicMaterial({map:marks[k],transparent:true});m.userData.outlineParameters={visible:false};const d=part(board,new T.PlaneGeometry(.06,.06),m,x+(n?.198:-.198),y+.016,z,false);d.rotation.x=-Math.PI/2;d.userData.noAO=true;});
      this.slotAt.set(id,{pos:new T.Vector3(bx+x,.09,bz+z),pad});};
    socket('fly',-.61,TOP);socket('switch',.34,TOP);socket('ctrl',1.0,TOP-.02);
    // Section names stand on little posts along the board's back edge, above the fitted parts.
    for(const [text,x] of [['ACROSS MOTOR',-.61],['ACROSS SWITCH',.34],['AT CONTROLLER',.94]] as const){for(const s of [-.14,.14])part(board,cyl(.008,.008,.12,6),toon(DMETAL),x+s,y+.06,-.36,false);const sg=sign(board,text,x,y+.15,-.36,.46,.1,'#fffaf0',INK,-.75);if(x<0)this.flySection=sg;}
    // Flip buttons beside each socket.
    for(const [id,x,z] of [['fly',-.93,TOP],['switch',.64,TOP],['ctrl',1.32,TOP-.02]] as const){
      const b=group(board,x,y+.01,z);part(b,cyl(.055,.06,.04,18),toon(INK),0,.02,0);const cap=part(b,cyl(.046,.046,.03,18),toon(TEAL),0,.045,0);cap.name='cap';
      sign(b,'⇄',0,.062,0,.075,.075,TEAL,'#fffaf0');this.flipBtns.set(id,b);this.click(b,'flip',id);}
    // ---- Parts tray, front right: five parts.
    part(top,rbox(1.1,.03,.68,.05),toon('#cbb488'),1.52,.055,.25);
    this.order.forEach((id,k)=>{const at=new T.Vector3(1.52+(k<3?(k-1)*.35:(k-3.5)*.35),.075,.25+(k<3?-.16:.17));this.trayAt.set(id,at);part(top,rbox(.34,.01,.26,.04),toon('#b99f71'),at.x,.073,at.z,false);
      const m=partMesh(id);m.position.copy(at);top.add(m);this.parts.set(id,m);this.click(m,'pick',id);});
    // ---- Scope, back left of centre: a cream cabinet with a live screen, SHUTDOWN / START-UP buttons.
    const scope=group(top,-.62,.04,-.42);part(scope,rbox(1.56,.1,.36,.06),toon('#2b4a55'),0,.05,0);
    const body=group(scope,0,.1,-.02);body.rotation.x=-.5;part(body,rbox(1.46,.92,.22,.08),toon('#e9dcc0'),0,.46,0);part(body,box(1.34,.78,.03),toon(INK),0,.48,.11);
    this.scopeCanvas=document.createElement('canvas');this.scopeCanvas.width=780;this.scopeCanvas.height=456;this.scopeTex=new T.CanvasTexture(this.scopeCanvas);this.scopeTex.colorSpace=T.SRGBColorSpace;this.scopeTex.anisotropy=4;
    const screenMat=new T.MeshBasicMaterial({map:this.scopeTex,toneMapped:false});screenMat.userData.outlineParameters={visible:false};
    const screen=part(body,new T.PlaneGeometry(1.3,.76),screenMat,0,.48,.128,false);screen.userData.noAO=true;part(body,box(1.48,.05,.24),toon(TEAL),0,.94,0);
    // ---- Test pod, back right: PULSE (scope one stop) and TEST (five cycles), with five cycle lamps.
    const pod=group(top,.92,.04,-.34);part(pod,rbox(.96,.08,.48,.05),toon('#3a3d55'),0,.04,0);
    const button=(x:number,color:string,act:string,text:string)=>{const b=group(pod,x,.08,-.06);part(b,cyl(.15,.17,.05,24),toon(INK),0,.025,0);part(b,cyl(.12,.12,.06,24),toon(color),0,.07,0);this.click(b,act);
      sign(pod,text,x,.1,.14,.3,.1,'#fffaf0',INK,-1.0);return b;};
    button(-.22,YELLOW,'pulse','PULSE');button(.22,'#6cc58a','test','TEST');
    // Five cycle lamps on the pod's front lip, in front of the buttons, each in a dark bezel.
    for(let k=0;k<5;k++){const x=-.18+k*.09;part(pod,cyl(.045,.05,.02,16),toon(INK),x,.085,.215,false);this.cycleLamps.push(part(pod,sphere(.035,12,10),this.mats.lampOff,x,.1,.215,false));}
    // Probe lead from the node to the scope; the harness from the bench to the robot on the stand.
    const lead=new T.CatmullRomCurve3([[bx-.06,.2,bz+MAIN],[bx-.1,.3,bz-.12],[bx-.14,.2,-.13],[bx-.12,.15,-.27]].map(([a,b,c])=>new T.Vector3(a,b,c)));
    part(top,new T.TubeGeometry(lead,20,.014,6),toon(YELLOW),0,0,0,false);
    // Current pulses: small bright beads that ride the copper.
    for(let k=0;k<DOTS;k++){const d=part(board,sphere(.028,10,8),this.dotMat,0,y+.03,0,false);d.visible=false;this.dots.push(d);this.dotU.push(k/DOTS);}
    // The controller's own small return current: little green beads on whichever ground it uses.
    const cm=hot('#8dffb0',1.6);for(let k=0;k<CTRL_DOTS;k++){const d=part(board,sphere(.016,8,6),cm,0,y+.03,0,false);d.visible=false;this.ctrlDots.push(d);}
    // The arc across the switch: a jagged chain of white-hot segments, re-jittered every frame while it burns.
    const arcCore=hot('#e8f8ff',3),arcSeg=cyl(.012,.012,1,6);board.add(this.arc);this.arc.visible=false;
    for(let k=0;k<9;k++){const m=new T.Mesh(arcSeg,arcCore);m.userData.noAO=true;this.arc.add(m);this.arcSegs.push(m);}
    // R5-029: no air arc across a MOSFET. An unclamped kick avalanches the switch: its body flashes
    // orange-hot under a small heat glow (kept under the bloom threshold and at most 0.35 opacity),
    // so the switch, the node and the socket stay readable.
    this.arcGlow=glow(board,'rgba(255,150,80,1)',.35,0);this.arcGlow.position.set(.34,y+.12,MAIN);
    this.arcLight=new T.PointLight('#ffb070',0,1,1.6);this.arcLight.position.set(.34,y+.3,MAIN);board.add(this.arcLight);
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    // Carrying on during the served beat ends it: the passed parts go back to the tray at once
    // (redrawn here, as a refused action returns before the redraw at the end).
    if(this.beatSlots){this.beatSlots=undefined;this.redraw();}
    const j=this.current(),a=this.game.audio;if(!j)return false;
    switch(name){
      case 'pick':{const id=arg as PartId;if(!PARTS[id])return false;
        if(this.held===id){this.held=undefined;a.tone(380,.05,.03,'triangle');break;}
        // Taking a fitted part out keeps it the way round it sat.
        for(const s of Object.keys(this.slots) as SlotId[])if(this.slots[s]?.part===id){this.trayFlip[id]=this.slots[s]!.flipped;delete this.slots[s];}
        this.held=id;a.pop();break;}
      case 'slot':{const s=arg as SlotId;if(!this.slotAt.has(s))return false;
        if(this.held){const p=PARTS[this.held];
          if(!p.slots.includes(s)){a.voice('hm',1.4);return false;}
          // The part goes in the way round it is lying; whatever sat there goes back to the tray.
          const old=this.slots[s];if(old)this.trayFlip[old.part]=old.flipped;
          this.slots[s]={part:this.held,flipped:p.polar&&this.trayFlip[this.held]};this.held=undefined;this.lastSlot=s;a.seat();break;}
        if(this.slots[s]){const old=this.slots[s]!;this.trayFlip[old.part]=old.flipped;delete this.slots[s];a.tone(300,.06,.04,'triangle');break;}
        a.voice('hm',1.4);return false;}
      case 'flip':{
        // F turns the part in hand; a flip button (or F with empty hands) turns a fitted part.
        if(this.held&&arg===undefined){if(!PARTS[this.held].polar)return false;this.trayFlip[this.held]=!this.trayFlip[this.held];a.tone(480,.06,.04,'triangle');a.pop();break;}
        const s=(arg as SlotId|undefined)??this.lastSlot;const f=s&&this.slots[s];
        if(!s||!f||!PARTS[f.part].polar)return false;
        f.flipped=!f.flipped;this.lastSlot=s;a.tone(480,.06,.04,'triangle');a.pop();break;}
      case 'ground':{this.star=!this.star;a.noise(.05,.05,2400,'highpass');a.tone(this.star?520:330,.08,.04,'triangle');break;}
      case 'clear':{if(!Object.keys(this.slots).length&&!this.held)return false;for(const f of Object.values(this.slots))if(f)this.trayFlip[f.part]=f.flipped;this.slots={};this.held=undefined;a.clatter();break;}
      case 'pulse':case 'test':{
        if(this.pendingDrive)return false;
        if(!this.onStand){this.say('The robot is still on its charging pad.');a.voice('hm',1.4);return false;}
        if(!this.fuse){a.voice('hm',1.2);return false;}
        if(this.game.benchDead()){this.say("No power: the bench lead isn't plugged in.",'bad');return false;}
        const s=this.setup(),coil=jobCoil(j),v=judge(j,s),tr=v.fault==='short'||v.fault==='cap'?undefined:shutdownCached(s,coil);
        this.capture={job:this.jobIndex,key:setupKey(s),verdict:v,trace:tr,start:startTrace(j,s),at:this.game.time};this.captures++;this.sweep=0;this.stuck=false;
        // The scope shows the problem; a start-up job stays on START once its stop is clean.
        this.scopeMode=v.fault==='start'||(j.startScope&&(v.fault===undefined))?'start':'stop';
        // Bench time: a PULSE that tries a new placement costs a little, past the first two in a job
        // (turning a part round and PULSEing again is free).
        if(name==='pulse'){const k=placementKey(s);if(!this.tried.has(k)){this.tried.add(k);if(this.tried.size>FREE_PLACEMENTS)this.spent+=PULSE_FEE;}}
        // A dead short or a vented capacitor at PULSE costs the scrapped part, not a mistake: PULSE is for looking.
        if(v.fault==='short'){this.tripFuse();if(name==='test')this.mistakes++;else this.spent+=SCRAP_FEE;this.say(v.problems[0],'bad');this.redraw();return true;}
        if(v.fault==='cap'){if(name==='test')this.mistakes++;else this.spent+=SCRAP_FEE;this.say(v.problems[0],'bad');a.noise(.35,.1,900);this.game.burst(this.boardPoint(.84,-.2).setY(this.table.y+.25),'#e9e4d6',10,'dust');this.redraw();return true;}
        if(name==='pulse'){this.kick(v,s);this.say(this.captionFor(v),v.tier>0?'ok':'bad');if(v.fault==='start')this.leverWiggle=.8;this.redraw();return true;}
        // TEST: five start/stop cycles.
        this.cycleT=0;this.cycleFail=v.tier===0;this.spent+=cost(s);this.kick(v,s,true);
        if(v.tier===0){this.mistakes++;
          this.say(v.problems[0],'bad');a.verdictFail(v.fault==='stop'||v.fault==='start'?'reset':v.fault==='slow'?'weak':'other');a.voice('groan',1);this.game.alarm({x:this.table.x,z:this.table.z},5);this.redraw();return true;}
        this.logged.push({job:j.id,verdict:v});
        this.say(`${['','Works','Reliable','Elegant'][v.tier]}${v.notes[0]?`: ${v.notes[0]}`:''}`,'ok');
        signOff(this.game,this,YELLOW,false);
        // The served beat (R5-087): the passed board stays fitted on screen while its five cycles run;
        // the parts go back to the tray once they finish (or at once if the player carries on).
        this.beatSlots={...this.slots};this.beatUntil=this.game.time+SPEC.cycles*.6+.4;
        this.jobIndex++;this.capture=undefined;this.captures=0;this.tried.clear();
        // The next job starts from a bare board: the parts go back to the tray, lying any which way.
        if(this.jobIndex<JOBS.length){this.slots={};this.star=false;this.held=undefined;this.rollTray();}
        // The last pass: the robot sets off once its test cycles have finished.
        else this.pendingDrive=true;
        this.redraw();return true;}
      default:return false;
    }
    this.redraw();return true;
  }
  /** Dead short: the PTC fuse trips with a bang and a shower of sparks, then cools and resets itself. */
  private tripFuse(){const a=this.game.audio;this.fuse=false;this.cooling=FUSE_COOL;this.flow.run=false;this.flow.amp=0;
    a.fuseBang();a.voice('groan',1.1);this.spark(-1.12);benchFault(this.game);this.game.alarm({x:this.table.x,z:this.table.z},5);}
  /** Runs the coil for a moment, then opens the switch: the pulses show where the coil's current goes. */
  private kick(v:Verdict,s:Setup,test=false){
    const j=this.current()!,tr=v.fault==='short'||v.fault==='cap'?undefined:shutdownCached(s,jobCoil(j));
    this.kickV=v;this.kickTrace=tr;this.kickLong=this.long();this.kickBrake=jobCoil(j).id==='brake';this.kickShared=this.star?0:j.shared;
    // Where the current goes once the switch opens: through whichever part actually carries it.
    this.kickLoop=v.fault==='stuck'?swLoop(this.kickLong):!tr||tr.path==='none'?null:tr.path==='fly'?FLY_LOOP:swLoop(this.kickLong);
    if(test){this.kickT=-1;if(v.fault==='stuck')this.stuck=true;return;}
    this.kickT=0;this.flow={loop:runLoop(this.kickLong),amp:1,decay:0,run:true};this.surge();
  }
  /** The start surge flows through the shared ground wire: it warms from copper toward red. */
  private surge(){if(!this.kickBrake)this.gndHeat=Math.min(1,this.kickShared*STALL/.9);}
  private captionFor(v:Verdict){
    // Cause only: the scope and the panel carry the numbers.
    if(v.fault==='stop')return 'Caught it: the switch node spiked at shutdown and the controller reset.';
    if(v.fault==='start')return 'Caught it: as the motor started, the controller\'s supply sagged and it browned out.';
    if(v.fault==='stuck')return `The ${jobCoil(this.current()!).name} never stopped: something across the switch is conducting like a closed switch.`;
    if(v.fault==='slow')return 'No reset, but the coil\'s current died too slowly: the brake grabbed late.';
    return 'Clean capture. TEST it.';
  }
  private boardPoint(x:number,z:number){return new T.Vector3(this.table.x-.45+x,this.table.y+.1,this.table.z+.27+z);}
  private spark(x:number){const p=this.boardPoint(x,.02);this.game.burst(p,'#fff3a3',14,'spark');this.game.burst(p,'#ffe36e',3,'star');}
  private startDrive(){
    const b=this.bot;if(!b){this.delivered=true;return;}
    // The test-cycle animation stops before the drive, so its beeps never run under it (R5-096).
    this.driving=true;this.driveT=0;this.driveSlip=0;this.driveYaw=new T.Euler().setFromQuaternion(new T.Quaternion().copy(b.body.rotation() as T.Quaternion),'YXZ').y;this.cycleT=-1;this.kickT=-1;this.pendingDrive=false;b.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);
    if(this.game.atBench)this.game.leaveBench();
    this.say('All three fixes pass. Off it goes on its delivery route!','ok');
  }

  // ---------- drawing ----------
  /** Where each part is drawn this frame (snapshot: the drawing must match the board). */
  private drawn:Partial<Record<PartId,SlotId>>={};
  redraw(){
    const slots=this.beatSlots??this.slots;this.drawn={};
    for(const id of PART_IDS){const m=this.parts.get(id)!,slot=(Object.keys(slots) as SlotId[]).find(s=>slots[s]?.part===id);
      const body=m.getObjectByName('body')!;
      if(slot){const f=slots[slot]!;this.drawn[id]=slot;m.position.copy(this.slotAt.get(slot)!.pos);body.rotation.y=f.flipped?Math.PI:0;}
      else{m.position.copy(this.trayAt.get(id)!);body.rotation.y=this.trayFlip[id]?Math.PI:0;}
      if(this.held===id)m.position.y+=.08;}
    // Every socket the part in hand can sit in glows (the choice of place is the player's).
    for(const [id,s] of this.slotAt){const fit=this.slots[id],ok=this.held&&PARTS[this.held].slots.includes(id);(s.pad.material as T.Material)=toon(ok?PAD_HOT:fit?'#2b4a55':PAD_OFF);
      this.marks.get(id)!.visible=!fit;const fb=this.flipBtns.get(id)!;fb.visible=!!fit&&PARTS[fit.part].polar;}
    this.shared.visible=!this.star;this.starWire.visible=this.star;
    const long=this.long(),brake=jobCoil(this.boardJob()).id==='brake';this.gndShort.visible=!long;this.gndLong.visible=long;
    this.motorMesh.visible=!brake;this.brakeMesh.visible=brake;setSign(this.coilSign,brake?'BRAKE COIL':'MOTOR','#fffaf0',INK,512,171);setSign(this.flySection,brake?'ACROSS COIL':'ACROSS MOTOR','#fffaf0',INK,512,111);
    setSign(this.routeSign,this.star?'GROUND: STAR':'GROUND: SHARED',this.star?'#b8d6ff':'#ffe7a8',INK,512,190);
    this.scopeKey='';this.shown='';this.updatePanel();
  }
  /** Scope screen: the last capture (switch-node volts + motor current, or the controller's rail at start). */
  private drawScope(){
    const j=this.current()??JOBS[JOBS.length-1],cap=this.capture,key=JSON.stringify([this.scopeMode,cap?.at,this.jobIndex,Math.min(1,this.sweep).toFixed(2),this.fuse,this.setupStale(),this.onStand]);
    if(key===this.scopeKey)return;this.scopeKey=key;
    const c=this.scopeCanvas.getContext('2d')!,W=this.scopeCanvas.width,H=this.scopeCanvas.height,L=24,R=W-24,TOPY=78,BOT=H-84;
    c.fillStyle='#0f2226';c.fillRect(0,0,W,H);c.strokeStyle='rgba(127,255,232,.13)';c.lineWidth=2;
    for(let k=0;k<=10;k++){const x=L+(R-L)*k/10;c.beginPath();c.moveTo(x,TOPY);c.lineTo(x,BOT);c.stroke();}for(let k=0;k<=6;k++){const yy=TOPY+(BOT-TOPY)*k/6;c.beginPath();c.moveTo(L,yy);c.lineTo(R,yy);c.stroke();}
    c.textBaseline='alphabetic';
    const title=(t:string)=>{c.fillStyle='#fbf3e2';c.font=FONT(38);c.textAlign='left';c.fillText(t,20,52);};
    const readout=(t:string,col:string)=>{c.fillStyle=col;c.font=FONT(44);c.textAlign='right';c.fillText(t,W-20,54);};
    const foot=(t:string,col:string)=>{c.fillStyle='#0a1719';c.fillRect(0,BOT+10,W,H-BOT-10);c.fillStyle=col;c.font=FONT(40);c.textAlign='left';c.fillText(t,20,H-26);};
    const hline=(yy:number,col:string,text:string)=>{c.setLineDash([16,12]);c.strokeStyle=col;c.lineWidth=4;c.beginPath();c.moveTo(L,yy);c.lineTo(R,yy);c.stroke();c.setLineDash([]);c.fillStyle=col;c.font=FONT(30,600);c.textAlign='right';c.fillText(text,R-8,yy-9);};
    const centre=(a:string,b?:string)=>{c.fillStyle='rgba(251,243,226,.9)';c.font=FONT(46);c.textAlign='center';c.fillText(a,W/2,H/2);if(b){c.font=FONT(32,600);c.fillText(b,W/2,H/2+50);}this.scopeTex.needsUpdate=true;};
    if(!this.fuse){title(SCOPE_TEXT.fuseTitle);c.fillStyle='#ff7a6b';centre(SCOPE_TEXT.fuse,SCOPE_TEXT.fuseSub);return;}
    if(!cap||cap.job!==this.jobIndex||(!cap.trace&&cap.verdict.fault!=='start')){title(this.scopeMode==='stop'?'SWITCH NODE · STOP':'CONTROLLER · START');
      centre(this.onStand?'Press PULSE':'Robot not on the stand',this.onStand?'to capture one start and stop':undefined);return;}
    const v=cap.verdict,sweep=Math.min(1,this.sweep);
    if(this.scopeMode==='stop'&&cap.trace){
      // 0.2 ms before to 2 ms after the switch opens (to twice the brake's limit in job 2).
      const tr=cap.trace,run=tr.running,t0=-.2e-3,t1=Math.max(2e-3,(j.stopSpec??0)*2),k0=Math.round((t0-tr.t0)/tr.dt),k1=Math.min(tr.v.length-1,Math.round((t1-tr.t0)/tr.dt));
      const X=(t:number)=>L+(t-t0)/(t1-t0)*(R-L),Y=(volts:number)=>BOT-Math.max(-4,Math.min(84,volts))/84*(BOT-TOPY),IY=(amps:number)=>BOT-Math.max(-.17,Math.min(1.33,amps/run))/1.33*(BOT-TOPY)*.55;
      title('SWITCH NODE · STOP');
      if(j.stopSpec){c.fillStyle='rgba(141,255,176,.12)';c.fillRect(X(0),TOPY,X(j.stopSpec)-X(0),BOT-TOPY);c.fillStyle='rgba(141,255,176,.9)';c.font=FONT(28,600);c.textAlign='left';c.fillText(`brake grabs ≤ ${j.stopSpec*1e3} ms`,X(0)+10,TOPY+32);}
      hline(Y(SPEC.spikeReset),'#ff7a6b',`resets above ${SPEC.spikeReset} V`);hline(Y(MOTOR.V),'rgba(251,243,226,.5)','12 V');
      c.strokeStyle='rgba(251,243,226,.35)';c.lineWidth=2;c.beginPath();c.moveTo(X(0),TOPY);c.lineTo(X(0),BOT);c.stroke();
      const last=k0+Math.max(2,Math.floor((k1-k0)*sweep));
      const plot=(arr:number[],f:(n:number)=>number,col:string,w:number)=>{c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.beginPath();for(let k=k0;k<=last;k++){const x=X(tr.t0+k*tr.dt),yy=f(arr[k]);k>k0?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();};
      plot(tr.i,IY,'#7fd8ff',5);plot(tr.v,Y,'#ffd66b',6);
      if(sweep>=1&&tr.offTime!==null&&tr.offTime<=t1){c.fillStyle='#7fd8ff';c.beginPath();c.arc(X(tr.offTime),IY(run*SPEC.offFraction),10,0,7);c.fill();}
      c.font=FONT(30,600);c.textAlign='right';c.fillStyle='#7fd8ff';c.fillText('current',R-8,TOPY+32);c.fillStyle='#ffd66b';c.fillText('volts',R-130,TOPY+32);
      readout(`PEAK ${Math.round(v.spike)} V`,v.spike>SPEC.spikeReset?'#ff7a6b':v.spike>SPEC.spikeReliable?'#ffd66b':'#8dffb0');
      const bad=v.fault==='stop',slow=v.fault==='slow'||v.fault==='stuck';
      foot(bad?'RESET at shutdown!':v.fault==='stuck'?'Coil never switched off':`Current off in ${msText(v.offTime)}${slow?' · too slow':''}`,bad||slow?'#ff7a6b':'#8dffb0');
    }else{
      const s=cap.start,n=s.length,pre=.1,X=(k:number)=>L+(pre+(1-pre)*k/(n-1))*(R-L),Y=(volts:number)=>BOT-(Math.max(3.9,Math.min(5.15,volts))-3.9)/1.25*(BOT-TOPY);
      title('CONTROLLER · START');
      hline(Y(CTRL.rail-SPEC.dipReset),'#ff7a6b',`resets below ${(CTRL.rail-SPEC.dipReset).toFixed(1)} V`);hline(Y(CTRL.rail),'rgba(251,243,226,.5)','5 V');
      const shown=Math.max(2,Math.floor(n*sweep));c.strokeStyle='#ffd66b';c.lineWidth=6;c.lineJoin='round';c.beginPath();c.moveTo(L,Y(CTRL.rail));c.lineTo(X(0),Y(CTRL.rail));for(let k=0;k<shown;k++)c.lineTo(X(k),Y(s[k]));c.stroke();
      c.fillStyle='rgba(251,243,226,.7)';c.font=FONT(28,600);c.textAlign='left';c.fillText(`motor starts: 0 → ${Math.round(START_SPAN*1e3)} ms`,X(0)+10,BOT-14);
      readout(`SAG ${v.dip.toFixed(2)} V`,v.dip>SPEC.dipReset?'#ff7a6b':v.dip>SPEC.dipReliable?'#ffd66b':'#8dffb0');
      foot(v.dip>SPEC.dipReset?'RESET at start-up!':'Supply holds at start-up',v.dip>SPEC.dipReset?'#ff7a6b':'#8dffb0');
    }
    if(this.setupStale()){c.fillStyle='#0a1719';c.fillRect(W-330,BOT+10,330,H-BOT-10);c.fillStyle='#ffd66b';c.font=FONT(32,600);c.textAlign='right';c.fillText('changed: PULSE',W-20,H-26);}
    this.scopeTex.needsUpdate=true;
  }
  private setupStale(){return !!this.capture&&this.capture.key!==setupKey(this.setup());}
  pointer(e:Pointer){
    // Hidden clickables (a flip button beside an empty socket) are not hit.
    const hits=e.ray.intersectObjects(this.clickables.filter(c=>visibleUp(c.obj)).map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.1);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found)this.act(found.act,found.arg);
  }
  key(code:string){
    // Number keys follow the tray's order this run, so a key number never encodes the answer.
    const map:Record<string,[string,unknown?]>={...Object.fromEntries(this.order.map((id,k)=>[`Digit${k+1}`,['pick',id]])),
      KeyA:['slot','fly'],KeyS:['slot','switch'],KeyD:['slot','ctrl'],KeyF:['flip'],KeyG:['ground'],KeyP:['pulse'],Enter:['test'],Backspace:['clear']};
    const m=map[code];if(!m)return false;
    // A S D only fit the part in hand: with empty hands they do nothing, so a player reaching for WASD
    // never pulls a fitted part out (taking a part out is a click on it).
    if(m[0]==='slot'&&!this.held)return true;
    this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;if(active&&this.toast)this.toast.hidden=true;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';if(this.ready)this.updatePanel();}
  dropped(p:Game['props'][number]){
    if(p.spec.id!=='robot'||this.onStand)return;const q=p.body.translation();
    if(Math.hypot(q.x-STAND.x,q.z-STAND.z)<2.6){this.onStand=true;this.placeOnStand();this.game.audio.plug();this.game.burst({x:STAND.x,y:1,z:STAND.z},'#9ff3ea',1,'ring');
      this.say('Robot on the stand and wired to the bench. Sit at the bench to diagnose it.','ok');this.redraw();}
  }
  private placeOnStand(){const b=this.bot;if(!b)return;b.body.setTranslation({x:STAND.x,y:STAND.y,z:STAND.z},true);b.body.setRotation(new T.Quaternion(),true);b.body.setLinvel({x:0,y:0,z:0},true);b.body.setAngvel({x:0,y:0,z:0},true);b.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);}
  // Wired to the stand the robot is a fixed body, and Game.nearest() never offers a fixed prop to E
  // (R6 stations-a-3). Its mesh stays visible, so the cable still wraps around it.
  private init(){this.ready=true;this.bot=this.game.props.find(p=>p.spec.id==='robot');this.parcels=this.game.props.filter(p=>parcelStack.includes(p.spec));this.harness=this.game.root.getObjectByName('garage-harness');
    // The robot prop is a cart physics body; the teal robot model is drawn over it instead.
    if(this.bot)for(const c of this.bot.mesh.children)c.scale.setScalar(0);
    this.redraw();}
  /** The parcel stack on the robot's route (R5-079): bowled once two of its three boxes are knocked
   *  off their spot, by anything, before the robot sets off on its route. */
  parcelsBowled=false;private parcels:Game['props']=[];
  private trackParcels(){if(this.parcelsBowled||this.driving||this.delivered)return;
    const off=this.parcels.filter(p=>{const t=p.body.translation();return Math.hypot(t.x-p.spec.x,t.z-p.spec.z)>.6||t.y<(p.spec.y??.3)-.25;}).length;
    if(off>=2){this.parcelsBowled=true;const at=this.parcels[2]?.body.translation()??{x:-7,y:.6,z:1};const g=this.game;g.burst({x:at.x,y:1,z:at.z},'#ffcf52',24,'confetti');g.audio.milestone();g.cheerNear(at,8);}}
  update(dt:number){
    if(!this.ready)this.init();
    this.trackParcels();
    const m=this.mats,w=new T.Vector3();
    // The PTC fuse glows while hot and conducts again once it has cooled.
    if(!this.fuse){this.cooling-=dt;if(this.cooling<=0){this.fuse=true;this.cooling=0;this.game.audio.tone(900,.05,.03,'triangle');this.redraw();}}
    const fh=this.fuse?0:Math.min(1,this.cooling/FUSE_COOL);
    if(fh>0){this.fuseHot.color.set(YELLOW).lerp(new T.Color('#ff3b2a'),Math.min(1,fh*1.4)).multiplyScalar(1+fh);this.fuseDisc.material=this.fuseHot;}else this.fuseDisc.material=toon(YELLOW);
    // A coil that never switched off keeps running until the setup changes.
    if(this.stuck&&this.setupStale()){this.stuck=false;this.flow.run=false;this.flow.decay=.3;}
    // PULSE: the coil runs for a moment, then the switch opens and the kick lands.
    if(this.kickT>=0){const was=this.kickT;this.kickT+=dt;this.motorOn=this.kickT<RUN_TIME?1:0;
      if(was===0&&this.kickV?.fault==='start')this.reboot();
      if(was<RUN_TIME&&this.kickT>=RUN_TIME)this.land(false);
      if(this.kickT>RUN_TIME+5)this.kickT=-1;}
    const b=this.bot,r=this.robot;
    this.bumpCool=Math.max(0,this.bumpCool-dt);
    if(this.driving&&b){this.driveT+=dt;const d=Math.min(ROUTE_LEN,Math.max(0,(this.driveT-.4)*DRIVE_SPEED));
      let left=d,k=1;while(k<ROUTE.length-1&&left>Math.hypot(ROUTE[k][0]-ROUTE[k-1][0],ROUTE[k][1]-ROUTE[k-1][1])){left-=Math.hypot(ROUTE[k][0]-ROUTE[k-1][0],ROUTE[k][1]-ROUTE[k-1][1]);k++;}
      const [x0,z0]=ROUTE[k-1],[x1,z1]=ROUTE[k],seg=Math.hypot(x1-x0,z1-z0),f=Math.min(1,left/seg),x=x0+(x1-x0)*f,z=z0+(z1-z0)*f;
      // The model's nose is +x: yaw −atan2(dz,dx) points it down the segment.
      const yaw=-Math.atan2(z1-z0,x1-x0),turn=Math.atan2(Math.sin(yaw-this.driveYaw),Math.cos(yaw-this.driveYaw));
      // The nose as drawn (from the body), against the travel direction, while the robot is moving.
      if(d>0&&d<ROUTE_LEN){const nose=new T.Vector3(1,0,0).applyQuaternion(new T.Quaternion().copy(b.body.rotation() as T.Quaternion));if(nose.x*(x1-x0)/seg+nose.z*(z1-z0)/seg<Math.cos(.6))this.driveSlip+=dt;}
      const ny=this.driveYaw=this.driveYaw+turn*Math.min(1,dt*6);
      const yy=d<1.2?STAND.y+(.35-STAND.y)*Math.min(1,d/1.2):.35;
      b.body.setNextKinematicTranslation({x,y:yy,z});b.body.setNextKinematicRotation(new T.Quaternion().setFromEuler(new T.Euler(0,ny,0)));
      this.motorOn=d<ROUTE_LEN?1:0;this.whirrT-=dt;if(this.motorOn&&this.whirrT<=0){this.whirrT=.45;this.game.audio.whirr();}
      if(this.driveT>=DRIVE_TIME&&!this.delivered){this.delivered=true;this.game.audio.docked();this.game.burst({x,y:1.2,z},'#8dffb0',20,'confetti');}
      // Standing in the lane is funny, not ignored: the robot honks, Pip sees stars, the crew looks up.
      if(this.bumpCool<=0&&d<ROUTE_LEN){const pp=this.game.player.translation();if(Math.hypot(pp.x-x,pp.z-z)<.95){this.bumpCool=1.6;const a=this.game.audio;a.tone(880,.1,.05,'square');a.tone(660,.14,.05,'square',.12);a.voice('alarm',1.6);
        this.game.burst({x:pp.x,y:pp.y+.9,z:pp.z},'#ffe36e',5,'star');this.game.alarm({x,z},4);}}}
    if(b){const p=b.body.translation(),q=b.body.rotation();r.root.position.set(p.x,p.y,p.z);r.root.quaternion.set(q.x,q.y,q.z,q.w);}
    // The bench harness is plugged into the robot only while it sits on the stand.
    if(this.harness)this.harness.visible=this.onStand&&!this.driving;
    // Wheels spin while the motor runs; the eyes and antenna show the controller's state.
    if(this.beatSlots&&this.game.time>=this.beatUntil){this.beatSlots=undefined;this.redraw();}
    if(this.pendingDrive&&this.cycleT<0)this.startDrive();
    if(this.cycleT>=0){const before=this.motorOn;this.cycleT+=dt;const c=Math.floor(this.cycleT/.6),on=this.cycleT%.6<.4;this.motorOn=(c<SPEC.cycles&&on)||this.stuck?1:0;
      if(this.motorOn&&!before){this.flow={loop:this.stuck?swLoop(this.kickLong):runLoop(this.kickLong),amp:1,decay:0,run:true};this.surge();if(this.kickV?.fault==='start')this.reboot();}
      if(!this.motorOn&&before)this.land(true);
      this.cycleLamps.forEach((l,k)=>l.material=k<Math.min(c+(on?0:1),SPEC.cycles)?(this.cycleFail?m.lampBad:m.lampOn):m.lampOff);
      if(c>=SPEC.cycles+2||(this.pendingDrive&&c>=SPEC.cycles))this.cycleT=-1;}
    else if(!this.driving&&this.kickT<0&&this.motorOn>0)this.motorOn=Math.max(0,this.motorOn-dt);
    if(this.stuck&&!this.driving)this.motorOn=1;
    // Job 2: the wheels keep turning until the brake coil's current dies and the spring brake grabs.
    const coasting=this.kickBrake&&!this.flow.run&&this.flow.amp>.04;
    this.spin+=dt*(this.motorOn>0?18:coasting?18*Math.min(1,this.flow.amp*1.5):0);r.wheels.forEach(w2=>w2.rotation.z=-this.spin);
    // The brake coil glows while it holds the brake off.
    this.brakeMat.emissive.set('#ffb347');this.brakeMat.emissiveIntensity=this.kickBrake?.9*this.flow.amp:0;
    this.resetFlash=Math.max(0,this.resetFlash-dt);
    const resetNow=this.resetFlash>0&&Math.floor(this.resetFlash*6)%2===0,dead=!this.fuse;
    // Until it is on the stand, the job robot's antenna lamp blinks red: it is the broken one.
    const broken=!this.onStand&&!this.driving&&Math.floor(this.game.time*3)%2===0;
    r.eyes.forEach(e=>{e.material=dead?m.eyeDead:resetNow?m.eyeBad:m.eye;e.scale.set(.4,1,1).multiplyScalar(this.resetFlash>0?1.4:1);});
    // On the stand the robot's head turns to look at the bench, so its face (and a reboot) reads from
    // the bench camera (R5-082); a reboot spins it once round. It faces forward again to drive.
    const head=r.face.parent;if(head){this.headSpin=Math.max(0,this.headSpin-dt);const want=this.onStand&&!this.driving?-1.2:0;
      head.rotation.y=want-(this.headSpin>0?(1-this.headSpin/.8)*Math.PI*2:0);}r.lamp.material=dead?m.off:resetNow||broken?m.bad:m.ok;
    this.ctrlLamp.material=dead?m.off:resetNow?m.bad:m.ok;
    // The shared ground wire warms with the start surge (the voltage it drops lifts the controller's ground).
    this.gndHeat=Math.max(0,this.gndHeat-dt*.5);this.gndMat.color.set(COPPER).lerp(GND_HOT,Math.min(1,this.gndHeat));this.gndMat.emissive.set('#ff3b2a');this.gndMat.emissiveIntensity=1.1*this.gndHeat;
    this.leverWiggle=Math.max(0,this.leverWiggle-dt);this.lever.rotation.z=(this.star?-.5:.5)+Math.sin(this.leverWiggle*28)*.18*Math.min(1,this.leverWiggle*2);
    // The controller's own return current, on whichever ground it uses.
    const cp=ctrlPath(this.long(),this.star),cl=pathLen(cp,false);this.ctrlU=(this.ctrlU+dt*.2/cl)%1;
    this.ctrlDots.forEach((d,k)=>{const u=(this.ctrlU+k/CTRL_DOTS)%1;d.visible=this.onStand&&this.fuse&&!this.driving&&!resetNow;if(!d.visible)return;along(cp,u,w,false);d.position.set(w.x,.06,w.z);d.scale.setScalar(.25+.75*Math.sin(Math.PI*u));});
    this.animateKick(dt);
    if(this.dizzy>0&&b){this.dizzy=Math.max(0,this.dizzy-dt);const wob=Math.sin(this.game.time*17)*.14*Math.min(1,this.dizzy);r.root.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(wob,0,wob*.6)));}
    this.sweep=Math.min(1,this.sweep+dt*1.4);this.drawScope();
    this.updatePanel();
  }
  /** The controller reboots: red eyes, a dizzy wobble and stars over the robot's head. */
  private reboot(){this.resetFlash=1.6;this.dizzy=1.8;this.headSpin=.8;const q=this.bot?.body.translation();if(q)this.game.burst({x:q.x,y:q.y+1.1,z:q.z},'#ffe36e',10,'star');this.game.audio.voice('alarm',1.4);}
  /** The switch has just opened: where does the coil's current go? */
  private land(test:boolean){
    const v=this.kickV;if(!v||this.driving)return;const tr=this.kickTrace;
    if(v.fault==='stop'){
      // Nowhere to go: the current piles up at the switch and arcs across it, and the controller reboots.
      this.flow.decay=.12;this.flow.run=false;this.arcT=this.arcMax=test?.3:.6;this.reboot();
      const a=this.game.audio;a.noise(test?.15:.35,.1,2600,'highpass');a.noise(.08,.1,900,'bandpass');
      const p=this.boardPoint(.34,.02);this.game.burst(p,'#ffb070',test?3:6,'spark');this.game.burst({x:p.x,y:p.y+.12,z:p.z},'#8a8a96',test?1:2,'puff');return;}
    // Never switched off: the current keeps flowing through the part across the switch, at full speed.
    if(v.fault==='stuck'){this.stuck=true;this.flow={loop:this.kickLoop??swLoop(this.kickLong),amp:1,decay:0,run:true};this.game.audio.tone(140,.6,.035,'sawtooth');return;}
    if(!this.kickLoop){this.flow.decay=.1;this.flow.run=false;return;}
    // A path: the pulses keep circling through it, at the same speed at first, fading as the coil empties (slowed right down).
    const off=tr?.offTime??3e-3;
    this.flow={loop:this.kickLoop,amp:1,decay:test?Math.min(.5,Math.max(.1,off*SLOWMO*.15)):Math.min(4,Math.max(.25,off*SLOWMO)),run:false};
    this.game.audio.tone(v.fault==='slow'?180:320,.25,.03,'sine');
  }
  private animateKick(dt:number){
    const f=this.flow,w=new T.Vector3();
    if(!f.run&&f.decay>0)f.amp*=Math.exp(-dt*2.3/f.decay);
    if(!f.run&&f.amp<.04)f.amp=0;
    // One speed constant: bead speed ∝ current, continuous at turn-off (the coil's current can't jump).
    const len=loopLen(f.loop),speed=.9*f.amp;
    this.dots.forEach((d,k)=>{this.dotU[k]=(this.dotU[k]+speed*dt/len)%1;d.visible=f.amp>0&&this.fuse;if(!d.visible)return;
      along(f.loop,this.dotU[k],w);d.position.set(w.x,.07,w.z);d.scale.setScalar(.5+.7*f.amp);});
    // The arc: a jagged bright line between the switch node and the switch, redrawn every frame.
    // The avalanche: the switch body glows orange-hot and cools over the beat (no air arc, R5-029).
    this.arcT=Math.max(0,this.arcT-dt);this.arc.visible=false;const heat=this.arcT>0?Math.min(1,this.arcT/this.arcMax*1.4):0;
    this.fetBody.material=heat>.05?this.fetHot:this.fetCold;this.fetHot.color.set('#ff8a3d').multiplyScalar(.6+.65*heat);
    this.arcLight.intensity=1.2*heat;(this.arcGlow.material as T.SpriteMaterial).opacity=.35*heat;
  }

  // ---------- panels ----------
  private say(text:string,tone:'ok'|'bad'|'info'='info'){
    if(!this.toast){this.toast=document.createElement('div');this.toast.className='station-toast';}
    if(!this.toast.isConnected)this.layer()?.append(this.toast);
    this.toast.textContent=text;this.toast.dataset.tone=tone;this.toast.hidden=false;this.toastUntil=this.game.time+Math.max(4,text.length*.06);
  }
  private layer(){return document.querySelector<HTMLElement>('[data-layer="hud"]');}
  private updatePanel(){
    if(this.toast&&!this.toast.hidden&&this.game.time>this.toastUntil&&this.game.running)this.toast.hidden=true;
    const j=this.current(),s=this.setup(),cap=this.capture&&this.capture.job===this.jobIndex?this.capture:undefined,stale=this.setupStale();
    const key=JSON.stringify([this.active,this.jobIndex,setupKey(s),this.held,this.fuse,Math.ceil(this.cooling*10),cap?.at,stale,this.onStand]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel';}
    if(!this.panel.isConnected)this.layer()?.append(this.panel);
    this.panel.hidden=!j||!this.active;if(!j||!this.active)return;
    // ok: passes (green) · false: fails (red) · null: not graded right now (grey).
    const row=(k:string,v:string,ok?:boolean|null)=>`<li class="${ok===undefined?'':ok===null?'no':ok?'ok':'bad'}"><span>${k}</span><b>${v}</b></li>`;
    const fit=(slot:SlotId)=>{const f=this.slots[slot];if(!f)return '—';const o=orientation(slot,f);return `${PARTS[f.part].label}${o?` (${o})`:''}`;};
    const v=cap?.verdict,m=(x:string)=>stale?'PULSE again':x,g=(ok:boolean)=>stale?null:ok;
    const coil=jobCoil(j),run=coilRunning(coil);
    this.panel.innerHTML=`<header><small>JOB ${this.jobIndex+1}/${JOBS.length} · ${partCount(s)} PART${partCount(s)===1?'':'S'} FITTED</small><h4>${j.title}</h4>${this.active?`<p>${j.ask}</p>`:""}</header>`+
      `<ul class="build">${row(coil.id==='brake'?'Across coil':'Across motor',fit('fly'))}${row('Across switch',fit('switch'))}${row('At controller',fit('ctrl'))}${row('Ground',this.star?'star (own wire)':'shared with motor',this.star?true:undefined)}`+
      (!this.fuse?row('Fuse',`cooling ${this.cooling.toFixed(1)} s`,false):'')+
      (v&&v.fault!=='short'&&v.fault!=='cap'?`${row('Stop spike',m(`${Math.round(v.spike)} V`),g(v.spike<=SPEC.spikeReset))}`+
        (j.stopSpec?row('Coil off',m(msText(v.offTime)),g(v.offTime!==null&&v.offTime<=j.stopSpec)):'')+
        row('Start sag',m(`${v.dip.toFixed(2)} V`),g(v.dip<=SPEC.dipReset)):'')+`</ul>`+
      `<p class="profile">The beads on the copper are the current, replayed about ${SLOWMO}× slower than life. Simplified model, this robot's tuning values: ${coil.id==='brake'?`brake coil ${MOTOR.V} V, ${coil.L*1e3} mH, ${coil.R} Ω, ${run} A`:`motor ${MOTOR.V} V, ${MOTOR.L*1e3} mH, ${MOTOR.R} Ω, ${run} A running, ${MOTOR.spinUp*1e3} ms to spin up`}. Switch abs max ${SWITCH.absMax} V. Controller resets above ${SPEC.spikeReset} V at the switch or a ${SPEC.dipReset} V supply sag.</p>`;
  }
  private hoverHint():Prompt|null{
    const h=this.hovered;if(!h||!this.active)return null;
    switch(h.act){
      case 'pick':{const id=h.arg as PartId;return {key:String(this.order.indexOf(id)+1),text:this.held===id?'Put it back':`Take the ${PARTS[id].name}`};}
      case 'slot':{const id=h.arg as SlotId,fits=this.held&&PARTS[this.held].slots.includes(id);
        return this.held?{key:SLOT_KEYS[id],text:fits?'Fit it here':'It does not fit here'}:{key:'Click',text:this.slots[id]?'Take it out':'Empty socket'};}
      case 'flip':return {key:'F',text:'Flip it round'};
      case 'ground':return {key:'G',text:this.star?'Ground: own wire':'Ground: shared'};
      case 'pulse':return {key:'P',text:'Pulse the motor'};
      case 'test':return {key:'Enter',text:`Test (${SPEC.cycles} cycles)`};
    }
    return null;
  }
  prompt(atBench:boolean):Prompt|null{
    {const lead=this.game.leadPrompt(atBench);if(lead!==undefined)return lead;}
    const j=this.current();
    if(this.driving)return this.delivered?null:{key:'',text:'Follow the robot to the dock'};
    if(!j)return null;
    if(!atBench){const g=this.game,p=g.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6;
      if(g.held===this.bot&&this.bot){const q=this.bot.body.translation();return {key:'E',text:Math.hypot(q.x-STAND.x,q.z-STAND.z)<2.6?'Set the robot on the stand':'Carry the robot'};}
      const by=!g.held&&this.bot&&g.nearest()===this.bot;
      if(by&&!this.onStand)return {key:'E',text:'Pick up the delivery robot'};
      // On the stand the robot is out of E's reach: say so when nothing else is in reach.
      const wired=this.onStand&&!g.held&&!!this.bot&&!g.nearest()&&Math.hypot(p.x-this.bot.body.translation().x,p.z-this.bot.body.translation().z)<1.65;
      // The bench only offers E once there is a robot on the stand to work on.
      if(near)return this.onStand?{key:'E',text:'Work at the bench'}:{key:'',text:'Bring the robot to the test stand first'};
      if(wired)return {key:'',text:'The robot is wired to the test stand'};
      return null;}
    const h=this.hoverHint();if(h)return h;
    if(!this.onStand)return {key:'',text:'Fetch the robot first'};
    if(!this.fuse)return {key:'',text:'Fuse cooling'};
    if(this.held){const p=PARTS[this.held];return {key:p.slots.map(s=>SLOT_KEYS[s]).join('/'),text:p.polar?'Fit it · F turns it':'Fit it'};}
    const cap=this.capture&&this.capture.job===this.jobIndex?this.capture:undefined;
    if(!cap||this.setupStale())return {key:'P',text:jobCoil(j).id==='brake'?'Pulse the brake coil':'Pulse the motor'};
    if(cap.verdict.tier===0)return {key:'1–5 · G',text:'Change the setup'};
    return {key:'Enter',text:`Test (${SPEC.cycles} cycles)`};
  }
  complete(){return this.delivered;}
  /** The win shot frames Pip with the robot at its dock (R5-077). */
  winFocus(){const q=this.bot?.body.translation();return q?new T.Vector3(q.x,q.y+.4,q.z):new T.Vector3(this.table.x,this.table.y+.5,this.table.z);}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  /** Page coordinates of each flip button's cap (browser tests drive the real pointer with these). */
  private flipScreens(){const cam=this.game.view.camera,rect=this.game.view.renderer.domElement.getBoundingClientRect(),out:Partial<Record<SlotId,[number,number]>>={};
    cam.updateMatrixWorld();this.root.updateMatrixWorld(true);
    for(const [id,b] of this.flipBtns){const v=b.localToWorld(new T.Vector3(0,.06,0)).project(cam);out[id]=[Math.round(rect.left+(v.x+1)/2*rect.width),Math.round(rect.top+(1-v.y)/2*rect.height)];}
    return out;}
  snapshot(){const j=this.current(),s=this.setup(),v=j?judge(j,s):undefined;
    return {job:this.jobIndex,parcelsBowled:this.parcelsBowled,logged:this.logged.map(l=>({job:l.job,tier:l.verdict.tier,spike:l.verdict.spike,offTime:l.verdict.offTime,parts:l.verdict.parts})),slots:{...this.slots},star:this.star,held:this.held??null,
      order:this.order,trayFlip:{...this.trayFlip},stuck:this.stuck,gndHeat:+this.gndHeat.toFixed(2),gndColor:this.gndMat.color.getHexString(),motorOn:this.motorOn,resetFlash:this.resetFlash,
      fuse:this.fuse,cooling:this.cooling,onStand:this.onStand,driving:this.driving,delivered:this.delivered,drawn:{...this.drawn},beat:!!this.beatSlots,flipAt:this.flipScreens(),hover:this.hovered?{act:this.hovered.act,arg:this.hovered.arg??null}:null,gndLong:this.gndLong.visible,driveSlip:+this.driveSlip.toFixed(2),mistakes:this.mistakes,spent:this.spent,scope:this.scopeMode,captures:this.captures,
      capture:this.capture?{fault:this.capture.verdict.fault??null,spike:this.capture.verdict.spike,offTime:this.capture.verdict.offTime,dip:this.capture.verdict.dip}:null,
      verdict:v?{tier:v.tier,fault:v.fault??null,spike:v.spike,dip:v.dip,offTime:v.offTime}:null,startDip:j?startDip(j,s):null};}
}
