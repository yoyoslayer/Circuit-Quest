// Spectrum Delivery dispatch desk. The job is room-scale: Pip carries the receiver pod to each
// destination and stands mirror boards on the floor marks; the transmitter tower beside the desk
// aims itself and its beam (or broadcast) is drawn through the hall, stopping where an obstacle
// stops it. At the desk: the band keys with the wave ribbon (c = f λ), a live map of the hall, the
// detector heads for the pod, the power buttons, the lab shutter's hatch lever, the link meter and
// SEND. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {prefabs} from '../../props/prefabs';
import {dressSpectrum,CREAM,PAPER,COPPER,type SpectrumRoom} from './room';
import {toon,box,rbox,cyl,sphere,part,group,canvasTex,INK,DMETAL} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import {JOBS,BANDS,BAND_IDS,DETECTORS,DETECTOR_IDS,POWERS,SPEC,PADS,PAD_NAMES,SPOTS,SPOT_IDS,TX,SMOKE,STORE,LAB,QUIET,HATCH,MATERIAL_NAMES,POD_HOME,
  walls,read,judge,cost,leanest,lambdaText,freqText,dist,type Band,type Detector,type Power,type Pad,type Spot,type Setup,type Verdict,type Job,type Reading,type P} from './logic';
import './spectrum.css';
import {cheer,walkHint} from '../shared';

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
export class SpectrumDesk implements Station {
  readonly view={distance:6.1,pitch:1.02,lookY:.42};
  readonly limits={time:540,damage:1,cost:0};
  readonly stand={x:-3.5,z:3.55};readonly table=new T.Vector3(-3.5,1,2.6);readonly facing=Math.PI;
  // Desk state. The first try is the obvious one: visible light.
  band:Band='vis';detector:Detector='visdiode';power:Power=1;hatchOpen=false;
  jobIndex=0;delivered:{job:string;verdict:Verdict}[]=[];mistakes=0;spent=0;active=false;
  /** Where the pod is parked (null while carried or loose); which mark each mirror board stands on. */
  podPad:Pad|null=null;mirrorAt=new Map<Prop,Spot>();
  private room?:SpectrumRoom;private pod?:Prop;private mirrors:Prop[]=[];private ready=false;
  private root=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;
  private podTop=new T.Group();private podHeads=new Map<Detector,T.Object3D>();private podLamp!:T.Mesh;private mirrorTops=new Map<Prop,T.Object3D>();
  private turret=new T.Group();private beacon!:T.Mesh;private beam=new T.Group();private rings:T.Mesh[]=[];private beamKey='';
  private pulse!:T.Mesh;private pulseT=-1;private pulsePath:T.Vector3[]=[];private pulseOk=false;
  private padRings=new Map<Pad,T.Mesh>();private hatchT=0;
  private map=new Live(1100,800);private link=new Live(640,360);private wave=new Live(640,360);
  private ribbon!:T.Mesh;private ribbonCycles=BANDS.vis.cycles;private ribbonBase!:Float32Array;
  private bandKeys=new Map<Band,T.Object3D>();private deskHeads=new Map<Detector,T.Object3D>();private powerKeys=new Map<Power,T.Object3D>();private lever!:T.Object3D;private sendCap!:T.Mesh;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';private lastMessage='';
  readonly job:StationJob;
  constructor(private game:Game){
    this.limits.cost=Math.ceil(JOBS.reduce((n,j)=>n+(leanest(j)?.cost??0),0)*1.25);
    const d=()=>this.delivered.length;
    this.job={goal:'Deliver three messages across the research hall',
      steps:[
        {text:'Carry the receiver pod into the brick storeroom',done:()=>d()>0||this.podPad==='store',at:()=>this.pod&&this.game.held===this.pod?PADS.store:this.podAt()},
        {text:'Sit at the dispatch desk (E)',done:()=>this.active||d()>0,at:()=>this.stand},
        {text:`Delivery 1: ${JOBS[0].title}`,done:()=>d()>0,at:()=>this.stand},
        {text:'Move the pod into the glass lab, and stand a mirror on a floor mark',done:()=>d()>1||(d()>0&&this.podPad==='lab'&&this.mirrorAt.size>0),
          at:()=>this.podPad!=='lab'?(this.pod&&this.game.held===this.pod?PADS.lab:this.podAt()):this.freeMirror()??this.stand},
        {text:`Delivery 2: ${JOBS[1].title}`,done:()=>d()>1,at:()=>this.stand},
        {text:'Move the pod into the quiet room',done:()=>d()>2||(d()>1&&this.podPad==='quiet'),at:()=>this.pod&&this.game.held===this.pod?PADS.quiet:this.podAt()},
        {text:`Delivery 3: ${JOBS[2].title}`,done:()=>d()>2,at:()=>this.stand}],
      bonuses:[
        {text:'Every delivery reliable (margin ≥ 10 dB)',ok:()=>this.delivered.every(x=>x.verdict.tier>=2)},
        {text:'Elegant: least power, fewest mirrors',ok:()=>this.delivered.every(x=>x.verdict.tier===3)},
        {text:'No failed send',ok:()=>this.mistakes===0}]};
    game.root.add(this.root);game.root.add(this.beam);
    this.buildDesk();this.buildHall();this.redraw();
  }
  dress(kit:RoomKit){this.room=dressSpectrum(this.game,kit);return {lightUp:this.room.lightUp};}
  current():Job|undefined{return JOBS[this.jobIndex];}
  state():Setup{return {band:this.band,detector:this.detector,power:this.power,hatchOpen:this.hatchOpen,mirrors:[...new Set(this.mirrorAt.values())],pod:this.podPad};}
  reading():Reading{return read(this.current()??JOBS[JOBS.length-1],this.state());}
  private podAt():P{const p=this.pod?.body.translation();return p?{x:p.x,z:p.z}:POD_HOME;}
  private freeMirror():P|undefined{const m=this.mirrors.find(p=>!this.mirrorAt.has(p));const q=m?.body.translation();return q&&{x:q.x,z:q.z};}

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
    const mapMesh=part(lect,new T.PlaneGeometry(1.34,.975),flatMat(this.map.tex),0,.047,0,false);mapMesh.rotation.x=-Math.PI/2;mapMesh.userData.noAO=true;
    // ---- Right: detector heads (back), power keys and SEND (middle), the hatch lever (front).
    part(top,rbox(1.26,.02,1.12,.06),toon('#3a3d55'),1.53,.045,0);
    DETECTOR_IDS.forEach((d,k)=>{const x=1.05+k*.24,peg=group(top,x,.055,-.2);part(peg,cyl(.08,.09,.03,16),toon('#fffaf0'),0,.015,0);const h=headMesh(d,.9);h.position.y=.03;peg.add(h);
      this.deskHeads.set(d,peg);this.click(peg,'detector',d);});
    const HEAD_TAGS:Record<Detector,string>={dipole:'DIPOLE',patch:'PATCH',thermopile:'THERMO',nirdiode:'NEAR IR',visdiode:'GREEN'};
    DETECTOR_IDS.forEach((d,k)=>sign(top,HEAD_TAGS[d],1.05+k*.24,.082,-.01,.235,-1.1,CREAM,INK,.1));
    sign(top,'POD DETECTOR',1.53,.057,-.4,.44,-Math.PI/2,'#ffd66b',INK,.07);
    POWERS.forEach((p,k)=>{const x=1.05+k*.26,key=group(top,x,.055,.22);part(key,rbox(.24,.05,.16,.03),toon('#fffaf0'),0,.025,0);sign(key,`${p} mW`,0,.052,0,.22,-Math.PI/2,'#fffaf0',INK,.11);
      this.powerKeys.set(p as Power,key);this.click(key,'power',p);});
    sign(top,'POWER  (P)',1.31,.082,.37,.4,-1.1,CREAM,INK,.1);
    // The hatch switch: a low rocker (tipped back = open), so it doesn't hide the power keys.
    const lever=group(top,1.05,.055,.47);part(lever,rbox(.22,.05,.16,.03),toon(INK),0,.025,0);this.lever=group(lever,0,.06,0);part(this.lever,rbox(.16,.05,.1,.02),toon('#ffc629'),0,.02,0);
    this.click(lever,'hatch');sign(top,'LAB HATCH',1.4,.082,.5,.4,-1.1,'#ffc629',INK,.1);
    const send=group(top,1.95,.055,.3);part(send,cyl(.14,.16,.06,24),toon(INK),0,.03,0);this.sendCap=part(send,cyl(.12,.12,.06,24),toon('#3fae6a'),0,.08,0);
    this.click(send,'send');sign(top,'SEND',1.95,.082,.54,.3,-1.1,'#3fae6a','#fffaf0',.1);
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}

  // ---------- the hall: tower, pads, mirror marks, beam ----------
  private buildHall(){
    const g=this.game,r=g.root;
    const tower=group(r,TX.x,0,TX.z);part(tower,cyl(.4,.46,.1,24),toon(INK),0,.05,0);part(tower,cyl(.07,.09,1.1,14),toon(PAPER),0,.65,0);
    BAND_IDS.forEach((b,i)=>part(tower,cyl(.075,.075,.04,14),toon(BANDS[b].color),0,.35+i*.07,0));
    tower.add(this.turret);this.turret.position.y=BEAM_Y;part(this.turret,rbox(.3,.22,.34,.06),toon(PAPER),0,0,0);part(this.turret,cyl(.09,.1,.14,18,'z'),toon(INK),0,0,.2);
    part(this.turret,cyl(.075,.075,.02,18,'z'),glossyToon('#dff3ff',{spec:.9,size:.95}),0,0,.275);for(const s of [-1,1])part(this.turret,cyl(.01,.01,.36,6),toon('#dfe3ea'),s*.11,.25,-.08);
    this.beacon=part(tower,sphere(.07,12,10),hot(BANDS.vis.color,1.6),0,1.52,0,false);
    this.solid(.6,2,.6,TX.x,1,TX.z);
    // Destination pads: a ring that glows on the current delivery's pad.
    (Object.keys(PADS) as Pad[]).forEach(p=>{const at=PADS[p],pad=group(g.decorRoot,at.x,0,at.z);part(pad,cyl(.72,.76,.04,32),toon('#fffaf0'),0,.02,0);
      const ring=part(r,new T.TorusGeometry(.66,.045,8,48),toon('#c9c2b2'),at.x,.05,at.z,false);ring.rotation.x=Math.PI/2;this.padRings.set(p,ring);
      const tag=part(r,new T.PlaneGeometry(1.2,.3),flatMat(label(`${PAD_NAMES[p].toUpperCase()} PAD`,'#fffaf0',INK,512,128)),at.x,.03,at.z+.95,false);tag.rotation.x=-Math.PI/2;tag.userData.noAO=true;});
    // Mirror marks: dashed rings with their letter.
    for(const s of SPOT_IDS){const at=SPOTS[s],m=part(r,new T.PlaneGeometry(1.5,1.5),flatMat(canvasTex(256,256,c=>{c.setLineDash([18,12]);c.lineWidth=10;c.strokeStyle='#8b7be8';c.beginPath();c.arc(128,128,110,0,7);c.stroke();c.setLineDash([]);
      c.fillStyle='rgba(139,123,232,.16)';c.beginPath();c.arc(128,128,104,0,7);c.fill();c.fillStyle='#6a5bd0';c.font=FONT(72);c.textAlign='center';c.textBaseline='middle';c.fillText(s,128,120);c.font=FONT(26);c.fillText('MIRROR',128,178);})),at.x,.014,at.z,false);
      m.rotation.x=-Math.PI/2;m.userData.noAO=true;}
    // Broadcast rings for radio and microwave, and the pulse that runs the route on SEND.
    for(let k=0;k<3;k++){const ring=new T.Mesh(new T.TorusGeometry(1,.02,6,64),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.5,depthWrite:false}));ring.material.userData.outlineParameters={visible:false};
      ring.rotation.x=Math.PI/2;ring.position.set(TX.x,BEAM_Y,TX.z);ring.userData.noAO=true;r.add(ring);this.rings.push(ring);}
    this.pulse=part(r,sphere(.14,16,12),hot('#ffffff',2),0,BEAM_Y,0,false);this.pulse.visible=false;this.pulse.userData.noAO=true;
  }
  /** Props exist only after the room is dressed: find the pod and the mirrors on the first update. */
  private setup(){
    this.ready=true;const g=this.game;this.pod=g.props.find(p=>p.spec.id==='pod');this.mirrors=g.props.filter(p=>p.spec.id?.startsWith('mirror'));
    // The pod: a mast with the fitted detector head and a status lamp, riding on the case.
    const t=this.podTop;g.root.add(t);part(t,cyl(.03,.03,.36,8),toon(DMETAL),.2,.48,0);part(t,rbox(.36,.05,.3,.03),toon(INK),.2,.32,0);
    for(const d of DETECTOR_IDS){const h=headMesh(d,1.5);h.position.set(.2,.64,0);t.add(h);this.podHeads.set(d,h);}
    this.podLamp=part(t,sphere(.06,12,10),toon('#6b7385'),-.25,.36,.1,false);
    const tag=part(t,new T.PlaneGeometry(.5,.16),flatMat(label('RX POD','#3fae6a','#fffaf0',256,82)),-.12,.02,.331,false);tag.userData.noAO=true;
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
      this.mirrorAt.set(p,s);this.park(p,SPOTS[s],this.aimYaw(s));this.game.audio.plug();this.game.burst({x:SPOTS[s].x,y:.2,z:SPOTS[s].z},'#c9c0ff',1,'ring');this.redraw();}
  }
  /** Mirror yaw: its face normal bisects the incoming and outgoing beam (or faces the tower when idle). */
  private aimYaw(s:Spot,r=this.reading().route){
    const i=r.spots.indexOf(s),at=SPOTS[s];
    if(i<0)return Math.atan2(TX.x-at.x,TX.z-at.z);
    const prev=r.path[i],next=r.path[i+2],a=new T.Vector2(prev.x-at.x,prev.z-at.z).normalize(),b=new T.Vector2(next.x-at.x,next.z-at.z).normalize(),n=a.add(b);
    return Math.atan2(n.x,n.y);
  }

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const j=this.current(),a=this.game.audio;if(!j)return false;
    switch(name){
      case 'band':{const b=arg as Band;if(!BANDS[b])return false;this.band=b;a.tone(300+BAND_IDS.indexOf(b)*140,.08,.04,'triangle');
        this.say(`${BANDS[b].name}: λ = ${lambdaText(b)}, f = ${freqText(b)}. Every band obeys c = f × λ.`);break;}
      case 'detector':{const d=arg as Detector;if(!DETECTORS[d])return false;this.detector=d;a.pop();a.tone(900,.05,.03);break;}
      case 'power':{const p=Number(arg) as Power;if(!POWERS.includes(p))return false;this.power=p;a.tone(420+POWERS.indexOf(p)*180,.07,.04,'triangle');break;}
      case 'hatch':{this.hatchOpen=typeof arg==='boolean'?arg:!this.hatchOpen;a.noise(.12,.05,900,'lowpass');a.tone(this.hatchOpen?520:300,.1,.04,'triangle');
        this.say(this.hatchOpen?'Hatch open: a 30 cm hole in the lab\'s metal shutter.':'Hatch shut: the shutter is solid metal again.');break;}
      case 'send':{const v=judge(j,this.state()),r=this.reading();
        if(!r.podOk){this.say(`The receiver pod isn't on the ${PAD_NAMES[j.pad]} pad yet. Step back (E) and carry it there.`);a.voice('hm',1.4);return false;}
        const c=cost(this.state(),r.route);this.spent+=c;this.firePulse(r,v.tier>0);
        if(v.tier===0){this.mistakes++;this.say(`Not delivered. ${v.problems[0]}`,'bad');a.tone(160,.25,.06,'square');a.voice('groan',1);this.game.alarm(PADS[j.pad],3);return true;}
        this.delivered.push({job:j.id,verdict:v});this.lastMessage=j.message;
        this.say(`“${j.message}” · ${['','Received','Reliable','Elegant'][v.tier]} (${v.margin} dB)${v.notes[0]?` · ${v.notes[0]}`:''}`,'ok');
        a.cheer();a.bell(1319,.5,.05);const at=PADS[j.pad];cheer(this.game,this,'#ffd66b',{x:at.x,y:1.4,z:at.z});if(!this.game.atBench)this.game.burst({x:at.x,y:1.5,z:at.z},'#fff3c8',6,'star');
        this.jobIndex++;this.redraw();return true;}
      default:return false;
    }
    this.redraw();return true;
  }
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
    this.deskHeads.forEach((k,d)=>{k.position.y=d===this.detector?.1:.055;(k.children[0] as T.Mesh).material=toon(d===this.detector?'#ffd66b':'#fffaf0');});
    this.powerKeys.forEach((k,p)=>{k.position.y=p===this.power?.07:.055;(k.children[0] as T.Mesh).material=toon(p===this.power?'#ffd66b':'#fffaf0');});
    this.lever.rotation.x=this.hatchOpen?-.35:.35;
    this.sendCap.material=toon(r.podOk?'#3fae6a':'#9aa0ad');
    (this.ribbon.material as T.MeshBasicMaterial).color.set(BANDS[this.band].color);
    this.podHeads.forEach((h,d)=>h.visible=d===this.detector);
    if(this.ready){for(const [m,s] of this.mirrorAt)m.body.setRotation(yawQuat(this.aimYaw(s,r.route)),true);}
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
      else{const n=Math.floor(len/.45);for(let k=0;k<n;k++){const d=new T.Mesh(new T.CylinderGeometry(.03,.03,.22,8),core);d.position.lerpVectors(a,c,(k+.5)/n);d.quaternion.copy(q);d.userData.noAO=true;this.beam.add(d);}}}
    if(blocked){const end=pts[pts.length-1],prev=pts[pts.length-2],dir=new T.Vector3(end.x-prev.x,0,end.z-prev.z).normalize();
      const stop=new T.Mesh(new T.CircleGeometry(.24,28),new T.MeshBasicMaterial({color:new T.Color('#ff5a5a').multiplyScalar(1.4),transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}));
      (stop.material as T.Material).userData.outlineParameters={visible:false};stop.position.set(end.x-dir.x*.2,BEAM_Y,end.z-dir.z*.2);stop.lookAt(stop.position.clone().add(dir));stop.userData.noAO=true;this.beam.add(stop);}
    this.rings.forEach(g=>{(g.material as T.MeshBasicMaterial).color.set(b.color);});
  }
  /** The hall map on the desk: walls by material, the smoke, marks, pads, pod and the beam. */
  private drawMap(r:Reading){
    const pod=this.podAt(),key=JSON.stringify([this.band,this.hatchOpen,[...this.mirrorAt.values()],this.podPad,Math.round(pod.x*4),Math.round(pod.z*4),this.jobIndex,this.drawnPath(r),r.margin>=SPEC.works]);
    this.map.draw(key,(c,w,h)=>{
      const L=this.game.level,sx=(w-60)/L.width,X=(x:number)=>30+(x+L.width/2)*sx,Z=(z:number)=>28+(z+L.depth/2)*sx;
      c.fillStyle=INK;c.beginPath();c.roundRect(0,0,w,h,26);c.fill();c.fillStyle='#fbf6ec';c.beginPath();c.roundRect(12,12,w-24,h-24,18);c.fill();
      c.strokeStyle='rgba(43,45,66,.07)';c.lineWidth=2;for(let x=-11;x<=11;x+=1){c.beginPath();c.moveTo(X(x),Z(-8));c.lineTo(X(x),Z(8));c.stroke();}for(let z=-8;z<=8;z+=1){c.beginPath();c.moveTo(X(-11),Z(z));c.lineTo(X(11),Z(z));c.stroke();}
      const zone=(o:{x0:number;x1:number;z0:number;z1:number},col:string,name:string)=>{c.fillStyle=col;c.fillRect(X(o.x0),Z(o.z0),(o.x1-o.x0)*sx,(o.z1-o.z0)*sx);c.fillStyle='rgba(43,45,66,.6)';c.font=FONT(44);c.textAlign='center';c.fillText(name,X((o.x0+o.x1)/2),Z(o.z0)+54);};
      zone(STORE,'#f2dcc0','STOREROOM');zone(LAB,'#dcecf8','GLASS LAB');zone({x0:QUIET.x0,x1:QUIET.x1,z0:QUIET.z0,z1:QUIET.z1},'#e6defa','');c.fillStyle='rgba(43,45,66,.6)';c.fillText('QUIET',X(8.25),Z(QUIET.z1)-22);
      // Smoke and the tea counter.
      const sg=c.createRadialGradient(X(SMOKE.x),Z(SMOKE.z),4,X(SMOKE.x),Z(SMOKE.z),SMOKE.r*sx);sg.addColorStop(0,'rgba(120,125,140,.55)');sg.addColorStop(1,'rgba(120,125,140,.08)');c.fillStyle=sg;c.beginPath();c.arc(X(SMOKE.x),Z(SMOKE.z),SMOKE.r*sx,0,7);c.fill();
      c.fillStyle='#f4c9c3';c.fillRect(X(1.3),Z(4.54),2.2*sx,.62*sx);c.fillStyle='rgba(43,45,66,.7)';c.font=FONT(36);c.fillText('SMOKE',X(SMOKE.x),Z(SMOKE.z)+12);
      // Walls, coloured by what they are made of.
      const style:{[k:string]:[string,number,number[]]}={brick:['#c8674a',22,[]],wood:['#9c6d42',18,[]],glass:['#7fc3ea',12,[]],metal:['#5f6c84',20,[]],hatch:['#ffc629',14,[]],mesh:[COPPER,11,[14,9]]};
      for(const wl of walls(this.hatchOpen)){const m=wl.mat[0],[col,lw,dash]=style[m];c.setLineDash(dash);c.strokeStyle=col;c.lineWidth=lw;c.lineCap='butt';c.beginPath();c.moveTo(X(wl.a.x),Z(wl.a.z));c.lineTo(X(wl.b.x),Z(wl.b.z));c.stroke();
        if(wl.mat.includes('glass')){c.strokeStyle='#7fc3ea';c.lineWidth=7;c.setLineDash([]);c.beginPath();c.moveTo(X(wl.a.x),Z(wl.a.z)-15);c.lineTo(X(wl.b.x),Z(wl.b.z)-15);c.stroke();}}
      c.setLineDash([]);if(this.hatchOpen){c.strokeStyle='#ffc629';c.lineWidth=6;c.strokeRect(X(HATCH.x0)-3,Z(HATCH.z)-14,(HATCH.x1-HATCH.x0)*sx+6,28);}
      // Desk, tower, marks, mirrors.
      c.fillStyle='#e7c89a';c.fillRect(X(this.table.x-2.2),Z(this.table.z-.65),4.4*sx,1.3*sx);c.fillStyle='rgba(43,45,66,.7)';c.font=FONT(34);c.fillText('DESK',X(this.table.x),Z(this.table.z)+12);
      const taken=new Map([...this.mirrorAt.entries()].map(([m,s])=>[s,m]));
      for(const s of SPOT_IDS){const p=SPOTS[s];c.setLineDash([8,6]);c.strokeStyle='#8b7be8';c.lineWidth=5;c.beginPath();c.arc(X(p.x),Z(p.z),24,0,7);c.stroke();c.setLineDash([]);
        const m=taken.get(s);if(m){const yaw=this.aimYaw(s,r.route),dx=Math.cos(yaw)*.8*sx,dz=-Math.sin(yaw)*.8*sx;c.strokeStyle='#5b6d8a';c.lineWidth=14;c.beginPath();c.moveTo(X(p.x)-dx,Z(p.z)-dz);c.lineTo(X(p.x)+dx,Z(p.z)+dz);c.stroke();
          c.strokeStyle='#dff3ff';c.lineWidth=6;c.beginPath();c.moveTo(X(p.x)-dx,Z(p.z)-dz);c.lineTo(X(p.x)+dx,Z(p.z)+dz);c.stroke();}
        c.fillStyle='#6a5bd0';c.font=FONT(36);c.fillText(s,X(p.x)+34,Z(p.z)-20);}
      // Pads: the current one glows.
      const job=this.current();
      for(const k of Object.keys(PADS) as Pad[]){const p=PADS[k],now=job?.pad===k;c.fillStyle=now?'rgba(63,174,106,.25)':'rgba(43,45,66,.06)';c.beginPath();c.arc(X(p.x),Z(p.z),.75*sx,0,7);c.fill();
        c.strokeStyle=now?'#3fae6a':'#b8b2a4';c.lineWidth=now?6:3;c.beginPath();c.arc(X(p.x),Z(p.z),.75*sx,0,7);c.stroke();}
      // The beam (or broadcast), as far as it gets.
      const b=BANDS[this.band],pts=this.drawnPath(r);
      if(!b.beam){c.strokeStyle=b.color;c.globalAlpha=.25;c.lineWidth=4;for(let k=1;k<=4;k++){c.beginPath();c.arc(X(TX.x),Z(TX.z),k*2.2*sx,0,7);c.stroke();}c.globalAlpha=1;}
      c.strokeStyle=b.color;c.lineWidth=16;c.lineCap='round';c.lineJoin='round';c.setLineDash(b.beam?[]:[16,12]);c.beginPath();pts.forEach((p,i)=>i?c.lineTo(X(p.x),Z(p.z)):c.moveTo(X(p.x),Z(p.z)));c.stroke();c.setLineDash([]);
      if(r.route.blocked){const e=pts[pts.length-1];c.strokeStyle='#e5484d';c.lineWidth=12;for(const s of [-1,1]){c.beginPath();c.moveTo(X(e.x)-22,Z(e.z)-22*s);c.lineTo(X(e.x)+22,Z(e.z)+22*s);c.stroke();}}
      // Tower and pod.
      c.fillStyle=INK;c.beginPath();c.arc(X(TX.x),Z(TX.z),22,0,7);c.fill();c.fillStyle=b.color;c.beginPath();c.arc(X(TX.x),Z(TX.z),13,0,7);c.fill();
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
  private drawLink(r:Reading){
    const job=this.current(),m=r.margin,key=JSON.stringify([Number.isFinite(m)?Math.round(m*10):String(m),r.detectorOk,r.podOk,!!r.route.blocked,this.lastMessage,this.jobIndex]);
    this.link.draw(key,(c,w,h)=>{c.fillStyle='#1d2238';c.fillRect(0,0,w,h);
      const col=m>=SPEC.reliable?'#8dffb0':m>=SPEC.works?'#ffd66b':'#ff7a8a';
      c.fillStyle='#fffaf0';c.font=FONT(40);c.textAlign='left';c.fillText('LINK',30,58);
      c.textAlign='right';c.font=FONT(58);c.fillStyle=col;c.fillText(Number.isFinite(m)?`${m.toFixed(1)} dB`:'no signal',w-30,62);
      const lo=-20,hi=30,bx=30,bw=w-60,by=96,bh=62,xOf=(v:number)=>bx+(Math.max(lo,Math.min(hi,v))-lo)/(hi-lo)*bw;
      c.fillStyle='#2e3656';c.fillRect(bx,by,bw,bh);if(Number.isFinite(m)){c.fillStyle=col;c.fillRect(bx,by,xOf(m)-bx,bh);}
      for(const [v,t] of [[0,'works'],[10,'reliable']] as const){c.fillStyle='#fffaf0';c.fillRect(xOf(v)-3,by-10,6,bh+20);c.font=FONT(28,600);c.textAlign='center';c.fillText(t,xOf(v),by+bh+40);}
      const status=!r.podOk?['POD NOT ON THE PAD','#ffd66b']:!r.detectorOk?['WRONG DETECTOR','#ff7a8a']:r.route.blocked?[`BLOCKED: ${MATERIAL_NAMES[r.route.blocked.mat].toUpperCase()}`,'#ff7a8a']:m<SPEC.works?['TOO WEAK','#ff7a8a']:m<SPEC.reliable?['WEAK','#ffd66b']:['CLEAR LINK','#8dffb0'];
      c.textAlign='left';let size=42;c.font=FONT(size);while(size>20&&c.measureText(status[0]).width>w-60){size--;c.font=FONT(size);}
      c.fillStyle=status[1];c.fillText(status[0],30,h-66);c.fillStyle='rgba(255,250,240,.7)';c.font=FONT(28,600);c.fillText(this.lastMessage?`got “${this.lastMessage}”`:job?`to the ${PAD_NAMES[job.pad]}`:'',30,h-22);});
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
    const hits=e.ray.intersectObjects(this.clickables.map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.12);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found)this.act(found.act,found.arg);
  }
  key(code:string){
    const next=<X>(list:readonly X[],v:X)=>list[(list.indexOf(v)+1)%list.length];
    const map:Record<string,[string,unknown?]>={Digit1:['band','radio'],Digit2:['band','micro'],Digit3:['band','thermal'],Digit4:['band','nir'],Digit5:['band','vis'],
      KeyF:['detector',next(DETECTOR_IDS,this.detector)],KeyP:['power',next(POWERS,this.power)],KeyH:['hatch'],Enter:['send']};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';}
  update(dt:number){
    if(!this.ready){this.setup();this.redraw();}
    const g=this.game;
    // Picking a parked pod or mirror up frees it again.
    if(g.held&&g.held===this.pod&&this.podPad){this.unpark(this.pod);this.podPad=null;this.redraw();}
    if(g.held&&this.mirrorAt.has(g.held)){this.unpark(g.held);this.mirrorAt.delete(g.held);this.redraw();}
    const r=this.reading();
    // The pod's mast rides on the case; its lamp shows whether the link is up.
    if(this.pod){const p=this.pod.body.translation(),q=this.pod.body.rotation();this.podTop.position.set(p.x,p.y,p.z);this.podTop.quaternion.set(q.x,q.y,q.z,q.w);
      this.podLamp.material=r.podOk&&r.margin>=SPEC.works?LAMP_OK:r.podOk?LAMP_BAD:LAMP_OFF;}
    for(const [m,top] of this.mirrorTops){const p=m.body.translation(),q=m.body.rotation();top.position.set(p.x,p.y,p.z);top.quaternion.set(q.x,q.y,q.z,q.w);}
    // The tower aims at the first point of the route; its beacon wears the band's colour.
    const first=r.route.path[1]??PADS[this.current()?.pad??'store'],want=Math.atan2(first.x-TX.x,first.z-TX.z);
    this.turret.rotation.y+=Math.atan2(Math.sin(want-this.turret.rotation.y),Math.cos(want-this.turret.rotation.y))*Math.min(1,dt*5);
    (this.beacon.material as T.MeshBasicMaterial).color.set(BANDS[this.band].color).multiplyScalar(1.6);
    // At the desk the hall map draws the route; the room's own beam would only cut across the view.
    this.drawBeam(r);this.beam.visible=!g.atBench;
    const t=g.time,bcast=!BANDS[this.band].beam&&!g.atBench;
    this.rings.forEach((ring,k)=>{const u=((t*.35+k/3)%1);ring.visible=bcast;ring.scale.setScalar(.3+u*5.5);(ring.material as T.MeshBasicMaterial).opacity=.55*(1-u);});
    // The pulse runs the route after SEND.
    if(this.pulseT>=0&&this.pulsePath.length>1){this.pulseT+=dt*9;let d=this.pulseT,i=1;
      for(;i<this.pulsePath.length;i++){const len=this.pulsePath[i-1].distanceTo(this.pulsePath[i]);if(d<=len)break;d-=len;}
      if(i>=this.pulsePath.length){const end=this.pulsePath[this.pulsePath.length-1];this.game.burst({x:end.x,y:end.y,z:end.z},this.pulseOk?'#8dffb0':'#ff7a7a',10,'spark');this.pulseT=-1;this.pulse.visible=false;}
      else{this.pulse.visible=!g.atBench;this.pulse.position.lerpVectors(this.pulsePath[i-1],this.pulsePath[i],d/this.pulsePath[i-1].distanceTo(this.pulsePath[i]));}}
    // Current pad ring pulses; the hatch slides; the smoke drifts.
    const job=this.current();PAD_ON.color.set('#3dff7a').multiplyScalar(1.1+.35*Math.sin(t*4));this.padRings.forEach((m,p)=>{m.material=job?.pad===p?PAD_ON:PAD_OFF;});
    this.hatchT+=((this.hatchOpen?1:0)-this.hatchT)*Math.min(1,dt*5);if(this.room)this.room.hatchDoor.position.y=1.25+this.hatchT*.62;
    // Puffs rise from the toaster, spread into the cloud and fade, then start again.
    this.room?.smoke.forEach(m=>{const k=m.userData.seed as number,u=(t*.12+k/14)%1,a=k*2.4;m.position.set(SMOKE.x-.3+Math.cos(a)*u*SMOKE.r*.9,1.1+u*1.1,SMOKE.z+1.2-u*1.3+Math.sin(a)*u*SMOKE.r*.6);
      const s=.8+u*1.9;m.scale.set(s,s,1);(m.material as T.SpriteMaterial).opacity=.85*Math.sin(Math.PI*Math.min(1,u*1.25));});
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
    const key=JSON.stringify([this.active,this.jobIndex,s,Number.isFinite(r.margin)?r.margin.toFixed(1):'x',r.route.spots,r.route.blocked?.mat]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel spectrum-panel';this.layer()?.append(this.panel);}
    this.panel.hidden=!j;if(!j)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const m=r.margin,b=BANDS[this.band];
    this.panel.innerHTML=`<header><small>DELIVERY ${this.jobIndex+1}/${JOBS.length} · TO THE ${PAD_NAMES[j.pad].toUpperCase()}</small><h4>${j.title}</h4><p>${j.ask}</p></header>`+
      (this.active?`<ul class="build">${row('Pod',r.podOk?`on the ${PAD_NAMES[j.pad]} pad`:'not on the pad',r.podOk)}`+
        `${row('Band',`<i class="sp-chip" style="--c:${b.color}"></i>${b.name}`)}${row('Detector',DETECTORS[this.detector].label,r.detectorOk)}${row('Power',`${this.power} mW`)}`+
        (j.hatch||this.hatchOpen?row('Lab hatch',this.hatchOpen?'open':'shut'):'')+
        (j.hatch||r.route.spots.length?row('Mirrors in beam',String(r.route.spots.length)):'')+`${row('Path',r.route.blocked?`blocked: ${MATERIAL_NAMES[r.route.blocked.mat]}`:'clear',!r.route.blocked)}`+
        `${row('Link margin',Number.isFinite(m)?`${m.toFixed(1)} dB`:'no signal',m>=SPEC.reliable)}</ul>`+
        `<p class="profile">Simplified link model: ≥ ${SPEC.works} dB works, ≥ ${SPEC.reliable} dB is reliable. Game values, not a real link budget. Light links use wide LED beams, not lasers.</p>`:'');
  }
  prompt(atBench:boolean):Prompt|null{
    const j=this.current();if(!j)return null;const g=this.game;
    if(!atBench){const p=g.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6;
      if(g.held&&g.held===this.pod){const pad=(Object.keys(PADS) as Pad[]).find(k=>dist(p,PADS[k])<2.2);return pad?{key:'E',text:`Set the pod down on the ${PAD_NAMES[pad]} pad`}:{key:'E',text:`Carry the pod to the ${PAD_NAMES[j.pad]} pad`};}
      if(g.held&&this.mirrors.includes(g.held)){const s=SPOT_IDS.find(k=>dist(p,SPOTS[k])<2.1&&![...this.mirrorAt.values()].includes(k));return s?{key:'E',text:`Stand the mirror on mark ${s}`}:{key:'E',text:'Carry the mirror to a floor mark (A, B or C)'};}
      const grab=g.held?undefined:g.nearest();if(grab&&grab===this.pod)return {key:'E',text:'Pick up the receiver pod'};if(grab&&this.mirrors.includes(grab))return {key:'E',text:'Pick up the mirror board'};
      if(near)return {key:'E',text:this.podPad===j.pad?'Work at the dispatch desk':`Work at the desk (the pod isn't on the ${PAD_NAMES[j.pad]} pad yet)`};
      return walkHint(g,this.podPad!==j.pad?`Take the receiver pod to the ${PAD_NAMES[j.pad]} pad (yellow arrow)`:'Walk to the dispatch desk (yellow arrow)');}
    const r=this.reading();
    if(!r.podOk)return {key:'E',text:`Step back and carry the pod to the ${PAD_NAMES[j.pad]} pad`};
    if(!r.detectorOk)return {key:'F',text:'Fit the detector head that matches the band: click it, or F'};
    if(r.route.blocked)return {key:'1–5',text:BANDS[this.band].beam?`The ${MATERIAL_NAMES[r.route.blocked.mat]} stops this band: try another band key, or steer the beam with mirrors`:`The ${MATERIAL_NAMES[r.route.blocked.mat]} stops this band: try another band key`};
    if(r.margin<SPEC.reliable)return {key:'P',text:r.margin<SPEC.works?'Too weak: more power, or a band these obstacles pass':'Readable but weak: more power makes it reliable'};
    return {key:'Enter',text:'Clear link: SEND the message (Enter)'};
  }
  complete(){return this.delivered.length>=JOBS.length;}
  score(){return {mistakes:this.mistakes,cost:this.spent};}
  snapshot(){const r=this.reading();return {job:this.jobIndex,delivered:this.delivered.map(d=>({job:d.job,tier:d.verdict.tier,margin:d.verdict.margin})),band:this.band,detector:this.detector,power:this.power,hatchOpen:this.hatchOpen,
    podPad:this.podPad,mirrors:[...this.mirrorAt.values()],mistakes:this.mistakes,spent:this.spent,
    reading:{margin:Number.isFinite(r.margin)?+r.margin.toFixed(2):null,blocked:r.route.blocked?.mat??null,spots:r.route.spots,detectorOk:r.detectorOk,podOk:r.podOk}};}
}
