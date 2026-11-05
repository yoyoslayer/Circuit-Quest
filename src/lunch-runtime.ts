import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from './game';
import {Circuit,type Lead,type Load} from './sim/electrical';
import {LunchJob,BURN_WARNING} from './sim/lunch';
import {Rope,distance,segmentDistance,segmentHits,type Point,type Obstacle} from './sim/cable';
import {INK,METAL,DMETAL,TRIM,toon,rbox,box,cyl,sphere,part,group,glow,unlit,canvasTex,repeat,glyph,decal,cachedTexture,lit,Gauge,paint} from './render/kit';
import {makeProp,prefabs,type PropKind} from './props/prefabs';
import {hoseGeometry,hoseMaterial,Pulses,hot,glossyToon} from './render/actors';
const OVEN_WINDOW=hot('#ff9a3c',1.6),HOT_WINDOW=hot('#ff4a2a',2),DEAD=new T.Color('#262833'),HOT=new T.Color('#ff5a3a'),WARM=new T.Color('#ffa04a'),THICK=new T.Color('#ffc94d'),THIN=new T.Color('#ffe2a8'),SCORCH=new T.Color('#5a2a1e');
import {lunchHud} from './ui/lunch-hud';
import {gameUI} from './ui/game-ui';
import {solid} from './levels/decor';
import {cablePath,type Prop} from './game';
type Port={id:string;role:'out'|'in'|'both';pos:T.Vector3;bodyId?:string;lift:number;ring:T.Mesh;capacity:number};
type Cable={pulses:Pulses;id:string;rating:number;active:0|1;ends:[T.Vector3,T.Vector3];ports:[string|null,string|null];rope:Rope;mesh:T.Mesh;plugs:[T.Group,T.Group];lead:Lead;points:Point[];
  /** Why a dead cable is dead (a door cut is mended with a splice, a scorch needs a new length). */
  cause?:'cut'|'scorch';
  /** Insulation scuffed by a cleaner bot's drag: bare copper that water can reach. */
  nicked?:boolean;pluggedAt:number};
type Leaf={pivot:T.Group;body:RAPIER.RigidBody;collider:RAPIER.Collider;closed:number;dir:number};
type Bot={group:T.Group;snag?:{cable:Cable;end:0|1;left:number}};
/** The five things that can go wrong, each with its own glyph where it happened. */
export type Fault='overload'|'surge'|'leak'|'overheat'|'pinched';
const DOOR={x:0,z:.15};
const WINCH={x:12,z:-4.8};
// Cleaner bots' painted loop in the corridor; cables heading east to the lift room cross it twice.
const LANE={x0:-1,x1:14,z0:1.2,z1:5.4};
// The fridge leak: a trail of puddles from the fridge (pooling round its socket) out through the kitchen door.
const PUDDLES:[number,number,number][]=[[-4.6,-1.2,.45],[-4.05,-1.85,.4],[-3.6,-.55,.55],[-2.5,-.15,.55],[-1.2,.4,.6],[-.2,.8,.7],[.4,1.4,.75],[.6,2.2,.6],[.3,2.8,.45]];
/** The belt runs on into the lift room and ends at the lift car's sill. */
const BELT_START=-.5,BELT_END=10.4;
/** Fixed kitchen and corridor furniture the cables lie around (props are added per frame). */
const FIXED:Obstacle[]=[
  {id:'oven',minX:-3.8,maxX:-1.2,minZ:-8.75,maxZ:-7.45},{id:'fridge',minX:-6.1,maxX:-5.1,minZ:-2.95,maxZ:-1.65},{id:'post',minX:-4.3,maxX:-3.7,minZ:-3.55,maxZ:-3.15},
  {id:'motor',minX:4.65,maxX:5.35,minZ:-6.4,maxZ:-5.8},{id:'prep',minX:-7,maxX:-4.8,minZ:-9,maxZ:-8.1},{id:'winch',minX:12.75,maxX:13.85,minZ:-5.5,maxZ:-4.1},
  {id:'shaft',minX:10.6,maxX:13.4,minZ:-8.2,maxZ:-5.8},{id:'store-lamp',minX:-10.25,maxX:-9.75,minZ:-3.25,maxZ:-2.75},{id:'vending',minX:-7.4,maxX:-6.4,minZ:8.9,maxZ:9.7},
  {id:'water',minX:-5.85,maxX:-5.35,minZ:9.15,maxZ:9.65},{id:'lounge',minX:12.5,maxX:13.9,minZ:7.4,maxZ:8.8},{id:'bench-1',minX:-4.85,maxX:-3.55,minZ:9.22,maxZ:9.68},
  {id:'bench-2',minX:-3.25,maxX:-1.95,minZ:9.22,maxZ:9.68},{id:'plant-1',minX:15.34,maxX:15.86,minZ:4.94,maxZ:5.46},{id:'plant-2',minX:-7.46,maxX:-6.94,minZ:.94,maxZ:1.46},
  {id:'plant-3',minX:15.54,maxX:16.06,minZ:-1.76,maxZ:-1.24},{id:'rack',minX:-16.35,maxX:-15.5,minZ:2.9,maxZ:6.7}];
/** Solid furniture a cable can be dragged round. Carts, splitters, bridges, the mop and the tray are
 *  left out: cables plug into them or are meant to lie on them. */
const WRAPS=new Set<PropKind>(['desk','bookshelf','cabinet','sofa','printer','cooler','vending','cart','coolbox']);
// Fault glyphs: a cream disc with a red ring, and a picture of the cause.
const disc=(c:CanvasRenderingContext2D)=>{c.fillStyle='#fffaf0';c.beginPath();c.arc(128,128,112,0,7);c.fill();c.lineWidth=16;c.strokeStyle='#e5484d';c.stroke();c.strokeStyle=INK;c.fillStyle=INK;c.lineWidth=10;};
const bolt=(c:CanvasRenderingContext2D,x:number,y:number,s:number,color='#ffc94d')=>{c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=color;c.beginPath();c.moveTo(22,-60);c.lineTo(-22,4);c.lineTo(4,4);c.lineTo(-10,60);c.lineTo(30,-12);c.lineTo(4,-12);c.closePath();c.fill();c.lineWidth=6/s;c.strokeStyle=INK;c.stroke();c.restore();};
const FAULT_ART:Record<Fault,(c:CanvasRenderingContext2D)=>void>={
  // Too much on one cart: the cart with its needle past the red.
  overload:c=>{c.fillStyle='#ffc94d';c.fillRect(58,96,140,80);c.strokeRect(58,96,140,80);for(const x of [84,172]){c.fillStyle=INK;c.beginPath();c.arc(x,190,14,0,7);c.fill();}
    c.lineWidth=12;c.strokeStyle='#3bb273';c.beginPath();c.arc(128,96,46,Math.PI,Math.PI*1.5);c.stroke();c.strokeStyle='#e5484d';c.beginPath();c.arc(128,96,46,Math.PI*1.6,Math.PI*2);c.stroke();c.strokeStyle=INK;c.lineWidth=9;c.beginPath();c.moveTo(128,96);c.lineTo(178,82);c.stroke();},
  // A motor's start-up kick: a motor with a spike on its trace.
  surge:c=>{c.fillStyle='#3f7fd6';c.beginPath();c.arc(96,150,44,0,7);c.fill();c.stroke();c.fillStyle='#fffaf0';c.beginPath();c.arc(96,150,14,0,7);c.fill();
    c.lineWidth=12;c.beginPath();c.moveTo(130,170);c.lineTo(150,170);c.lineTo(168,58);c.lineTo(186,170);c.lineTo(212,170);c.stroke();},
  // Water at a connection: a drop with a bolt.
  leak:c=>{c.fillStyle='#6fc3ee';c.beginPath();c.moveTo(128,40);c.bezierCurveTo(196,124,206,168,128,214);c.bezierCurveTo(50,168,60,124,128,40);c.fill();c.stroke();bolt(c,128,150,.8);},
  // Too much through one cable: a flame on a cable.
  overheat:c=>{c.lineWidth=22;c.beginPath();c.moveTo(36,188);c.lineTo(220,188);c.stroke();c.fillStyle='#ff8a3d';c.beginPath();c.moveTo(128,44);c.bezierCurveTo(186,96,190,150,128,176);c.bezierCurveTo(66,150,74,104,104,84);c.bezierCurveTo(108,112,120,118,128,44);c.fill();c.lineWidth=8;c.stroke();
    c.fillStyle='#ffe066';c.beginPath();c.moveTo(128,110);c.bezierCurveTo(152,134,150,160,128,170);c.bezierCurveTo(106,160,110,138,128,110);c.fill();},
  // The swing door shut on a cable: two leaves closing on a cut cable.
  pinched:c=>{c.fillStyle='#5f8fa8';c.fillRect(56,52,62,120);c.strokeRect(56,52,62,120);c.fillRect(138,52,62,120);c.strokeRect(138,52,62,120);
    c.lineWidth=18;c.beginPath();c.moveTo(26,196);c.lineTo(112,196);c.moveTo(144,196);c.lineTo(230,196);c.stroke();bolt(c,128,192,.45,'#fff3a3');}};
const faultTexture=(kind:Fault)=>cachedTexture(`fault-${kind}`,()=>glyph(c=>{disc(c);FAULT_ART[kind](c);}));
/** One line naming what physically happened (never the fix), shown in the prompt pill the first time. */
const SENTENCE:Record<Fault,string>={overload:'Too much on one cart: it gives 5 bars at most, so its breaker cut out.',surge:'A motor takes a big kick of current for a moment as it starts.',
  leak:'Water reached a plug or a scuffed cable, so the cart cut the power.',overheat:'Too much through one cable: a thin cable is made for 3 bars, so it overheated.',pinched:'The swing door shut on the cable and cut it.'};
/** Bar pips for a load tag or a budget strip: filled for the steady draw, a spike, hollow for the start-up kick. */
function pipTexture(steady:number,kick=0){return cachedTexture(`pips-${steady}-${kick}`,()=>{
  const full=Math.ceil(steady),n=full+kick,w=24+n*52+(kick?56:0);
  const t=canvasTex(w,96,c=>{c.fillStyle='#2b2d42';c.beginPath();c.roundRect(4,4,w-8,88,22);c.fill();let x=22;
    for(let i=0;i<full;i++){const part=Math.min(1,steady-i);c.strokeStyle='#ffc94d';c.lineWidth=5;c.strokeRect(x,26,40,44);c.fillStyle='#ffc94d';c.fillRect(x,26,40*part,44);x+=52;}
    if(kick){c.strokeStyle='#ff8a3d';c.lineWidth=7;c.lineJoin='round';c.beginPath();c.moveTo(x,70);c.lineTo(x+14,70);c.lineTo(x+24,18);c.lineTo(x+34,70);c.lineTo(x+46,70);c.stroke();x+=56;
      for(let i=0;i<kick;i++){c.strokeStyle='#ff8a3d';c.lineWidth=4;c.setLineDash([8,5]);c.strokeRect(x+2,28,36,40);c.setLineDash([]);x+=52;}}});
  t.userData={aspect:w/96};return t;});}
