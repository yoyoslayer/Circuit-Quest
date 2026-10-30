// Signal Observatory bench. The rooftop receiver's line runs across the bench: RECEIVER jack →
// SERIES slot → decoder node (with a SHUNT slot to ground) → DECODER + LATCH. Pip plugs filter
// cans (a resistor, a coil or a capacitor) from the tray into the slots and turns each can's knob
// through real E6 values; the can shows its value and the corner frequency it sets, and that corner
// sweeps across the scope's live spectrum. Pip also flips the cable route, fits and stands the
// antenna whip, listens to the decoder's speaker, and logs the decode. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressObservatory,RX} from './room';
import {toon,box,rbox,cyl,sphere,part,group,canvasTex,INK,DMETAL} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import {cheer} from '../shared';
import {JOBS,KINDS,VALUES,DEFAULT,RODS,ROD_IDS,CIRCUIT,SPEC,CART_SAFE,read,judge,cost,cheapest,gain,filterName,stepResponse,stepSpan,morse,decoded,
  part as can,valueText,corner,passes,hz,snap,type Kind,type Part,type RodId,type Slot,type Setup,type Verdict,type Job} from './logic';

const BRASS='#d6a24e',CREAM='#fbf3e2';
const KIND_COLOR={R:'#f2c98f',L:BRASS,C:'#b8a6f5'} as const;
const GLOW_ON=hot('#3dff7a',1.25),GLOW_OFF=toon('#4a3f5c');
const DOT=.075; // Morse dot length (s)

