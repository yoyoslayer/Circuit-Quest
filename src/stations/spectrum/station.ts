// Spectrum Delivery dispatch desk. The job is room-scale: Pip carries the receiver pod to each
// destination and stands mirror boards on the floor marks. At the desk Pip aims by hand on the live
// hall map: click or drag to point the tower, drag a mirror to turn its board (the reflected leg
// swings toward the cursor). The beam (or broadcast) is drawn through the hall and on the map,
// stopping where an obstacle stops it or running on past a pod it misses. Also at the desk: the
// band keys with the wave ribbon (c = f λ; the pod fits the matching detector head itself), the
// power buttons, the lab shutter's hatch lever, the link meter and SEND. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {prefabs} from '../../props/prefabs';
import {dressSpectrum,CREAM,PAPER,COPPER,type SpectrumRoom} from './room';
import {toon,box,rbox,cyl,sphere,part,group,canvasTex,INK,DMETAL,freezeBench} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TXR from '../../render/textures';
import {JOBS,BANDS,BAND_IDS,DETECTOR_IDS,POWERS,SPEC,PADS,PAD_NAMES,SPOTS,SPOT_IDS,TX,SMOKE,STORE,LAB,QUIET,HATCH,MATERIAL_NAMES,POD_HOME,DOORS,
  walls,openings,read,judge,cost,leanest,budget,lambdaText,freqText,dist,heading,mirrorYaw,idleYaw,type Band,type Detector,type Power,type Pad,type Spot,type Setup,type Verdict,type Job,type Reading,type P,type Aim,type DoorsOpen,type DoorId,type Term} from './logic';
import './spectrum.css';
import {cheer,signOff,fault as benchFault} from '../shared';

type Prop=Game['props'][number];
const BEAM_Y=1.25,UP=new T.Vector3(0,1,0);
const LAMP_OK=hot('#3dff7a',1.4),LAMP_BAD=hot('#ff6b6b',1.2),LAMP_OFF=toon('#6b7385'),PAD_ON=hot('#3dff7a',1.2),PAD_OFF=toon('#c9c2b2');
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
const BAND_KEYS:Record<Band,string>={radio:'RADIO',micro:'MICRO',thermal:'THERMAL',nir:'NEAR IR',vis:'VISIBLE'};

// ---------- labels ----------
function drawPlate(c:CanvasRenderingContext2D,text:string,bg:string,fg:string,w:number,h:number){
  c.clearRect(0,0,w,h);c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(18,h*.25));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
  let size=Math.round(h*.5);c.font=FONT(size);while(size>10&&c.measureText(text).width>w-26){size--;c.font=FONT(size);}
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);
}
const labels=new Map<string,T.Texture>();
function label(text:string,bg=CREAM,fg=INK,w=256,h=80){const k=`${text}|${bg}|${fg}|${w}|${h}`;let t=labels.get(k);if(!t){t=canvasTex(w,h,c=>drawPlate(c,text,bg,fg,w,h));labels.set(k,t);}return t;}
function flatMat(map:T.Texture){const m=new T.MeshBasicMaterial({map,transparent:true});m.userData.outlineParameters={visible:false};return m;}
/** A label plate: flat on the table (tilt −π/2) or standing (tilt 0). */
function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,w=.4,tilt=-Math.PI/2,bg?:string,fg?:string,h=w*80/256){
  const p=part(parent,new T.PlaneGeometry(w,h),flatMat(label(text,bg,fg,256,Math.round(256*h/w))),x,y,z,false);p.rotation.x=tilt;p.userData.noAO=true;return p;
}
/** A live canvas texture that is redrawn in place when its key changes. */
class Live {canvas=document.createElement('canvas');tex:T.CanvasTexture;key='';
  constructor(w:number,h:number){this.canvas.width=w;this.canvas.height=h;this.tex=new T.CanvasTexture(this.canvas);this.tex.colorSpace=T.SRGBColorSpace;this.tex.anisotropy=8;}
  draw(key:string,fn:(c:CanvasRenderingContext2D,w:number,h:number)=>void){if(key===this.key)return;this.key=key;fn(this.canvas.getContext('2d')!,this.canvas.width,this.canvas.height);this.tex.needsUpdate=true;}
}
/** A detector head, drawn the same on the desk rack and on the pod (s = scale). */
function headMesh(d:Detector,s=1){
  const g=new T.Group();g.scale.setScalar(s);part(g,cyl(.035,.045,.12,12),toon(DMETAL),0,.06,0);
  if(d==='dipole'){part(g,box(.07,.06,.05),toon(INK),0,.15,0);for(const y of [-1,1])part(g,cyl(.012,.012,.2,8),toon('#dfe3ea'),0,.15+y*.13,0);part(g,sphere(.02,8,6),toon('#e5484d'),0,.38,0);}
  if(d==='patch'){part(g,cyl(.012,.012,.08,8),toon(DMETAL),0,.16,0);part(g,box(.2,.2,.03),toon(PAPER),0,.29,0);part(g,box(.11,.11,.035),glossyToon(COPPER,{spec:.8,size:.96}),0,.29,.002);}
  if(d==='thermopile'){const horn=part(g,cyl(.1,.035,.14,16),glossyToon('#e3b341',{spec:.8,size:.96}),0,.2,0);horn.rotation.x=0;part(g,cyl(.098,.098,.012,16),toon(INK),0,.27,0);}
  if(d==='nirdiode'){part(g,cyl(.06,.06,.08,16),toon(INK),0,.16,0);part(g,new T.SphereGeometry(.06,16,10,0,Math.PI*2,0,Math.PI/2),glossyToon('#7a1f45',{spec:.9,size:.95}),0,.2,0);}
  if(d==='visdiode'){part(g,cyl(.06,.06,.08,16),toon(INK),0,.16,0);part(g,new T.SphereGeometry(.06,16,10,0,Math.PI*2,0,Math.PI/2),glossyToon('#3fae6a',{spec:.9,size:.95}),0,.2,0);}
  return g;
}
const yawQuat=(yaw:number)=>new T.Quaternion().setFromAxisAngle(UP,yaw);

interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
/** The toaster smoke's radius as the room starts (the station zeroes it once the toaster is knocked off). */
const SMOKE_R0=SMOKE.r;
export class SpectrumDesk implements Station {
  readonly view={distance:6.1,pitch:1.02,lookY:.42,width:4.6};
  readonly limits={time:540,damage:1,cost:0};
  readonly stand={x:-3.5,z:3.55};readonly table=new T.Vector3(-3.5,1,2.6);readonly facing=Math.PI;
  // Desk state. The first try is the obvious one: visible light.
  band:Band='vis';detector:Detector='visdiode';power:Power=1;hatchOpen=false;
  jobIndex=0;delivered:{job:string;verdict:Verdict}[]=[];mistakes=0;spent=0;active=false;
  /** Where the pod is parked (null while carried or loose); which mark each mirror board stands on. */
  podPad:Pad|null=null;mirrorAt=new Map<Prop,Spot>();
  /** The player's aim: the tower's heading and each standing mirror's yaw. It starts on the first pad. */
  aim:Aim={tx:heading(TX,PADS[JOBS[0].pad]),mirrors:{}};
  private drag?:'tx'|Spot;private mapMesh!:T.Mesh;private mapHover:false|'aim'|'mirror'|'turn'=false;private tickT=0;
  private room?:SpectrumRoom;private pod?:Prop;private mirrors:Prop[]=[];private ready=false;
  private root=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;
  private podTop=new T.Group();private podHeads=new Map<Detector,T.Object3D>();private podLamp!:T.Mesh;private mirrorTops=new Map<Prop,T.Object3D>();
  private turret=new T.Group();private beacon!:T.Mesh;private beam=new T.Group();private rings:T.Mesh[]=[];private beamKey='';private markMeshes:T.Mesh[]=[];
  private pulse!:T.Mesh;private pulseT=-1;private pulsePath:T.Vector3[]=[];private pulseOk=false;
  private padRings=new Map<Pad,T.Mesh>();private hatchT=0;
  private map=new Live(1100,800);private link=new Live(640,360);private wave=new Live(640,360);
  private ribbon!:T.Mesh;private ribbonCycles=BANDS.vis.cycles;private ribbonBase!:Float32Array;
  private bandKeys=new Map<Band,T.Object3D>();private powerKeys=new Map<Power,T.Object3D>();private lever!:T.Object3D;private sendCap!:T.Mesh;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';private lastMessage='';
  private tower!:T.Group;private glare!:T.Sprite;
  /** Commit, then reveal: the link's numbers appear only after a SEND, for the setup that was sent. */
  private tested?:{key:string;margin:number;terms:Term[];tier:number;at:number};
  /** A delivery that just landed: the route stays on the map and the pulse runs it before the next job. */
  private hold?:{until:number;start:number;path:P[];pad:Pad};
  /** Each door's swing (0 shut … 1 open) and which side it opened toward. */
  private doorOpen:Record<DoorId,number>={store:0,lab:0,quiet:0};private doorSide:Record<DoorId,number>={store:1,lab:1,quiet:1};
  readonly job:StationJob;
  /** The toaster is off the counter (R5-079): it stops smoking, so smoke no longer scatters any beam. */
  toasterDown=false;private smokeLeft=1;
  constructor(private game:Game){
    SMOKE.r=SMOKE_R0;
    this.limits.cost=Math.ceil(JOBS.reduce((n,j)=>n+(leanest(j)?.cost??0),0)*1.25);
    const d=()=>this.delivered.length;
    this.job={goal:'Deliver three messages across the research hall',
      steps:[
        {text:'Carry the receiver pod into the brick storeroom',done:()=>d()>0||this.podPad==='store',at:()=>this.pod&&this.game.held===this.pod?PADS.store:this.podAt()},
        // The desk's mains lead (R5-079): no SEND until it is plugged in at the wall.
        ...game.leadStep(),
        {text:'Sit at the dispatch desk (E)',done:()=>this.active||d()>0,at:()=>this.stand},
        {text:`Delivery 1: ${JOBS[0].title}`,done:()=>d()>0,at:()=>this.stand},
        {text:'Get the pod into the glass lab',done:()=>d()>1||(d()>0&&this.podPad==='lab'),
          at:()=>this.pod&&this.game.held===this.pod?PADS.lab:this.podAt()},
        {text:`Delivery 2: ${JOBS[1].title}`,done:()=>d()>1,at:()=>this.stand},
        {text:'Move the pod into the quiet room',done:()=>d()>2||(d()>1&&this.podPad==='quiet'),at:()=>this.pod&&this.game.held===this.pod?PADS.quiet:this.podAt()},
        {text:`Delivery 3: ${JOBS[2].title}`,done:()=>d()>2,at:()=>this.stand}],
      bonuses:[
        // A chaos bonus in the room (R5-079): knock the smoking toaster off the tea counter (the smoke stops).
        {text:'Knock the smoking toaster down',ok:()=>this.toasterDown},
        {text:'Elegant: least power, fewest mirrors',ok:()=>this.delivered.length>0&&this.delivered.every(x=>x.verdict.tier===3)},
        {text:'No failed send',ok:()=>this.mistakes===0}]};
    game.root.add(this.root);game.root.add(this.beam);
    this.buildDesk();this.buildHall();this.redraw();freezeBench(this.root,this,game);
  }
  dress(kit:RoomKit){this.room=dressSpectrum(this.game,kit);return {lightUp:this.room.lightUp};}
  current():Job|undefined{return JOBS[this.jobIndex];}
  state():Setup{return {band:this.band,detector:this.detector,power:this.power,hatchOpen:this.hatchOpen,mirrors:[...new Set(this.mirrorAt.values())],pod:this.podPad,aim:this.aim,doors:this.doorsOpen()};}
  reading():Reading{return read(this.current()??JOBS[JOBS.length-1],this.state());}
  /** A door counts as open once it has swung far enough to leave a real gap. */
  doorsOpen():DoorsOpen{const o:DoorsOpen={};for(const d of Object.keys(this.doorOpen) as DoorId[])if(this.doorOpen[d]>.35)o[d]=true;return o;}
  private podAt():P{const p=this.pod?.body.translation();return p?{x:p.x,z:p.z}:POD_HOME;}
  /** The setup a SEND measures: when the player changes any of it, the old numbers no longer apply. */
  private setupKey(){const s=this.state(),beam=BANDS[s.band].beam;
    return JSON.stringify([this.jobIndex,s.band,s.power,s.hatchOpen,[...s.mirrors].sort(),s.pod,s.doors,beam?[+this.aim.tx.toFixed(3),Object.entries(this.aim.mirrors).map(([k,v])=>[k,+(v as number).toFixed(3)]).sort()]:0]);}
  /** The link's numbers for this setup have been measured by a SEND. */
  revealed(){return !!this.tested&&this.tested.key===this.setupKey();}

  // ---------- the desk ----------
  private buildDesk(){
    const g=this.game,t=this.table,top=group(this.root,t.x,t.y,t.z);
    part(g.decorRoot,rbox(4.4,1,1.3,.08),toon('#f3ede2'),t.x,.5,t.z);part(g.decorRoot,rbox(4.5,.07,1.4,.05),toon('#e7c89a'),t.x,1.0,t.z);
    BAND_IDS.forEach((b,i)=>part(g.decorRoot,box(4.32,.035,.02),toon(BANDS[b].color),t.x,.28+i*.04,t.z+.66));
    this.solid(4.4,1.05,1.3,t.x,.52,t.z);
    // The HUD cards cover the desk's back corners, so the standing screens sit in the middle and
    // only flat controls go out to the sides.
    // ---- Left: band keys (front) and the wave ribbon between two posts.
    part(top,rbox(1.26,.02,1.12,.06),toon('#3a3d55'),-1.53,.045,0);
    BAND_IDS.forEach((b,k)=>{const x=-2.01+k*.24,key=group(top,x,.055,.36);part(key,cyl(.085,.095,.05,20),toon(INK),0,.025,0);part(key,cyl(.075,.075,.045,20),toon(BANDS[b].color),0,.06,0);
      this.bandKeys.set(b,key);this.click(key,'band',b);sign(top,BAND_KEYS[b],x,.082,.51,.235,-1.1,CREAM,INK,.1);});
    for(const x of [-2.03,-1.03]){part(top,cyl(.02,.02,.46,8),toon(DMETAL),x,.27,-.02);part(top,sphere(.03,10,8),toon(INK),x,.51,-.02);}
    const geo=new T.PlaneGeometry(.96,.07,192,1);this.ribbonBase=Float32Array.from(geo.attributes.position.array as Float32Array);
    this.ribbon=part(top,geo,new T.MeshBasicMaterial({color:BANDS.vis.color,side:T.DoubleSide}),-1.53,.3,-.02,false);(this.ribbon.material as T.Material).userData.outlineParameters={visible:false};this.ribbon.rotation.x=-Math.PI/2;
    sign(top,'BAND  ·  c = f × λ',-1.53,.082,.19,.7,-1.1,'#ffd66b',INK,.1);
    // ---- Centre back: the wave readout and the link meter, side by side.
    const screen=(x:number,tex:T.Texture)=>{for(const dx of [-.3,.3])part(top,cyl(.025,.025,.3,8),toon(DMETAL),x+dx,.2,-.5);const s=group(top,x,.3,-.5);s.rotation.x=-.4;part(s,rbox(.9,.52,.05,.03),toon(INK),0,.26,0);
      part(s,new T.PlaneGeometry(.86,.484),flatMat(tex),0,.26,.027,false).userData.noAO=true;return s;};
    screen(-.47,this.wave.tex);screen(.47,this.link.tex);
    // ---- Centre front: the live hall map on a low lectern.
    part(top,rbox(1.3,.18,.5,.04),toon('#8e5a36'),0,.13,-.08);part(top,rbox(1.3,.05,.9,.04),toon('#8e5a36'),0,.07,.17);
    const lect=group(top,0,.21,.17);lect.rotation.x=.3;part(lect,rbox(1.4,.05,1.02,.05),toon('#c98a55'),0,.02,0);
    this.mapMesh=part(lect,new T.PlaneGeometry(1.34,.975),flatMat(this.map.tex),0,.047,0,false);this.mapMesh.rotation.x=-Math.PI/2;this.mapMesh.userData.noAO=true;
    // ---- Right: power keys and SEND (middle), the hatch lever (front).
    part(top,rbox(1.26,.02,1.12,.06),toon('#3a3d55'),1.53,.045,0);
    POWERS.forEach((p,k)=>{const x=1.05+k*.26,key=group(top,x,.055,.22);part(key,rbox(.24,.05,.16,.03),toon('#fffaf0'),0,.025,0);sign(key,`${p} mW`,0,.052,0,.22,-Math.PI/2,'#fffaf0',INK,.11);
      this.powerKeys.set(p as Power,key);this.click(key,'power',p);});
    sign(top,'POWER  (P)',1.31,.082,.37,.4,-1.1,CREAM,INK,.1);
    // The hatch switch: a low rocker (tipped back = open), so it doesn't hide the power keys.
    const lever=group(top,1.05,.055,.47);part(lever,rbox(.22,.05,.16,.03),toon(INK),0,.025,0);this.lever=group(lever,0,.06,0);part(this.lever,rbox(.16,.05,.1,.02),toon('#ffc629'),0,.02,0);
    this.click(lever,'hatch');sign(top,'LAB HATCH (H)',1.4,.082,.5,.4,-1.1,'#ffc629',INK,.1);
    const send=group(top,1.95,.055,.3);part(send,cyl(.14,.16,.06,24),toon(INK),0,.03,0);this.sendCap=part(send,cyl(.12,.12,.06,24),toon('#3fae6a'),0,.08,0);
    this.click(send,'send');sign(top,'SEND',1.95,.082,.54,.3,-1.1,'#3fae6a','#fffaf0',.1);
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}

