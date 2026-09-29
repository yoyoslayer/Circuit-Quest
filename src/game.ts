import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createRenderer,toon} from './render/toon';
import {BLOBC,bangTexture,freeze,glyph,cachedTexture,part,cyl,sphere} from './render/kit';
import {blob,hoseGeometry,hoseMaterial,Pulses,hot,glossyToon,type Accessory,type Mood} from './render/actors';
const GOLD=new T.Color('#ffd451');
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
import {makeProp,prefabs,type PropSpec} from './props/prefabs';
import {Rope,CORNER,detour,distance,segmentDistance,strainColor,type Point,type Obstacle} from './sim/cable';
import {Circuit} from './sim/electrical';
import {grade} from './sim/grade';
import type {Level,NpcSpot} from './levels/types';
import {LunchRuntime} from './lunch-runtime';
import {PipRig} from './render/pipRig';
import {Particles,type Fx} from './render/particles';
import {decorate,solid,type Decor} from './levels/decor';
import {levels} from './levels';
import {makeStation} from './stations';
import type {Station} from './stations/types';
import {Lobby} from './hub/lobby';

export interface Prop {spec:PropSpec;body:RAPIER.RigidBody;collider:RAPIER.Collider;mesh:T.Group;damaged:boolean;home:T.Vector3;lastSpeed:number}
interface Npc {group:T.Group;body:T.Group;bubble:T.Sprite;sweat:T.Sprite;calm:T.Mesh;startled:T.Mesh;alarm:number;seed:number;baseY:number;seated:boolean;restYaw:number}
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
  circuit:Circuit;keys=new Set<string>();held?:Prop;holdingPlug=false;connected=false;extension=false;coupler=false;coffeeReused=false;
  running=false;paused=false;won=false;time=0;damage=0;cost=0;vertical=0;grounded=false;heading=0;shake=0;
  yaw=.14;pitch=0;zoom=26;survey=false;focus=new T.Vector3();lead=new T.Vector3();winAt=0;shellWalls:{group:T.Group;normal:T.Vector3;height:number}[]=[];orbit=false;pointerX=0;pointerY=0;accumulator=0;last=0;frames=0;fps=60;frameWindow=0;
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
    try{const saved=Number(localStorage.getItem('circuit-crew-quality'));if(saved===0||saved===1)this.view.setQuality(saved);}catch{/* storage unavailable */}
    const {scene}=this.view;scene.add(this.root);this.view.mood(level.id);this.audio.setLevel(level.id);this.root.add(this.decorRoot);this.fx=new Particles(this.root);this.zoom=this.homeZoom();
    this.rope=new Rope({...level.anchor},level.length);this.obstacles=[...level.obstacles];
    if(level.station)this.station=makeStation(level.station,this);
    if(level.hub)this.hub=new Lobby(this);
    this.buildRoom();
    for(const spec of level.props)this.addProp(spec);
    this.batchProps();
    for(const p of level.npcs)this.addNpc(p);
    this.player=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(level.spawn.x,.91,level.spawn.z));
    this.playerCollider=this.world.createCollider(RAPIER.ColliderDesc.capsule(.45,.32).setMass(65),this.player);
    this.controller=this.world.createCharacterController(.025);this.controller.enableAutostep(.25,.2,true);this.controller.enableSnapToGround(.2);this.controller.setApplyImpulsesToDynamicBodies(true);this.controller.setCharacterMass(65);
    this.buildAvatar();
    this.plugPosition=new T.Vector3(level.anchor.x+.7,.3,level.anchor.z+.7);
    this.plug=makeProp('coupler','#ffcc52');this.root.add(this.plug);
    this.target=new T.Mesh(new T.TorusGeometry(.42,.07,8,28),new T.MeshBasicMaterial({color:'#64ddd4'}));this.target.rotation.x=-Math.PI/2;this.target.position.set(level.target.x,.15,level.target.z);this.root.add(this.target);
    const socket=new T.Mesh(new T.BoxGeometry(.48,.38,.3),toon('#384454'));socket.position.set(level.target.x,.25,level.target.z);this.root.add(socket);
    const anchor=makeProp('reel');anchor.position.set(level.anchor.x,.35,level.anchor.z);this.root.add(anchor);
    if(this.station||this.hub)for(const o of [this.plug,this.target,socket,anchor])o.visible=false;
    this.ropeMesh=new T.Mesh(new T.BufferGeometry(),hoseMaterial());this.ropeMesh.castShadow=true;this.root.add(this.ropeMesh);this.pulses=new Pulses(this.root);
    // Comic twang arcs drawn where a taut cable bites a corner.
    {const m=new T.MeshBasicMaterial({color:'#fffaf0'});m.userData.outlineParameters={visible:false};for(let i=0;i<3;i++){const r=.35+i*.18,pts:T.Vector3[]=[];for(let k=0;k<=12;k++){const a=-.55+1.1*k/12;pts.push(new T.Vector3(Math.cos(a)*r,.05*i,Math.sin(a)*r));}const t=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,.022,5,false),m);t.userData.noAO=true;this.twang.add(t);}this.twang.visible=false;this.root.add(this.twang);}
    // Grab cue: four floor-level corner brackets around whatever E would take (UI.md world cues).
    {const m=new T.MeshBasicMaterial({color:'#ffd84a'});m.userData.outlineParameters={visible:false};for(let k=0;k<4;k++){const c=new T.Group();c.rotation.y=k*Math.PI/2;for(const [w,d,x,z] of [[.28,.07,-.4,-.53],[.07,.28,-.53,-.4]] as const){const b=new T.Mesh(new T.BoxGeometry(w,.03,d),m);b.position.set(x,0,z);b.userData.noAO=true;c.add(b);}this.reticle.add(c);}this.reticle.visible=false;this.root.add(this.reticle);}
    // A soft ring under Pip keeps the hero findable among coworkers.
    this.pipRing=new T.Mesh(new T.RingGeometry(.42,.58,40).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#ffc629',transparent:true,opacity:.55,depthWrite:false}));this.pipRing.userData.outlineParameters={visible:false};this.root.add(this.pipRing);this.reticle.rotation.x=-Math.PI/2;this.reticle.renderOrder=10;this.root.add(this.reticle);
    // Idle hint: glowing dots flowing along the clean route to the socket.
    {const m=new T.MeshBasicMaterial({color:'#9ff3ea'});m.color.multiplyScalar(1.4);m.userData.outlineParameters={visible:false};const dot=new T.SphereGeometry(.07,8,6);for(let k=0;k<40;k++){const d=new T.Mesh(dot,m);d.userData.noAO=true;this.hint.add(d);}this.hint.visible=false;this.root.add(this.hint);}
    this.circuit=new Circuit([{id:'supply',limit:5,tripped:false}],[{id:'reel',from:'supply',to:'projector',rating:3,closed:false,heat:0,dead:false}],[{id:'projector',steady:1,enabled:true,state:'off',started:0}]);
    this.setupUI();this.setupInput();if(level.id==='lunch')this.lunch=new LunchRuntime(this);else if(!this.station&&!this.hub){this.simulateCable();this.drawCable();}
    freeze(this.decorRoot);this.updateCamera(1);this.view.render();
    document.body.dataset.ready='true';
    Object.assign(window,{__circuitCrew:{snapshot:()=>this.snapshot(),drive:this.manual?this.driver():undefined}});
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
    const decor=decorate(this);this.screen=decor.screen;this.beam=decor.beam;this.clock=decor.clock;this.lightUp=decor.lightUp;
  }
  addProp(spec:PropSpec){
    const p=prefabs[spec.kind],mesh=makeProp(spec.kind,spec.color,spec.variant),pos=new T.Vector3(spec.x,spec.y??p.size[1]/2+.025,spec.z);
    mesh.position.copy(pos);mesh.rotation.y=spec.rotation??0;this.root.add(mesh);
    const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x,pos.y,pos.z).setRotation(mesh.quaternion).setLinearDamping(.6).setAngularDamping(.8).setCanSleep(true).setCcdEnabled(p.mass<4));
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
    this.npcs.push({group:g,body,bubble,sweat,calm,startled,alarm:0,seed:this.npcs.length*1.7,baseY:seated?.35:0,seated,restYaw});this.root.add(g);
  }
  /** Coworkers near a crash or snap flinch and show a "!" bubble. */
  alarm(at:Point,radius=4.5){let startled=0;for(const npc of this.npcs)if(distance(npc.group.position,at)<radius){if(npc.alarm<=0)startled++;npc.alarm=1;}
    if(startled&&this.time-this.lastVoice>.5){this.lastVoice=this.time;this.audio.voice('alarm',.9+Math.random()*.4);}}
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
    this.root.add(this.avatar);
    new GLTFLoader().load('/models/pip.glb',gltf=>{this.avatar.clear();gltf.scene.traverse(o=>{if(o instanceof T.Mesh){const old=o.material as T.MeshStandardMaterial;o.material=/lens/i.test(old.name)?hot('#fff0b8',2):/hat|gloves|boots/i.test(old.name)?glossyToon('#'+old.color.getHexString(),{spec:.6,size:.975}):toon('#'+old.color.getHexString());o.castShadow=true;o.receiveShadow=true;}});this.avatar.add(gltf.scene);
      // Parts are grouped by name prefix onto pivots (src/render/pipRig.ts).
      this.rig=new PipRig(gltf.scene);this.hand=this.rig.hand;},undefined,()=>{document.body.dataset.assetFallback='true';});
  }
  /** HUD, title, jobs, pause and result screens live in src/ui (see mockups/ui/UI.md). */
  setupUI(){setupGameUI(this);}
  setupInput(){
    addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
      // At a bench the station takes the keys; E or Esc steps back.
      if(this.atBench&&this.running&&!this.paused&&!this.won){if(e.repeat)return;if(e.code==='KeyE'||e.code==='Escape'){this.leaveBench();return;}if(this.station!.key(e.code)){e.preventDefault();return;}}
      this.keys.add(e.code);if(e.repeat)return;
      if(e.code==='KeyE')this.action('grab');if(e.code==='KeyF')this.action('cable');if(e.code==='KeyQ')this.action('throw');if(e.code==='Space')this.action('jump');const playing=this.running&&!this.won;if(e.code==='Tab'&&playing&&!this.paused){e.preventDefault();this.action('survey');}if(e.code==='Escape')this.action('pause');if(e.code==='KeyR'&&playing)this.action('restart');});
    addEventListener('keyup',e=>this.keys.delete(e.code));
    addEventListener('blur',()=>{this.keys.clear();if(this.running&&!this.won&&!this.paused)this.togglePause();});
    const canvas=this.view.renderer.domElement;
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    const benchPointer=(kind:'down'|'move'|'up',e:PointerEvent)=>{const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),this.view.camera);this.station!.pointer({kind,ray,button:e.button});};
    canvas.addEventListener('pointerdown',e=>{this.audio.start();if(this.atBench&&e.button===0&&this.running&&!this.paused&&!this.won){benchPointer('down',e);return;}if(e.button===2){this.orbit=true;this.pointerX=e.clientX;this.pointerY=e.clientY;canvas.setPointerCapture(e.pointerId);}else if(e.button===0&&this.running)this.action('grab');});
    canvas.addEventListener('pointerup',e=>{this.orbit=false;if(this.atBench&&e.button===0)benchPointer('up',e);});
    canvas.addEventListener('pointermove',e=>{if(this.atBench&&!this.orbit)benchPointer('move',e);if(this.orbit){this.yaw-=(e.clientX-this.pointerX)*.006;this.pitch=T.MathUtils.clamp(this.pitch+(e.clientY-this.pointerY)*.004,-.3,.45);this.pointerX=e.clientX;this.pointerY=e.clientY;}});
    canvas.addEventListener('wheel',e=>{if(this.atBench)return;this.survey=false;this.zoom=T.MathUtils.clamp(this.zoom+e.deltaY*.014,9,38);},{passive:true});
  }
  action(action:string){
    if(action==='restart'){location.reload();return;}if(action==='sound'){this.audio.muted=!this.audio.muted;return;}if(action==='pause'){this.togglePause();return;}if(action==='survey'){this.survey=!this.survey;return;}if(action==='camera'){this.survey=false;this.pitch=0;this.zoom=this.homeZoom();this.yaw=.14;return;}
    if(!this.running||this.paused||this.won)return;
    if(action==='throw'&&this.lunch?.held){this.lunch.release();return;}
    if(action==='jump'&&this.grounded&&(!this.held||prefabs[this.held.spec.kind].mass<15)){this.vertical=7;this.grounded=false;this.squash=-.6;this.audio.tone(310,.1,.025);this.audio.noise(.06,.03,1200);}
    if(action==='grab'||action==='cable')this.interact(action==='cable');
    if(action==='throw'){if(this.holdingPlug)this.releasePlug();else if(this.held){const p=this.held;this.held=undefined;p.body.applyImpulse({x:Math.sin(this.heading)*prefabs[p.spec.kind].mass*8,y:prefabs[p.spec.kind].mass*5,z:Math.cos(this.heading)*prefabs[p.spec.kind].mass*8},true);this.audio.tone(240,.1,.06,'triangle');}}
  }
  begin(){if(this.running)return;const ui=gameUI(this);if(ui?.beforeBegin())return;this.running=true;this.survey=false;this.audio.start();ui?.started();}
  /** Gamepad buttons are read every frame so Start/A also work on the intro card and while paused. */
  pollPad(){const pad=navigator.getGamepads?.()[0];if(!pad)return;
    pad.buttons.forEach((b,i)=>{const pressed=b.pressed&&!this.padHeld[i];this.padHeld[i]=b.pressed;if(!pressed)return;
      if(!this.running){if(i===0||i===9)this.begin();return;}if(this.won){if(i===0)location.reload();return;}
      const action=({0:'jump',2:'grab',1:'cable',3:'throw',9:'pause',8:'camera',10:'survey'} as Record<number,string>)[i];if(action&&(!this.paused||action==='pause'))this.action(action);});}
  togglePause(){if(!this.running||this.won)return;this.paused=!this.paused;gameUI(this)?.paused(this.paused);this.audio.strain(0);}
  nearest(){const pos=this.player.translation();return this.props.filter(p=>p.mesh.visible&&(!this.lunch||this.lunch.canGrab(p.body.translation()))&&distance(pos,p.body.translation())<1.65&&Math.abs(pos.y-p.body.translation().y)<1.8).sort((a,b)=>this.reach(pos,a)-this.reach(pos,b))[0];}
  /** Job items (anything with an id) in reach always win over clutter that got pushed along. */
  reach(pos:Point,p:Prop){return distance(pos,p.body.translation())-(p.spec.id?2:0);}
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
    if(this.holdingPlug){if(Math.min(distance(pos,this.level.target)-.6,distance(this.plugPosition,this.level.target))<1.6&&this.rope.strain<1.12){this.connected=true;this.holdingPlug=false;this.plugPosition.set(this.level.target.x,.28,this.level.target.z);this.circuit.leads[0].closed=true;this.audio.plug();this.plugFlash(this.plugPosition);}else this.releasePlug();return;}
    if(this.held){const p=this.held;
      if(p.spec.id==='extension'&&distance(pos,this.plugPosition)<2&&this.coupler){this.extension=true;this.rope.maxLength=this.level.length+14;this.consume(p);this.audio.cheer();}
      else if(p.spec.id==='coupler'&&distance(pos,this.plugPosition)<2){this.coupler=true;this.consume(p);this.audio.plug();}
      p.body.setLinvel({x:0,y:0,z:0},true);p.body.setAngvel({x:0,y:0,z:0},true);
      this.lunch?.dropped(p);this.station?.dropped?.(p);
      if(p.spec.id==='strip'&&distance(pos,this.level.target)<2.6){const t=this.level.target;p.body.setTranslation({x:t.x,y:.08,z:t.z+.3},true);p.body.setRotation(new T.Quaternion(),true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);this.audio.plug();this.burst({x:t.x,y:.2,z:t.z+.3},'#8ff3ea',1,'ring');}
      this.held=undefined;return;
    }
    // Machine switch: once powered, the lamp/projector still needs switching on (E).
    if(!cableOnly&&!this.held&&this.nearSwitch(pos)){this.switchedOn=!this.switchedOn;this.audio.noise(.03,.07,2500,'highpass');this.audio.tone(this.switchedOn?420:200,.09,.04);const s=this.level.switchAt!;this.burst({x:s.x,y:1,z:s.z},'#fff3a3',6,'spark');return;}
    const nearest=cableOnly?undefined:this.nearest();
    if(!this.lunch&&!this.station&&!this.hub&&distance(pos,this.plugPosition)<1.75&&!(nearest&&this.reach(pos,nearest)<distance(pos,this.plugPosition))){if(this.connected){this.connected=false;this.circuit.leads[0].closed=false;}this.holdingPlug=true;this.audio.pop();return;}
    if(cableOnly){this.shrug();return;}
    if(nearest){
      if(nearest.spec.id==='coffee-reel'&&!this.coffeeReused){this.coffeeReused=true;this.rope.reset({x:-14,z:5},Math.max(30,this.rope.maxLength));this.plugPosition.set(-13,.3,4.5);this.holdingPlug=true;this.consume(nearest);this.audio.tone(100,.6,.06,'triangle');
        // The coffee bar goes dark: nearby coworkers groan.
        this.alarm({x:-13,z:4.5},4.5);for(let i=0;i<3;i++)setTimeout(()=>this.audio.voice('groan',.8+i*.15),150+i*280);return;}
      // A jammed doorstop only comes loose when deliberately picked up.
      if(nearest.spec.id==='wedge'||nearest.spec.id==='strip')nearest.body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
      this.held=nearest;this.audio.pop();
    }else this.shrug();
  }
  /** Nothing in reach: a little puff and a questioning chirp instead of silence. */
  shrug(){const p=this.player.translation();this.burst({x:p.x+Math.sin(this.heading)*.6,y:.2,z:p.z+Math.cos(this.heading)*.6},'#efe8d8',4,'dust');this.audio.voice('hm',1.5);this.squash=.25;}
  attachNear(pos:Point){
    const part=this.props.filter(q=>q.mesh.visible&&((q.spec.id==='coupler'&&!this.coupler)||(q.spec.id==='extension'&&!this.extension))&&distance(pos,q.body.translation())<1.9).sort((a,b)=>Number(b.spec.id==='coupler')-Number(a.spec.id==='coupler'))[0];if(!part)return false;
    const at=part.body.translation();
    if(part.spec.id==='coupler'){this.coupler=true;this.consume(part);this.audio.plug();this.burst(at,'#fff3a3',12,'spark');}
    else if(this.coupler){this.extension=true;this.rope.maxLength=this.level.length+14;this.consume(part);this.audio.plug();this.audio.jingle();this.burst(at,'#ffcf52',30,'confetti');}
    // Wrong order: the reel needs the coupler first, so it wobbles and buzzes.
    else{this.audio.tone(110,.22,.07,'square');part.body.applyImpulse({x:0,y:prefabs[part.spec.kind].mass*2.5,z:0},true);part.body.applyTorqueImpulse({x:0,y:0,z:.4},true);}
    return true;
  }
  nearBench(pos:Point){return !!this.station&&distance(pos,this.station.stand)<1.6;}
  enterBench(){if(!this.station)return;this.atBench=true;document.body.dataset.bench='true';this.survey=false;this.station.setActive(true);this.audio.pop();this.keys.clear();this.stick=undefined;}
  leaveBench(){if(!this.station)return;this.atBench=false;delete document.body.dataset.bench;this.station.setActive(false);this.audio.tone(260,.08,.03,'triangle');}
  nearSwitch(pos:Point){return !this.lunch&&!this.holdingPlug&&!!this.level.switchAt&&distance(pos,this.level.switchAt)<1.9;}
  /** The power strip must sit by the boardroom door before the reel can feed the projector. */
  needsStrip(){return this.props.some(q=>q.spec.id==='strip');}
  stripPlaced(){const q=this.props.find(q=>q.spec.id==='strip');return !q||(q!==this.held&&distance(q.body.translation(),this.level.target)<1.4&&q.body.translation().y<.6);}
  /** Plug-in beat: a short hit-stop, a star flash, sparks and a floor shockwave. */
  plugFlash(at:{x:number;y:number;z:number}){this.hitstop=.09;this.burst(at,'#fff3a3',16,'spark');this.burst({x:at.x,y:at.y+.35,z:at.z},'#fff3c8',1,'flash');this.burst({x:at.x,y:.05,z:at.z},'#8ff3ea',1,'ring');this.burst(at,'#ffe36e',5,'star');this.shake=Math.max(this.shake,.12);}
  consume(p:Prop){p.mesh.visible=false;p.body.setEnabled(false);}
  slingshot(energy:number){
    this.shake=Math.min(.5,energy*.006);this.audio.tone(90,.3,.12,'sawtooth');this.audio.noise(.2,.08,1400);this.alarm(this.plugPosition,6);
    for(const p of this.props){const pos=p.body.translation();if(this.ropePoints.slice(1).some((b,i)=>segmentDistance(pos,this.ropePoints[i],b)<1.1)){this.flung=true;const v=new T.Vector3(pos.x-this.rope.anchor.x,0,pos.z-this.rope.anchor.z).normalize();const impulse=Math.min(energy*.22,45)*Math.min(1,prefabs[p.spec.kind].mass/4+.25);p.body.applyImpulse({x:v.x*impulse,y:impulse*.65,z:v.z*impulse},true);}}
  }
  releasePlug(){
    const energy=this.rope.release();this.holdingPlug=false;
    if(energy>1){this.slingshot(energy);
      const last=this.rope.bends.at(-1)??this.rope.anchor;this.plugPosition.x=T.MathUtils.lerp(this.plugPosition.x,last.x,.15);this.plugPosition.z=T.MathUtils.lerp(this.plugPosition.z,last.z,.15);this.burst(this.plugPosition,'#ffdf94',12);
    }else this.audio.thud(.5);
    this.plugPosition.y=.22;
  }
  simulateCable(){
    if(this.holdingPlug){const pos=this.player.translation();this.plugPosition.set(pos.x+Math.sin(this.heading)*.65,pos.y+.05,pos.z+Math.cos(this.heading)*.65);}
    const beforeBends=[...this.rope.bends],before=beforeBends.length,overBefore=this.rope.length-this.rope.maxLength;
    // Dynamic furniture contributes corners only near the current rope path.
    // This bounds the visibility graph in a dense room while retaining local wraps.
    const route=this.ropePoints.length>1?this.ropePoints:[this.rope.anchor,this.plugPosition];
    // Props the rope is wrapped on always stay in; the rest are the nearest twenty.
    const near=this.props.filter(p=>p.mesh.visible&&p!==this.held&&prefabs[p.spec.kind].mass>=3&&p.body.translation().y<1.8).map(p=>({p,d:Math.min(...route.slice(1).map((b,i)=>segmentDistance(p.body.translation(),route[i],b)))})).filter(v=>v.d<1.2||this.wrapped.has(v.p));
    near.sort((a,b)=>Number(this.wrapped.has(b.p))-Number(this.wrapped.has(a.p))||a.d-b.d);const chosen=near.slice(0,20).map(v=>v.p);
    const furniture=chosen.map(p=>{
      const pos=p.body.translation(),[w,,d]=prefabs[p.spec.kind].size,rotation=new T.Matrix4().makeRotationFromQuaternion(p.mesh.quaternion).elements;
      const hx=Math.abs(rotation[0])*w/2+Math.abs(rotation[8])*d/2+.05,hz=Math.abs(rotation[2])*w/2+Math.abs(rotation[10])*d/2+.05;
      return {id:`prop-${p.body.handle}`,minX:pos.x-hx,maxX:pos.x+hx,minZ:pos.z-hz,maxZ:pos.z+hz,prop:p};
    }).filter(o=>!(this.plugPosition.x>o.minX&&this.plugPosition.x<o.maxX&&this.plugPosition.z>o.minZ&&this.plugPosition.z<o.maxZ)&&!(this.rope.anchor.x>o.minX&&this.rope.anchor.x<o.maxX&&this.rope.anchor.z>o.minZ&&this.rope.anchor.z<o.maxZ));
    const obstacles=[...this.obstacles,...furniture];this.ropePoints=this.rope.update(this.plugPosition,obstacles);
    const isCorner=(o:Obstacle,b:Point)=>(Math.abs(b.x-o.minX+CORNER)<.05||Math.abs(b.x-o.maxX-CORNER)<.05)&&(Math.abs(b.z-o.minZ+CORNER)<.05||Math.abs(b.z-o.maxZ-CORNER)<.05);
    this.wrapped=new Set(furniture.filter(o=>this.rope.bends.some(b=>isCorner(o,b))).map(o=>o.prop));
    const swungClear=beforeBends.filter(b=>!this.rope.bends.some(a=>distance(a,b)<.01)).some(b=>obstacles.some(o=>isCorner(o,b)));
    if(this.running&&this.rope.bends.length!==before)this.audio.knock(this.rope.bends.length>before?1:1.5);
    // A taut rope whipping off a corner slingshots whatever lies along it.
    if(this.running&&this.holdingPlug&&swungClear&&this.rope.bends.length<before&&overBefore>.3)this.slingshot(overBefore**2*60*.6);
  }
  /** Where a held plug is drawn: Pip's right glove (gameplay keeps using plugPosition). */
  handPosition(){return this.rig?this.hand.getWorldPosition(new T.Vector3()):this.plugPosition.clone();}
  drawCable(){
    const end=this.holdingPlug?this.handPosition():this.plugPosition.clone();this.plug.position.copy(end);
    const strain=this.holdingPlug?this.rope.strain:.3,points=cablePath(this.ropePoints,end,.5,strain);
    // Near its limit the cable buzzes: it jitters, sparks and twangs at the corner it is biting,
    // and coworkers along it flinch.
    const bite=this.rope.bends.at(-1),frantic=this.holdingPlug&&this.rope.strain>.97;
    if(frantic)for(let i=1;i<points.length-1;i++){points[i].x+=(Math.random()-.5)*.04;points[i].z+=(Math.random()-.5)*.04;}
    this.twang.visible=frantic&&!!bite;if(frantic&&bite){this.twang.position.set(bite.x,.25,bite.z);this.twang.rotation.y=this.last*.02;this.twang.scale.setScalar(1+Math.sin(this.last*.05)*.15);
      if(Math.random()<.12)this.burst({x:bite.x,y:.2,z:bite.z},'#fff3a3',3,'spark');}
    if(this.holdingPlug&&this.rope.strain>.9&&Math.floor(this.last/700)!==Math.floor((this.last-16)/700))for(let i=1;i<this.ropePoints.length;i++){const a=this.ropePoints[i-1],b=this.ropePoints[i];this.alarm({x:(a.x+b.x)/2,z:(a.z+b.z)/2},2.2);}
    // The hero cable: strain builds from the reel toward Pip's hand; gold once it is plugged in,
    // with current pulses flowing to the load.
    if(points.length>1){const hose=hoseGeometry(points,{radius:.1,strain:u=>strain*(.6+.4*u),tint:this.connected?GOLD:undefined});this.ropeMesh.geometry.dispose();this.ropeMesh.geometry=hose.geo;
      this.pulses.update(hose.curve,hose.length,this.last/1000,this.circuit.loads[0].state==='on');}
    this.audio.strain(this.holdingPlug&&!this.paused&&!this.won?this.rope.strain:0);
  }
  burst(pos:{x:number;y:number;z:number},color:string,count:number,kind:Fx='debris'){this.fx.spawn(kind,pos,count,color);}
  step(dt:number){
    this.time+=dt;const p=this.player.translation();
    let x=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'));
    let z=Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'));
    if(this.stick){x+=this.stick.x;z+=this.stick.z;}
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
    this.player.setNextKinematicTranslation({x:T.MathUtils.clamp(p.x+delta.x,-this.level.width/2+.5,this.level.width/2-.5),y:p.y+delta.y,z:T.MathUtils.clamp(p.z+delta.z,-this.level.depth/2+.5,this.level.depth/2-.5)});
    // Light things are carried at chest height; heavy furniture is pushed along the floor so it stays upright.
    if(this.held){const b=this.held.body,pos=b.translation(),kind=prefabs[this.held.spec.kind],heavy=kind.mass>=15,ahead=heavy?.5+Math.max(kind.size[0],kind.size[2])/2:1.05,target={x:p.x+Math.sin(this.heading)*ahead,y:heavy?kind.size[1]/2+.03:p.y+.55,z:p.z+Math.cos(this.heading)*ahead};b.setLinvel({x:(target.x-pos.x)*12,y:(target.y-pos.y)*12,z:(target.z-pos.z)*12},true);b.setAngvel({x:0,y:0,z:0},true);}
    this.world.timestep=dt;this.world.step();
    if(this.holdingPlug&&this.rope.strain>.88)for(const prop of this.props){const pos=prop.body.translation();if(prefabs[prop.spec.kind].mass<=15&&this.ropePoints.slice(1).some((b,i)=>segmentDistance(pos,this.ropePoints[i],b)<.65)){const v=new T.Vector3(p.x-pos.x,0,p.z-pos.z).normalize().multiplyScalar(dt*12*(this.rope.strain-.8));prop.body.applyImpulse({x:v.x,y:.015,z:v.z},true);}}
    for(const prop of this.props){if(!prop.body.isEnabled())continue;const pos=prop.body.translation(),v=prop.body.linvel(),speed=Math.hypot(v.x,v.y,v.z);
      if(this.time>2&&!prop.damaged&&prop!==this.held&&prop.lastSpeed>5.5&&prop.lastSpeed-speed>3.5){prop.damaged=true;this.alarm(pos);this.damage++;this.cost+=prefabs[prop.spec.kind].cost;if(prop.spec.kind==='glass')this.audio.glass();else if(prefabs[prop.spec.kind].mass<1)this.audio.clatter();else this.audio.thud(prefabs[prop.spec.kind].mass);this.burst(pos,'#e1d4b7',3);this.burst(pos,'#e9e4d6',3,'dust');if(prop.spec.kind==='glass'){this.consume(prop);this.burst(new T.Vector3(pos.x,pos.y,pos.z),'#a0dbdf',14);}}
      prop.lastSpeed=speed;
      // Paper sheets flutter: heavy air drag plus a wobble while airborne.
      if(prop.spec.kind==='paper'&&pos.y>.15&&speed>.3){prop.body.applyImpulse({x:-v.x*.004,y:-v.y*.0045+.0002,z:-v.z*.004},true);const w=this.time*23+prop.body.handle;prop.body.applyTorqueImpulse({x:Math.sin(w)*.00002,y:Math.sin(w*1.7)*.00002,z:Math.cos(w*1.3)*.00002},true);}
      if(pos.y< -3||Math.abs(pos.x)>this.level.width/2+1||Math.abs(pos.z)>this.level.depth/2+1){prop.body.setTranslation(prop.home,true);prop.body.setLinvel({x:0,y:0,z:0},true);}
    }
    // Required items stranded out of reach (on top of tall furniture) go back home.
    if(Math.floor(this.time)!==Math.floor(this.time-dt))for(const prop of this.props){if(!prop.spec.id||prop===this.held||!prop.body.isEnabled()||!prop.body.isDynamic())continue;const q=prop.body.translation();const n=q.y>2.1?(this.stuck.get(prop)??0)+1:0;this.stuck.set(prop,n);if(n>=4){prop.body.setTranslation(prop.home,true);prop.body.setLinvel({x:0,y:0,z:0},true);this.burst(prop.home,'#fffaf0',6,'dust');this.stuck.set(prop,0);}}
    if(p.y< -3){this.player.setTranslation({x:this.level.spawn.x,y:1,z:this.level.spawn.z},true);this.vertical=0;}
    // Past the deadline the meeting waits impatiently; running late only costs time grade.
    if(this.level.deadline&&this.time>this.level.deadline&&Math.floor(this.time/3)!==Math.floor((this.time-dt)/3))this.alarm(this.level.target,6);
    if(this.lunch)this.lunch.step(dt);else if(this.station){this.station.update(dt);if(this.station.complete()&&!this.won)this.win();}else if(this.hub)this.hub.update(dt);else{this.simulateCable();this.circuit.leads[0].closed=this.connected&&this.stripPlaced();this.circuit.loads[0].enabled=!this.level.switchAt||this.switchedOn;this.circuit.tick(dt);if(this.circuit.loads[0].state==='on'&&!this.won)this.win();}
  }
  win(){this.won=true;this.winAt=performance.now();this.survey=false;this.audio.cheer();this.audio.strain(0);if(this.lightUp)this.lightUp();else if(this.screen){(this.screen.material as T.MeshToonMaterial)=toon('#f9df88',{emissive:'#ffd76a',ei:.5});}if(this.beam)this.beam.visible=true;
    this.burst({x:this.level.target.x,y:2,z:this.level.target.z},'#ffcf52',90,'confetti');const pp=this.player.translation();this.burst({x:pp.x,y:2,z:pp.z},'#ffcf52',40,'confetti');
    // Station jobs add their mistakes and process cost to the result card and grade on their own limits.
    if(this.station){if(this.atBench)this.leaveBench();const s=this.station.score();this.damage+=s.mistakes;this.cost+=s.cost;}
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
    const zoom=this.survey?44:this.zoom,near=T.MathUtils.clamp((36.5-zoom)/26.5,0,1),follow=cam.aspect<1?1:T.MathUtils.clamp(.25+near*.9,.25,1);
    const room=new T.Vector3(.2,0,1),pip=new T.Vector3(p.x,p.y-.77+.7*near,p.z).add(this.lead.clone().multiplyScalar(near));
    let target=room.lerp(pip,this.survey?0:follow),distanceTo=zoom,pitch=T.MathUtils.clamp(.68-.24*near+this.pitch,.3,1.25);
    const pushing=this.won&&this.winAt>0;
    if(this.atBench&&this.station){const st=this.station,v=st.view;target=st.table.clone().add(new T.Vector3(0,v.lookY,0)).addScaledVector(new T.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw)),v.lookX??0);
      // Portrait screens are narrow: pull back so the width of the table still fits.
      distanceTo=v.distance*T.MathUtils.clamp(1.25/cam.aspect,1,2.1);pitch=v.pitch;const want=Math.atan2(st.stand.x-st.table.x,st.stand.z-st.table.z);this.yaw+=Math.atan2(Math.sin(want-this.yaw),Math.cos(want-this.yaw))*(this.manual?1:Math.min(1,dt*4));}
    if(pushing){const f=this.winFocus(),right=new T.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));target=f.clone().addScaledVector(right,2.2);distanceTo=this.station?7:this.level.id==='meeting'?8:9;pitch=this.station?.5:this.level.id==='meeting'?.32:.6;}
    // Title: a hero shot of Pip beside the logo (Pip sits in the right half of the frame).
    const titling=!this.running&&document.body.dataset.screen==='title';
    if(titling){const right=new T.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));const portrait=cam.aspect<1;target=new T.Vector3(p.x,p.y+(portrait?1.5:.3),p.z).addScaledVector(right,portrait?0:-2.6);distanceTo=portrait?10.5:8;pitch=.32;}
    // Tests (?manual) snap straight onto a bench so pointer positions are deterministic.
    const snap=this.manual&&this.atBench;
    this.focus.lerp(target,snap?1:this.survey||pushing?ease*.6:titling?1:this.atBench?ease*.8:ease);
    const offset=new T.Vector3(Math.sin(this.yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(this.yaw)*Math.cos(pitch)).multiplyScalar(distanceTo);
    const wanted=this.focus.clone().add(offset);wanted.x+=(Math.random()-.5)*this.shake;wanted.y+=(Math.random()-.5)*this.shake;
    cam.position.lerp(wanted,snap?1:1-Math.exp(-dt*(pushing?2.5:6)));cam.lookAt(this.focus);this.shake*=.9;
    // Cutaway: shell walls whose outside faces the camera drop to 0.9 m stubs.
    for(const wall of this.shellWalls){const at=wall.group.parent!.getWorldPosition(new T.Vector3()),toCam=new T.Vector3(cam.position.x-at.x,0,cam.position.z-at.z).normalize();const stub=wall.normal.dot(toCam)>.2;
      wall.group.scale.y=T.MathUtils.lerp(wall.group.scale.y,stub?.01:1,.15);wall.group.visible=wall.group.scale.y>.03;}
    const start=cam.position,end=new T.Vector3(p.x,p.y+.4,p.z),ray=new T.Raycaster(start,end.clone().sub(start).normalize(),0,start.distanceTo(end));const hit=new Set(ray.intersectObjects(this.occluders).map(h=>h.object));
    for(const mesh of this.occluders){const material=mesh.material as T.MeshToonMaterial;material.opacity=T.MathUtils.lerp(material.opacity,hit.has(mesh)?.15:1,.15);material.depthWrite=material.opacity>.8;}
  }
  /** Steps rendering quality down when frames stay slow (AO first, then bloom and resolution),
   *  and remembers the result for next time. */
  adaptQuality(dt:number){
    if(this.manual||!this.running||this.paused)return;this.slowAvg+=(dt-this.slowAvg)*.05;this.qualityTimer+=dt;
    const q=this.view.getQuality();if(this.qualityTimer<3||q===0||this.slowAvg<1/45)return;
    this.qualityTimer=0;this.slowAvg=1/60;const next=(q-1) as 0|1;this.view.setQuality(next);try{localStorage.setItem('circuit-crew-quality',String(next));}catch{/* storage unavailable */}
  }
  homeZoom(){return this.level.id==='playground'?18:this.station?20:this.hub?28:26;}
  winFocus(){const l=this.level;if(this.station)return this.station.table.clone().add(new T.Vector3(0,.5,0));return l.id==='lunch'?new T.Vector3(12,2.2,-7):l.id==='meeting'?new T.Vector3(12.2,1.7,-8.6):new T.Vector3(l.target.x,1.5,l.target.z);}

  /** Procedural walk cycle: legs and arms swing with ground speed; arms reach forward to carry or hold a plug. */
  /** Feeds Pip's rig (src/render/pipRig.ts) with movement, poses and what to glance at. */
  animateRig(dt:number){
    if(!this.rig)return;const p=this.player.translation(),speed=dt>0?Math.min(9,Math.hypot(p.x-this.lastPos.x,p.z-this.lastPos.z)/dt):0;this.lastPos.set(p.x,p.y,p.z);
    const lastStride=this.stride;this.stride+=dt*speed*2.2;if(this.grounded&&speed>1&&Math.floor(lastStride/Math.PI)!==Math.floor(this.stride/Math.PI))this.audio.step();
    const turn=dt>0?Math.atan2(Math.sin(this.heading-this.lastHeading),Math.cos(this.heading-this.lastHeading))/dt:0;this.lastHeading=this.heading;
    const titling=!this.running&&document.body.dataset.screen==='title';
    if(this.won||titling)this.heading+=Math.atan2(Math.sin(this.yaw-this.heading),Math.cos(this.yaw-this.heading))*Math.min(1,dt*6);
    const held=this.held?prefabs[this.held.spec.kind].mass>=15?'heavy':'light':'none',lunchHeld=this.lunch?.held;
    const near=this.running&&!this.won&&!this.held&&!this.holdingPlug?this.nearest():undefined;
    this.rig.update({dt,time:this.last/1000,speed,grounded:this.grounded,rising:this.vertical>0,airborne:this.airborne,turnRate:turn,carrying:held,holdingPlug:this.holdingPlug,
      strain:lunchHeld?lunchHeld.cable.rope.strain:this.rope.strain,won:this.won,waving:titling,lookAt:near?new T.Vector3().copy(near.body.translation()):undefined});
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
    for(const npc of this.npcs){const g=npc.group,d=distance(p,g.position),near=d<2;npc.alarm=Math.max(0,npc.alarm-dt);
      const watch=d<4||npc.alarm>0||this.won,yaw=watch?Math.atan2(p.x-g.position.x,p.z-g.position.z):npc.restYaw;
      g.rotation.y+=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y))*Math.min(1,dt*5);
      const cheer=this.won?Math.abs(Math.sin(clock*9+npc.seed)):0,duck=npc.alarm>0?.72:near?.88:1,breathe=Math.sin(clock*1.3*Math.PI*2+npc.seed)*.025;
      const typing=npc.seated&&!watch?Math.abs(Math.sin(clock*16+npc.seed*3))*.03*(Math.sin(clock*.7+npc.seed)>-.3?1:0):0;
      if(npc.seated&&!watch)g.rotation.y=npc.restYaw+Math.sin(clock*.45+npc.seed*2)*Math.max(0,Math.sin(clock*.23+npc.seed))*.6;
      npc.body.scale.set(2-duck-breathe,duck+breathe,2-duck-breathe);npc.body.position.y=npc.baseY+cheer*.35+typing;npc.body.rotation.z=npc.alarm>0?Math.sin(npc.alarm*20)*.12:0;
      const shown=npc.alarm>0&&!this.won,age=1-npc.alarm;npc.bubble.visible=shown;npc.sweat.visible=shown;npc.calm.visible=!shown;npc.startled.visible=shown;if(shown){const s=age<.12?age/.12*1.3:age<.25?1.3-(age-.12)/.13*.3:1;npc.bubble.scale.setScalar(.7*s);}}
    if(this.lunch)this.lunch.render(dt);else if(!this.station&&!this.hub)this.drawCable();this.target.scale.setScalar(1+Math.sin(this.time*3)*.12);
    // The reticle marks what E would grab (or the part a held plug would attach to); hidden when nothing is in reach.
    const nearest=this.nearest(),attach=this.holdingPlug?this.props.find(q=>q.mesh.visible&&((q.spec.id==='coupler'&&!this.coupler)||(q.spec.id==='extension'&&!this.extension))&&distance(p,q.body.translation())<1.9):undefined;
    const plugFirst=!this.lunch&&!this.station&&!this.hub&&!this.holdingPlug&&distance(p,this.plugPosition)<1.75&&!(nearest&&this.reach(p,nearest)<distance(p,this.plugPosition));
    const mark=attach?.mesh.position??(plugFirst?this.plugPosition:!this.holdingPlug&&!this.held?nearest?.mesh.position:undefined);
    this.reticle.visible=this.running&&!this.won&&!this.atBench&&!!mark;if(mark){this.reticle.position.set(mark.x,.03,mark.z);this.reticle.scale.setScalar(1+Math.sin(this.last*.008)*.1);}
    this.pipRing.position.set(p.x,.03,p.z);
    this.fx.update(dt);
    // The meeting clock reads 9:55 and its red minute hand sweeps the four minutes to the meeting.
    if(this.clock){const late=this.level.deadline!==undefined&&this.time>this.level.deadline;this.clock.hand.rotation.z=-(9+55/60)/12*Math.PI*2-this.time/3600/12*Math.PI*2;this.clock.minute.rotation.z=-(55/60)*Math.PI*2-Math.min(this.time,this.level.deadline??240)/60/60*Math.PI*2;this.clock.face.material=toon(late&&Math.floor(this.last/300)%2?'#ff7a6b':'#fbf5ea');}
    // Title: the reel's plug spits a spark every couple of seconds.
    if(!this.station&&!this.hub&&!this.running&&document.body.dataset.screen==='title'&&Math.floor(this.last/1900)!==Math.floor((this.last-dt*1000)/1900)){this.burst(this.plugPosition,'#fff3a3',10,'spark');this.burst(this.plugPosition,'#ffe36e',2,'star');this.audio.noise(.04,.03,3200,'highpass');}
    // Steam from the coffee machine until its extension is borrowed.
    const coffee=this.level.id==='meeting'&&!this.coffeeReused?this.props.find(q=>q.spec.id==='coffee'):undefined;if(coffee&&Math.floor(this.last/450)!==Math.floor((this.last-dt*1000)/450)){const c=coffee.body.translation();this.burst({x:c.x,y:c.y+.5,z:c.z},'#fffaf0',1,'smoke');}
    // After a while a dotted ghost line traces the clean way round walls and pillars to the socket.
    if(this.time>35&&!this.connected&&!this.lunch&&!this.station&&!this.hub&&!this.won){this.hint.visible=true;const path=detour({x:p.x,z:p.z},this.level.target,this.obstacles),total=path.slice(1).reduce((n,b,k)=>n+distance(path[k],b),0),shift=(this.last*.0012)%.6;
      this.hint.children.forEach((d,k)=>{let along=k*.6+shift;d.visible=along<total&&along>.8;for(let q=1;q<path.length&&d.visible;q++){const len=distance(path[q-1],path[q]);if(along<=len){d.position.set(T.MathUtils.lerp(path[q-1].x,path[q].x,along/len),.1,T.MathUtils.lerp(path[q-1].z,path[q].z,along/len));break;}along-=len;}});}
    else this.hint.visible=false;
    gameUI(this)?.update();
    // Count every pass of the frame (composer + outlines) for snapshot().drawCalls.
    this.view.renderer.info.autoReset=false;this.view.renderer.info.reset();
    this.updateCamera(dt);const d0=performance.now();this.view.render();this.profile.draw+=(performance.now()-d0-this.profile.draw)*.05;
  }
  frame(t:number){requestAnimationFrame(n=>this.frame(n));const dt=Math.min((t-this.last)/1000||1/60,.1);this.last=t;this.pollPad();
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
    return {advance,walkTo,act};
  }
  snapshot(){return {level:this.level.id,running:this.running,paused:this.paused,won:this.won,player:{...this.player.translation()},props:this.props.length,items:this.props.filter(p=>p.spec.id).map(p=>({id:p.spec.id,pos:{...p.body.translation()},visible:p.mesh.visible})),holdingPlug:this.holdingPlug,held:this.held?.spec.id??this.held?.spec.kind,rope:{length:this.rope.length,maxLength:this.rope.maxLength,bends:this.rope.bends,strain:this.rope.strain},time:this.time,damage:this.damage,cost:this.cost,fps:this.fps,drawCalls:this.view.renderer.info.render.calls,electrical:this.circuit.loads[0].state,lunch:this.lunch?.snapshot(),station:this.station?.snapshot(),hub:this.hub?.snapshot(),atBench:this.atBench,alarmed:this.npcs.filter(n=>n.alarm>0).length,stripPlaced:this.stripPlaced(),switchedOn:this.switchedOn,pose:this.rig?{arms:this.rig.arms.map(a=>+a.rotation.x.toFixed(2)),legs:this.rig.legs.map(l=>+l.rotation.x.toFixed(2)),torso:+this.rig.torso.rotation.x.toFixed(2),grounded:this.grounded,airborne:+this.airborne.toFixed(2)}:null,profile:this.profile,fastestProp:Math.max(0,...this.props.map(q=>{const v=q.body.linvel();return Math.hypot(v.x,v.y,v.z);}))};}
}
