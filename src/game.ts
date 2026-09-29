import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createRenderer,toon} from './render/toon';
import {INK,BLOBC,part,capsule,sphere,bangTexture} from './render/kit';
import {Sound} from './render/audio';
import {icon} from './render/icons';
import {makeProp,prefabs,type PropSpec} from './props/prefabs';
import {Rope,distance,segmentDistance,strainColor,type Point,type Obstacle} from './sim/cable';
import {Circuit} from './sim/electrical';
import {grade} from './sim/grade';
import type {Level} from './levels/types';
import {LunchRuntime} from './lunch-runtime';
import {Particles,type Fx} from './render/particles';
import {decorate} from './levels/decor';
import {levels} from './levels';

export interface Prop {spec:PropSpec;body:RAPIER.RigidBody;collider:RAPIER.Collider;mesh:T.Group;damaged:boolean;home:T.Vector3;lastSpeed:number}
interface Npc {group:T.Group;body:T.Group;bubble:T.Sprite;alarm:number;seed:number}
interface Batch {mesh:T.InstancedMesh;parts:{prop:Prop;part:T.Mesh}[]}
export class Game {
  view=createRenderer(document.querySelector('canvas')!);
  world=new RAPIER.World({x:0,y:-18,z:0});
  props:Prop[]=[];obstacles:Obstacle[]=[];occluders:T.Mesh[]=[];npcs:Npc[]=[];fx:Particles;squash=0;airborne=0;
  player:RAPIER.RigidBody;playerCollider:RAPIER.Collider;controller:RAPIER.KinematicCharacterController;
  avatar=new T.Group();rope:Rope;ropePoints:Point[]=[];ropeMesh:T.Mesh;plug:T.Group;target:T.Mesh;screen?:T.Mesh;beam?:T.Object3D;
  circuit:Circuit;keys=new Set<string>();held?:Prop;holdingPlug=false;connected=false;extension=false;coupler=false;coffeeReused=false;
  running=false;paused=false;won=false;time=0;damage=0;cost=0;vertical=0;grounded=false;heading=0;shake=0;
  yaw=.12;pitch=.83;zoom=24;orbit=false;pointerX=0;pointerY=0;accumulator=0;last=0;frames=0;fps=60;frameWindow=0;
  audio=new Sound();hud=document.querySelector<HTMLDivElement>('#hud')!;root=new T.Group();plugPosition:T.Vector3;hint:T.Line;reticle:T.Mesh;
  batches:Batch[]=[];
  lunch?:LunchRuntime;
  // ?manual lets automated tests advance simulated time deterministically.
  manual=new URLSearchParams(location.search).has('manual');stick?:Point;
  constructor(public level:Level){
    const {scene}=this.view;scene.add(this.root);this.fx=new Particles(this.root);this.zoom=level.id==='playground'?26:38;
    this.rope=new Rope({...level.anchor},level.length);this.obstacles=[...level.obstacles];
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
    const anchor=makeProp('reel');anchor.position.set(level.anchor.x,.6,level.anchor.z);this.root.add(anchor);
    this.ropeMesh=new T.Mesh(new T.BufferGeometry(),toon('#f5f1dc').clone());this.ropeMesh.castShadow=true;this.root.add(this.ropeMesh);
    this.reticle=new T.Mesh(new T.TorusGeometry(.48,.035,6,24),new T.MeshBasicMaterial({color:'#fff0a5',depthTest:false}));this.reticle.rotation.x=-Math.PI/2;this.reticle.renderOrder=10;this.root.add(this.reticle);
    this.hint=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:'#76e1d3',dashSize:.2,gapSize:.35,transparent:true,opacity:.6}));this.hint.visible=false;this.root.add(this.hint);
    this.circuit=new Circuit([{id:'supply',limit:5,tripped:false}],[{id:'reel',from:'supply',to:'projector',rating:3,closed:false,heat:0,dead:false}],[{id:'projector',steady:1,enabled:true,state:'off',started:0}]);
    this.setupUI();this.setupInput();if(level.id==='lunch')this.lunch=new LunchRuntime(this);else{this.simulateCable();this.drawCable();}this.updateCamera(1);this.view.effect.render(this.view.scene,this.view.camera);
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
    this.box(l.width,.35,l.depth,0,-.2,0,'#6b7385');
    const decor=decorate(this);this.screen=decor.screen;this.beam=decor.beam;
  }
  addProp(spec:PropSpec){
    const p=prefabs[spec.kind],mesh=makeProp(spec.kind,spec.color),pos=new T.Vector3(spec.x,spec.y??p.size[1]/2+.025,spec.z);
    mesh.position.copy(pos);mesh.rotation.y=spec.rotation??0;this.root.add(mesh);
    const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x,pos.y,pos.z).setRotation(mesh.quaternion).setLinearDamping(.6).setAngularDamping(.8).setCanSleep(true).setCcdEnabled(p.mass<4));
    const collider=this.world.createCollider(RAPIER.ColliderDesc.cuboid(p.size[0]/2,p.size[1]/2,p.size[2]/2).setMass(p.mass).setFriction(.65).setRestitution(.12),body);
    this.props.push({spec,body,collider,mesh,damaged:false,home:pos.clone(),lastSpeed:0});
  }
  addNpc(p:Point){
    const g=new T.Group(),seated=this.level.id==='meeting',body=new T.Group();body.position.y=seated?.35:0;g.add(body);
    part(body,capsule(.33,.35),toon(BLOBC[this.npcs.length%BLOBC.length]),0,.55,0);
    for(const x of [-.1,.1]){part(body,sphere(.085,12,10),toon('#ffffff'),x,.78,.29);part(body,sphere(.042,10,8),toon(INK),x,.78,.36);}
    const bubble=new T.Sprite(new T.SpriteMaterial({map:bangTexture(),depthTest:false}));bubble.scale.set(.7,.7,1);bubble.position.y=(seated?.35:0)+1.55;bubble.renderOrder=9;bubble.visible=false;g.add(bubble);
    g.position.set(p.x,0,p.z);this.npcs.push({group:g,body,bubble,alarm:0,seed:this.npcs.length*1.7});this.root.add(g);
  }
  /** Coworkers near a crash or snap flinch and show a "!" bubble. */
  alarm(at:Point,radius=4.5){for(const npc of this.npcs)if(distance(npc.group.position,at)<radius)npc.alarm=1.6;}
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
    new GLTFLoader().load('/models/pip.glb',gltf=>{this.avatar.clear();gltf.scene.rotation.y=Math.PI;gltf.scene.traverse(o=>{if(o instanceof T.Mesh){const old=o.material as T.MeshStandardMaterial;o.material=toon('#'+old.color.getHexString());o.castShadow=true;}});this.avatar.add(gltf.scene);},undefined,()=>{document.body.dataset.assetFallback='true';});
  }
  setupUI(){
    this.hud.innerHTML=`<div class="job"><div class="badge">${icon(this.level.badge)}<svg class="timer" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29"/></svg></div><div class="stats"><span>${icon('clock')}<b id="clock">0:00</b></span><span>${icon('damage')}<b id="damage">0</b></span><span>${icon('coins')}<b id="cost">0</b></span></div></div><div class="tension">${icon('reel')}<div><i id="strain"></i></div></div><div class="toolbar"><button aria-label="Grab or drop" data-action="grab">${icon('hand')}<kbd>E</kbd></button><button aria-label="Cable" data-action="cable">${icon('plug')}<kbd>F</kbd></button><button aria-label="Throw" data-action="throw">${icon('throw')}<kbd>Q</kbd></button><button aria-label="Jump" data-action="jump">${icon('jump')}<kbd>␣</kbd></button><button aria-label="Reset camera" data-action="camera">${icon('camera')}</button></div><div class="utility"><button aria-label="Mute audio" data-action="sound">${icon('sound')}</button><button aria-label="Pause" data-action="pause">${icon('pause')}</button><button aria-label="Restart" data-action="restart">${icon('retry')}</button></div><div class="intro panel"><div class="eyebrow">FACILITIES DEPARTMENT / ${this.level.number}</div><h1>CIRCUIT<br><em>CREW</em><span>®</span></h1><div class="intro-rule"></div><p>${this.level.tagline}</p><div class="control-strip"><span><kbd>W A S D</kbd>${icon('move')}</span><span><kbd>E</kbd>${icon('hand')}</span><span><kbd>F</kbd>${icon('plug')}</span><span><kbd>Q</kbd>${icon('throw')}</span><span><kbd>␣</kbd>${icon('jump')}</span><span><kbd>⇧</kbd>${icon('arrow')}</span><span><kbd>RMB</kbd>${icon('camera')}</span></div><button class="start" aria-label="Start playing">${icon('play')}</button><nav class="levels">${levels.map(l=>`<a href="?level=${l.id}" aria-label="${l.name}" class="${l.id===this.level.id?'current':''}">${icon(l.badge)}</a>`).join('')}</nav><small>${this.level.name} <span>${this.level.number} / CIRCUIT CREW</span></small></div><div class="result panel" hidden></div><div class="pause panel" hidden><button aria-label="Resume" class="resume">${icon('play')}</button></div>`;
    this.hud.querySelector('.start')!.addEventListener('click',()=>{this.running=true;this.audio.start();this.hud.querySelector('.intro')!.remove();});
    this.hud.querySelector('.resume')!.addEventListener('click',()=>this.togglePause());
    this.hud.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button=>button.addEventListener('click',()=>this.action(button.dataset.action!)));
  }
  setupInput(){
    addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.repeat)return;
      if(e.code==='KeyE')this.action('grab');if(e.code==='KeyF')this.action('cable');if(e.code==='KeyQ')this.action('throw');if(e.code==='Space')this.action('jump');if(e.code==='Escape')this.action('pause');if(e.code==='KeyR')this.action('restart');});
    addEventListener('keyup',e=>this.keys.delete(e.code));
    addEventListener('blur',()=>{this.keys.clear();if(this.running&&!this.won&&!this.paused)this.togglePause();});
    const canvas=this.view.renderer.domElement;
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('pointerdown',e=>{this.audio.start();if(e.button===2){this.orbit=true;this.pointerX=e.clientX;this.pointerY=e.clientY;canvas.setPointerCapture(e.pointerId);}else if(e.button===0&&this.running)this.action('grab');});
    canvas.addEventListener('pointerup',()=>this.orbit=false);
    canvas.addEventListener('pointermove',e=>{if(this.orbit){this.yaw-=(e.clientX-this.pointerX)*.006;this.pitch=T.MathUtils.clamp(this.pitch+(e.clientY-this.pointerY)*.004,.35,1.25);this.pointerX=e.clientX;this.pointerY=e.clientY;}});
    canvas.addEventListener('wheel',e=>{this.zoom=T.MathUtils.clamp(this.zoom+e.deltaY*.015,12,43);},{passive:true});
  }
  action(action:string){
    if(action==='restart'){location.reload();return;}if(action==='sound'){this.audio.muted=!this.audio.muted;return;}if(action==='pause'){this.togglePause();return;}if(action==='camera'){this.yaw=.12;this.pitch=.83;return;}
    if(!this.running||this.paused||this.won)return;
    if(action==='throw'&&this.lunch?.held){this.lunch.release();return;}
    if(action==='jump'&&this.grounded&&(!this.held||prefabs[this.held.spec.kind].mass<15)){this.vertical=7;this.grounded=false;this.squash=-.6;this.audio.tone(310,.1,.025);}
    if(action==='grab'||action==='cable')this.interact(action==='cable');
    if(action==='throw'){if(this.holdingPlug)this.releasePlug();else if(this.held){const p=this.held;this.held=undefined;p.body.applyImpulse({x:Math.sin(this.heading)*prefabs[p.spec.kind].mass*8,y:prefabs[p.spec.kind].mass*5,z:Math.cos(this.heading)*prefabs[p.spec.kind].mass*8},true);this.audio.tone(240,.1,.06,'triangle');}}
  }
  togglePause(){if(!this.running||this.won)return;this.paused=!this.paused;this.hud.querySelector<HTMLElement>('.pause')!.hidden=!this.paused;this.audio.strain(0);}
  nearest(){const pos=this.player.translation();return this.props.filter(p=>p.mesh.visible&&(!this.lunch||this.lunch.canGrab(p.body.translation()))&&distance(pos,p.body.translation())<1.65&&Math.abs(pos.y-p.body.translation().y)<1.8).sort((a,b)=>this.reach(pos,a)-this.reach(pos,b))[0];}
  /** Job items (anything with an id) win ties against clutter that got pushed along. */
  reach(pos:Point,p:Prop){return distance(pos,p.body.translation())-(p.spec.id?.6:0);}
  interact(cableOnly=false){
    const pos=this.player.translation();
    if(this.lunch?.interact(cableOnly))return;
    if(this.lunch&&cableOnly)return;
    // Forgiving snap: the held plug only has to look close to the socket.
    if(this.holdingPlug){if(Math.min(distance(pos,this.level.target)-.3,distance(this.plugPosition,this.level.target))<1.6&&this.rope.strain<1.12){this.connected=true;this.holdingPlug=false;this.plugPosition.set(this.level.target.x,.28,this.level.target.z);this.circuit.leads[0].closed=true;this.audio.tone(620,.2);this.audio.noise(.05,.06,3000);this.burst(this.plugPosition,'#fff3a3',16,'spark');}else this.releasePlug();return;}
    if(this.held){const p=this.held;
      if(p.spec.id==='extension'&&distance(pos,this.plugPosition)<2&&this.coupler){this.extension=true;this.rope.maxLength=this.level.length+14;this.consume(p);this.audio.cheer();}
      else if(p.spec.id==='coupler'&&distance(pos,this.plugPosition)<2){this.coupler=true;this.consume(p);this.audio.tone(550,.2);}
      p.body.setLinvel({x:0,y:0,z:0},true);p.body.setAngvel({x:0,y:0,z:0},true);
      this.lunch?.dropped(p);
      this.held=undefined;return;
    }
    if(!this.lunch&&distance(pos,this.plugPosition)<1.75){if(this.connected){this.connected=false;this.circuit.leads[0].closed=false;}this.holdingPlug=true;this.audio.tone(420,.08);return;}
    if(cableOnly)return;
    const nearest=this.nearest();if(nearest){
      if(nearest.spec.id==='coffee-reel'&&!this.coffeeReused){this.coffeeReused=true;this.rope.reset({x:-14,z:5},30);this.plugPosition.set(-13,.3,4.5);this.holdingPlug=true;this.consume(nearest);this.audio.tone(100,.6,.06,'triangle');return;}
      // A jammed doorstop only comes loose when deliberately picked up.
      if(nearest.spec.id==='wedge')nearest.body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
      this.held=nearest;this.audio.tone(180,.08,.035);
    }
  }
  consume(p:Prop){p.mesh.visible=false;p.body.setEnabled(false);}
  releasePlug(){
    const energy=this.rope.release();this.holdingPlug=false;
    if(energy>1){this.shake=Math.min(.5,energy*.006);this.audio.tone(90,.3,.12,'sawtooth');this.alarm(this.plugPosition,6);
      for(const p of this.props){const pos=p.body.translation();if(this.ropePoints.slice(1).some((b,i)=>segmentDistance(pos,this.ropePoints[i],b)<1.1)){const v=new T.Vector3(pos.x-this.rope.anchor.x,0,pos.z-this.rope.anchor.z).normalize();const impulse=Math.min(energy*.22,45);p.body.applyImpulse({x:v.x*impulse,y:impulse*.65,z:v.z*impulse},true);}}
      const last=this.rope.bends.at(-1)??this.rope.anchor;this.plugPosition.x=T.MathUtils.lerp(this.plugPosition.x,last.x,.15);this.plugPosition.z=T.MathUtils.lerp(this.plugPosition.z,last.z,.15);this.burst(this.plugPosition,'#ffdf94',12);
    }else this.audio.tone(140,.09,.03);
    this.plugPosition.y=.22;
  }
  simulateCable(){
    if(this.holdingPlug){const pos=this.player.translation();this.plugPosition.set(pos.x+Math.sin(this.heading)*.65,pos.y+.05,pos.z+Math.cos(this.heading)*.65);}
    const before=this.rope.bends.length;
    // Dynamic furniture contributes corners only near the current rope path.
    // This bounds the visibility graph in a dense room while retaining local wraps.
    const route=this.ropePoints.length>1?this.ropePoints:[this.rope.anchor,this.plugPosition];
    const furniture=this.props.filter(p=>p.mesh.visible&&p!==this.held&&prefabs[p.spec.kind].mass>=3&&p.body.translation().y<1.8&&route.slice(1).some((b,i)=>segmentDistance(p.body.translation(),route[i],b)<1.2)).slice(0,20).map(p=>{
      const pos=p.body.translation(),[w,,d]=prefabs[p.spec.kind].size,rotation=new T.Matrix4().makeRotationFromQuaternion(p.mesh.quaternion).elements;
      const hx=Math.abs(rotation[0])*w/2+Math.abs(rotation[8])*d/2+.05,hz=Math.abs(rotation[2])*w/2+Math.abs(rotation[10])*d/2+.05;
      return {id:`prop-${p.body.handle}`,minX:pos.x-hx,maxX:pos.x+hx,minZ:pos.z-hz,maxZ:pos.z+hz};
    }).filter(o=>!(this.plugPosition.x>o.minX&&this.plugPosition.x<o.maxX&&this.plugPosition.z>o.minZ&&this.plugPosition.z<o.maxZ)&&!(this.rope.anchor.x>o.minX&&this.rope.anchor.x<o.maxX&&this.rope.anchor.z>o.minZ&&this.rope.anchor.z<o.maxZ));
    this.ropePoints=this.rope.update(this.plugPosition,[...this.obstacles,...furniture]);
    if(this.running&&this.rope.bends.length!==before){this.audio.tone(this.rope.bends.length>before?160:280,.08,.05,'triangle');if(this.rope.bends.length<before&&this.rope.strain>1)this.shake=.1;}
  }
  drawCable(){
    this.plug.position.copy(this.plugPosition);
    const points:T.Vector3[]=[];
    for(let i=0;i<this.ropePoints.length-1;i++){
      const a=this.ropePoints[i],b=this.ropePoints[i+1],steps=Math.max(2,Math.ceil(distance(a,b)*2));
      for(let j=0;j<steps;j++){const t=j/steps;const endY=i===this.ropePoints.length-2?this.plugPosition.y:.18;const startY=i===0?.5:.18;
        points.push(new T.Vector3(T.MathUtils.lerp(a.x,b.x,t),Math.max(.085,T.MathUtils.lerp(startY,endY,t)-Math.sin(t*Math.PI)*Math.max(0,1-this.rope.strain)*.7),T.MathUtils.lerp(a.z,b.z,t)));}
    }
    points.push(this.plugPosition.clone());
    if(points.length>1){const geometry=new T.TubeGeometry(new T.CatmullRomCurve3(points,false,'centripetal'),Math.max(12,points.length*2),.065,5,false);this.ropeMesh.geometry.dispose();this.ropeMesh.geometry=geometry;}
    (this.ropeMesh.material as T.MeshToonMaterial).color.set(strainColor(this.rope.strain));
    this.audio.strain(this.holdingPlug?this.rope.strain:0);
  }
  burst(pos:{x:number;y:number;z:number},color:string,count:number,kind:Fx='debris'){this.fx.spawn(kind,pos,count,color);}
  step(dt:number){
    this.time+=dt;const p=this.player.translation();
    let x=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'));
    let z=Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'));
    if(this.stick){x+=this.stick.x;z+=this.stick.z;}
    const pad=navigator.getGamepads?.()[0];if(pad){x+=Math.abs(pad.axes[0])>.15?pad.axes[0]:0;z+=Math.abs(pad.axes[1])>.15?pad.axes[1]:0;this.yaw-=Math.abs(pad.axes[2])>.15?pad.axes[2]*dt*2:0;this.pitch=T.MathUtils.clamp(this.pitch+(Math.abs(pad.axes[3])>.15?pad.axes[3]*dt:0),.35,1.25);}
    const move=new T.Vector3(x,0,z);if(move.length()>1)move.normalize();move.applyAxisAngle(new T.Vector3(0,1,0),this.yaw);
    if(move.length()>.1)this.heading=Math.atan2(move.x,move.z);
    let speed=this.keys.has('ShiftLeft')?6.8:4.2;if(this.held)speed/=1+prefabs[this.held.spec.kind].mass/25;if(this.lunch?.held?.cable.rating===10)speed*=.65;
    const pull=this.lunch?this.lunch.pull():this.holdingPlug?this.rope.pull(p):{x:0,z:0};
    this.vertical=Math.max(-20,this.vertical-18*dt);
    this.controller.computeColliderMovement(this.playerCollider,{x:(move.x*speed+pull.x)*dt,y:this.vertical*dt,z:(move.z*speed+pull.z)*dt},undefined,undefined,c=>c.handle!==this.held?.collider.handle);
    const delta=this.controller.computedMovement(),wasGrounded=this.grounded;this.grounded=this.controller.computedGrounded();
    if(this.grounded&&!wasGrounded&&this.airborne>.25){this.squash=Math.min(1,this.airborne*1.4);this.burst({x:p.x,y:.1,z:p.z},'#d9d2c3',5,'dust');this.audio.noise(.08,.05,400);}
    this.airborne=this.grounded?0:this.airborne+dt;if(this.grounded&&this.vertical<0)this.vertical=-.1;
    this.player.setNextKinematicTranslation({x:T.MathUtils.clamp(p.x+delta.x,-this.level.width/2+.5,this.level.width/2-.5),y:p.y+delta.y,z:T.MathUtils.clamp(p.z+delta.z,-this.level.depth/2+.5,this.level.depth/2-.5)});
    // Light things are carried at chest height; heavy furniture is pushed along the floor so it stays upright.
    if(this.held){const b=this.held.body,pos=b.translation(),kind=prefabs[this.held.spec.kind],heavy=kind.mass>=15,ahead=heavy?.5+Math.max(kind.size[0],kind.size[2])/2:1.05,target={x:p.x+Math.sin(this.heading)*ahead,y:heavy?kind.size[1]/2+.03:p.y+.55,z:p.z+Math.cos(this.heading)*ahead};b.setLinvel({x:(target.x-pos.x)*12,y:(target.y-pos.y)*12,z:(target.z-pos.z)*12},true);b.setAngvel({x:0,y:0,z:0},true);}
    this.world.timestep=dt;this.world.step();
    if(this.holdingPlug&&this.rope.strain>.88)for(const prop of this.props){const pos=prop.body.translation();if(prefabs[prop.spec.kind].mass<=15&&this.ropePoints.slice(1).some((b,i)=>segmentDistance(pos,this.ropePoints[i],b)<.65)){const v=new T.Vector3(p.x-pos.x,0,p.z-pos.z).normalize().multiplyScalar(dt*12*(this.rope.strain-.8));prop.body.applyImpulse({x:v.x,y:.015,z:v.z},true);}}
    for(const prop of this.props){if(!prop.body.isEnabled())continue;const pos=prop.body.translation(),v=prop.body.linvel(),speed=Math.hypot(v.x,v.y,v.z);
      if(this.time>2&&!prop.damaged&&prop.lastSpeed>4&&prop.lastSpeed-speed>2.5){prop.damaged=true;this.alarm(pos);this.damage++;this.cost+=prefabs[prop.spec.kind].cost;this.audio.noise(.14+prefabs[prop.spec.kind].mass*.01,.05+Math.min(.07,prefabs[prop.spec.kind].mass*.004),500+Math.random()*900);this.burst(pos,'#e1d4b7',3);this.burst(pos,'#e9e4d6',3,'dust');if(prop.spec.kind==='glass'){this.consume(prop);this.burst(new T.Vector3(pos.x,pos.y,pos.z),'#a0dbdf',14);}}
      prop.lastSpeed=speed;
      // Paper sheets flutter: heavy air drag plus a wobble while airborne.
      if(prop.spec.kind==='paper'&&pos.y>.15&&speed>.3){prop.body.applyImpulse({x:-v.x*.004,y:-v.y*.0045+.0002,z:-v.z*.004},true);const w=this.time*23+prop.body.handle;prop.body.applyTorqueImpulse({x:Math.sin(w)*.00002,y:Math.sin(w*1.7)*.00002,z:Math.cos(w*1.3)*.00002},true);}
      if(pos.y< -3||Math.abs(pos.x)>this.level.width/2+1||Math.abs(pos.z)>this.level.depth/2+1){prop.body.setTranslation(prop.home,true);prop.body.setLinvel({x:0,y:0,z:0},true);}
    }
    if(p.y< -3){this.player.setTranslation({x:this.level.spawn.x,y:1,z:this.level.spawn.z},true);this.vertical=0;}
    // Past the deadline the meeting waits impatiently; running late only costs time grade.
    if(this.level.deadline&&this.time>this.level.deadline&&Math.floor(this.time/3)!==Math.floor((this.time-dt)/3))this.alarm(this.level.target,6);
    if(this.lunch)this.lunch.step(dt);else{this.simulateCable();this.circuit.tick(dt);if(this.circuit.loads[0].state==='on'&&!this.won)this.win();}
  }
  win(){this.won=true;this.audio.cheer();this.audio.strain(0);if(this.screen){(this.screen.material as T.MeshToonMaterial)=toon('#f9df88',{emissive:'#ffd76a',ei:.5});}if(this.beam)this.beam.visible=true;
    this.burst({x:this.level.target.x,y:2,z:this.level.target.z},'#ffcf52',90,'confetti');const pp=this.player.translation();this.burst({x:pp.x,y:2,z:pp.z},'#ffcf52',40,'confetti');const g=grade(this.time,this.damage,this.cost);
    const result=this.hud.querySelector<HTMLDivElement>('.result')!;result.innerHTML=`<div class="medal">${icon('check')}<b>${g.overall}</b></div><div class="grade-row"><span>${icon('clock')}<b>${g.parts[0]}</b><small>${this.formatTime(this.time)}</small></span><span>${icon('damage')}<b>${g.parts[1]}</b><small>${this.damage}</small></span><span>${icon('coins')}<b>${g.parts[2]}</b><small>${this.cost}</small></span></div><button aria-label="Play again">${icon('retry')}</button>${this.level.next?`<a href="?level=${this.level.next}" aria-label="Next job">${icon('arrow')}</a>`:''}`;
    result.hidden=false;result.querySelector('button')!.onclick=()=>location.reload();document.body.dataset.complete='true';
  }
  formatTime(t:number){return `${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,'0')}`;}
  updateCamera(dt:number){const p=this.player.translation(),target=new T.Vector3(p.x*.24,0,p.z*.24);const offset=new T.Vector3(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch)).multiplyScalar(this.zoom);const wanted=target.clone().add(offset);wanted.x+=(Math.random()-.5)*this.shake;wanted.y+=(Math.random()-.5)*this.shake;
    this.view.camera.position.lerp(wanted,1-Math.exp(-dt*6));this.view.camera.lookAt(target);this.shake*=.9;
    const start=this.view.camera.position,end=new T.Vector3(p.x,p.y+.4,p.z),ray=new T.Raycaster(start,end.clone().sub(start).normalize(),0,start.distanceTo(end));const hit=new Set(ray.intersectObjects(this.occluders).map(h=>h.object));
    for(const mesh of this.occluders){const material=mesh.material as T.MeshToonMaterial;material.opacity=T.MathUtils.lerp(material.opacity,hit.has(mesh)?.15:1,.15);material.depthWrite=material.opacity>.8;}
  }
  render(dt:number){
    const p=this.player.translation();this.avatar.position.set(p.x,p.y-.78,p.z);this.avatar.rotation.y=this.heading;const moving=(this.keys.size>0||!!this.stick)&&this.running&&!this.paused;this.squash=T.MathUtils.lerp(this.squash,0,1-Math.exp(-dt*9));
    const sy=1-this.squash*.22+(moving&&this.grounded?Math.sin(this.time*15)*.03:0),sxz=1/Math.sqrt(Math.max(.5,sy));this.avatar.scale.set(sxz,sy,sxz);
    for(const prop of this.props){if(!prop.mesh.visible)continue;prop.mesh.position.copy(prop.body.translation());prop.mesh.quaternion.copy(prop.body.rotation());}
    this.updateBatches();
    for(const npc of this.npcs){const g=npc.group,near=distance(p,g.position)<2;npc.alarm=Math.max(0,npc.alarm-dt);
      g.rotation.y=T.MathUtils.lerp(g.rotation.y,Math.atan2(p.x-g.position.x,p.z-g.position.z),.08);
      const cheer=this.won?Math.abs(Math.sin(this.last*.009+npc.seed)):0,duck=npc.alarm>0?.72:near?.86:1;
      npc.body.scale.set(2-duck,duck,2-duck);npc.body.position.y=(this.level.id==='meeting'?.35:0)+cheer*.35;npc.body.rotation.z=npc.alarm>0?Math.sin(npc.alarm*20)*.12:0;npc.bubble.visible=npc.alarm>0&&!this.won;}
    if(this.lunch)this.lunch.render(dt);else this.drawCable();this.target.scale.setScalar(1+Math.sin(this.time*3)*.12);
    const nearest=this.nearest();this.reticle.visible=this.running&&!this.held&&!this.holdingPlug&&!this.won;
    this.reticle.position.copy(distance(p,this.plugPosition)<1.75?this.plugPosition:nearest?.mesh.position??new T.Vector3(0,-10,0));this.reticle.position.y+=.1;
    this.fx.update(dt);
    if(this.time>35&&!this.connected&&!this.lunch){this.hint.visible=true;this.hint.geometry.dispose();this.hint.geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(p.x,.1,p.z),new T.Vector3(this.level.target.x,.1,this.level.target.z)]);this.hint.computeLineDistances();}
    this.hud.querySelector('#clock')!.textContent=this.formatTime(this.time);this.hud.querySelector('#damage')!.textContent=String(this.damage);this.hud.querySelector('#cost')!.textContent=String(this.cost);
    const shown=this.lunch&&!this.lunch.held?0:this.rope.strain,strain=this.hud.querySelector<HTMLElement>('#strain')!;strain.style.width=`${Math.min(100,shown*100)}%`;strain.style.background=strainColor(shown);
    const deadline=this.level.deadline??240,ring=this.hud.querySelector('.timer circle') as SVGElement;ring.style.strokeDashoffset=String(Math.min(1,this.time/deadline)*183);ring.style.stroke=this.time>deadline?'#e5484d':'';
    this.hud.querySelector('[data-action="cable"]')!.classList.toggle('active',this.holdingPlug);this.hud.querySelector('[data-action="grab"]')!.classList.toggle('active',!!this.held);
    this.updateCamera(dt);this.view.effect.render(this.view.scene,this.view.camera);
  }
  frame(t:number){requestAnimationFrame(n=>this.frame(n));const dt=Math.min((t-this.last)/1000||1/60,.1);this.last=t;
    if(this.running&&!this.paused&&!this.won&&!this.manual){this.accumulator+=dt;let steps=0;while(this.accumulator>=1/60&&steps++<5){this.step(1/60);this.accumulator-=1/60;}}
    this.frames++;this.frameWindow+=dt;if(this.frameWindow>=1){this.fps=this.frames/this.frameWindow;this.frames=0;this.frameWindow=0;}
    this.render(dt);
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
    return {advance,walkTo};
  }
  snapshot(){return {level:this.level.id,running:this.running,paused:this.paused,won:this.won,player:{...this.player.translation()},props:this.props.length,items:this.props.filter(p=>p.spec.id).map(p=>({id:p.spec.id,pos:{...p.body.translation()},visible:p.mesh.visible})),holdingPlug:this.holdingPlug,held:this.held?.spec.id??this.held?.spec.kind,rope:{length:this.rope.length,maxLength:this.rope.maxLength,bends:this.rope.bends,strain:this.rope.strain},time:this.time,damage:this.damage,cost:this.cost,fps:this.fps,drawCalls:this.view.renderer.info.render.calls,electrical:this.circuit.loads[0].state,lunch:this.lunch?.snapshot()};}
}
