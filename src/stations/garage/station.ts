// Robot Garage bench. The delivery robot sits on the rolling-road test stand behind the bench,
// wired to a harness board on the table: BATTERY → FUSE → MOTOR → switch node → SWITCH (MOSFET)
// → ground, with the CONTROLLER on the right. Pip fits protection parts from the tray into three
// places (ACROSS MOTOR, ACROSS SWITCH, AT CONTROLLER), flips polarity, picks the controller's ground
// route, runs the motor once with PULSE and certifies the fix with TEST (five start/stop cycles).
// Current shows as pulses of light along the copper: when the switch opens they keep circling the
// motor through whatever gives them a path, fading as the coil empties; with no path they pile up
// at the switch and arc across it, and the robot's controller reboots. The scope replays the last
// stop (or start). The PTC fuse resets itself once it cools. After the third job the robot drives
// its delivery route around the garage to the dock. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressGarage,robotMesh,STAND,PAD,ROUTE,YELLOW,TEAL,CREAM,type RobotParts} from './room';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,INK,DMETAL} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import {cheer} from '../shared';
import {JOBS,PARTS,PART_IDS,SPEC,SWITCH,MOTOR,RUNNING,CTRL,judge,cost,cheapest,shutdownCached,startTrace,startDip,setupKey,partCount,flyChain,
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
  if(id==='diode'){part(body,cyl(.04,.04,.19,14,'x'),toon('#2b2d42'));part(body,cyl(.042,.042,.035,14,'x'),toon('#e9edf3'),-.07,0,0);}
  // The clamp: an orange zener and a black diode joined in one sleeve, band toward the motor's +.
  if(id==='clamp'){part(body,cyl(.038,.038,.1,14,'x'),toon('#f08a4b'),-.045,0,0);part(body,cyl(.04,.04,.03,14,'x'),toon(INK),-.08,0,0);part(body,cyl(.036,.036,.09,14,'x'),toon('#2b2d42'),.05,0,0);part(body,cyl(.038,.038,.022,14,'x'),toon('#e9edf3'),.015,0,0);}
  if(id==='tvs'){part(body,rbox(.18,.07,.1,.02),toon('#3a3d55'),0,0,0);part(body,box(.035,.072,.102),toon('#e9edf3'),-.065,0,0);}
  if(id==='snubber'){part(body,cyl(.03,.03,.12,12,'x'),toon('#e8c79a'),-.06,0,0);for(const [x,c] of [[-.09,'#8a4b2a'],[-.066,INK],[-.042,'#8a4b2a']] as const)part(body,cyl(.032,.032,.012,12,'x'),toon(c),x,0,0);part(body,rbox(.08,.08,.06,.015),toon('#5b9cf0'),.06,0,0);}
  if(id==='cap'){const c=group(body,0,.02,0);part(c,cyl(.055,.055,.16,18,'x'),toon('#3f6fd6'));part(c,box(.16,.02,.022),toon('#e9edf3'),0,.048,0);part(c,cyl(.057,.057,.014,18,'x'),toon('#e9edf3'),.08,0,0);
    sign(g,'+',-.125,.09,-.045,.06,.06,'#fffaf0',INK,-1.1);}
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
const MAINZ=.04,TOPZ=-.19,GNDZ=.22;
const RUN_LOOP:Loop=[[-1.2,MAINZ],[.62,MAINZ],[.62,GNDZ],[-1.28,GNDZ],[-1.28,MAINZ]];
const FLY_LOOP:Loop=[[-1.02,MAINZ],[-.2,MAINZ],[-.2,TOPZ],[-1.02,TOPZ]];
const TVS_LOOP:Loop=[[-1.2,MAINZ],[.06,MAINZ],[.06,TOPZ],[.62,TOPZ],[.62,GNDZ],[-1.28,GNDZ],[-1.28,MAINZ]];
const loopLen=(l:Loop)=>l.reduce((n,[x,z],k)=>{const [x1,z1]=l[(k+1)%l.length];return n+Math.hypot(x1-x,z1-z);},0);
function along(l:Loop,u:number,out:T.Vector3){let d=((u%1)+1)%1*loopLen(l);
  for(let k=0;k<l.length;k++){const [x0,z0]=l[k],[x1,z1]=l[(k+1)%l.length],seg=Math.hypot(x1-x0,z1-z0);if(d<=seg){const f=seg?d/seg:0;return out.set(x0+(x1-x0)*f,0,z0+(z1-z0)*f);}d-=seg;}
  return out.set(l[0][0],0,l[0][1]);}
/** Seconds on screen per real second of the shutdown (the pulses replay it slowed right down). */
const SLOWMO=1200;
const DOTS=18,FUSE_COOL=2.5,RUN_TIME=.8;
const msText=(t:number|null)=>t===null?'never':`${(t*1e3).toFixed(2)} ms`;

export class GarageBench implements Station {
  readonly view={distance:6.8,pitch:.86,lookY:.4};
  readonly limits={time:420,damage:1,cost:Math.ceil(JOBS.reduce((n,j)=>n+(cheapest(j)?.cost??0),0)*1.25*10)/10};
  readonly stand={x:0,z:-1.55};readonly table=new T.Vector3(0,1,-2.45);readonly facing=Math.PI;
  slots:Partial<Record<SlotId,Fit>>={};star=false;held?:PartId;fuse=true;cooling=0;scopeMode:'stop'|'start'='stop';
  jobIndex=0;logged:{job:string;verdict:Verdict}[]=[];mistakes=0;spent=0;onStand=false;driving=false;driveT=0;delivered=false;active=false;
  capture?:Capture;captures=0;lastSlot?:SlotId;
  readonly job:StationJob;
  private root=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;
  private parts=new Map<PartId,T.Group>();private trayAt=new Map<PartId,T.Vector3>();private slotAt=new Map<SlotId,{pos:T.Vector3;pad:T.Mesh}>();
  private flipBtns=new Map<SlotId,T.Object3D>();private marks=new Map<SlotId,T.Mesh>();private shared!:T.Object3D;private starWire!:T.Object3D;private lever!:T.Object3D;private routeSign!:T.Mesh;
  private fuseDisc!:T.Mesh;private fuseHot=hot('#ff3b2a',1.4);private ctrlLamp!:T.Mesh;private cycleLamps:T.Mesh[]=[];
  /** Current pulses on the copper, the arc across the switch, and the robot's dizzy reboot. */
  private dots:T.Mesh[]=[];private dotU:number[]=[];private dotMat=hot('#9ff3ea',2);
  private flow:{loop:Loop;amp:number;decay:number;run:boolean}={loop:RUN_LOOP,amp:0,decay:0,run:false};
  private kickT=-1;private kickV?:Verdict;private kickLoop:Loop|null=null;private arc=new T.Group();private arcSegs:T.Mesh[]=[];private arcGlow!:T.Sprite;private arcT=0;private arcLight!:T.PointLight;private dizzy=0;
  private scopeCanvas!:HTMLCanvasElement;private scopeTex!:T.CanvasTexture;private scopeKey='';private sweep=1;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';
  private bot?:Game['props'][number];private robot:RobotParts;private spin=0;private motorOn=0;private resetFlash=0;private cycleT=-1;private cycleFail=false;private ready=false;
  constructor(private game:Game){
    this.job={goal:'Stop the delivery robot resetting, then send it on its route',
      steps:[
        {text:'Carry the delivery robot onto the test stand behind the bench',done:()=>this.onStand,at:()=>this.bot?.body.translation()??PAD},
        {text:'Sit at the garage bench (E)',done:()=>this.active||this.logged.length>0,at:()=>this.stand},
        ...JOBS.map((j,i)=>({text:`Job ${i+1}: ${j.title}`,done:()=>this.logged.length>i,at:()=>this.stand})),
        {text:'Watch the robot drive its delivery route',done:()=>this.delivered,at:()=>this.bot?.body.translation()??STAND}],
      bonuses:[
        {text:`Every fix reliable (spike ≤ ${SPEC.spikeReliable} V, supply sag ≤ ${SPEC.dipReliable} V)`,ok:()=>this.logged.length===JOBS.length&&this.logged.every(l=>l.verdict.tier>=2)},
        {text:'Elegant: the fewest parts each time',ok:()=>this.logged.length===JOBS.length&&this.logged.every(l=>l.verdict.tier===3)},
        {text:'No failed test and no tripped fuse',ok:()=>this.mistakes===0}]};
    this.robot=robotMesh();game.root.add(this.root);game.root.add(this.robot.root);
    this.buildBench();this.redraw();
  }
  dress(kit:RoomKit){return dressGarage(this.game,kit);}
  current():Job|undefined{return JOBS[this.jobIndex];}
  setup():Setup{return {...this.slots,star:this.star};}

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
    const cu=toon(COPPER),TOP=-.19,MAIN=.04,GND=.22,STAR=.32;
    const trace=(x0:number,z0:number,x1:number,z1:number,parent:T.Object3D=board,mat=cu)=>{const len=Math.hypot(x1-x0,z1-z0),m=part(parent,box(len+.04,.008,.04),mat,(x0+x1)/2,y,(z0+z1)/2,false);m.rotation.y=-Math.atan2(z1-z0,x1-x0);return m;};
    trace(-1.2,MAIN,.62,MAIN);trace(.62,TOP,.62,GND);trace(-1.28,GND,.62,GND);
    trace(-1.02,MAIN,-1.02,TOP);trace(-1.02,TOP,-.2,TOP);trace(-.2,TOP,-.2,MAIN);   // across-motor path
    trace(.06,MAIN,.06,TOP);trace(.06,TOP,.62,TOP);                                   // across-switch path
    // Battery with its + and − terminals, and the resettable fuse on its + lead.
    const bat=group(board,-1.3,y,.12);part(bat,rbox(.22,.13,.36,.04),toon('#3a3d55'),0,.065,0);part(bat,rbox(.23,.02,.11,.02),toon('#e5484d'),0,.13,-.11);
    sign(bat,'12 V',0,.14,.05,.2,.09,YELLOW,INK,-1.2);
    // The PTC fuse: a yellow disc on two legs. Tripped, it glows red; once cool it conducts again.
    this.fuseDisc=part(board,cyl(.055,.055,.028,20,'z'),toon(YELLOW),-1.12,y+.075,MAIN);for(const d of [-.025,.025])part(board,cyl(.005,.005,.06,6),toon('#c9ced8'),-1.12+d,y+.03,MAIN,false);
    // The motor (a can on its side) between +12 V and the switch node.
    const mot=group(board,-.61,y,MAIN);part(mot,cyl(.085,.085,.26,18,'x'),glossyToon('#9aa3b2',{spec:.7,size:.97}),0,.09,0);part(mot,cyl(.087,.087,.04,18,'x'),toon(INK),-.13,.09,0);part(mot,cyl(.014,.014,.07,8,'x'),toon('#dfe3ea'),.165,.09,0);
    sign(board,'MOTOR',-.61,y+.02,.16,.3,.1,'#fffaf0',INK,-1.2);
    // Switch node test point (the scope's probe clips on here) and the MOSFET switch.
    part(board,cyl(.035,.035,.02,14),toon(YELLOW),-.06,y+.01,MAIN);part(board,cyl(.014,.014,.14,8),toon('#dfe3ea'),-.06,y+.08,MAIN);
    sign(board,'NODE',-.06,y+.02,.16,.22,.09,YELLOW,INK,-1.2);
    const fet=group(board,.34,y,MAIN);part(fet,rbox(.18,.07,.12,.015),toon(INK),0,.035,0);part(fet,box(.18,.014,.07),toon('#dfe3ea'),0,.014,-.09);
    sign(board,'SWITCH',.34,y+.02,.16,.3,.1,'#fffaf0',INK,-1.2);
    // Controller with its status lamp; the capacitor socket across its supply.
    const ctl=group(board,1.0,y,.04);part(ctl,rbox(.34,.07,.24,.03),toon('#2b2d42'),0,.035,0);for(let k=0;k<4;k++)for(const s of [-1,1])part(ctl,box(.024,.02,.05),toon('#dfe3ea'),-.12+k*.08,.01,s*.13);
    sign(ctl,'CONTROLLER',0,.075,.05,.33,.09,'#3a3d55','#fbf3e2',-1.2);this.ctrlLamp=part(ctl,sphere(.035,12,10),hot('#8dffb0',1.6),.12,.09,-.07,false);
    trace(1.0,TOP,1.0,-.08);
    // Ground routes: shared (joins the motor's return) or star (its own wire back to the battery).
    this.shared=group(board,0,0,0);trace(1.0,.16,1.0,GND,this.shared);trace(.62,GND,1.0,GND,this.shared);
    this.starWire=group(board,0,0,0);const blue=toon('#5b9cf0');trace(1.14,.16,1.14,STAR,this.starWire,blue);trace(-1.42,STAR,1.14,STAR,this.starWire,blue);trace(-1.42,STAR,-1.42,GND,this.starWire,blue);trace(-1.42,GND,-1.3,GND,this.starWire,blue);
    // The ground-route lever beside the controller.
    const lv=group(board,1.32,y,.1);part(lv,rbox(.16,.05,.18,.04),toon(INK),0,.025,0);this.lever=group(lv,0,.05,0);part(this.lever,cyl(.014,.014,.18,8),toon(DMETAL),0,.09,0);part(this.lever,sphere(.04,12,10),toon('#5b9cf0'),0,.18,0);this.click(lv,'ground');
    this.routeSign=sign(board,'GROUND: SHARED',1.2,y+.02,.31,.46,.11,'#ffe7a8',INK,-1.2);
    // Sockets: an empty socket is a pale pad with two clips; it glows when the held part fits.
    const dashed=canvasTex(256,184,c=>{c.clearRect(0,0,256,184);c.strokeStyle='rgba(29,58,51,.75)';c.lineWidth=9;c.setLineDash([22,14]);c.beginPath();c.roundRect(12,12,232,160,26);c.stroke();
      c.setLineDash([]);c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(128,62);c.lineTo(128,122);c.moveTo(98,92);c.lineTo(158,92);c.stroke();});
    const socket=(id:SlotId,x:number,z:number)=>{const pad=part(board,rbox(.36,.016,.26,.04),toon(PAD_OFF),x,y+.004,z);this.click(pad,'slot',id);
      const mark=part(board,new T.PlaneGeometry(.34,.24),new T.MeshBasicMaterial({map:dashed,transparent:true}),x,y+.014,z,false);mark.rotation.x=-Math.PI/2;(mark.material as T.Material).userData.outlineParameters={visible:false};mark.userData.noAO=true;this.marks.set(id,mark);
      this.slotAt.set(id,{pos:new T.Vector3(bx+x,.09,bz+z),pad});};
    socket('fly',-.61,TOP);socket('switch',.34,TOP);socket('ctrl',1.0,TOP-.02);
    // Section names stand on little posts along the board's back edge, above the fitted parts.
    for(const [text,x] of [['ACROSS MOTOR',-.61],['ACROSS SWITCH',.34],['AT CONTROLLER',.94]] as const){for(const s of [-.14,.14])part(board,cyl(.008,.008,.12,6),toon(DMETAL),x+s,y+.06,-.36,false);sign(board,text,x,y+.15,-.36,.46,.1,'#fffaf0',INK,-.75);}
    // Flip buttons beside each socket.
    for(const [id,x,z] of [['fly',-.91,TOP],['switch',.58,TOP],['ctrl',.76,TOP-.02]] as const){
      const b=group(board,x,y+.01,z);part(b,cyl(.055,.06,.04,18),toon(INK),0,.02,0);const cap=part(b,cyl(.046,.046,.03,18),toon(TEAL),0,.045,0);cap.name='cap';
      sign(b,'⇄',0,.062,0,.075,.075,TEAL,'#fffaf0');this.flipBtns.set(id,b);this.click(b,'flip',id);}
    // ---- Parts tray, front right: five parts.
    part(top,rbox(1.1,.03,.68,.05),toon('#cbb488'),1.52,.055,.25);
    PART_IDS.forEach((id,k)=>{const at=new T.Vector3(1.52+(k<3?(k-1)*.35:(k-3.5)*.35),.075,.25+(k<3?-.16:.17));this.trayAt.set(id,at);part(top,rbox(.34,.01,.26,.04),toon('#b99f71'),at.x,.073,at.z,false);
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
    for(let k=0;k<5;k++)this.cycleLamps.push(part(pod,sphere(.024,10,8),toon('#4a4f63'),-.12+k*.06,.1,-.2,false));
    // Probe lead from the node to the scope; the harness from the bench to the robot on the stand.
    const lead=new T.CatmullRomCurve3([[bx-.06,.2,bz+MAIN],[bx-.1,.3,bz-.12],[bx-.14,.2,-.13],[bx-.12,.15,-.27]].map(([a,b,c])=>new T.Vector3(a,b,c)));
    part(top,new T.TubeGeometry(lead,20,.014,6),toon(YELLOW),0,0,0,false);
    // Current pulses: small bright beads that ride the copper.
    for(let k=0;k<DOTS;k++){const d=part(board,sphere(.028,10,8),this.dotMat,0,y+.03,0,false);d.visible=false;this.dots.push(d);this.dotU.push(k/DOTS);}
    // The arc across the switch: a jagged chain of white-hot segments, re-jittered every frame while it burns.
    const arcCore=hot('#e8f8ff',3),arcSeg=cyl(.012,.012,1,6);board.add(this.arc);this.arc.visible=false;
    for(let k=0;k<9;k++){const m=new T.Mesh(arcSeg,arcCore);m.userData.noAO=true;this.arc.add(m);this.arcSegs.push(m);}
    this.arcGlow=glow(this.arc,'rgba(170,220,255,1)',.7,.8);this.arcGlow.position.set(.14,y+.2,MAIN);
    this.arcLight=new T.PointLight('#bfe8ff',0,2.2,1.6);this.arcLight.position.set(.34,y+.3,MAIN);board.add(this.arcLight);
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const j=this.current(),a=this.game.audio;if(!j)return false;
    switch(name){
      case 'pick':{const id=arg as PartId;if(!PARTS[id])return false;
        if(this.held===id){this.held=undefined;a.tone(380,.05,.03,'triangle');break;}
        for(const s of Object.keys(this.slots) as SlotId[])if(this.slots[s]?.part===id)delete this.slots[s];
        this.held=id;a.pop();break;}
      case 'slot':{const s=arg as SlotId;if(!this.slotAt.has(s))return false;
        if(this.held){const p=PARTS[this.held];
          if(!p.slots.includes(s)){a.voice('hm',1.4);return false;}
          this.slots[s]={part:this.held,flipped:false};this.held=undefined;this.lastSlot=s;a.plug();break;}
        if(this.slots[s]){delete this.slots[s];a.tone(300,.06,.04,'triangle');break;}
        a.voice('hm',1.4);return false;}
      case 'flip':{const s=(arg as SlotId|undefined)??this.lastSlot;const f=s&&this.slots[s];
        if(!s||!f||!PARTS[f.part].polar)return false;
        f.flipped=!f.flipped;this.lastSlot=s;a.tone(f.flipped?520:440,.06,.04,'triangle');a.pop();break;}
      case 'ground':{this.star=!this.star;a.noise(.05,.05,2400,'highpass');a.tone(this.star?520:330,.08,.04,'triangle');break;}
      case 'clear':{if(!Object.keys(this.slots).length&&!this.held)return false;this.slots={};this.held=undefined;a.clatter();break;}
      case 'pulse':case 'test':{
        if(!this.onStand){this.say('The robot is still on its charging pad.');a.voice('hm',1.4);return false;}
        if(!this.fuse){a.voice('hm',1.2);return false;}
        const s=this.setup(),v=judge(j,s),tr=v.fault==='short'||v.fault==='cap'?undefined:shutdownCached(s);
        this.capture={job:this.jobIndex,key:setupKey(s),verdict:v,trace:tr,start:startTrace(j,s),at:this.game.time};this.captures++;this.sweep=0;
        this.scopeMode=v.fault==='start'?'start':'stop';
        if(v.fault==='short'){this.tripFuse();this.mistakes++;this.say(v.problems[0],'bad');this.redraw();return true;}
        if(v.fault==='cap'){this.mistakes++;this.say(v.problems[0],'bad');a.noise(.35,.1,900);this.game.burst(this.boardPoint(.84,-.2).setY(this.table.y+.25),'#e9e4d6',10,'dust');this.redraw();return true;}
        if(name==='pulse'){this.kick(v,s);this.say(this.captionFor(v),v.tier>0?'ok':'bad');this.redraw();return true;}
        // TEST: five start/stop cycles.
        this.cycleT=0;this.cycleFail=v.tier===0;this.spent+=cost(s);this.kick(v,s,true);
        if(v.tier===0){this.mistakes++;
          this.say(v.problems[0],'bad');a.tone(160,.25,.06,'square');a.voice('groan',1);this.game.alarm({x:this.table.x,z:this.table.z},3);this.redraw();return true;}
        this.logged.push({job:j.id,verdict:v});
        this.say(`${['','Works','Reliable','Elegant'][v.tier]}${v.notes[0]?`: ${v.notes[0]}`:''}`,'ok');
        a.cheer();a.bell(1319,.5,.05);cheer(this.game,this,YELLOW);
        this.jobIndex++;this.capture=undefined;this.captures=0;
        if(this.jobIndex>=JOBS.length)this.startDrive();
        this.redraw();return true;}
      default:return false;
    }
    this.redraw();return true;
  }
  /** Dead short: the PTC fuse trips with a bang and a shower of sparks, then cools and resets itself. */
  private tripFuse(){const a=this.game.audio;this.fuse=false;this.cooling=FUSE_COOL;this.flow.run=false;this.flow.amp=0;
    a.noise(.2,.12,1800,'bandpass');a.tone(120,.3,.06,'square');a.voice('groan',1.1);this.spark(-1.12);this.game.alarm({x:this.table.x,z:this.table.z},3);}
  /** Runs the motor for a moment, then opens the switch: the pulses show where the coil's current goes. */
  private kick(v:Verdict,s:Setup,test=false){
    this.kickV=v;const fly=flyChain(s),tvsOk=s.switch?.part==='tvs'&&!s.switch.flipped;
    // Where the current goes once the switch opens (used when the kick lands).
    this.kickLoop=fly&&fly.fwd<SWITCH.avalanche?FLY_LOOP:tvsOk||v.fault==='stuck'?TVS_LOOP:null;
    if(test){this.kickT=-1;return;}
    this.kickT=0;this.flow={loop:RUN_LOOP,amp:1,decay:0,run:true};
  }
  private captionFor(v:Verdict){
    if(v.fault==='stop')return `Caught it: the switch node spiked to ${Math.round(v.spike)} V at shutdown and the controller reset.`;
    if(v.fault==='start')return `Caught it: at start the controller's supply sagged ${v.dip.toFixed(2)} V and it browned out.`;
    if(v.fault==='stuck')return 'The motor never stopped: something across the switch is conducting like a closed switch.';
    if(v.fault==='slow')return `No reset (spike ${Math.round(v.spike)} V), but the current took ${msText(v.offTime)} to die: too slow for the stop line.`;
    return `Clean stop: spike ${Math.round(v.spike)} V, current off in ${msText(v.offTime)}, start sag ${v.dip.toFixed(2)} V. TEST it.`;
  }
  private boardPoint(x:number,z:number){return new T.Vector3(this.table.x-.45+x,this.table.y+.1,this.table.z+.27+z);}
  private spark(x:number){const p=this.boardPoint(x,.02);this.game.burst(p,'#fff3a3',14,'spark');this.game.burst(p,'#ffe36e',3,'star');}
  private startDrive(){
    const b=this.bot;if(!b){this.delivered=true;return;}
    this.driving=true;this.driveT=0;b.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);
    if(this.game.atBench)this.game.leaveBench();
    this.say('All three fixes pass. Off it goes on its delivery route!','ok');
  }

  // ---------- drawing ----------
  redraw(){
    for(const id of PART_IDS){const m=this.parts.get(id)!,slot=(Object.keys(this.slots) as SlotId[]).find(s=>this.slots[s]?.part===id);
      const body=m.getObjectByName('body')!;
      if(slot){const f=this.slots[slot]!;m.position.copy(this.slotAt.get(slot)!.pos);body.rotation.y=f.flipped?Math.PI:0;}
      else{m.position.copy(this.trayAt.get(id)!);body.rotation.y=0;}
      if(this.held===id)m.position.y+=.08;}
    for(const [id,s] of this.slotAt){const fit=this.slots[id],ok=this.held&&PARTS[this.held].slots.includes(id);(s.pad.material as T.Material)=toon(ok?PAD_HOT:fit?'#2b4a55':PAD_OFF);
      this.marks.get(id)!.visible=!fit;const fb=this.flipBtns.get(id)!;fb.visible=!!fit&&PARTS[fit.part].polar;const cap=fb.getObjectByName('cap') as T.Mesh;cap.material=toon(fit?.flipped?'#f08a4b':TEAL);}
    this.shared.visible=!this.star;this.starWire.visible=this.star;this.lever.rotation.z=this.star?-.5:.5;
    setSign(this.routeSign,this.star?'GROUND: STAR':'GROUND: SHARED',this.star?'#b8d6ff':'#ffe7a8',INK,512,128);
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
    if(!this.fuse){title('FUSE TRIPPED');c.fillStyle='#ff7a6b';centre('Short across the battery','Fix the backwards part, reset the FUSE');return;}
    if(!cap||cap.job!==this.jobIndex||(!cap.trace&&cap.verdict.fault!=='start')){title(this.scopeMode==='stop'?'SWITCH NODE · STOP':'CONTROLLER · START');
      centre(this.onStand?'Press PULSE':'Robot not on the stand',this.onStand?'to capture one start and stop':undefined);return;}
    const v=cap.verdict,sweep=Math.min(1,this.sweep);
    if(this.scopeMode==='stop'&&cap.trace){
      // 0.2 ms before to 2 ms after the switch opens.
      const tr=cap.trace,t0=-.2e-3,t1=2e-3,k0=Math.round((t0-tr.t0)/tr.dt),k1=Math.min(tr.v.length-1,Math.round((t1-tr.t0)/tr.dt));
      const X=(t:number)=>L+(t-t0)/(t1-t0)*(R-L),Y=(volts:number)=>BOT-Math.max(-4,Math.min(84,volts))/84*(BOT-TOPY),IY=(amps:number)=>BOT-Math.max(-.5,Math.min(4,amps))/4*(BOT-TOPY)*.55;
      title('SWITCH NODE · STOP');
      if(j.stopSpec){c.fillStyle='rgba(141,255,176,.12)';c.fillRect(X(0),TOPY,X(j.stopSpec)-X(0),BOT-TOPY);c.fillStyle='rgba(141,255,176,.9)';c.font=FONT(28,600);c.textAlign='left';c.fillText(`brake: off ≤ ${j.stopSpec*1e3} ms`,X(0)+10,TOPY+32);}
      hline(Y(SPEC.spikeReset),'#ff7a6b',`resets above ${SPEC.spikeReset} V`);hline(Y(MOTOR.V),'rgba(251,243,226,.5)','12 V');
      c.strokeStyle='rgba(251,243,226,.35)';c.lineWidth=2;c.beginPath();c.moveTo(X(0),TOPY);c.lineTo(X(0),BOT);c.stroke();
      const last=k0+Math.max(2,Math.floor((k1-k0)*sweep));
      const plot=(arr:number[],f:(n:number)=>number,col:string,w:number)=>{c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.beginPath();for(let k=k0;k<=last;k++){const x=X(tr.t0+k*tr.dt),yy=f(arr[k]);k>k0?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();};
      plot(tr.i,IY,'#7fd8ff',5);plot(tr.v,Y,'#ffd66b',6);
      if(sweep>=1&&tr.offTime!==null&&tr.offTime<=t1){c.fillStyle='#7fd8ff';c.beginPath();c.arc(X(tr.offTime),IY(RUNNING*SPEC.offFraction),10,0,7);c.fill();}
      c.font=FONT(30,600);c.textAlign='right';c.fillStyle='#7fd8ff';c.fillText('current',R-8,TOPY+32);c.fillStyle='#ffd66b';c.fillText('volts',R-130,TOPY+32);
      readout(`PEAK ${Math.round(v.spike)} V`,v.spike>SPEC.spikeReset?'#ff7a6b':v.spike>SPEC.spikeReliable?'#ffd66b':'#8dffb0');
      const bad=v.fault==='stop',slow=v.fault==='slow'||v.fault==='stuck';
      foot(bad?'RESET at shutdown!':v.fault==='stuck'?'Motor never switched off':`Current off in ${msText(v.offTime)}${slow?' · too slow':''}`,bad||slow?'#ff7a6b':'#8dffb0');
    }else{
      const s=cap.start,n=s.length,pre=.1,X=(k:number)=>L+(pre+(1-pre)*k/(n-1))*(R-L),Y=(volts:number)=>BOT-(Math.max(3.9,Math.min(5.15,volts))-3.9)/1.25*(BOT-TOPY);
      title('CONTROLLER · START');
      hline(Y(CTRL.rail-SPEC.dipReset),'#ff7a6b',`resets below ${(CTRL.rail-SPEC.dipReset).toFixed(1)} V`);hline(Y(CTRL.rail),'rgba(251,243,226,.5)','5 V');
      const shown=Math.max(2,Math.floor(n*sweep));c.strokeStyle='#ffd66b';c.lineWidth=6;c.lineJoin='round';c.beginPath();c.moveTo(L,Y(CTRL.rail));c.lineTo(X(0),Y(CTRL.rail));for(let k=0;k<shown;k++)c.lineTo(X(k),Y(s[k]));c.stroke();
      c.fillStyle='rgba(251,243,226,.7)';c.font=FONT(28,600);c.textAlign='left';c.fillText('motor starts: 0 → 20 ms',X(0)+10,BOT-14);
      readout(`SAG ${v.dip.toFixed(2)} V`,v.dip>SPEC.dipReset?'#ff7a6b':v.dip>SPEC.dipReliable?'#ffd66b':'#8dffb0');
      foot(v.dip>SPEC.dipReset?'RESET at start-up!':'Supply holds at start-up',v.dip>SPEC.dipReset?'#ff7a6b':'#8dffb0');
    }
    if(this.setupStale()){c.fillStyle='#0a1719';c.fillRect(W-330,BOT+10,330,H-BOT-10);c.fillStyle='#ffd66b';c.font=FONT(32,600);c.textAlign='right';c.fillText('changed: PULSE',W-20,H-26);}
    this.scopeTex.needsUpdate=true;
  }
  private setupStale(){return !!this.capture&&this.capture.key!==setupKey(this.setup());}
  pointer(e:Pointer){
    const hits=e.ray.intersectObjects(this.clickables.map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.1);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found)this.act(found.act,found.arg);
  }
  key(code:string){
    const map:Record<string,[string,unknown?]>={Digit1:['pick','diode'],Digit2:['pick','clamp'],Digit3:['pick','tvs'],Digit4:['pick','snubber'],Digit5:['pick','cap'],
      KeyA:['slot','fly'],KeyS:['slot','switch'],KeyD:['slot','ctrl'],KeyF:['flip'],KeyG:['ground'],KeyP:['pulse'],Enter:['test'],Backspace:['clear']};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;if(active&&this.toast)this.toast.hidden=true;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';if(this.ready)this.updatePanel();}
  dropped(p:Game['props'][number]){
    if(p.spec.id!=='robot'||this.onStand)return;const q=p.body.translation();
    if(Math.hypot(q.x-STAND.x,q.z-STAND.z)<2.6){this.onStand=true;this.placeOnStand();this.game.audio.plug();this.game.burst({x:STAND.x,y:1,z:STAND.z},'#9ff3ea',1,'ring');
      this.say('Robot on the stand and wired to the bench. Sit at the bench to diagnose it.','ok');this.redraw();}
  }
  private placeOnStand(){const b=this.bot;if(!b)return;b.body.setTranslation({x:STAND.x,y:STAND.y,z:STAND.z},true);b.body.setRotation(new T.Quaternion(),true);b.body.setLinvel({x:0,y:0,z:0},true);b.body.setAngvel({x:0,y:0,z:0},true);b.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);}
  private init(){this.ready=true;this.bot=this.game.props.find(p=>p.spec.id==='robot');
    // The robot prop is a cart physics body; the teal robot model is drawn over it instead.
    if(this.bot)for(const c of this.bot.mesh.children)c.scale.setScalar(0);
    this.redraw();}
  update(dt:number){
    if(!this.ready)this.init();
    // The PTC fuse glows while hot and conducts again once it has cooled.
    if(!this.fuse){this.cooling-=dt;if(this.cooling<=0){this.fuse=true;this.cooling=0;this.game.audio.tone(900,.05,.03,'triangle');this.redraw();}}
    const fh=this.fuse?0:Math.min(1,this.cooling/FUSE_COOL);
    if(fh>0){this.fuseHot.color.set(YELLOW).lerp(new T.Color('#ff3b2a'),Math.min(1,fh*1.4)).multiplyScalar(1+fh);this.fuseDisc.material=this.fuseHot;}else this.fuseDisc.material=toon(YELLOW);
    // PULSE: the motor runs for a moment, then the switch opens and the kick lands.
    if(this.kickT>=0){const was=this.kickT;this.kickT+=dt;this.motorOn=this.kickT<RUN_TIME?1:0;
      if(was===0&&this.kickV?.fault==='start')this.reboot();
      if(was<RUN_TIME&&this.kickT>=RUN_TIME)this.land(false);
      if(this.kickT>RUN_TIME+5)this.kickT=-1;}
    const b=this.bot,r=this.robot;
    if(this.driving&&b){this.driveT+=dt;const d=Math.min(ROUTE_LEN,Math.max(0,(this.driveT-.4)*DRIVE_SPEED));
      let left=d,k=1;while(k<ROUTE.length-1&&left>Math.hypot(ROUTE[k][0]-ROUTE[k-1][0],ROUTE[k][1]-ROUTE[k-1][1])){left-=Math.hypot(ROUTE[k][0]-ROUTE[k-1][0],ROUTE[k][1]-ROUTE[k-1][1]);k++;}
      const [x0,z0]=ROUTE[k-1],[x1,z1]=ROUTE[k],seg=Math.hypot(x1-x0,z1-z0),f=Math.min(1,left/seg),x=x0+(x1-x0)*f,z=z0+(z1-z0)*f;
      const yaw=-Math.atan2(z1-z0,x1-x0),cur=new T.Euler().setFromQuaternion(new T.Quaternion().copy(b.body.rotation() as T.Quaternion));
      const turn=Math.atan2(Math.sin(yaw-cur.y),Math.cos(yaw-cur.y)),ny=cur.y+turn*Math.min(1,dt*6);
      const yy=d<1.2?STAND.y+(.35-STAND.y)*Math.min(1,d/1.2):.35;
      b.body.setNextKinematicTranslation({x,y:yy,z});b.body.setNextKinematicRotation(new T.Quaternion().setFromEuler(new T.Euler(0,ny,0)));
      this.motorOn=d<ROUTE_LEN?1:0;if(this.driveT>=DRIVE_TIME&&!this.delivered){this.delivered=true;this.game.audio.bell(1568,.6,.05);this.game.burst({x,y:1.2,z},'#8dffb0',20,'confetti');}}
    if(b){const p=b.body.translation(),q=b.body.rotation();r.root.position.set(p.x,p.y,p.z);r.root.quaternion.set(q.x,q.y,q.z,q.w);}
    // Wheels spin while the motor runs; the eyes and antenna show the controller's state.
    if(this.cycleT>=0){const before=this.motorOn;this.cycleT+=dt;const c=Math.floor(this.cycleT/.6),on=this.cycleT%.6<.4;this.motorOn=c<SPEC.cycles&&on?1:0;
      if(this.motorOn&&!before){this.flow={loop:RUN_LOOP,amp:1,decay:0,run:true};if(this.kickV?.fault==='start')this.reboot();}
      if(!this.motorOn&&before)this.land(true);
      this.cycleLamps.forEach((l,k)=>l.material=k<Math.min(c+(on?0:1),SPEC.cycles)?(this.cycleFail?hot('#ff7a6b',1.4):hot('#8dffb0',1.4)):toon('#4a4f63'));
      if(this.cycleFail&&c===0&&!on&&this.resetFlash<=0)this.resetFlash=1.2;if(c>=SPEC.cycles+2)this.cycleT=-1;}
    else if(!this.driving&&this.kickT<0&&this.motorOn>0)this.motorOn=Math.max(0,this.motorOn-dt);
    this.spin+=dt*(this.motorOn>0?18:0);r.wheels.forEach(w=>w.rotation.z=-this.spin);
    this.resetFlash=Math.max(0,this.resetFlash-dt);
    const resetNow=this.resetFlash>0&&Math.floor(this.resetFlash*6)%2===0,dead=!this.fuse;
    const eye=dead?toon('#34424a'):resetNow?hot('#ff5a4d',1.6):hot('#7fffe8',1.6);r.eyes.forEach(e=>e.material=eye);r.lamp.material=dead?toon('#4a4f63'):resetNow?hot('#ff5a4d',2):hot('#8dffb0',1.6);
    this.ctrlLamp.material=dead?toon('#4a4f63'):resetNow?hot('#ff5a4d',2):hot('#8dffb0',1.6);
    this.animateKick(dt);
    if(this.dizzy>0&&b){this.dizzy=Math.max(0,this.dizzy-dt);const w=Math.sin(this.game.time*17)*.14*Math.min(1,this.dizzy);r.root.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(w,0,w*.6)));}
    this.sweep=Math.min(1,this.sweep+dt*1.4);this.drawScope();
    this.updatePanel();
  }
  /** The controller reboots: red eyes, a dizzy wobble and stars over the robot's head. */
  private reboot(){this.resetFlash=1.6;this.dizzy=1.8;const q=this.bot?.body.translation();if(q)this.game.burst({x:q.x,y:q.y+.9,z:q.z},'#ffe36e',6,'star');this.game.audio.voice('alarm',1.4);}
  /** The switch has just opened: where does the coil's current go? */
  private land(test:boolean){
    const v=this.kickV;if(!v)return;const tr=this.capture?.trace;
    if(v.fault==='stop'){
      // Nowhere to go: the current piles up at the switch and arcs across it, and the controller reboots.
      this.flow.decay=.12;this.flow.run=false;this.arcT=test?.25:.6;this.reboot();
      const a=this.game.audio;a.noise(test?.15:.35,.14,4200,'highpass');a.noise(.08,.1,900,'bandpass');
      const p=this.boardPoint(.34,.02);this.game.burst(p,'#d8f4ff',test?4:8,'spark');return;}
    if(!this.kickLoop){this.flow.decay=.1;this.flow.run=false;return;}
    // A path: the pulses keep circling the motor through it, fading as the coil empties (slowed right down).
    const off=v.fault==='stuck'||!tr?.offTime?3:tr.offTime;
    this.flow={loop:this.kickLoop,amp:1,decay:v.fault==='stuck'?(test?.4:3):Math.min(test?.35:4,Math.max(.25,off*SLOWMO)),run:false};
    this.game.audio.tone(v.fault==='slow'?180:320,.25,.03,'sine');
  }
  private animateKick(dt:number){
    const f=this.flow,w=new T.Vector3();
    if(!f.run&&f.decay>0)f.amp*=Math.exp(-dt*2.3/f.decay);
    if(!f.run&&f.amp<.04)f.amp=0;
    const len=loopLen(f.loop),speed=(f.run?.9:1.6)*f.amp;
    this.dots.forEach((d,k)=>{this.dotU[k]=(this.dotU[k]+speed*dt/len)%1;d.visible=f.amp>0&&this.fuse;if(!d.visible)return;
      along(f.loop,this.dotU[k],w);d.position.set(w.x,.07,w.z);d.scale.setScalar(.5+.7*f.amp);});
    // The arc: a jagged bright line between the switch node and the switch, redrawn every frame.
    this.arcT=Math.max(0,this.arcT-dt);this.arc.visible=this.arcT>0;this.arcLight.intensity=this.arcT>0?6+Math.random()*10:0;
    if(this.arcT>0){const n=this.arcSegs.length,pts:T.Vector3[]=[];
      for(let k=0;k<=n;k++){const t=k/n,j=k===0||k===n?0:.06;pts.push(new T.Vector3(-.06+.4*t,.16+Math.sin(t*Math.PI)*.1+(Math.random()-.5)*j,MAINZ+(Math.random()-.5)*j*1.4));}
      this.arcSegs.forEach((m,k)=>{const a=pts[k],b=pts[k+1];m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(1,a.distanceTo(b),1);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());});
      (this.arcGlow.material as T.SpriteMaterial).opacity=.5+Math.random()*.5;}
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
    const key=JSON.stringify([this.active,this.jobIndex,setupKey(s),this.held,this.fuse,cap?.at,stale,this.onStand]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel';}
    if(!this.panel.isConnected)this.layer()?.append(this.panel);
    this.panel.hidden=!j||!this.active;if(!j||!this.active)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const fit=(f?:Fit)=>f?`${PARTS[f.part].label}${PARTS[f.part].polar&&f.flipped?' (flipped)':''}`:'';
    const motor=fit(this.slots.fly)||'—';
    const v=cap?.verdict,m=(x:string)=>stale?'PULSE again':x;
    this.panel.innerHTML=`<header><small>JOB ${this.jobIndex+1}/${JOBS.length} · ${partCount(s)} PART${partCount(s)===1?'':'S'} FITTED</small><h4>${j.title}</h4><p>${j.ask}</p></header>`+
      `<ul class="build">${row('Across motor',motor)}${row('Across switch',fit(this.slots.switch)||'—')}${row('At controller',fit(this.slots.ctrl)||'—')}${row('Ground',this.star?'star (own wire)':'shared with motor',this.star?true:undefined)}`+
      (!this.fuse?row('Fuse',`cooling ${this.cooling.toFixed(1)} s`,false):'')+
      (v&&v.fault!=='short'&&v.fault!=='cap'?`${row('Stop spike',m(`${Math.round(v.spike)} V`),!stale&&v.spike<=SPEC.spikeReset)}`+
        (j.stopSpec?row('Current off',m(msText(v.offTime)),!stale&&v.offTime!==null&&v.offTime<=j.stopSpec):'')+
        row('Start sag',m(`${v.dip.toFixed(2)} V`),!stale&&v.dip<=SPEC.dipReset):'')+`</ul>`+
      `<p class="profile">The beads on the copper are the current, replayed about ${SLOWMO}× slower than life. Simplified model, this robot's tuning values: motor ${MOTOR.V} V, ${MOTOR.L*1e3} mH, ${MOTOR.R} Ω, ${RUNNING} A running. Switch abs max ${SWITCH.absMax} V. Controller resets above ${SPEC.spikeReset} V at the switch or a ${SPEC.dipReset} V supply sag.</p>`;
  }
  private hoverHint():Prompt|null{
    const h=this.hovered;if(!h||!this.active)return null;
    switch(h.act){
      case 'pick':{const id=h.arg as PartId;return {key:String(PART_IDS.indexOf(id)+1),text:this.held===id?'Put it back':`Take the ${PARTS[id].name}`};}
      case 'slot':{const id=h.arg as SlotId,fits=this.held&&PARTS[this.held].slots.includes(id);
        return {key:SLOT_KEYS[id],text:this.held?(fits?'Fit it here':'It does not fit here'):this.slots[id]?'Take it out':'Empty socket'};}
      case 'flip':return {key:'F',text:'Flip it round'};
      case 'ground':return {key:'G',text:this.star?'Ground: own wire':'Ground: shared'};
      case 'pulse':return {key:'P',text:'Pulse the motor'};
      case 'test':return {key:'Enter',text:`Test (${SPEC.cycles} cycles)`};
    }
    return null;
  }
  prompt(atBench:boolean):Prompt|null{
    const j=this.current();if(this.driving)return null;if(!j)return null;
    if(!atBench){const p=this.game.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6;
      if(this.game.held===this.bot&&this.bot){const q=this.bot.body.translation();return {key:'E',text:Math.hypot(q.x-STAND.x,q.z-STAND.z)<2.6?'Set the robot on the stand':'Carry the robot'};}
      if(near)return {key:'E',text:'Work at the bench'};
      return null;}
    const h=this.hoverHint();if(h)return h;
    if(!this.onStand)return {key:'E',text:'Fetch the robot'};
    if(!this.fuse)return {key:'P',text:'Fuse cooling'};
    if(this.held){const s=PARTS[this.held].slots[0];return {key:SLOT_KEYS[s],text:'Fit it'};}
    const cap=this.capture&&this.capture.job===this.jobIndex?this.capture:undefined;
    if(!cap||this.setupStale())return {key:'P',text:'Pulse the motor'};
    if(cap.verdict.tier===0)return {key:'1–5',text:'Change the parts'};
    return {key:'Enter',text:`Test (${SPEC.cycles} cycles)`};
  }
  complete(){return this.delivered;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){const j=this.current(),s=this.setup(),v=j?judge(j,s):undefined;
    return {job:this.jobIndex,logged:this.logged.map(l=>({job:l.job,tier:l.verdict.tier,spike:l.verdict.spike,offTime:l.verdict.offTime,parts:l.verdict.parts})),slots:{...this.slots},star:this.star,held:this.held??null,
      fuse:this.fuse,onStand:this.onStand,driving:this.driving,delivered:this.delivered,mistakes:this.mistakes,spent:this.spent,scope:this.scopeMode,captures:this.captures,
      capture:this.capture?{fault:this.capture.verdict.fault??null,spike:this.capture.verdict.spike,offTime:this.capture.verdict.offTime,dip:this.capture.verdict.dip}:null,
      verdict:v?{tier:v.tier,fault:v.fault??null,spike:v.spike,dip:v.dip,offTime:v.offTime}:null,startDip:j?startDip(j,s):null};}
}