  // ---------- the hall: tower, pads, mirror marks, beam ----------
  private buildHall(){
    const g=this.game,r=g.root;
    // The tower: a two-step plinth, the mast with the five band rings standing proud of it, the turret.
    const tower=this.tower=group(r,TX.x,0,TX.z);part(tower,cyl(.42,.46,.08,24),toon(DMETAL),0,.04,0);part(tower,cyl(.3,.34,.06,24),toon('#6b7385'),0,.11,0);
    for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;part(tower,sphere(.025,8,6),toon(INK),Math.cos(a)*.36,.09,Math.sin(a)*.36);}
    part(tower,cyl(.07,.09,1.1,14),toon(PAPER),0,.65,0);
    BAND_IDS.forEach((b,i)=>part(tower,cyl(.105,.105,.045,20),toon(BANDS[b].color),0,.32+i*.075,0));
    tower.add(this.turret);this.turret.position.y=BEAM_Y;part(this.turret,rbox(.3,.22,.34,.06),toon(PAPER),0,0,0);part(this.turret,cyl(.09,.1,.14,18,'z'),toon(INK),0,0,.2);
    part(this.turret,cyl(.075,.075,.02,18,'z'),glossyToon('#dff3ff',{spec:.9,size:.95}),0,0,.275);for(const s of [-1,1]){part(this.turret,cyl(.018,.018,.36,8),toon('#dfe3ea'),s*.11,.25,-.08);part(this.turret,sphere(.03,10,8),toon(INK),s*.11,.44,-.08);}
    for(const y of [-.06,0,.06])part(this.turret,box(.2,.025,.01),toon(INK),0,y,-.175,false);
    this.beacon=part(tower,sphere(.07,12,10),hot(BANDS.vis.color,1.6),0,1.52,0,false);
    this.solid(.6,2,.6,TX.x,1,TX.z);
    // Destination pads: a ring that glows on the current delivery's pad.
    (Object.keys(PADS) as Pad[]).forEach(p=>{const at=PADS[p],pad=group(g.decorRoot,at.x,0,at.z);part(pad,cyl(.72,.76,.04,32),toon('#fffaf0'),0,.02,0);
      const ring=part(r,new T.TorusGeometry(.66,.045,8,48),toon('#c9c2b2'),at.x,.05,at.z,false);ring.rotation.x=Math.PI/2;this.padRings.set(p,ring);
      const tag=part(r,new T.PlaneGeometry(1.2,.3),flatMat(label(`${PAD_NAMES[p].toUpperCase()} PAD`,'#fffaf0',INK,512,128)),at.x,.03,at.z+.95,false);tag.rotation.x=-Math.PI/2;tag.userData.noAO=true;});
    // Mirror marks: dashed rings with their letter.
    for(const s of SPOT_IDS){const at=SPOTS[s],m=part(r,new T.PlaneGeometry(1.5,1.5),flatMat(canvasTex(256,256,c=>{c.setLineDash([18,12]);c.lineWidth=10;c.strokeStyle='#8b7be8';c.beginPath();c.arc(128,128,110,0,7);c.stroke();c.setLineDash([]);
      c.fillStyle='rgba(139,123,232,.16)';c.beginPath();c.arc(128,128,104,0,7);c.fill();c.fillStyle='#6a5bd0';c.font=FONT(72);c.textAlign='center';c.textBaseline='middle';c.fillText(s,128,120);c.font=FONT(26);c.fillText('MIRROR',128,178);})),at.x,.014,at.z,false);
      m.rotation.x=-Math.PI/2;m.userData.noAO=true;this.markMeshes.push(m);}
    // Broadcast rings for radio and microwave, and the pulse that runs the route on SEND.
    for(let k=0;k<3;k++){const ring=new T.Mesh(new T.TorusGeometry(1,.02,6,64),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.5,depthWrite:false}));ring.material.userData.outlineParameters={visible:false};
      ring.rotation.x=Math.PI/2;ring.position.set(TX.x,BEAM_Y,TX.z);ring.userData.noAO=true;r.add(ring);this.rings.push(ring);}
    this.pulse=part(r,sphere(.14,16,12),hot('#ffffff',2),0,BEAM_Y,0,false);this.pulse.visible=false;this.pulse.userData.noAO=true;
  }
  /** Props exist only after the room is dressed: find the pod and the mirrors on the first update. */
  private setup(){
    this.ready=true;const g=this.game;this.pod=g.props.find(p=>p.spec.id==='pod');this.mirrors=g.props.filter(p=>p.spec.id?.startsWith('mirror'));
    // The pod: a mast with the fitted detector head and a status lamp, riding on the case.
    // (Mast and plate sit clear of the case's carry handle, which spans x ±0.15 on the lid.)
    const t=this.podTop;g.root.add(t);part(t,cyl(.03,.03,.36,8),toon(DMETAL),.28,.48,0);part(t,rbox(.22,.05,.24,.03),toon(INK),.28,.32,0);
    for(const d of DETECTOR_IDS){const h=headMesh(d,1.5);h.position.set(.28,.64,0);t.add(h);this.podHeads.set(d,h);}
    this.podLamp=part(t,sphere(.06,12,10),toon('#6b7385'),-.25,.36,.1,false);
    const tag=part(t,new T.PlaneGeometry(.44,.15),flatMat(label('RX POD','#3fae6a','#fffaf0',256,82)),.06,.02,.331,false);tag.userData.noAO=true;
    // Sun glare on the detector: big on the green photodiode, small on the filtered near-IR one.
    this.glare=new T.Sprite(new T.SpriteMaterial({map:TXR.radial('glare','rgba(255,246,214,1)','rgba(255,236,170,0)',.2),transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending}));
    this.glare.position.set(.28,.84,.05);this.glare.visible=false;this.glare.userData.noAO=true;t.add(this.glare);
    // Mirror boards: a silvered pane over the board, both faces.
    // (Props are drawn batched, so the panes ride along as their own groups, like the pod's mast.)
    const glassTex=canvasTex(256,160,c=>{const gr=c.createLinearGradient(0,0,256,160);gr.addColorStop(0,'#f4fbff');gr.addColorStop(.5,'#a9d4f0');gr.addColorStop(1,'#6fa9d6');c.fillStyle=gr;c.fillRect(0,0,256,160);
      c.fillStyle='rgba(255,255,255,.75)';for(const [x,w] of [[40,26],[88,10],[170,18]]){c.beginPath();c.moveTo(x,160);c.lineTo(x+w,160);c.lineTo(x+w+90,0);c.lineTo(x+90,0);c.fill();}});
    for(const m of this.mirrors){const top=group(g.root);part(top,box(1.64,1.02,.1),toon(DMETAL),0,.3,0);for(const s of [-1,1]){const f=part(top,new T.PlaneGeometry(1.56,.94),flatMat(glassTex),0,.3,s*.052,false);f.rotation.y=s>0?0:Math.PI;f.userData.noAO=true;}
      part(top,box(1.72,.06,.12),toon('#8b7be8'),0,.83,0);this.mirrorTops.set(m,top);}
  }

  // ---------- room props: park on pads and marks ----------
  private park(p:Prop,at:P,yaw:number){const b=p.body,h=prefabs[p.spec.kind].size[1];
    p.lastSpeed=0;b.setLinvel({x:0,y:0,z:0},true);b.setAngvel({x:0,y:0,z:0},true);b.setTranslation({x:at.x,y:h/2+.01,z:at.z},true);b.setRotation(yawQuat(yaw),true);b.setBodyType(RAPIER.RigidBodyType.Fixed,true);}
  private unpark(p:Prop){p.body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);}
  dropped(p:Prop){
    const q=p.body.translation(),me=this.game.player.translation();
    if(p===this.pod){const pad=(Object.keys(PADS) as Pad[]).find(k=>Math.min(dist(q,PADS[k]),dist(me,PADS[k])-.6)<1.6);if(!pad)return;
      this.park(p,PADS[pad],0);this.podPad=pad;this.game.audio.plug();this.game.burst({x:PADS[pad].x,y:.2,z:PADS[pad].z},'#8ff3ea',1,'ring');this.redraw();return;}
    if(this.mirrors.includes(p)){const taken=new Set(this.mirrorAt.values());const s=SPOT_IDS.find(k=>!taken.has(k)&&Math.min(dist(q,SPOTS[k]),dist(me,SPOTS[k])-.6)<1.5);if(!s)return;
      this.mirrorAt.set(p,s);this.aim.mirrors[s]=idleYaw(s);this.park(p,SPOTS[s],this.aimYaw(s));this.game.audio.plug();this.game.burst({x:SPOTS[s].x,y:.2,z:SPOTS[s].z},'#c9c0ff',1,'ring');this.redraw();}
  }
  /** A mirror board's yaw, as the player aimed it (it faces the tower until then). */
  private aimYaw(s:Spot){return this.aim.mirrors[s]??idleYaw(s);}
  /** Points the tower at a spot on the map, or turns a mirror so its reflection heads there. */
  private aimTo(what:'tx'|Spot,at:P){
    // Pointing the tower near a standing mirror points it at the board's centre.
    if(what==='tx'){const m=this.handleNear(at);if(m)at=SPOTS[m];if(dist(at,TX)<.3)return false;this.aim.tx=heading(TX,at);}
    else{if(![...this.mirrorAt.values()].includes(what))return false;const r=this.reading().route,i=r.spots.indexOf(what),from=i>=0?r.path[i]:TX;
      if(dist(at,SPOTS[what])<.3)return false;this.aim.mirrors[what]=mirrorYaw(SPOTS[what],from,at);}
    if(this.game.time>this.tickT){this.tickT=this.game.time+.06;this.game.audio.tone(what==='tx'?700:900,.02,.015,'triangle');}
    this.redraw();return true;
  }
  /** Map coordinates under the pointer (plan metres), when the ray hits the desk's map. */
  private mapPoint(ray:T.Raycaster):P|undefined{
    const h=ray.intersectObject(this.mapMesh,false)[0];if(!h?.uv)return undefined;
    const L=this.game.level,w=this.map.canvas.width,hh=this.map.canvas.height,sx=(w-60)/L.width;
    return {x:(h.uv.x*w-30)/sx-L.width/2,z:((1-h.uv.y)*hh-28)/sx-L.depth/2};
  }
  /** Where a plan point is drawn on the desk's map, in page pixels (for tests that click the map). */
  private mapScreen(p:P):[number,number]{
    const L=this.game.level,w=this.map.canvas.width,h=this.map.canvas.height,sx=(w-60)/L.width,u=(30+(p.x+L.width/2)*sx)/w,v=1-(28+(p.z+L.depth/2)*sx)/h;
    const g=this.mapMesh.geometry as T.PlaneGeometry,{width,height}=g.parameters,cam=this.game.view.camera,rect=this.game.view.renderer.domElement.getBoundingClientRect();
    const s=this.mapMesh.localToWorld(new T.Vector3((u-.5)*width,(v-.5)*height,0)).project(cam);return [Math.round(rect.left+(s.x+1)/2*rect.width),Math.round(rect.top+(1-s.y)/2*rect.height)];
  }
  /** A standing mirror under a map point, if the pointer is on one. */
  private handleNear(at:P):Spot|undefined{
    for(const s of this.mirrorAt.values())if(dist(at,SPOTS[s])<1.2)return s;
    return undefined;
  }

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const j=this.current(),a=this.game.audio;if(!j)return false;
    // While a delivery lands (the pulse runs the map, the pad flashes), the desk waits for the next job.
    if(this.hold)return false;
    switch(name){
      case 'band':{const b=arg as Band;if(!BANDS[b])return false;this.band=b;this.detector=BANDS[b].detector;a.tone(300+BAND_IDS.indexOf(b)*140,.08,.04,'triangle');
        this.say(`${BANDS[b].name}: λ = ${lambdaText(b)}, f = ${freqText(b)}. Every band obeys c = f × λ.`);break;}
      case 'aim':{const o=arg as {what:'tx'|Spot;to:Spot|Pad|P};if(!o)return false;
        const to=typeof o.to==='string'?(SPOTS as Record<string,P>)[o.to]??(PADS as Record<string,P>)[o.to]:o.to;if(!to)return false;return this.aimTo(o.what,to);}
      case 'turn':{this.aim.tx+=Number(arg)*Math.PI/90;a.tone(700,.02,.015,'triangle');break;}
      case 'power':{const p=Number(arg) as Power;if(!POWERS.includes(p))return false;this.power=p;a.tone(420+POWERS.indexOf(p)*180,.07,.04,'triangle');break;}
      case 'hatch':{this.hatchOpen=typeof arg==='boolean'?arg:!this.hatchOpen;a.noise(.12,.05,900,'lowpass');a.tone(this.hatchOpen?520:300,.1,.04,'triangle');
        this.say(this.hatchOpen?'Hatch open: a 60 cm hole in the lab\'s metal shutter.':'Hatch shut: the shutter is solid metal again.');break;}
      case 'send':{const s=this.state(),v=judge(j,s),r=this.reading();
        if(!r.podOk){this.say(`The receiver pod isn't on the ${PAD_NAMES[j.pad]} pad yet. Step back (E) and carry it there.`);a.voice('hm',1.4);return false;}
        // No mains, no transmitter (R5-079): nothing is sent and nothing is counted.
        if(this.game.benchDead()){this.say("No power: the desk's lead isn't plugged in.",'bad');return false;}
        // A failed send only counts as a mistake when the failure was already on show: the path drawn
        // stopping or missing, or this exact setup measured before. A link too weak to work, sent
        // before its numbers were ever shown, is the measurement itself: it costs energy, not a mistake.
        const known=!!r.route.blocked||!!r.route.missed||this.revealed();
        const c=cost(s,r.route);this.spent+=c;this.firePulse(r,v.tier>0);
        this.tested={key:this.setupKey(),margin:r.margin,terms:budget(r,s),tier:v.tier,at:this.game.time};this.observe(r);
        if(v.tier===0){if(known)this.mistakes++;this.say(`Not delivered. ${v.problems[0]}`,'bad');a.verdictFail('weak');a.voice('groan',1);benchFault(this.game,.06);this.game.alarm(PADS[j.pad],3);this.redraw();return true;}
        this.delivered.push({job:j.id,verdict:v});this.lastMessage=j.message;
        this.say(`“${j.message}” · ${['','Received','Reliable','Elegant'][v.tier]} (${v.margin} dB)${v.notes[0]?` · ${v.notes[0]}`:''}`,'ok');
        const at=PADS[j.pad];signOff(this.game,this,'#ffd66b',this.complete(),{x:at.x,y:1.4,z:at.z});if(!this.complete())[1568,1976,2349].forEach((f,i)=>a.bell(f,.4,.03,.9+i*.12));if(!this.game.atBench)this.game.burst({x:at.x,y:1.5,z:at.z},'#fff3c8',6,'star');
        // Hold on this delivery for a beat: the pulse runs the route on the map and the pad flashes;
        // the next job comes up after it (see update()).
        this.hold={until:this.game.time+1.6,start:this.game.time,path:this.drawnPath(r),pad:j.pad};this.redraw();return true;}
      default:return false;
    }
    this.redraw();return true;
  }
  /** A send shows what this band did at each material it met (up to where it stopped): the wall chart
   *  fills in those cells. */
  private observe(r:Reading){
    if(!this.room)return;let fresh=false;
    for(const leg of r.route.legs){for(const h of leg.hits){fresh=this.room.chart.mark(this.band,h.mat,h.loss)||fresh;if(!Number.isFinite(h.loss))break;}if(leg.hits.some(h=>!Number.isFinite(h.loss)))break;}
    if(fresh)this.game.audio.tone(1200,.05,.025,'triangle',.3);
  }
  /** The delivery hold is over: the next job comes up and the tower turns toward its pad. */
  private endHold(){this.hold=undefined;this.tested=undefined;this.jobIndex++;const next=this.current();if(next)this.aim.tx=heading(TX,PADS[next.pad]);this.redraw();}
  private firePulse(r:Reading,ok:boolean){
    const pts=this.drawnPath(r);this.pulsePath=pts.map(p=>new T.Vector3(p.x,BEAM_Y,p.z));this.pulseT=0;this.pulseOk=ok;this.pulse.visible=true;
    ((this.pulse.material as T.MeshBasicMaterial).color).set(BANDS[this.band].color).multiplyScalar(2);
  }
  /** The route as far as it goes: it stops at the first obstacle that blocks it. */
  private drawnPath(r:Reading):P[]{
    const out:P[]=[r.route.path[0]];
    for(const leg of r.route.legs){const stop=leg.hits.find(h=>!Number.isFinite(h.loss));if(stop){out.push(stop.at);return out;}out.push(leg.b);}
    return out;
  }

  // ---------- drawing ----------
  redraw(){
    const r=this.reading();
    this.bandKeys.forEach((k,b)=>k.position.y=b===this.band?.075:.055);
    this.powerKeys.forEach((k,p)=>{k.position.y=p===this.power?.07:.055;(k.children[0] as T.Mesh).material=toon(p===this.power?'#ffd66b':'#fffaf0');});
    this.lever.rotation.x=this.hatchOpen?-.35:.35;
    this.sendCap.material=toon(r.podOk&&!this.hold?'#3fae6a':'#9aa0ad');
    (this.ribbon.material as T.MeshBasicMaterial).color.set(BANDS[this.band].color);
    this.podHeads.forEach((h,d)=>h.visible=d===this.detector);
    if(this.ready){for(const [m,s] of this.mirrorAt)m.body.setRotation(yawQuat(this.aimYaw(s)),true);}
    this.shown='';this.beamKey='';
  }
  /** The beam through the hall: bright where it travels, a red stop disc where something blocks it. */
  private drawBeam(r:Reading){
    const pts=this.drawnPath(r),blocked=!!r.route.blocked,b=BANDS[this.band];
    const key=JSON.stringify([pts,this.band,blocked,r.margin>=0]);if(key===this.beamKey)return;this.beamKey=key;
    this.beam.clear();const col=new T.Color(b.color);
    const core=new T.MeshBasicMaterial({color:col.clone().multiplyScalar(1.6),transparent:true,opacity:b.beam?.9:.55,depthWrite:false});core.userData.outlineParameters={visible:false};
    const halo=new T.MeshBasicMaterial({color:col,transparent:true,opacity:.26,depthWrite:false,blending:T.AdditiveBlending});halo.userData.outlineParameters={visible:false};
    for(let i=1;i<pts.length;i++){const a=new T.Vector3(pts[i-1].x,BEAM_Y,pts[i-1].z),c=new T.Vector3(pts[i].x,BEAM_Y,pts[i].z),len=a.distanceTo(c),mid=a.clone().add(c).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(UP,c.clone().sub(a).normalize());
      if(b.beam){for(const [rad,m] of [[.045,core],[.16,halo]] as const){const t=new T.Mesh(new T.CylinderGeometry(rad,rad,len,10,1,true),m);t.position.copy(mid);t.quaternion.copy(q);t.userData.noAO=true;this.beam.add(t);}}
      // Radio and microwave spread everywhere (the rings show it): no straight ray is drawn for them,
      // only where they are stopped.
    }
    if(blocked){const end=pts[pts.length-1],prev=pts[pts.length-2],dir=new T.Vector3(end.x-prev.x,0,end.z-prev.z).normalize();
      const stop=new T.Mesh(new T.CircleGeometry(.24,28),new T.MeshBasicMaterial({color:new T.Color('#ff5a5a').multiplyScalar(1.4),transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}));
      (stop.material as T.Material).userData.outlineParameters={visible:false};stop.position.set(end.x-dir.x*.2,BEAM_Y,end.z-dir.z*.2);stop.lookAt(stop.position.clone().add(dir));stop.userData.noAO=true;this.beam.add(stop);}
    this.rings.forEach(g=>{(g.material as T.MeshBasicMaterial).color.set(b.color);});
  }
  /** The hall map on the desk: walls by material, the smoke, marks, pads, pod and the beam. */
  private drawMap(r:Reading){
    const pod=this.podAt(),doors=this.doorsOpen(),hold=this.hold,hu=hold?Math.min(1,(this.game.time-hold.start)/(hold.until-hold.start)):-1;
    const key=JSON.stringify([SMOKE.r,this.band,this.hatchOpen,[...this.mirrorAt.values()],this.podPad,Math.round(pod.x*4),Math.round(pod.z*4),this.jobIndex,this.drawnPath(r),r.route.via??'',doors,this.aim,this.drag??'',this.mapHover,hold?Math.round(hu*40):-1]);
    this.map.draw(key,(c,w,h)=>{
      const L=this.game.level,sx=(w-60)/L.width,X=(x:number)=>30+(x+L.width/2)*sx,Z=(z:number)=>28+(z+L.depth/2)*sx;
      c.fillStyle=INK;c.beginPath();c.roundRect(0,0,w,h,26);c.fill();c.fillStyle='#fbf6ec';c.beginPath();c.roundRect(12,12,w-24,h-24,18);c.fill();
      c.strokeStyle='rgba(43,45,66,.07)';c.lineWidth=2;const hw=L.width/2,hd=L.depth/2;for(let x=-hw;x<=hw;x+=1){c.beginPath();c.moveTo(X(x),Z(-hd));c.lineTo(X(x),Z(hd));c.stroke();}for(let z=-hd;z<=hd;z+=1){c.beginPath();c.moveTo(X(-hw),Z(z));c.lineTo(X(hw),Z(z));c.stroke();}
      const zone=(o:{x0:number;x1:number;z0:number;z1:number},col:string,name:string)=>{c.fillStyle=col;c.fillRect(X(o.x0),Z(o.z0),(o.x1-o.x0)*sx,(o.z1-o.z0)*sx);c.fillStyle='rgba(43,45,66,.6)';c.font=FONT(44);c.textAlign='center';c.fillText(name,X((o.x0+o.x1)/2),Z(o.z0)+54);};
      zone(STORE,'#f2dcc0','STOREROOM');zone(LAB,'#dcecf8','GLASS LAB');zone({x0:QUIET.x0,x1:QUIET.x1,z0:QUIET.z0,z1:QUIET.z1},'#e6defa','');c.fillStyle='rgba(43,45,66,.6)';c.fillText('QUIET',X(8.25),Z(QUIET.z1)-22);
      // Smoke and the tea counter.
      if(SMOKE.r>0){const sg=c.createRadialGradient(X(SMOKE.x),Z(SMOKE.z),4,X(SMOKE.x),Z(SMOKE.z),SMOKE.r*sx);sg.addColorStop(0,'rgba(120,125,140,.55)');sg.addColorStop(1,'rgba(120,125,140,.08)');c.fillStyle=sg;c.beginPath();c.arc(X(SMOKE.x),Z(SMOKE.z),SMOKE.r*sx,0,7);c.fill();}
      c.fillStyle='#f4c9c3';c.fillRect(X(1.3),Z(4.54),2.2*sx,.62*sx);c.fillStyle='rgba(43,45,66,.7)';c.font=FONT(36);c.fillText('SMOKE',X(SMOKE.x),Z(SMOKE.z)+12);
      // Walls, coloured by what they are made of.
      const style:{[k:string]:[string,number,number[]]}={brick:['#c8674a',22,[]],wood:['#9c6d42',18,[]],glass:['#7fc3ea',12,[]],metal:['#5f6c84',20,[]],hatch:['#ffc629',14,[]],mesh:[COPPER,11,[14,9]]};
      for(const wl of walls(this.hatchOpen,doors)){const m=wl.mat[0],[col,lw,dash]=style[m];c.setLineDash(dash);c.strokeStyle=col;c.lineWidth=wl.id.endsWith('-door')?lw*.6:lw;c.lineCap='butt';c.beginPath();c.moveTo(X(wl.a.x),Z(wl.a.z));c.lineTo(X(wl.b.x),Z(wl.b.z));c.stroke();
        if(wl.mat.includes('glass')){c.strokeStyle='#7fc3ea';c.lineWidth=7;c.setLineDash([]);c.beginPath();c.moveTo(X(wl.a.x),Z(wl.a.z)-15);c.lineTo(X(wl.b.x),Z(wl.b.z)-15);c.stroke();}}
      // Doors: a small hinge dot at the wall end of each doorway (an open door leaves a gap).
      for(const d of Object.keys(DOORS) as DoorId[]){const o=DOORS[d],hx=d==='store'?o.a.x:o.b.x;c.fillStyle=INK;c.beginPath();c.arc(X(hx),Z(o.a.z),7,0,7);c.fill();}
      // The hatch is always framed in yellow, like its frame in the room: dashed while shut, solid when open.
      c.strokeStyle='#ffc629';c.lineWidth=6;c.setLineDash(this.hatchOpen?[]:[10,7]);c.strokeRect(X(HATCH.x0)-3,Z(HATCH.z)-14,(HATCH.x1-HATCH.x0)*sx+6,28);c.setLineDash([]);
      // Desk, tower, marks, mirrors.
      c.fillStyle='#e7c89a';c.fillRect(X(this.table.x-2.2),Z(this.table.z-.65),4.4*sx,1.3*sx);c.fillStyle='rgba(43,45,66,.7)';c.font=FONT(34);c.fillText('DESK',X(this.table.x),Z(this.table.z)+12);
      const taken=new Map([...this.mirrorAt.entries()].map(([m,s])=>[s,m]));
      for(const s of SPOT_IDS){const p=SPOTS[s];c.setLineDash([8,6]);c.strokeStyle='#8b7be8';c.lineWidth=5;c.beginPath();c.arc(X(p.x),Z(p.z),24,0,7);c.stroke();c.setLineDash([]);
        const m=taken.get(s);if(m){const yaw=this.aimYaw(s),dx=Math.cos(yaw)*.8*sx,dz=-Math.sin(yaw)*.8*sx,i=r.route.spots.indexOf(s);
          // Once the beam reaches a mirror, its ring gets a turn knob (on the reflected leg): drag to turn the board.
          if(i>=0){const nxt=r.route.path[i+2],dir=nxt?Math.atan2(nxt.z-p.z,nxt.x-p.x):Math.atan2(Math.cos(yaw),Math.sin(yaw));
            c.strokeStyle=this.drag===s?'#ffb020':'rgba(43,45,66,.35)';c.lineWidth=this.drag===s?6:3;c.beginPath();c.arc(X(p.x),Z(p.z),1.05*sx,0,7);c.stroke();
            const kx=X(p.x)+Math.cos(dir)*1.05*sx,kz=Z(p.z)+Math.sin(dir)*1.05*sx;c.fillStyle=this.drag===s||this.mapHover==='turn'?'#ffb020':'#ffd66b';c.strokeStyle=INK;c.lineWidth=4;c.beginPath();c.arc(kx,kz,14,0,7);c.fill();c.stroke();}
          c.strokeStyle='#5b6d8a';c.lineWidth=14;c.beginPath();c.moveTo(X(p.x)-dx,Z(p.z)-dz);c.lineTo(X(p.x)+dx,Z(p.z)+dz);c.stroke();
          c.strokeStyle='#dff3ff';c.lineWidth=6;c.beginPath();c.moveTo(X(p.x)-dx,Z(p.z)-dz);c.lineTo(X(p.x)+dx,Z(p.z)+dz);c.stroke();}
        c.fillStyle='#6a5bd0';c.font=FONT(36);c.fillText(s,X(p.x)+34,Z(p.z)-20);}
      // Pads: the current one glows.
      const job=this.current();
      for(const k of Object.keys(PADS) as Pad[]){const p=PADS[k],now=job?.pad===k,flash=hold?.pad===k&&hu>.55&&Math.floor(hu*14)%2===0;c.fillStyle=flash?'rgba(61,255,122,.75)':now?'rgba(63,174,106,.25)':'rgba(43,45,66,.06)';c.beginPath();c.arc(X(p.x),Z(p.z),.75*sx,0,7);c.fill();
        c.strokeStyle=now||flash?'#3fae6a':'#b8b2a4';c.lineWidth=now?6:3;c.beginPath();c.arc(X(p.x),Z(p.z),.75*sx,0,7);c.stroke();}
      // The beam, as far as it gets. Radio and microwave spread everywhere: rings, no ray, with the
      // opening they leak through ringed in yellow and a red X where they're stopped.
      const b=BANDS[this.band],pts=hold?hold.path:this.drawnPath(r);
      if(!b.beam){c.strokeStyle=b.color;c.globalAlpha=.3;c.lineWidth=5;for(let k=1;k<=5;k++){c.beginPath();c.arc(X(TX.x),Z(TX.z),k*2.2*sx,0,7);c.stroke();}c.globalAlpha=1;
        const via=r.route.via&&openings(this.hatchOpen,doors).find(o=>o.id===r.route.via);if(via){c.strokeStyle='#ffc629';c.lineWidth=7;c.beginPath();c.arc(X(via.in.x),Z(via.in.z),26,0,7);c.stroke();}}
      else{c.strokeStyle=b.color;c.lineWidth=16;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(X(p.x),Z(p.z)):c.moveTo(X(p.x),Z(p.z)));c.stroke();}
      if(r.route.blocked&&!hold){const e=pts[pts.length-1];c.strokeStyle='#e5484d';c.lineWidth=12;for(const s of [-1,1]){c.beginPath();c.moveTo(X(e.x)-22,Z(e.z)-22*s);c.lineTo(X(e.x)+22,Z(e.z)+22*s);c.stroke();}}
      // The delivered message: a bright pulse running the route.
      if(hold&&pts.length>1){const lens=pts.slice(1).map((p,i)=>dist(pts[i],p)),total=lens.reduce((a,x)=>a+x,0);let d=Math.min(1,hu/.55)*total,i=0;while(i<lens.length-1&&d>lens[i]){d-=lens[i];i++;}
        const f=lens[i]?d/lens[i]:1,px=pts[i].x+(pts[i+1].x-pts[i].x)*f,pz=pts[i].z+(pts[i+1].z-pts[i].z)*f;c.fillStyle='#fffaf0';c.strokeStyle=b.color;c.lineWidth=8;c.beginPath();c.arc(X(px),Z(pz),18,0,7);c.fill();c.stroke();}
      // Tower and pod.
      c.fillStyle=INK;c.beginPath();c.arc(X(TX.x),Z(TX.z),22,0,7);c.fill();c.fillStyle=b.color;c.beginPath();c.arc(X(TX.x),Z(TX.z),13,0,7);c.fill();
      // The tower's pointer: a short arrow along its heading (beams only).
      if(b.beam){const hx=Math.sin(this.aim.tx),hz=Math.cos(this.aim.tx),ax=X(TX.x)+hx*48,az=Z(TX.z)+hz*48;c.strokeStyle=INK;c.lineWidth=8;c.beginPath();c.moveTo(X(TX.x)+hx*24,Z(TX.z)+hz*24);c.lineTo(ax,az);c.stroke();
        c.fillStyle=INK;c.beginPath();c.moveTo(ax+hx*16,az+hz*16);c.lineTo(ax-hz*11,az+hx*11);c.lineTo(ax+hz*11,az-hx*11);c.fill();}
      c.fillStyle='#fffaf0';c.strokeStyle=INK;c.lineWidth=5;c.beginPath();c.roundRect(X(pod.x)-30,Z(pod.z)-21,60,42,10);c.fill();c.stroke();c.fillStyle='#3fae6a';c.beginPath();c.arc(X(pod.x),Z(pod.z),9,0,7);c.fill();
    });
  }
  private drawWave(){
    const b=BANDS[this.band];
    this.wave.draw(this.band,(c,w,h)=>{c.fillStyle='#1d2238';c.fillRect(0,0,w,h);c.fillStyle=b.color;c.fillRect(0,0,14,h);
      c.fillStyle='#fffaf0';c.font=FONT(46);c.textAlign='left';c.fillText(b.name,40,64);
      c.font=FONT(62);c.fillStyle='#ffd66b';c.fillText(`λ ${lambdaText(this.band)}`,40,150);c.fillStyle='#8fe3ff';c.fillText(`f ${freqText(this.band)}`,40,228);
      c.fillStyle='rgba(255,250,240,.8)';c.font=FONT(32,600);c.fillText('c = f × λ = 3×10⁸ m/s',40,290);c.fillStyle='rgba(255,250,240,.5)';c.font=FONT(24,600);c.fillText(`${b.example} · ribbon not to scale`,40,336);});
  }
  /** The link screen. Before a SEND it shows only the inputs and where the path goes (reaches the pod,
   *  stopped at a material, misses); the dB numbers come from the send itself: a waterfall from the
   *  level sent, one step down per loss (distance, each obstacle, each mirror, sunlight), against the
   *  works and reliable lines. */
  private drawLink(r:Reading){
    const job=this.current(),shown=this.revealed()?this.tested:undefined,grow=shown?Math.min(1,(this.game.time-shown.at)/.6):0,b=BANDS[this.band];
    const key=JSON.stringify([shown?shown.key:'',Math.round(grow*20),r.podOk,r.route.blocked?.mat??'',!!r.route.missed,this.lastMessage,this.jobIndex,this.band,this.power,!!this.hold]);
    this.link.draw(key,(c,w,h)=>{c.fillStyle='#1d2238';c.fillRect(0,0,w,h);
      c.fillStyle='#fffaf0';c.font=FONT(40);c.textAlign='left';c.fillText('LINK',30,54);
      c.fillStyle=b.color;c.beginPath();c.roundRect(140,22,190,42,12);c.fill();c.fillStyle='#fffaf0';c.font=FONT(24);c.textAlign='center';c.fillText(b.short,235,51);
      c.fillStyle='rgba(255,250,240,.85)';c.font=FONT(30,600);c.fillText(`${this.power} mW`,385,52);
      const path:[string,string]=!r.podOk?['POD NOT ON THE PAD','#ffd66b']:r.route.blocked?[`STOPPED: ${MATERIAL_NAMES[r.route.blocked.mat].toUpperCase()}`,'#ff7a8a']:r.route.missed?['MISSES THE POD','#ffd66b']:['PATH REACHES THE POD','#8fe3ff'];
      if(!shown){
        // Before the send: where the path goes, and nothing about strength.
        c.textAlign='left';let size=40;c.font=FONT(size);while(size>20&&c.measureText(path[0]).width>w-60){size--;c.font=FONT(size);}c.fillStyle=path[1];c.fillText(path[0],30,150);
        c.fillStyle='#2e3656';c.fillRect(30,180,w-60,56);c.fillStyle='rgba(255,250,240,.55)';c.font=FONT(28,600);c.textAlign='center';
        c.fillText(r.podOk&&!r.route.blocked&&!r.route.missed?'SEND to measure the link':'no signal to measure',w/2,218);
      }else{
        // After the send: the budget, step by step.
        const m=shown.margin,terms=shown.terms,lo=-20,hi=Math.max(40,Math.ceil((terms[0]?.db??40)/10)*10),gx=30,gw=w-60,gy=76,gh=176,yOf=(v:number)=>gy+gh-(Math.max(lo,Math.min(hi,v))-lo)/(hi-lo)*gh;
        c.fillStyle='#252c48';c.fillRect(gx,gy,gw,gh);
        for(const [v,t,col] of [[SPEC.works,'works','#ffd66b'],[SPEC.reliable,'reliable','#8dffb0']] as const){c.strokeStyle=col;c.globalAlpha=.6;c.lineWidth=2;c.setLineDash([8,6]);c.beginPath();c.moveTo(gx,yOf(v));c.lineTo(gx+gw,yOf(v));c.stroke();c.setLineDash([]);c.globalAlpha=1;
          c.fillStyle=col;c.font=FONT(18,600);c.textAlign='right';c.fillText(t,gx+gw-6,yOf(v)-5);}
        const ICON:Record<string,string>={sent:'sent',distance:'distance',brick:'brick',wood:'wood',glass:'glass',hatch:'hatch',mesh:'mesh',smoke:'smoke',mirror:'mirror',sun:'sun'};
        const n=terms.length+1,cw=gw/n;let level=0;
        terms.forEach((t,i)=>{const from=level,to=level+t.db*Math.min(1,grow*n-i<0?0:grow*n-i);level+=t.db;const x=gx+i*cw+6;
          c.fillStyle=t.kind==='sent'?b.color:t.kind==='sun'?'#ffd66b':t.kind==='distance'?'#8fa0c8':'#ff9a8a';const y0=yOf(Math.max(from,to)),y1=yOf(Math.min(from,to));c.fillRect(x,y0,cw-12,Math.max(3,y1-y0));
          c.fillStyle='rgba(255,250,240,.85)';c.font=FONT(17,600);c.textAlign='center';c.fillText(ICON[t.kind]??t.kind,x+(cw-12)/2,gy+gh+20);
          if(grow>=1){c.font=FONT(17,700);c.fillText(`${t.db>0?'+':''}${Math.round(t.db)}`,x+(cw-12)/2,Math.max(gy+16,y0-5));}});
        const col=m>=SPEC.reliable?'#8dffb0':m>=SPEC.works?'#ffd66b':'#ff7a8a',x=gx+(n-1)*cw+6;
        if(grow>=1&&Number.isFinite(m)){c.fillStyle=col;const y0=yOf(Math.max(0,m)),y1=yOf(Math.min(0,m));c.fillRect(x,y0,cw-12,Math.max(3,y1-y0));}
        c.fillStyle='rgba(255,250,240,.85)';c.font=FONT(17,600);c.textAlign='center';c.fillText('got',x+(cw-12)/2,gy+gh+20);
        c.textAlign='right';c.font=FONT(44);c.fillStyle=col;c.fillText(Number.isFinite(m)?`${m.toFixed(1)} dB`:'no signal',w-30,54);
        const status:[string,string]=this.hold?['DELIVERED','#8dffb0']:r.route.blocked?[path[0],path[1]]:r.route.missed?path:m<SPEC.works?['TOO WEAK','#ff7a8a']:m<SPEC.reliable?['WEAK','#ffd66b']:['CLEAR LINK','#8dffb0'];
        c.textAlign='left';let size=34;c.font=FONT(size);while(size>18&&c.measureText(status[0]).width>w-60){size--;c.font=FONT(size);}c.fillStyle=status[1];c.fillText(status[0],30,h-52);
      }
      c.textAlign='left';c.fillStyle='rgba(255,250,240,.7)';c.font=FONT(26,600);c.fillText(this.lastMessage&&!job?`got “${this.lastMessage}”`:this.hold&&this.lastMessage?`got “${this.lastMessage}”`:job?`to the ${PAD_NAMES[job.pad]}`:'',30,h-16);});
  }
  /** The ribbon's wave stretches or squeezes smoothly toward the band's cycle count. */
  private shapeRibbon(dt:number){
    const target=BANDS[this.band].cycles;if(Math.abs(target-this.ribbonCycles)<.002&&this.ribbon.userData.shaped)return;
    this.ribbonCycles+=(target-this.ribbonCycles)*Math.min(1,dt*5);this.ribbon.userData.shaped=true;
    const pos=this.ribbon.geometry.attributes.position as T.BufferAttribute,base=this.ribbonBase;
    for(let i=0;i<pos.count;i++){const x=base[i*3],u=(x+.48)/.96;pos.setZ(i,Math.sin(u*this.ribbonCycles*Math.PI*2)*.13);}
    pos.needsUpdate=true;
  }

  pointer(e:Pointer){
    // The map: click or drag to point the tower (a click on a standing mirror points the tower at it);
    // once the beam reaches a mirror, drag that mirror to turn its board.
    const at=this.active?this.mapPoint(e.ray):undefined;
    if(this.drag){if(at&&e.kind==='move')this.aimTo(this.drag,at);if(e.kind==='up'){this.drag=undefined;this.redraw();}return;}
    const near=at&&this.handleNear(at),turn=!!near&&this.reading().route.spots.includes(near);
    this.mapHover=!at?false:turn?'turn':near?'mirror':'aim';
    if(at){if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}document.body.style.cursor=turn?'grab':near?'pointer':'crosshair';
      if(e.kind==='down'&&e.button===0&&BANDS[this.band].beam&&!this.hold){if(turn)this.drag=near;else{this.drag='tx';this.aimTo('tx',near?SPOTS[near]:at);}this.redraw();}return;}
    const hits=e.ray.intersectObjects(this.clickables.map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.12);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found)this.act(found.act,found.arg);
  }
  key(code:string){
    const next=<X>(list:readonly X[],v:X)=>list[(list.indexOf(v)+1)%list.length];
    const map:Record<string,[string,unknown?]>={Digit1:['band','radio'],Digit2:['band','micro'],Digit3:['band','thermal'],Digit4:['band','nir'],Digit5:['band','vis'],
      ArrowLeft:['turn',-1],ArrowRight:['turn',1],KeyP:['power',next(POWERS,this.power)],KeyH:['hatch'],Enter:['send']};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;this.drag=undefined;this.mapHover=false;if(!active&&this.toast)this.toast.hidden=true;if(!active){document.body.style.cursor='';
      // The room's tower, beam and mirror marks come back as Pip stands up: the win shot leaves the desk
      // and update() no longer runs to restore them.
      this.tower.visible=true;this.beam.visible=true;for(const m of this.markMeshes)m.visible=true;if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';}
  /** The three room doors swing open as Pip comes near (away from him) and shut on their springs after
   *  he passes. Anything left standing in a doorway props that door open, and the open doorway is a
   *  real opening in the link model. */
  private swingDoors(dt:number){
    if(!this.room)return;const g=this.game,me=g.player.translation(),Y=new T.Vector3(0,1,0);
    for(const d of this.room.doors){const o=DOORS[d.id],mx=(o.a.x+o.b.x)/2,z=o.a.z,half=Math.abs(o.b.x-o.a.x)/2;
      const pip=Math.hypot(me.x-mx,me.z-z)<2.4,propped=g.props.some(p=>{if(p===g.held)return false;const q=p.body.translation();return Math.abs(q.x-mx)<half-.05&&Math.abs(q.z-z)<.55&&q.y<1.6;});
      const was=this.doorOpen[d.id];if(was<.05&&!propped)this.doorSide[d.id]=me.z<z?1:-1;
      // A quick open, a softer spring close.
      const target=pip||propped?1:0;this.doorOpen[d.id]=T.MathUtils.lerp(was,target,Math.min(1,dt*(target?7:4)));const now=this.doorOpen[d.id];
      if((was>.35)!==(now>.35)){g.audio.noise(.2,.035,now>.35?700:260);if(now<=.35)g.audio.knock(.8);this.redraw();}
      const angle=d.closed+d.sign*this.doorSide[d.id]*Math.PI*.47*now;d.pivot.rotation.y=angle;
      const c=new T.Vector3(d.width/2,1.05,0).applyAxisAngle(Y,angle).add(d.pivot.position);d.body.setNextKinematicTranslation(c);d.body.setNextKinematicRotation(new T.Quaternion().setFromAxisAngle(Y,angle));}
  }
  update(dt:number){
    // At the desk the hall map shows the beam and the marks; the room's own copies would only cross the
    // close camera (over the detector knobs and SEND), so they step aside until Pip stands up.
    // The tower stands just past the desk's right end; at the desk it would crowd SEND (the map shows it).
    const desk=this.game.atBench;this.beam.visible=!desk;for(const m of this.markMeshes)m.visible=!desk;this.tower.visible=!desk;
    if(!this.ready){this.setup();this.redraw();}
    const g=this.game;
    if(this.hold&&g.time>=this.hold.until)this.endHold();
    this.swingDoors(dt);
    // Picking a parked pod or mirror up frees it again.
    if(g.held&&g.held===this.pod&&this.podPad){this.unpark(this.pod);this.podPad=null;this.redraw();}
    if(g.held&&this.mirrorAt.has(g.held)){delete this.aim.mirrors[this.mirrorAt.get(g.held)!];this.unpark(g.held);this.mirrorAt.delete(g.held);this.redraw();}
    const r=this.reading();
    // The pod's mast rides on the case; its lamp shows whether the link is up.
    if(this.pod){const p=this.pod.body.translation(),q=this.pod.body.rotation();this.podTop.position.set(p.x,p.y,p.z);this.podTop.quaternion.set(q.x,q.y,q.z,q.w);
      // Its lamp shows what the last send measured (nothing until then): green if it got through.
      const shown=this.revealed()?this.tested:undefined;this.podLamp.material=this.hold||(r.podOk&&shown&&shown.margin>=SPEC.works)?LAMP_OK:r.podOk&&shown?LAMP_BAD:LAMP_OFF;
      // Sunlight in the lab glares on the detector: strongly on the green photodiode, a little on the filtered near-IR one.
      const sun=this.podPad==='lab'&&(this.band==='vis'||this.band==='nir');this.glare.visible=sun;if(sun){const s=(this.band==='vis'?.95:.4)*(1+.08*Math.sin(g.time*3));this.glare.scale.set(s,s,1);}}
    for(const [m,top] of this.mirrorTops){const p=m.body.translation(),q=m.body.rotation();top.position.set(p.x,p.y,p.z);top.quaternion.set(q.x,q.y,q.z,q.w);}
    // The tower aims at the first point of the route; its beacon wears the band's colour.
    const want=BANDS[this.band].beam?this.aim.tx:heading(TX,PADS[this.current()?.pad??'store']);
    this.turret.rotation.y+=Math.atan2(Math.sin(want-this.turret.rotation.y),Math.cos(want-this.turret.rotation.y))*Math.min(1,dt*5);
    (this.beacon.material as T.MeshBasicMaterial).color.set(BANDS[this.band].color).multiplyScalar(1.6);
    // At the desk the hall map draws the route; the room's own beam would only cut across the view.
    this.drawBeam(r);this.beam.visible=!g.atBench;
    const t=g.time,bcast=!BANDS[this.band].beam&&!g.atBench;
    this.rings.forEach((ring,k)=>{const u=((t*.35+k/3)%1);ring.visible=bcast&&!this.game.atBench;ring.scale.setScalar(.3+u*5.5);(ring.material as T.MeshBasicMaterial).opacity=.55*(1-u);});
    // The pulse runs the route after SEND.
    if(this.pulseT>=0&&this.pulsePath.length>1){this.pulseT+=dt*9;let d=this.pulseT,i=1;
      for(;i<this.pulsePath.length;i++){const len=this.pulsePath[i-1].distanceTo(this.pulsePath[i]);if(d<=len)break;d-=len;}
      if(i>=this.pulsePath.length){const end=this.pulsePath[this.pulsePath.length-1];this.game.burst({x:end.x,y:end.y,z:end.z},this.pulseOk?'#8dffb0':'#ff7a7a',10,'spark');this.pulseT=-1;this.pulse.visible=false;}
      else{this.pulse.visible=!g.atBench;this.pulse.position.lerpVectors(this.pulsePath[i-1],this.pulsePath[i],d/this.pulsePath[i-1].distanceTo(this.pulsePath[i]));}}
    // Current pad ring pulses; the hatch slides; the smoke drifts.
    const job=this.current();PAD_ON.color.set('#3dff7a').multiplyScalar(1.1+.35*Math.sin(t*4));this.padRings.forEach((m,p)=>{m.material=job?.pad===p?PAD_ON:PAD_OFF;});
    this.hatchT+=((this.hatchOpen?1:0)-this.hatchT)*Math.min(1,dt*5);if(this.room)this.room.hatchDoor.position.y=1.25+this.hatchT*.62;
    // Puffs rise from the toaster slots, spread over the cloud (at beam height) and fade, then start
    // again. Near Pip they thin out, so the smoke never veils him.
    const me=g.player.translation();this.updateToaster(dt);
    this.room?.smoke.forEach(m=>{const k=m.userData.seed as number,u=(t*.12+k/12)%1,a=k*2.4;m.position.set(SMOKE.x-.3+Math.cos(a)*u*SMOKE_R0*.9,1.05+u*.85,SMOKE.z+1.45-u*1.3+Math.sin(a)*u*SMOKE_R0*.6);m.visible=this.smokeLeft>0;
      const s=.45+u*1.1,near=Math.min(1,Math.max(.35,(Math.hypot(m.position.x-me.x,m.position.z-me.z)-.5)/1.2));m.scale.set(s,s,1);
      (m.material as T.SpriteMaterial).opacity=.5*near*this.smokeLeft*Math.min(1,u/.15)*(u>.6?Math.max(0,(1-u)/.4):1);});
    this.shapeRibbon(dt);this.drawWave();this.drawLink(r);this.drawMap(r);
    this.updatePanel(r);
  }

  // ---------- panels ----------
  private say(text:string,tone:'ok'|'bad'|'info'='info'){
    if(!this.toast){this.toast=document.createElement('div');this.toast.className='station-toast';this.layer()?.append(this.toast);}
    this.toast.textContent=text;this.toast.dataset.tone=tone;this.toast.hidden=false;this.toastUntil=this.game.time+Math.max(4,text.length*.06);
  }
  private layer(){return document.querySelector<HTMLElement>('[data-layer="hud"]');}
  private updatePanel(r:Reading){
    if(this.toast&&!this.toast.hidden&&this.game.time>this.toastUntil&&this.game.running)this.toast.hidden=true;
    const j=this.current(),s=this.state();
    const shown=this.revealed()?this.tested:undefined;
    const key=JSON.stringify([this.active,this.jobIndex,s,shown?.key??'',r.route.spots,r.route.blocked?.mat,!!r.route.missed,r.route.via??'']);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel spectrum-panel';this.layer()?.append(this.panel);}
    this.panel.hidden=!j;if(!j)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const b=BANDS[this.band];
    // The path row: where it goes before a send; after it, each loss it met (smoke −25 · mesh −3).
    const NAME:Record<string,string>={distance:'distance',brick:'brick',wood:'wood',glass:'glass',hatch:'hatch',mesh:'mesh',smoke:'smoke',mirror:'mirror',sun:'sunlight'};
    const losses=shown?shown.terms.filter(t=>t.kind!=='sent'&&t.kind!=='distance').map(t=>`${NAME[t.kind]??t.kind} ${Math.round(t.db)}`.replace('-','−')):[];
    const path=r.route.blocked?`stopped: ${MATERIAL_NAMES[r.route.blocked.mat]}`:r.route.missed?'misses the pod':shown?(losses.length?losses.join(' · '):'clear'):'reaches the pod';
    this.panel.innerHTML=`<header><small>DELIVERY ${this.jobIndex+1}/${JOBS.length} · TO THE ${PAD_NAMES[j.pad].toUpperCase()}</small><h4>${j.title}</h4>${this.active?`<p>${j.ask}</p>`:""}</header>`+
      (this.active?`<ul class="build">${row('Pod',r.podOk?`on the ${PAD_NAMES[j.pad]} pad`:'not on the pad',r.podOk)}`+
        `${row('Band',`<i class="sp-chip" style="--c:${b.color}"></i>${b.name}`)}${row('Power',`${this.power} mW`)}`+
        (j.hatch||this.hatchOpen?row('Lab hatch',this.hatchOpen?'open':'shut'):'')+
        (j.hatch||r.route.spots.length?row('Mirrors in beam',String(r.route.spots.length)):'')+`${row('Path',path,!r.route.blocked&&!r.route.missed)}`+
        (shown?row('Link margin',Number.isFinite(shown.margin)?`${shown.margin.toFixed(1)} dB`:'no signal',shown.margin>=SPEC.reliable):row('Link margin','SEND to measure'))+`</ul>`+
        `<p class="profile">Simplified link model: ≥ ${SPEC.works} dB works, ≥ ${SPEC.reliable} dB is reliable. Game values, not a real link budget. Light links use wide LED beams, not lasers.</p>`:'');
  }
  prompt(atBench:boolean):Prompt|null{
    {const lead=this.game.leadPrompt(atBench);if(lead!==undefined)return lead;}
    const j=this.current();if(!j)return null;const g=this.game;
    if(!atBench){const p=g.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6;
      if(g.held&&g.held===this.pod){const pad=(Object.keys(PADS) as Pad[]).find(k=>dist(p,PADS[k])<2.2);return pad?{key:'E',text:'Set the pod on the pad'}:{key:'E',text:'Carry the pod'};}
      if(g.held&&this.mirrors.includes(g.held)){const s=SPOT_IDS.find(k=>dist(p,SPOTS[k])<2.1&&![...this.mirrorAt.values()].includes(k));return s?{key:'E',text:'Stand the mirror on the mark'}:{key:'E',text:'Carry the mirror'};}
      // A pod set on this delivery's pad, or a mirror stood on a mark, is placed: the pill doesn't offer
      // to pick it straight back up (E still does; a pod on the wrong pad still offers).
      const grab=g.held?undefined:g.nearest(),placed=(grab===this.pod&&this.podPad===j.pad)||(!!grab&&this.mirrorAt.has(grab));
      if(grab&&!placed&&grab===this.pod)return {key:'E',text:'Pick up the pod'};if(grab&&!placed&&this.mirrors.includes(grab))return {key:'E',text:'Pick up the mirror'};
      if(near)return {key:'E',text:'Work at the desk'};
      // (A null here would let the HUD's generic "Grab the …" pill through, so point at the next step.)
      if(placed)return {key:'Walk',text:'To the dispatch desk'};
      return null;}
    if(this.hold)return null;
    const r=this.reading(),beam=BANDS[this.band].beam;
    if(this.drag)return {key:'Drag',text:this.drag==='tx'?'Aim the tower':'Turn the mirror'};
    if(this.mapHover&&beam)return this.mapHover==='turn'?{key:'Drag',text:'Turn the mirror'}:this.mapHover==='mirror'?{key:'Click',text:'Aim the tower at the mirror'}:{key:'Drag',text:'Aim the beam'};
    if(!r.podOk)return {key:'E',text:'Fetch the pod'};
    if(r.route.blocked){
      // The beam is on the shut hatch: the lab hatch lever is the control that matters.
      if(beam&&r.route.blocked.wall==='lab-hatch'&&!this.hatchOpen)return {key:'H',text:'Lab hatch'};
      return beam&&this.mirrorAt.size?{key:'Drag',text:'Aim'}:{key:'1–5',text:'Another band'};}
    if(r.route.missed)return beam?{key:'Drag',text:'Aim'}:{key:'1–5',text:'Another band'};
    return {key:'Enter',text:'Send'};
  }
  complete(){return this.delivered.length>=JOBS.length;}
  /** The win shot frames Pip with the receiver pod on the last delivery pad (R5-077). */
  winFocus(){const p=PADS[JOBS[JOBS.length-1].pad];return new T.Vector3(p.x,1,p.z);}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  /** The toaster rides its body; once it is off the counter the smoke clears over a second or two and
   *  stops counting as a loss on every later send (truthful: no toaster, no smoke). */
  private updateToaster(dt:number){const t=this.room?.toaster;if(!t)return;const p=t.body.translation(),q=t.body.rotation();t.mesh.position.set(p.x,p.y,p.z);t.mesh.quaternion.set(q.x,q.y,q.z,q.w);
    if(!this.toasterDown&&(p.y<.8||Math.hypot(p.x-t.home.x,p.z-t.home.z)>1.4)){this.toasterDown=true;SMOKE.r=0;this.beamKey='';const g=this.game;
      g.audio.clatter();g.burst({x:p.x,y:.4,z:p.z},'#ffcf52',22,'confetti');g.cheerNear(p,6);this.say('The toaster is off the counter: the smoke clears.','ok');this.redraw();}
    if(this.toasterDown)this.smokeLeft=Math.max(0,this.smokeLeft-dt*.6);}
  snapshot(){const r=this.reading();return {toasterDown:this.toasterDown,smoke:SMOKE.r,job:this.jobIndex,delivered:this.delivered.map(d=>({job:d.job,tier:d.verdict.tier,margin:d.verdict.margin})),band:this.band,detector:this.detector,power:this.power,hatchOpen:this.hatchOpen,
    podPad:this.podPad,mirrors:[...this.mirrorAt.values()],mistakes:this.mistakes,spent:this.spent,
    aim:{tx:+this.aim.tx.toFixed(4),mirrors:{...this.aim.mirrors}},doors:this.doorsOpen(),revealed:this.revealed(),holding:!!this.hold,
    map:this.active?Object.fromEntries([...SPOT_IDS.map(s=>[s,this.mapScreen(SPOTS[s])]),...(Object.keys(PADS) as Pad[]).map(p=>[p,this.mapScreen(PADS[p])])]):undefined,
    reading:{margin:Number.isFinite(r.margin)?+r.margin.toFixed(2):null,blocked:r.route.blocked?.mat??null,missed:!!r.route.missed,spots:r.route.spots,detectorOk:r.detectorOk,podOk:r.podOk}};}
}