/** A cart letter painted on the cart's side. */
const letterTexture=(letter:string)=>cachedTexture(`cart-${letter}`,()=>glyph(c=>{c.fillStyle='#fffaf0';c.beginPath();c.roundRect(28,28,200,200,40);c.fill();c.lineWidth=14;c.stroke();c.fillStyle=INK;c.font='bold 180px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(letter,128,140);}));
/** Level 02 rules and visuals: supplies, cables, splitters, machines, door, puddle, bots. */
export class LunchRuntime {
  circuit:Circuit;job=new LunchJob();ports:Port[]=[];cables:Cable[]=[];held?:{cable:Cable;end:0|1};
  water=1;puddles:T.Mesh[]=[];leaves:Leaf[]=[];doorAngle=0;doorSide=1;doorWasOpen=false;bots:Bot[]=[];
  dark:T.Mesh;liftCar!:T.Group;eventIndex=0;bakeGauge=new Gauge([[0,.95,'#ffc94d'],[.95,1,'#3bb273']]);supplyGauges=new Map<string,{gauge:Gauge;mount:T.Group;button:T.Mesh}>();
  // Assigned by the build* helpers called from the constructor.
  thermoFill!:T.Mesh;ovenWindow!:T.Mesh;ovenLight!:T.PointLight;ovenGlow!:T.Sprite;belt!:T.Texture;sad!:T.Sprite;cord!:T.Mesh;
  liftRope!:T.Mesh;liftRopeKey=-1;drum!:T.Group;alerts=new Map<string,T.Sprite>();scars:{mark:T.Object3D;life:number;at:T.Vector3}[]=[];wetAt?:Point;
  maxTemperature=0;
  /** The capacitor cart is wired inline: the lift's feed plugs into the cart, and the cart's own short
   *  lead reaches the winch socket only when it is parked within 2 m of it (it is "docked"). */
  capLead!:Lead;capDocked=false;capCord!:T.Mesh;capCordKey='';capCurve?:T.CatmullRomCurve3;capPulses!:Pulses;capCans:T.Mesh[]=[];capPlug!:T.Group;dockRing!:T.Mesh;
  /** After the lift's start-up kick has tripped a breaker with no capacitor in its feed, a capacitor
   *  badge floats over the cart: the hint comes after the failure, never before. */
  capHint=false;capBadge!:T.Sprite;liftRan=false;
  /** The motor whose start-up kick last tripped a cart, and the badge floating over it. */
  surgeHint?:'lift'|'conveyor';surgeBadge!:T.Sprite;surgeUntil=0;beltJerk=0;
  /** Each kind of fault names its cause once, in the prompt pill, the first time it happens. */
  told=new Set<Fault>();telling?:{fault:Fault;until:number};
  /** Followers: meshes that ride along with batched props (cart letters, budget pips, charge cans). */
  followers:{prop:Prop;group:T.Group}[]=[];budget=new Map<string,T.Mesh[]>();
  dollyPark?:Point;resetAt=0;trayHop=0;lastStrainAlarm=0;liftOnFor=0;
  lamps=new Map<string,{bulb:T.Mesh;glow:T.Sprite;light:T.PointLight}>();
  constructor(public game:Game){
    game.ropeMesh.visible=false;game.plug.visible=false;game.target.visible=false;if(game.screen)game.screen.visible=false;
    // The generic level target's socket box would sit inside the lift shaft; the winch has its own socket.
    for(const o of game.root.children)if(o instanceof T.Mesh&&o.geometry instanceof T.BoxGeometry&&Math.abs(o.position.x-game.level.target.x)<.01&&Math.abs(o.position.z-game.level.target.z)<.01)o.visible=false;
    const loads:Load[]=[['oven',3,0],['fridge',2,0],['conveyor',1.5,3],['lift',3,9],['kitchen-lamp',.5,0],['store-lamp',.5,0]].map(([id,steady,kick])=>({id:String(id),steady:Number(steady),kick:Number(kick),kickSeconds:1,enabled:!['conveyor','lift'].includes(String(id)),state:'off',started:0}));
    // The capacitor cart has been sitting unplugged in the storeroom: it starts empty and fills only
    // from the current it really draws through its inlet (the 'cap' charging load below).
    loads.find(l=>l.id==='lift')!.capacitor={node:'cap',atLoad:false,charge:0};
    loads.push({id:'cap',steady:1,kick:0,kickSeconds:0,enabled:true,state:'off',started:0});
    // The kitchen feed post is hard-wired to the oven and both lamps.
    const branches=['oven','kitchen-lamp','store-lamp'].map(id=>({id:`fixed-${id}`,from:'kitchen',to:id,rating:3,closed:true,heat:0,dead:false}));
    this.circuit=new Circuit([{id:'a',limit:5,tripped:false},{id:'b',limit:5,tripped:false}],branches,loads);
    const root=game.root;
    // Wheeled carts roll and turn but never tip over (a tipped cart reads as broken); the dolly is heavy
    // and damped so a passing Pip doesn't shove it into the doorway. Job items never count as breakage.
    for(const prop of game.props){const kind=prop.spec.kind;
      if(kind==='supply'||kind==='capcart'||kind==='dolly'){prop.body.setEnabledRotations(false,true,false,true);prop.body.setRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),prop.spec.rotation??0),true);}
      if(kind==='dolly'){prop.body.setAdditionalMass(40,true);prop.body.setLinearDamping(4);}
      if(prop.spec.id)prop.damaged=true;}
    this.job.warming=false;
    this.buildKitchen();this.buildLift();this.buildLamps();this.buildDoor();this.buildCorridor();
    this.port('a',-13,3,'out',2,'supply-a',.1);this.port('b',-13,7,'out',2,'supply-b',.1);this.port('kitchen',-4,-3,'in',1);
    this.port('fridge',-4,-1.8,'in',1);this.port('conveyor',5,-5,'in',1);this.port('lift',12,-4.8,'in',1);
    for(let i=1;i<=3;i++)this.port(`splitter-${i}`,-14+(i-1)*.7,.65,'both',4,`splitter-${i}`,-.15);
    // The capacitor cart's inlet, and its short lead to the winch (closed only while it is docked).
    this.port('cap',-12,-7,'in',1,'capacitor',.6);
    this.capLead={id:'cap-lead',from:'cap',to:'lift',rating:10,closed:false,heat:0,dead:false};this.circuit.leads.push(this.capLead);
    this.capCord=part(root,new T.BufferGeometry(),toon('#ecE8dc'),0,0,0,false);this.capCord.visible=false;this.capPulses=new Pulses(root,3,.065);
    this.capPlug=makeProp('plug','#ecE8dc');this.capPlug.visible=false;root.add(this.capPlug);
    // The cart's own look (four blue cans and a bolt), so the hint reads without knowing the symbol.
    this.capBadge=new T.Sprite(new T.SpriteMaterial({map:cachedTexture('cap-badge-cans',()=>glyph(c=>{c.fillStyle='#fffaf0';c.beginPath();c.arc(128,128,112,0,7);c.fill();c.lineWidth=14;c.strokeStyle='#2b2d42';c.stroke();
      c.lineWidth=8;for(const x of [58,98,138,178]){c.fillStyle='#3f7fd6';c.beginPath();c.roundRect(x-16,84,34,96,10);c.fill();c.stroke();}c.fillStyle='#c7ccd6';c.fillRect(40,180,176,16);c.strokeRect(40,180,176,16);bolt(c,128,76,.7);})),depthTest:false}));
    this.capBadge.scale.set(.9,.9,1);this.capBadge.renderOrder=9;this.capBadge.visible=false;root.add(this.capBadge);
    this.surgeBadge=new T.Sprite(new T.SpriteMaterial({map:faultTexture('surge'),depthTest:false}));this.surgeBadge.scale.set(.9,.9,1);this.surgeBadge.renderOrder=9;this.surgeBadge.visible=false;root.add(this.surgeBadge);
    // A dashed job-yellow ring marks where the cart docks while it is being pushed.
    const dash=canvasTex(512,512,c=>{c.strokeStyle='#ffc94d';c.lineWidth=22;c.setLineDash([46,30]);c.beginPath();c.arc(256,256,232,0,7);c.stroke();});
    this.dockRing=part(root,new T.PlaneGeometry(4,4).rotateX(-Math.PI/2),unlit('#ffffff',{map:dash,transparent:true,depthWrite:false}),WINCH.x,.03,WINCH.z,false);this.dockRing.visible=false;
    for(const id of ['a','b']){const gauge=new Gauge(),mount=gauge.mount(root,0,0,0,.9);mount.rotation.x=-.5;const button=part(root,cyl(.1,.1,.12,12),toon('#d63a3f',{emissive:'#ff3a3a',ei:0}).clone());this.supplyGauges.set(id,{gauge,mount,button});}
    this.buildFollowers();
    // Lengths are about 1.1× the longest route each lead is meant for, so a sloppy route strains.
    // thin-1 is the lift feed (Supply A round to the capacitor at the winch); thin-3 is a short spare on B.
    this.addCable('thin-1',3,32,'a',null,[-11,2]);this.addCable('thin-2',3,24,'a',null,[-10,3.5]);this.addCable('thin-3',3,14,'b',null,[-11,6.2]);this.addCable('thick',10,22,'b',null,[-10,7.5]);
    // The unlit storeroom: a dim blue-violet lid with a soft hole where the lamp would pool
    // (look-dev lunch.js); it lifts away once a lamp in there is powered.
    const darkTex=cachedTexture('store-dark',()=>{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d')!;x.fillStyle='rgba(16,18,40,1)';x.fillRect(0,0,512,512);x.globalCompositeOperation='destination-out';
      const hx=(-10+16.55)/8.9*512,hy=(-3+10)/10*512,gr=x.createRadialGradient(hx,hy,0,hx,hy,150);gr.addColorStop(0,'rgba(0,0,0,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,512,512);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;});
    this.dark=part(root,new T.PlaneGeometry(8.9,10),unlit('#ffffff',{map:darkTex,transparent:true,opacity:.8,depthWrite:false}),-12.1,1.5,-5,false);this.dark.rotation.x=-Math.PI/2;this.dark.renderOrder=5;this.dark.userData.noAO=true;
    const tray=this.prop('tray');if(tray){tray.mesh.visible=false;tray.body.setEnabled(false);}
    // HUD: objective chain, fridge thermometer and breaker dials (src/ui/lunch-hud.ts).
    lunchHud(game.hud);
  }
  prop(id:string){return this.game.props.find(p=>p.spec.id===id);}
  load(id:string){return this.circuit.loads.find(l=>l.id===id)!;}
  socketPlate(parent:T.Object3D,x:number,y:number,z:number,ry=0){const g=group(parent,x,y,z,ry);part(g,rbox(.38,.1,.38,.06).clone().rotateX(Math.PI/2),toon('#f0ece2'));part(g,cyl(.11,.11,.06,14,'z'),toon(INK),0,0,.05);return g;}
  /** A chunky plaque of bar pips on an appliance: what it draws running, and its start-up kick. */
  loadTag(parent:T.Object3D,steady:number,kick:number,x:number,y:number,z:number,ry=0,height=.26){const map=pipTexture(steady,kick),m=decal(parent,map,height*(map.userData.aspect as number),height,x,y,z,ry);m.userData.loadTag=`${steady}/${kick}`;return m;}
  buildKitchen(){const g=this.game,root=g.decorRoot;
    // Oven with a window that glows while baking and a dial that fills to 20 s.
    const oven=group(root,-2.5,0,-8.1);part(oven,rbox(2.6,1.7,1.3,.12),toon('#c7ccd6'),0,.85);part(oven,box(2.8,.35,1.5),toon(DMETAL),0,1.88,-.05);part(oven,cyl(.25,.25,1.1,14),toon(METAL),.6,2.6,-.3);
    this.ovenWindow=part(g.root,box(1.5,.75,.06),toon('#3a3d55'),-2.75,.85,-7.44,false);this.ovenWindow.userData.noAO=true;this.ovenGlow=glow(g.root,'rgba(255,150,60,1)',3.2,0);this.ovenGlow.position.set(-2.75,.9,-7.1);
    this.ovenLight=new T.PointLight('#ff9c4a',0,5,1.6);this.ovenLight.position.set(-2.7,.9,-6.6);g.root.add(this.ovenLight);for(let k=0;k<3;k++)part(oven,cyl(.07,.07,.06,12,'z'),toon(INK),-.9+k*.3,1.45,.66);
    this.bakeGauge.mount(oven,.9,1.35,.68,.7);this.socketPlate(oven,.95,.4,.66);solid(g,2.6,1.7,1.3,-2.5,.85,-8.1);this.loadTag(oven,3,0,-.2,1.88,.71);
    // Fridge with a live thermometer; a sad-food icon warns before it spoils.
    const fridge=group(root,-5.6,0,-2.3,Math.PI/2);part(fridge,rbox(1.3,2.3,1.0,.12),glossyToon('#e9f0f2',{spec:.5,size:.985}),0,1.15);for(const [x,y,c] of [[-.3,1.9,'#e5484d'],[.1,1.8,'#ffc94d'],[-.1,2,'#3f7fd6']] as const)part(fridge,box(.14,.14,.02),toon(c),x,y,.52,false);part(fridge,box(.06,.9,.06),toon(DMETAL),.5,1.4,.52);part(fridge,box(1.25,.04,.02),toon(DMETAL),0,1.6,.51);
    part(fridge,rbox(.22,1.1,.08,.1),toon('#fffaf0'),-.4,1.2,.54);this.thermoFill=part(group(g.root,-5.6,0,-2.3,Math.PI/2),box(.1,1,.04),toon('#ffc94d'),-.4,.72,.59,false);part(fridge,sphere(.1,12,10),toon('#ffc94d'),-.4,.68,.59);
    this.socketPlate(fridge,.3,.35,.52);solid(g,1.0,2.3,1.3,-5.6,1.15,-2.3);this.loadTag(fridge,2,0,.12,.85,.53);
    this.sad=new T.Sprite(new T.SpriteMaterial({map:cachedTexture('sad-food',()=>glyph(c=>{c.fillStyle='#fffaf0';c.beginPath();c.arc(128,128,110,0,7);c.fill();c.lineWidth=14;c.stroke();c.fillStyle='#8bbf5a';c.beginPath();c.arc(128,140,62,0,7);c.fill();c.stroke();c.fillStyle=INK;for(const x of [104,152]){c.beginPath();c.arc(x,128,9,0,7);c.fill();}c.beginPath();c.arc(128,178,24,Math.PI*1.15,Math.PI*1.85);c.stroke();})),depthTest:false}));
    this.sad.scale.set(.8,.8,1);this.sad.position.set(-5.3,2.9,-2.1);this.sad.renderOrder=9;this.sad.visible=false;g.root.add(this.sad);
    // Kitchen feed post: the one inlet for oven + lamps (a thin cable here overheats). Its plaque sums them.
    const post=group(root,-4,0,-3.35);part(post,rbox(.6,1.1,.4,.08),toon('#ffc94d'),0,.55);this.socketPlate(post,0,.35,.21);
    decal(post,cachedTexture('bolt-glyph',()=>glyph(c=>{c.beginPath();c.moveTo(150,20);c.lineTo(70,140);c.lineTo(125,140);c.lineTo(100,236);c.lineTo(190,104);c.lineTo(134,104);c.closePath();c.fill();})),.3,.3,0,.85,.21);solid(g,.6,1.1,.4,-4,.55,-3.35);
    this.loadTag(post,4,0,0,1.24,.05,0,.16);
    const conduit=(pts:number[][])=>part(root,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0),60,.04,6),toon('#7d8697'));
    // Floor conduits show the post's fixed wiring to the oven and the storeroom lamp.
    conduit([[-4,.2,-3.56],[-4,.03,-3.7],[-3.8,.03,-7],[-1.55,.03,-7.3],[-1.55,.4,-7.44]]);conduit([[-4,.2,-3.56],[-4.3,.03,-3.8],[-7.75,.03,-3.3],[-9.7,.03,-3.1],[-10,.1,-3]]);
    // Conveyor: belt scrolls while powered, motor socket faces the kitchen. A second section runs on
    // through the lift-room doorway to the lift car's sill, so the tray always rides on belt.
    const conveyor=group(root,3.5,0,-7);part(conveyor,rbox(8.5,.25,.9,.1),toon(DMETAL),0,.95);
    this.belt=repeat(canvasTex(256,64,c=>{c.fillStyle='#3a3d55';c.fillRect(0,0,256,64);c.fillStyle='#4a4d6a';for(let x=0;x<256;x+=24)c.fillRect(x,0,8,64);}),7,1);
    part(conveyor,box(8.5,.03,.75),toon('#ffffff',{map:this.belt}),0,1.09,0,false);for(let x=-3.9;x<=4;x+=1.95)for(const dz of [-.35,.35])part(conveyor,box(.08,.85,.08),toon(METAL),x,.42,dz);
    const run=group(root,9.2,0,-7),runBelt=this.belt.clone();runBelt.repeat.set(7*2.9/8.5,1);runBelt.needsUpdate=true;this.belt.userData.twin=runBelt;
    part(run,rbox(2.9,.25,.9,.1),toon(DMETAL),0,.95);part(run,box(2.9,.03,.75),toon('#ffffff',{map:runBelt}),0,1.09,0,false);for(const x of [-.6,1.3])for(const dz of [-.35,.35])part(run,box(.08,.85,.08),toon(METAL),x,.42,dz);solid(g,2.9,.3,.9,9.2,.95,-7);
    part(root,rbox(.7,.6,.6,.08),toon('#3f7fd6'),5,.3,-6.1);this.socketPlate(root,5,.38,-5.78);solid(g,8.5,.3,.9,3.5,.95,-7);solid(g,.7,.6,.6,5,.3,-6.1);
    this.loadTag(root,1.5,3,3.4,.95,-6.535,0,.22);
    for(const dz of [-.35,.35])part(root,box(.06,.8,.4),toon('#5f8fa8'),8.15,1.4,-7+dz);
    // Prep table the tray is baked for, plus pots and pans to knock about.
    const table=group(root,-5.9,0,-8.55);part(table,rbox(2.2,.1,.9,.06),toon('#e9f0f2'),0,.95);for(const [lx,lz] of [[-1,-.38],[1,-.38],[-1,.38],[1,.38]])part(table,box(.07,.95,.07),toon(METAL),lx,.48,lz);solid(g,2.2,1,.9,-5.9,.5,-8.55);
  }
  buildLift(){const g=this.game,root=g.decorRoot,frame=toon(DMETAL);
    // The shaft: four corner guide posts, a top frame, a back panel, a striped sill and a lower cage,
    // so the car reads as riding inside something. One collider keeps Pip out from under the car.
    for(const x of [10.6,13.4])part(root,box(.2,3.7,.2),frame,x,1.85,-8.3);part(root,box(3.2,.25,.5),frame,12,3.6,-8.3);
    for(const x of [10.65,13.35])for(const z of [-8.15,-5.85])part(root,box(.12,3.7,.12),frame,x,1.85,z);
    part(root,box(2.9,.18,.14),frame,12,3.6,-5.85);for(const x of [10.65,13.35])part(root,box(.14,.18,2.5),frame,x,3.6,-7);
    part(root,box(2.6,3.5,.05),toon('#c7ccd6'),12,1.8,-8.22);
    part(root,rbox(2.8,.1,2.4,.04),toon('#3a3d55'),12,.05,-7);for(const [x,z,w,d] of [[12,-5.85,2.8,.12],[10.65,-7,.12,2.4],[13.35,-7,.12,2.4]])part(root,box(w,.02,d),toon('#ffc94d'),x,.11,z,false);
    part(root,box(2.6,.85,.04),toon('#5a6378'),12,.5,-5.86);part(root,box(.04,.85,2.2),toon('#5a6378'),13.36,.5,-7);part(root,box(.04,.55,2.2),toon('#5a6378'),10.64,.35,-7);
    solid(g,2.8,2.6,2.4,12,1.3,-7);
    this.liftCar=group(g.root,12,0,-7);part(this.liftCar,rbox(2.6,.12,2.2,.08),toon(METAL),0,0);part(this.liftCar,box(2.6,1.1,.08),toon('#c7ccd6'),0,.6,-1.1);part(this.liftCar,box(.08,1.1,2.2),toon('#c7ccd6'),1.3,.6,0);
    part(this.liftCar,box(2.6,.35,.06),toon(DMETAL),0,-.22,1.07);for(const sx of [-1.26,1.26])part(this.liftCar,box(.08,1.1,.08),toon(DMETAL),sx,.6,1.06);part(this.liftCar,box(2.6,.08,.08),toon(DMETAL),0,1.16,-1.1);
    // The rope runs from the winch drum up to a pulley on the frame, across, and down to the car.
    this.liftRope=part(g.root,new T.BufferGeometry(),toon('#8a6a4a'),0,0,0,false);
    for(const [x,z] of [[13.3,-5.85],[12,-7]] as const)part(root,cyl(.18,.18,.1,16,'x'),toon(METAL),x,3.42,z);
    const winch=group(root,13.3,0,-4.8,-Math.PI/2);part(winch,rbox(1.4,.3,1.1,.08),toon(DMETAL),0,.15);
    for(const sx of [-.55,.55])part(winch,box(.12,1.1,.8),toon(DMETAL),sx,.65);this.socketPlate(root,12.62,.38,-4.8,-Math.PI/2);solid(g,1.1,1.3,1.4,13.3,.65,-4.8);
    // The drum turns while the lift climbs, so it lives outside the merged decor: wound rope, ink rings.
    this.drum=group(g.root,13.3,.85,-4.8,-Math.PI/2);const spin=group(this.drum);spin.name='spin';part(spin,cyl(.4,.4,.9,22,'x'),toon('#e0b25a'));part(spin,cyl(.42,.42,.7,22,'x'),toon('#8a6a4a'));
    for(let k=0;k<5;k++)part(spin,new T.TorusGeometry(.42,.022,6,24).rotateY(Math.PI/2),toon(INK),-.3+k*.15,0,0,false);part(spin,box(.9,.06,.1),toon(INK),0,.4,0,false);
    // Its plaque: 3 bars running, a 9-bar kick to start.
    part(root,rbox(1.4,.3,.05,.04),toon(DMETAL),13.3,1.62,-4.05);part(root,box(.06,1.5,.06),toon(DMETAL),13.3,.75,-4.03);this.loadTag(root,3,9,13.3,1.62,-4.02,0,.2);
  }
  buildLamps(){const root=this.game.root,decor=this.game.decorRoot;
    for(const id of ['store-lamp','kitchen-lamp']){
      const bulb=part(root,sphere(.14,12,10),toon('#bbb6a8'),0,-10,0,false);const halo=glow(root,'rgba(255,210,120,1)',1.4,0);const light=new T.PointLight('#ffcf7a',0,7,1.6);root.add(light);this.lamps.set(id,{bulb,glow:halo,light});}
    const stand=group(decor,-10,0,-3);part(stand,cyl(.3,.36,.1,18),toon(INK),0,.05);part(stand,cyl(.035,.035,1.8,8),toon(TRIM),0,1);
    const shade=part(stand,new T.CylinderGeometry(.24,.42,.45,20,1,true),toon('#f7ecd0'),0,2);(shade.material as T.Material).side=T.DoubleSide;solid(this.game,.5,2,.5,-10,1,-3);
    this.loadTag(stand,.5,0,0,1.1,.05,0,.14);
  }
  buildDoor(){const g=this.game;
    // Double-action swing door: the leaves swing away from whoever pushes through, then auto-close.
    for(const [hinge,closed,dir] of [[-1.5,0,-1],[1.5,Math.PI,1]] as const){
      const pivot=group(g.root,hinge,0,DOOR.z,closed);part(pivot,rbox(1.45,2,.08,.06),toon('#5f8fa8'),.73,1.05,0);part(pivot,cyl(.18,.18,.04,16,'z'),toon('#bfeaf5'),.73,1.55,.05);part(pivot,cyl(.18,.18,.04,16,'z'),toon('#bfeaf5'),.73,1.55,-.05);part(pivot,box(1.45,.1,.12),toon('#3f6f86'),.73,2.02,0);part(pivot,box(1.3,.3,.1),toon('#c9d1db'),.73,.22,0);part(pivot,box(.08,.5,.14),toon(METAL),1.3,1.05,0);
      // A thicker leaf so Pip's capsule can't slip into it and stall.
      const body=g.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(hinge,1.05,DOOR.z));const collider=g.world.createCollider(RAPIER.ColliderDesc.cuboid(.72,1,.1),body);
      this.leaves.push({pivot,body,collider,closed,dir});
    }
    // The fridge leak runs out through the doorway into the corridor.
    // One opaque water colour so overlapping puddles read as a single spill.
    const water=unlit('#8fd0ee',{polygonOffset:true,polygonOffsetFactor:-1});
    for(const [x,z,r] of PUDDLES){const m=part(this.game.root,new T.CircleGeometry(r,24),water,x,.02,z,false);m.rotation.x=-Math.PI/2;m.scale.x=1.4;this.puddles.push(m);}
  }
  buildCorridor(){const root=this.game.root;
    for(let i=0;i<2;i++){const bot=group(root);this.bots.push({group:bot});part(bot,cyl(.42,.45,.2,28),toon('#f4efe6'),0,.14);part(bot,cyl(.3,.3,.06,24),toon('#3f7fd6'),0,.26);for(const ex of [-.1,.1])part(bot,sphere(.05,10,8),lit('#57e38f','#3fdc7f',.5),ex,.2,.4);part(bot,cyl(.12,.12,.04,6),toon('#ffc94d'),.3,.05,.3);}
    const lane:[number,number][]=[[LANE.x0,LANE.z0],[LANE.x1,LANE.z0],[LANE.x1,LANE.z1],[LANE.x0,LANE.z1],[LANE.x0,LANE.z0]];
    for(let i=0;i<4;i++){const [x0,z0]=lane[i],[x1,z1]=lane[i+1],len=Math.hypot(x1-x0,z1-z0);for(let t=0;t<len;t+=.5)part(this.game.decorRoot,box(.25,.01,.08),paint('#6aa7e8'),x0+(x1-x0)*t/len,.012,z0+(z1-z0)*t/len,false).rotation.y=Math.atan2(-(z1-z0),x1-x0);}
    // The kitchen lamp's cord is part of the fixture: thin and conduit grey, not a job cable.
    this.cord=part(root,new T.BufferGeometry(),toon('#7d8697'));
  }
  /** Cart letters and budget pips, plug rating rings, and the capacitor's charge cans. Props are
   *  instanced after the level is built, so these ride along with their prop each frame instead. */
  buildFollowers(){const g=this.game,lift=(p:Prop)=>{const grp=group(g.root);this.followers.push({prop:p,group:grp});return grp;};
    for(const id of ['a','b']){const prop=this.prop(`supply-${id}`);if(!prop)continue;const grp=lift(prop),[,h,d]=prefabs.supply.size,bottom=-h/2,face=d*.85/2+.012;
      decal(grp,letterTexture(id.toUpperCase()),.34,.34,.32,bottom+1.0,face);
      // Five budget pips, one per bar the cart can give: lit by what it is giving now.
      const pips:T.Mesh[]=[];for(let i=0;i<5;i++)pips.push(part(grp,box(.13,.13,.03),toon('#3a3d55'),-.42+i*.17,bottom+.6,face,false));this.budget.set(id,pips);}
    const cap=this.prop('capacitor');if(cap){const grp=lift(cap),bottom=-prefabs.capcart.size[1]/2;
      // Each of the four cans holds a quarter of the charge and fills from the bottom with a lit band.
      for(const [cx,cz] of [[-.4,-.22],[.1,-.22],[.1,.22],[-.4,.22]]){const fill=part(grp,cyl(.226,.226,1,20),lit('#6fe9ff','#3fc6ff',.9),cx,bottom+.44,cz,false);fill.scale.y=.001;this.capCans.push(fill);}}
  }
  port(id:string,x:number,z:number,role:Port['role'],capacity:number,bodyId?:string,lift=.45){
    const ring=part(this.game.root,new T.TorusGeometry(.29,.05,8,24),unlit('#61d8ce',{transparent:true,opacity:.8}),x,.35,z,false);ring.rotation.x=-Math.PI/2;
    this.ports.push({id,pos:new T.Vector3(x,.35,z),role,capacity,bodyId,lift,ring});
  }
  addCable(id:string,rating:number,length:number,from:string|null,to:string|null,loose:[number,number]){
    const ends:[T.Vector3,T.Vector3]=[from?this.ports.find(p=>p.id===from)!.pos.clone():new T.Vector3(loose[0]-.5,.18,loose[1]),to?this.ports.find(p=>p.id===to)!.pos.clone():new T.Vector3(loose[0],.18,loose[1])];
    const lead:Lead={id,from:from??'',to:to??'',rating,closed:!!from&&!!to,heat:0,dead:false};this.circuit.leads.push(lead);
    const mesh=part(this.game.root,new T.BufferGeometry(),hoseMaterial());const color=rating>3?'#ffc94d':'#ecE8dc';const plugs:[T.Group,T.Group]=[makeProp('plug',color),makeProp('plug',color)];
    // Rating rings on every plug: three on a thin lead, ten on the thick one.
    for(const plug of plugs){this.game.root.add(plug);for(let k=0;k<rating;k++)part(plug,new T.TorusGeometry(.125,.012,5,18).rotateY(Math.PI/2),toon(rating>3?INK:'#3a3d55'),-.12+k*(rating>3?.026:.05),0,0,false);}
    this.cables.push({pulses:new Pulses(this.game.root,3,rating>3?.1:.065),id,rating,active:1,ends,ports:[from,to],rope:new Rope(ends[0],length),mesh,plugs,lead,points:[],pluggedAt:-9});
  }
  powered(id:string){return this.circuit.loads.find(l=>l.id===id)?.state==='on';}
  /** Whether a live supply can reach this node through closed, intact leads. */
  fed(node:string,seen=new Set<string>()):boolean{
    const source=this.circuit.sources.find(s=>s.id===node);if(source)return !source.tripped;if(seen.has(node))return false;seen.add(node);
    return this.circuit.leads.some(l=>l.to===node&&l.closed&&!l.dead&&this.fed(l.from,seen));}
  lit(){return this.powered('store-lamp')||(this.powered('kitchen-lamp')&&this.prop('portable-lamp')!.body.translation().x< -7.8);}
  /** A cable runs through the kitchen doorway (where the leaves would shut on it). */
  throughDoor(cable:Cable){return cable.points.slice(1).some((b,i)=>segmentHits(cable.points[i],b,{id:'door',minX:-1.55,maxX:1.55,minZ:-.2,maxZ:.5}));}
  doorBusy(){return this.cables.some(c=>!c.lead.dead&&(c.ports[0]||c.ports[1])&&this.throughDoor(c));}
  /** Nothing inside the dark storeroom can be found until it is lit, and the doorstop can't be pulled
   *  out from under cables running through the door (the leaves would shut and cut them). */
  canGrab(p:Point){
    const wedge=this.prop('wedge');if(wedge&&distance(p,wedge.body.translation())<.05&&this.doorWedged()&&this.doorBusy())return false;
    return this.lit()||!this.inStore(p);}
  /** The socket a held plug would go into: the one nearest the plug itself, not Pip's body. */
  plugTarget(cable:Cable,end:0|1){const pos=this.game.player.translation(),other=(1-end) as 0|1,plug=cable.ends[end];
    return this.ports.filter(p=>Math.min(distance(pos,p.pos)-.3,distance(plug,p.pos))<1.4&&p.id!==cable.ports[other]&&(this.lit()||!this.inStore(p.pos))&&!(p.id==='lift'&&this.capDocked)).sort((a,b)=>distance(plug,a.pos)-distance(plug,b.pos))[0];}
  interact(cableOnly:boolean):boolean{
    const g=this.game,pos=g.player.translation();
    if(g.held)return false;
    if(this.held){const {cable,end}=this.held,other=(1-end) as 0|1;
      const target=this.plugTarget(cable,end);
      if(target&&cable.rope.strain<1.1){
        const otherPort=this.ports.find(p=>p.id===cable.ports[other]);
        const count=this.cables.reduce((n,c)=>n+c.ports.filter(id=>id===target.id).length,0);
        const validRole=!otherPort||!(target.role==='out'&&otherPort.role==='out')&&!(target.role==='in'&&otherPort.role==='in');
        if(count<target.capacity&&validRole){cable.ports[end]=target.id;cable.ends[end].copy(target.pos);cable.pluggedAt=g.time;
          // Only the mechanical click now; the chime waits a step to see whether the connection holds.
          g.audio.noise(.025,.08,3200,'highpass');g.audio.noise(.025,.07,2600,'highpass',.05);this.chimeAt={time:this.circuit.time,events:this.circuit.events.length};
          g.burst(target.pos,'#fff3a3',12,'spark');this.held=undefined;g.holdingPlug=false;return true;}
      }
      this.release();return true;
    }
    if(!cableOnly){
      if(this.job.tray==='baked'&&distance(pos,this.prop('tray')!.body.translation())<1.65)return false;
      const source=this.ports.find(p=>(p.id==='a'||p.id==='b')&&distance(pos,p.pos)<2);
      if(source&&this.circuit.sources.find(s=>s.id===source.id)!.tripped){this.circuit.resetBreaker(source.id);this.resetAt=g.time;g.audio.noise(.08,.1,500);g.audio.tone(140,.1,.06,'square');return true;}
      // A second press right after a reset does nothing (a double tap never pulls a cable out).
      if(source&&g.time-this.resetAt<.6)return true;
      const switches:Record<string,Point>={oven:{x:-2.5,z:-6.9},conveyor:{x:5,z:-5},lift:WINCH,'store-lamp':{x:-10,z:-3}};
      const machine=Object.entries(switches).find(([,p])=>distance(pos,p)<1.25);
      if(machine){const load=this.load(machine[0]);load.enabled=!load.enabled;g.audio.noise(.03,.06,2500,'highpass');g.audio.tone(load.enabled?320:160,.1,.04);return true;}
      // E grabs things; only F picks up, plugs and unplugs cables.
      return false;
    }
    const nearby=this.cables.flatMap(c=>[0,1].map(end=>({c,end:end as 0|1,d:distance(pos,c.ends[end])}))).filter(v=>v.d<1.75).sort((a,b)=>a.d-b.d)[0];
    if(nearby){const {c,end}=nearby;
      if(c.lead.dead){
        // A splice through a door that will shut again would just be cut again: wedge it first.
        if(c.cause==='cut'&&!this.doorWedged()&&this.throughDoor(c)){g.shrug();return true;}
        c.lead.dead=false;c.lead.heat=0;c.cause=undefined;c.nicked=false;g.cost+=15;g.audio.knock(1.3);g.audio.plug();return true;}
      c.ports[end]=null;this.held={cable:c,end};g.holdingPlug=true;g.audio.pop();return true;}
    return false;
  }
  chimeAt?:{time:number;events:number};
  inStore(p:Point){return p.x< -7.8&&p.z<0;}
  /** Text prompt for the key that does something useful here (mirrors interact()). */
  promptAt():{key:string;text:string}|null{
    const g=this.game,pos=g.player.translation(),names:Record<string,string>={a:'cart A',b:'cart B',kitchen:'kitchen power post',fridge:'fridge',conveyor:'conveyor motor',lift:'lift winch',cap:'capacitor cart'};
    const portName=(id:string)=>names[id]??'splitter';
    // The first time each kind of fault happens, its cause is named for a few seconds.
    if(this.telling&&g.time<this.telling.until&&!g.held&&!this.held)return {key:'',text:SENTENCE[this.telling.fault]};
    if(g.held){const id=g.held.spec.id;
      if(id==='mop')return {key:'E',text:this.water>.1?'Stand in the leak to mop it up  ·  E puts the mop down':'Put the mop down'};
      if(id==='wedge')return {key:'E',text:distance(pos,{x:0,z:.5})<2.4?'Wedge the door open':'Carry the doorstop to the kitchen door'};
      if(id==='cooler-box')return {key:'E',text:'Carry it to the fridge to cool the lunch'};
      if(id==='tray')return {key:'E',text:distance(pos,{x:0,z:-7})<2?'Put the tray on the conveyor':'Carry the tray to the start of the conveyor'};
      if(id==='capacitor')return {key:'E',text:distance(g.held.body.translation(),WINCH)<2?'Park the cart by the winch':'Push the capacitor cart'};
      return null;}
    if(this.held){const {cable,end}=this.held;
      const target=this.plugTarget(cable,end);
      if(target)return {key:'F',text:`Plug into the ${portName(target.id)}`};
      return cable.rope.strain>.97?{key:'Q',text:'Let go to slingshot the cable'}:{key:'F',text:'Drop the cable end'};}
    const trip=this.ports.find(p=>(p.id==='a'||p.id==='b')&&distance(pos,p.pos)<2&&this.circuit.sources.find(s=>s.id===p.id)!.tripped);
    if(trip)return {key:'E',text:`Reset the tripped breaker on ${portName(trip.id)}`};
    if(this.job.tray==='baked'&&distance(pos,this.prop('tray')!.body.translation())<1.65)return {key:'E',text:'Pick up the baked tray'};
    const switches:[string,Point,string,string][]=[['oven',{x:-2.5,z:-6.9},'oven','kitchen'],['conveyor',{x:5,z:-5},'conveyor','conveyor'],['lift',WINCH,'lift','lift'],['store-lamp',{x:-10,z:-3},'storeroom lamp','kitchen']];
    const sw=switches.find(([,p])=>distance(pos,p)<1.25);
    if(sw){const load=this.load(sw[0]);return {key:'E',text:`Switch the ${sw[2]} ${load.enabled?'off':'on'}${!load.enabled&&!this.fed(sw[3])?' (nothing feeds it yet)':''}`};}
    const nearby=this.cables.flatMap(c=>[0,1].map(end=>({c,d:distance(pos,c.ends[end])}))).filter(v=>v.d<1.75).sort((a,b)=>a.d-b.d)[0];
    if(nearby){const c=nearby.c;
      if(c.lead.dead){if(c.cause==='cut')return !this.doorWedged()&&this.throughDoor(c)?{key:'',text:'Wedge the door first: it would cut the splice again'}:{key:'F',text:'Splice the cut cable (costs 15)'};
        return {key:'F',text:'Replace the scorched cable (costs 15)'};}
      return {key:'F',text:`Pick up the ${c.rating>3?'thick':'thin'} cable end`};}
    return null;
  }
  /** Letting go of a stretched cable slingshots props lying along it back toward its anchor. */
  release(){if(!this.held)return;const {cable,end}=this.held,energy=cable.rope.release(),g=this.game;
    if(energy>1){g.shake=Math.min(.5,energy*.006);g.audio.tone(90,.3,.1,'sawtooth');g.alarm(cable.ends[end],6);const anchor=cable.ends[(1-end) as 0|1];
      for(const prop of g.props){const p=prop.body.translation();if(cable.points.slice(1).some((b,i)=>segmentDistance(p,cable.points[i],b)<.8)){const v=new T.Vector3(anchor.x-p.x,0,anchor.z-p.z).normalize(),impulse=Math.min(energy*.2,40);prop.body.applyImpulse({x:v.x*impulse,y:impulse*.6,z:v.z*impulse},true);}}}
    else g.audio.thud(.5);
    cable.ends[end].y=.15;this.held=undefined;g.holdingPlug=false;
  }
  pull(){if(!this.held)return {x:0,z:0};return this.held.cable.rope.pull(this.game.player.translation());}
  bridgeNear(p:Point,radius=1.15){return this.game.props.some(prop=>prop.spec.kind==='bridge'&&distance(prop.body.translation(),p)<radius&&prop.body.translation().y<.6);}
  /** The puddle (if any, and not under a cable bridge) that a point on the floor stands in. */
  puddleAt(p:Point,grow=1){if(this.water<=.1)return undefined;return PUDDLES.find(([x,z,r])=>{const c={x,z},s=r*this.water*grow;return Math.hypot((p.x-x)/1.4,p.z-z)<s&&!this.bridgeNear(c,1.3);});}
  /** Water is only dangerous where it reaches bare metal: a plug or socket at either end, or a cable
   *  whose insulation a bot has scuffed. Intact insulation lying in a puddle is fine. */
  wet(cable:Cable){
    const hit=cable.ends.map(e=>e.y<.6?this.puddleAt(e,1.15):undefined).find(Boolean)??(cable.nicked?PUDDLES.find(([x,z,r])=>this.water>.1&&cable.points.slice(1).some((b,i)=>segmentDistance({x,z},cable.points[i],b)<r*1.2*this.water)&&!this.bridgeNear({x,z},1.3)):undefined);
    if(hit)this.wetAt={x:hit[0],z:hit[1]};return !!hit;}
  /** Where something went wrong stays marked for a while: scorch, smoke and the fault's own badge. */
  scar(at:Point,kind:Fault){const g=this.game,mark=new T.Group();mark.position.set(at.x,0,at.z);
    const burn=part(mark,new T.CircleGeometry(.55,20),unlit('#3a3140',{transparent:true,opacity:.7,depthWrite:false}),0,.025,0,false);burn.rotation.x=-Math.PI/2;burn.visible=kind==='overheat'||kind==='pinched';
    const badge=new T.Sprite(new T.SpriteMaterial({map:faultTexture(kind),depthTest:false}));badge.scale.set(.9,.9,1);badge.position.y=1.6;badge.renderOrder=9;badge.userData.fault=kind;mark.add(badge);g.root.add(mark);this.scars.push({mark,life:7,at:new T.Vector3(at.x,.3,at.z)});
    this.tell(kind);}
  tell(kind:Fault){if(this.told.has(kind))return;this.told.add(kind);this.telling={fault:kind,until:this.game.time+3.5};}
  nearPuddle(p:Point){return PUDDLES.some(([x,z,r])=>distance(p,{x,z})<r+1.2);}
  doorWedged(){const g=this.game,wedge=this.prop('wedge')!,p=wedge.body.translation();return g.held!==wedge&&distance(p,{x:0,z:0})<1.9&&p.y<1.2;}
  /** Forgiving drops: a doorstop near the door jams in beside the open right leaf; a cable bridge
   *  near the bots' line settles onto it, lined up with their direction of travel. */
  dropped(prop:Prop){const p=prop.body.translation(),turn=(a:number)=>new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a);
    if(prop.spec.id==='wedge'&&distance(this.game.player.translation(),{x:0,z:.5})<2.4){prop.body.setTranslation({x:1.02,y:.2,z:this.doorAngle>.2?this.doorSide*1.25:1.25},true);prop.body.setRotation(turn(Math.PI/2),true);prop.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);}
    if(prop.spec.kind==='bridge'){const x=T.MathUtils.clamp(p.x,LANE.x0,LANE.x1),z=T.MathUtils.clamp(p.z,LANE.z0,LANE.z1),edges=[{x,z:LANE.z0,a:0},{x,z:LANE.z1,a:0},{x:LANE.x0,z,a:Math.PI/2},{x:LANE.x1,z,a:Math.PI/2}];
      const edge=edges.sort((a,b)=>distance(p,a)-distance(p,b))[0];if(distance(p,edge)<1.4){prop.body.setTranslation({x:edge.x,y:.12,z:edge.z},true);prop.body.setRotation(turn(edge.a),true);}}
  }
  /** Fixed furniture and nearby solid props a cable can wrap round, minus any it starts or ends inside. */
  wrapObstacles(cable:Cable,end:Point){
    const route=cable.points.length>1?cable.points:[cable.rope.anchor,end],near=(c:Point,r:number)=>Math.min(...route.slice(1).map((b,i)=>segmentDistance(c,route[i],b)),distance(c,end))<r;
    const inside=(o:Obstacle,p:Point)=>p.x>o.minX-.15&&p.x<o.maxX+.15&&p.z>o.minZ-.15&&p.z<o.maxZ+.15;
    const props:Obstacle[]=this.game.props.filter(p=>WRAPS.has(p.spec.kind)&&p.mesh.visible&&p!==this.game.held&&p.body.translation().y<1.8&&near(p.body.translation(),1.4)).slice(0,10).map(p=>{
      const pos=p.body.translation(),[w,,d]=prefabs[p.spec.kind].size,r=new T.Matrix4().makeRotationFromQuaternion(p.mesh.quaternion).elements;
      const hx=Math.abs(r[0])*w/2+Math.abs(r[8])*d/2+.05,hz=Math.abs(r[2])*w/2+Math.abs(r[10])*d/2+.05;return {id:`prop-${p.body.handle}`,minX:pos.x-hx,maxX:pos.x+hx,minZ:pos.z-hz,maxZ:pos.z+hz};});
    return [...FIXED.filter(o=>near({x:(o.minX+o.maxX)/2,z:(o.minZ+o.maxZ)/2},2+Math.max(o.maxX-o.minX,o.maxZ-o.minZ)/2)),...props].filter(o=>!inside(o,cable.rope.anchor)&&!inside(o,end));
  }
  step(dt:number){const g=this.game,p=g.player.translation(),before=this.circuit.events.length;
    for(const port of this.ports)if(port.bodyId){const prop=this.prop(port.bodyId);if(prop){const pos=prop.body.translation();port.pos.set(pos.x,pos.y+port.lift,pos.z);}}
    const wedged=this.doorWedged(),open=wedged||distance(p,{x:0,z:.2})<2.6;
    if(this.doorAngle<.05&&!wedged)this.doorSide=p.z>DOOR.z?-1:1;
    this.doorAngle=T.MathUtils.lerp(this.doorAngle,open?1:0,dt*7);const shut=this.doorWasOpen&&this.doorAngle<=.15&&!wedged;if(this.doorWasOpen!==this.doorAngle>.15)g.audio.noise(.22,.035,shut?260:700);
    // The rush starts when the kitchen door first opens: from then on an unpowered fridge warms.
    if(this.doorAngle>.15)this.job.warming=true;
    for(const leaf of this.leaves){const angle=leaf.closed+leaf.dir*this.doorSide*Math.PI*.47*this.doorAngle;leaf.pivot.rotation.y=angle;
      const center=new T.Vector3(.72,1.05,0).applyAxisAngle(new T.Vector3(0,1,0),angle).add(leaf.pivot.position);leaf.body.setNextKinematicTranslation(center);leaf.body.setNextKinematicRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle));
      // A leaf swung open (or wedged) stands aside: it no longer blocks anyone, so Pip can't get
      // pinned between it, the doorstop and the wall. It is solid again as it swings shut.
      const solidLeaf=this.doorAngle<.5;if(leaf.collider.isEnabled()!==solidLeaf)leaf.collider.setEnabled(solidLeaf);}
    if(g.held?.spec.id==='mop'&&this.nearPuddle(p))this.water=Math.max(0,this.water-dt*.3);
    if(g.held?.spec.id==='cooler-box'&&distance(p,{x:-5.6,z:-1.8})<2){this.job.cooled=true;g.audio.bell(988,.6,.05);g.held=undefined;}
    // Docking: parked within 2 m of the winch, the cart's own lead plugs into the winch socket.
    const capacitor=this.prop('capacitor')!,capPos=capacitor.body.translation(),docked=g.held!==capacitor&&distance(capPos,WINCH)<2;
    if(docked!==this.capDocked){this.capDocked=docked;this.capLead.closed=docked;this.capCordKey='';
      if(docked){g.audio.plug();g.burst({x:12.62,y:.4,z:-4.8},'#fff3a3',8,'spark');
        // A cable already in the winch socket comes out: the cart's lead takes it.
        for(const c of this.cables)for(const e of [0,1] as const)if(c.ports[e]==='lift')c.ports[e]=null;}}
    this.stepDolly();
    for(const cable of this.cables){
      for(const end of [0,1] as const){const port=this.ports.find(q=>q.id===cable.ports[end]);if(port)cable.ends[end].copy(port.pos);}
      if(this.held?.cable===cable)cable.ends[this.held.end].set(p.x+Math.sin(g.heading)*.6,p.y+.1,p.z+Math.cos(g.heading)*.6);
      const active=this.held?.cable===cable?this.held.end:cable.active,other=(1-active) as 0|1;
      if(active!==cable.active){cable.rope.flip(cable.ends[other]);cable.active=active;}
      cable.rope.anchor=cable.ends[other];cable.points=cable.rope.update(cable.ends[active],[...g.level.obstacles,...this.wrapObstacles(cable,cable.ends[active])]);
      const port0=this.ports.find(q=>q.id===cable.ports[0]);const reversed=port0?.role==='in'||(port0?.role==='both'&&this.ports.find(q=>q.id===cable.ports[1])?.role==='out');
      cable.lead.from=(reversed?cable.ports[1]:cable.ports[0])??'';cable.lead.to=(reversed?cable.ports[0]:cable.ports[1])??'';cable.lead.closed=!!cable.lead.from&&!!cable.lead.to;
      cable.lead.wet=this.wet(cable);
      // A plug still in a live cart with its other end lying bare in the water leaks to earth: the cart cuts out.
      const live=cable.ports.find(id=>id==='a'||id==='b'),loose=cable.ports.indexOf(null);
      if(live&&loose>=0&&!cable.lead.dead&&this.held?.cable!==cable){const source=this.circuit.sources.find(s=>s.id===live)!,puddle=this.puddleAt(cable.ends[loose],1.15);
        if(puddle&&!source.tripped){source.tripped=true;this.circuit.events.push({time:this.circuit.time,kind:'short',id:live});this.wetAt={x:puddle[0],z:puddle[1]};}}
      // The leaves snap shut across the whole opening and cut any cable left through it.
      if(shut&&this.throughDoor(cable)&&!cable.lead.dead){cable.lead.dead=true;cable.cause='cut';g.audio.tone(80,.2,.08,'sawtooth');g.burst({x:0,y:.5,z:.15},'#fff3a3',16,'spark');g.alarm(DOOR);this.scar({x:cable.points[1]?.x??0,z:.15},'pinched');}
      if(cable.rope.strain>1.25&&cable.lead.closed){cable.ports[1]=null;cable.lead.closed=false;g.audio.tone(110,.2,.05);}
    }
    this.doorWasOpen=this.doorAngle>.15;
    // Cleaner bots snag a live cable lying across their line and drag its plug along for a while.
    const w=LANE.x1-LANE.x0,h=LANE.z1-LANE.z0,loop=2*(w+h);
    this.bots.forEach((bot,i)=>{const t=(g.time*.8+i*loop/2)%loop;
      const pos=t<w?new T.Vector3(LANE.x0+t,0,LANE.z0):t<w+h?new T.Vector3(LANE.x1,0,LANE.z0+t-w):t<2*w+h?new T.Vector3(LANE.x1-(t-w-h),0,LANE.z1):new T.Vector3(LANE.x0,0,LANE.z1-(t-2*w-h));
      bot.group.rotation.y=t<w?Math.PI/2:t<w+h?0:t<2*w+h?-Math.PI/2:Math.PI;bot.group.position.copy(pos);
      if(bot.snag){bot.snag.left-=dt;bot.snag.cable.ends[bot.snag.end].set(pos.x,.18,pos.z);if(bot.snag.left<=0||this.held?.cable===bot.snag.cable)bot.snag=undefined;return;}
      if(this.bridgeNear(pos))return;
      // A plug that has only just gone in gets a moment to hold before a bot can bump it out.
      for(const cable of this.cables){if(!cable.lead.closed||g.time-cable.pluggedAt<1.2||this.bots.some(b=>b.snag?.cable===cable)||!cable.points.slice(1).some((b,j)=>segmentDistance(pos,cable.points[j],b)<.35))continue;
        const end=(cable.ports[1]&&this.ports.find(q=>q.id===cable.ports[1])?.role!=='out'?1:0) as 0|1;g.burst(cable.ends[end],'#fff3a3',10,'spark');cable.ports[end]=null;cable.nicked=true;bot.snag={cable,end,left:4};g.audio.tone(140,.2,.06);g.burst({x:pos.x,y:.3,z:pos.z},'#fff3a3',8,'spark');g.alarm(pos);break;}
    });
    // The capacitor cart charges only from current it really draws through its inlet: a bar while the
    // lift is off, a trickle while it runs, nothing while it is giving the lift its start-up kick.
    const lift=this.load('lift'),cap=lift.capacitor!,charger=this.load('cap'),kicking=lift.enabled&&this.capDocked&&(lift.state!=='on'||this.circuit.time-lift.started<(lift.kickSeconds??1));
    charger.steady=lift.state==='on'?.4:1;charger.enabled=cap.charge<11.99&&!kicking;const charge=cap.charge;
    this.circuit.tick(dt);
    if(cap.charge>charge)cap.charge=charge;if(charger.state==='on')cap.charge=Math.min(12,cap.charge+charger.steady*dt);
    if(cap.charge<charge-1e-6&&Math.random()<dt*14){g.burst({x:12.62,y:.5,z:-4.8},'#6fe9ff',3,'spark');}
    if(cap.charge<charge-1e-6&&charge-cap.charge>.04&&this.circuit.time-lift.started<dt*1.5)g.audio.thud(18);
    // A motor on a cart that cuts out drops out with it (no-volt release): after a reset it stays off
    // until it is switched on again, one at a time, rather than every motor kicking at once.
    const trips=this.circuit.events.slice(before).filter(e=>e.kind==='trip'||e.kind==='short');
    if(trips.length){const starting=this.circuit.loads.filter(l=>(l.kick??0)>0&&l.enabled&&this.circuit.time-l.started<1.5&&l.state!=='on').sort((a,b)=>b.started-a.started)[0];
      for(const trip of trips){
        if(trip.kind==='short'){if(this.wetAt)this.scar(this.wetAt,'leak');}
        else if(starting){this.surgeHint=starting.id as 'lift'|'conveyor';this.surgeUntil=g.time+6;this.tell('surge');if(starting.id==='conveyor'){this.beltJerk=1;g.audio.tone(70,.45,.08,'sawtooth');}}
        else this.tell('overload');}
      for(const motor of ['conveyor','lift'].map(id=>this.load(id)))if(motor.state==='brownout')motor.enabled=false;}
    // The plug chime plays once the new connection has held for a step without tripping anything.
    if(this.chimeAt&&this.circuit.time>this.chimeAt.time){const failed=this.circuit.events.slice(this.chimeAt.events).some(e=>e.kind==='trip'||e.kind==='short');if(!failed)[880,1109,1319].forEach((f,i)=>g.audio.bell(f,.5,.04,i*.07));this.chimeAt=undefined;}
    for(const event of this.circuit.events.slice(this.eventIndex)){
      if(event.kind==='trip'||event.kind==='short'){g.audio.tone(75,.25,.1,'square');const source=this.ports.find(q=>q.id===event.id);if(source){g.burst(source.pos,'#fff3a3',18,'spark');g.burst(source.pos,'#8d8a96',5,'dust');g.alarm(source.pos);}g.audio.noise(.25,.1,300);g.shake=.15;}
      if(event.kind==='scorch'){const cable=this.cables.find(c=>c.id===event.id);if(cable)cable.cause='scorch';const at=cable?.points[Math.floor(cable.points.length/2)]??{x:0,z:0};g.audio.tone(60,.4,.08,'sawtooth');this.puff(new T.Vector3(at.x,.3,at.z));this.scar(at,'overheat');g.burst({x:at.x,y:.3,z:at.z},'#ff9a3d',10,'spark');}
      if(event.kind==='start'&&event.id!=='cap')g.audio.tone(event.id==='lift'?180:260,.15,.03,'triangle');
      // The lift's start-up kick tripped a breaker and no capacitor was in its feed: show the hint.
      if(event.kind==='trip'){if(lift.capacitor&&!lift.capacitor.atLoad&&this.circuit.time-lift.started<1.5&&this.surgeHint==='lift')this.capHint=true;}
    }
    this.eventIndex=this.circuit.events.length;
    // The lift counts as started once it has run 3 s without tripping anything.
    this.liftOnFor=lift.state==='on'?this.liftOnFor+dt:0;if(this.liftOnFor>3)this.liftRan=true;
    this.maxTemperature=Math.max(this.maxTemperature,this.job.temperature);
    this.job.tick(dt,{oven:this.powered('oven'),fridge:this.powered('fridge'),conveyor:this.powered('conveyor'),lift:this.powered('lift')});
    const tray=this.prop('tray')!;
    if(this.job.tray==='baked'&&!tray.mesh.visible){tray.mesh.visible=true;tray.body.setEnabled(true);tray.body.setTranslation({x:-2.5,y:1,z:-6.4},true);g.audio.bell(1319,.8,.06);g.audio.bell(1760,.8,.04,.12);g.burst({x:-2.5,y:1.2,z:-6.6},'#fffaf0',8,'dust');}
    if(g.held===tray)this.job.pickTray();
    if(this.job.tray==='carried'&&g.held!==tray&&distance(tray.body.translation(),{x:0,z:-7})<2){this.job.placeTray();tray.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);tray.body.setTranslation({x:BELT_START,y:1.18,z:-7},true);tray.lastSpeed=0;}
    // Along the belt to its end at the car's sill, then a little hop onto the car, then up with it.
    if(['conveyor','lift','delivered'].includes(this.job.tray)){if(this.job.tray!=='conveyor')this.trayHop=Math.min(1,this.trayHop+dt/.5);const hop=this.trayHop;
      tray.body.setNextKinematicTranslation(this.job.tray==='conveyor'?{x:BELT_START+this.job.transport*(BELT_END-BELT_START),y:1.18,z:-7}:{x:T.MathUtils.lerp(BELT_END,12,hop),y:1.18+this.job.height*2.5+Math.sin(hop*Math.PI)*.3,z:-7});}
    if(this.powered('oven')&&this.job.tray==='raw'&&Math.random()<dt*2)this.puff(new T.Vector3(-1.9,2.9,-8.4),'#fffaf0');
    const scorching=this.job.tray==='burned'||(this.job.tray==='baked'&&this.job.ovenWait>BURN_WARNING&&this.powered('oven'));
    if(scorching&&Math.random()<dt*3)this.puff(new T.Vector3(-2.7,2,-7.4));
    if(this.job.tray==='baked'&&this.job.ovenWait>BURN_WARNING&&Math.floor(this.job.ovenWait)%2===0&&Math.floor(this.job.ovenWait-dt)%2===1)g.audio.tone(880,.12,.04,'square');
    if(this.job.done&&!g.won)g.win();
    // Failure gets an in-world beat first: the fridge (or oven) puffs, everyone groans, then the tag drops.
    if(this.job.failed&&!g.won){g.won=true;const at=this.job.tray==='burned'?{x:-2.5,z:-7.2}:{x:-5.3,z:-2.1};g.alarm(at,9);for(let k=0;k<6;k++)this.puff(new T.Vector3(at.x+(k%3-1)*.3,1.6+k*.1,at.z));g.audio.tone(120,.7,.05,'triangle');for(let i=0;i<3;i++)setTimeout(()=>g.audio.voice('groan',.8+i*.2),200+i*250);
      setTimeout(()=>{gameUI(g)?.failed(this.job);document.body.dataset.failed='true';},1200);}
  }
  /** The thick cable's dolly trails 2.8 m behind Pip along the cable itself (never beside him), and
   *  once the cable is let go it rolls clear of the kitchen doorway instead of parking in it. */
  stepDolly(){const dolly=this.prop('thick-dolly');if(!dolly)return;const pos=dolly.body.translation(),vy=dolly.body.linvel().y;
    if(this.game.held===dolly){this.dollyPark=undefined;return;}
    const thick=this.held?.cable.rating===10?this.held.cable:undefined;
    if(thick&&thick.points.length>1){const pts=thick.points,total=pts.slice(1).reduce((n,b,i)=>n+distance(pts[i],b),0);let want=Math.max(0,total-2.8),target:Point=pts[0];
      for(let i=1;i<pts.length;i++){const len=distance(pts[i-1],pts[i]);if(want<=len){const t=len?want/len:0;target={x:T.MathUtils.lerp(pts[i-1].x,pts[i].x,t),z:T.MathUtils.lerp(pts[i-1].z,pts[i].z,t)};break;}want-=len;target=pts[i];}
      const dx=target.x-pos.x,dz=target.z-pos.z,d=Math.hypot(dx,dz),speed=Math.min(4.5,d*4);
      if(d>.25)dolly.body.setLinvel({x:dx/d*speed,y:vy,z:dz/d*speed},true);this.dollyPark=undefined;return;}
    if(!this.dollyPark&&distance(pos,DOOR)<2.2)this.dollyPark=[{x:-2.6,z:-1},{x:-2.6,z:1.4}].sort((a,b)=>distance(pos,a)-distance(pos,b))[0];
    if(this.dollyPark){const dx=this.dollyPark.x-pos.x,dz=this.dollyPark.z-pos.z,d=Math.hypot(dx,dz);if(d<.15){this.dollyPark=undefined;return;}dolly.body.setLinvel({x:dx/d*Math.min(3,d*4),y:vy,z:dz/d*Math.min(3,d*4)},true);}}
  updateScars(dt:number){for(const s of [...this.scars]){s.life-=dt;const badge=s.mark.children[1] as T.Sprite;badge.scale.setScalar(.9+Math.sin(s.life*8)*.08);badge.visible=s.life>2;if(Math.random()<dt*2.5)this.puff(s.at.clone().setY(.2));if(s.life<=0){this.game.root.remove(s.mark);this.scars.splice(this.scars.indexOf(s),1);}}}
  /** A little cloud of toon smoke (pooled particles). */
  puff(at:T.Vector3,color='#8d8a96'){this.game.burst(at,color,3,'smoke');}
  render(dt:number){const g=this.game;this.updateScars(dt);
    for(const [i,m] of this.puddles.entries())m.scale.setScalar(Math.max(.001,this.water*(1-i*.02)));this.puddles.forEach(m=>m.scale.x*=1.4);this.dark.visible=!this.lit();
    for(const id of ['capacitor','cooler-box']){const prop=this.prop(id);if(prop)prop.mesh.visible=this.lit()||!this.inStore(prop.body.translation());}
    for(const f of this.followers){f.group.position.copy(f.prop.mesh.position);f.group.quaternion.copy(f.prop.mesh.quaternion);f.group.visible=f.prop.mesh.visible;}
    this.bakeGauge.set(this.job.bake/20);const oven=this.powered('oven');const hot=this.job.tray==='burned'||this.job.ovenWait>BURN_WARNING;this.ovenWindow.material=oven?(hot?HOT_WINDOW:OVEN_WINDOW):toon('#3a3d55');this.ovenLight.intensity=oven?5:0;this.ovenGlow.material.opacity=oven?.45:0;
    const temp=this.job.temperature;this.thermoFill.scale.y=Math.max(.02,temp);this.thermoFill.position.y=.68+Math.max(.02,temp)*.5;this.thermoFill.material=toon(temp>.8?'#e5484d':temp>.6?'#ff8a3d':'#ffc94d');
    this.sad.visible=temp>.8||(this.job.failed&&this.job.tray!=='burned');this.sad.position.y=2.9+Math.sin(g.time*6)*.05;
    // The belt lurches when its start-up kick trips the cart, then stands still.
    this.beltJerk=Math.max(0,this.beltJerk-dt*3);const twin=this.belt.userData.twin as T.Texture;
    if(this.powered('conveyor')||this.beltJerk>0){this.belt.offset.x-=dt*(this.beltJerk>0?2.5*Math.sin(this.beltJerk*20):.2);twin.offset.x=this.belt.offset.x*2.9/8.5;}
    this.liftCar.position.y=1.12+this.job.height*2.5;
    this.drawLiftRope();
    // The drum reels in while the lift climbs.
    if(this.powered('lift')&&this.job.tray==='lift')(this.drum.getObjectByName('spin') as T.Object3D).rotation.x-=dt*4;
    const lampTops:Record<string,T.Vector3>={'store-lamp':new T.Vector3(-10,1.9,-3),'kitchen-lamp':(()=>{const t=this.prop('portable-lamp')!.mesh;return new T.Vector3(0,.55,0).applyQuaternion(t.quaternion).add(t.position);})()};
    for(const [id,lamp] of this.lamps){const on=this.powered(id),top=lampTops[id];lamp.bulb.position.copy(top);lamp.bulb.material=on?lit('#fff3c8','#ffe7a8',1):toon('#bbb6a8');lamp.glow.position.copy(top);lamp.glow.material.opacity=on?.35:0;lamp.light.position.copy(top).setY(top.y+.2);lamp.light.intensity=on?5:0;}
    const lamp=this.prop('portable-lamp')!.mesh.position;const cordPts=[new T.Vector3(-4,.4,-3.15),new T.Vector3((lamp.x-4)/2,.05,(lamp.z-3.15)/2),new T.Vector3(lamp.x,.05,lamp.z)];
    if(distance(lamp,{x:-4,z:-3.15})>.3){this.cord.geometry.dispose();this.cord.geometry=new T.TubeGeometry(new T.CatmullRomCurve3(cordPts),24,.016,5);}
    for(const [id,{gauge,mount,button}] of this.supplyGauges){const prop=this.prop(`supply-${id}`)!,source=this.circuit.sources.find(s=>s.id===id)!,draw=this.circuit.draw.get(id)??0;
      // A tripped cart wears a pulsing breaker badge until someone presses its reset button.
      let alert=this.alerts.get(id);if(!alert){alert=new T.Sprite(new T.SpriteMaterial({map:faultTexture('overload'),depthTest:false}));alert.renderOrder=9;g.root.add(alert);this.alerts.set(id,alert);}
      alert.visible=source.tripped;if(source.tripped){const last=[...this.circuit.events].reverse().find(e=>e.id===id&&(e.kind==='trip'||e.kind==='short'));const kind:Fault=last?.kind==='short'?'leak':this.surgeHint&&g.time<this.surgeUntil?'surge':'overload';
        if(alert.material.map!==faultTexture(kind)){alert.material.map=faultTexture(kind);alert.material.needsUpdate=true;}
        alert.position.copy(prop.mesh.position).setY(2.4+Math.sin(g.time*6)*.08);alert.scale.setScalar(1.05+Math.sin(g.time*10)*.12);}
      gauge.set(source.tripped?1:draw/6);mount.position.copy(prop.mesh.position).add(new T.Vector3(.15,.75,-.05).applyQuaternion(prop.mesh.quaternion));mount.quaternion.copy(prop.mesh.quaternion);mount.rotateX(-.5);
      button.position.copy(prop.mesh.position).add(new T.Vector3(.56,.66,-.28).applyQuaternion(prop.mesh.quaternion));(button.material as T.MeshToonMaterial).emissiveIntensity=source.tripped?.9+Math.sin(g.time*10)*.5:0;
      // Budget pips: one lit green per bar given, all red when the cart has cut out.
      this.budget.get(id)?.forEach((pip,i)=>{const want=source.tripped?toon('#e5484d'):draw>i+.01?lit('#57e38f','#3fdc7f',.8):toon('#3a3d55');if(pip.material!==want)pip.material=want;});}
    const holding=!!this.held;
    for(const port of this.ports){port.ring.position.copy(port.pos);port.ring.position.y=Math.max(.05,port.pos.y-.25);const source=this.circuit.sources.find(s=>s.id===port.id);const material=port.ring.material as T.MeshBasicMaterial;
      // The fridge's socket ring calls for attention while the lunch is warming with nothing feeding it.
      const fridgeCall=port.id==='fridge'&&!this.powered('fridge')&&!this.job.cooled&&this.job.warming&&temp>.45;
      material.color.set(source?.tripped?'#f35b66':fridgeCall?'#ffc94d':'#63d8d0');material.opacity=holding||fridgeCall?.95:.35;port.ring.visible=(this.lit()||!this.inStore(port.pos))&&!(port.id==='lift'&&this.capDocked);port.ring.scale.setScalar(holding||fridgeCall?1+Math.sin(g.time*5)*.08:1);}
    const dolly=this.prop('thick-dolly');
    for(const cable of this.cables){const active=cable.active,held=this.held?.cable===cable;
      if(cable.points.length>1){const end=held?g.handPosition():cable.ends[active].clone();if(held)cable.plugs[active].position.copy(end);
        const sampled=cablePath(cable.points,end,cable.ends[(1-active) as 0|1].y,cable.rope.strain);
        // The thick cable runs up over its dolly's drum rather than through the deck.
        if(cable.rating>3&&dolly){const d=dolly.mesh.position;for(const s of sampled){const r=Math.hypot(s.x-d.x,s.z-d.z);if(r<.95)s.y=Math.max(s.y,(d.y+.55)*Math.sqrt(1-(r/.95)**2));}}
        // Hose look: dead cables go black; an overheating one smoulders dark red-brown with a flicker
        // (strain alone never does that), the thick one keeps its black bands; live cables carry pulses.
        const heat=cable.lead.heat,flicker=.5+.5*Math.sin(g.time*18+cable.id.length);
        const tint=cable.lead.dead?DEAD:heat>.4?SCORCH.clone().lerp(heat>1.2?HOT:WARM,.35+.4*flicker):held?undefined:cable.rating>3?THICK:THIN;
        if(heat>.4&&!cable.lead.dead&&Math.random()<dt*heat*3){const at=sampled[Math.floor(Math.random()*sampled.length)];this.puff(at.clone().setY(.25));}
        const hose=hoseGeometry(sampled,{radius:cable.rating>3?.1:.075,bands:cable.rating>3,tint,strain:u=>cable.rope.strain*(.6+.4*u)});cable.mesh.geometry.dispose();cable.mesh.geometry=hose.geo;
        const current=(this.circuit.draw.get(cable.id)??0)>0&&!cable.lead.dead,fromAnchor=cable.lead.from===cable.ports[(1-active) as 0|1];cable.pulses.update(hose.curve,hose.length,g.time,current,!fromAnchor);}
      cable.plugs.forEach((plug,i)=>{if(!(held&&i===active))plug.position.copy(cable.ends[i]);const toward=cable.points[i===1-cable.active?1:cable.points.length-2];if(toward)plug.rotation.y=Math.atan2(-(toward.z-cable.ends[i].z),toward.x-cable.ends[i].x)+Math.PI;});
    }
    // A taut held cable startles anyone standing along it, as the other cable floors do.
    if(this.held&&this.held.cable.rope.strain>.85&&g.time-this.lastStrainAlarm>.7){this.lastStrainAlarm=g.time;const pts=this.held.cable.points;for(let i=1;i<pts.length;i++)for(let t=0;t<=1;t+=.25)g.alarm({x:T.MathUtils.lerp(pts[i-1].x,pts[i].x,t),z:T.MathUtils.lerp(pts[i-1].z,pts[i].z,t)},2.2);}
    this.renderCapacitor(dt);
    if(this.held)g.rope=this.held.cable.rope;g.audio.strain(this.held&&!g.paused&&!g.won?g.rope.strain:0);
    lunchHud(g.hud).update(this.job,this.circuit);
  }
  /** Winch drum → pulley on the frame → across → down to the car; rebuilt only when the car moves. */
  drawLiftRope(){const y=this.liftCar.position.y;if(Math.abs(y-this.liftRopeKey)<.005)return;this.liftRopeKey=y;
    const path=new T.CurvePath<T.Vector3>(),pts=[new T.Vector3(13.3,1.25,-5.05),new T.Vector3(13.3,3.42,-5.85),new T.Vector3(12,3.42,-7),new T.Vector3(12,y+1.2,-7)];
    for(let i=1;i<pts.length;i++)path.add(new T.LineCurve3(pts[i-1],pts[i]));this.liftRope.geometry.dispose();this.liftRope.geometry=new T.TubeGeometry(path,48,.03,6,false);}
  /** The cart's charge cans, its lead to the winch (with a plug and current pulses), the dock ring and the badges. */
  renderCapacitor(dt:number){const g=this.game,lift=this.load('lift'),cap=lift.capacitor!,capProp=this.prop('capacitor')!;
    this.capCans.forEach((can,i)=>{const fill=T.MathUtils.clamp(cap.charge/3-i,0,1);can.scale.y=Math.max(.001,fill*.72);can.position.y=-prefabs.capcart.size[1]/2+.44+fill*.36;});
    this.capCord.visible=this.capPlug.visible=this.capDocked;
    if(this.capDocked){const a=this.ports.find(p=>p.id==='cap')!.pos,key=`${a.x.toFixed(2)},${a.y.toFixed(2)},${a.z.toFixed(2)}`,b=new T.Vector3(12.62,.38,-4.8);
      if(key!==this.capCordKey){this.capCordKey=key;const mid=a.clone().lerp(b,.5).setY(.09);this.capCord.geometry.dispose();this.capCurve=new T.CatmullRomCurve3([a.clone().setY(.45),mid,b.clone().add(new T.Vector3(-.2,0,0))]);
        this.capCord.geometry=new T.TubeGeometry(this.capCurve,24,.06,8);this.capPlug.position.copy(b).add(new T.Vector3(-.18,0,0));this.capPlug.rotation.y=Math.PI;}}
    // Current pulses run down the cart's lead while it is feeding the winch, brightest as the kick is supplied.
    const giving=this.capDocked&&this.powered('lift');this.capPulses.update(this.capCurve,this.capCurve?.getLength()??1,g.time*(this.circuit.time-lift.started<1?3:1),giving);
    this.dockRing.visible=g.held===capProp;if(this.dockRing.visible){this.dockRing.rotation.y+=dt*.5;(this.dockRing.material as T.MeshBasicMaterial).opacity=distance(capProp.body.translation(),WINCH)<2?1:.6;}
    // The capacitor hint: over the cart, or over the storeroom door while the cart is still in the dark.
    const capFed=!!cap.atLoad;this.capBadge.visible=this.capHint&&!capFed;
    if(this.capBadge.visible){const q=capProp.mesh.visible?capProp.body.translation():{x:-7.8,y:.4,z:-1.8};this.capBadge.position.set(q.x,q.y+1.6+Math.sin(g.time*4)*.08,q.z);this.capBadge.scale.setScalar(.85+Math.sin(g.time*6)*.08);}
    // The surge badge floats over whichever motor's start-up kick tripped a cart.
    this.surgeBadge.visible=!!this.surgeHint&&g.time<this.surgeUntil;
    if(this.surgeBadge.visible){const at=this.surgeHint==='lift'?{x:13.3,z:-4.8}:{x:5,z:-6.1};this.surgeBadge.position.set(at.x,2.2+Math.sin(g.time*5)*.08,at.z);this.surgeBadge.scale.setScalar(.85+Math.sin(g.time*8)*.08);}
  }
  snapshot(){const lift=this.load('lift');return {job:{...this.job},water:this.water,doorWedged:this.doorWedged(),doorBusy:this.doorBusy(),capDocked:this.capDocked,capHint:this.capHint,surgeHint:this.surgeHint??null,liftRan:this.liftRan,capCharge:+lift.capacitor!.charge.toFixed(2),
    door:{angle:this.doorAngle,side:this.doorSide},bots:this.bots.map(b=>({x:+b.group.position.x.toFixed(2),z:+b.group.position.z.toFixed(2),snag:b.snag?.cable.id})),cablePoints:Object.fromEntries(this.cables.map(c=>[c.id,c.points.map(p=>({x:+p.x.toFixed(2),z:+p.z.toFixed(2)}))])),
    lit:this.lit(),held:this.held?{id:this.held.cable.id,end:this.held.end}:null,sources:this.circuit.sources,loads:this.circuit.loads.filter(l=>l.id!=='cap'),draw:Object.fromEntries(this.circuit.draw),told:[...this.told],
    cables:this.cables.map(c=>({id:c.id,ports:c.ports,ends:c.ends.map(p=>({x:p.x,y:p.y,z:p.z})),dead:c.lead.dead,cause:c.cause??null,nicked:!!c.nicked,wet:!!c.lead.wet,heat:c.lead.heat,strain:c.rope.strain,length:+c.rope.length.toFixed(2),maxLength:c.rope.maxLength})),events:this.circuit.events};}
}
