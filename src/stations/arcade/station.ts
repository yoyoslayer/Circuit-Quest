// Overheating Arcade service bench. The broken cabinet's LED channel is opened up on the bench:
// SUPPLY → resettable FUSE → SERIES slot → LED (or, for the coin hopper, a transistor's base), with an
// ACROSS slot wired straight across the LED. Pip takes resistor blocks from the rack (value and
// power rating), fits them, flips the LED if it is in backwards, and switches the POWER on. The meter
// shows current, the resistor's voltage and power, brightness against the band, heat, and battery
// life. A channel must run in spec for ten seconds before it can be signed off. Too much current
// trips the fuse (click, TILT, RESET); a resistor over its rating scorches. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressArcade,type ArcadeRoom} from './room';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,INK,DMETAL} from '../../render/kit';
import {hot} from '../../render/actors';
import {JOBS,RACK,RATINGS,RATING_LABEL,RATING_COST,HOUSE,read,judge,best,mA,ohms,watts,partsCost,TIER_WORD,
  type Job,type Part,type Rating,type Setup,type Reading,type Verdict,type LedColor} from './logic';
import './arcade.css';

const CREAM='#fbf3e2',PLUM='#3b2346',PINK='#ff7eb6',MINT='#6fe0c0',LEMON='#ffd84d',GRAPE='#9b7bf0';
const LED_HEX:Record<LedColor,string>={red:'#ff4b5c',green:'#4dff88',blue:'#4d9bff',white:'#fff6e0'};
/** The bench's contents sit a little left of the camera's centre (the order card is on the right). */
const OX=-.2;
/** Board layout (board-local metres): the top rail carries the supply, the bottom rail is ground. */
const BW=2.1,BD=.74,TOPZ=-.2,GNDZ=.16,MIDZ=(TOPZ+GNDZ)/2,LABZ=.29,SUPX=-.88,FUSEX=-.55,SERX=-.12,LEDX=.34,ACRX=.82;
const BOARD={x:.12,z:.16};
const RACKAT={x:-1.5,z:.12},METER={x:.1,z:-.56},POWERAT={x:1.36,z:.38};
const decade=(r:number)=>r<100?'#ffa6c9':r<1000?'#9ff0d2':'#c7b6ff';
const BAND_COLORS=['#1d1d24','#8a4b2a','#e5484d','#ff8a3d','#ffd84d','#3fae5a','#3f7fd6','#8b5cc7','#9aa0ad','#fbfbf6'];

// ---------- canvas helpers ----------
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
function drawPlate(c:CanvasRenderingContext2D,text:string,bg:string,fg:string,w:number,h:number){
  c.clearRect(0,0,w,h);c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(18,h*.25));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
  let size=Math.round(h*.5);c.font=FONT(size);while(size>10&&c.measureText(text).width>w-28){size--;c.font=FONT(size);}
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
const valueText=(r:number)=>r>=1000?`${+(r/1000).toFixed(1)}k`:`${r}`;
/** Colour bands for an E12 value: two digits and a multiplier (plus a gold tolerance band). */
function bands(r:number){const e=Math.floor(Math.log10(r))-1,d=Math.round(r/10**e);return [Math.floor(d/10),d%10,e];}
/** A resistor block: candy body by decade, the part on the back half, its value on the front.
 *  Bigger power ratings are bigger blocks (1 W is a white ceramic power resistor). */
function blockMesh(r:number,rating:Rating){
  const g=new T.Group(),s=rating===.125?.82:rating===.25?1:1.22;
  part(g,rbox(.17*s,.06,.2*s,.03),toon(decade(r)),0,.03,0);
  if(rating===1){part(g,rbox(.13*s,.05,.07,.015),toon('#f4f1ea'),0,.085,-.045*s);}
  else{const body=part(g,cyl(.022*s,.022*s,.11*s,12,'x'),toon('#e8c99a'),0,.085,-.045*s);body.castShadow=false;
    const [a,b,m]=bands(r);[a,b,m].forEach((d,k)=>part(g,cyl(.0235*s,.0235*s,.011,12,'x'),toon(BAND_COLORS[d]),-.03*s+k*.02*s,.085,-.045*s,false));part(g,cyl(.0235*s,.0235*s,.011,12,'x'),toon('#d9a441'),.035*s,.085,-.045*s,false);}
  for(const x of [-.075*s,.075*s])part(g,cyl(.005,.005,.04,6),toon('#c9ced8'),x,.07,-.045*s,false);
  const tag=sign(g,`${valueText(r)} Ω`,0,.061,.045*s,.15*s,-Math.PI/2,CREAM,INK,.075*s);tag.renderOrder=1;
  return g;
}

interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
type Heat={led:number;r:number;p:number};
const HINTS:Record<string,string>={flip:'Flip the LED round (current only flows anode + → cathode −)',power:'POWER the channel on or off',reset:'RESET the fuse after it trips',
  signoff:'SIGN OFF the cabinet once it has run 10 s in spec',clear:'Put the held block back'};

