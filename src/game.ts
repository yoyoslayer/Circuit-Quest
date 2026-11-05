import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createRenderer,toon,seeOff,seeThrough,seeProj,seeY,seeClip} from './render/toon';
import {BLOBC,bangTexture,glyph,cachedTexture,part,cyl,sphere,box,group,INK} from './render/kit';
import {blob,hoseGeometry,hoseMaterial,Pulses,hot,glossyToon,type Accessory,type Mood} from './render/actors';
const GOLD=new T.Color('#ffd451'),DULL_GOLD=new T.Color('#b9ad86');
/** How long R is held during play before the job restarts (ms). */
const RESTART_HOLD=800;
/** How long a startled coworker stays startled (s): looking at the crash, then glaring at Pip (R5-230). */
const ALARM=1.6;
/** Props that break (and cost) when they hit hard; anything else only breaks in a very hard crash (R5-097). */
const FRAGILE=new Set(['glass','monitor','mug','plant','printer','coffee','lamp']);
/** Lunch fail spots (lunch-runtime.ts): the oven for a burned tray, the fridge for spoiled food. */
const LUNCH_OVEN={x:-2.5,z:-7.2},LUNCH_FRIDGE={x:-5.3,z:-2.1};
/** Samples a rope polyline for drawing: it lies on the floor (sagging a little when slack) and
 *  only rises over the last metre to the end point (a hand or a socket). */
export function cablePath(route:Point[],end:T.Vector3,startY:number,strain:number){
  const points:T.Vector3[]=[],total=route.slice(1).reduce((n,b,i)=>n+distance(route[i],b),0);let walked=0;
  for(let i=0;i<route.length-1;i++){const a=route[i],b=i===route.length-2?{x:end.x,z:end.z}:route[i+1],len=distance(a,b),steps=Math.max(2,Math.ceil(len*2));
    for(let j=0;j<steps;j++){const t=j/steps,along=walked+len*t,left=total-along;
      const rise=left<1.8?Math.pow(T.MathUtils.smoothstep(1.8-left,0,1.8),1.6)*(end.y-.09):0,lift=along<.8?(1-along/.8)*(startY-.09):0,sag=Math.max(0,1-strain)*.05;
      points.push(new T.Vector3(T.MathUtils.lerp(a.x,b.x,t),Math.max(.09,.09+rise+lift-sag),T.MathUtils.lerp(a.z,b.z,t)));}
    walked+=len;}
  points.push(end.clone());return points;
}
const sweatTexture=()=>cachedTexture('sweat',()=>glyph(c=>{c.fillStyle='#9fdcff';c.beginPath();c.moveTo(128,20);c.bezierCurveTo(200,120,210,170,128,230);c.bezierCurveTo(46,170,56,120,128,20);c.fill();c.lineWidth=14;c.stroke();}));
import {Sound} from './render/audio';
import {setupGameUI,gameUI} from './ui/game-ui';
import {FOVS,lensScale,type Lens} from './render/lens';
import {makeProp,prefabs,type PropSpec} from './props/prefabs';
import {Rope,CORNER,detour,distance,segmentDistance,strainColor,type Point,type Obstacle} from './sim/cable';
import {Circuit} from './sim/electrical';
import {grade} from './sim/grade';
import type {Level,NpcSpot} from './levels/types';
import {MeetingStrip} from './meeting-strip';
import {clutter} from './levels/clutter';
import {LunchRuntime} from './lunch-runtime';
import {PipRig} from './render/pipRig';
import {Particles,type Fx} from './render/particles';
import {decorate,freezeDecor,solid,type Decor} from './levels/decor';
import {levels} from './levels';
import {makeStation} from './stations';
import type {Station} from './stations/types';
import {Lobby} from './hub/lobby';

export interface Prop {spec:PropSpec;body:RAPIER.RigidBody;collider:RAPIER.Collider;mesh:T.Group;damaged:boolean;home:T.Vector3;lastSpeed:number}
interface Npc {group:T.Group;body:T.Group;bubble:T.Sprite;sweat:T.Sprite;calm:T.Mesh;startled:T.Mesh;alarm:number;seed:number;baseY:number;seated:boolean;restYaw:number;
  /** Where the last fright came from (they look there first), a positive bounce timer and when they last noticed Pip passing. */
  from?:Point;cheerT:number;noticed:number}
