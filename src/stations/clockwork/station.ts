// Clockwork Kitchen bench. A little conveyor oven runs across the back of the bench with a scope
// mounted on it; its controller board sits in front. Pip picks the controller's clock (the
// built-in RC, or a module from the shelf plugged into CLOCK IN), turns the DIVIDER so the tick
// is 1 kHz, routes the clock line clear of the mixer, and hits RUN BELT: three trays ride through
// the oven while the board warms, and come out golden, raw or burnt. The oven's clock face runs
// beside a reference face, so a wandering clock visibly drifts. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressClockwork,SHELF_SPOT,DOUGH_SPOT,MINT,CREAM,CHERRY,CHROME,type KitchenRoom} from './room';
import {toon,box,rbox,cyl,sphere,part,group,canvasTex,repeat,INK,DMETAL} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import {JOBS,SOURCES,SOURCE_IDS,DIVIDERS,TICK_HZ,GLITCH,judge,run,worstError,cost,cheapest,tickHz,dividerError,freqError,glitching,pctText,
  type SourceId,type Setup,type Job,type Verdict,type TrayResult,type Doneness} from './logic';
import './clockwork.css';
import {cheer,walkHint} from '../shared';

const PCB='#2f8a66',COPPER='#e9a55a';
const MOD_COLOR:Record<Exclude<SourceId,'rc'>,string>={res8:'#5b9cf0',xtal12:'#b392f0',watch:'#f2b93b'};
/** The number that decides the puzzle goes big on the module; its kind sits on the rack slot below. */
const MOD_FREQ:Record<Exclude<SourceId,'rc'>,string>={res8:'8 MHz',xtal12:'12 MHz',watch:'32 kHz'};
const MOD_KIND:Record<Exclude<SourceId,'rc'>,string>={res8:'CERAMIC',xtal12:'CRYSTAL',watch:'WATCH'};
const EXTERNAL:Exclude<SourceId,'rc'>[]=['res8','xtal12','watch'];
const FOOD:Record<string,Record<Doneness,string>>={
  eggs:{raw:'#fffaf0',golden:'#f7d98f',burnt:'#8f6b48'},oven:{raw:'#f3e2bf',golden:'#dc9a3c',burnt:'#4a3024'},pastry:{raw:'#f6e7c8',golden:'#e8a948',burnt:'#4d3226'}};
const DONE_TEXT:Record<Doneness,[string,string]>={golden:['GOLDEN','#2f9a62'],burnt:['BURNT','#7a2a22'],raw:['RAW','#3f7fd6']};
/** Belt timing (s): trays leave the loader this far apart; travel in, bake, travel out. */
const GAP=1.2,IN=1,BAKE=1.1,OUT=.9,RUN_TIME=2*GAP+IN+BAKE+OUT+.4;
const LOAD_X=-1.95,OVEN_X=-.55,OUT_X=[1.2,.9,.6],BELT_Z=-.42,BELT_Y=.2;
/** Table labels lean back toward the bench camera. */
const TILT=-Math.PI/2+.45;
/** Clock faces: one turn every REV seconds; the oven face's drift is exaggerated this much. */
const REV=6,DRIFT_GAIN=25;

