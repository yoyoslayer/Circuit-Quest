import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from './game';
import {Circuit,type Lead,type Load} from './sim/electrical';
import {LunchJob} from './sim/lunch';
import {Rope,distance,segmentDistance,segmentHits,strainColor,type Point} from './sim/cable';
import {INK,METAL,DMETAL,TRIM,toon,rbox,box,cyl,sphere,part,group,glow,unlit,canvasTex,repeat,glyph,decal,cachedTexture,lit,Gauge} from './render/kit';
import {makeProp} from './props/prefabs';
import {icon} from './render/icons';
import {solid} from './levels/decor';
type Port={id:string;role:'out'|'in'|'both';pos:T.Vector3;bodyId?:string;lift:number;ring:T.Mesh;capacity:number};
type Cable={id:string;rating:number;ends:[T.Vector3,T.Vector3];ports:[string|null,string|null];rope:Rope;mesh:T.Mesh;plugs:[T.Group,T.Group];lead:Lead;points:Point[]};
type Leaf={pivot:T.Group;body:RAPIER.RigidBody;closed:number;open:number};
const DOOR={x:0,z:.15},PUDDLE={x:0,z:1};
/** Level 02 rules and visuals: supplies, cables, splitters, machines, door, puddle, bots. */
export class LunchRuntime {
  circuit:Circuit;job=new LunchJob();ports:Port[]=[];cables:Cable[]=[];held?:{cable:Cable;end:0|1};
  water=1;puddles:T.Mesh[]=[];leaves:Leaf[]=[];doorAngle=0;doorWasOpen=false;bots:T.Group[]=[];cooldown=0;
  dark:T.Mesh;liftCar!:T.Group;eventIndex=0;bakeGauge=new Gauge([[0,.95,'#ffc94d'],[.95,1,'#3bb273']]);supplyGauges=new Map<string,{gauge:Gauge;mount:T.Group;button:T.Mesh}>();
  // Assigned by the build* helpers called from the constructor.
  thermoFill!:T.Mesh;ovenWindow!:T.Mesh;ovenGlow!:T.Sprite;belt!:T.Texture;sad!:T.Sprite;cord!:T.Mesh;
  lamps=new Map<string,{bulb:T.Mesh;glow:T.Sprite;light:T.PointLight}>();smoke:T.Mesh[]=[];
  constructor(public game:Game){
    game.ropeMesh.visible=false;game.plug.visible=false;game.target.visible=false;if(game.screen)game.screen.visible=false;
    const loads:Load[]=[['oven',3,0],['fridge',2,0],['conveyor',1.5,3],['lift',3,9],['kitchen-lamp',.5,0],['store-lamp',.5,0]].map(([id,steady,kick])=>({id:String(id),steady:Number(steady),kick:Number(kick),kickSeconds:1,enabled:!['conveyor','lift'].includes(String(id)),state:'off',started:0}));
    loads.find(l=>l.id==='lift')!.capacitor={atLoad:false,charge:12};
    // The kitchen feed post is hard-wired to the oven and both lamps.
    const branches=['oven','kitchen-lamp','store-lamp'].map(id=>({id:`fixed-${id}`,from:'kitchen',to:id,rating:3,closed:true,heat:0,dead:false}));
    this.circuit=new Circuit([{id:'a',limit:5,tripped:false},{id:'b',limit:5,tripped:false}],branches,loads);
    const root=game.root;
    this.buildKitchen();this.buildLift();this.buildLamps();this.buildDoor();this.buildCorridor();
    this.port('a',-13,3,'out',2,'supply-a',.1);this.port('b',-13,7,'out',2,'supply-b',.1);this.port('kitchen',-4,-3,'in',1);
    this.port('fridge',-4,-1.8,'in',1);this.port('conveyor',5,-5,'in',1);this.port('lift',12,-4.8,'in',1);
    for(let i=1;i<=3;i++)this.port(`splitter-${i}`,-14+(i-1)*.7,0,'both',4,`splitter-${i}`,-.15);
    for(const id of ['a','b']){const gauge=new Gauge(),mount=gauge.mount(root,0,0,0,.9);mount.rotation.x=-.5;const button=part(root,cyl(.1,.1,.12,12),toon('#d63a3f'));this.supplyGauges.set(id,{gauge,mount,button});}
    this.addCable('thin-1',3,32,'a',null,[-11,2]);this.addCable('thin-2',3,30,'a',null,[-10,3.5]);this.addCable('thin-3',3,32,null,null,[-11,7]);this.addCable('thick',10,30,'b',null,[-10,7.5]);
    this.dark=part(root,new T.PlaneGeometry(8.9,10),unlit('#141726',{transparent:true,opacity:.88,depthWrite:false}),-12.1,2.7,-5,false);this.dark.rotation.x=-Math.PI/2;this.dark.renderOrder=5;
    const tray=this.prop('tray');if(tray){tray.mesh.visible=false;tray.body.setEnabled(false);}
    game.hud.querySelector('.badge>svg')!.outerHTML=icon('tray');
    const objective=document.createElement('div');objective.className='lunch-chain';objective.innerHTML=`<span id="oven-stage">${icon('oven')}</span>${icon('arrow')}<span id="belt-stage">${icon('conveyor')}</span>${icon('arrow')}<span id="lift-stage">${icon('lift')}</span><span id="fridge-stage">${icon('thermometer')}</span>`;game.hud.append(objective);
  }
  prop(id:string){return this.game.props.find(p=>p.spec.id===id);}
  socketPlate(parent:T.Object3D,x:number,y:number,z:number,ry=0){const g=group(parent,x,y,z,ry);part(g,rbox(.38,.1,.38,.06).clone().rotateX(Math.PI/2),toon('#f0ece2'));part(g,cyl(.11,.11,.06,14,'z'),toon(INK),0,0,.05);return g;}
  buildKitchen(){const g=this.game,root=g.root;
    // Oven with a window that glows while baking and a dial that fills to 20 s.
    const oven=group(root,-2.5,0,-8.1);part(oven,rbox(2.6,1.7,1.3,.12),toon('#c7ccd6'),0,.85);part(oven,box(2.8,.35,1.5),toon(DMETAL),0,1.88,-.05);part(oven,cyl(.25,.25,1.1,14),toon(METAL),.6,2.6,-.3);
    this.ovenWindow=part(oven,box(1.5,.75,.06),toon('#3a3d55'),-.25,.85,.66,false);this.ovenGlow=glow(root,'rgba(255,150,60,1)',2.4,0);this.ovenGlow.position.set(-2.75,.9,-7.3);
    this.bakeGauge.mount(oven,.9,1.35,.68,.7);this.socketPlate(oven,.95,.4,.66);solid(g,2.6,1.7,1.3,-2.5,.85,-8.1);
    // Fridge with a live thermometer; a sad-food icon warns before it spoils.
    const fridge=group(root,-5.6,0,-2.3,Math.PI/2);part(fridge,rbox(1.3,2.3,1.0,.12),toon('#e9f0f2'),0,1.15);part(fridge,box(.06,.9,.06),toon(DMETAL),.5,1.4,.52);part(fridge,box(1.25,.04,.02),toon(DMETAL),0,1.6,.51);
    part(fridge,rbox(.22,1.1,.08,.1).clone().rotateX(Math.PI/2),toon('#fffaf0'),-.4,1.2,.54);this.thermoFill=part(fridge,box(.1,1,.04),toon('#ffc94d'),-.4,.72,.59,false);part(fridge,sphere(.1,12,10),toon('#ffc94d'),-.4,.68,.59);
    this.socketPlate(fridge,.3,.35,.52);solid(g,1.0,2.3,1.3,-5.6,1.15,-2.3);
    this.sad=new T.Sprite(new T.SpriteMaterial({map:cachedTexture('sad-food',()=>glyph(c=>{c.fillStyle='#fffaf0';c.beginPath();c.arc(128,128,110,0,7);c.fill();c.lineWidth=14;c.stroke();c.fillStyle='#8bbf5a';c.beginPath();c.arc(128,140,62,0,7);c.fill();c.stroke();c.fillStyle=INK;for(const x of [104,152]){c.beginPath();c.arc(x,128,9,0,7);c.fill();}c.beginPath();c.arc(128,178,24,Math.PI*1.15,Math.PI*1.85);c.stroke();})),depthTest:false}));
    this.sad.scale.set(.8,.8,1);this.sad.position.set(-5.3,2.9,-2.1);this.sad.renderOrder=9;this.sad.visible=false;root.add(this.sad);
    // Kitchen feed post: the one inlet for oven + lamps (a thin cable here overheats).
    const post=group(root,-4,0,-3.35);part(post,rbox(.6,1.1,.4,.08),toon('#ffc94d'),0,.55);this.socketPlate(post,0,.35,.21);
    decal(post,cachedTexture('bolt-glyph',()=>glyph(c=>{c.beginPath();c.moveTo(150,20);c.lineTo(70,140);c.lineTo(125,140);c.lineTo(100,236);c.lineTo(190,104);c.lineTo(134,104);c.closePath();c.fill();})),.3,.3,0,.85,.21);solid(g,.6,1.1,.4,-4,.55,-3.35);
    const conduit=(pts:number[][])=>part(root,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0),60,.04,6),toon('#7d8697'));
    // Floor conduits show the post's fixed wiring to the oven and the storeroom lamp.
    conduit([[-4,.2,-3.56],[-4,.03,-3.7],[-3.8,.03,-7],[-1.55,.03,-7.3],[-1.55,.4,-7.44]]);conduit([[-4,.2,-3.56],[-4.3,.03,-3.8],[-7.75,.03,-3.3],[-9.7,.03,-3.1],[-10,.1,-3]]);
    // Conveyor: belt scrolls while powered, motor socket faces the kitchen.
    const conveyor=group(root,3.5,0,-7);part(conveyor,rbox(8.5,.25,.9,.1),toon(DMETAL),0,.95);
    this.belt=repeat(canvasTex(256,64,c=>{c.fillStyle='#3a3d55';c.fillRect(0,0,256,64);c.fillStyle='#4a4d6a';for(let x=0;x<256;x+=24)c.fillRect(x,0,8,64);}),7,1);
    part(conveyor,box(8.5,.03,.75),toon('#ffffff',{map:this.belt}),0,1.09,0,false);for(let x=-3.9;x<=4;x+=1.95)for(const dz of [-.35,.35])part(conveyor,box(.08,.85,.08),toon(METAL),x,.42,dz);
    part(root,rbox(.7,.6,.6,.08),toon('#3f7fd6'),5,.3,-6.1);this.socketPlate(root,5,.38,-5.78);solid(g,8.5,.3,.9,3.5,.95,-7);solid(g,.7,.6,.6,5,.3,-6.1);
    for(const dz of [-.35,.35])part(root,box(.06,.8,.4),toon('#5f8fa8'),8.15,1.4,-7+dz);
    // Prep table the tray is baked for, plus pots and pans to knock about.
    const table=group(root,-5,0,-6.2,Math.PI/2);part(table,rbox(2.2,.1,.9,.06),toon('#e9f0f2'),0,.95);for(const [lx,lz] of [[-1,-.38],[1,-.38],[-1,.38],[1,.38]])part(table,box(.07,.95,.07),toon(METAL),lx,.48,lz);solid(g,.9,1,2.2,-5,.5,-6.2);
  }
  buildLift(){const g=this.game,root=g.root;
    for(const x of [10.6,13.4])part(root,box(.2,3.7,.2),toon(DMETAL),x,1.85,-8.3);part(root,box(3.2,.25,.5),toon(DMETAL),12,3.6,-8.3);
    this.liftCar=group(root,12,0,-7);part(this.liftCar,rbox(2.6,.12,2.2,.08),toon(METAL),0,0);part(this.liftCar,box(2.6,1.1,.08),toon('#c7ccd6'),0,.6,-1.1);part(this.liftCar,box(.08,1.1,2.2),toon('#c7ccd6'),1.3,.6,0);
    part(this.liftCar,cyl(.02,.02,4,6),toon(INK),0,2.6,-.4);
    const winch=group(root,13.3,0,-4.8,-Math.PI/2);part(winch,rbox(1.4,.3,1.1,.08),toon(DMETAL),0,.15);part(winch,cyl(.4,.4,.9,22,'x'),toon('#e0b25a'),0,.85);
    for(const sx of [-.55,.55])part(winch,box(.12,1.1,.8),toon(DMETAL),sx,.65);this.socketPlate(root,12.62,.38,-4.8,-Math.PI/2);solid(g,1.1,1.3,1.4,13.3,.65,-4.8);
  }
  buildLamps(){const root=this.game.root;
    for(const id of ['store-lamp','kitchen-lamp']){
      const bulb=part(root,sphere(.14,12,10),toon('#bbb6a8'),0,-10,0,false);const halo=glow(root,'rgba(255,210,120,1)',2.4,0);const light=new T.PointLight('#ffcf7a',0,9,1.5);root.add(light);this.lamps.set(id,{bulb,glow:halo,light});}
    const stand=group(root,-10,0,-3);part(stand,cyl(.3,.36,.1,18),toon(INK),0,.05);part(stand,cyl(.035,.035,1.8,8),toon(TRIM),0,1);
    const shade=part(stand,new T.CylinderGeometry(.24,.42,.45,20,1,true),toon('#f7ecd0'),0,2);(shade.material as T.Material).side=T.DoubleSide;solid(this.game,.5,2,.5,-10,1,-3);
  }
  buildDoor(){const g=this.game;
    // Double swing door: both leaves swing out into the corridor and auto-close.
    for(const [hinge,closed,dir] of [[-1.5,0,-1],[1.5,Math.PI,1]] as const){
      const pivot=group(g.root,hinge,0,DOOR.z,closed);part(pivot,rbox(1.45,2,.08,.06).clone().rotateX(Math.PI/2),toon('#5f8fa8'),.73,1.05,0);part(pivot,cyl(.18,.18,.04,16,'z'),toon('#bfeaf5'),.73,1.55,.05);
      const body=g.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(hinge,1.05,DOOR.z));g.world.createCollider(RAPIER.ColliderDesc.cuboid(.72,1,.05),body);
      this.leaves.push({pivot,body,closed,open:closed+dir*Math.PI*.47});
    }
    // The fridge leak runs out through the doorway into the corridor.
    const water=unlit('#7cc4ea',{transparent:true,opacity:.72,depthWrite:false});
    for(const [x,z,r] of [[-4.6,-1.2,.45],[-3.6,-.5,.55],[-2.4,0,.55],[-1.2,.4,.6],[-.2,.8,.7],[.4,1.4,.75],[.6,2.2,.6],[.3,2.8,.45]]){const m=part(this.game.root,new T.CircleGeometry(r,24),water,x,.02,z,false);m.rotation.x=-Math.PI/2;m.scale.x=1.4;this.puddles.push(m);}
  }
  buildCorridor(){const root=this.game.root;
    for(let i=0;i<2;i++){const bot=group(root);part(bot,cyl(.42,.45,.2,28),toon('#f4efe6'),0,.14);part(bot,cyl(.3,.3,.06,24),toon('#3f7fd6'),0,.26);for(const ex of [-.1,.1])part(bot,sphere(.05,10,8),lit('#57e38f','#3fdc7f',.5),ex,.2,.4);part(bot,cyl(.12,.12,.04,6),toon('#ffc94d'),.3,.05,.3);this.bots.push(bot);}
    const lane:[number,number][]=[[-5,3],[14,3],[14,7],[-5,7],[-5,3]];
    for(let i=0;i<4;i++){const [x0,z0]=lane[i],[x1,z1]=lane[i+1],len=Math.hypot(x1-x0,z1-z0);for(let t=0;t<len;t+=.5)part(root,box(.25,.01,.08),unlit('#6aa7e8'),x0+(x1-x0)*t/len,.012,z0+(z1-z0)*t/len,false).rotation.y=Math.atan2(-(z1-z0),x1-x0);}
    const rack=group(root,-16.1,0,5,Math.PI/2);part(rack,box(3.4,.08,.5),toon(TRIM),0,1,.1);part(rack,box(3.4,.08,.5),toon(TRIM),0,2.1,.1);for(const sx of [-1.6,1.6])part(rack,box(.08,2.2,.08),toon(DMETAL),sx,1.1,.3);
    this.cord=part(root,new T.BufferGeometry(),toon('#ecE8dc'));
  }
  port(id:string,x:number,z:number,role:Port['role'],capacity:number,bodyId?:string,lift=.45){
    const ring=part(this.game.root,new T.TorusGeometry(.29,.05,8,24),unlit('#61d8ce',{transparent:true,opacity:.8}),x,.35,z,false);ring.rotation.x=-Math.PI/2;
    this.ports.push({id,pos:new T.Vector3(x,.35,z),role,capacity,bodyId,lift,ring});
  }
  addCable(id:string,rating:number,length:number,from:string|null,to:string|null,loose:[number,number]){
    const ends:[T.Vector3,T.Vector3]=[from?this.ports.find(p=>p.id===from)!.pos.clone():new T.Vector3(loose[0]-.5,.18,loose[1]),to?this.ports.find(p=>p.id===to)!.pos.clone():new T.Vector3(loose[0],.18,loose[1])];
    const lead:Lead={id,from:from??'',to:to??'',rating,closed:!!from&&!!to,heat:0,dead:false};this.circuit.leads.push(lead);
    const mesh=part(this.game.root,new T.BufferGeometry(),toon(rating>3?INK:'#ecE8dc').clone());const color=rating>3?'#ffc94d':'#ecE8dc';const plugs:[T.Group,T.Group]=[makeProp('plug',color),makeProp('plug',color)];plugs.forEach(p=>this.game.root.add(p));
    this.cables.push({id,rating,ends,ports:[from,to],rope:new Rope(ends[0],length),mesh,plugs,lead,points:[]});
  }
  powered(id:string){return this.circuit.loads.find(l=>l.id===id)?.state==='on';}
  lit(){return this.powered('store-lamp')||(this.powered('kitchen-lamp')&&this.prop('portable-lamp')!.body.translation().x< -7.8);}
  /** Nothing inside the dark storeroom can be found until it is lit. */
  canGrab(p:Point){return this.lit()||!this.inStore(p);}
  interact(cableOnly:boolean):boolean{
    const g=this.game,pos=g.player.translation();
    if(g.held)return false;
    if(this.held){const {cable,end}=this.held,other=(1-end) as 0|1;
      const candidates=this.ports.filter(p=>Math.min(distance(pos,p.pos)-.3,distance(cable.ends[end],p.pos))<1.4&&p.id!==cable.ports[other]&&(this.lit()||!this.inStore(p.pos)));
      const target=candidates.sort((a,b)=>distance(pos,a.pos)-distance(pos,b.pos))[0];
      if(target&&cable.rope.strain<1.1){
        const otherPort=this.ports.find(p=>p.id===cable.ports[other]);
        const count=this.cables.reduce((n,c)=>n+c.ports.filter(id=>id===target.id).length,0);
        const validRole=!otherPort||!(target.role==='out'&&otherPort.role==='out')&&!(target.role==='in'&&otherPort.role==='in');
        if(count<target.capacity&&validRole){cable.ports[end]=target.id;cable.ends[end].copy(target.pos);g.audio.tone(610,.13,.045);g.burst(target.pos.clone(),'#6ce6d3',8);this.held=undefined;g.holdingPlug=false;return true;}
      }
      this.release();return true;
    }
    if(!cableOnly){
      if(this.job.tray==='baked'&&distance(pos,this.prop('tray')!.body.translation())<1.65)return false;
      const source=this.ports.find(p=>(p.id==='a'||p.id==='b')&&distance(pos,p.pos)<1.6&&this.circuit.sources.find(s=>s.id===p.id)!.tripped);
      if(source){this.circuit.resetBreaker(source.id);g.audio.tone(120,.1,.09,'square');return true;}
      const switches:Record<string,Point>={oven:{x:-2.5,z:-6.9},conveyor:{x:5,z:-5},lift:{x:12,z:-4.8},'store-lamp':{x:-10,z:-3}};
      const machine=Object.entries(switches).find(([,p])=>distance(pos,p)<1.25);
      if(machine){const load=this.circuit.loads.find(l=>l.id===machine[0])!;load.enabled=!load.enabled;g.audio.tone(load.enabled?320:160,.1,.04);return true;}
    }
    const nearby=this.cables.flatMap(c=>[0,1].map(end=>({c,end:end as 0|1,d:distance(pos,c.ends[end])}))).filter(v=>v.d<1.75).sort((a,b)=>a.d-b.d)[0];
    if(nearby){const {c,end}=nearby;if(c.lead.dead){c.lead.dead=false;c.lead.heat=0;g.cost+=15;g.audio.tone(400,.15);return true;}c.ports[end]=null;this.held={cable:c,end};g.holdingPlug=true;g.audio.tone(420,.08);return true;}
    return false;
  }
  inStore(p:Point){return p.x< -7.8&&p.z<0;}
  /** Letting go of a stretched cable slingshots props lying along it back toward its anchor. */
  release(){if(!this.held)return;const {cable,end}=this.held,energy=cable.rope.release(),g=this.game;
    if(energy>1){g.shake=Math.min(.5,energy*.006);g.audio.tone(90,.3,.1,'sawtooth');g.alarm(cable.ends[end],6);const anchor=cable.ends[(1-end) as 0|1];
      for(const prop of g.props){const p=prop.body.translation();if(cable.points.slice(1).some((b,i)=>segmentDistance(p,cable.points[i],b)<.8)){const v=new T.Vector3(anchor.x-p.x,0,anchor.z-p.z).normalize(),impulse=Math.min(energy*.2,40);prop.body.applyImpulse({x:v.x*impulse,y:impulse*.6,z:v.z*impulse},true);}}}
    else g.audio.tone(140,.09,.03);
    cable.ends[end].y=.15;this.held=undefined;g.holdingPlug=false;
  }
  pull(){if(!this.held)return {x:0,z:0};return this.held.cable.rope.pull(this.game.player.translation());}
  bridgeNear(p:Point){return this.game.props.some(prop=>prop.spec.kind==='bridge'&&distance(prop.body.translation(),p)<1.15&&prop.body.translation().y<.6);}
  doorWedged(){const g=this.game,wedge=this.prop('wedge')!,p=wedge.body.translation();return g.held!==wedge&&distance(p,{x:0,z:.8})<1.9&&p.y<1.2;}
  step(dt:number){const g=this.game,p=g.player.translation();this.cooldown=Math.max(0,this.cooldown-dt);
    for(const port of this.ports)if(port.bodyId){const prop=this.prop(port.bodyId);if(prop){const pos=prop.body.translation();port.pos.set(pos.x,pos.y+port.lift,pos.z);}}
    const wedged=this.doorWedged(),open=wedged||distance(p,{x:0,z:.2})<2.3;
    this.doorAngle=T.MathUtils.lerp(this.doorAngle,open?1:0,dt*5);
    for(const leaf of this.leaves){const angle=T.MathUtils.lerp(leaf.closed,leaf.open,this.doorAngle);leaf.pivot.rotation.y=angle;
      const center=new T.Vector3(.72,1.05,0).applyAxisAngle(new T.Vector3(0,1,0),angle).add(leaf.pivot.position);leaf.body.setNextKinematicTranslation(center);leaf.body.setNextKinematicRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle));}
    if(g.held?.spec.id==='mop'&&distance(p,PUDDLE)<2.2)this.water=Math.max(0,this.water-dt*.3);
    if(g.held?.spec.id==='cooler-box'&&distance(p,{x:-5.6,z:-1.8})<2){this.job.cooled=true;g.audio.tone(550,.1,.03);g.held=undefined;}
    const capacitor=this.prop('capacitor')!,capPos=capacitor.body.translation();this.circuit.loads.find(l=>l.id==='lift')!.capacitor!.atLoad=distance(capPos,{x:12,z:-4.8})<2;
    if(this.held?.cable.rating===10){const dolly=this.prop('thick-dolly')!,pos=dolly.body.translation(),d=distance(pos,p);if(d>1.3)dolly.body.setLinvel({x:(p.x-pos.x)*4,y:dolly.body.linvel().y,z:(p.z-pos.z)*4},true);}
    for(const cable of this.cables){
      for(const end of [0,1] as const){const port=this.ports.find(q=>q.id===cable.ports[end]);if(port)cable.ends[end].copy(port.pos);}
      if(this.held?.cable===cable)cable.ends[this.held.end].set(p.x+Math.sin(g.heading)*.6,p.y+.1,p.z+Math.cos(g.heading)*.6);
      const active=this.held?.cable===cable?this.held.end:1,other=(1-active) as 0|1;cable.rope.anchor=cable.ends[other];cable.points=cable.rope.update(cable.ends[active],g.level.obstacles);
      const port0=this.ports.find(q=>q.id===cable.ports[0]);const reversed=port0?.role==='in'||(port0?.role==='both'&&this.ports.find(q=>q.id===cable.ports[1])?.role==='out');
      cable.lead.from=(reversed?cable.ports[1]:cable.ports[0])??'';cable.lead.to=(reversed?cable.ports[0]:cable.ports[1])??'';cable.lead.closed=!!cable.lead.from&&!!cable.lead.to;
      const crossing=cable.points.slice(1).some((b,i)=>segmentDistance(PUDDLE,cable.points[i],b)<1.5);
      cable.lead.wet=this.water>.1&&crossing&&!this.bridgeNear(PUDDLE);
      if(this.doorWasOpen&&!open&&!wedged&&cable.points.slice(1).some((b,i)=>segmentHits(cable.points[i],b,{id:'door',minX:-1.4,maxX:1.4,minZ:-.15,maxZ:.45}))){cable.lead.dead=true;g.audio.tone(80,.2,.08,'sawtooth');g.burst(new T.Vector3(0,.5,.15),'#f7d967',10);g.alarm(DOOR);}
      if(cable.rope.strain>1.25&&cable.lead.closed){cable.ports[1]=null;cable.lead.closed=false;g.audio.tone(110,.2,.05);}
    }
    this.doorWasOpen=open;
    this.bots.forEach((bot,i)=>{const t=(g.time*.8+i*23)%46;const pos=t<19?new T.Vector3(-5+t,0,3):t<23?new T.Vector3(14,0,3+t-19):t<42?new T.Vector3(14-(t-23),0,7):new T.Vector3(-5,0,7-(t-42));
      bot.rotation.y=t<19?Math.PI/2:t<23?0:t<42?-Math.PI/2:Math.PI;bot.position.copy(pos);
      if(this.cooldown===0&&!this.bridgeNear(pos))for(const cable of this.cables)if(cable.lead.closed&&cable.points.slice(1).some((b,j)=>segmentDistance(pos,cable.points[j],b)<.35)){cable.ports[1]=null;cable.ends[1].copy(pos);this.cooldown=3;g.audio.tone(140,.2,.06);g.burst(pos.clone().setY(.3),'#f7d967',6);break;}
    });
    this.circuit.tick(dt);
    for(const event of this.circuit.events.slice(this.eventIndex)){
      if(event.kind==='trip'||event.kind==='short'){g.audio.tone(75,.25,.1,'square');const source=this.ports.find(q=>q.id===event.id);if(source){g.burst(source.pos.clone(),'#fff3a3',14);g.alarm(source.pos);}g.shake=.15;}
      if(event.kind==='scorch'){const cable=this.cables.find(c=>c.id===event.id);const at=cable?.points[Math.floor(cable.points.length/2)]??{x:0,z:0};g.audio.tone(60,.4,.08,'sawtooth');this.puff(new T.Vector3(at.x,.3,at.z));}
      if(event.kind==='start')g.audio.tone(event.id==='lift'?180:260,.15,.03,'triangle');
    }
    this.eventIndex=this.circuit.events.length;
    this.job.tick(dt,{oven:this.powered('oven'),fridge:this.powered('fridge'),conveyor:this.powered('conveyor'),lift:this.powered('lift')});
    const tray=this.prop('tray')!;
    if(this.job.tray==='baked'&&!tray.mesh.visible){tray.mesh.visible=true;tray.body.setEnabled(true);tray.body.setTranslation({x:-2.5,y:1,z:-6.4},true);g.audio.tone(700,.3,.06);g.burst(new T.Vector3(-2.5,1.2,-6.6),'#ffd27a',12);}
    if(g.held===tray)this.job.pickTray();
    if(this.job.tray==='carried'&&g.held!==tray&&distance(tray.body.translation(),{x:0,z:-7})<2){this.job.placeTray();tray.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);}
    if(['conveyor','lift','delivered'].includes(this.job.tray)){const along=this.job.transport;tray.body.setNextKinematicTranslation({x:along<1?-.5+along*12.5:12,y:1.18+this.job.height*2.5,z:-7});}
    if(this.job.tray==='burned'&&Math.random()<dt*3)this.puff(new T.Vector3(-2.7,2,-7.4));
    if(this.job.done&&!g.won)g.win();
    if(this.job.failed&&!g.won){g.won=true;const result=g.hud.querySelector<HTMLElement>('.result')!;result.hidden=false;result.innerHTML=`<div class="medal fail">${icon(this.job.tray==='burned'?'oven':'thermometer')}</div><button aria-label="Retry Lunch Rush">${icon('retry')}</button>`;result.querySelector('button')!.onclick=()=>location.reload();g.audio.tone(120,.7,.05,'triangle');document.body.dataset.failed='true';}
  }
  puff(at:T.Vector3){const m=part(this.game.root,sphere(.22,10,8),toon('#8d8a96'),at.x,at.y,at.z,false);m.userData.life=1.4;this.smoke.push(m);}
  render(dt:number){const g=this.game;
    for(const [i,m] of this.puddles.entries())m.scale.setScalar(Math.max(.001,this.water*(1-i*.02)));this.puddles.forEach(m=>m.scale.x*=1.4);this.dark.visible=!this.lit();
    for(const id of ['capacitor','cooler-box']){const prop=this.prop(id);if(prop)prop.mesh.visible=this.lit()||!this.inStore(prop.body.translation());}
    this.bakeGauge.set(this.job.bake/20);const oven=this.powered('oven');this.ovenWindow.material=oven?lit('#ffb35a','#ff8a2a',.6):toon('#3a3d55');this.ovenGlow.material.opacity=oven?.45:0;
    const temp=this.job.temperature;this.thermoFill.scale.y=Math.max(.02,temp);this.thermoFill.position.y=.68+Math.max(.02,temp)*.5;this.thermoFill.material=toon(temp>.8?'#e5484d':temp>.6?'#ff8a3d':'#ffc94d');
    this.sad.visible=temp>.8||(this.job.failed&&this.job.tray!=='burned');this.sad.position.y=2.9+Math.sin(g.time*6)*.05;
    if(this.powered('conveyor'))this.belt.offset.x-=dt*.2;
    this.liftCar.position.y=1.12+this.job.height*2.5;
    const lampTops:Record<string,T.Vector3>={'store-lamp':new T.Vector3(-10,1.9,-3),'kitchen-lamp':(()=>{const t=this.prop('portable-lamp')!.mesh;return new T.Vector3(0,.55,0).applyQuaternion(t.quaternion).add(t.position);})()};
    for(const [id,lamp] of this.lamps){const on=this.powered(id),top=lampTops[id];lamp.bulb.position.copy(top);lamp.bulb.material=on?lit('#fff3c8','#ffe7a8',1):toon('#bbb6a8');lamp.glow.position.copy(top);lamp.glow.material.opacity=on?.55:0;lamp.light.position.copy(top).setY(top.y+.2);lamp.light.intensity=on?14:0;}
    const lamp=this.prop('portable-lamp')!.mesh.position;const cordPts=[new T.Vector3(-4,.4,-3.15),new T.Vector3((lamp.x-4)/2,.05,(lamp.z-3.15)/2),new T.Vector3(lamp.x,.05,lamp.z)];
    if(distance(lamp,{x:-4,z:-3.15})>.3){this.cord.geometry.dispose();this.cord.geometry=new T.TubeGeometry(new T.CatmullRomCurve3(cordPts),24,.025,5);}
    for(const [id,{gauge,mount,button}] of this.supplyGauges){const prop=this.prop(`supply-${id}`)!,source=this.circuit.sources.find(s=>s.id===id)!,draw=this.circuit.draw.get(id)??0;
      gauge.set(source.tripped?1:draw/6);mount.position.copy(prop.mesh.position).add(new T.Vector3(.15,.75,-.05).applyQuaternion(prop.mesh.quaternion));mount.quaternion.copy(prop.mesh.quaternion);mount.rotateX(-.5);
      button.position.copy(prop.mesh.position).add(new T.Vector3(.56,.66,-.28).applyQuaternion(prop.mesh.quaternion));button.material=source.tripped?lit('#e5484d','#ff3a3a',.9+Math.sin(g.time*10)*.5):toon('#d63a3f');}
    const holding=!!this.held;
    for(const port of this.ports){port.ring.position.copy(port.pos);port.ring.position.y=Math.max(.05,port.pos.y-.25);const source=this.circuit.sources.find(s=>s.id===port.id);const material=port.ring.material as T.MeshBasicMaterial;
      material.color.set(source?.tripped?'#f35b66':'#63d8d0');material.opacity=holding?.95:.35;port.ring.visible=this.lit()||!this.inStore(port.pos);port.ring.scale.setScalar(holding?1+Math.sin(g.time*5)*.08:1);}
    for(const cable of this.cables){const active=this.held?.cable===cable?this.held.end:1;const pts=cable.points.map((p,i)=>new T.Vector3(p.x,i===0?cable.ends[(1-active) as 0|1].y:i===cable.points.length-1?cable.ends[active].y:.1,p.z));
      if(pts.length>1){const sampled:T.Vector3[]=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];for(let j=0;j<8;j++){const t=j/8,v=a.clone().lerp(b,t);v.y=Math.max(.09,v.y-Math.sin(t*Math.PI)*.35*Math.max(0,1-cable.rope.strain));sampled.push(v);}}sampled.push(pts.at(-1)!);cable.mesh.geometry.dispose();cable.mesh.geometry=new T.TubeGeometry(new T.CatmullRomCurve3(sampled),Math.max(24,sampled.length*2),cable.rating>3?.085:.045,5,false);}
      const heat=cable.lead.heat;(cable.mesh.material as T.MeshToonMaterial).color.set(cable.lead.dead?'#262833':heat>1.2?'#ff5a3a':heat>.4?'#ffa04a':this.held?.cable===cable?strainColor(cable.rope.strain):cable.rating>3?'#2b2d42':'#ecE8dc');
      (cable.mesh.material as T.MeshToonMaterial).emissive.set(heat>.4&&!cable.lead.dead?'#ff6a2a':'#000000');
      cable.plugs.forEach((plug,i)=>{plug.position.copy(cable.ends[i]);const toward=cable.points[i===0?1:cable.points.length-2];if(toward)plug.rotation.y=Math.atan2(-(toward.z-cable.ends[i].z),toward.x-cable.ends[i].x)+Math.PI;});
    }
    for(const m of [...this.smoke]){m.userData.life-=dt;m.position.y+=dt*.8;m.scale.setScalar(1+(1.4-m.userData.life));if(m.userData.life<=0){this.game.root.remove(m);this.smoke.splice(this.smoke.indexOf(m),1);}}
    if(this.held){g.rope=this.held.cable.rope;g.audio.strain(g.rope.strain);}else g.audio.strain(0);
    g.hud.querySelector('#oven-stage')?.classList.toggle('done',this.job.tray!=='raw');g.hud.querySelector('#belt-stage')?.classList.toggle('done',this.job.transport>=1);g.hud.querySelector('#lift-stage')?.classList.toggle('done',this.job.done);
    (g.hud.querySelector('#fridge-stage') as HTMLElement).style.color=temp>.8?'#e85c65':'#528979';
  }
  snapshot(){return {job:{...this.job},water:this.water,doorWedged:this.doorWedged(),lit:this.lit(),held:this.held?{id:this.held.cable.id,end:this.held.end}:null,sources:this.circuit.sources,loads:this.circuit.loads,cables:this.cables.map(c=>({id:c.id,ports:c.ports,ends:c.ends.map(p=>({x:p.x,y:p.y,z:p.z})),dead:c.lead.dead,heat:c.lead.heat,strain:c.rope.strain})),events:this.circuit.events};}
}