// Each coworker gets a personality: accessories and a resting mood (look-dev meeting.js).
const ACCESSORIES:Accessory[][]=[['tuft'],['headphones'],['glasses','tie'],['mug'],['bun'],['cap'],['sprout'],['glasses'],['headphones','tuft'],[],['tie'],['bun','glasses']];
const MOODS:Mood[]=['calm','calm','happy','calm','sleepy','calm','happy','calm'];
interface Batch {mesh:T.InstancedMesh;parts:{prop:Prop;part:T.Mesh}[]}
export class Game {
  view=createRenderer(document.querySelector('canvas')!);
  world=new RAPIER.World({x:0,y:-18,z:0});
  props:Prop[]=[];obstacles:Obstacle[]=[];occluders:T.Mesh[]=[];npcs:Npc[]=[];fx:Particles;squash=0;airborne=0;padHeld:boolean[]=[];switchedOn=false;flung=false;lastHeading=0;twang=new T.Group();hitstop=0;slowAvg=1/60;qualityTimer=0;hand=new T.Group();pulses!:Pulses;lastVoice=-9;wrapped=new Set<Prop>();rig?:PipRig;stride=0;lastPos=new T.Vector3();profile={step:0,render:0,draw:0};stuck=new Map<Prop,number>();
  player:RAPIER.RigidBody;playerCollider:RAPIER.Collider;controller:RAPIER.KinematicCharacterController;
  avatar=new T.Group();rope:Rope;ropePoints:Point[]=[];ropeMesh:T.Mesh;plug:T.Group;target:T.Mesh;screen?:T.Mesh;beam?:T.Object3D;lightUp?:()=>void;clock?:Decor['clock'];
  /** Playground lamp (R5-031/067): the decor's switch lever, pilots and lamp, and how long the lamp has been lit. */
  pg?:Decor['playground'];litFor=0;lampLit=false;
  circuit:Circuit;strip?:MeetingStrip;keys=new Set<string>();held?:Prop;holdingPlug=false;connected=false;extension=false;coupler=false;coffeeReused=false;
  /** The second reel was tried before the coupler: a badge now floats over the coupler. */
  couplerHint=false;
  private stepT=0;private stepSide=1;
  /** The anchor reel's wound cable (scaled as the cable pays out). */
  spool?:T.Mesh;
  /** When R went down during play (ms), or 0: restart needs a hold (holdRestart). */
  restartHold=0;
  /** A modal menu (the lobby's Workshop picker) is open: walking, survey and action keys do nothing. */
  menu=false;
  running=false;paused=false;won=false;time=0;damage=0;cost=0;vertical=0;grounded=false;heading=0;shake=0;
  yaw=.14;pitch=0;zoom=26;fov:number=FOVS[1];survey=false;focus=new T.Vector3();lead=new T.Vector3();winAt=0;shellWalls:{group:T.Group;normal:T.Vector3;height:number}[]=[];orbit=false;pointerX=0;pointerY=0;accumulator=0;last=0;frames=0;fps=60;frameWindow=0;
  audio=new Sound();hud=document.querySelector<HTMLDivElement>('#hud')!;root=new T.Group();plugPosition:T.Vector3;hint=new T.Group();reticle=new T.Group();pipRing:T.Mesh;
  batches:Batch[]=[];decorRoot=new T.Group();
  lunch?:LunchRuntime;
  /** Station jobs (src/stations): a bench Pip works at instead of a cable to plug in. */
  station?:Station;atBench=false;
  hub?:Lobby;
  // ?manual lets automated tests advance simulated time deterministically.
  manual=new URLSearchParams(location.search).has('manual');stick?:Point;
  /** Workshop practice (?practice): the whole job plays, but no grade is recorded. */
  practice=new URLSearchParams(location.search).has('practice');
  constructor(public level:Level){
    // A missing key means the default (2), not Number(null)=0; ?lowfx / plain ?manual always stay low (R5-143).
    try{const raw=localStorage.getItem('circuit-crew-quality'),saved=Number(raw);if(raw!==null&&!this.view.low&&(saved===0||saved===1||saved===2))this.view.setQuality(saved);}catch{/* storage unavailable */}
    try{const f=Number(localStorage.getItem('circuit-crew-fov'));if((FOVS as readonly number[]).includes(f))this.fov=f;}catch{/* storage unavailable */}
    const {scene}=this.view;scene.add(this.root);this.view.mood(level.id);this.audio.setLevel(level.id);this.root.add(this.decorRoot);this.fx=new Particles(this.root);this.zoom=this.homeZoom();this.yaw=this.homeYaw();
    this.rope=new Rope({...level.anchor},level.length);this.obstacles=[...level.obstacles];
    if(level.station)this.station=makeStation(level.station,this);
    if(level.hub)this.hub=new Lobby(this);
    this.buildRoom();
    const extra=level.clutter?clutter(this.world,level,level.clutter):[];
    for(const spec of [...level.props,...extra])this.addProp(spec);
    this.batchProps();
    for(const p of level.npcs)this.addNpc(p);
    this.player=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(level.spawn.x,.91,level.spawn.z));
    this.playerCollider=this.world.createCollider(RAPIER.ColliderDesc.capsule(.45,.32).setMass(65),this.player);
    this.controller=this.world.createCharacterController(.025);this.controller.enableAutostep(.25,.2,true);this.controller.enableSnapToGround(.2);this.controller.setApplyImpulsesToDynamicBodies(true);this.controller.setCharacterMass(65);
    this.buildAvatar();
    this.plugPosition=new T.Vector3(level.anchor.x+.7,.3,level.anchor.z+.7);
    this.plug=makeProp('plug');seeOff(this.plug);this.root.add(this.plug);
    this.target=new T.Mesh(new T.TorusGeometry(.42,.07,8,28),new T.MeshBasicMaterial({color:'#64ddd4'}));this.target.rotation.x=-Math.PI/2;this.target.position.set(level.target.x,.15,level.target.z);this.root.add(this.target);
    const socket=new T.Mesh(new T.BoxGeometry(.48,.38,.3),toon('#384454'));socket.position.set(level.target.x,.25,level.target.z);this.root.add(socket);
    // The Meeting strip and Lunch carts are their own sockets, and the Playground builds one with a face plate (R5-030, R5-152).
    if(level.id==='meeting'||level.id==='lunch'||this.pg)socket.visible=false;
    // The anchor reel: its wound cable shrinks as cable pays out, so the length left reads at a glance.
    const anchor=group(this.root,level.anchor.x,.35,level.anchor.z);for(const side of [-1,1])part(anchor,cyl(.336,.336,.056,24,'z'),toon('#ffc94d'),0,0,side*.192);
    part(anchor,cyl(.064,.064,.45,12,'z'),toon('#c7ccd6'));part(anchor,box(.5,.06,.5),toon(INK),0,-.3,0);this.spool=part(anchor,cyl(1,1,.32,28,'z'),toon('#f4efe6'));this.spool.scale.set(.31,.31,1);
    if(this.station||this.hub)for(const o of [this.plug,this.target,socket,anchor])o.visible=false;
    this.ropeMesh=new T.Mesh(new T.BufferGeometry(),hoseMaterial());this.ropeMesh.castShadow=true;this.root.add(this.ropeMesh);this.pulses=new Pulses(this.root);
    // Comic twang arcs drawn where a taut cable bites a corner.
    {const m=new T.MeshBasicMaterial({color:'#fffaf0'});m.userData.outlineParameters={visible:false};for(let i=0;i<3;i++){const r=.35+i*.18,pts:T.Vector3[]=[];for(let k=0;k<=12;k++){const a=-.55+1.1*k/12;pts.push(new T.Vector3(Math.cos(a)*r,.05*i,Math.sin(a)*r));}const t=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,.022,5,false),m);t.userData.noAO=true;this.twang.add(t);}this.twang.visible=false;this.root.add(this.twang);}
    // Grab cue: four floor-level corner brackets around whatever E would take (UI.md world cues).
    {const m=new T.MeshBasicMaterial({color:'#ffd84a'});m.userData.outlineParameters={visible:false};for(let k=0;k<4;k++){const c=new T.Group();c.rotation.y=k*Math.PI/2;for(const [w,d,x,z] of [[.28,.07,-.4,-.53],[.07,.28,-.53,-.4]] as const){const b=new T.Mesh(new T.BoxGeometry(w,.03,d),m);b.position.set(x,0,z);b.userData.noAO=true;c.add(b);}this.reticle.add(c);}this.reticle.visible=false;this.root.add(this.reticle);}
    // A soft ring under Pip keeps the hero findable among coworkers.
    this.pipRing=new T.Mesh(new T.RingGeometry(.42,.58,40).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#ffc629',transparent:true,opacity:.55,depthWrite:false}));this.pipRing.userData.outlineParameters={visible:false};this.root.add(this.pipRing);this.reticle.renderOrder=10;this.root.add(this.reticle);
    // Idle hint (R5-032): flat job-yellow floor chevrons along the clean route, never moving beads,
    // so nothing that looks like current shows on an open circuit.
    {const m=toon('#ffc629'),arm=new T.BoxGeometry(.26,.012,.07);for(let k=0;k<32;k++){const c=new T.Group();for(const s of [-1,1]){const b=new T.Mesh(arm,m);b.rotation.y=s*2.5;b.translateX(.12);b.userData.noAO=true;c.add(b);}this.hint.add(c);}this.hint.visible=false;this.root.add(this.hint);}
    this.circuit=new Circuit([{id:'supply',limit:5,tripped:false}],[{id:'reel',from:'supply',to:'projector',rating:3,closed:false,heat:0,dead:false}],[{id:'projector',steady:1,enabled:true,state:'off',started:0}]);
    if(level.id==='meeting')this.strip=new MeetingStrip(this);
    this.setupUI();this.setupInput();if(level.id==='lunch')this.lunch=new LunchRuntime(this);else if(!this.station&&!this.hub){this.simulateCable();this.drawCable();}
    freezeDecor(this);this.updateCamera(1);this.view.render();
    document.body.dataset.ready='true';
    Object.assign(window,{__circuitCrew:{snapshot:()=>this.snapshot(),drive:this.manual?this.driver():undefined}});
    // Test mode exposes the live game for camera and render checks (mockups/review5/tools).
    if(this.manual)Object.assign(window,{__game:this});
    requestAnimationFrame(t=>this.frame(t));
  }
  box(w:number,h:number,d:number,x:number,y:number,z:number,color:string,fixed=true,fade=false){
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),fade?toon(color).clone():toon(color));mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=true;this.root.add(mesh);
    if(fixed){const b=this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2).setFriction(.7),b);}
    if(fade){mesh.material.transparent=true;this.occluders.push(mesh);}return mesh;
  }
  buildRoom(){
    const l=this.level;
    solid(this,l.width,.35,l.depth,0,-.2,0);
    const decor=decorate(this);this.screen=decor.screen;this.beam=decor.beam;this.clock=decor.clock;this.lightUp=decor.lightUp;this.pg=decor.playground;
  }
  addProp(spec:PropSpec){
    const p=prefabs[spec.kind],mesh=makeProp(spec.kind,spec.color,spec.variant),pos=new T.Vector3(spec.x,spec.y??p.size[1]/2+.025,spec.z);
    mesh.position.copy(pos);mesh.rotation.y=spec.rotation??0;this.root.add(mesh);
    // Glass panes stand fixed until something hits them hard enough to shatter them (R5-090).
    const body=this.world.createRigidBody((spec.kind==='glass'?RAPIER.RigidBodyDesc.fixed():RAPIER.RigidBodyDesc.dynamic()).setTranslation(pos.x,pos.y,pos.z).setRotation(mesh.quaternion).setLinearDamping(.6).setAngularDamping(.8).setCanSleep(true).setCcdEnabled(p.mass<4));
    const collider=this.world.createCollider(RAPIER.ColliderDesc.cuboid(p.size[0]/2,p.size[1]/2,p.size[2]/2).setMass(p.mass).setFriction(.65).setRestitution(.12),body);
    this.props.push({spec,body,collider,mesh,damaged:false,home:pos.clone(),lastSpeed:0});
  }
  addNpc(p:NpcSpot){
    const g=new T.Group(),seated=this.level.id==='meeting'&&!p.standing,body=new T.Group();body.position.y=seated?.35:0;g.add(body);
    const i=this.npcs.length,color=p.color??BLOBC[i%BLOBC.length],acc=p.acc??ACCESSORIES[i%ACCESSORIES.length],calm=blob(color,p.mood??MOODS[i%MOODS.length],acc),startled=blob(color,'alarm',acc);
    if(p.chef){const hat=new T.Group();hat.position.y=1.05;body.add(hat);part(hat,cyl(.2,.18,.22,16),toon('#ffffff'),0,.1,0);part(hat,sphere(.24,14,10),toon('#ffffff'),0,.28,0).scale.y=.6;}startled.visible=false;body.add(calm,startled);
    const sweat=new T.Sprite(new T.SpriteMaterial({map:sweatTexture(),toneMapped:false}));sweat.scale.set(.22,.22,1);sweat.position.set(.32,(seated?.35:0)+1.02,.1);sweat.visible=false;g.add(sweat);
    const bubble=new T.Sprite(new T.SpriteMaterial({map:bangTexture(),depthTest:false}));bubble.scale.set(.7,.7,1);bubble.position.y=(seated?.35:0)+1.55;bubble.renderOrder=9;bubble.visible=false;g.add(bubble);
    g.position.set(p.x,0,p.z);const desk=this.props.filter(q=>q.spec.kind==='desk').sort((a,b)=>distance(p,a.spec)-distance(p,b.spec))[0],restYaw=p.yaw??(seated&&desk?Math.atan2(desk.spec.x-p.x,desk.spec.z-p.z):Math.atan2(-p.x,-p.z));g.rotation.y=restYaw;
    this.npcs.push({group:g,body,bubble,sweat,calm,startled,alarm:0,seed:this.npcs.length*1.7,baseY:seated?.35:0,seated,restYaw,cheerT:0,noticed:-9});this.root.add(g);
  }
  /** Coworkers near a crash or snap flinch and show a "!" bubble. */
  alarm(at:Point,radius=4.5){let startled=0;for(const npc of this.npcs)if(distance(npc.group.position,at)<radius){if(npc.alarm<=0)startled++;npc.alarm=ALARM;npc.from={x:at.x,z:at.z};npc.cheerT=0;}
    if(startled){this.beat('alarm');if(this.time-this.lastVoice>.5){this.lastVoice=this.time;this.audio.voice('alarm',.9+Math.random()*.4);
      // A bigger fright gets a lower second voice for every three more coworkers startled.
      for(let k=1;k<=Math.min(2,Math.floor((startled-1)/3));k++)setTimeout(()=>this.audio.voice('alarm',.7-k*.08),120*k);}}}
  /** Coworkers near a good moment (a plug seated) give a little happy bounce. */
  cheerNear(at:Point,radius=5){let n=0;for(const npc of this.npcs)if(npc.alarm<=0&&distance(npc.group.position,at)<radius){npc.cheerT=.8;n++;}
    if(n&&this.time-this.lastVoice>.5){this.lastVoice=this.time;this.audio.voice('cheer',1+Math.random()*.3);}}
  /** Hitstop: the world holds still for `s` seconds (camera and particles too). Counted for specs. */
  hitstops=0;
  freeze(s:number){this.hitstop=Math.max(this.hitstop,s);this.hitstops++;}
  /** Juice log for specs (R5-169): what just happened that a player would notice. */
  beats:{t:number;kind:string}[]=[];
  beat(kind:'impact'|'break'|'spark'|'confetti'|'alarm'|'slingshot'|'flash'|'win'|'fail'){this.beats.push({t:+this.time.toFixed(2),kind});if(this.beats.length>120)this.beats.shift();}
  private flashEl?:HTMLElement;
  /** Full-screen flash (≤120 ms): white for success, coral for a failure (R5-095). */
  flash(color='#ffffff',peak=.35){
    if(!this.flashEl){const el=this.flashEl=document.createElement('div');el.className='hud-flash';el.setAttribute('aria-hidden','true');
      Object.assign(el.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'40',opacity:'0',mixBlendMode:'screen'});document.body.append(el);}
    const el=this.flashEl;el.style.background=color;this.beat('flash');
    el.animate?.([{opacity:0},{opacity:peak,offset:.3},{opacity:0}],{duration:120,easing:'ease-out'});}
  batchProps(){
    const groups=new Map<string,{prop:Prop;part:T.Mesh}[]>();
    for(const prop of this.props){prop.mesh.traverse(o=>{if(o instanceof T.Mesh){const key=o.geometry.uuid+(o.material as T.Material).uuid;const list=groups.get(key)??[];list.push({prop,part:o});groups.set(key,list);}});this.root.remove(prop.mesh);}
    for(const parts of groups.values()){const first=parts[0].part,mesh=new T.InstancedMesh(first.geometry,first.material,parts.length);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.add(mesh);this.batches.push({mesh,parts});}
    this.updateBatches();
  }
  updateBatches(){
    const hidden=new T.Matrix4().makeScale(0,0,0);
    for(const prop of this.props)prop.mesh.updateMatrixWorld(true);
    for(const batch of this.batches){batch.parts.forEach(({prop,part},i)=>batch.mesh.setMatrixAt(i,prop.mesh.visible?part.matrixWorld:hidden));batch.mesh.instanceMatrix.needsUpdate=true;}
  }
  buildAvatar(){
    const body=new T.Mesh(new T.CapsuleGeometry(.3,.48,5,12),toon('#347cac'));body.position.y=.85;body.castShadow=true;this.avatar.add(body);
    const head=new T.Mesh(new T.SphereGeometry(.3,16,10),toon('#eab387'));head.position.y=1.43;this.avatar.add(head);
    const hat=new T.Mesh(new T.SphereGeometry(.33,16,8,0,Math.PI*2,0,Math.PI/2),toon('#ffc44b'));hat.position.y=1.52;this.avatar.add(hat);
    seeOff(this.avatar);this.root.add(this.avatar);
    new GLTFLoader().load('/models/pip.glb',gltf=>{this.avatar.clear();gltf.scene.traverse(o=>{if(o instanceof T.Mesh){const old=o.material as T.MeshStandardMaterial;o.material=/lens/i.test(old.name)?hot('#fff0b8',2):/hat|gloves|boots/i.test(old.name)?glossyToon('#'+old.color.getHexString(),{spec:.6,size:.975}):toon('#'+old.color.getHexString());o.castShadow=true;o.receiveShadow=true;}});seeOff(gltf.scene);this.avatar.add(gltf.scene);
      // Parts are grouped by name prefix onto pivots (src/render/pipRig.ts).
      this.rig=new PipRig(gltf.scene);this.hand=this.rig.hand;},undefined,()=>{document.body.dataset.assetFallback='true';});
  }
  /** HUD, title, jobs, pause and result screens live in src/ui (see mockups/ui/UI.md). */
  setupUI(){setupGameUI(this);}
  setupInput(){
    addEventListener('keydown',e=>{if(this.menu){if(e.code==='Tab')e.preventDefault();return;}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
      // At a bench the station takes the keys; E or Esc steps back. Keys the bench doesn't use do
      // nothing there, so a stray R, Space, Tab or WASD never acts on the floor behind the bench.
      if(this.atBench&&this.running&&!this.paused&&!this.won){if(e.code==='Tab')e.preventDefault();if(e.repeat)return;if(e.code==='KeyE'||e.code==='Escape'){this.leaveBench();return;}if(this.station!.key(e.code))e.preventDefault();return;}
      this.keys.add(e.code);if(e.repeat)return;
      if(e.code==='KeyE')this.action('grab');if(e.code==='KeyF')this.action('cable');if(e.code==='KeyQ')this.action('throw');if(e.code==='Space')this.action('jump');const playing=this.running&&!this.won;if(e.code==='Tab'&&playing&&!this.paused){e.preventDefault();this.action('survey');}if(e.code==='Escape')this.action('pause');
      // R restarts at once from the pause menu; during play it has to be held (the pause button fills).
      if(e.code==='KeyR'&&playing){if(this.paused)this.action('restart');else this.restartHold=performance.now();}});
    addEventListener('keyup',e=>{this.keys.delete(e.code);if(e.code==='KeyR')this.restartHold=0;});
    addEventListener('blur',()=>{this.keys.clear();this.restartHold=0;if(this.running&&!this.won&&!this.paused)this.togglePause();});
    const canvas=this.view.renderer.domElement;
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    const benchPointer=(kind:'down'|'move'|'up',e:PointerEvent)=>this.benchPointerAt(kind,e.clientX,e.clientY,e.button);
    // Touch on the floor: one finger drags to orbit, two fingers pinch to zoom, a quick tap grabs.
    const touches=new Map<number,{x:number;y:number;sx:number;sy:number;t:number}>();
    const pinch=()=>{const [a,b]=[...touches.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;};
    const touchUp=(e:PointerEvent)=>{const t=touches.get(e.pointerId);if(!t)return false;touches.delete(e.pointerId);
      if(e.type==='pointerup'&&touches.size===0&&Math.hypot(e.clientX-t.sx,e.clientY-t.sy)<10&&performance.now()-t.t<280&&this.running)this.action('grab');return true;};
    canvas.addEventListener('pointercancel',touchUp);
    canvas.addEventListener('pointerdown',e=>{this.audio.start();if(this.atBench&&e.button===0&&this.running&&!this.paused&&!this.won){benchPointer('down',e);return;}
      if(e.pointerType==='touch'){touches.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()});canvas.setPointerCapture(e.pointerId);return;}
      if(e.button===2){this.orbit=true;this.pointerX=e.clientX;this.pointerY=e.clientY;canvas.setPointerCapture(e.pointerId);}else if(e.button===0&&this.running)this.action('grab');});
    canvas.addEventListener('pointerup',e=>{this.orbit=false;if(touchUp(e))return;if(this.atBench&&e.button===0)benchPointer('up',e);});
    canvas.addEventListener('pointermove',e=>{const t=touches.get(e.pointerId);
      if(t){const before=pinch(),dx=e.clientX-t.x,dy=e.clientY-t.y;t.x=e.clientX;t.y=e.clientY;
        if(touches.size>=2){const after=pinch();this.survey=false;this.zoom=T.MathUtils.clamp(this.zoom-(after-before)*.05,9,38);}
        else{this.yaw-=dx*.006;this.pitch=T.MathUtils.clamp(this.pitch+dy*.004,-.3,.45);}
        return;}
      if(this.atBench&&!this.orbit)benchPointer('move',e);if(this.orbit){this.yaw-=(e.clientX-this.pointerX)*.006;this.pitch=T.MathUtils.clamp(this.pitch+(e.clientY-this.pointerY)*.004,-.3,.45);this.pointerX=e.clientX;this.pointerY=e.clientY;}});
    canvas.addEventListener('wheel',e=>{if(this.atBench)return;this.survey=false;this.zoom=T.MathUtils.clamp(this.zoom+e.deltaY*.014,9,38);},{passive:true});
  }
  action(action:string){
    if(action==='restart'){const ui=gameUI(this);if(ui)ui.restart();else location.reload();return;}if(action==='sound'){this.audio.muted=!this.audio.muted;return;}if(action==='pause'){this.togglePause();return;}if(action==='survey'){this.survey=!this.survey;return;}if(action==='lens'){this.fov=FOVS[(FOVS.indexOf(this.fov as Lens)+1)%FOVS.length];try{localStorage.setItem('circuit-crew-fov',String(this.fov));}catch{/* storage unavailable */}return;}if(action==='camera'){this.survey=false;this.pitch=0;this.zoom=this.homeZoom();this.yaw=this.homeYaw();return;}
    if(!this.running||this.paused||this.won)return;
    if(action==='throw'&&this.lunch?.held){this.lunch.release();return;}
    if(action==='jump'&&this.grounded&&(!this.held||prefabs[this.held.spec.kind].mass<15)){this.vertical=7;this.grounded=false;this.squash=-.6;this.audio.tone(310,.1,.025);this.audio.noise(.06,.03,1200);}
    if(action==='grab'||action==='cable')this.interact(action==='cable');
    if(action==='throw'){if(this.holdingPlug)this.releasePlug();else if(this.held){const p=this.held;this.held=undefined;p.body.applyImpulse({x:Math.sin(this.heading)*prefabs[p.spec.kind].mass*8,y:prefabs[p.spec.kind].mass*5,z:Math.cos(this.heading)*prefabs[p.spec.kind].mass*8},true);this.audio.tone(240,.1,.06,'triangle');}}
  }
  begin(){if(this.running)return;const ui=gameUI(this);if(ui?.beforeBegin())return;this.running=true;this.survey=false;this.audio.start();ui?.started();}
  /** Gamepad buttons are read every frame so Start/A also work on the intro card and while paused. */
  pollPad(dt=1/60){const pad=navigator.getGamepads?.()[0];if(!pad)return;
    const bench=this.atBench&&this.running&&!this.paused&&!this.won;if(bench)this.padBench(pad,dt);
    pad.buttons.forEach((b,i)=>{const pressed=b.pressed&&!this.padHeld[i];this.padHeld[i]=b.pressed;if(!pressed)return;
      if(!this.running){if(i===0||i===9)this.begin();return;}if(this.won){if(i===0)location.reload();return;}
      if(this.menu){this.hub?.padPicker(i);return;}
      // At a bench: A clicks through the cursor (padBench), Y presses the bench's main key, B stands up.
      if(bench){if(i===1)this.leaveBench();else if(i===3)this.station!.key('Enter');else if(i===9)this.action('pause');return;}
      // RS (11) recentres the camera, matching its label on the action bar; View (8) and LS (10) survey.
      const action=({0:'jump',2:'grab',1:'cable',3:'throw',9:'pause',11:'camera',8:'survey',10:'survey'} as Record<number,string>)[i];if(action&&(!this.paused||action==='pause'))this.action(action);});}
  /** Gamepad at a bench: the left stick or d-pad moves an on-screen cursor over the tabletop and A
   *  is the mouse button (hold to drag), so every bench plays exactly as it does with a mouse. */
  padCursor?:{x:number;y:number;down:boolean;el:HTMLElement};
  private padBench(pad:Gamepad,dt:number){
    const r=this.view.renderer.domElement.getBoundingClientRect(),b=(i:number)=>!!pad.buttons[i]?.pressed;
    if(!this.padCursor){const el=document.createElement('div');el.className='pad-cursor';this.hud.append(el);this.padCursor={x:r.left+r.width/2,y:r.top+r.height/2,down:false,el};}
    const c=this.padCursor;let ax=pad.axes[0]??0,ay=pad.axes[1]??0;if(Math.hypot(ax,ay)<.18){ax=0;ay=0;}
    ax+=Number(b(15))-Number(b(14));ay+=Number(b(13))-Number(b(12));
    const speed=Math.min(r.width,r.height)*.8*(b(4)||b(5)?.35:1);
    if(ax||ay){c.x=T.MathUtils.clamp(c.x+ax*speed*dt,r.left,r.right);c.y=T.MathUtils.clamp(c.y+ay*speed*dt,r.top,r.bottom);this.benchPointerAt('move',c.x,c.y);}
    if(b(0)!==c.down){c.down=b(0);this.benchPointerAt(c.down?'down':'up',c.x,c.y);}
    c.el.hidden=false;c.el.classList.toggle('down',c.down);c.el.style.transform=`translate(${c.x}px,${c.y}px)`;
  }
  /** Sends a pointer event at a screen position to the station (mouse, touch and pad cursor). */
  benchPointerAt(kind:'down'|'move'|'up',clientX:number,clientY:number,button=0){
    if(!this.station)return;const r=this.view.renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();
    ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-((clientY-r.top)/r.height)*2+1),this.view.camera);this.station.pointer({kind,ray,button});
  }
  togglePause(){if(!this.running||this.won)return;this.paused=!this.paused;this.audio.paused(this.paused);document.body.toggleAttribute('data-paused',this.paused);gameUI(this)?.paused(this.paused);this.audio.strain(0);}
  nearest(){const pos=this.player.translation();return this.props.filter(p=>p.mesh.visible&&p.spec.kind!=='glass'&&(!this.lunch||this.lunch.canGrab(p.body.translation()))&&distance(pos,p.body.translation())<1.65&&Math.abs(pos.y-p.body.translation().y)<1.8).sort((a,b)=>this.reach(pos,a)-this.reach(pos,b))[0];}
  /** Job items (anything with an id) in reach always win over clutter that got pushed along. The
   *  Meeting mail cart only carries the job's reel, so the reel on it wins over the cart. */
  reach(pos:Point,p:Prop){return distance(pos,p.body.translation())-(p.spec.id&&p.spec.id!=='mail-cart'?2:0);}
  interact(cableOnly=false){
    const pos=this.player.translation();
    if(this.atBench){this.leaveBench();return;}
    if(this.hub&&!this.held&&!cableOnly&&this.hub.interact(pos))return;
    if(this.station&&!this.held&&!cableOnly&&this.nearBench(pos)){this.enterBench();return;}
    if(this.lunch?.interact(cableOnly))return;
    if(this.lunch&&cableOnly){this.shrug();return;}
    // With the plug in hand, E or F next to the coupler or second reel attaches it (coupler first).
    if(this.holdingPlug&&this.attachNear(pos))return;
    // Forgiving snap: the held plug only has to look close to the socket.
    if(this.holdingPlug){if(!this.trySeat())this.releasePlug();return;}
    if(this.held){const p=this.held;
      if(p.spec.id==='extension'&&distance(pos,this.plugPosition)<2&&this.coupler){this.joinExtension(p);this.audio.milestone();}
      // Wrong order: the reel's socket doesn't fit the plug without the coupler, so it buzzes and the coupler is flagged.
      else if(p.spec.id==='extension'&&distance(pos,this.plugPosition)<2&&!this.coupler){this.audio.tone(110,.22,.07,'square');this.couplerHint=true;}
      else if(p.spec.id==='coupler'&&distance(pos,this.plugPosition)<2){this.coupler=true;this.consume(p);this.audio.plug();}
      p.body.setLinvel({x:0,y:0,z:0},true);p.body.setAngvel({x:0,y:0,z:0},true);
      this.lunch?.dropped(p);this.station?.dropped?.(p);
      if(p.spec.id==='strip'&&distance(pos,this.level.target)<2.6){const t=this.level.target;p.body.setTranslation({x:t.x,y:.08,z:t.z+.3},true);p.body.setRotation(new T.Quaternion(),true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);this.audio.plug();this.burst({x:t.x,y:.2,z:t.z+.3},'#8ff3ea',1,'ring');}
      this.held=undefined;return;
    }
    // Big Meeting's strip: unplug an appliance, or reset the strip's tripped breaker (E).
    if(!cableOnly&&!this.held&&!this.holdingPlug&&this.strip?.interact(pos))return;
    // Machine switch: once powered, the lamp/projector still needs switching on (E).
    if(!cableOnly&&!this.held&&this.nearSwitch(pos)){this.switchedOn=!this.switchedOn;this.audio.noise(.03,.07,2500,'highpass');this.audio.tone(this.switchedOn?420:200,.09,.04);const s=this.level.switchAt!;this.burst({x:s.x,y:1,z:s.z},'#fff3a3',6,'spark');this.alarm(s,1.5);return;}
    const nearest=cableOnly?undefined:this.nearest();
    if(!this.lunch&&!this.station&&!this.hub&&distance(pos,this.plugPosition)<1.75&&!(nearest&&this.reach(pos,nearest)<distance(pos,this.plugPosition))){if(this.connected){this.connected=false;this.circuit.leads[0].closed=false;}this.holdingPlug=true;this.audio.pop();return;}
    if(cableOnly){this.shrug();return;}
    if(nearest){
      // The server cable can't stay plugged into the strip once its plug is swapped for the coffee reel's (R5-201).
      if(nearest.spec.id==='coffee-reel'&&!this.coffeeReused){this.coffeeReused=true;this.connected=false;this.circuit.leads[0].closed=false;this.rope.reset({x:-14,z:5},Math.max(30,this.rope.maxLength));this.plugPosition.set(-13,.3,4.5);this.holdingPlug=true;this.consume(nearest);this.audio.tone(100,.6,.06,'triangle');
        // The coffee bar goes dark: nearby coworkers groan.
        this.alarm({x:-13,z:4.5},4.5);for(let i=0;i<3;i++)setTimeout(()=>this.audio.voice('groan',.8+i*.15),150+i*280);return;}
      // A jammed doorstop only comes loose when deliberately picked up.
      if(nearest.spec.id==='wedge'||nearest.spec.id==='strip')nearest.body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
      this.held=nearest;this.audio.pop();
    }else this.shrug();
  }
  /** Nothing in reach: a little puff and a questioning chirp instead of silence. */
  shrug(){const p=this.player.translation();this.burst({x:p.x+Math.sin(this.heading)*.6,y:.2,z:p.z+Math.cos(this.heading)*.6},'#efe8d8',4,'dust');this.audio.voice('hm',1.5);this.squash=.25;}
  /** The second reel joins at the plug through the coupler: the cable gains 14 m, and the joint
   *  stays on the cable where it was made (drawn by drawCable). */
  joinAt=0;private joint?:T.Group;
  joinExtension(part:Prop){this.extension=true;this.joinAt=this.rope.length;this.rope.maxLength=this.level.length+14;this.consume(part);}
  attachNear(pos:Point){
    const part=this.props.filter(q=>q.mesh.visible&&((q.spec.id==='coupler'&&!this.coupler)||(q.spec.id==='extension'&&!this.extension))&&distance(pos,q.body.translation())<1.9).sort((a,b)=>Number(b.spec.id==='coupler')-Number(a.spec.id==='coupler'))[0];if(!part)return false;
    const at=part.body.translation();
    if(part.spec.id==='coupler'){this.coupler=true;this.consume(part);this.audio.plug();this.burst(at,'#fff3a3',12,'spark');}
    else if(this.coupler){this.joinExtension(part);this.audio.plug();this.audio.milestone();this.burst(at,'#ffcf52',30,'confetti');}
    // Wrong order: the reel needs the coupler first, so it wobbles and buzzes.
    else{this.audio.tone(110,.22,.07,'square');part.body.applyImpulse({x:0,y:prefabs[part.spec.kind].mass*2.5,z:0},true);part.body.applyTorqueImpulse({x:0,y:0,z:.4},true);this.couplerHint=true;}
    return true;
  }
  nearBench(pos:Point){return !!this.station&&distance(pos,this.station.stand)<1.6;}
  enterBench(){if(!this.station)return;this.atBench=true;document.body.dataset.bench='true';this.survey=false;this.station.setActive(true);this.audio.pop();this.keys.clear();this.stick=undefined;}
  leaveBench(){if(!this.station)return;this.atBench=false;if(this.padCursor){if(this.padCursor.down)this.benchPointerAt('up',this.padCursor.x,this.padCursor.y);this.padCursor.down=false;this.padCursor.el.hidden=true;}delete document.body.dataset.bench;this.station.setActive(false);this.audio.tone(260,.08,.03,'triangle');}
  private hintPath?:Point[];private hintAt=-1;
  /** The idle hint's route: the plug to the socket along the level's clean lane when it declares one,
   *  else round the pillars and heavy furniture; to the strip first while the Meeting needs it. */
  hintRoute():Point[]{
    const pip=this.player.translation(),strip=this.needsStrip()&&!this.stripPlaced()?this.props.find(q=>q.spec.id==='strip'&&q!==this.held):undefined;
    const from=strip?{x:pip.x,z:pip.z}:{x:this.plugPosition.x,z:this.plugPosition.z},to=strip?{x:strip.body.translation().x,z:strip.body.translation().z}:this.level.target;
    const lane=strip?undefined:this.level.clutter?.lanes?.find(l=>{const e=l.points[l.points.length-1];return distance({x:e[0],z:e[1]},to)<1.5;});
    if(lane){const pts=lane.points.map(([x,z])=>({x,z}));let k=0;pts.forEach((q,i)=>{if(distance(q,from)<distance(pts[k],from))k=i;});return [from,...pts.slice(k+1)];}
    const heavy=this.props.filter(q=>q.mesh.visible&&q!==this.held&&prefabs[q.spec.kind].mass>=3&&segmentDistance(q.body.translation(),from,to)<2).slice(0,30).map(q=>{const t=q.body.translation(),[w,,d]=prefabs[q.spec.kind].size,h=Math.max(w,d)/2+.05;return {id:'hint',minX:t.x-h,maxX:t.x+h,minZ:t.z-h,maxZ:t.z+h};})
      .filter(o=>!(from.x>o.minX&&from.x<o.maxX&&from.z>o.minZ&&from.z<o.maxZ)&&!(to.x>o.minX&&to.x<o.maxX&&to.z>o.minZ&&to.z<o.maxZ));
    return detour(from,to,[...this.obstacles,...heavy]);
  }
  /** A loose plug in reach wins over the switch (R5-262): E/F and the prompt then pick it up. */
  nearSwitch(pos:Point){return !this.lunch&&!this.holdingPlug&&!!this.level.switchAt&&distance(pos,this.level.switchAt)<1.9&&(this.connected||distance(pos,this.plugPosition)>=1.75);}
  /** The power strip must sit by the boardroom door before the reel can feed the projector. */
  needsStrip(){return this.props.some(q=>q.spec.id==='strip');}
  stripPlaced(){const q=this.props.find(q=>q.spec.id==='strip');return !q||(q!==this.held&&distance(q.body.translation(),this.level.target)<1.4&&q.body.translation().y<.6);}
  /** Plug-in beat: a short hit-stop, a star flash, sparks and a floor shockwave. */
  plugFlash(at:{x:number;y:number;z:number}){this.freeze(.09);this.cheerNear(at);this.beat('spark');this.burst(at,'#fff3a3',16,'spark');this.burst({x:at.x,y:at.y+.35,z:at.z},'#fff3c8',1,'flash');this.burst({x:at.x,y:.05,z:at.z},'#8ff3ea',1,'ring');this.burst(at,'#ffe36e',5,'star');this.shake=Math.max(this.shake,.12);}
  consume(p:Prop){p.mesh.visible=false;p.body.setEnabled(false);}
  private knocked=new Map<Prop,number>();
  /** Impact dust: a small puff at the floor, nudged away from coworkers so it never hides the startle (R5-327). */
  impactDust(pos:Point&{y?:number}){const at={x:pos.x,y:.1,z:pos.z};for(const n of this.npcs){const d=distance(n.group.position,at);if(d<1){const k=(1-d)*.5/Math.max(d,.05);at.x+=(at.x-n.group.position.x)*k;at.z+=(at.z-n.group.position.z)*k;}}
    this.burst(at,'#e9e4d6',3,'puff');}
  /** A glass pane shatters: shards, the smash, the boardroom jumps, and the big repair bill. */
  shatter(pane:Prop){const at=pane.body.translation();this.consume(pane);this.burst({x:at.x,y:at.y,z:at.z},'#a0dbdf',14);this.burst({x:at.x,y:1.2,z:at.z},'#e8fbff',1,'flash');this.alarm(at,5);this.freeze(.08);this.shake=Math.max(this.shake,.25);this.beat('break');}
  /** Fixed glass panes break when a fast prop reaches them or Pip sprints into them (R5-090). */
  private checkGlass(pip:Point,pace:number){
    for(const g of this.props){if(g.spec.kind!=='glass'||g.damaged||!g.body.isEnabled())continue;const c=g.body.translation(),[w,,d]=prefabs.glass.size,a=(g.spec.rotation??0),ca=Math.abs(Math.cos(a)),sa=Math.abs(Math.sin(a));
      const hx=ca*w/2+sa*d/2+.15,hz=sa*w/2+ca*d/2+.15,inside=(q:Point,m=0)=>Math.abs(q.x-c.x)<hx+m&&Math.abs(q.z-c.z)<hz+m;
      const hitBy=pace>5.5&&inside(pip,.45)?'pip':this.props.find(q=>q!==g&&q.body.isEnabled()&&q.body.isDynamic()&&inside(q.body.translation())&&Math.hypot(q.body.linvel().x,q.body.linvel().y,q.body.linvel().z)>3);
      if(!hitBy)continue;g.damaged=true;this.damage++;this.cost+=prefabs.glass.cost;this.audio.glass();this.shatter(g);}
  }
  /** Playground pins knocked down: tipped past ~45° or slid half a metre from their spot. */
  pinsDown(){const up=new T.Vector3();return this.props.filter(p=>p.spec.id?.startsWith('pin-')).filter(p=>{const q=p.body.rotation(),t=p.body.translation();
    up.set(0,1,0).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w));return up.y<.7||Math.hypot(t.x-p.spec.x,t.z-p.spec.z)>.5;}).length;}
  private pinsCheered=false;
  slingshot(energy:number){
    this.shake=Math.min(.5,energy*.006);this.audio.tone(90,.3,.12,'sawtooth');this.audio.noise(.2,.08,1400);this.alarm(this.plugPosition,6);this.beat('slingshot');
    // Coworkers along the whipping cable, and next to whatever it flings, jump too (R5-231).
    for(let i=1;i<this.ropePoints.length;i++){const a=this.ropePoints[i-1],b=this.ropePoints[i];this.alarm({x:(a.x+b.x)/2,z:(a.z+b.z)/2},3);}
    for(const p of this.props){const pos=p.body.translation();if(this.ropePoints.slice(1).some((b,i)=>segmentDistance(pos,this.ropePoints[i],b)<1.1)){this.flung=true;this.alarm(pos,2);const v=new T.Vector3(pos.x-this.rope.anchor.x,0,pos.z-this.rope.anchor.z).normalize();const impulse=Math.min(energy*.22,45)*Math.min(1,prefabs[p.spec.kind].mass/4+.25);p.body.applyImpulse({x:v.x*impulse,y:impulse*.65,z:v.z*impulse},true);}}
  }
  /** Forgiving plug-in (AGENTS 7): close enough to the socket and not overstretched seats the plug. */
  canSeat(){const pos=this.player.translation();return Math.min(distance(pos,this.level.target)-.6,distance(this.plugPosition,this.level.target))<1.6&&this.rope.strain<1.12;}
  /** Where a seated plug sits: the Meeting strip's inlet (R5-030), the Playground socket's face plate (R5-152), or the socket. */
  seatAt(){return this.strip&&this.stripPlaced()?this.strip.seatAt():this.pg?.seat.clone()??new T.Vector3(this.level.target.x,.28,this.level.target.z);}
  seat(){return this.seatAt();}
  trySeat(){
    if(!this.holdingPlug||!this.canSeat())return false;
    this.connected=true;this.holdingPlug=false;this.rope.release();this.plugPosition.copy(this.seatAt());this.circuit.leads[0].closed=true;this.audio.plug();this.plugFlash(this.plugPosition);return true;
  }
  /** Socket signpost (R5-121): the ring pulses softly on its own; carrying the plug within 3 m it
   *  turns job yellow and grows, and once letting go would seat the plug a ghost plug shows where
   *  it will sit, with a soft tick on entering. */
  private ghost?:T.Group;private wasSeatable=false;
  socketCue(){
    const ring=this.target,mat=ring.material as T.MeshBasicMaterial,t=this.time;
    const holding=this.holdingPlug&&!this.connected,near=holding&&distance(this.plugPosition,this.level.target)<3,seat=holding&&this.canSeat();
    mat.color.set(near?'#ffd84a':'#64ddd4');ring.scale.setScalar((near?1.3:1)*(1+Math.sin(t*(seat?9:3))*(seat?.16:.12)));
    if(!this.ghost){this.ghost=makeProp('plug');const m=new T.MeshBasicMaterial({color:'#ffd84a',transparent:true,opacity:.45,depthTest:false});m.userData.outlineParameters={visible:false};
      this.ghost.traverse(o=>{if(o instanceof T.Mesh){o.material=m;o.renderOrder=11;o.castShadow=false;}});this.ghost.position.set(this.level.target.x,.28,this.level.target.z);this.root.add(this.ghost);}
    if(seat)this.ghost.position.copy(this.seatAt());
    // Meeting: once the plug is in, the ring would read as "go here" again, so it goes (R5-030).
    if(this.strip)ring.visible=!this.connected;
    this.ghost.visible=seat;if(seat&&!this.wasSeatable)this.audio.tone(1320,.05,.03,'triangle');this.wasSeatable=seat;
  }
  /** The slingshot's visible half: the released plug whips back along the cable toward the anchor
   *  and bowls over what it meets. */
  recoil?:{path:Point[];travel:number;t:number;energy:number;hit:Set<Prop>};
  releasePlug(){
    // Letting go with the plug at the socket seats it, unless the cable is loaded for a slingshot.
    if(this.rope.peak<=1&&this.rope.energy<=1&&this.trySeat())return;
    const energy=this.rope.release();this.holdingPlug=false;
    if(energy>1){this.slingshot(energy);this.hitstop=Math.max(this.hitstop,.06);this.audio.noise(.15,.1,2500);
      const over=Math.sqrt(energy/60),path=[{x:this.plugPosition.x,z:this.plugPosition.z},...[...this.rope.bends].reverse(),this.rope.anchor];
      this.recoil={path,travel:Math.min(3,over*4+1.5),t:0,energy,hit:new Set()};this.burst(this.plugPosition,'#ffdf94',12);
    }else this.audio.thud(.5);
    this.plugPosition.y=.22;
  }
  stepRecoil(dt:number){
    const r=this.recoil;if(!r)return;if(this.holdingPlug||this.connected){this.recoil=undefined;return;}
    const prev=this.plugPosition.clone();r.t=Math.min(1,r.t+dt/.35);
    // Ease out along the cable's route from the plug back toward the anchor.
    let left=(1-(1-r.t)**3)*r.travel,at=r.path[0];
    for(let i=1;i<r.path.length;i++){const a=r.path[i-1],b=r.path[i],len=distance(a,b);if(left<=len){const k=len?left/len:0;at={x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k};left=-1;break;}left-=len;at=b;}
    this.plugPosition.set(at.x,.22,at.z);
    const dir=new T.Vector3(this.plugPosition.x-prev.x,0,this.plugPosition.z-prev.z);if(dir.lengthSq()>1e-6)dir.normalize();
    for(const p of this.props){if(r.hit.has(p)||!p.mesh.visible||p===this.held)continue;const q=p.body.translation();
      if(segmentDistance(q,prev,this.plugPosition)<.6&&q.y<1.4){r.hit.add(p);const k=T.MathUtils.clamp(r.energy*.22,4,30)*Math.min(1,prefabs[p.spec.kind].mass/4+.25);p.body.applyImpulse({x:dir.x*k,y:k*.5,z:dir.z*k},true);this.flung=true;}}
    if(Math.floor(r.t*6)!==Math.floor((r.t-dt/.35)*6))this.burst({x:at.x,y:.1,z:at.z},'#e9e4d6',2,'dust');
    if(r.t>=1)this.recoil=undefined;
  }
  simulateCable(){
    if(this.holdingPlug){const pos=this.player.translation();this.plugPosition.set(pos.x+Math.sin(this.heading)*.65,pos.y+.05,pos.z+Math.cos(this.heading)*.65);}
    const beforeBends=[...this.rope.bends],before=beforeBends.length,overBefore=this.rope.length-this.rope.maxLength;
    // Dynamic furniture contributes corners only near the current rope path.
    // This bounds the visibility graph in a dense room while retaining local wraps.
    const route=this.ropePoints.length>1?this.ropePoints:[this.rope.anchor,this.plugPosition];
    // Props the rope is wrapped on always stay in; the rest are the nearest twenty.
    const near=this.props.filter(p=>p.mesh.visible&&p!==this.held&&prefabs[p.spec.kind].mass>=3&&p.body.translation().y<1.8).map(p=>({p,d:Math.min(...route.slice(1).map((b,i)=>segmentDistance(p.body.translation(),route[i],b)))})).filter(v=>v.d<1.2||this.wrapped.has(v.p));
    near.sort((a,b)=>Number(this.wrapped.has(b.p))-Number(this.wrapped.has(a.p))||a.d-b.d);const chosen=near.slice(0,30).map(v=>v.p);
    // Light clutter (bins, cones, small crates, plants) doesn't stop the cable; a dragged cable
    // sweeps it aside instead of passing through it.
    if(this.holdingPlug&&this.rope.strain>.4&&this.ropePoints.length>1)for(const p of this.props){if(!p.mesh.visible||p===this.held||prefabs[p.spec.kind].mass>=3)continue;const q=p.body.translation();if(q.y>.8)continue;
      for(let i=1;i<this.ropePoints.length;i++){const a=this.ropePoints[i-1],b=this.ropePoints[i];if(segmentDistance(q,a,b)>.28)continue;
        const sx=b.x-a.x,sz=b.z-a.z,len=Math.hypot(sx,sz)||1,side=Math.sign((q.x-a.x)*-sz/len+(q.z-a.z)*sx/len)||1,m=prefabs[p.spec.kind].mass;
        p.body.applyImpulse({x:-sz/len*side*m*.06,y:0,z:sx/len*side*m*.06},true);break;}}
    const furniture=chosen.map(p=>{
      const pos=p.body.translation(),[w,,d]=prefabs[p.spec.kind].size,rotation=new T.Matrix4().makeRotationFromQuaternion(p.mesh.quaternion).elements;
      const hx=Math.abs(rotation[0])*w/2+Math.abs(rotation[8])*d/2+.05,hz=Math.abs(rotation[2])*w/2+Math.abs(rotation[10])*d/2+.05;
      return {id:`prop-${p.body.handle}`,minX:pos.x-hx,maxX:pos.x+hx,minZ:pos.z-hz,maxZ:pos.z+hz,prop:p};
    }).filter(o=>!(this.plugPosition.x>o.minX&&this.plugPosition.x<o.maxX&&this.plugPosition.z>o.minZ&&this.plugPosition.z<o.maxZ)&&!(this.rope.anchor.x>o.minX&&this.rope.anchor.x<o.maxX&&this.rope.anchor.z>o.minZ&&this.rope.anchor.z<o.maxZ));
    const obstacles=[...this.obstacles,...furniture];this.ropePoints=this.rope.update(this.plugPosition,obstacles);
    const isCorner=(o:Obstacle,b:Point)=>(Math.abs(b.x-o.minX+CORNER)<.05||Math.abs(b.x-o.maxX-CORNER)<.05)&&(Math.abs(b.z-o.minZ+CORNER)<.05||Math.abs(b.z-o.maxZ-CORNER)<.05);
    this.wrapped=new Set(furniture.filter(o=>this.rope.bends.some(b=>isCorner(o,b))).map(o=>o.prop));
    const swungClear=beforeBends.filter(b=>!this.rope.bends.some(a=>distance(a,b)<.01)).some(b=>obstacles.some(o=>isCorner(o,b)));
    if(this.running&&this.rope.bends.length!==before){if(this.rope.bends.length>before)this.audio.knock(1);else this.audio.slip();}
    // A taut rope whipping off a corner slingshots whatever lies along it.
    if(this.running&&this.holdingPlug&&swungClear&&this.rope.bends.length<before&&overBefore>.3)this.slingshot(overBefore**2*60*.6);
  }
  /** Where a held plug is drawn: Pip's right glove (gameplay keeps using plugPosition). */
  handPosition(){return this.rig?this.hand.getWorldPosition(new T.Vector3()):this.plugPosition.clone();}
  drawCable(){
    // The spool: wound cross-section is proportional to the length still on it.
    if(this.spool){const left=this.coffeeReused?1:Math.max(0,1-this.rope.length/this.rope.maxLength),r=Math.sqrt(.07*.07+(.31*.31-.07*.07)*left);this.spool.scale.set(r,r,1);}
    const end=this.holdingPlug?this.handPosition():this.plugPosition.clone();this.plug.position.copy(end);
    const strain=this.holdingPlug?this.rope.strain:.3,points=cablePath(this.ropePoints,end,.5,strain);
    // The cable goes round Pip, not through him: samples inside his body (a 0.38 m capsule up to
    // 1.45 m) are pushed out sideways. The last half metre into the glove is left alone.
    {const pip=this.player.translation(),R=.38;let fromEnd=0;
      for(let i=points.length-2;i>=1;i--){fromEnd+=points[i].distanceTo(points[i+1]);if(fromEnd<.45)continue;const q=points[i];if(q.y>1.45)continue;
        let dx=q.x-pip.x,dz=q.z-pip.z;const d=Math.hypot(dx,dz);if(d>=R)continue;if(d<1e-3){dx=-Math.sin(this.heading);dz=-Math.cos(this.heading);}else{dx/=d;dz/=d;}q.x=pip.x+dx*R;q.z=pip.z+dz*R;}}
    // Near its limit the cable buzzes: it jitters, sparks and twangs at the corner it is biting,
    // and coworkers along it flinch.
    const bite=this.rope.bends.at(-1),frantic=this.holdingPlug&&this.rope.strain>.97;
    if(frantic)for(let i=1;i<points.length-1;i++){points[i].x+=(Math.random()-.5)*.04;points[i].z+=(Math.random()-.5)*.04;}
    this.twang.visible=frantic&&!!bite;if(frantic&&bite){this.twang.position.set(bite.x,.25,bite.z);this.twang.rotation.y=this.last*.02;this.twang.scale.setScalar(1+Math.sin(this.last*.05)*.15);
      if(Math.random()<.12)this.burst({x:bite.x,y:.2,z:bite.z},'#fff3a3',3,'spark');}
    if(this.holdingPlug&&this.rope.strain>.9&&Math.floor(this.last/700)!==Math.floor((this.last-16)/700))for(let i=1;i<this.ropePoints.length;i++){const a=this.ropePoints[i-1],b=this.ropePoints[i];this.alarm({x:(a.x+b.x)/2,z:(a.z+b.z)/2},2.2);}
    // The hero cable: strain builds from the reel toward Pip's hand; gold once it is plugged in,
    // with current pulses flowing to the load.
    // Pulses mean current, and only that (R5-040): they run whenever the supply carries any (in the
    // Meeting that is the urn and heater before the projector is on). A plugged-in cable carrying
    // nothing because the strip tripped goes a dull gold.
    const live=(this.circuit.draw.get('supply')??0)>0&&!this.circuit.sources[0].tripped;
    if(points.length>1){const hose=hoseGeometry(points,{radius:.1,strain:u=>strain*(.6+.4*u),tint:this.connected?(this.strip&&!live?DULL_GOLD:GOLD):undefined});this.ropeMesh.geometry.dispose();this.ropeMesh.geometry=hose.geo;
      this.pulses.update(hose.curve,hose.length,this.last/1000,live);
      // The joint: the coupler sits on the cable where the second reel was joined.
      if(this.extension){if(!this.joint){this.joint=makeProp('coupler');this.root.add(this.joint);}
        const u=T.MathUtils.clamp(this.joinAt/Math.max(hose.length,.01),0,1),at=hose.curve.getPointAt(u),tan=hose.curve.getTangentAt(u);
        this.joint.position.set(at.x,Math.max(at.y,.12),at.z);this.joint.rotation.set(0,Math.atan2(-tan.z,tan.x),0);}}
    this.audio.strain(this.holdingPlug&&!this.paused&&!this.won?this.rope.strain:0);
  }
  burst(pos:{x:number;y:number;z:number},color:string,count:number,kind:Fx='debris'){this.fx.spawn(kind,pos,count,color);if(kind==='confetti')this.beat('confetti');}
  step(dt:number){
    this.time+=dt;const p=this.player.translation();
    let x=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'));
    let z=Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'));
    if(this.stick){x+=this.stick.x;z+=this.stick.z;}
    if(this.menu){x=0;z=0;}
    if(this.atBench){x=0;z=0;this.heading=this.station!.facing;}
    const pad=navigator.getGamepads?.()[0];if(pad){x+=Math.abs(pad.axes[0])>.15?pad.axes[0]:0;z+=Math.abs(pad.axes[1])>.15?pad.axes[1]:0;this.yaw-=Math.abs(pad.axes[2])>.15?pad.axes[2]*dt*2:0;this.pitch=T.MathUtils.clamp(this.pitch+(Math.abs(pad.axes[3])>.15?pad.axes[3]*dt:0),-.3,.45);}
    const move=new T.Vector3(x,0,z);if(move.length()>1)move.normalize();move.applyAxisAngle(new T.Vector3(0,1,0),this.yaw);
    if(move.length()>.1)this.heading=Math.atan2(move.x,move.z);
    let speed=this.keys.has('ShiftLeft')?6.8:4.2;if(this.held)speed/=1+prefabs[this.held.spec.kind].mass/25;if(this.lunch?.held?.cable.rating===10)speed*=.65;
    const pull=this.lunch?this.lunch.pull():this.holdingPlug?this.rope.pull(p):{x:0,z:0};
    this.vertical=Math.max(-20,this.vertical-18*dt);
    this.controller.computeColliderMovement(this.playerCollider,{x:(move.x*speed+pull.x)*dt,y:this.vertical*dt,z:(move.z*speed+pull.z)*dt},undefined,undefined,c=>c.handle!==this.held?.collider.handle);
    const delta=this.controller.computedMovement(),wasGrounded=this.grounded;this.grounded=this.controller.computedGrounded();
    if(this.grounded&&!wasGrounded&&this.airborne>.25){this.squash=Math.min(1,this.airborne*1.4);this.burst({x:p.x,y:.1,z:p.z},'#d9d2c3',5,'dust');this.audio.thud(3);}
    this.airborne=this.grounded?0:this.airborne+dt;if(this.grounded&&this.vertical<0)this.vertical=-.1;
    // Sprinting kicks up a small puff behind each footfall, alternating feet.
    const pace=Math.hypot(delta.x,delta.z)/Math.max(dt,1e-3);
    if(this.grounded&&pace>5.5&&!this.atBench){this.stepT+=dt;if(this.stepT>.19){this.stepT=0;this.stepSide=-this.stepSide;const hx=Math.sin(this.heading),hz=Math.cos(this.heading);
      this.burst({x:p.x-hx*.25+hz*.13*this.stepSide,y:.06,z:p.z-hz*.25-hx*.13*this.stepSide},'#e6dfd2',1,'dust');}}else this.stepT=.12;
    this.player.setNextKinematicTranslation({x:T.MathUtils.clamp(p.x+delta.x,-this.level.width/2+.5,this.level.width/2-.5),y:p.y+delta.y,z:T.MathUtils.clamp(p.z+delta.z,-this.level.depth/2+.5,this.level.depth/2-.5)});
    // Light things are carried at chest height; heavy furniture is pushed along the floor so it stays upright.
    if(this.held){const b=this.held.body,pos=b.translation(),kind=prefabs[this.held.spec.kind],heavy=kind.mass>=15,ahead=heavy?.5+Math.max(kind.size[0],kind.size[2])/2:1.05,target={x:p.x+Math.sin(this.heading)*ahead,y:heavy?kind.size[1]/2+.03:p.y+.55,z:p.z+Math.cos(this.heading)*ahead};b.setLinvel({x:(target.x-pos.x)*12,y:(target.y-pos.y)*12,z:(target.z-pos.z)*12},true);b.setAngvel({x:0,y:0,z:0},true);}
    this.world.timestep=dt;this.world.step();
    if(this.holdingPlug&&this.rope.strain>.88)for(const prop of this.props){const pos=prop.body.translation();if(prefabs[prop.spec.kind].mass<=15&&this.ropePoints.slice(1).some((b,i)=>segmentDistance(pos,this.ropePoints[i],b)<.65)){const v=new T.Vector3(p.x-pos.x,0,p.z-pos.z).normalize().multiplyScalar(dt*12*(this.rope.strain-.8));prop.body.applyImpulse({x:v.x,y:.015,z:v.z},true);}}
    for(const prop of this.props){if(!prop.body.isEnabled())continue;const pos=prop.body.translation(),v=prop.body.linvel(),speed=Math.hypot(v.x,v.y,v.z);
      // Two tiers (R5-097): a hard knock startles nearby coworkers and costs nothing; only a fragile
      // prop hit hard, or anything in a very hard crash, breaks (damage and repair cost).
      const hit=this.time>2&&prop!==this.held&&!this.strip?.isTower(prop)&&prop.lastSpeed-speed>3,kind=prefabs[prop.spec.kind];
      if(hit&&!prop.damaged&&prop.lastSpeed>5.5&&(FRAGILE.has(prop.spec.kind)||prop.lastSpeed>9)&&prop.lastSpeed-speed>3.5){prop.damaged=true;this.alarm(pos);this.damage++;this.cost+=kind.cost;this.beat('break');if(prop.spec.kind==='glass')this.audio.glass();else if(kind.mass<1)this.audio.clatter();else this.audio.thud(kind.mass);this.burst(pos,'#e1d4b7',3);this.impactDust(pos);if(prop.spec.kind==='glass')this.shatter(prop);}
      else if(hit&&prop.lastSpeed>4&&this.time-(this.knocked.get(prop)??-9)>1){this.knocked.set(prop,this.time);this.alarm(pos,3.5);this.beat('impact');if(kind.mass<1)this.audio.clatter();else this.audio.thud(kind.mass);this.impactDust(pos);}
      prop.lastSpeed=speed;
      // Paper sheets flutter: heavy air drag plus a wobble while airborne.
      if(prop.spec.kind==='paper'&&pos.y>.15&&speed>.3){prop.body.applyImpulse({x:-v.x*.004,y:-v.y*.0045+.0002,z:-v.z*.004},true);const w=this.time*23+prop.body.handle;prop.body.applyTorqueImpulse({x:Math.sin(w)*.00002,y:Math.sin(w*1.7)*.00002,z:Math.cos(w*1.3)*.00002},true);}
      if(pos.y< -3||Math.abs(pos.x)>this.level.width/2+1||Math.abs(pos.z)>this.level.depth/2+1){prop.body.setTranslation(prop.home,true);prop.body.setLinvel({x:0,y:0,z:0},true);}
    }
    this.checkGlass(p,pace);
    // Required items stranded out of reach (on top of tall furniture, or inside a sealed space) go back home.
    if(Math.floor(this.time)!==Math.floor(this.time-dt))for(const prop of this.props){if(!prop.spec.id||prop===this.held||!prop.body.isEnabled()||!prop.body.isDynamic())continue;const q=prop.body.translation();const sealed=this.level.sealed?.some(s=>q.x>s.minX&&q.x<s.maxX&&q.z>s.minZ&&q.z<s.maxZ)||
        // Lunch: an item thrown into the dark storeroom can't be grabbed there, so it comes back (items that live in the store stay).
        (!!this.lunch&&!this.lunch.canGrab(q)&&this.lunch.canGrab(prop.home));const n=q.y>2.1||sealed?(this.stuck.get(prop)??0)+1:0;this.stuck.set(prop,n);if(n>=4){prop.body.setTranslation(prop.home,true);prop.body.setLinvel({x:0,y:0,z:0},true);this.burst(prop.home,'#fffaf0',6,'dust');this.stuck.set(prop,0);}}
    if(p.y< -3){this.player.setTranslation({x:this.level.spawn.x,y:1,z:this.level.spawn.z},true);this.vertical=0;}
    // Past the deadline the meeting waits impatiently; running late only costs time grade.
    if(this.level.deadline&&this.time>this.level.deadline&&Math.floor(this.time/3)!==Math.floor((this.time-dt)/3))this.alarm(this.level.target,6);
    // All six pins down: a strike.
    if(this.level.id==='playground'&&!this.pinsCheered&&Math.floor(this.time*4)!==Math.floor((this.time-dt)*4)&&this.pinsDown()>=6){this.pinsCheered=true;this.audio.milestone();this.freeze(.06);this.burst({x:5,y:1.5,z:5.3},'#ffcf52',40,'confetti');}
    if(this.lunch){this.lunch.step(dt);this.lunchWarnings(dt);}else if(this.station){this.station.update(dt);if(this.station.complete()&&!this.won)this.win();}else if(this.hub)this.hub.update(dt);else{this.stepRecoil(dt);this.simulateCable();this.strip?.step(dt);this.circuit.leads[0].closed=this.connected&&this.stripPlaced();this.circuit.loads[0].enabled=!this.level.switchAt||this.switchedOn;this.circuit.tick(dt);
      // The lamp/projector follows the circuit. The Playground lets the lamp burn 1.2 s before the win (R5-067);
      // a Meeting projector on an overloaded strip only runs until its breaker trips, so it doesn't count (R5-041).
      this.lampLit=this.circuit.loads[0].state==='on';this.litFor=this.lampLit?this.litFor+dt:0;if(this.lampLit&&!this.won&&!this.strip?.overloaded&&this.litFor>=(this.pg?1.2:0))this.win();}
  }
  /** Lunch: the fridge is heard warming before the food spoils (R5-088); the beat lands when it fails. */
  private fridgeT=0;
  lunchWarnings(dt:number){const j=this.lunch!.job;if(j.failed||j.done||j.cooled)return;this.fridgeT-=dt;
    if(j.temperature>=.9&&this.fridgeT<=0){this.fridgeT=2;this.audio.fridgeWarn(true);}
    else if(j.temperature>=.7&&this.fridgeT<=0){this.fridgeT=4;this.audio.fridgeWarn(false);}}
  /** The Lunch job failed (lunch-runtime sets won): a held, coral beat at the fridge or oven, and the camera goes there. */
  private lunchFailed(){const j=this.lunch!.job,burned=j.tray==='burned',at=burned?LUNCH_OVEN:LUNCH_FRIDGE;this.failAt=at;this.winShot=undefined;
    this.audio.fail(burned?'burn':'spoil');this.audio.strain(0);this.freeze(.15);this.flash('#ff7a6b',.3);this.beat('fail');
    this.burst({x:at.x,y:1.4,z:at.z},'#fff3c8',1,'flash');for(let k=0;k<8;k++){const a=k/8*Math.PI*2;this.burst({x:at.x+Math.cos(a)*.6,y:.1,z:at.z+Math.sin(a)*.6},'#e9e4d6',1,'dust');}}
  win(){this.won=true;this.winAt=performance.now();this.survey=false;this.winShot=undefined;this.audio.win();this.audio.strain(0);if(this.lightUp)this.lightUp();else if(this.screen){(this.screen.material as T.MeshToonMaterial)=toon('#f9df88',{emissive:'#ffd76a',ei:.5});}if(this.beam)this.beam.visible=true;
    // Station jobs add their mistakes and process cost to the result card and grade on their own limits.
    if(this.station){if(this.atBench)this.leaveBench();const s=this.station.score();this.damage+=s.mistakes;this.cost+=s.cost;}
    // The payoff beat (R5-094/095): a hitstop, a soft full-screen flash, and a flash, floor ring, stars
    // and confetti on the thing that came to life (the station's own payoff, not its bench).
    const f=this.winFocus(),pp=this.player.translation();this.freeze(.12);this.flash('#fff3c8',.3);this.beat('win');this.beat('confetti');
    this.burst({x:f.x,y:f.y+.2,z:f.z},'#fff3c8',1,'flash');this.burst({x:f.x,y:.05,z:f.z},'#ffe36e',1,'ring');this.burst(f,'#ffe36e',8,'star');
    this.burst({x:f.x,y:f.y+.6,z:f.z},'#ffcf52',70,'confetti');this.burst({x:pp.x,y:2,z:pp.z},'#ffcf52',40,'confetti');
    const g=grade(this.time,this.damage,this.cost,this.station?.limits);
    // Records the best, then lands the result tag once the camera has pushed in (1.4 s).
    gameUI(this)?.won(g);
  }
  formatTime(t:number){return `${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,'0')}`;}
  // Zoomed out the camera frames the whole floor like a diorama; zooming in hands it over to Pip.
  /** Close third-person follow with a little velocity lead; Tab toggles a survey of the whole floor.
   *  On success the camera pushes in on the machine that came to life. */
  updateCamera(dt:number){
    const p=this.player.translation(),cam=this.view.camera,ease=1-Math.exp(-dt*5);
    this.lead.lerp(new T.Vector3(Math.sin(this.heading),0,Math.cos(this.heading)).multiplyScalar(this.grounded&&this.airborne===0&&(this.keys.size>0||this.stick)?1.2:0),ease*.5);
    // Zoomed out it frames the floor like a diorama; zooming in drops to Pip's eye line (mockups/look/LOOK.md).
    // The survey distance is fitted so the whole room fits between the job card and the action bar.
    const zoom=this.survey?this.surveyZoom():this.zoom,near=T.MathUtils.clamp((36.5-zoom)/26.5,0,1),follow=cam.aspect<1?1:T.MathUtils.clamp(.62+near*.6,.62,1);
    const room=new T.Vector3(.2,0,1),pip=new T.Vector3(p.x,p.y-.77+.7*near,p.z).add(this.lead.clone().multiplyScalar(near));
    // Keep the stored tilt inside the range the camera can use at this zoom, so dragging back never hits a dead zone.
    if(!this.survey){const base=.68-.24*near;this.pitch=T.MathUtils.clamp(this.pitch,.3-base,1.25-base);}
    let target=room.lerp(pip,this.survey?0:follow),distanceTo=zoom,pitch=T.MathUtils.clamp(.68-.24*near+this.pitch,.3,1.25);
    const pushing=this.won&&(this.winAt>0||!!this.failAt);
    if(this.atBench&&this.station){const st=this.station,v=st.view,portrait=cam.aspect<1;
      // On a phone the panel sits at the top, so the table stays centred instead of shifted.
      target=st.table.clone().add(new T.Vector3(0,v.lookY,0)).addScaledVector(new T.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw)),portrait?0:v.lookX??0);
      // Narrow screens pull back until the whole bench (every tappable control) fits across the screen.
      // Bench distances are tuned for a 30 degree lens (lensScale), so its half-width at the table is d*tan(15 deg)*aspect.
      const fit=v.width?v.width/2*1.08/(Math.tan(T.MathUtils.degToRad(15))*cam.aspect):0;
      distanceTo=Math.max(v.distance*T.MathUtils.clamp(1.25/cam.aspect,1,2.1),fit);pitch=v.pitch;const want=Math.atan2(st.stand.x-st.table.x,st.stand.z-st.table.z);this.yaw+=Math.atan2(Math.sin(want-this.yaw),Math.cos(want-this.yaw))*(this.manual?1:Math.min(1,dt*4));}
    if(pushing){const shot=this.winFrame();target=shot.target;distanceTo=shot.distance;pitch=shot.pitch;
      // The camera swings round to the shot for the first moments, then the player's orbit is theirs again.
      if(performance.now()-this.winAt<1600||this.manual)this.yaw+=Math.atan2(Math.sin(shot.yaw-this.yaw),Math.cos(shot.yaw-this.yaw))*(this.manual?1:Math.min(1,dt*3));}
    // Title: a hero shot of Pip beside the logo (Pip sits in the right half of the frame).
    const titling=!this.running&&document.body.dataset.screen==='title';
    if(titling){const right=new T.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));const portrait=cam.aspect<1;target=new T.Vector3(p.x,p.y+(portrait?1.5:.3),p.z).addScaledVector(right,portrait?0:-2.6);distanceTo=portrait?10.5:8;pitch=.32;}
    // Tests (?manual) snap straight onto a bench so pointer positions are deterministic.
    const snap=this.manual&&this.atBench;
    this.focus.lerp(target,snap?1:this.survey||pushing?ease*.6:titling?1:this.atBench?ease*.8:ease);
    if(cam.fov!==this.fov){cam.fov=this.fov;cam.updateProjectionMatrix();}
    const offset=new T.Vector3(Math.sin(this.yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(this.yaw)*Math.cos(pitch)).multiplyScalar(distanceTo*lensScale(this.fov,this.atBench||titling));
    const wanted=this.focus.clone().add(offset);wanted.x+=(Math.random()-.5)*this.shake;wanted.y+=(Math.random()-.5)*this.shake;
    cam.position.lerp(wanted,snap?1:1-Math.exp(-dt*(pushing?2.5:6)));cam.lookAt(this.focus);this.shake*=.9;
    // Cutaway: a shell wall drops to a 0.9 m stub once the camera is outside its plane (or within
    // 0.6 m inside it). The signed distance to the plane works at corners and diagonal orbits, where
    // the direction to the wall's centre did not. Frame-rate independent.
    const k=1-Math.exp(-dt*9);
    for(const wall of this.shellWalls){const at=wall.group.parent!.getWorldPosition(new T.Vector3()),side=(cam.position.x-at.x)*wall.normal.x+(cam.position.z-at.z)*wall.normal.z,stub=side>-.6;
      wall.group.scale.y=T.MathUtils.lerp(wall.group.scale.y,stub?.01:1,k);wall.group.visible=wall.group.scale.y>.03;}
    this.updateSeeThrough();
  }
  private surveyFit={key:'',zoom:44};
  /** Survey (Tab) distance: the nearest zoom at which all eight corners of the room box (floor to
   *  wall tops) project inside the screen, clear of the job card at the top and the action bar at the
   *  bottom. Recomputed only when the orbit, lens or window shape changes. */
  surveyZoom(){
    const cam=this.view.camera,key=`${this.yaw.toFixed(2)}|${this.pitch.toFixed(2)}|${cam.aspect.toFixed(3)}|${this.fov}`;if(key===this.surveyFit.key)return this.surveyFit.zoom;
    const l=this.level,probe=cam.clone(),target=new T.Vector3(.2,0,1),pitch=T.MathUtils.clamp(.68+this.pitch,.3,1.25),corners:T.Vector3[]=[];
    for(const x of [-l.width/2,l.width/2])for(const z of [-l.depth/2,l.depth/2])for(const y of [0,3])corners.push(new T.Vector3(x,y,z));
    probe.fov=this.fov;probe.aspect=cam.aspect;probe.updateProjectionMatrix();
    const fits=(zoom:number)=>{probe.position.copy(target).add(new T.Vector3(Math.sin(this.yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(this.yaw)*Math.cos(pitch)).multiplyScalar(zoom*lensScale(this.fov)));
      probe.lookAt(target);probe.updateMatrixWorld();return corners.every(c=>{const n=c.clone().project(probe);return Math.abs(n.x)<.94&&n.y>-.62&&n.y<.74;});};
    // Never closer than 36.5, where the survey pitch starts to flatten (see `near` in updateCamera).
    let lo=36.5,hi=170;if(fits(lo))hi=lo;else for(let i=0;i<16;i++){const m=(lo+hi)/2;if(fits(m))hi=m;else lo=m;}
    this.surveyFit={key,zoom:hi};return hi;
  }
  /** Feeds the see-through oval (render/toon.ts): centred on Pip, sized to him on screen, cutting
   *  only what is nearer the camera than he is (or than the item he carries). Off at a bench, in the
   *  survey and on the title and win shots. */
  updateSeeThrough(){
    const cam=this.view.camera,on=this.running&&!this.atBench&&!this.survey&&!this.won;
    if(!on){seeThrough.z=0;return;}
    cam.updateMatrixWorld();const size=this.view.renderer.getDrawingBufferSize(new T.Vector2()),p=this.player.translation();
    const screen=(v:T.Vector3)=>{const n=v.clone().project(cam);return new T.Vector2((n.x*.5+.5)*size.x,(n.y*.5+.5)*size.y);};
    const depth=(x:number,y:number,z:number)=>-new T.Vector3(x,y,z).applyMatrix4(cam.matrixWorldInverse).z;
    const chest=screen(new T.Vector3(p.x,p.y+.1,p.z)),tall=screen(new T.Vector3(p.x,p.y+.85,p.z)).distanceTo(screen(new T.Vector3(p.x,p.y-.77,p.z)));
    let near=depth(p.x,p.y+.1,p.z)-.25;if(this.held){const q=this.held.body.translation();near=Math.min(near,depth(q.x,q.y,q.z)-.5);}
    Object.assign(seeThrough,{x:chest.x,y:chest.y+tall*.08,z:tall*.78,w:near});
    const t=Math.tan(T.MathUtils.degToRad(cam.fov/2));Object.assign(seeProj,{x:t*cam.aspect,y:t,z:size.x,w:size.y});
    const e=cam.matrixWorld.elements;Object.assign(seeY,{x:e[1],y:e[5],z:e[9],w:e[13]});seeClip.x=cam.near;seeClip.y=cam.far;
  }
  /** Steps rendering quality down when frames stay slow (AO first, then bloom and resolution), and
   *  back up one level after 20 s at a steady ~60 fps (a slow start, e.g. shader compiles, must not pin
   *  a player low forever). A level that was too slow after stepping up isn't retried this session.
   *  The result is remembered for next time. */
  qualityCap=2;qualityRaised=false;
  adaptQuality(dt:number){
    if(this.manual||this.view.low||!this.running||this.paused)return;this.slowAvg+=(dt-this.slowAvg)*.05;this.qualityTimer+=dt;
    const q=this.view.getQuality();let next:0|1|2=q;
    if(this.qualityTimer>=3&&q>0&&this.slowAvg>1/45){next=(q-1) as 0|1;if(this.qualityRaised)this.qualityCap=next;}
    else if(this.qualityTimer>=20&&q<this.qualityCap&&this.slowAvg<1/58){next=(q+1) as 1|2;this.qualityRaised=true;}
    else{if(this.slowAvg>1/58)this.qualityTimer=Math.min(this.qualityTimer,3);return;}
    this.qualityTimer=0;this.slowAvg=1/60;this.view.setQuality(next);try{localStorage.setItem('circuit-crew-quality',String(next));}catch{/* storage unavailable */}
  }
  homeZoom(){return this.level.id==='playground'?17:this.station?18.5:this.hub?23:22;}
  /** Start and reset orbit. The lobby turns a little toward its left wall so those doors clear the job card. */
  homeYaw(){return this.level.hub?.4:.14;}
  winShot?:{key:string;target:T.Vector3;distance:number;pitch:number;yaw:number};
  /** The win (or Lunch fail) shot (R5-077): Pip and the payoff framed together in the part of the
   *  screen the result card leaves free (the verifier's NDC x -0.85..0.1, y -0.6..0.7, kept inside
   *  DR-11's centre 70%: x -0.7..0.04, y -0.55..0.62). The view looks across the
   *  Pip-to-payoff line, a little from Pip's side, on the side nearest the current orbit; then the
   *  nearest distance that fits both is found, with the target shifted so the pair sits left. */
  winFrame(){
    const cam=this.view.camera,key=`${cam.aspect.toFixed(3)}|${this.fov}`;if(this.winShot?.key===key)return this.winShot;
    const p=this.player.translation(),f=this.winFocus(),id=this.level.id;
    const pitch=this.station?.5:id==='meeting'?.34:id==='lunch'?.42:.55;
    const dx=f.x-p.x,dz=f.z-p.z,sep=Math.hypot(dx,dz);let yaw=this.yaw;
    if(sep>1.2){const along=Math.atan2(dx,dz),wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a)),diff=(a:number)=>Math.abs(wrap(a-this.yaw));
      const a1=along+Math.PI/2+.45,a2=along-Math.PI/2-.45;yaw=diff(a1)<diff(a2)?a1:a2;}
    const pts=[new T.Vector3(p.x,p.y-.78,p.z),new T.Vector3(p.x,p.y+.95,p.z),f.clone().setY(f.y+.7),f.clone().setY(Math.max(.1,f.y-.5))];
    const probe=cam.clone();probe.fov=this.fov;probe.aspect=cam.aspect;probe.updateProjectionMatrix();
    const dir=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)),right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    const mid=new T.Vector3().addVectors(pts[1],pts[2]).multiplyScalar(.5),half=Math.tan(T.MathUtils.degToRad(this.fov/2)),scale=lensScale(this.fov,false);
    let best={target:mid.clone(),distance:22};
    for(let d=this.station?7:8;d<=40;d+=.5){const target=mid.clone(),dist=d*scale;
      for(let k=0;k<5;k++){probe.position.copy(target).addScaledVector(dir,dist);probe.lookAt(target);probe.updateMatrixWorld();
        let x0=9,x1=-9,y0=9,y1=-9;for(const q of pts){const n=q.clone().project(probe);x0=Math.min(x0,n.x);x1=Math.max(x1,n.x);y0=Math.min(y0,n.y);y1=Math.max(y1,n.y);}
        if(k===4){if(x0>-.7&&x1<.04&&y0>-.55&&y1<.62){best={target,distance:d};d=99;}break;}
        target.addScaledVector(right,((x0+x1)/2+.33)*dist*half*probe.aspect).y+=((y0+y1)/2-.035)*dist*half;}}
    return this.winShot={key,target:best.target,distance:best.distance,pitch,yaw};
  }
  /** A Lunch failure (food spoiled or tray burned): where it happened, once seen. */
  failAt?:Point;
  winFocus(){const l=this.level;if(this.failAt)return new T.Vector3(this.failAt.x,1.3,this.failAt.z);if(this.station)return this.station.winFocus?.()??this.station.table.clone().add(new T.Vector3(0,.5,0));return l.id==='lunch'?new T.Vector3(12,2.2,-7):l.id==='meeting'?new T.Vector3(12.2,1.7,-8.6):new T.Vector3(l.target.x,1.5,l.target.z);}

  /** Procedural walk cycle: legs and arms swing with ground speed; arms reach forward to carry or hold a plug. */
  /** Feeds Pip's rig (src/render/pipRig.ts) with movement, poses and what to glance at. */
  pipSpeed=0;
  animateRig(dt:number){
    if(!this.rig)return;const p=this.player.translation(),speed=dt>0?Math.min(9,Math.hypot(p.x-this.lastPos.x,p.z-this.lastPos.z)/dt):0;this.lastPos.set(p.x,p.y,p.z);
    const lastStride=this.stride;this.stride+=dt*speed*2.2;if(this.grounded&&speed>1&&Math.floor(lastStride/Math.PI)!==Math.floor(this.stride/Math.PI))this.audio.step();
    const turn=dt>0?Math.atan2(Math.sin(this.heading-this.lastHeading),Math.cos(this.heading-this.lastHeading))/dt:0;this.lastHeading=this.heading;
    const titling=!this.running&&document.body.dataset.screen==='title';
    // On a win Pip turns to the camera; on a Lunch failure Pip turns to look at what went wrong (R5-119).
    const face=this.failAt?Math.atan2(this.failAt.x-p.x,this.failAt.z-p.z):this.yaw;
    if(this.won||titling)this.heading+=Math.atan2(Math.sin(face-this.heading),Math.cos(face-this.heading))*Math.min(1,dt*6);this.pipSpeed=speed;
    const held=this.held?prefabs[this.held.spec.kind].mass>=15?'heavy':'light':'none',lunchHeld=this.lunch?.held;
    const near=this.running&&!this.won&&!this.held&&!this.holdingPlug?this.nearest():undefined;
    this.rig.update({dt,time:this.last/1000,speed,grounded:this.grounded,rising:this.vertical>0,airborne:this.airborne,turnRate:turn,carrying:held,holdingPlug:this.holdingPlug,
      strain:lunchHeld?lunchHeld.cable.rope.strain:this.rope.strain,won:this.won&&!this.failAt,waving:titling,lookAt:this.failAt?new T.Vector3(this.failAt.x,1.2,this.failAt.z):near?new T.Vector3().copy(near.body.translation()):undefined});
  }
  render(dt:number){
    const p=this.player.translation();this.avatar.position.set(p.x,p.y-.78,p.z);
    // At a bench the camera looks over Pip's shoulder; Pip steps out of frame so the tabletop reads.
    this.avatar.visible=!this.atBench;this.pipRing.visible=!this.atBench;this.avatar.rotation.y=this.heading;const moving=(this.keys.size>0||!!this.stick)&&this.running&&!this.paused;this.squash=T.MathUtils.lerp(this.squash,0,1-Math.exp(-dt*9));
    const sy=1-this.squash*.22+(moving&&this.grounded?Math.sin(this.time*15)*.03:0),sxz=1/Math.sqrt(Math.max(.5,sy));this.avatar.scale.set(sxz,sy,sxz);
    this.animateRig(dt);
    for(const prop of this.props){if(!prop.mesh.visible)continue;prop.mesh.position.copy(prop.body.translation());prop.mesh.quaternion.copy(prop.body.rotation());}
    this.updateBatches();
    // Coworkers breathe, type at their desks, turn to watch Pip when close, and pop a "!" when startled.
    const clock=this.last/1000;
    for(const npc of this.npcs){const g=npc.group,d=distance(p,g.position),near=d<2;npc.alarm=Math.max(0,npc.alarm-dt);npc.cheerT=Math.max(0,npc.cheerT-dt);
      // Pip himself gets a reaction (R5-089): sprinting past makes a coworker jump, strolling past earns an "hm".
      if(this.running&&!this.won&&!this.atBench&&d<1.4&&npc.alarm<=0&&this.time-npc.noticed>6){npc.noticed=this.time;
        if(this.pipSpeed>5.5){npc.alarm=ALARM;npc.from={x:p.x,z:p.z};this.beat('alarm');if(this.time-this.lastVoice>.5){this.lastVoice=this.time;this.audio.voice('alarm',1.1);}}
        else if(this.pipSpeed>1&&this.time-this.lastVoice>1.5){this.lastVoice=this.time;this.audio.voice('hm',.9+npc.seed%1*.3);}}
      // Startled: first a look at the crash, then a turn to glare at Pip (R5-230).
      const age=ALARM-npc.alarm,look=npc.alarm>0&&age<.5&&npc.from?npc.from:p;
      const watch=d<4||npc.alarm>0||this.won||npc.cheerT>0,yaw=watch?Math.atan2(look.x-g.position.x,look.z-g.position.z):npc.restYaw;
      g.rotation.y+=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y))*Math.min(1,dt*5);
      const cheer=this.won&&!this.failAt?Math.abs(Math.sin(clock*9+npc.seed)):npc.cheerT>0?Math.abs(Math.sin(npc.cheerT*Math.PI*2.5))*.7:0,hop=npc.alarm>0&&age<.3?Math.sin(age/.3*Math.PI)*.25:0,duck=npc.alarm>0?.72:near?.88:1,breathe=Math.sin(clock*1.3*Math.PI*2+npc.seed)*.025;
      const typing=npc.seated&&!watch?Math.abs(Math.sin(clock*16+npc.seed*3))*.03*(Math.sin(clock*.7+npc.seed)>-.3?1:0):0;
      if(npc.seated&&!watch)g.rotation.y=npc.restYaw+Math.sin(clock*.45+npc.seed*2)*Math.max(0,Math.sin(clock*.23+npc.seed))*.6;
      npc.body.scale.set(2-duck-breathe,duck+breathe,2-duck-breathe);npc.body.position.y=npc.baseY+cheer*.35+typing+hop;npc.body.rotation.z=npc.alarm>0?Math.sin(npc.alarm*20)*.12:0;
      const shown=npc.alarm>0&&!this.won;npc.bubble.visible=shown;npc.sweat.visible=shown;npc.calm.visible=!shown;npc.startled.visible=shown;if(shown){const s=age<.12?age/.12*1.3:age<.25?1.3-(age-.12)/.13*.3:1;npc.bubble.scale.setScalar(.7*s);}}
    if(this.lunch)this.lunch.render(dt);else if(!this.station&&!this.hub){this.drawCable();this.strip?.render(dt);}this.socketCue();this.pg?.update(dt,this.switchedOn,this.lampLit||this.won,this.connected);
    // The reticle marks what E would grab (or the part a held plug would attach to); hidden when nothing is in reach.
    const nearest=this.nearest(),attach=this.holdingPlug?this.props.find(q=>q.mesh.visible&&((q.spec.id==='coupler'&&!this.coupler)||(q.spec.id==='extension'&&!this.extension))&&distance(p,q.body.translation())<1.9):undefined;
    const plugFirst=!this.lunch&&!this.station&&!this.hub&&!this.holdingPlug&&distance(p,this.plugPosition)<1.75&&!(nearest&&this.reach(p,nearest)<distance(p,this.plugPosition));
    const mark=attach?.mesh.position??(plugFirst?this.plugPosition:!this.holdingPlug&&!this.held?nearest?.mesh.position:undefined);
    // The brackets lie flat on the floor and hug the marked prop's footprint (R5-122).
    const markKind=attach?.spec.kind??(plugFirst?undefined:nearest?.spec.kind),foot=markKind?prefabs[markKind].size:undefined;
    this.reticle.visible=this.running&&!this.won&&!this.atBench&&!!mark;if(mark){const hx=foot?Math.max(.3,(foot[0]+.2)/2):.53,hz=foot?Math.max(.3,(foot[2]+.2)/2):.53;this.reticle.position.set(mark.x,.03,mark.z);this.reticle.scale.setScalar(1+Math.sin(this.last*.008)*.1);
      // Each corner moves out (or in) to the footprint's corner; the bracket arms keep their size.
      for(const c of this.reticle.children){const s=Math.sin(c.rotation.y),co=Math.cos(c.rotation.y),cx=-.53*co-.53*s,cz=.53*s-.53*co;c.position.set(Math.sign(cx)*(hx-.53),0,Math.sign(cz)*(hz-.53));}}
    this.pipRing.position.set(p.x,.03,p.z);
    if(this.lunch?.job.failed&&!this.failAt)this.lunchFailed();
    // A hitstop holds the particles too, so the frame after a big moment still shows it.
    this.fx.update(this.hitstop>0?0:dt);
    // The meeting clock reads 9:55 and its red minute hand sweeps the four minutes to the meeting.
    if(this.clock){const late=this.level.deadline!==undefined&&this.time>this.level.deadline;this.clock.hand.rotation.z=-(9+55/60)/12*Math.PI*2-this.time/3600/12*Math.PI*2;this.clock.minute.rotation.z=-(55/60)*Math.PI*2-Math.min(this.time,this.level.deadline??240)/60/60*Math.PI*2;this.clock.face.material=toon(late&&Math.floor(this.last/300)%2?'#ff7a6b':'#fbf5ea');}
    // Title: the reel's plug spits a spark every couple of seconds.
    if(!this.station&&!this.hub&&!this.running&&document.body.dataset.screen==='title'&&Math.floor(this.last/1900)!==Math.floor((this.last-dt*1000)/1900)){this.burst(this.plugPosition,'#fff3a3',10,'spark');this.burst(this.plugPosition,'#ffe36e',2,'star');this.audio.noise(.04,.03,3200,'highpass');}
    // Steam from the coffee machine until its extension is borrowed.
    const coffee=this.level.id==='meeting'&&!this.coffeeReused?this.props.find(q=>q.spec.id==='coffee'):undefined;if(coffee&&Math.floor(this.last/450)!==Math.floor((this.last-dt*1000)/450)){const c=coffee.body.translation();this.burst({x:c.x,y:c.y+.5,z:c.z},'#fffaf0',1,'smoke');}
    // After a while a dotted ghost line traces the clean way round walls and pillars to the socket.
    // It shows for 12 s at a time after 45 s without a connection, from the plug (or, before the
    // Meeting strip is placed, from Pip to the strip), and steps in one chevron at a time.
    const idle=this.time-45;
    if(idle>0&&idle%40<12&&!this.connected&&!this.lunch&&!this.station&&!this.hub&&!this.won){this.hint.visible=true;if(Math.floor(this.time)!==this.hintAt||!this.hintPath){this.hintAt=Math.floor(this.time);this.hintPath=this.hintRoute();}
      const path=this.hintPath,shown=(idle%40)*6;
      this.hint.children.forEach((d,k)=>{let along=.9+k*.8;d.visible=k<shown;for(let q=1;q<path.length&&d.visible;q++){const len=distance(path[q-1],path[q]);if(along<=len){d.position.set(T.MathUtils.lerp(path[q-1].x,path[q].x,along/len),.014,T.MathUtils.lerp(path[q-1].z,path[q].z,along/len));d.rotation.y=-Math.atan2(path[q].z-path[q-1].z,path[q].x-path[q-1].x);break;}along-=len;if(q===path.length-1)d.visible=false;}});}
    else this.hint.visible=false;
    gameUI(this)?.update();
    // Count every pass of the frame (composer + outlines) for snapshot().drawCalls.
    this.view.renderer.info.autoReset=false;this.view.renderer.info.reset();
    this.updateCamera(dt);const d0=performance.now();this.view.render();this.profile.draw+=(performance.now()-d0-this.profile.draw)*.05;
  }
  /** Hold-to-restart: shows the hold as a ring filling the pause button; restarts once it is full. */
  holdRestart(){
    const btn=this.hud.querySelector<HTMLElement>('.pausebtn');
    if(!this.restartHold||!this.running||this.paused||this.won||this.atBench){this.restartHold=0;if(btn)btn.style.background='';return;}
    const f=(performance.now()-this.restartHold)/RESTART_HOLD;
    if(btn)btn.style.background=`conic-gradient(#ffd451 ${Math.min(1,f)*360}deg, var(--paper) 0)`;
    if(f>=1){this.restartHold=0;this.action('restart');}
  }
  frame(t:number){requestAnimationFrame(n=>this.frame(n));const dt=Math.min((t-this.last)/1000||1/60,.1);this.last=t;this.pollPad(dt);this.holdRestart();if(this.menu){this.keys.clear();this.stick=undefined;}
    const t0=performance.now();
    if(this.hitstop>0)this.hitstop-=dt;
    else if(this.running&&!this.paused&&!this.won&&!this.manual){this.accumulator+=dt;let steps=0;while(this.accumulator>=1/60&&steps++<5){this.step(1/60);this.accumulator-=1/60;}}
    this.frames++;this.frameWindow+=dt;if(this.frameWindow>=1){this.fps=this.frames/this.frameWindow;this.frames=0;this.frameWindow=0;}
    const t1=performance.now();this.render(dt);const t2=performance.now();this.adaptQuality(dt);
    // Rolling averages (ms) for tools/perf.mjs.
    const k=.05;this.profile.step+=(t1-t0-this.profile.step)*k;this.profile.render+=(t2-t1-this.profile.draw-this.profile.render)*k;
  }
  driver(){
    const live=()=>this.running&&!this.paused&&!this.won;
    const advance=(seconds:number,keys:string[]=[])=>{this.keys=new Set(keys);for(let i=0;i<Math.round(seconds*60)&&live();i++)this.step(1/60);this.keys.clear();this.render(1/60);return this.snapshot();};
    // Steers the real controller with an analog stick; walls and props still block.
    const walkTo=(x:number,z:number,radius=.5,limit=40)=>{
      let best=Infinity,stalled=0;
      for(let i=0;i<limit*60&&live();i++){
        const p=this.player.translation(),dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<radius)break;
        if(d<best-.05){best=d;stalled=0;}else if(++stalled>180)break;
        const s=Math.min(1,d*1.5)/d,c=Math.cos(this.yaw),n=Math.sin(this.yaw);
        this.stick={x:(dx*c-dz*n)*s,z:(dx*n+dz*c)*s};if(d>2.5)this.keys.add('ShiftLeft');else this.keys.delete('ShiftLeft');
        this.step(1/60);
      }
      this.stick=undefined;this.keys.clear();for(let i=0;i<8&&live();i++)this.step(1/60);this.render(1/60);
      const p=this.player.translation();return {arrived:Math.hypot(x-p.x,z-p.z)<radius+.15,state:this.snapshot()};
    };
    // Station tests press the same buttons a player would: act(name, arg) at the bench.
    const act=(name:string,arg?:unknown)=>{const ok=this.station?.act(name,arg)??false;this.render(1/60);return {ok,state:this.snapshot()};};
    return {advance,walkTo,act,audit:(min=.04)=>this.audit(min)};
  }
  /** Layout check for tests: everything that starts out interpenetrating something solid, deeper
   *  than `min` metres. Props against fixed colliders and each other, standing coworkers and Pip's
   *  spawn against both. Call it before advancing time, while everything is where the level put it. */
  audit(min=.04){
    const fixed:RAPIER.Collider[]=[];this.world.forEachCollider(c=>{if(c.parent()?.isFixed())fixed.push(c);});
    const r=(v:number)=>Math.round(v*100)/100;
    const fixedName=(c:RAPIER.Collider)=>{const t=c.translation(),h=(c.shape as RAPIER.Cuboid).halfExtents;return `fixed ${h?`${r(h.x*2)}×${r(h.z*2)}`:'shape'} @${r(t.x)},${r(t.z)}`;};
    const propName=(p:Prop)=>{const t=p.body.translation();return `${p.spec.id??p.spec.kind} @${r(t.x)},${r(t.z)}`;};
    const found:{a:string;b:string;depth:number}[]=[];
    const test=(a:string,sa:RAPIER.Shape,pa:RAPIER.Vector,ra:RAPIER.Rotation,b:string,c:RAPIER.Collider)=>{
      const k=sa.contactShape(pa,ra,c.shape,c.translation(),c.rotation(),0);if(k&&k.distance< -min)found.push({a,b,depth:r(-k.distance)});};
    this.props.forEach((p,i)=>{const c=p.collider,a=propName(p);
      for(const f of fixed)test(a,c.shape,c.translation(),c.rotation(),fixedName(f),f);
      for(const q of this.props.slice(i+1))test(a,c.shape,c.translation(),c.rotation(),propName(q),q.collider);});
    const ball=new RAPIER.Ball(.36),still={x:0,y:0,z:0,w:1};
    for(const n of this.npcs){if(n.seated)continue;const at=n.group.position,pos={x:at.x,y:.6,z:at.z},a=`coworker @${r(at.x)},${r(at.z)}`;
      for(const f of fixed)test(a,ball,pos,still,fixedName(f),f);for(const p of this.props)test(a,ball,pos,still,propName(p),p.collider);}
    const pc=this.playerCollider;for(const f of fixed)test('Pip spawn',pc.shape,pc.translation(),pc.rotation(),fixedName(f),f);
    for(const p of this.props)test('Pip spawn',pc.shape,pc.translation(),pc.rotation(),propName(p),p.collider);
    return found;
  }
  snapshot(){return {quality:this.view.getQuality(),level:this.level.id,running:this.running,paused:this.paused,won:this.won,player:{...this.player.translation()},props:this.props.length,items:this.props.filter(p=>p.spec.id).map(p=>({id:p.spec.id,pos:{...p.body.translation()},visible:p.mesh.visible})),holdingPlug:this.holdingPlug,held:this.held?.spec.id??this.held?.spec.kind,rope:{length:this.rope.length,maxLength:this.rope.maxLength,bends:this.rope.bends,strain:this.rope.strain},time:this.time,damage:this.damage,cost:this.cost,fps:this.fps,drawCalls:this.view.renderer.info.render.calls,electrical:this.circuit.loads[0].state,lunch:this.lunch?.snapshot(),strip:this.strip?.snapshot(),station:this.station?.snapshot(),hub:this.hub?.snapshot(),atBench:this.atBench,alarmed:this.npcs.filter(n=>n.alarm>0).length,stripPlaced:this.stripPlaced(),pinsDown:this.level.id==='playground'?this.pinsDown():undefined,switchedOn:this.switchedOn,pose:this.rig?{arms:this.rig.arms.map(a=>+a.rotation.x.toFixed(2)),legs:this.rig.legs.map(l=>+l.rotation.x.toFixed(2)),torso:+this.rig.torso.rotation.x.toFixed(2),grounded:this.grounded,airborne:+this.airborne.toFixed(2)}:null,profile:this.profile,fastestProp:Math.max(0,...this.props.filter(q=>q!==this.held&&q.body.isEnabled()).map(q=>{const v=q.body.linvel();return Math.hypot(v.x,v.y,v.z);})),lampLit:this.lampLit,hitstops:this.hitstops,beats:this.beats.slice(-40),failAt:this.failAt??null};}
}