/** Label decal texture (auto-fits the words to the plate, as the via counter does). */
function label(text:string,bg=CREAM,fg=INK,w=256,h=80){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,18);c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    let size=Math.round(h*.5);const font=(n:number)=>`700 ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;c.font=font(size);while(size>10&&c.measureText(text).width>w-28){size--;c.font=font(size);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);});
}
function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,w=.42,tilt=-.9,bg?:string,fg?:string,aspect=80/256){
  const m=new T.MeshBasicMaterial({map:label(text,bg,fg,256,Math.round(256*aspect)),transparent:true});m.userData.outlineParameters={visible:false};
  const p=part(parent,new T.PlaneGeometry(w,w*aspect),m,x,y,z,false);p.rotation.x=tilt;p.userData.noAO=true;return p;
}
const KIND_NAME:Record<Kind,string>={R:'RESISTOR',L:'COIL',C:'CAPACITOR'};
/** A filter can: a bevelled block with its component on top (resistor bands, coil, plates) and, once
 *  it is in a slot, a knob that steps its value. */
function canMesh(kind:Kind,withKnob=false){
  const g=new T.Group();
  part(g,rbox(.3,.07,.22,.04),toon(KIND_COLOR[kind]),0,.035,0);
  const pz=-.04;
  if(kind==='R'){part(g,cyl(.028,.028,.15,12,'x'),toon('#e8c79a'),0,.1,pz);for(const [x,c] of [[-.04,'#f0d24a'],[-.014,'#7a4fb0'],[.012,'#8a4b2a'],[.045,'#d8a54a']] as const)part(g,cyl(.031,.031,.012,12,'x'),toon(c),x,.1,pz);}
  if(kind==='L'){part(g,cyl(.02,.02,.18,10,'x'),toon(DMETAL),0,.1,pz);for(let k=0;k<6;k++)part(g,new T.TorusGeometry(.04,.012,8,20),glossyToon('#d9783a',{spec:.8,size:.97}),-.07+k*.028,.1,pz).rotation.y=Math.PI/2;}
  if(kind==='C'){part(g,cyl(.045,.045,.09,16),toon('#7d6fd6'),0,.115,pz);part(g,cyl(.047,.047,.012,16),toon(CREAM),0,.16,pz);}
  if(withKnob){const k=group(g,.11,.07,.05);k.name='knob';part(k,cyl(.045,.05,.04,20),toon(INK),0,.02,0);part(k,box(.012,.012,.05),toon('#ffd66b'),0,.045,-.022,false);}
  else{const tag=sign(g,KIND_NAME[kind],0,0,0,.28,-1.2,CREAM,INK,.3);tag.position.set(0,.1,.066);}
  return g;
}
/** A two-line tag: the can's value, and the corner frequency it sets in its slot. */
const tags=new Map<string,T.Texture>();
function valueTag(top:string,bottom:string,col:string){const k=`${top}|${bottom}|${col}`;let t=tags.get(k);
  if(!t){t=canvasTex(256,128,c=>{c.fillStyle=CREAM;c.beginPath();c.roundRect(4,4,248,120,18);c.fill();c.lineWidth=6;c.strokeStyle=INK;c.stroke();
    const font=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;c.textAlign='center';c.textBaseline='middle';
    c.fillStyle=INK;c.font=font(46);c.fillText(top,128,44);c.fillStyle=col;c.font=font(32,600);c.fillText(bottom,128,96);});tags.set(k,t);}
  return t;
}
/** Displayed whip height on the bench (not to scale: a 1.5 m rod would not fit). */
const rodLen=(id:RodId)=>.1+RODS[id].length*.34;

const routeLabels=new Map<boolean,T.Texture>();
const routeLabel=(clear:boolean)=>{let t=routeLabels.get(clear);if(!t){t=label(clear?'ROUTE: CLEAR OF MOTOR':'ROUTE: PAST MOTOR',clear?'#8dffb0':'#ffd66b');routeLabels.set(clear,t);}return t;};
interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
export class ObservatoryBench implements Station {
  readonly view={distance:6.3,pitch:.88,lookY:.4};
  readonly limits={time:360,damage:1,cost:0};
  readonly stand={x:0,z:-1.55};readonly table=new T.Vector3(0,1,-2.45);readonly facing=Math.PI;
  // Bench state.
  series?:Part;shunt?:Part;held?:Kind;knobSlot?:Slot;rerouted=false;rod:RodId='r3';vertical=true;listening=true;scopeMode:'signal'|'step'='signal';
  jobIndex=0;logged:{job:string;verdict:Verdict}[]=[];mistakes=0;spent=0;cartMoved=false;cartDistance=0;active=false;
  private root=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;
  private cans=new Map<Kind,T.Group>();private trayAt=new Map<Kind,T.Vector3>();private slotAt:Record<Slot,T.Vector3>={series:new T.Vector3(),shunt:new T.Vector3()};
  /** The cans standing in the slots (rebuilt when their kind changes) and their value tags. */
  private slotCans:Partial<Record<Slot,{kind:Kind;g:T.Group;tag:T.Mesh}>>={};private turning?:{slot:Slot;x0:number;i0:number};private top!:T.Group;
  private links!:{series:T.Object3D;shunt:T.Object3D};private slotPads!:Record<Slot,T.Mesh>;private routeLever!:T.Object3D;private cableNear!:T.Mesh;private cableClear!:T.Mesh;
  private whip!:T.Group;private whipRod!:T.Mesh;private whipTip!:T.Mesh;private routeSign!:T.Mesh;private rods=new Map<RodId,T.Object3D>();private latchLamp!:T.Mesh;private speakerCone!:T.Mesh;
  private scopeCanvas!:HTMLCanvasElement;private scopeTex!:T.CanvasTexture;private scopeClock=0;private modeButtons:T.Mesh[]=[];
  private stepCache?:{key:string;data:ReturnType<typeof stepResponse>;span:number};private stepAnim=1;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';
  private cart?:Game['props'][number];private motor=new T.Group();private fan!:T.Object3D;private sparkClock=0;
  private sound?:{out:GainNode;tone:GainNode;buzz:GainNode;buzzOsc:OscillatorNode;hiss:GainNode};
  private ready=false;
  readonly job:StationJob;
  constructor(private game:Game){
    this.limits.cost=Math.ceil(JOBS.reduce((n,j)=>n+(cheapest(j,{cartDistance:CART_SAFE})?.cost??0),0)*1.25);
    this.job={goal:'Decode three transmissions at the signal bench',
      steps:[
        {text:'Roll the noisy motor cart away from the receiver',done:()=>this.cartMoved,at:()=>this.cart?.body.translation()??RX},
        {text:'Sit at the signal bench (E)',done:()=>this.active||this.logged.length>0,at:()=>this.stand},
        ...JOBS.map((j,i)=>({text:`Transmission ${i+1}: ${j.title}`,done:()=>this.logged.length>i,at:()=>this.stand}))],
      bonuses:[
        {text:'Every decode reliable (S/N ≥ 12 dB, latch held)',ok:()=>this.logged.every(l=>l.verdict.tier>=2)},
        {text:'Elegant: the leanest filter each time',ok:()=>this.logged.every(l=>l.verdict.tier===3)},
        {text:'No failed decode logged',ok:()=>this.mistakes===0}]};
    game.root.add(this.root);game.root.add(this.motor);
    this.buildBench();this.redraw();
  }
  dress(kit:RoomKit){return dressObservatory(this.game,kit);}
  private setup(){this.ready=true;this.cart=this.game.props.find(p=>p.spec.id==='motor');this.buildMotor();}
  current():Job|undefined{return JOBS[this.jobIndex];}
  state():Setup{return {series:this.series,shunt:this.shunt,rerouted:this.rerouted,cartDistance:this.cartDistance,rod:this.rod,vertical:this.vertical};}

  // ---------- the bench ----------
  private buildBench(){
    const g=this.game,t=this.table,top=group(this.root,t.x,t.y,t.z);this.top=top;
    // Desk body: pale wood top on a cream cabinet with a brass kick rail; violet felt work mats.
    part(g.decorRoot,rbox(4.3,1,1.25,.08),toon('#efe2c8'),t.x,.5,t.z);part(g.decorRoot,rbox(4.4,.07,1.35,.05),toon('#e2c08e'),t.x,1.0,t.z);
    part(g.decorRoot,box(4.32,.06,.04),toon(BRASS),t.x,.1,t.z+.63);for(const x of [-1.07,1.07])part(g.decorRoot,box(.03,.8,.02),toon('#d8c6a4'),t.x+x,.5,t.z+.63);
    this.solid(4.3,1.05,1.25,t.x,.52,t.z);
    part(top,rbox(1.9,.012,.66,.06),toon('#4a4380'),-.08,.04,.3);part(top,rbox(1.16,.012,.7,.06),toon('#4a4380'),1.48,.04,.26);
    // ---- Filter board, front centre: RECEIVER jack → SERIES slot → node → DECODER, SHUNT slot to ground.
    const bx=-.08,bz=.3,board=group(top,bx,.046,bz);part(board,rbox(1.78,.03,.58,.05),toon('#2f7a5b'),0,.015,0);
    const cu=toon('#e9a55a'),y=.034,line=-.12,node=.14,jr=-.8,jd=.8;
    const trace=(x0:number,z0:number,x1:number,z1:number)=>{const len=Math.hypot(x1-x0,z1-z0),m=part(board,box(len+.03,.008,.035),cu,(x0+x1)/2,y,(z0+z1)/2,false);m.rotation.y=-Math.atan2(z1-z0,x1-x0);};
    trace(jr,line,-.58,line);trace(-.02,line,jd,line);trace(node,line,node,-.06);part(board,box(1.2,.008,.05),toon(INK),.2,y,.235,false);trace(node,.2,node,.235);
    part(board,cyl(.035,.035,.02,14),cu,node,y+.004,line,false);
    this.slotAt.series.set(bx-.3,.1,bz+line);this.slotAt.shunt.set(bx+node,.1,bz+.08);
    this.slotPads={series:part(board,rbox(.5,.015,.2,.04),toon('#1d2438'),-.3,y+.002,line),shunt:part(board,rbox(.2,.015,.3,.04),toon('#1d2438'),node,y+.002,.08)};
    this.click(this.slotPads.series,'slot','series');this.click(this.slotPads.shunt,'slot','shunt');
    // Empty series slot = a wire link (plain cable); empty shunt slot = open.
    const link=group(board,-.3,y,line);part(link,cyl(.01,.01,.46,6,'x'),toon('#dfe3ea'),0,.03,0,false);for(const x of [-.23,.23])part(link,cyl(.01,.01,.03,6),toon('#dfe3ea'),x,.015,0,false);
    const open=group(board,node,y,.08);for(const z of [-.12,.12])part(open,box(.05,.004,.05),cu,0,.004,z,false);
    this.links={series:link,shunt:open};
    sign(board,'SERIES',-.3,y+.02,-.235,.32,-1.2,'#ffd66b',INK,.36);sign(board,'SHUNT',node-.25,y+.02,.08,.26,-1.2,'#ffd66b',INK,.4);sign(board,'GROUND',-.52,y+.003,.235,.3,-Math.PI/2,'#3a3d55','#fbf3e2',.36);
    sign(board,'RECEIVER',jr+.08,y+.02,-.235,.32,-1.2,CREAM,INK,.36);sign(board,'DECODER',jd-.08,y+.02,-.235,.32,-1.2,CREAM,INK,.36);
    for(const x of [jr,jd]){part(board,cyl(.045,.045,.05,14),toon(INK),x,y+.02,line);part(board,cyl(.025,.025,.06,12),toon(BRASS),x,y+.03,line);}
    // The shutter latch sits on the decoder end of the line: its lamp shows whether 12 V DC arrives.
    const latch=group(board,.6,y,.06);part(latch,rbox(.24,.1,.2,.04),toon('#e9dcc0'),0,.05,0);this.latchLamp=part(latch,sphere(.042,14,10),GLOW_OFF,0,.13,-.045);
    sign(latch,'LATCH',0,.101,.05,.23,-Math.PI/2,'#e9dcc0',INK,.4);
    // Receiver cable in from the left end, by one of two routes; the lever picks which.
    const cableAt=(pts:number[][])=>new T.CatmullRomCurve3(pts.map(([x,yy,z])=>new T.Vector3(x,yy,z)));
    this.cableNear=part(top,new T.TubeGeometry(cableAt([[-2.2,.02,.56],[-1.7,.06,.58],[-1.15,.06,.56],[-1.02,.07,.3],[bx+jr,.09,bz+line]]),28,.02,6),toon('#e5484d'),0,0,0,false);
    // The clear route runs round the back of the antenna mount, well away from the motor side.
    this.cableClear=part(top,new T.TubeGeometry(cableAt([[-2.2,.02,-.5],[-1.75,.05,-.56],[-1.2,.05,-.58],[-.86,.06,-.42],[-.83,.07,-.08],[bx+jr,.09,bz+line]]),36,.02,6),toon('#e5484d'),0,0,0,false);
    const lever=group(top,-1.22,.04,.36);part(lever,rbox(.26,.06,.16,.04),toon(INK),0,.03,0);this.routeLever=group(lever,0,.06,0);part(this.routeLever,cyl(.014,.014,.18,8),toon(DMETAL),0,.09,0);part(this.routeLever,sphere(.04,12,10),toon('#e5484d'),0,.18,0);
    this.click(lever,'route');this.routeSign=sign(top,'ROUTE: PAST MOTOR',-1.62,.045,.47,.5,-Math.PI/2+.2,'#ffd66b');
    // ---- Can tray, front right: one of each kind (there are always more).
    part(top,rbox(1.1,.03,.64,.05),toon('#cbb488'),1.48,.055,.26);
    KINDS.forEach((k,i)=>{const at=new T.Vector3(1.48+(i-1)*.34,.075,.26);this.trayAt.set(k,at);part(top,rbox(.3,.01,.24,.04),toon('#b99f71'),at.x,.074,at.z,false);
      const m=canMesh(k);m.position.copy(at);top.add(m);this.cans.set(k,m);this.click(m,'pick',k);});
    
    // ---- Antenna, back left: a ground-plane disc with the fitted whip, spare whips stood in a rack.
    const mount=group(top,-1.12,.04,-.3);part(mount,cyl(.2,.22,.04,24),toon(DMETAL),0,.02,0);part(mount,cyl(.05,.06,.08,14),toon(BRASS),0,.08,0);
    this.whip=group(mount,0,.12,0);this.whipRod=part(this.whip,cyl(.014,.014,1,8),toon('#dfe3ea'),0,.5,0);this.whipTip=part(this.whip,sphere(.026,10,8),toon(INK),0,1,0);
    this.click(mount,'orient');sign(top,'ANTENNA',-1.12,.07,-.02,.34,-1.2,CREAM,INK,.34);
    const rack=group(top,-1.72,.04,.1);part(rack,rbox(.78,.05,.5,.04),toon('#8a6a3c'),0,.025,0);
    ROD_IDS.forEach((id,k)=>{const x=-.29+k*.193,z=-.08,r=group(rack,x,.05,z);const len=rodLen(id);part(r,cyl(.03,.03,.04,10),toon(INK),0,.02,0);part(r,cyl(.012,.012,len,8),toon('#dfe3ea'),0,len/2,0);part(r,sphere(.022,8,6),toon(INK),0,len,0);
      this.rods.set(id,r);this.click(r,'rod',id);});
    // The rack marks each whip's length only: which one suits a frequency is for c = f λ to say.
    ROD_IDS.forEach((id,k)=>{const s=sign(rack,RODS[id].label,0,0,0,.185,-1.2,CREAM,INK,.5);s.position.set(-.29+k*.193,.1,.14);});
    // ---- Scope, back centre: a cream cabinet with a live canvas screen; mode buttons and the speaker below it.
    const scope=group(top,.12,.04,-.33);part(scope,rbox(1.72,.1,.54,.06),toon('#3a3563'),0,.05,0);
    const body=group(scope,0,.1,-.08);body.rotation.x=-.5;part(body,rbox(1.6,1.0,.22,.08),toon('#e9dcc0'),0,.5,0);part(body,box(1.46,.86,.03),toon(INK),0,.52,.11);
    this.scopeCanvas=document.createElement('canvas');this.scopeCanvas.width=800;this.scopeCanvas.height=480;this.scopeTex=new T.CanvasTexture(this.scopeCanvas);this.scopeTex.colorSpace=T.SRGBColorSpace;this.scopeTex.anisotropy=4;
    const screenMat=new T.MeshBasicMaterial({map:this.scopeTex,toneMapped:false});screenMat.userData.outlineParameters={visible:false};
    const screen=part(body,new T.PlaneGeometry(1.4,.84),screenMat,0,.52,.128,false);screen.userData.noAO=true;
    part(body,box(1.62,.05,.24),toon(BRASS),0,1.02,0);
    (['signal','step'] as const).forEach((m,k)=>{const b=part(scope,rbox(.35,.05,.14,.04),toon(CREAM),-.62+k*.38,.12,.2);this.modeButtons.push(b);this.click(b,'scope',m);
      sign(b,m==='signal'?'SIGNAL':'SWITCH-ON',0,.027,0,.33,-Math.PI/2,CREAM,INK,.38).position.set(0,.027,0);});
    const spk=group(scope,.14,.1,.18);part(spk,cyl(.1,.1,.04,20),toon(INK),0,.02,0);this.speakerCone=part(spk,cyl(.075,.04,.03,20),toon('#c9b98f'),0,.045,0);this.click(spk,'listen');
    sign(scope,'SPEAKER',0,.101,.18,.3,-Math.PI/2,CREAM,INK,.38).position.set(.42,.101,.2);
    // ---- LOG button, back right.
    const log=group(top,1.25,.04,-.36);part(log,cyl(.17,.19,.06,24),toon(INK),0,.03,0);part(log,cyl(.13,.13,.06,24),toon('#6cc58a'),0,.08,0);this.click(log,'log');
    sign(log,'LOG',0,.112,0,.24,-Math.PI/2,'#fffaf0',INK,120/256);
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}
  /** A motor drum with a spinning fan rides on the cart prop (props are batched, so it follows the body). */
  private buildMotor(){
    const m=this.motor;part(m,cyl(.2,.2,.42,20,'x'),toon('#e5484d'),0,.2,0);for(const x of [-.23,.23])part(m,cyl(.21,.21,.04,20,'x'),toon(INK),x,.2,0);
    this.fan=group(m,.27,.2,0);for(let k=0;k<4;k++){const b=part(this.fan,box(.02,.28,.06),toon(CREAM),0,0,0);b.rotation.x=k*Math.PI/4;}
    part(m,box(.5,.04,.3),toon(DMETAL),0,0,0);sign(m,'MOTOR',0,.43,0,.3,-.6,'#ffd66b');
  }

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const j=this.current(),a=this.game.audio;if(!j)return false;
    switch(name){
      case 'pick':{const k=arg as Kind;if(!KINDS.includes(k))return false;
        if(this.held===k){this.held=undefined;a.tone(380,.05,.03,'triangle');break;}this.held=k;a.pop();break;}
      case 'slot':{const s=arg as Slot;if(s!=='series'&&s!=='shunt')return false;
        if(this.held){const keep=this[s]?.kind===this.held?this[s]!.value:DEFAULT[this.held];this[s]=can(this.held,keep);this.held=undefined;this.knobSlot=s;a.plug();break;}
        if(this[s]){this[s]=undefined;if(this.knobSlot===s)this.knobSlot=undefined;a.tone(300,.06,.04,'triangle');break;}
        a.voice('hm',1.4);return false;}
      case 'value':{const {slot,value}=arg as {slot:Slot;value:number};const p=this[slot];if(!p)return false;this[slot]=can(p.kind,snap(p.kind,value));this.knobSlot=slot;a.tone(500,.03,.02,'triangle');break;}
      case 'turn':{const {slot,steps}=arg as {slot?:Slot;steps:number};const sl=slot??this.knobSlot,p=sl&&this[sl];if(!sl||!p)return false;
        const list=VALUES[p.kind],i=Math.max(0,Math.min(list.length-1,list.indexOf(p.value)+steps));if(list[i]===p.value)return false;
        this[sl]=can(p.kind,list[i]);this.knobSlot=sl;a.tone(380+i*22,.025,.02,'triangle');break;}
      case 'clear':{if(!this.series&&!this.shunt&&!this.held)return false;this.series=this.shunt=this.held=undefined;a.clatter();break;}
      case 'route':{this.rerouted=!this.rerouted;a.noise(.05,.05,2400,'highpass');a.tone(this.rerouted?520:330,.08,.04,'triangle');
        if(j.cart)this.say(this.rerouted?'Cable rerouted clear of the motor: it picks up about half the noise (−6 dB).':'Cable back along the motor tray: it picks up more noise.');break;}
      case 'rod':{const id=arg as RodId;if(!RODS[id])return false;this.rod=id;a.tone(900,.05,.03);a.pop();break;}
      case 'orient':{this.vertical=!this.vertical;a.tone(this.vertical?600:450,.08,.04,'triangle');break;}
      case 'listen':{this.listening=!this.listening;a.pop();break;}
      case 'scope':{const m=arg as 'signal'|'step';this.scopeMode=m==='step'?'step':'signal';this.stepAnim=0;a.tone(m==='step'?700:560,.05,.03);
        if(this.scopeMode==='step')this.say(this.stepCaption());break;}
      case 'log':{const v=judge(j,this.state()),c=cost(this.state());
        if(v.tier===0){this.mistakes++;this.spent+=c;this.say(`The decode fails: ${v.problems[0]}`,'bad');a.tone(160,.25,.06,'square');a.voice('groan',1);this.game.alarm({x:this.table.x,z:this.table.z},3);return true;}
        this.logged.push({job:j.id,verdict:v});this.spent+=c;
        this.say(`“${j.message}” · ${['','Decodes','Reliable','Elegant'][v.tier]} (S/N ${v.snr} dB)${v.notes[0]?` · ${v.notes[0]}`:''}`,'ok');
        a.cheer();a.bell(1319,.5,.05);cheer(this.game,this,'#ffd66b');
        this.jobIndex++;if(this.current()?.beacon)this.gust();this.redraw();return true;}
      default:return false;
    }
    this.redraw();return true;
  }
  /** A gust over the roof knocks the whip flat (the beacon's polarisation then matters). */
  private gust(){this.vertical=false;const a=this.game.audio;a.noise(.6,.06,700,'lowpass');const m=this.top.localToWorld(new T.Vector3(-1.12,.2,-.3));this.game.burst(m,'#e9dcc0',8,'dust');}
  stepCaption(){const s=this.series,p=this.shunt;
    if(s?.kind==='L')return 'Switch-on: the coil\'s current can\'t jump. It ramps up (ringing as the capacitor charges), then carries steady DC to the latch.';
    if(s?.kind==='C')return 'Switch-on through a series capacitor: a brief charging current, then it dies away. No steady DC reaches the latch.';
    if(p?.kind==='C')return 'Switch-on: the shunt capacitor charges through the cable, so the latch voltage rises smoothly.';
    return 'Switch-on with no coil or capacitor in the way: the current jumps straight to its final value.';}

  /** The same idea in a few words, for the scope screen. */
  stepShort(){const s=this.series,p=this.shunt;
    if(s?.kind==='L')return 'Coil current ramps up (it can\'t jump), then carries steady DC.';
    if(s?.kind==='C')return 'Series C: a brief charging current, then no DC at all.';
    if(s?.kind==='R')return 'Series R: current jumps, but the latch only gets part of the 12 V.';
    if(p?.kind==='C')return 'Shunt C charges: the voltage rises smoothly to full DC.';
    return 'No coil: the current jumps straight to its final value.';}
  // ---------- drawing ----------
  redraw(){
    for(const k of KINDS){const m=this.cans.get(k)!;m.position.copy(this.trayAt.get(k)!);if(this.held===k)m.position.y+=.08;}
    for(const s of ['series','shunt'] as const){const p=this[s],cur=this.slotCans[s];
      if(cur&&cur.kind!==p?.kind){this.top.remove(cur.g,cur.tag);this.clickables=this.clickables.filter(c=>c.obj!==cur.g);delete this.slotCans[s];}
      if(p&&!this.slotCans[s]){const g=canMesh(p.kind,true);g.position.copy(this.slotAt[s]);g.rotation.y=s==='shunt'?Math.PI/2:0;this.top.add(g);
        // The tag stands on the bench in front of the can, upright to the camera whichever way the can is turned.
        const tag=sign(this.top,'',0,0,0,.26,-1.2,CREAM,INK,.5);tag.position.copy(this.slotAt[s]).add(new T.Vector3(s==='shunt'?-.2:-.04,.06,s==='shunt'?.04:.14));tag.renderOrder=2;
        this.slotCans[s]={kind:p.kind,g,tag};this.click(g,'knob',s);}
      const sc=this.slotCans[s];if(p&&sc){const fc=corner(s,p),pass=passes(s,p);
        (sc.tag.material as T.MeshBasicMaterial).map=valueTag(valueText(p),fc?`${pass==='low'?'↓':'↑'} ${hz(fc)}`:'divider',pass==='low'?'#2f7a5b':pass==='high'?'#b0406a':'#6b7385');
        const i=VALUES[p.kind].indexOf(p.value);(sc.g.getObjectByName('knob')!).rotation.y=-(i/(VALUES[p.kind].length-1))*Math.PI*1.5+Math.PI*.75;}}
    this.links.series.visible=!this.series;this.links.shunt.visible=!this.shunt;
    for(const s of ['series','shunt'] as const)(this.slotPads[s].material as T.Material)=toon(this.held?'#ffd66b':'#1d2438');
    this.routeLever.rotation.z=this.rerouted?-.5:.5;(this.routeSign.material as T.MeshBasicMaterial).map=routeLabel(this.rerouted);this.cableNear.visible=!this.rerouted;this.cableClear.visible=this.rerouted;
    const len=rodLen(this.rod);this.whipRod.scale.y=len;this.whipRod.position.y=len/2;this.whipTip.position.y=len;
    this.whip.rotation.z=this.vertical?0:-Math.PI/2;
        this.rods.forEach((r,id)=>r.visible=id!==this.rod);
    this.modeButtons.forEach((b,k)=>b.position.y=(k===0)===(this.scopeMode==='signal')?.12:.14);
    this.speakerCone.material=toon(this.listening?'#ffd66b':'#8a8170');
    const r=read(this.current()??JOBS[JOBS.length-1],this.state());this.latchLamp.material=r.latchOk?GLOW_ON:GLOW_OFF;
    this.shown='';if(this.ready)this.updatePanel();
  }
  /** Scope screen: live decoder trace, the spectrum before/after the filter, and the decode line. */
  private drawScope(){
    const c=this.scopeCanvas.getContext('2d')!,W=this.scopeCanvas.width,H=this.scopeCanvas.height,j=this.current()??JOBS[JOBS.length-1],s=this.state(),r=read(j,s),time=this.game.time;
    const font=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`,TOP=270,BOT=H-64;
    c.fillStyle='#101a33';c.fillRect(0,0,W,H);c.strokeStyle='rgba(140,170,255,.13)';c.lineWidth=2;
    for(let x=0;x<=W;x+=W/8){c.beginPath();c.moveTo(x,0);c.lineTo(x,TOP);c.stroke();}for(let y=0;y<=TOP;y+=TOP/5){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
    if(this.scopeMode==='signal'){
      // 4 ms of the decoder's input: the keyed tone plus whatever noise gets through.
      const {marks,length}=morse(j.message),u=(time/DOT)%length,on=marks.some(([a,l])=>u>=a&&u<a+l);
      c.strokeStyle='#ffd66b';c.lineWidth=4;c.beginPath();
      for(let x=0;x<=W;x+=2){const t=x/W*4e-3;let v=on?r.tones[0].after*Math.sin(2*Math.PI*j.fs*t):0;
        r.tones.slice(1).forEach((n,k)=>{v+=n.after*Math.sin(2*Math.PI*n.f*t+k*1.7+time*(3+k));});
        const y=TOP/2+14-Math.max(-2.1,Math.min(2.1,v))*55;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
      c.fillStyle=on?'#8dffb0':'rgba(255,255,255,.45)';c.font=font(32);c.fillText(on?'TONE ●':'TONE ○',18,40);c.fillStyle='rgba(255,255,255,.6)';c.textAlign='right';c.fillText('4 ms',W-16,40);c.textAlign='left';
      // Spectrum on a log axis 200 Hz – 50 kHz: faint bars before the filter, bright after, and the filter's |H(f)|.
      const fx=(f:number)=>24+(Math.log10(f/200)/Math.log10(250))*(W-48),by=BOT-30,bh=112;
      c.fillStyle='#16224a';c.fillRect(0,TOP,W,BOT-TOP);
      c.strokeStyle='#b8a6f5';c.lineWidth=4;c.beginPath();for(let x=24;x<=W-24;x+=4){const f=200*10**((x-24)/(W-48)*Math.log10(250)),g=Math.min(1.35,gain(s,f));const yy=by-g*bh*.7;x>24?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();
      for(const tn of r.tones){const x=fx(tn.f),hb=Math.min(1.35,tn.before)*bh*.7,ha=Math.min(1.35,tn.after)*bh*.7;
        c.fillStyle='rgba(255,255,255,.2)';c.fillRect(x-9,by-hb,18,hb);c.fillStyle=tn.signal?'#8dffb0':'#ff7a8a';c.fillRect(x-6,by-ha,12,ha);}
      c.fillStyle='rgba(255,255,255,.7)';c.font=font(24,600);for(const [f,l] of [[1e3,'1 kHz'],[1e4,'10 kHz']] as const)c.fillText(l,fx(f)-30,BOT-4);
      // Each can's corner frequency, as a line across the spectrum (it sweeps as the knob turns).
      for(const sl of ['series','shunt'] as const){const pt=s[sl],fc=pt&&corner(sl,pt);if(!fc||fc<200||fc>5e4)continue;const x=fx(fc),col=passes(sl,pt!)==='low'?'#8dffb0':'#ff9ec6';
        c.setLineDash([10,8]);c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.moveTo(x,TOP+40);c.lineTo(x,BOT-24);c.stroke();c.setLineDash([]);
        c.fillStyle=col;c.font=font(24);c.textAlign='center';c.fillText(hz(fc),x,TOP+62+(sl==='shunt'?26:0));c.textAlign='left';}
      c.font=font(24,600);c.fillStyle='#b8a6f5';c.fillText('filter',W-90,TOP+30);c.fillStyle='#8dffb0';c.fillText('message',W-300,TOP+30);c.fillStyle='#ff7a8a';c.fillText('noise',W-180,TOP+30);
      // Decode line.
      const col=r.snr>=SPEC.reliableSnr?'#8dffb0':r.snr>=SPEC.decodeSnr?'#ffd66b':'#ff7a8a';
      c.fillStyle='#0b1226';c.fillRect(0,BOT,W,H-BOT);c.font=font(36);c.fillStyle=col;c.fillText(`S/N ${r.snr.toFixed(1)} dB`,18,H-18);
      c.fillStyle='#fbf3e2';c.font=font(40,600);c.fillText(decoded(j.message,r.snr,Math.floor(time/1.2)),300,H-17);
    }else{
      const key=JSON.stringify([s.series,s.shunt]);if(this.stepCache?.key!==key){const span=stepSpan(s);this.stepCache={key,span,data:stepResponse(s,span)};}
      const {data,span}=this.stepCache,n=Math.floor(data.length*Math.min(1,this.stepAnim)),iMax=Math.max(.001,...data.map(p=>Math.abs(p.i)));
      const base=TOP-16,px=(k:number)=>24+k/(data.length-1)*(W-48);
      c.fillStyle='rgba(255,255,255,.25)';c.fillRect(0,base,W,2);
      c.strokeStyle='#ffd66b';c.lineWidth=5;c.beginPath();data.slice(0,n).forEach((p,k)=>{const y=base-p.v/16*(base-50);k?c.lineTo(px(k),y):c.moveTo(px(k),y);});c.stroke();
      c.strokeStyle='#7fd8ff';c.beginPath();data.slice(0,n).forEach((p,k)=>{const y=base-p.i/iMax*(base-90);k?c.lineTo(px(k),y):c.moveTo(px(k),y);});c.stroke();
      c.setLineDash([12,10]);c.strokeStyle='rgba(141,255,176,.7)';c.lineWidth=3;const ly=base-CIRCUIT.latchMin/16*(base-50);c.beginPath();c.moveTo(24,ly);c.lineTo(W-24,ly);c.stroke();c.setLineDash([]);
      c.font=font(30);c.fillStyle='#ffd66b';c.fillText('latch volts',18,40);c.fillStyle='#7fd8ff';c.fillText('line current',220,40);c.fillStyle='rgba(141,255,176,.9)';c.textAlign='right';c.fillText(`latch needs ${CIRCUIT.latchMin} V`,W-18,ly+32);c.textAlign='left';
      c.fillStyle='#16224a';c.fillRect(0,TOP,W,H-TOP);c.fillStyle='rgba(255,255,255,.7)';c.font=font(26,600);c.fillText(`0 → ${span>=2e-3?(span*1e3).toFixed(0):(span*1e3).toFixed(1)} ms after the 12 V switches on`,18,TOP+34);
      c.fillStyle='#fbf3e2';c.font=font(32,600);const words=this.stepShort().split(' ');let line='',yy=TOP+84;
      for(const w of words){if(c.measureText(line+w).width>W-36){c.fillText(line,18,yy);line='';yy+=40;}line+=w+' ';}c.fillText(line,18,yy);
    }
    this.scopeTex.needsUpdate=true;
  }
  /** Board-plane x under the pointer (for turning a knob by dragging sideways). */
  private planeX(ray:T.Raycaster){const y=this.table.y+.1,hit=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-y),new T.Vector3());return hit?.x;}
  pointer(e:Pointer){
    // Turning a knob: drag sideways; every 4 cm is one step along the E6 values.
    if(this.turning){const x=this.planeX(e.ray),t=this.turning,p=this[t.slot];
      if(x!==undefined&&p){const list=VALUES[p.kind],i=Math.max(0,Math.min(list.length-1,t.i0+Math.round((x-t.x0)/.04)));if(list[i]!==p.value)this.act('value',{slot:t.slot,value:list[i]});}
      if(e.kind==='up')this.turning=undefined;return;}
    const hits=e.ray.intersectObjects(this.clickables.map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.1);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found){
      // A slotted can: holding a can swaps it in; otherwise grab its knob and turn.
      if(found.act==='knob'){const sl=found.arg as Slot,p=this[sl];if(this.held){this.act('slot',sl);return;}
        const x=this.planeX(e.ray);if(p&&x!==undefined){this.knobSlot=sl;this.turning={slot:sl,x0:x,i0:VALUES[p.kind].indexOf(p.value)};}return;}
      this.act(found.act,found.arg);}
  }
  key(code:string){
    const map:Record<string,[string,unknown?]>={Digit1:['pick','R'],Digit2:['pick','L'],Digit3:['pick','C'],ArrowLeft:['turn',{steps:-1}],ArrowRight:['turn',{steps:1}],
      KeyS:['slot','series'],KeyH:['slot','shunt'],KeyR:['route'],KeyO:['orient'],KeyL:['listen'],KeyT:['scope',this.scopeMode==='signal'?'step':'signal'],Enter:['log'],Backspace:['clear']};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;this.turning=undefined;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';}
  update(dt:number){
    if(!this.ready)this.setup();
    // The motor rides on its cart; its noise falls with distance from the receiver.
    if(this.cart){const p=this.cart.body.translation(),q=this.cart.body.rotation();this.motor.position.set(p.x,p.y+.33,p.z);this.motor.quaternion.set(q.x,q.y,q.z,q.w);
      this.cartDistance=+Math.hypot(p.x-RX.x,p.z-RX.z).toFixed(2);if(this.cartDistance>=CART_SAFE&&this.game.held!==this.cart)this.cartMoved=true;
      const running=!!this.current()?.cart;this.fan.rotation.x+=dt*(running?40:4);
      this.sparkClock-=dt;if(running&&this.sparkClock<=0){this.sparkClock=.5+Math.random()*.6;this.game.burst({x:p.x,y:p.y+.55,z:p.z},'#9fd8ff',3,'spark');}}
    this.stepAnim=Math.min(1,this.stepAnim+dt*.8);
    this.scopeClock-=dt;if(this.scopeClock<=0){this.scopeClock=1/15;this.drawScope();}
    this.updateSound();
    this.updatePanel();
  }

  // ---------- the decoder's speaker ----------
  private updateSound(){
    const a=this.game.audio,c=a.context;if(!c)return;
    if(!this.sound){const out=c.createGain();out.gain.value=0;out.connect(c.destination);
      const osc=c.createOscillator();osc.frequency.value=700;const tone=c.createGain();tone.gain.value=0;osc.connect(tone).connect(out);osc.start();
      // Motor commutator noise is a buzz rich in harmonics: a sawtooth's harmonics fall as 1/k, like the model's.
      const buzzOsc=c.createOscillator();buzzOsc.type='sawtooth';const buzz=c.createGain();buzz.gain.value=0;buzzOsc.connect(buzz).connect(out);buzzOsc.start();
      const buf=c.createBuffer(1,c.sampleRate,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      const src=c.createBufferSource();src.buffer=buf;src.loop=true;const hiss=c.createGain();hiss.gain.value=0;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=3000;src.connect(hp).connect(hiss).connect(out);src.start();
      this.sound={out,tone,buzz,buzzOsc,hiss};}
    const j=this.current(),live=!!j&&this.active&&this.listening&&!a.muted&&this.game.running&&!this.game.paused&&!this.game.won,t=c.currentTime,snd=this.sound;
    snd.out.gain.setTargetAtTime(live?1:0,t,.05);if(!j||!live)return;
    const r=read(j,this.state()),{marks,length}=morse(j.message),u=(this.game.time/DOT)%length,on=marks.some(([s,l])=>u>=s&&u<s+l);
    snd.tone.gain.setTargetAtTime(on?Math.min(.08,.06*r.tones[0].after):0,t,.006);
    const fund=r.tones[1];if(fund){snd.buzzOsc.frequency.setTargetAtTime(fund.f,t,.05);snd.buzz.gain.setTargetAtTime(Math.min(.05,.025*fund.after),t,.05);}
    snd.hiss.gain.setTargetAtTime(Math.min(.04,.02*r.noise),t,.05);
  }

  // ---------- panels ----------
  private say(text:string,tone:'ok'|'bad'|'info'='info'){
    if(!this.toast){this.toast=document.createElement('div');this.toast.className='station-toast';this.layer()?.append(this.toast);}
    this.toast.textContent=text;this.toast.dataset.tone=tone;this.toast.hidden=false;this.toastUntil=this.game.time+Math.max(4,text.length*.06);
  }
  private layer(){return document.querySelector<HTMLElement>('[data-layer="hud"]');}
  private updatePanel(){
    if(this.toast&&!this.toast.hidden&&this.game.time>this.toastUntil&&this.game.running)this.toast.hidden=true;
    const j=this.current(),s=this.state(),r=j&&read(j,s);
    const key=JSON.stringify([this.active,this.jobIndex,s.series,s.shunt,s.rerouted,s.rod,s.vertical,this.held,Math.round(this.cartDistance*2),r?.snr]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel';this.layer()?.append(this.panel);}
    this.panel.hidden=!j;if(!j||!r)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const slotText=(sl:Slot)=>{const p=this[sl];if(!p)return sl==='series'?'wire link':'—';const fc=corner(sl,p);return `${valueText(p)} ${p.kind}${fc?` · ${passes(sl,p)}-pass ${hz(fc)}`:''}`;};
    this.panel.innerHTML=`<header><small>TRANSMISSION ${this.jobIndex+1}/${JOBS.length}</small><h4>${j.title}</h4><p>${j.ask}</p></header>`+
      (this.active?`<ul class="build">${row('Series',slotText('series'))}${row('Shunt',slotText('shunt'))}${row('Filter',filterName(s))}`+
        (j.cart?`${row('Motor cart',`${this.cartDistance.toFixed(1)} m away`,this.cartDistance>=CART_SAFE)}${row('Cable',this.rerouted?'clear of the motor':'past the motor',this.rerouted)}`:'')+
        (j.beacon?row('Antenna',`${RODS[this.rod].label} · ${this.vertical?'upright':'flat'}`,r.antenna>=.3):'')+
        `${row('Tone level',`${Math.round(r.level*100)}%`,r.level>=SPEC.minLevel)}${row('Signal/noise',`${r.snr.toFixed(1)} dB`,r.snr>=SPEC.reliableSnr)}`+
        row('Latch',`${r.latch.toFixed(1)} V${j.latch?'':' (not needed yet)'}`,j.latch?r.latchOk:undefined)+`${row('Parts cost',String(cost(s)))}</ul>`+
        `<p class="profile">Decoder: S/N ≥ ${SPEC.decodeSnr} dB decodes, ≥ ${SPEC.reliableSnr} dB is reliable; latch needs ≥ ${CIRCUIT.latchMin} V. Game tuning values.</p>`:'');
  }
  prompt(atBench:boolean):Prompt|null{
    const j=this.current();if(!j)return null;
    if(!atBench){const p=this.game.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6;
      if(this.game.held===this.cart&&this.cart)return {key:'E',text:this.cartDistance>=CART_SAFE?'Set the cart down':'Keep rolling it away'};
      if(near)return {key:'E',text:'Work at the bench'};
      return null;}
    const h=this.hovered;
    if(this.turning||h?.act==='knob')return {key:'Drag',text:this.held?'Swap the can in':'Turn the knob'};
    if(this.held)return {key:'S / H',text:'Plug it in'};
    if(h?.act==='pick')return {key:String(KINDS.indexOf(h.arg as Kind)+1),text:`Take a ${KIND_NAME[h.arg as Kind].toLowerCase()}`};
    if(h?.act==='rod')return {key:'Click',text:'Fit this whip'};
    if(h?.act==='orient')return {key:'O',text:this.vertical?'Lay the whip flat':'Stand the whip up'};
    if(h?.act==='route')return {key:'R',text:'Move the cable'};
    const r=read(j,this.state());
    if(r.snr>=SPEC.reliableSnr&&r.level>=SPEC.minLevel&&(!j.latch||r.latchOk)&&(!j.beacon||r.antenna>=.3))return {key:'Enter',text:'Log the decode'};
    return this.knobSlot&&this[this.knobSlot]?{key:'← →',text:'Turn the knob'}:{key:'1–3',text:'Take a can'};
  }
  complete(){return this.logged.length>=JOBS.length;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){const j=this.current();return {job:this.jobIndex,logged:this.logged.map(l=>({job:l.job,tier:l.verdict.tier,snr:l.verdict.snr})),series:this.series??null,shunt:this.shunt??null,held:this.held??null,knob:this.knobSlot??null,rerouted:this.rerouted,rod:this.rod,vertical:this.vertical,
    cartDistance:this.cartDistance,cartMoved:this.cartMoved,mistakes:this.mistakes,spent:this.spent,reading:j?read(j,this.state()):undefined,scope:this.scopeMode,listening:this.listening};}
}