function label(text:string,bg=CREAM,fg=INK,w=256,h=80){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(18,h/3));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    let size=Math.round(h*.5);const font=(n:number)=>`700 ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;c.font=font(size);while(size>10&&c.measureText(text).width>w-28){size--;c.font=font(size);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);});
}
function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,w=.42,tilt=-Math.PI/2,bg?:string,fg?:string,aspect=80/256){
  const m=new T.MeshBasicMaterial({map:label(text,bg,fg,256,Math.round(256*aspect)),transparent:true});m.userData.outlineParameters={visible:false};
  const p=part(parent,new T.PlaneGeometry(w,w*aspect),m,x,y,z,false);p.rotation.x=tilt;p.userData.noAO=true;return p;
}
const labelCache=new Map<string,T.Texture>();
const cachedLabel=(text:string,bg:string,fg=INK)=>{const k=text+bg+fg;let t=labelCache.get(k);if(!t){t=label(text,bg,fg);labelCache.set(k,t);}return t;};
/** A clock module: a small board with its part on the back half and its name on the front. */
function moduleMesh(id:Exclude<SourceId,'rc'>){
  const g=new T.Group();part(g,rbox(.28,.05,.24,.03),toon(MOD_COLOR[id]),0,.025,0);
  for(const x of [-.06,0,.06])part(g,cyl(.008,.008,.07,6),toon(CHROME),x,-.02,-.04,false);
  if(id==='res8'){part(g,rbox(.13,.07,.05,.02),toon('#e8913f'),0,.09,-.05);}
  if(id==='xtal12'){part(g,rbox(.15,.08,.055,.025),glossyToon(CHROME,{spec:.8,size:.97}),0,.095,-.05);}
  if(id==='watch'){part(g,cyl(.022,.022,.13,14,'x'),glossyToon(CHROME,{spec:.8,size:.97}),0,.08,-.05);}
  const tag=sign(g,MOD_FREQ[id],0,0,0,.27,TILT,CREAM,INK,110/256);tag.position.set(0,.07,.06);
  return g;
}
/** A round dial face with 12 ticks; returns the hand to spin. */
function dial(parent:T.Object3D,x:number,y:number,z:number,r:number,rim:string,handColor:string){
  const g=group(parent,x,y,z);part(g,cyl(r+.015,r+.015,.02,32,'z'),toon(rim),0,0,0);
  const face=part(g,new T.CircleGeometry(r,32),new T.MeshBasicMaterial({color:CREAM}),0,0,.011,false);(face.material as T.Material).userData.outlineParameters={visible:false};
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;part(g,box(.008,i%3?.014:.026,.004),toon(INK),Math.sin(a)*r*.82,Math.cos(a)*r*.82,.013,false).rotation.z=-a;}
  const h=group(g,0,0,.016);part(h,box(.012,r*.85,.004),toon(handColor),0,r*.38,0,false);part(g,cyl(.012,.012,.01,10,'z'),toon(INK),0,0,.02,false);
  return h;
}
interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
interface Belt {job:Job;trays:TrayResult[];t:number;verdict?:Verdict;replay:boolean}

export class ClockworkKitchen implements Station {
  readonly view={distance:6.1,pitch:.9,lookY:.3};
  readonly limits={time:480,damage:1,cost:0};
  readonly stand={x:0,z:-1.55};readonly table=new T.Vector3(0,1,-2.45);readonly facing=Math.PI;
  setup:Setup={divider:8000,clear:false};jobIndex=0;results:{job:string;verdict:Verdict}[]=[];mistakes=0;spent=0;runs=0;
  shelfReady=false;doughReady=false;active=false;belt?:Belt;lastRun?:{job:string;trays:TrayResult[];replay:boolean};
  private root=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;private room?:KitchenRoom;
  private modules=new Map<SourceId,T.Group>();private rackAt=new Map<SourceId,T.Vector3>();private socketAt=new T.Vector3();
  private rackTags:T.Mesh[]=[];private rcLamp!:T.Mesh;private rcToggle!:T.Object3D;private knob!:T.Object3D;private divSign!:T.Mesh;private routeLever!:T.Object3D;private routeSign!:T.Mesh;
  private lineNear!:T.Mesh;private lineClear!:T.Mesh;private beater!:T.Object3D;private mixerHead!:T.Object3D;private runCap!:T.Mesh;private emptyRack!:T.Mesh;
  private trays:{g:T.Group;food:T.MeshToonMaterial;badge:T.Sprite}[]=[];private foodKind='';private doughStack!:T.Group;
  private ovenWindow!:T.Mesh;private ovenGlow=0;private beltTex!:T.Texture;private refHand!:T.Object3D;private ovenHand!:T.Object3D;private refAngle=0;private ovenAngle=0;
  private scopeCanvas!:HTMLCanvasElement;private scopeTex!:T.CanvasTexture;private scopeClock=0;private slip=0;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';
  private shelf?:Game['props'][number];private dough?:Game['props'][number];private shelfLoad=new T.Group();private sparkClock=0;private beaconOn=false;
  private ready=false;private ovenHot=hot('#ff9c4a',1.5);private ovenDark=toon('#3a2f3a');private lampOn=hot('#3dff7a',1.25);private lampOff=toon('#4a3f5c');private beaconHot=hot('#ff6b6b',1.8);private beaconDark=toon('#8a3a3a');
  readonly job:StationJob;
  constructor(private game:Game){
    this.limits.cost=Math.max(1,Math.ceil(JOBS.reduce((n,j)=>n+(cheapest(j)?.cost??0),0)*1.25));
    this.job={goal:'Get three kitchen timers cooking on time',
      steps:[
        {text:'Roll the clock-module shelf to the oven bench',done:()=>this.shelfReady,at:()=>this.shelf?.body.translation()??SHELF_SPOT},
        {text:'Carry the dough trays to the belt',done:()=>this.doughReady,at:()=>this.dough?.body.translation()??DOUGH_SPOT},
        {text:'Step up to the oven bench (E)',done:()=>this.active||this.results.length>0,at:()=>this.stand},
        ...JOBS.map((j,i)=>({text:`Job ${i+1}: ${j.title}`,done:()=>this.results.length>i,at:()=>this.stand}))],
      bonuses:[
        {text:'Reliable every time: spec held over the whole temperature range',ok:()=>this.results.every(r=>r.verdict.tier>=2)},
        {text:'Elegant: the cheapest clock that holds each spec',ok:()=>this.results.every(r=>r.verdict.tier===3)},
        {text:'No spoiled trays',ok:()=>this.mistakes===0}]};
    game.root.add(this.root);game.root.add(this.shelfLoad);
    this.buildBench();this.applyStart(JOBS[0]);this.redraw();
  }
  dress(kit:RoomKit){this.room=dressClockwork(this.game,kit);return {lightUp:this.room.lightUp};}
  private setupProps(){this.ready=true;this.shelf=this.game.props.find(p=>p.spec.id==='shelf');this.dough=this.game.props.find(p=>p.spec.id==='dough');this.buildShelfLoad();}
  current():Job|undefined{return JOBS[this.jobIndex];}
  private applyStart(j:Job){if(j.start)this.setup={...j.start};this.slip=0;this.refAngle=this.ovenAngle=0;this.dressTrays(j);}

  // ---------- the bench ----------
  private buildBench(){
    // y=0 in `top` is the worktop surface.
    const g=this.game,t=this.table,top=group(this.root,t.x,t.y+.035,t.z);
    // Counter: cream body with a mint kick band and chrome edge; a pale-wood worktop.
    part(g.decorRoot,rbox(4.8,1,1.4,.08),toon(CREAM),t.x,.5,t.z);part(g.decorRoot,box(4.82,.16,1.42),toon(MINT),t.x,.12,t.z);
    part(g.decorRoot,rbox(4.9,.07,1.5,.05),toon('#e2c08e'),t.x,1.0,t.z);part(g.decorRoot,box(4.9,.03,.04),toon(CHROME),t.x,.955,t.z+.74);
    this.solid(4.8,1.05,1.4,t.x,.52,t.z);
    // Side tables at both ends: the dough lands on the left one, the module shelf parks right.
    part(g.decorRoot,rbox(.9,.95,.8,.06),toon(CHROME),DOUGH_SPOT.x,.47,DOUGH_SPOT.z);part(g.decorRoot,box(.95,.05,.85),toon('#e2c08e'),DOUGH_SPOT.x,.97,DOUGH_SPOT.z);this.solid(.9,1,.8,DOUGH_SPOT.x,.5,DOUGH_SPOT.z);
    sign(g.decorRoot,'DOUGH',DOUGH_SPOT.x,.6,DOUGH_SPOT.z+.41,.5,0,'#ffd66b');
    // ---- Conveyor along the back: frame, scrolling belt, end rollers.
    const belt=group(top,-.35,0,BELT_Z);part(belt,rbox(3.65,.14,.36,.04),toon(DMETAL),0,.08,0);
    this.beltTex=repeat(canvasTex(256,64,c=>{c.fillStyle='#3a3d55';c.fillRect(0,0,256,64);c.fillStyle='#4d5170';for(let x=0;x<256;x+=32)c.fillRect(x,0,10,64);}),9,1);
    const surf=part(belt,box(3.55,.012,.3),toon('#ffffff',{map:this.beltTex}),0,.16,0,false);surf.userData.noAO=true;
    for(const x of [-1.8,1.8])part(belt,cyl(.08,.08,.34,16,'z'),toon(CHROME),x,.1,0);
    for(const x of [-1.6,1.6])for(const z of [-.15,.15])part(belt,cyl(.02,.02,.1,8),toon(DMETAL),x,.03,z,false);
    sign(top,'IN',LOAD_X,.02,BELT_Z+.27,.34,TILT,CREAM);sign(top,'OUT',OUT_X[1],.02,BELT_Z+.27,.36,TILT,CREAM);
    this.doughStack=group(top,LOAD_X,0,BELT_Z-.02);for(let k=0;k<3;k++){part(this.doughStack,rbox(.26,.02,.22,.01),toon(CHROME),0,.22+k*.05,0);part(this.doughStack,rbox(.18,.025,.14,.012),toon('#f3e2bf'),0,.24+k*.05,0);}
    // ---- The oven: a cherry-red tunnel with chrome bands; clock faces flank its window.
    const oven=group(top,OVEN_X,0,BELT_Z);part(oven,rbox(1.2,.56,.6,.08),glossyToon(CHERRY,{spec:.7,size:.97}),0,.44,0);
    for(const y of [.18,.7])part(oven,box(1.22,.03,.62),toon(CHROME),0,y,0);
    for(const x of [-.605,.605])part(oven,box(.02,.26,.34),toon('#1d1f30'),x,.33,0,false);
    this.ovenWindow=part(oven,rbox(.36,.24,.02,.03),toon('#3a2f3a'),0,.44,.301,false);this.ovenWindow.userData.noAO=true;
    part(oven,rbox(.4,.28,.02,.03),toon(CHROME),0,.44,.296);
    this.refHand=dial(oven,-.38,.46,.3,.13,MINT,INK);this.ovenHand=dial(oven,.38,.46,.3,.13,CHERRY,CHERRY);
    sign(oven,'REFERENCE',-.38,.25,.31,.34,0,MINT);sign(oven,'OVEN CLOCK',.38,.25,.31,.34,0,'#ffd66b');
    for(const x of [-.45,.45])part(oven,cyl(.03,.035,.08,10),toon(INK),x,.03,.22);
    // Scope mounted on the oven: a cream cabinet with a live canvas screen.
    const scope=group(oven,0,.72,-.04);scope.rotation.x=-.3;part(scope,rbox(1.34,.7,.16,.06),toon(CREAM),0,.35,0);part(scope,box(1.24,.6,.02),toon(INK),0,.36,.08,false);
    this.scopeCanvas=document.createElement('canvas');this.scopeCanvas.width=820;this.scopeCanvas.height=390;this.scopeTex=new T.CanvasTexture(this.scopeCanvas);this.scopeTex.colorSpace=T.SRGBColorSpace;this.scopeTex.anisotropy=4;
    const screenMat=new T.MeshBasicMaterial({map:this.scopeTex,toneMapped:false});screenMat.userData.outlineParameters={visible:false};
    const screen=part(scope,new T.PlaneGeometry(1.2,.57),screenMat,0,.36,.092,false);screen.userData.noAO=true;part(scope,box(1.36,.04,.18),toon(CHERRY),0,.72,0);
    // Three trays ride the belt.
    for(let k=0;k<3;k++){const tg=group(top,LOAD_X,BELT_Y,BELT_Z);part(tg,rbox(.28,.022,.22,.01),glossyToon(CHROME,{spec:.8,size:.97}),0,.011,0);
      const food=toon('#f3e2bf').clone();const badge=new T.Sprite(new T.SpriteMaterial({map:cachedLabel('GOLDEN','#2f9a62','#fffaf0'),depthTest:false}));badge.scale.set(.3,.094,1);badge.position.set(0,.24,0);badge.renderOrder=8;badge.visible=false;tg.add(badge);
      this.trays.push({g:tg,food,badge});tg.visible=false;}
    // ---- Controller board, front centre: the MCU, the INT RC switch, CLOCK IN, divider, route.
    const bx=-.45,bz=.37,board=group(top,bx,.004,bz);part(board,rbox(1.8,.03,.5,.05),toon(PCB),0,.015,0);
    const y=.032,chipX=.36,sockX=-.5;
    const chip=group(board,chipX,y,-.04);part(chip,rbox(.24,.045,.24,.02),toon('#262a40'),0,.022,0);for(let k=0;k<5;k++)for(const s of [-1,1]){part(chip,box(.012,.01,.03),toon(CHROME),-.08+k*.04,.005,s*.13,false);part(chip,box(.03,.01,.012),toon(CHROME),s*.13,.005,-.08+k*.04,false);}
    sign(chip,'MCU',0,.047,0,.16,-Math.PI/2,'#262a40','#fbf3e2',80/256);
    const rc=group(board,chipX,y,.16);part(rc,rbox(.26,.03,.1,.02),toon(INK),0,.015,0);this.rcToggle=part(rc,rbox(.08,.03,.07,.015),toon(CREAM),-.06,.04,0);
    this.rcLamp=part(rc,sphere(.022,12,8),toon('#4a3f5c'),.09,.04,0);this.click(rc,'source','rc');sign(top,'INT RC',bx+chipX,.05,bz+.3,.34,TILT,'#ffd66b');
    const sock=group(board,sockX,y,-.04);part(sock,rbox(.32,.035,.28,.03),toon(CREAM),0,.018,0);part(sock,box(.2,.01,.04),toon('#262a40'),0,.038,-.06,false);
    this.click(sock,'unplug');this.socketAt.set(t.x+bx+sockX,0,bz-.04);sign(top,'CLOCK IN',bx+sockX,.05,bz+.18,.36,TILT,'#ffd66b');
    // Clock line from CLOCK IN to the MCU: back past the mixer, or clear along the front edge.
    const tube=(pts:number[][])=>new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(([a,b,c])=>new T.Vector3(a,b,c))),36,.015,6);
    this.lineNear=part(board,tube([[sockX-.1,y+.02,-.16],[-.85,y+.03,-.3],[-1.05,y+.02,-.4],[-.85,y+.02,-.5],[-.2,y+.02,-.34],[chipX-.08,y+.02,-.16]]),toon(COPPER),0,0,0,false);
    this.lineClear=part(board,tube([[sockX+.16,y+.02,0],[-.1,y+.02,.02],[chipX-.13,y+.02,-.02]]),toon(COPPER),0,0,0,false);
    const lever=group(board,-.08,y,.16);part(lever,rbox(.14,.03,.1,.02),toon(INK),0,.015,0);this.routeLever=group(lever,0,.03,0);part(this.routeLever,cyl(.01,.01,.12,8),toon(DMETAL),0,.06,0);part(this.routeLever,sphere(.028,12,8),toon(CHERRY),0,.12,0);
    this.click(lever,'route');this.routeSign=sign(top,'ROUTE: PAST MIXER',bx-.1,.05,bz+.31,.5,TILT,'#ffd66b');
    const knob=group(board,.74,y,-.02);part(knob,cyl(.11,.12,.04,24),toon(CHROME),0,.02,0);this.knob=group(knob,0,.04,0);part(this.knob,cyl(.085,.095,.07,20),toon(INK),0,.035,0);part(this.knob,box(.02,.012,.08),toon('#ffd66b'),0,.075,-.04,false);
    this.click(knob,'divider',1);this.divSign=sign(top,'DIVIDER ÷8000',bx+.8,.05,bz+.28,.46,TILT,CREAM);
    // ---- The stand mixer beside the oven (its motor is the noise source), right over the back cable run.
    const mixer=group(top,-1.5,0,-.04);mixer.rotation.y=Math.PI;const mint=glossyToon(MINT,{spec:.7,size:.97});
    part(mixer,rbox(.36,.05,.26,.03),mint,0,.025,0);part(mixer,rbox(.1,.34,.11,.04),mint,.12,.2,0);
    this.mixerHead=group(mixer,.03,.4,0);part(this.mixerHead,rbox(.36,.12,.14,.06),mint,0,0,0);part(this.mixerHead,cyl(.02,.02,.03,10,'x'),toon(CHROME),.19,0,0);
    part(mixer,cyl(.1,.07,.13,20),glossyToon(CHROME,{spec:.9,size:.97}),-.04,.12,0);this.beater=group(mixer,-.04,.28,0);part(this.beater,cyl(.008,.008,.14,6),toon(CHROME),0,0,0);part(this.beater,box(.08,.024,.012),toon(CHROME),0,-.07,0);
    sign(top,'MIXER',-1.5,.05,.17,.34,TILT,CREAM);
    // ---- RUN BELT, front left.
    const runB=group(top,-1.9,0,.34);part(runB,rbox(.44,.1,.36,.05),toon(CREAM),0,.05,0);part(runB,cyl(.14,.14,.03,24),toon(CHROME),0,.11,0);this.runCap=part(runB,cyl(.11,.12,.06,24),glossyToon(CHERRY,{spec:.8,size:.97}),0,.15,0);
    this.click(runB,'run');sign(top,'RUN BELT',-1.9,.05,.6,.46,TILT,'#ffd66b');
    // ---- Module rack, front right: filled once the shelf is parked.
    part(top,rbox(1.1,.02,.42,.04),toon('#cbb488'),1.27,.01,.34);
    EXTERNAL.forEach((id,k)=>{const at=new T.Vector3(.93+k*.34,.02,.34);this.rackAt.set(id,at);part(top,rbox(.3,.008,.26,.03),toon('#b99f71'),at.x,.022,at.z,false);
      const m=moduleMesh(id);m.position.copy(at);top.add(m);this.modules.set(id,m);this.click(m,'source',id);
      this.rackTags.push(sign(top,MOD_KIND[id],at.x,.03,at.z+.2,.32,TILT,MOD_COLOR[id],INK));});
    this.emptyRack=sign(top,'SHELF STILL IN THE STOREROOM',1.27,.05,.34,1,TILT,'#ffe1dc','#7a1f22',60/256);
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}
  /** Module shelf dressing that rides on the cart prop until it is parked. */
  private buildShelfLoad(){
    const s=this.shelfLoad;part(s,rbox(1,.05,.6,.03),toon(CREAM),0,0,0);for(const x of [-.46,.46])part(s,box(.04,.5,.04),toon(CHROME),x,.25,-.26);part(s,box(.96,.04,.12),toon(CHROME),0,.48,-.26);
    EXTERNAL.forEach((id,k)=>{part(s,rbox(.24,.12,.2,.03),toon(MOD_COLOR[id]),-.3+k*.3,.09,.05);});
    const p=sign(s,'CLOCK MODULES',0,.3,-.23,.7,0,CHERRY,CREAM);p.rotation.x=-.2;
  }
  private dressTrays(j:Job){
    if(this.foodKind===j.id)return;this.foodKind=j.id;
    for(const tr of this.trays){tr.g.children.filter(c=>c.userData.food).forEach(c=>tr.g.remove(c));tr.food.color.set(FOOD[j.id].raw);
      const f=new T.Group();f.userData.food=true;tr.g.add(f);
      if(j.id==='eggs')for(const [x,z] of [[-.07,-.04],[.07,-.04],[0,.05]]){const e=part(f,sphere(.042,14,10),tr.food,x,.058,z);e.scale.set(1,1.25,1);}
      else if(j.id==='oven'){part(f,rbox(.2,.07,.13,.035),tr.food,0,.058,0);for(const x of [-.05,0,.05])part(f,box(.012,.01,.1),toon('#c98a55'),x,.095,0,false);}
      else for(const x of [-.075,.075]){const c=part(f,new T.TorusGeometry(.045,.022,8,16,Math.PI),tr.food,x,.04,0);c.rotation.x=-Math.PI/2;}}
  }

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const j=this.current(),a=this.game.audio;if(!j)return false;
    if(this.belt&&name!=='run'){this.say(this.belt.replay?'Watch the night shift\'s run first.':'Wait for the belt to finish.');return false;}
    switch(name){
      case 'source':{const id=arg as SourceId;if(!SOURCES[id])return false;
        if(SOURCES[id].external&&!this.shelfReady){this.say('The clock modules are still on the shelf in the storeroom: roll the shelf over to the bench.');a.voice('hm',1.4);return false;}
        if(this.setup.source===id){if(id==='rc'){this.setup.source=undefined;a.tone(300,.06,.04,'triangle');this.say('Internal RC off: no clock selected, so the timer cannot tick.');break;}this.say('That module is already in CLOCK IN.');return false;}
        this.setup.source=id;if(id==='rc'){a.tone(620,.06,.04,'triangle');}else{a.plug();}
        this.say(id==='rc'?'Internal RC selected: built into the chip, no extra part, about ±1 % and it drifts with heat.':`${SOURCES[id].label} fitted: ${tol(SOURCES[id].tol)} out of the box (typical module value).`);break;}
      case 'unplug':{if(!this.setup.source||!SOURCES[this.setup.source].external){this.say('CLOCK IN is empty. Click a module on the shelf to fit it.');return false;}
        this.setup.source=undefined;a.tone(300,.06,.04,'triangle');this.say('Module out: no clock selected. Pick the internal RC or another module.');break;}
      case 'divider':{const step=Number(arg??1),i=DIVIDERS.indexOf(this.setup.divider);this.setup.divider=DIVIDERS[(i+step+DIVIDERS.length)%DIVIDERS.length];a.tone(500+DIVIDERS.indexOf(this.setup.divider)*60,.05,.03);break;}
      case 'route':{this.setup.clear=!this.setup.clear;a.noise(.05,.05,2400,'highpass');a.tone(this.setup.clear?520:330,.08,.04,'triangle');
        if(this.setup.source&&!SOURCES[this.setup.source].external)this.say('The internal RC has no outside clock line, so the route does not matter for it.');break;}
      case 'run':{if(this.belt){this.say(this.belt.replay?'Watch the night shift\'s run first.':'The belt is still running.');return false;}
        if(!this.doughReady){this.say('No dough on the loader: carry the dough trays from the storeroom to the belt\'s left end.');a.voice('hm',1.4);return false;}
        const v=judge(j,this.setup);this.runs++;this.spent+=v.cost;if(v.tier===0)this.mistakes++;
        this.startBelt(j,v.trays,v,false);a.thud(4);a.tone(180,.3,.04,'sawtooth');break;}
      default:return false;
    }
    this.slip=0;this.refAngle=this.ovenAngle=0;this.redraw();this.drawScope();this.updatePanel();return true;
  }
  private startBelt(job:Job,trays:TrayResult[],verdict:Verdict|undefined,replay:boolean){
    this.belt={job,trays,t:0,verdict,replay};this.lastRun={job:job.id,trays,replay};this.dressTrays(job);
    this.trays.forEach(tr=>{tr.g.visible=true;tr.badge.visible=false;tr.food.color.set(FOOD[job.id].raw);});this.slip=0;this.refAngle=this.ovenAngle=0;
    if(replay)this.say('Replaying the night shift\'s run on the internal RC. Watch tray 3.');
  }
  private finishBelt(){
    const b=this.belt!,a=this.game.audio;this.belt=undefined;
    if(b.replay){this.say(`Night shift: tray 3 burnt (${pctText(b.trays[2].error)} at ${b.trays[2].temp} °C). The RC slows as the oven warms the board. See the scope's counts.`,'bad');a.voice('groan',1);return;}
    const v=b.verdict!;
    if(v.tier===0){this.say(v.problems[0]??'Some trays came out wrong.','bad');a.tone(160,.25,.06,'square');a.voice('groan',1);this.game.alarm({x:this.table.x,z:this.table.z},3);return;}
    this.results.push({job:b.job.id,verdict:v});
    this.say(`${['','Works','Works reliably','Works reliably · elegant'][v.tier]}: three golden trays. ${v.notes[0]??''}`,'ok');
    a.cheer();a.bell(1319,.5,.05);cheer(this.game,this,'#ffcf52');
    this.jobIndex++;const next=this.current();
    if(next){this.applyStart(next);this.trays.forEach(tr=>{tr.g.visible=false;tr.badge.visible=false;});if(next.replay)this.startBelt(next,run(next,this.setup),undefined,true);}
    this.redraw();
  }

  // ---------- drawing ----------
  redraw(){
    const s=this.setup,src=s.source;
    for(const id of EXTERNAL){const m=this.modules.get(id)!;m.visible=this.shelfReady;
      if(src===id)m.position.set(this.socketAt.x-this.table.x,.07,this.socketAt.z);else m.position.copy(this.rackAt.get(id)!);}
    this.emptyRack.visible=!this.shelfReady;for(const t of this.rackTags)t.visible=this.shelfReady;
    this.rcLamp.material=src==='rc'?this.lampOn:this.lampOff;this.rcToggle.position.x=src==='rc'?.06:-.06;
    this.knob.rotation.y=-DIVIDERS.indexOf(s.divider)*1.1;(this.divSign.material as T.MeshBasicMaterial).map=cachedLabel(`DIVIDER ÷${s.divider}`,CREAM);
    this.routeLever.rotation.x=s.clear?.5:-.5;(this.routeSign.material as T.MeshBasicMaterial).map=cachedLabel(s.clear?'ROUTE: CLEAR':'ROUTE: PAST MIXER',s.clear?'#8dffb0':'#ffd66b');
    this.lineNear.visible=!s.clear;this.lineClear.visible=s.clear;
    const ext=!!src&&SOURCES[src].external;(this.lineNear.material as T.Material)=toon(ext?COPPER:'#6f8a7d');(this.lineClear.material as T.Material)=toon(ext?COPPER:'#6f8a7d');
    this.doughStack.visible=this.doughReady&&!this.belt;
    if(!this.belt&&!this.lastRun)this.trays.forEach(tr=>tr.g.visible=false);
    this.shown='';
  }
  /** Board temperature now: during a run, the tray in the oven sets it. */
  private boardTemp(){const j=this.current()??JOBS[JOBS.length-1];if(this.belt){const k=Math.max(0,Math.min(2,Math.floor((this.belt.t-IN)/GAP)));return this.belt.job.temps[k];}return j.temps[0];}
  /** Oven tick ÷ reference (1 = on time; 0 = no clock). */
  private tickRatio(){const j=this.belt?.job??this.current()??JOBS[JOBS.length-1],s=this.setup;if(!s.source)return 0;const src=SOURCES[s.source];
    return tickHz(src,s.divider)*(1+freqError(src,this.boardTemp()))*(glitching(j,s)?1+GLITCH:1)/TICK_HZ;}
  private drawScope(){
    const c=this.scopeCanvas.getContext('2d')!,W=this.scopeCanvas.width,H=this.scopeCanvas.height,j=this.belt?.job??this.current()??JOBS[JOBS.length-1],r=this.tickRatio();
    const font=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
    c.fillStyle='#10202a';c.fillRect(0,0,W,H);c.textBaseline='alphabetic';
    // Header: the oven's tick rate and how far it is from 1 kHz.
    const off=r>0?r-1:0,good=r>0&&Math.abs(off)<=j.tol;
    c.font=font(34);c.fillStyle='#fbf3e2';c.fillText('TICK',16,42);c.fillStyle=r===0?'#ff7a8a':good?'#8dffb0':'#ff7a8a';
    c.fillText(r>0?`${(r*TICK_HZ/1000).toFixed(3)} kHz  ${pctText(off,2)}`:'NO CLOCK: TIMER STOPPED',112,42);
    // Two square waves: the 1 kHz reference and the oven's tick; the tick slips as error builds (exaggerated).
    const x0=112,x1=W-14,wave=(y0:number,col:string,freq:number,phase:number,flat=false)=>{c.strokeStyle=col;c.lineWidth=5;c.beginPath();
      for(let x=x0;x<=x1;x+=2){const u=(x-x0)/(x1-x0)*6*freq+phase,hi=!flat&&(u-Math.floor(u))<.5,yy=y0-(hi?30:0);x>x0?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();};
    c.font=font(28);c.fillStyle=MINT;c.fillText('REF',16,100);wave(104,MINT,1,0);
    c.fillStyle='#ffd66b';c.fillText('OVEN',16,152);wave(156,'#ffd66b',r>0?Math.min(2.2,Math.max(.4,1+off*DRIFT_GAIN*.2)):1,-this.slip,r===0);
    // The count: the firmware waits for cook × 1000 ticks; at this tick rate that takes…
    c.fillStyle='#16303a';c.fillRect(0,174,W,52);c.font=font(30,600);c.fillStyle='#fbf3e2';
    const ticks=j.cookS*TICK_HZ;c.fillText(r>0?`${ticks.toLocaleString('en-US')} ticks = ${fmtS(j.cookS/r-j.cookS)} at ${this.boardTemp()} °C`:`${ticks.toLocaleString('en-US')} ticks: never`,16,212);
    // Last run: each tray's cook error against the ±spec band.
    const run=this.lastRun&&this.lastRun.job===j.id?this.lastRun:undefined,done=this.belt?Math.max(0,Math.min(3,Math.floor((this.belt.t-IN-BAKE-OUT)/GAP)+1)):3;
    const ax0=300,ax1=W-24,mid=(ax0+ax1)/2,span=j.tol*3,px=(e:number)=>mid+Math.max(-1,Math.min(1,e/span))*(ax1-ax0)/2,top=236,bot=H-6;
    c.fillStyle='rgba(141,255,176,.16)';c.fillRect(px(-j.tol),top,px(j.tol)-px(-j.tol),bot-top);c.strokeStyle='rgba(141,255,176,.7)';c.lineWidth=3;for(const e of [-j.tol,j.tol]){c.beginPath();c.moveTo(px(e),top);c.lineTo(px(e),bot);c.stroke();}
    c.fillStyle='rgba(255,255,255,.55)';c.font=font(22,600);c.textAlign='center';c.fillText(`±${+(j.tol*100).toFixed(2)} %`,mid,top+24);c.fillText('short',ax0+34,bot-6);c.fillText('long',ax1-28,bot-6);c.textAlign='left';
    if(!run){c.fillStyle='rgba(255,255,255,.6)';c.font=font(28,600);c.fillText('No run yet',16,top+56);}
    else run.trays.forEach((t,k)=>{const yy=top+52+k*42;c.font=font(28,600);c.fillStyle='rgba(255,255,255,.8)';c.fillText(`T${k+1}  ${t.temp} °C`,16,yy+10);
      if(k>=done){c.fillStyle='rgba(255,255,255,.4)';c.fillText('…',ax0-40,yy+10);return;}
      const col=t.doneness==='golden'?'#8dffb0':t.doneness==='burnt'?'#ff7a8a':'#7fd8ff';c.fillStyle=col;c.beginPath();c.arc(px(isFinite(t.error)?t.error:-span),yy,13,0,7);c.fill();});
    this.scopeTex.needsUpdate=true;
  }
  pointer(e:Pointer){
    const hits=e.ray.intersectObjects(this.clickables.map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.1);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&found){if(found.act==='divider')this.act('divider',e.button===2?-1:1);else if(e.button===0)this.act(found.act,found.arg);}
  }
  key(code:string){
    const map:Record<string,[string,unknown?]>={Digit1:['source','rc'],Digit2:['source','res8'],Digit3:['source','xtal12'],Digit4:['source','watch'],Backspace:['unplug'],
      BracketLeft:['divider',-1],BracketRight:['divider',1],Minus:['divider',-1],Equal:['divider',1],KeyD:['divider',1],KeyR:['route'],Enter:['run'],Space:['run']};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';}
  dropped(p:Game['props'][number]){
    const q=p.body.translation(),near=(spot:{x:number;z:number})=>Math.hypot(q.x-spot.x,q.z-spot.z)<2.2||Math.hypot(q.x-this.stand.x,q.z-this.stand.z)<2;
    const park=(x:number,y:number,z:number)=>{p.body.setTranslation({x,y,z},true);p.body.setRotation(new T.Quaternion(),true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);this.game.audio.plug();this.game.burst({x,y:y+.1,z},'#8ff3ea',1,'ring');};
    if(p.spec.id==='shelf'&&!this.shelfReady&&near(SHELF_SPOT)){this.shelfReady=true;park(SHELF_SPOT.x,.33,SHELF_SPOT.z);this.redraw();}
    if(p.spec.id==='dough'&&!this.doughReady&&near(DOUGH_SPOT)){this.doughReady=true;park(DOUGH_SPOT.x,1.08,DOUGH_SPOT.z);this.redraw();}
  }
  update(dt:number){
    if(!this.ready)this.setupProps();
    const j=this.current(),time=this.game.time;
    // The module shelf rides on its cart.
    if(this.shelf){const p=this.shelf.body.translation(),q=this.shelf.body.rotation();this.shelfLoad.position.set(p.x,p.y+.35,p.z);this.shelfLoad.quaternion.set(q.x,q.y,q.z,q.w);}
    // Belt run: trays in, bake, out; food browns toward its result.
    const b=this.belt;
    if(b){b.t+=dt;this.beltTex.offset.x-=dt*.9;let baking=false;
      b.trays.forEach((res,k)=>{const tr=this.trays[k],u=b.t-k*GAP,raw=new T.Color(FOOD[b.job.id].raw),end=new T.Color(FOOD[b.job.id][res.doneness]);let x=LOAD_X,cook=0;
        if(u<=0)x=LOAD_X;else if(u<IN)x=LOAD_X+(OVEN_X-LOAD_X)*u/IN;else if(u<IN+BAKE){x=OVEN_X;cook=(u-IN)/BAKE;baking=true;}else{cook=1;x=OVEN_X+(OUT_X[k]-OVEN_X)*Math.min(1,(u-IN-BAKE)/OUT);}
        tr.g.position.x=x;tr.g.visible=u>0||k===0;tr.food.color.copy(raw).lerp(end,cook);
        const out=u>=IN+BAKE+OUT;if(out&&!tr.badge.visible){tr.badge.visible=true;tr.badge.material.map=cachedLabel(...badgeText(res.doneness));this.game.audio.bell(res.doneness==='golden'?1175:220,.25,.04);
          if(res.doneness==='burnt')this.game.burst(this.table.clone().add(new T.Vector3(OUT_X[k],.4,BELT_Z)),'#ff8a3d',5,'spark');}});
      this.ovenGlow+=((baking?1:0)-this.ovenGlow)*Math.min(1,dt*6);
      if(b.t>=RUN_TIME)this.finishBelt();}
    else this.ovenGlow*=Math.max(0,1-dt*4);
    this.ovenWindow.material=this.ovenGlow>.3?this.ovenHot:this.ovenDark;
    // Clock faces: reference sweeps steadily; the oven face runs at its tick rate (drift exaggerated).
    const r=this.tickRatio(),k=r===0?0:1+Math.max(-.9,Math.min(1.5,(r-1)*DRIFT_GAIN));
    this.refAngle+=dt/REV*Math.PI*2;this.ovenAngle+=dt/REV*Math.PI*2*k;this.slip+=dt*(r===0?0:(r-1)*DRIFT_GAIN*2);
    this.refHand.rotation.z=-this.refAngle;this.ovenHand.rotation.z=-this.ovenAngle;
    // Mixer runs for the pastry job; sparks jump at the clock line when it runs past the motor.
    const mixing=!!j?.mixer;this.beater.rotation.y+=dt*(mixing?30:0);this.mixerHead.position.y=.3+(mixing?Math.sin(time*40)*.004:0);
    if(j&&glitching(j,this.setup)){this.sparkClock-=dt;if(this.sparkClock<=0){this.sparkClock=.35+Math.random()*.4;this.game.burst(this.table.clone().add(new T.Vector3(-1.3,.14,-.08)),'#9fd8ff',3,'spark');}}
    this.runCap.position.y=.15-(b&&!b.replay?.02:0);
    // Room: the big wall clock keeps real time; the beacon blinks once a second.
    if(this.room){const c=this.room.clock,sec=time%60;c.second.rotation.z=-sec/60*Math.PI*2;c.minute.rotation.z=-(time/3600+.2)*Math.PI*2;c.hour.rotation.z=-(time/43200+.35)*Math.PI*2;
      const on=time%1<.25;if(on!==this.beaconOn){this.beaconOn=on;this.room.beacon.material=on?this.beaconHot:this.beaconDark;this.room.beaconGlow.material.opacity=on?.5:0;}}
    this.scopeClock-=dt;if(this.scopeClock<=0){this.scopeClock=1/12;this.drawScope();}
    if(!b)this.doughStack.visible=this.doughReady;
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
    const j=this.current(),s=this.setup;
    const key=JSON.stringify([this.active,this.jobIndex,s,this.shelfReady,this.doughReady,!!this.belt,this.lastRun?.trays.map(t=>t.doneness)]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel ck-panel';this.layer()?.append(this.panel);}
    this.panel.hidden=!j;if(!j)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const src=s.source&&SOURCES[s.source],q=src?dividerError(src,s.divider):0,worst=worstError(j,s);
    const tick=src?`${fmtHz(src.hz)} ÷ ${s.divider} = ${(tickHz(src,s.divider)/1000).toFixed(3)} kHz`:`÷ ${s.divider} (no clock)`;
    const line=!src?'—':!src.external?'inside the chip':!j.mixer?`${s.clear?'clear':'past the mixer'} (mixer off)`:s.clear?'clear of the mixer':'past the running mixer';
    const trays=this.lastRun&&this.lastRun.job===j.id&&!this.belt?`<div class="ck-trays">${this.lastRun.trays.map((t,k)=>`<i class="${t.doneness}">T${k+1} ${DONE_TEXT[t.doneness][0].toLowerCase()}</i>`).join('')}</div>`:'';
    this.panel.innerHTML=`<header><small>JOB ${this.jobIndex+1}/${JOBS.length} · SPEC ±${+(j.tol*100).toFixed(2)} % OVER ${j.cookS/60} MIN</small><h4>${j.title}</h4><p>${j.ask}</p></header>`+
      (this.active?`<ul class="build">${row('Clock',src?src.label:'none selected',!!src)}${row('Divider',tick,!!src&&Math.abs(q)<=j.tol)}${row('Clock line',line,src?.external&&j.mixer?s.clear:undefined)}`+
        `${row('Board heats',`${j.range[0]}–${j.range[1]} °C`)}${row('Worst case',isFinite(worst)?`±${(worst*100).toFixed(worst<.001?3:2)} %`:'never cooks',worst<=j.tol)}${row('Part cost',String(cost(s)))}</ul>`+trays+
        `<p class="profile">Typical module values (game tuning, not a datasheet). Drift is simplified to a straight line with temperature.</p>`:'');
  }
  prompt(atBench:boolean):Prompt|null{
    const j=this.current();if(!j)return null;
    if(!atBench){const p=this.game.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6,held=this.game.held?.spec.id;
      if(held==='shelf')return {key:'E',text:'Park the module shelf at the bench\'s right end'};
      if(held==='dough')return {key:'E',text:'Set the dough trays on the table at the belt\'s left end'};
      if(near)return {key:'E',text:this.doughReady?'Work at the oven bench':'Work at the bench (the dough is still in the storeroom)'};
      return walkHint(this.game,!this.shelfReady?'Fetch the clock-module shelf from the storeroom (yellow arrow)':!this.doughReady?'Fetch the dough trays from the storeroom (yellow arrow)':'Walk to the oven bench (yellow arrow)');}
    if(this.belt)return {key:'⏳',text:this.belt.replay?'Night shift replay: watch tray 3 and the scope':'Belt running: watch the trays and the clock faces'};
    if(!this.doughReady)return {key:'E',text:'Step back and carry the dough trays to the belt'};
    const s=this.setup,src=s.source&&SOURCES[s.source];
    if(!src)return {key:'1',text:'Pick a clock: 1 or click the INT RC switch, or 2–4 / click a module on the shelf'};
    if(Math.abs(dividerError(src,s.divider))>j.tol&&src.id!=='watch')return {key:'D',text:'Turn the DIVIDER (click it, or D) until the tick reads 1.000 kHz'};
    if(glitching(j,s))return {key:'R',text:'The clock line passes the mixer: click ROUTE to run it clear'};
    return {key:'Enter',text:'RUN BELT (Enter): three trays through the oven'};
  }
  complete(){return this.results.length>=JOBS.length&&!this.belt;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){const j=this.current();return {job:this.jobIndex,setup:{...this.setup},results:this.results.map(r=>({job:r.job,tier:r.verdict.tier})),belt:this.belt?{job:this.belt.job.id,t:this.belt.t,replay:this.belt.replay}:null,
    lastRun:this.lastRun?{job:this.lastRun.job,replay:this.lastRun.replay,trays:this.lastRun.trays.map(t=>t.doneness)}:null,shelfReady:this.shelfReady,doughReady:this.doughReady,mistakes:this.mistakes,spent:this.spent,runs:this.runs,
    verdict:j?judge(j,this.setup):undefined,tickRatio:this.tickRatio()};}
}
const tol=(x:number)=>x>=.001?`±${+(x*100).toFixed(2)} %`:`±${Math.round(x*1e6)} ppm`;
const fmtHz=(hz:number)=>hz>=1e6?`${hz/1e6} MHz`:`${hz/1000} kHz`;
const fmtS=(s:number)=>`${s>=0?'+':'−'}${Math.abs(s).toFixed(Math.abs(s)<10?2:1)} s`;
const badgeText=(d:Doneness):[string,string,string]=>[DONE_TEXT[d][0],DONE_TEXT[d][1],'#fffaf0'];
