// Robot Garage bench. The delivery robot sits on the rolling-road test stand behind the bench,
// wired to a harness board on the table: BATTERY → FUSE → MOTOR → switch node → SWITCH (MOSFET)
// → ground, with the CONTROLLER on the right. Pip fits protection parts from the tray into four
// places (two sockets ACROSS MOTOR, one ACROSS SWITCH, one AT CONTROLLER), flips polarity, picks
// the controller's ground route, captures a stop (and a start) on the scope with PULSE, and
// certifies the fix with TEST (five start/stop cycles). After the third job the robot drives its
// delivery route around the garage to the dock. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressGarage,robotMesh,STAND,PAD,ROUTE,YELLOW,TEAL,CREAM,type RobotParts} from './room';
import {toon,box,rbox,cyl,sphere,part,group,canvasTex,INK,DMETAL} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import {cheer,walkHint} from '../shared';
import {JOBS,PARTS,PART_IDS,SLOT_NAMES,SPEC,SWITCH,MOTOR,RUNNING,STALL,CTRL,judge,cost,cheapest,shutdownCached,startTrace,startDip,setupKey,partCount,
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
  if(id==='zener'){part(body,cyl(.038,.038,.18,14,'x'),toon('#f08a4b'));part(body,cyl(.04,.04,.035,14,'x'),toon(INK),-.065,0,0);}
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
/** Keyboard keys for the four sockets (as in key()). */
const SLOT_KEYS:Record<SlotId,string>={fly1:'Z',fly2:'X',switch:'C',ctrl:'V'};
const msText=(t:number|null)=>t===null?'never':`${(t*1e3).toFixed(2)} ms`;

export class GarageBench implements Station {
  readonly view={distance:6.8,pitch:.86,lookY:.4};
  readonly limits={time:420,damage:1,cost:Math.ceil(JOBS.reduce((n,j)=>n+(cheapest(j)?.cost??0),0)*1.25*10)/10};
  readonly stand={x:0,z:-1.55};readonly table=new T.Vector3(0,1,-2.45);readonly facing=Math.PI;
  slots:Partial<Record<SlotId,Fit>>={};star=false;held?:PartId;fuse=true;scopeMode:'stop'|'start'='stop';
  jobIndex=0;logged:{job:string;verdict:Verdict}[]=[];mistakes=0;spent=0;onStand=false;driving=false;driveT=0;delivered=false;active=false;
  capture?:Capture;captures=0;lastSlot?:SlotId;
  readonly job:StationJob;
  private root=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;
  private parts=new Map<PartId,T.Group>();private trayAt=new Map<PartId,T.Vector3>();private slotAt=new Map<SlotId,{pos:T.Vector3;pad:T.Mesh}>();
  private flipBtns=new Map<SlotId,T.Object3D>();private marks=new Map<SlotId,T.Mesh>();private shared!:T.Object3D;private starWire!:T.Object3D;private lever!:T.Object3D;private routeSign!:T.Mesh;
  private fuseCap!:T.Mesh;private fuseSign!:T.Mesh;private ctrlLamp!:T.Mesh;private cycleLamps:T.Mesh[]=[];private modeButtons:T.Mesh[]=[];
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
    // The resettable fuse: a chunky holder with a RESET dome that glows red when it has tripped.
    const fuse=group(board,-1.12,y,MAIN);part(fuse,cyl(.085,.09,.05,20),toon(INK),0,.025,0);this.fuseCap=part(fuse,sphere(.07,18,10),toon('#fffaf0'),0,.05,0);this.fuseCap.scale.y=.7;this.click(fuse,'fuse');
    this.fuseSign=sign(board,'FUSE · R',-1.0,y+.02,.17,.24,.09,'#fffaf0',INK,-1.2);
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
    socket('fly1',-.81,TOP);socket('fly2',-.41,TOP);socket('switch',.34,TOP);socket('ctrl',1.0,TOP-.02);
    // Section names stand on little posts along the board's back edge, above the fitted parts.
    for(const [text,x] of [['ACROSS MOTOR',-.61],['ACROSS SWITCH',.34],['AT CONTROLLER',.94]] as const){for(const s of [-.14,.14])part(board,cyl(.008,.008,.12,6),toon(DMETAL),x+s,y+.06,-.36,false);sign(board,text,x,y+.15,-.36,.46,.1,'#fffaf0',INK,-.75);}
    // Flip buttons beside each socket.
    for(const [id,x,z] of [['fly1',-1.06,TOP],['fly2',-.16,TOP],['switch',.58,TOP],['ctrl',.76,TOP-.02]] as const){
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
    (['stop','start'] as const).forEach((m,k)=>{const b=part(scope,rbox(.4,.05,.14,.04),toon(CREAM),-.23+k*.46,.12,.12);this.modeButtons.push(b);this.click(b,'scope',m);
      sign(b,m==='stop'?'SHUTDOWN':'START-UP',0,.027,0,.36,.1).position.set(0,.027,0);});
    // ---- Test pod, back right: PULSE (scope one stop) and TEST (five cycles), with five cycle lamps.
    const pod=group(top,.92,.04,-.34);part(pod,rbox(.96,.08,.48,.05),toon('#3a3d55'),0,.04,0);
    const button=(x:number,color:string,act:string,text:string)=>{const b=group(pod,x,.08,-.06);part(b,cyl(.15,.17,.05,24),toon(INK),0,.025,0);part(b,cyl(.12,.12,.06,24),toon(color),0,.07,0);this.click(b,act);
      sign(pod,text,x,.1,.14,.3,.1,'#fffaf0',INK,-1.0);return b;};
    button(-.22,YELLOW,'pulse','PULSE');button(.22,'#6cc58a','test','TEST');
    for(let k=0;k<5;k++)this.cycleLamps.push(part(pod,sphere(.024,10,8),toon('#4a4f63'),-.12+k*.06,.1,-.2,false));
    // Probe lead from the node to the scope; the harness from the bench to the robot on the stand.
    const lead=new T.CatmullRomCurve3([[bx-.06,.2,bz+MAIN],[bx-.1,.3,bz-.12],[bx-.14,.2,-.13],[bx-.12,.15,-.27]].map(([a,b,c])=>new T.Vector3(a,b,c)));
    part(top,new T.TubeGeometry(lead,20,.014,6),toon(YELLOW),0,0,0,false);
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
          if(!p.slots.includes(s)){this.say(`The ${p.name} goes ${SLOT_NAMES[p.slots[0]]}.`);a.voice('hm',1.4);return false;}
          this.slots[s]={part:this.held,flipped:false};this.held=undefined;this.lastSlot=s;a.plug();break;}
        if(this.slots[s]){delete this.slots[s];a.tone(300,.06,.04,'triangle');break;}
        this.say('Click a part in the tray first, then click a socket to fit it.');a.voice('hm',1.4);return false;}
      case 'flip':{const s=(arg as SlotId|undefined)??this.lastSlot;const f=s&&this.slots[s];
        if(!s||!f){this.say('Nothing fitted there to flip.');return false;}
        if(!PARTS[f.part].polar){this.say('The RC snubber has no polarity: either way round is the same.');return false;}
        f.flipped=!f.flipped;this.lastSlot=s;a.tone(f.flipped?520:440,.06,.04,'triangle');a.pop();break;}
      case 'ground':{this.star=!this.star;a.noise(.05,.05,2400,'highpass');a.tone(this.star?520:330,.08,.04,'triangle');
        this.say(this.star?'Star ground: the controller has its own wire back to the battery, so motor current no longer flows through its ground.':'Shared ground: the controller\'s ground joins the motor\'s return wire.');break;}
      case 'clear':{if(!Object.keys(this.slots).length&&!this.held)return false;this.slots={};this.held=undefined;a.clatter();break;}
      case 'scope':{this.scopeMode=arg==='start'?'start':'stop';a.tone(this.scopeMode==='start'?700:560,.05,.03);break;}
      case 'fuse':{if(this.fuse){this.say('The fuse is fine: it only needs a reset after it trips.');return false;}
        this.fuse=true;a.tone(900,.05,.04);a.pop();this.say('Fuse reset.');break;}
      case 'pulse':case 'test':{
        if(!this.onStand){this.say('The robot is still on its charging pad. Carry it onto the test stand behind the bench.');a.voice('hm',1.4);return false;}
        if(!this.fuse){this.say('The fuse has tripped. Fix the short, then press the red RESET on the fuse (R).');a.voice('hm',1.2);return false;}
        if(name==='test'&&this.jobIndex===0&&this.captures===0){this.say('Diagnose first: press PULSE to catch one shutdown on the scope.');a.voice('hm',1.4);return false;}
        const s=this.setup(),v=judge(j,s),tr=v.fault==='short'||v.fault==='cap'?undefined:shutdownCached(s);
        this.capture={job:this.jobIndex,key:setupKey(s),verdict:v,trace:tr,start:startTrace(j,s),at:this.game.time};this.captures++;this.sweep=0;this.motorOn=.8;
        if(v.fault==='short'){this.fuse=false;this.mistakes++;this.say(v.problems[0],'bad');a.noise(.2,.12,1800,'bandpass');a.tone(120,.3,.06,'square');this.spark(-.86);this.redraw();return true;}
        if(v.fault==='cap'){this.mistakes++;this.say(v.problems[0],'bad');a.noise(.35,.1,900);this.game.burst(this.boardPoint(.84,-.2).setY(this.table.y+.25),'#e9e4d6',10,'dust');this.redraw();return true;}
        if(name==='pulse'){this.scopeMode=v.fault==='start'?'start':this.scopeMode;
          if(v.fault==='stop'||v.fault==='start')this.resetFlash=1.6;
          this.say(this.captionFor(v),v.tier>0?'ok':'info');a.tone(v.tier>0?660:220,.12,.05,v.tier>0?'triangle':'square');this.redraw();return true;}
        // TEST: five start/stop cycles.
        this.cycleT=0;this.cycleFail=v.tier===0;this.spent+=cost(s);
        if(v.tier===0){this.mistakes++;this.resetFlash=v.fault==='stop'||v.fault==='start'?1.6:0;if(v.fault==='start'||v.fault==='stop')this.scopeMode=v.fault==='start'?'start':'stop';
          this.say(`Test failed: ${v.problems[0]}`,'bad');a.tone(160,.25,.06,'square');a.voice('groan',1);this.game.alarm({x:this.table.x,z:this.table.z},3);this.redraw();return true;}
        this.logged.push({job:j.id,verdict:v});
        this.say(`${['','Works','Reliable','Elegant'][v.tier]}: no resets in ${SPEC.cycles} cycles (spike ${Math.round(v.spike)} V${j.stopSpec?`, current off in ${msText(v.offTime)}`:''})${v.notes[0]?` · ${v.notes[0]}`:''}`,'ok');
        a.cheer();a.bell(1319,.5,.05);cheer(this.game,this,YELLOW);
        this.jobIndex++;this.capture=undefined;this.captures=0;
        if(this.jobIndex>=JOBS.length)this.startDrive();
        this.redraw();return true;}
      default:return false;
    }
    this.redraw();return true;
  }
  private captionFor(v:Verdict){
    if(v.fault==='stop')return `Caught it: the switch node spiked to ${Math.round(v.spike)} V at shutdown and the controller reset.`;
    if(v.fault==='start')return `Caught it: at start the controller's supply sagged ${v.dip.toFixed(2)} V and it browned out (START-UP view).`;
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
    this.fuseCap.material=this.fuse?toon('#fffaf0'):hot('#ff5a4d',1.6);this.fuseCap.position.y=this.fuse?.05:.08;
    setSign(this.fuseSign,this.fuse?'FUSE · R':'RESET · R',this.fuse?'#fffaf0':'#ff8a7a',INK,512,177);
    this.modeButtons.forEach((b,k)=>b.position.y=(k===0)===(this.scopeMode==='stop')?.12:.14);
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
    const map:Record<string,[string,unknown?]>={Digit1:['pick','diode'],Digit2:['pick','zener'],Digit3:['pick','tvs'],Digit4:['pick','snubber'],Digit5:['pick','cap'],
      KeyZ:['slot','fly1'],KeyX:['slot','fly2'],KeyC:['slot','switch'],KeyV:['slot','ctrl'],KeyF:['flip'],KeyG:['ground'],KeyP:['pulse'],Enter:['test'],KeyR:['fuse'],
      KeyT:['scope',this.scopeMode==='stop'?'start':'stop'],Backspace:['clear']};
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
    if(this.cycleT>=0){this.cycleT+=dt;const c=Math.floor(this.cycleT/.6),on=this.cycleT%.6<.4;this.motorOn=c<SPEC.cycles&&on?1:0;
      this.cycleLamps.forEach((l,k)=>l.material=k<Math.min(c+(on?0:1),SPEC.cycles)?(this.cycleFail?hot('#ff7a6b',1.4):hot('#8dffb0',1.4)):toon('#4a4f63'));
      if(this.cycleFail&&c===0&&!on&&this.resetFlash<=0)this.resetFlash=1.2;if(c>=SPEC.cycles+2)this.cycleT=-1;}
    else if(!this.driving&&this.motorOn>0)this.motorOn=Math.max(0,this.motorOn-dt);
    this.spin+=dt*(this.motorOn>0?18:0);r.wheels.forEach(w=>w.rotation.z=-this.spin);
    this.resetFlash=Math.max(0,this.resetFlash-dt);
    const resetNow=this.resetFlash>0&&Math.floor(this.resetFlash*6)%2===0,dead=!this.fuse;
    const eye=dead?toon('#34424a'):resetNow?hot('#ff5a4d',1.6):hot('#7fffe8',1.6);r.eyes.forEach(e=>e.material=eye);r.lamp.material=dead?toon('#4a4f63'):resetNow?hot('#ff5a4d',2):hot('#8dffb0',1.6);
    this.ctrlLamp.material=dead?toon('#4a4f63'):resetNow?hot('#ff5a4d',2):hot('#8dffb0',1.6);
    this.sweep=Math.min(1,this.sweep+dt*1.4);this.drawScope();
    this.updatePanel();
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
    const motor=[this.slots.fly1,this.slots.fly2].map(fit).filter(Boolean).join(' + ')||'—';
    const v=cap?.verdict,m=(x:string)=>stale?'PULSE again':x;
    this.panel.innerHTML=`<header><small>JOB ${this.jobIndex+1}/${JOBS.length} · ${partCount(s)} PART${partCount(s)===1?'':'S'} FITTED</small><h4>${j.title}</h4><p>${j.ask}</p></header>`+
      `<ul class="build">${row('Across motor',motor)}${row('Across switch',fit(this.slots.switch)||'—')}${row('At controller',fit(this.slots.ctrl)||'—')}${row('Ground',this.star?'star (own wire)':'shared with motor',this.star?true:undefined)}`+
      (!this.fuse?row('Fuse','TRIPPED',false):'')+
      (v&&v.fault!=='short'&&v.fault!=='cap'?`${row('Stop spike',m(`${Math.round(v.spike)} V`),!stale&&v.spike<=SPEC.spikeReset)}`+
        (j.stopSpec?row('Current off',m(msText(v.offTime)),!stale&&v.offTime!==null&&v.offTime<=j.stopSpec):'')+
        row('Start sag',m(`${v.dip.toFixed(2)} V`),!stale&&v.dip<=SPEC.dipReset):row('Scope','no capture yet'))+`</ul>`+
      `<p class="profile">Simplified model, this robot's tuning values: motor ${MOTOR.V} V, ${MOTOR.L*1e3} mH, ${MOTOR.R} Ω, ${RUNNING} A running. Switch abs max ${SWITCH.absMax} V. Controller resets above ${SPEC.spikeReset} V at the switch or a ${SPEC.dipReset} V supply sag.</p>`;
  }
  private hoverHint():Prompt|null{
    const h=this.hovered;if(!h||!this.active)return null;
    switch(h.act){
      case 'pick':{const p=PARTS[h.arg as PartId];return {key:String(PART_IDS.indexOf(h.arg as PartId)+1),text:`Click to pick up the ${p.name}: fits ${SLOT_NAMES[p.slots[0]]}${p.polar?' (band/+ on the left)':''}`};}
      case 'slot':return {key:SLOT_KEYS[h.arg as SlotId],text:this.held?`Click to fit the ${PARTS[this.held].name} here`:this.slots[h.arg as SlotId]?'Click to take this part out':`${SLOT_NAMES[h.arg as SlotId]} socket`};
      case 'flip':return {key:'F',text:'Flip the fitted part round'};
      case 'ground':return {key:'G',text:this.star?'Controller ground: its own wire (star). Click for shared':'Controller ground: shared with the motor. Click for star'};
      case 'pulse':return {key:'P',text:'PULSE: run the motor once and catch the stop on the scope'};
      case 'test':return {key:'Enter',text:`TEST: ${SPEC.cycles} start/stop cycles, graded`};
      case 'fuse':return {key:'R',text:this.fuse?'Resettable fuse (OK)':'Click RESET to reset the tripped fuse'};
      case 'scope':return {key:'T',text:h.arg==='start'?'Scope: the controller\'s supply as the motor starts':'Scope: the switch node as the motor stops'};
    }
    return null;
  }
  prompt(atBench:boolean):Prompt|null{
    const j=this.current();if(this.driving)return null;if(!j)return null;
    if(!atBench){const p=this.game.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6;
      if(this.game.held===this.bot&&this.bot){const q=this.bot.body.translation();return {key:'E',text:Math.hypot(q.x-STAND.x,q.z-STAND.z)<2.6?'Set the robot down on the test stand':'Carry the robot to the test stand behind the bench'};}
      if(near)return {key:'E',text:this.onStand?'Work at the garage bench':'Work at the bench (the robot is still on its charging pad)'};
      return walkHint(this.game,this.onStand?'Walk to the garage bench (yellow arrow)':'Fetch the delivery robot from its charging pad (yellow arrow)');}
    const h=this.hoverHint();if(h)return h;
    if(!this.onStand)return {key:'E',text:'Step back and carry the robot onto the test stand'};
    if(!this.fuse)return {key:'R',text:'Fuse tripped: flip the backwards part (click ⇄ or F), then press RESET on the fuse'};
    if(this.held){const s=PARTS[this.held].slots[0];return {key:SLOT_KEYS[s],text:`Click a glowing socket to fit the ${PARTS[this.held].name}`};}
    const cap=this.capture&&this.capture.job===this.jobIndex?this.capture:undefined;
    if(!cap||this.setupStale())return {key:'P',text:this.jobIndex===0&&!cap?'Press PULSE to catch the shutdown on the scope':'Press PULSE to check the change on the scope'};
    if(cap.verdict.tier===0)return {key:'1–5',text:j.hint};
    return {key:'Enter',text:'Clean capture: press TEST (5 cycles)'};
  }
  complete(){return this.delivered;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){const j=this.current(),s=this.setup(),v=j?judge(j,s):undefined;
    return {job:this.jobIndex,logged:this.logged.map(l=>({job:l.job,tier:l.verdict.tier,spike:l.verdict.spike,offTime:l.verdict.offTime,parts:l.verdict.parts})),slots:{...this.slots},star:this.star,held:this.held??null,
      fuse:this.fuse,onStand:this.onStand,driving:this.driving,delivered:this.delivered,mistakes:this.mistakes,spent:this.spent,scope:this.scopeMode,captures:this.captures,
      capture:this.capture?{fault:this.capture.verdict.fault??null,spike:this.capture.verdict.spike,offTime:this.capture.verdict.offTime,dip:this.capture.verdict.dip}:null,
      verdict:v?{tier:v.tier,fault:v.fault??null,spike:v.spike,dip:v.dip,offTime:v.offTime}:null,startDip:j?startDip(j,s):null};}
}