export class ArcadeBench implements Station {
  readonly view={distance:5.9,pitch:.98,lookY:.3};
  readonly limits={time:480,damage:2,cost:0};
  readonly stand={x:0,z:-1.55};readonly table=new T.Vector3(0,1,-2.45);readonly facing=Math.PI;
  index=0;setup:Setup=clone(JOBS[0].start);held?:Part;rating:Rating=.125;powered=false;tripped=false;soak=0;soakDone=false;verdict?:Verdict;
  heat:Heat={led:0,r:0,p:0};served:{job:string;tier:number;cost:number}[]=[];mistakes=0;spent=0;trayReady=false;active=false;trips=0;
  readonly job:StationJob;
  private top=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;private room?:ArcadeRoom;
  private board=new Live(1024,360);private meter=new Live(900,520);private marquee=new Live(512,128);
  private rackBlocks=new Map<number,T.Group>();private rackGroup=new T.Group();private heldMesh?:T.Group;private heldKey='';
  private slotMeshes:{series?:T.Group;parallel?:T.Group}={};private slotKeys={series:'',parallel:''};private link!:T.Object3D;
  private ledGroup=new T.Group();private ledDome!:T.Mesh;private ledHalo!:T.Sprite;private ledLight!:T.PointLight;private transistor=new T.Group();private motor=new T.Group();private coin!:T.Object3D;
  private fuseDisc!:T.Mesh;private resetBtn!:T.Object3D;private lever!:T.Object3D;private powerLamp!:T.Mesh;private signBtn!:T.Mesh;private ratingBtns:T.Object3D[]=[];
  private cabLamp!:T.Mesh;private ledOn=unlitMat();private cabOn=unlitMat();private hotMats={series:unlitMat(),parallel:unlitMat()};private screenOn=hot('#3a2b58',1.2);private screenOff=toon('#241a33');private lampOff=toon('#5a4a60');private cabHalo!:T.Sprite;private cabScreen!:T.Mesh;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';private tripT=0;private spin=0;private flicker=0;private smokeT=0;
  private tray?:Game['props'][number];private trayRide=new T.Group();private ready=false;
  constructor(private game:Game){
    this.limits.cost=Math.ceil(JOBS.reduce((n,j)=>{const b=best(j);return n+(b?RATING_COST[String(b.rating)]:0);},0)*1.25);
    this.job={goal:'Fix five arcade cabinets with the right resistor',
      steps:[
        {text:'Carry the tray of resistor blocks from the storeroom to the service bench',done:()=>this.trayReady,at:()=>this.tray?.body.translation()??this.stand},
        {text:'Step up to the service bench (E)',done:()=>this.active||this.served.length>0,at:()=>this.stand},
        ...JOBS.map((j,i)=>({text:`${j.title}: ${j.ask}`,done:()=>this.served.length>i,at:()=>this.stand}))],
      bonuses:[
        {text:'Every cabinet works reliably (in band, 60 % margin)',ok:()=>this.served.every(s=>s.tier>=2)},
        {text:'Elegant: least wasted power every time',ok:()=>this.served.every(s=>s.tier===3)},
        {text:'Fuse tripped no more than once',ok:()=>this.trips<=1}]};
    game.root.add(this.top);this.top.position.copy(this.table).add(new T.Vector3(OX,0,0));
    this.build();this.showJob();
  }
  dress(kit:RoomKit){const r=dressArcade(this.game,kit);this.room=r;return {lightUp:r.lightUp};}
  current():Job|undefined{return JOBS[this.index];}
  reading():Reading|undefined{const j=this.current();return j&&read(j,this.setup);}

  // ---------- the bench ----------
  private build(){
    const g=this.game,t=this.table,W=4.3,D=1.45,cx=t.x+OX,top=this.top;
    // Bench: plum cabinet with candy trim, pale wood top, a pink felt mat under the channel board.
    part(g.decorRoot,rbox(W,.94,D,.07),toon('#f1e4cc'),cx,.47,t.z);part(g.decorRoot,box(W-.1,.1,D-.08),toon(PLUM),cx,.05,t.z+.02);
    part(g.decorRoot,rbox(W+.1,.07,D+.1,.05),toon('#ecd6ad'),cx,.975,t.z);part(g.decorRoot,box(W+.08,.035,.03),toon(PINK),cx,.94,t.z+D/2+.05);
    for(let k=0;k<4;k++)part(g.decorRoot,box(.95,.54,.02),toon(['#ffd1e3','#cdf5e6','#fff0b8','#e3d9ff'][k]),cx-1.5+k*1,.5,t.z+D/2+.005);
    this.solid(W,1,D,cx,.5,t.z);
    part(top,rbox(2.3,.012,.92,.06),toon('#f7b7d2'),BOARD.x,.035,BOARD.z);
    this.buildBoard();this.buildMeter();this.buildRack();this.buildPower();this.buildCabinet();
  }
  /** The channel board: printed rails, the fuse with its RESET, the SERIES and ACROSS slots, and the LED. */
  private buildBoard(){
    const b=group(this.top,BOARD.x,.045,BOARD.z);
    part(b,rbox(BW,.03,BD,.05),toon('#2f7a5b'),0,.015,0);
    const face=part(b,new T.PlaneGeometry(BW-.04,BD-.04),new T.MeshBasicMaterial({map:this.board.tex}),0,.031,0,false);face.rotation.x=-Math.PI/2;(face.material as T.Material).userData.outlineParameters={visible:false};face.userData.noAO=true;
    // Supply terminal: two brass posts (+ on the top rail, − on ground).
    for(const [z,c] of [[TOPZ,'#e5484d'],[GNDZ,'#2b2d42']] as const){part(b,cyl(.04,.045,.05,14),toon(c),SUPX,.055,z);part(b,cyl(.022,.022,.04,10),toon('#d9a441'),SUPX,.09,z);}
    // Resettable fuse (a yellow PTC disc) and its RESET button.
    this.fuseDisc=part(b,cyl(.06,.06,.03,20,'z'),toon(LEMON),FUSEX,.09,TOPZ);part(b,cyl(.006,.006,.06,6),toon('#c9ced8'),FUSEX-.03,.055,TOPZ,false);part(b,cyl(.006,.006,.06,6),toon('#c9ced8'),FUSEX+.03,.055,TOPZ,false);
    this.click(this.fuseDisc,'reset');
    const rb=group(b,FUSEX,.03,MIDZ+.03);part(rb,cyl(.055,.06,.03,18),toon(INK),0,.015,0);this.resetBtn=part(rb,cyl(.042,.042,.035,18),toon('#ff6b6b'),0,.045,0);this.click(rb,'reset');
    // SERIES slot pad (a wire link bridges it when empty) and the ACROSS slot straight across the LED.
    const sp=part(b,rbox(.36,.012,.2,.04),toon('#173a2c'),SERX,.036,TOPZ);this.click(sp,'slot','series');
    const link=group(b,SERX,.036,TOPZ);part(link,cyl(.009,.009,.3,6,'x'),toon('#dfe3ea'),0,.03,0,false);for(const x of [-.15,.15])part(link,cyl(.009,.009,.03,6),toon('#dfe3ea'),x,.015,0,false);this.link=link;
    const ap=part(b,rbox(.2,.012,.36,.04),toon('#173a2c'),ACRX,.036,MIDZ);this.click(ap,'slot','parallel');
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
    sign(tr,'NPN',0,.1,.042,.1,0,'#2b2d42',CREAM,.04);
    const mo=this.motor;this.top.add(mo);mo.position.set(1.1,.04,-.46);part(mo,rbox(.42,.05,.34,.04),toon(PLUM),0,.025,0);sign(mo,'HOPPER MOTOR',0,.052,.13,.34,-Math.PI/2,LEMON,INK,.07);
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
  /** The resistor rack (appears once the tray arrives): E12 blocks, three rows, and the rating buttons. */
  private buildRack(){
    const r=this.rackGroup;this.top.add(r);r.position.set(RACKAT.x,.04,RACKAT.z);
    part(r,rbox(.98,.04,.72,.05),toon('#e9c38e'),0,.02,0);part(r,rbox(1.02,.03,.08,.03),toon(GRAPE),0,.03,-.37);
    RACK.forEach((v,k)=>{const col=k%5,row=Math.floor(k/5),x=-.38+col*.19,z=-.25+row*.2;part(r,rbox(.18,.01,.19,.03),toon('#d2a870'),x,.045,z,false);
      const blk=blockMesh(v,.25);blk.position.set(x,.045,z);r.add(blk);this.rackBlocks.set(v,blk);this.click(blk,'pick',v);});
    // Rating buttons along the front: the next block you pick comes in this size.
    RATINGS.forEach((rt,k)=>{const b=group(r,-.32+k*.32,.04,.43);part(b,rbox(.28,.05,.14,.04),toon(CREAM),0,.025,0);sign(b,RATING_LABEL[String(rt)],0,.052,0,.24,-Math.PI/2,CREAM,INK,.1);this.ratingBtns.push(b);this.click(b,'rating',rt);});
    sign(r,'POWER RATING',0,.042,.3,.4,-Math.PI/2,GRAPE,CREAM,.07);
    r.visible=false;
  }
  /** Bench supply with its big POWER lever, and the SIGN OFF button in front of it. */
  private buildPower(){
    const p=group(this.top,POWERAT.x,.04,POWERAT.z-.18);part(p,rbox(.46,.2,.4,.06),toon(MINT),0,.1,0);part(p,box(.48,.03,.42),toon(PLUM),0,.205,0);
    const lv=group(p,0,.2,-.04);part(lv,rbox(.2,.04,.16,.03),toon(INK),0,.02,0);this.lever=group(lv,0,.04,0);part(this.lever,cyl(.018,.018,.2,10),toon('#c9ced8'),0,.1,0);part(this.lever,sphere(.05,14,10),toon('#e5484d'),0,.21,0);
    this.powerLamp=part(p,sphere(.035,12,8),toon('#5a4a60'),-.16,.23,.12);
    this.click(p,'power');sign(p,'POWER',0,.1,.205,.34,0,MINT,INK,.11);
    const s=group(this.top,POWERAT.x+.52,.04,POWERAT.z+.14);part(s,cyl(.17,.19,.06,24),toon(INK),0,.03,0);this.signBtn=part(s,cyl(.13,.13,.06,24),toon('#8a9a8e'),0,.08,0);this.click(s,'signoff');
    sign(s,'SIGN OFF',0,.112,0,.24,-Math.PI/2,'#fffaf0',INK,.09);
  }
  /** The cabinet being serviced stands at the bench's left end, back open, ribbon cable to the board. */
  private buildCabinet(){
    const t=this.table,c=group(this.game.root,t.x+OX-2.75,0,t.z-.35,.38);
    part(c,rbox(.95,1.2,.8,.08),toon('#ff9fc8'),0,.6,0);part(c,rbox(1,.1,.85,.05),toon(PLUM),0,.05,0);
    const head=group(c,0,1.2,-.05);head.rotation.x=.12;part(head,rbox(.95,.7,.7,.08),toon('#ff9fc8'),0,.35,0);
    this.cabScreen=part(head,box(.72,.46,.03),toon('#241a33'),0,.36,.35);
    part(c,rbox(.97,.08,.5,.03),toon(PLUM),0,1.2,.25);for(const [x,col] of [[-.2,'#e5484d'],[0,LEMON],[.2,'#3f7fd6']] as const)part(c,cyl(.05,.05,.04,16),toon(col),x,1.26,.35);
    const mq=group(c,0,2.02,.05);part(mq,rbox(1,.28,.3,.06),toon(PLUM),0,0,0);const face=part(mq,new T.PlaneGeometry(.92,.23),new T.MeshBasicMaterial({map:this.marquee.tex,toneMapped:false}),0,0,.155,false);(face.material as T.Material).userData.outlineParameters={visible:false};
    this.cabLamp=part(c,sphere(.07,14,10),toon('#5a4a60'),0,1.02,.41);this.cabHalo=glow(c,'rgba(255,140,150,1)',.9,0);this.cabHalo.position.set(0,1.02,.5);
    const cable=new T.CatmullRomCurve3([new T.Vector3(.35,.9,-.2),new T.Vector3(.9,.6,.1),new T.Vector3(1.45,.95,.3),new T.Vector3(1.8,1.05,.5)].map(v=>v));
    part(c,new T.TubeGeometry(cable,24,.03,8),toon('#9b7bf0'),0,0,0);
    this.solid(1,2.2,.9,t.x+OX-2.75,1.1,t.z-.35);
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
  private powerOff(){this.powered=false;this.soak=0;this.soakDone=false;this.verdict=undefined;this.tripT=0;}
  act(name:string,arg?:unknown):boolean{
    const a=this.game.audio,j=this.current();
    if(!j)return false;
    if(!this.trayReady){this.say('The resistor blocks are still in the storeroom: carry the tray over to the bench.');a.voice('hm',1.4);return false;}
    const touch=()=>{if(this.powered){this.powerOff();a.tone(260,.08,.03,'triangle');}};
    switch(name){
      case 'pick':{const v=Number(arg);if(!RACK.includes(v))return false;
        if(this.held?.r===v){this.held=undefined;a.tone(380,.05,.03,'triangle');break;}
        this.held={r:v,rating:this.rating};a.pop();break;}
      case 'rating':{const rt=Number(arg) as Rating;if(!RATINGS.includes(rt))return false;this.rating=rt;if(this.held)this.held={...this.held,rating:rt};a.tone(700+RATINGS.indexOf(rt)*120,.05,.03,'triangle');break;}
      case 'slot':{const s=arg as 'series'|'parallel';if(s!=='series'&&s!=='parallel')return false;
        if(this.held){touch();this.setup[s]={...this.held};this.held=undefined;a.plug();break;}
        if(this.setup[s]){touch();const was=this.setup[s]!;this.setup[s]=undefined;this.rating=was.rating;a.tone(300,.06,.04,'triangle');break;}
        this.say('Pick a resistor block from the rack first, then click the slot.');a.voice('hm',1.4);return false;}
      case 'flip':{if(j.load.kind!=='led'){this.say('The transistor only fits one way round.');return false;}touch();this.setup.reversed=!this.setup.reversed;a.tone(this.setup.reversed?440:560,.06,.04,'triangle');a.pop();break;}
      case 'power':{
        if(this.tripped){this.say('The fuse has tripped: press RESET on the fuse first.','bad');a.tone(170,.15,.05,'square');return false;}
        if(this.powered){this.powerOff();a.noise(.03,.07,2500,'highpass');a.tone(220,.09,.04);break;}
        this.powered=true;this.soak=0;this.soakDone=false;this.verdict=undefined;this.tripT=0;a.noise(.03,.07,2500,'highpass');a.tone(420,.09,.04);
        const r=read(j,this.setup);if(!r.tripped&&!r.lit)this.say(judge(j,this.setup).problems[0]??'Nothing lights up.','info');
        break;}
      case 'reset':{if(!this.tripped){this.say('The fuse is fine: it only needs a reset after it trips.');return false;}
        this.tripped=false;a.noise(.02,.06,3000,'highpass');a.tone(640,.06,.04,'triangle');this.say('Fuse reset. A PTC fuse cools and conducts again once the fault is gone.');break;}
      case 'signoff':{
        if(!this.soakDone||!this.verdict){this.say('Run the channel first: POWER it and let it run in spec for 10 s.');a.voice('hm',1.4);return false;}
        const v=this.verdict;this.served.push({job:j.id,tier:v.tier,cost:v.cost});this.spent+=v.cost;
        this.say(`${j.title} signed off: ${TIER_WORD[v.tier]}.${v.notes[0]?` ${v.notes[0]}`:''}`,'ok');
        a.cheer();a.bell(1319,.5,.05);this.game.burst(this.table.clone().add(new T.Vector3(-2.4,1.3,0)),'#ffd84d',30,'confetti');this.game.burst(this.table.clone().add(new T.Vector3(-2.4,1.4,0)),'#ff7eb6',6,'star');
        this.room?.light(this.index);
        this.index++;this.powerOff();this.held=undefined;this.heat={led:0,r:0,p:0};this.setup=clone(JOBS[this.index]?.start??{reversed:false});this.showJob();return true;}
      case 'clear':{if(!this.held)return false;this.held=undefined;a.tone(380,.05,.03,'triangle');break;}
      default:return false;
    }
    this.redraw();return true;
  }
  /** Too much current: the PTC fuse trips with a click, the cabinet shows TILT. */
  private trip(){
    const j=this.current()!,a=this.game.audio,v=judge(j,this.setup);this.powerOff();this.tripped=true;this.mistakes++;this.trips++;
    this.say(v.problems[0]??'Too much current: the fuse tripped.','bad');
    a.noise(.05,.12,1800,'bandpass');a.tone(120,.35,.07,'square');a.voice('groan',1.1);
    const at=this.boardWorld(FUSEX,TOPZ);this.game.burst({x:at.x,y:at.y+.15,z:at.z},'#fff3a3',12,'spark');this.game.alarm({x:this.table.x,z:this.table.z},3);
    this.marquee.draw('tilt',(c,w,h)=>drawMarquee(c,w,h,'TILT!',false,true));this.redraw();
  }
  /** A part ran over its limit during the run: power off, a puff of smoke, try again. */
  private cook(which:'led'|'series'|'parallel'){
    const j=this.current()!,a=this.game.audio,v=judge(j,this.setup);this.powerOff();this.mistakes++;
    this.say(v.problems[0]??(which==='led'?'The LED ran over its rating.':'A resistor ran over its power rating.'),'bad');
    a.noise(.4,.06,500);a.tone(150,.3,.05,'sawtooth');a.voice('alarm',1.2);
    const at=which==='led'?this.boardWorld(LEDX,MIDZ):which==='series'?this.boardWorld(SERX,TOPZ):this.boardWorld(ACRX,MIDZ);
    this.game.burst({x:at.x,y:at.y+.15,z:at.z},'#8a8a96',8,'smoke');this.game.alarm({x:this.table.x,z:this.table.z},3);this.redraw();
  }
  private boardWorld(x:number,z:number){return this.top.localToWorld(new T.Vector3(BOARD.x+x,.1,BOARD.z+z));}

  // ---------- drawing ----------
  private redraw(){
    const j=this.current();
    // Blocks in the slots (rebuilt only when they change) and the one in hand.
    for(const s of ['series','parallel'] as const){const p=this.setup[s],key=p?`${p.r}|${p.rating}`:'';if(key===this.slotKeys[s])continue;this.slotKeys[s]=key;
      const old=this.slotMeshes[s];if(old){this.boardGroup().remove(old);this.clickables=this.clickables.filter(c=>c.obj!==old);}this.slotMeshes[s]=undefined;
      if(p){const m=blockMesh(p.r,p.rating);m.position.set(s==='series'?SERX:ACRX,.045,s==='series'?TOPZ:MIDZ);if(s==='parallel')m.rotation.y=Math.PI/2;this.boardGroup().add(m);this.slotMeshes[s]=m;this.click(m,'slot',s);}}
    this.link.visible=!this.setup.series;
    const hk=this.held?`${this.held.r}|${this.held.rating}`:'';
    if(hk!==this.heldKey){this.heldKey=hk;if(this.heldMesh){this.rackGroup.remove(this.heldMesh);this.heldMesh=undefined;}
      if(this.held){const at=this.rackBlocks.get(this.held.r)!.position;this.heldMesh=blockMesh(this.held.r,this.held.rating);this.heldMesh.position.set(at.x,.24,at.z);this.heldMesh.scale.setScalar(1.15);const ring=part(this.heldMesh,new T.TorusGeometry(.13,.012,8,32),hot(LEMON,1.2),0,-.16,0,false);ring.rotation.x=Math.PI/2;this.rackGroup.add(this.heldMesh);}}
    this.rackBlocks.forEach((b,v)=>b.visible=this.held?.r!==v);
    this.ratingBtns.forEach((b,k)=>{b.position.y=RATINGS[k]===this.rating?.02:.04;b.scale.setScalar(RATINGS[k]===this.rating?1.08:1);b.userData.baseScale=b.scale.clone();});
    this.ledGroup.rotation.y=this.setup.reversed?Math.PI:0;
    this.lever.rotation.x=this.powered?.6:-.6;this.powerLamp.material=this.powered?hot('#6dff9a',1.6):toon('#5a4a60');
    this.resetBtn.position.y=this.tripped?.07:.045;(this.resetBtn as T.Mesh).material=toon(this.tripped?LEMON:'#ff6b6b');this.fuseDisc.material=toon(this.tripped?'#ff6b6b':LEMON);
    this.signBtn.material=this.soakDone?hot('#6dff9a',1.1):toon('#8a9a8e');
    if(j&&!this.tripped)this.marquee.draw(`m${this.index}`,(c,w,h)=>drawMarquee(c,w,h,j.cabinet,false));
    this.drawMeter();this.shown='';this.updatePanel();
  }
  private boardGroup(){return this.link.parent!;}
  private drawMeter(){
    const j=this.current(),r=this.reading();
    const key=JSON.stringify([this.index,this.powered,this.tripped,this.setup,Math.round(this.soak*5),this.soakDone,Math.round(this.heat.led*40),Math.round(this.heat.r*40),Math.round(this.heat.p*40)]);
    this.meter.draw(key,(c,w,h)=>drawMeter(c,w,h,j,r,this.powered,this.tripped,this.heat,this.soak,this.soakDone,this.setup));
  }

  // ---------- pointer, keys, room ----------
  pointer(e:Pointer){
    const hits=e.ray.intersectObjects(this.clickables.filter(c=>visibleUp(c.obj)).map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.1);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found)this.act(found.act,found.arg);
  }
  key(code:string){
    const at=this.held?RACK.indexOf(this.held.r):-1;
    const map:Record<string,[string,unknown?]>={ArrowRight:['pick',RACK[Math.min(RACK.length-1,at+1)]],ArrowLeft:['pick',RACK[Math.max(0,at<0?0:at-1)]],
      KeyS:['slot','series'],KeyA:['slot','parallel'],KeyR:['rating',RATINGS[(RATINGS.indexOf(this.rating)+1)%RATINGS.length]],KeyF:['flip'],KeyP:['power'],KeyX:['reset'],Enter:['signoff'],Backspace:['clear']};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';this.updatePanel();}
  dropped(p:Game['props'][number]){
    if(p.spec.id!=='blocks'||this.trayReady)return;const q=p.body.translation(),pl=this.game.player.translation(),t=this.table;
    if(Math.hypot(q.x-t.x,q.z-t.z)<2.6||Math.hypot(pl.x-this.stand.x,pl.z-this.stand.z)<2.2){
      this.trayReady=true;p.mesh.visible=false;p.body.setEnabled(false);this.trayRide.visible=false;this.rackGroup.visible=true;
      const at=this.top.localToWorld(new T.Vector3(RACKAT.x,.1,RACKAT.z));this.game.audio.plug();this.game.burst(at,'#ffd84d',1,'ring');this.game.burst(at,'#ff7eb6',14,'confetti');this.redraw();}
  }
  private setup0(){this.ready=true;this.tray=this.game.props.find(p=>p.spec.id==='blocks');
    // A few blocks ride on the tray until it reaches the bench.
    this.game.root.add(this.trayRide);[22,220,1000,470,68,2200].forEach((v,k)=>{const b=blockMesh(v,.25);b.position.set(-.27+(k%3)*.27,.02,k<3?-.11:.11);this.trayRide.add(b);});
    this.redraw();}
  update(dt:number){
    if(!this.ready)this.setup0();
    if(this.tray&&!this.trayReady){const q=this.tray.body.translation(),r=this.tray.body.rotation();this.trayRide.position.set(q.x,q.y,q.z);this.trayRide.quaternion.set(r.x,r.y,r.z,r.w);this.trayRide.visible=this.tray.mesh.visible;}
    const j=this.current(),r=this.reading();
    if(j&&r){
      const on=this.powered&&!this.tripped;
      if(on&&r.tripped){this.tripT+=dt;if(this.tripT>=.2)this.trip();}
      else if(on){
        // Heat follows its steady value with the bench's time constant; parts cool when off.
        const k=1-Math.exp(-dt/HOUSE.tau);this.heat.led+=(r.level-this.heat.led)*k;this.heat.r+=(r.rHeat-this.heat.r)*k;this.heat.p+=(r.pHeat-this.heat.p)*k;
        if(this.heat.r>1)this.cook('series');else if(this.heat.p>1)this.cook('parallel');else if(this.heat.led>1)this.cook('led');
        else if(r.lit&&!this.soakDone){this.soak+=dt;
          if(this.soak>=HOUSE.soak){const v=judge(j,this.setup);
            if(v.tier===0)this.cook('led');
            else{this.soakDone=true;this.verdict=v;this.say(`Ten seconds in spec: ${TIER_WORD[v.tier]}.${v.notes[0]?` ${v.notes[0]}`:''} SIGN OFF, or keep tuning.`,'ok');this.game.audio.bell(988,.4,.05);this.redraw();}}}
      }else{const k=1-Math.exp(-dt/HOUSE.tau);this.heat.led-=this.heat.led*k;this.heat.r-=this.heat.r*k;this.heat.p-=this.heat.p*k;}
      // The LED (and the cabinet's lamp) glow with the current; over the band it flickers white-hot.
      const lit=this.powered&&!this.tripped?Math.min(1.6,r.level):0,over=this.heat.led>.9;this.flicker+=dt*30;
      const glowK=lit*(over?.85+Math.sin(this.flicker)*.15:1);
      if(j.load.kind==='led'){const col=LED_HEX[j.load.color];
        if(glowK>.02){this.ledOn.color.set(col).multiplyScalar(.6+glowK*1.1);this.ledDome.material=this.ledOn;}else this.ledDome.material=toon(tint(col));(this.ledHalo.material as T.SpriteMaterial).opacity=Math.min(.95,glowK*.75);this.ledHalo.scale.setScalar(.4+glowK*.8);this.ledLight.intensity=glowK*3;
        if(glowK>.02){this.cabOn.color.set(col).multiplyScalar(.6+glowK);this.cabLamp.material=this.cabOn;}else this.cabLamp.material=this.lampOff;(this.cabHalo.material as T.SpriteMaterial).color.set(col);(this.cabHalo.material as T.SpriteMaterial).opacity=Math.min(.9,glowK*.7);
      }else{const drive=this.powered&&!this.tripped?Math.min(1,r.iLoad*j.load.beta/j.load.motor):0;this.spin+=dt*drive*14;this.coin.rotation.x=-this.spin;
        this.cabOn.color.set('#ffd84d').multiplyScalar(1.4);this.cabLamp.material=drive>=1?this.cabOn:this.lampOff;(this.cabHalo.material as T.SpriteMaterial).opacity=drive>=1?.6:0;(this.cabHalo.material as T.SpriteMaterial).color.set('#ffd84d');}
      // Hot resistors glow red and smoke a little before they scorch.
      for(const [s,h] of [['series',this.heat.r],['parallel',this.heat.p]] as const){const m=this.slotMeshes[s];if(!m)continue;const body=m.children[0] as T.Mesh;const p=this.setup[s]!;
        if(h>.62){const hm=this.hotMats[s];hm.color.set(h>.9?'#ff5a3d':'#ff9a6b').multiplyScalar(.7+h*.4);body.material=hm;}else body.material=toon(decade(p.r));}
      this.smokeT-=dt;if(this.smokeT<=0&&this.powered&&(this.heat.r>.8||this.heat.p>.8)){this.smokeT=.35;const at=this.boardWorld(this.heat.r>.8?SERX:ACRX,this.heat.r>.8?TOPZ:MIDZ);this.game.burst({x:at.x,y:at.y+.1,z:at.z},'#b9b4c4',1,'smoke');}
      this.cabScreen.material=this.powered&&!this.tripped&&r.lit?this.screenOn:this.screenOff;
    }
    this.drawMeter();this.updatePanel();
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
    const key=JSON.stringify([this.active,this.index,this.setup,this.held,this.rating,this.powered,this.tripped,Math.floor(this.soak),this.soakDone,this.trayReady]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){const l=this.layer();if(!l){this.shown='';return;}this.panel=document.createElement('section');this.panel.className='station-panel panel arc-panel';l.append(this.panel);}
    this.panel.hidden=!j||!r;if(!j||!r)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const isLed=j.load.kind==='led',res=(p?:Part)=>p?`${ohms(p.r)} · ${RATING_LABEL[String(p.rating)]}`:'—';
    const inBand=r.iLoad>=j.band[0]-1e-9&&r.iLoad<=j.band[1]+1e-9,on=this.powered&&!this.tripped;
    const load=isLed?`${j.load.kind==='led'?j.load.color:''} · V<sub>f</sub> ${j.load.vf.toFixed(1)} V · ${mAs(j.load.imax)} mA max`:`base 0.7 V · pin ${mAs(j.load.imax)} mA max`;
    this.panel.innerHTML=`<header><small>CABINET ${this.index+1}/${JOBS.length} · ${j.cabinet}</small><h4>${j.ask}</h4><p>${j.story}</p></header>`+
      (this.active&&this.trayReady?`<ul class="build">${row('Supply',`${j.supply} V${j.battery?' battery':''}`)}${row(isLed?'LED':'Load',load)}`+
        `${row('Series',this.setup.series?res(this.setup.series):'wire link',!!this.setup.series)}${row(isLed?'Across LED':'Across B–E',res(this.setup.parallel),this.setup.parallel?false:undefined)}`+
        (isLed?row('Way round',this.setup.reversed?'backwards':'anode to +',!this.setup.reversed):'')+
        (this.held?row('In hand',res(this.held)):row('Next block',RATING_LABEL[String(this.rating)]))+
        `${row('Current',on?`${mA(r.iLoad)} mA (want ${mAs(j.band[0])}–${mAs(j.band[1])})`:this.tripped?'fuse tripped':'power off',on?inBand:undefined)}`+
        (on&&this.setup.series?row('Resistor power',`${watts(r.pR)} of ${RATING_LABEL[String(this.setup.series.rating)]}`,r.rHeat<=HOUSE.margin):'')+
        (j.battery&&on&&r.lifeH?row('Battery life',`≈ ${Math.round(r.lifeH)} h`):'')+
        row('Run in spec',this.soakDone?'10 s ✓':`${Math.floor(this.soak)} / ${HOUSE.soak} s`,this.soakDone||undefined)+
        `${row('Parts cost',`${partsCost(this.setup)} credit${partsCost(this.setup)===1?'':'s'}`)}</ul>`+
        `<p class="profile">${isLed?'R = (V − V<sub>f</sub>) / I and P = I²R. Simplified LED: fixed V<sub>f</sub>, light ∝ current.':'R = (5 V − 0.7 V) / I and P = I²R. Simplified: the base–emitter junction drops a fixed 0.7 V, β ≈ 100.'} House rule: resistors under ${HOUSE.margin*100} % of their rating.</p>`:'');
  }
  private hoverHint():Prompt|null{
    const h=this.hovered;if(!h||!this.active)return null;
    switch(h.act){
      case 'pick':return {key:'Click',text:`Pick up a ${ohms(Number(h.arg))} block (${RATING_LABEL[String(this.rating)]})`};
      case 'rating':return {key:'R',text:`Blocks come in ${RATING_LABEL[String(h.arg)]}: bigger blocks take more heat`};
      case 'slot':{const s=h.arg as 'series'|'parallel',where=s==='series'?'SERIES (in line with the LED)':'ACROSS the LED';return {key:s==='series'?'S':'A',text:this.held?`Fit the ${ohms(this.held.r)} block ${where}`:this.setup[s]?`Take the block out of ${where}`:where};}
      case 'flip':return {key:'F',text:HINTS.flip};
      case 'power':return {key:'P',text:HINTS.power};
      case 'reset':return {key:'X',text:HINTS.reset};
      case 'signoff':return {key:'Enter',text:HINTS.signoff};
    }
    return null;
  }
  prompt(atBench:boolean):Prompt|null{
    const j=this.current();if(!j||this.game.won)return null;
    if(!atBench){const p=this.game.player.translation(),near=Math.hypot(p.x-this.stand.x,p.z-this.stand.z);
      if(this.game.held?.spec.id==='blocks')return {key:'E',text:near<2.4?'Set the resistor tray on the bench':'Carry the tray to the service bench'};
      if(!this.game.held&&this.game.nearest()?.spec.id==='blocks')return {key:'E',text:'Pick up the tray of resistor blocks'};
      if(near<1.6)return this.trayReady?{key:'E',text:'Work at the service bench'}:{key:'E',text:'Work at the bench (the resistor blocks are still in the storeroom)'};return null;}
    if(!this.trayReady)return {key:'E',text:'Step back and fetch the resistor tray from the storeroom'};
    const hint=this.hoverHint();if(hint)return hint;
    const r=read(j,this.setup);
    if(this.tripped)return {key:'X',text:'The fuse tripped: fix the circuit, then press RESET on the fuse'};
    if(this.held)return {key:'Click',text:`Fit the ${ohms(this.held.r)} block in SERIES (S) or ACROSS the LED (A)`};
    if(this.soakDone)return {key:'Enter',text:'Ten seconds in spec: SIGN OFF the cabinet'};
    if(this.powered&&r.lit)return {key:'…',text:`Running: ${Math.floor(this.soak)} / ${HOUSE.soak} s in spec. Watch the meter`};
    if(this.powered)return {key:'P',text:'Nothing useful flows: power off and fix the channel'};
    return {key:'Click',text:'Pick a block, fit it in SERIES, check the LED way round, then POWER (P)'};
  }
  complete(){return this.served.length>=JOBS.length;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){const j=this.current();return {index:this.index,job:j?.id??null,setup:clone(this.setup),held:this.held??null,rating:this.rating,powered:this.powered,tripped:this.tripped,
    soak:+this.soak.toFixed(2),soakDone:this.soakDone,verdict:this.verdict?{tier:this.verdict.tier,notes:this.verdict.notes}:null,served:this.served,mistakes:this.mistakes,trips:this.trips,spent:this.spent,
    trayReady:this.trayReady,reading:j?read(j,this.setup):null,heat:{...this.heat}};}
}

const mAs=(a:number)=>`${+(a*1000).toFixed(1)}`;
function unlitMat(){const m=new T.MeshBasicMaterial({color:'#ffffff'});m.userData.outlineParameters={visible:false};return m;}
function clone(s:Setup):Setup{return {reversed:s.reversed,series:s.series?{...s.series}:undefined,parallel:s.parallel?{...s.parallel}:undefined};}
function visibleUp(o:T.Object3D){let p:T.Object3D|null=o;while(p){if(!p.visible)return false;p=p.parent;}return true;}
/** An unlit LED is its own colour, pale. */
function tint(hex:string){const c=new T.Color(hex).lerp(new T.Color('#ffffff'),.55);return `#${c.getHexString()}`;}

/** The printed channel board: rails, part outlines and short labels. */
function drawBoard(c:CanvasRenderingContext2D,w:number,h:number,j:Job|undefined){
  c.fillStyle='#2f7a5b';c.fillRect(0,0,w,h);
  c.fillStyle='rgba(255,255,255,.05)';for(let y=12;y<h;y+=24)for(let x=12;x<w;x+=24)c.fillRect(x-1,y-1,2,2);
  const X=(x:number)=>(x+BW/2-.02)/(BW-.04)*w,Y=(z:number)=>(z+BD/2-.02)/(BD-.04)*h;
  c.strokeStyle='#f0b25a';c.lineWidth=16;c.lineCap='round';c.lineJoin='round';
  const line=(pts:[number,number][])=>{c.beginPath();pts.forEach(([x,z],i)=>i?c.lineTo(X(x),Y(z)):c.moveTo(X(x),Y(z)));c.stroke();};
  line([[SUPX,TOPZ],[SERX-.2,TOPZ]]);line([[SERX+.2,TOPZ],[ACRX,TOPZ],[ACRX,TOPZ+.05]]);line([[LEDX,TOPZ],[LEDX,TOPZ+.05]]);
  line([[SUPX,GNDZ],[ACRX,GNDZ],[ACRX,GNDZ-.05]]);line([[LEDX,GNDZ],[LEDX,GNDZ-.05]]);
  const isLed=j?.load.kind!=='base';
  c.fillStyle='#f0b25a';for(const [x,z] of [[LEDX,TOPZ],[LEDX,GNDZ],[ACRX,TOPZ],[ACRX,GNDZ]] as [number,number][]){c.beginPath();c.arc(X(x),Y(z),13,0,7);c.fill();}
  const text=(t:string,x:number,z:number,size=30,col='#fffaf0',align:CanvasTextAlign='center')=>{c.font=FONT(size);c.fillStyle=col;c.textAlign=align;c.textBaseline='middle';c.fillText(t,X(x),Y(z));};
  text(j?`${j.supply} V`:'',SUPX,MIDZ,48,LEMON);
  text('+',SUPX-.11,TOPZ,44,'#ff9a9a');text('−',SUPX-.11,GNDZ,44,'#fffaf0');
  text('RESET',FUSEX,MIDZ+.11,22,'#ffd0d0');
  text(isLed?'+':'B',LEDX-.1,TOPZ+.06,34,'#ff9a9a');text(isLed?'−':'E',LEDX-.1,GNDZ-.05,34);
  // Label strip along the front edge, one word under each column.
  c.fillStyle='rgba(20,50,38,.55)';c.fillRect(0,Y(LABZ-.055),w,Y(LABZ+.055)-Y(LABZ-.055));
  text(j?.battery?'BATTERY':isLed?'SUPPLY':'LOGIC PIN',SUPX,LABZ,26);text('FUSE',FUSEX,LABZ,26);text('SERIES',SERX,LABZ,30,LEMON);
  text(isLed?'LED':'TRANSISTOR',LEDX,LABZ,26);text('ACROSS',ACRX,LABZ,30,LEMON);
}
function drawMarquee(c:CanvasRenderingContext2D,w:number,h:number,title:string,done:boolean,tilt=false){
  const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,tilt?'#ff3b5c':'#ff7eb6');g.addColorStop(.5,tilt?'#ff8a3d':'#ffd84d');g.addColorStop(1,tilt?'#ff3b5c':'#6fe0c0');
  c.fillStyle=done?'#3b2346':g;c.fillRect(0,0,w,h);
  c.fillStyle='rgba(255,255,255,.55)';for(let x=12;x<w;x+=28){c.beginPath();c.arc(x,8,4,0,7);c.fill();c.beginPath();c.arc(x+14,h-8,4,0,7);c.fill();}
  let s=64;c.font=FONT(s);while(c.measureText(title).width>w-60){s--;c.font=FONT(s);}
  c.textAlign='center';c.textBaseline='middle';c.lineWidth=10;c.strokeStyle=PLUM;c.strokeText(title,w/2,h/2+3);c.fillStyle=done?LEMON:'#fffaf0';c.fillText(title,w/2,h/2+3);
}
/** The live meter: current, resistor voltage and power, then bars for light, LED heat and resistor heat. */
function drawMeter(c:CanvasRenderingContext2D,w:number,h:number,j:Job|undefined,r:Reading|undefined,powered:boolean,tripped:boolean,heat:Heat,soak:number,soakDone:boolean,s:Setup){
  c.fillStyle='#1d1430';c.fillRect(0,0,w,h);
  if(!j||!r){c.fillStyle=LEMON;c.font=FONT(60);c.textAlign='center';c.textBaseline='middle';c.fillText('ALL CABINETS FIXED',w/2,h/2);return;}
  const on=powered&&!tripped,isLed=j.load.kind==='led';
  c.textBaseline='middle';
  // Three big readouts.
  const tile=(x:number,label:string,value:string,unit:string,col:string)=>{c.fillStyle='#2c2046';c.beginPath();c.roundRect(x,16,280,118,18);c.fill();
    c.fillStyle='rgba(255,255,255,.6)';c.font=FONT(24,600);c.textAlign='left';c.fillText(label,x+18,40);
    c.fillStyle=col;c.font=FONT(58);c.fillText(value,x+18,92);const vw=c.measureText(value).width;c.font=FONT(28,600);c.fillStyle='rgba(255,255,255,.75)';c.fillText(unit,x+26+vw,98);};
  tile(16,isLed?'CURRENT  I':'BASE CURRENT',on?mA(r.iLoad):tripped?'TRIP':'—',on?'mA':'',tripped?'#ff6b6b':'#8dffd0');
  tile(310,'RESISTOR  V_R',on&&s.series?r.vR.toFixed(2):'—',on&&s.series?'V':'',LEMON);
  tile(604,'RESISTOR  P_R',on&&s.series?(r.pR*1000).toFixed(r.pR<.01?1:0):'—',on&&s.series?'mW':'',PINK);
  // Bars.
  const bar=(y:number,label:string,frac:number,band:[number,number]|null,limit:number|null,col:string,right:string)=>{
    c.fillStyle='rgba(255,255,255,.7)';c.font=FONT(24,600);c.textAlign='left';c.fillText(label,20,y+20);
    const x0=250,x1=w-150,bw=x1-x0,max=1.5,X=(v:number)=>x0+Math.min(1,Math.max(0,v/max))*bw;
    c.fillStyle='#2c2046';c.beginPath();c.roundRect(x0,y,bw,40,12);c.fill();
    if(band){c.fillStyle='rgba(111,224,192,.28)';c.fillRect(X(band[0]),y,X(band[1])-X(band[0]),40);}
    c.fillStyle=col;c.beginPath();c.roundRect(x0,y+6,Math.max(0,X(frac)-x0),28,9);c.fill();
    if(limit!==null){c.strokeStyle='#ff6b6b';c.lineWidth=5;c.beginPath();c.moveTo(X(limit),y-6);c.lineTo(X(limit),y+46);c.stroke();}
    c.fillStyle='#fffaf0';c.font=FONT(26);c.textAlign='right';c.fillText(right,w-18,y+20);
  };
  const lvl=on?r.level:0,band:[number,number]=[j.band[0]/j.load.imax,j.band[1]/j.load.imax];
  bar(160,isLed?'LIGHT':'BASE CURRENT',lvl,band,isLed?null:1,lvl>=band[0]&&lvl<=band[1]?'#6fe0c0':'#ffd84d',on?isLed?`${Math.round(lvl*100)} %`:`${mA(r.iLoad)} mA`:'off');
  const ledC=HOUSE.ambient+(on?heat.led:0)*HOUSE.ledTheta*j.load.imax*j.load.vf;
  if(isLed)bar(222,'LED HEAT',heat.led,null,1,heat.led>.9?'#ff6b6b':'#ff9ec6',`${Math.round(ledC)} °C`);
  else{const drive=on&&j.load.kind==='base'?Math.min(1,r.iLoad*j.load.beta/j.load.motor):0;bar(222,'MOTOR SPEED',drive,null,null,drive>=1?'#6fe0c0':'#ffd84d',on?drive>=1?'FULL':`${Math.round(drive*100)} %`:'off');}
  const rh=Math.max(heat.r,heat.p);
  bar(284,'RESISTOR HEAT',rh,null,1,rh>HOUSE.margin?'#ff8a3d':'#b9a6f5',s.series||s.parallel?`${Math.round(HOUSE.ambient+rh*HOUSE.ratedRise)} °C`:'—');
  c.strokeStyle='rgba(255,216,77,.8)';c.setLineDash([8,8]);c.lineWidth=3;const mx=250+HOUSE.margin/1.5*(w-400);c.beginPath();c.moveTo(mx,280);c.lineTo(mx,330);c.stroke();c.setLineDash([]);
  // Run-in-spec strip, fuse, battery.
  const y=356;c.fillStyle='#2c2046';c.beginPath();c.roundRect(16,y,w-32,64,16);c.fill();
  c.fillStyle=soakDone?'#6dff9a':'#8b7be8';c.beginPath();c.roundRect(16,y,(w-32)*Math.min(1,soak/HOUSE.soak),64,16);c.fill();
  c.fillStyle=soakDone?'#1d1430':'#fffaf0';c.font=FONT(30);c.textAlign='left';c.fillText(soakDone?'10 s IN SPEC ✓  SIGN OFF':on&&r.lit?`RUN IN SPEC  ${soak.toFixed(1)} / ${HOUSE.soak} s`:on?'NOTHING LIGHTS UP':'POWER OFF',34,y+33);
  c.textAlign='right';c.fillStyle=tripped?'#ff6b6b':soakDone?'#1d1430':'#8dffd0';c.fillText(tripped?'FUSE TRIPPED':'FUSE OK',w-34,y+33);
  c.fillStyle='rgba(255,255,255,.7)';c.font=FONT(26,600);c.textAlign='left';
  const foot=j.battery?(on&&r.lifeH?`BATTERY  ≈ ${Math.round(r.lifeH)} h  (${HOUSE.battery} mAh)`:`BATTERY  ${HOUSE.battery} mAh`):`SUPPLY  ${j.supply} V   ·   ${isLed?`LED Vf ${j.load.vf.toFixed(1)} V`:'BASE 0.7 V'}`;
  c.fillText(foot,20,h-40);c.textAlign='right';c.fillText(`SUPPLY DRAW ${on?watts(r.pIn):'—'}`,w-20,h-40);
}
