import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from './game';
import {Circuit,type Lead,type Load} from './sim/electrical';
import {LunchJob} from './sim/lunch';
import {Rope,distance,segmentDistance,segmentHits,strainColor,type Point} from './sim/cable';
import {toon} from './render/toon';
import {makeProp} from './props/prefabs';
import {icon} from './render/icons';
type Port={id:string;role:'out'|'in'|'both';pos:T.Vector3;bodyId?:string;ring:T.Mesh;bars:T.Mesh[];capacity:number;hidden?:boolean};
type Cable={id:string;rating:number;ends:[T.Vector3,T.Vector3];ports:[string|null,string|null];rope:Rope;mesh:T.Mesh;plugs:[T.Group,T.Group];lead:Lead;points:Point[]};
export class LunchRuntime {
  circuit:Circuit;job=new LunchJob();ports:Port[]=[];cables:Cable[]=[];held?:{cable:Cable;end:0|1};
  puddle:T.Mesh;water=1;door:T.Group;doorBody:RAPIER.RigidBody;doorAngle=0;doorWasOpen=false;bots:T.Group[]=[];cooldown=0;
  dark:T.Mesh;ovenDial:T.Mesh;thermometer:T.Mesh;liftPlatform:T.Mesh;lampBulbs=new Map<string,T.Mesh>();eventIndex=0;
  constructor(public game:Game){
    game.ropeMesh.visible=false;game.plug.visible=false;game.target.visible=false;if(game.screen)game.screen.visible=false;
    const loads:Load[]=[['oven',3,0],['fridge',2,0],['conveyor',1.5,3],['lift',3,9],['kitchen-lamp',.5,0],['store-lamp',.5,0]].map(([id,steady,kick])=>({id:String(id),steady:Number(steady),kick:Number(kick),kickSeconds:1,enabled:!['conveyor','lift'].includes(String(id)),state:'off',started:0}));
    loads.find(l=>l.id==='lift')!.capacitor={atLoad:false,charge:12};
    const branches=['oven','kitchen-lamp','store-lamp'].map(id=>({id:`fixed-${id}`,from:'kitchen',to:id,rating:3,closed:true,heat:0,dead:false}));
    this.circuit=new Circuit([{id:'a',limit:5,tripped:false},{id:'b',limit:5,tripped:false}],branches,loads);
    this.buildMachines();
    this.port('a',-13,3,'out',2,'supply-a');this.port('b',-13,7,'out',2,'supply-b');this.port('kitchen',-4,-3,'in',1);
    this.port('fridge',-4,-1.8,'in',1);this.port('conveyor',5,-5,'in',1);this.port('lift',12,-4.8,'in',1);
    for(let i=1;i<=3;i++)this.port(`splitter-${i}`,-14+(i-1)*.7,0,'both',4,`splitter-${i}`);
    this.addCable('thin-1',3,32,'a',null,[-11,2]);this.addCable('thin-2',3,30,'a',null,[-10,3.5]);this.addCable('thin-3',3,32,null,null,[-11,7]);this.addCable('thick',10,30,'b',null,[-10,7.5]);
    this.puddle=new T.Mesh(new T.CircleGeometry(1.45,32),new T.MeshBasicMaterial({color:'#7fbdd2',transparent:true,opacity:.68,depthWrite:false}));this.puddle.rotation.x=-Math.PI/2;this.puddle.position.set(0,.05,1);this.puddle.scale.set(1,1.9,1);game.root.add(this.puddle);
    this.door=new T.Group();this.door.position.set(-1.5,0,.15);const doorMesh=new T.Mesh(new T.BoxGeometry(2.9,2.1,.12),toon('#6e989f'));doorMesh.position.set(1.45,1.05,0);this.door.add(doorMesh);game.root.add(this.door);
    this.doorBody=game.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,1.05,.15));game.world.createCollider(RAPIER.ColliderDesc.cuboid(1.45,1.05,.06),this.doorBody);
    this.dark=new T.Mesh(new T.PlaneGeometry(8.5,9.5),new T.MeshBasicMaterial({color:'#171b2a',transparent:true,opacity:.86,depthWrite:false}));this.dark.rotation.x=-Math.PI/2;this.dark.position.set(-12,2.6,-5);game.root.add(this.dark);
    this.ovenDial=this.meter(-2.5,1.7,-7.5,'#f7c758');this.thermometer=this.meter(-5.6,2.2,-1.8,'#ef8665');
    this.liftPlatform=game.box(2.7,.18,2.4,12,.2,-7,'#8994a5',false);
    for(let i=0;i<2;i++){const bot=new T.Group();const base=new T.Mesh(new T.CylinderGeometry(.42,.45,.25,20),toon('#e2dfcf'));base.position.y=.18;bot.add(base);const top=new T.Mesh(new T.SphereGeometry(.29,12,8),toon('#5ba4c8'));top.scale.y=.35;top.position.y=.33;bot.add(top);this.bots.push(bot);game.root.add(bot);}
    const path=[new T.Vector3(-5,.045,3),new T.Vector3(14,.045,3),new T.Vector3(14,.045,7),new T.Vector3(-5,.045,7),new T.Vector3(-5,.045,3)];const route=new T.Line(new T.BufferGeometry().setFromPoints(path),new T.LineDashedMaterial({color:'#64b6c3',dashSize:.25,gapSize:.3}));route.computeLineDistances();game.root.add(route);
    const tray=this.prop('tray');if(tray){tray.mesh.visible=false;tray.body.setEnabled(false);}
    game.hud.querySelector('.badge>svg')!.outerHTML=icon('tray');
    const objective=document.createElement('div');objective.className='lunch-chain';objective.innerHTML=`<span id="oven-stage">${icon('oven')}</span>${icon('arrow')}<span id="belt-stage">${icon('conveyor')}</span>${icon('arrow')}<span id="lift-stage">${icon('lift')}</span><span id="fridge-stage">${icon('thermometer')}</span>`;game.hud.append(objective);
  }
  prop(id:string){return this.game.props.find(p=>p.spec.id===id);}
  meter(x:number,y:number,z:number,color:string){const g=new T.Mesh(new T.BoxGeometry(.16,.65,.06),toon(color));g.position.set(x,y,z);this.game.root.add(g);return g;}
  buildMachines(){const g=this.game;
    g.box(15.5,.035,9.8,0,-.001,-5,'#a0b8a7',false);g.box(24,.025,9.7,4,.002,5,'#c3a16e',false);g.box(8,.028,9.7,12,.004,-5,'#747e90',false);
    g.box(2.2,2.2,1.4,-2.5,1.1,-8,'#c8c9b8');g.box(1.7,1.1,.06,-2.5,1.1,-7.25,'#333c4e',false);g.box(2.5,.35,1.7,-2.5,2.5,-8,'#78828b',false);
    g.box(1.4,2.5,1.2,-5.6,1.25,-2.3,'#d8ddcb');g.box(.08,.8,.12,-5.2,1.5,-1.65,'#5f7080',false);
    g.box(8.5,.22,1.3,3.5,1.05,-7,'#525f72');for(let x=-.5;x<8;x+=.35)g.box(.08,.02,1.2,x,1.18,-7,'#7d8b95',false);for(const x of [0,7])g.box(.18,1,.9,x,.5,-7,'#8397a3');
    for(const x of [10.6,13.4])g.box(.2,3.7,.2,x,1.85,-8,'#5d6a7c');g.box(3.2,.25,.5,12,3.6,-8,'#5d6a7c');
    for(const [id,x,z] of [['store-lamp',-10,-3],['kitchen-lamp',5,-3]] as const){if(id==='store-lamp')g.box(.08,1.4,.08,x,.7,z,'#607681');const lamp=new T.Mesh(new T.SphereGeometry(.35,14,8),toon('#5d6476'));lamp.position.set(x,1.5,z);g.root.add(lamp);this.lampBulbs.set(id,lamp);}
  }
  port(id:string,x:number,z:number,role:Port['role'],capacity:number,bodyId?:string){
    const ring=new T.Mesh(new T.TorusGeometry(.29,.065,8,20),new T.MeshBasicMaterial({color:'#61d8ce'}));ring.rotation.x=-Math.PI/2;this.game.root.add(ring);
    const bars:T.Mesh[]=[];const count=id==='a'||id==='b'?5:3;for(let i=0;i<count;i++){const m=new T.Mesh(new T.BoxGeometry(.12,.1,.25),toon('#334452'));bars.push(m);this.game.root.add(m);}
    this.ports.push({id,pos:new T.Vector3(x,.35,z),role,capacity,bodyId,ring,bars});
  }
  addCable(id:string,rating:number,length:number,from:string|null,to:string|null,loose:[number,number]){
    const ends:[T.Vector3,T.Vector3]=[from?this.ports.find(p=>p.id===from)!.pos.clone():new T.Vector3(loose[0]-.5,.18,loose[1]),to?this.ports.find(p=>p.id===to)!.pos.clone():new T.Vector3(loose[0],.18,loose[1])];
    const lead:Lead={id,from:from??'',to:to??'',rating,closed:!!from&&!!to,heat:0,dead:false};this.circuit.leads.push(lead);
    const mesh=new T.Mesh(new T.BufferGeometry(),toon(rating>3?'#efb931':'#efedda').clone());this.game.root.add(mesh);const plugs:[T.Group,T.Group]=[makeProp('coupler',rating>3?'#f6bd39':'#f2f0db'),makeProp('coupler',rating>3?'#f6bd39':'#f2f0db')];plugs.forEach(p=>this.game.root.add(p));
    this.cables.push({id,rating,ends,ports:[from,to],rope:new Rope(ends[0],length),mesh,plugs,lead,points:[]});
  }
  powered(id:string){return this.circuit.loads.find(l=>l.id===id)?.state==='on';}
  lit(){const lamp=this.lampBulbs.get('kitchen-lamp')!;return this.powered('store-lamp')||(this.powered('kitchen-lamp')&&lamp.position.x< -7.8);}
  canGrab(id?:string){return !['capacitor','cooler-box','shelf'].includes(id??'')||this.lit();}
  interact(cableOnly:boolean):boolean{
    const g=this.game,pos=g.player.translation();
    if(g.held)return false;
    if(this.held){const {cable,end}=this.held,other=(1-end) as 0|1;
      const candidates=this.ports.filter(p=>distance(pos,p.pos)<1.6&&p.id!==cable.ports[other]);
      const target=candidates.sort((a,b)=>distance(pos,a.pos)-distance(pos,b.pos))[0];
      if(target&&cable.rope.strain<1.1){
        const otherPort=this.ports.find(p=>p.id===cable.ports[other]);
        const count=this.cables.reduce((n,c)=>n+c.ports.filter(id=>id===target.id).length,0);
        const validRole=!otherPort||!(target.role==='out'&&otherPort.role==='out')&&!(target.role==='in'&&otherPort.role==='in');
        if(count<target.capacity&&validRole){cable.ports[end]=target.id;cable.ends[end].copy(target.pos);g.audio.tone(610,.13,.045);this.held=undefined;g.holdingPlug=false;return true;}
      }
      this.release();return true;
    }
    if(!cableOnly){
      if(this.job.tray==='baked'&&distance(pos,this.prop('tray')!.body.translation())<1.65)return false;
      const source=this.ports.find(p=>(p.id==='a'||p.id==='b')&&distance(pos,p.pos)<1.6&&this.circuit.sources.find(s=>s.id===p.id)!.tripped);
      if(source){this.circuit.resetBreaker(source.id);g.audio.tone(120,.1,.09,'square');return true;}
      const positions:Record<string,Point>={oven:{x:-2.5,z:-6.7},conveyor:{x:5,z:-5},lift:{x:12,z:-4.8},'store-lamp':{x:-10,z:-3}};
      const machine=Object.entries(positions).find(([,p])=>distance(pos,p)<1.25);
      if(machine){const load=this.circuit.loads.find(l=>l.id===machine[0])!;load.enabled=!load.enabled;g.audio.tone(load.enabled?320:160,.1,.04);return true;}
    }
    const nearby=this.cables.flatMap(c=>[0,1].map(end=>({c,end:end as 0|1,d:distance(pos,c.ends[end])}))).filter(v=>v.d<1.75).sort((a,b)=>a.d-b.d)[0];
    if(nearby){const {c,end}=nearby;if(c.lead.dead){c.lead.dead=false;c.lead.heat=0;g.cost+=15;g.audio.tone(400,.15);return true;}c.ports[end]=null;this.held={cable:c,end};g.holdingPlug=true;return true;}
    return false;
  }
  release(){if(!this.held)return;const {cable,end}=this.held;const energy=cable.rope.release();if(energy>1){this.game.shake=.3;this.game.audio.tone(90,.3,.1,'sawtooth');for(const prop of this.game.props){const p=prop.body.translation();if(cable.points.slice(1).some((b,i)=>segmentDistance(p,cable.points[i],b)<.8))prop.body.applyImpulse({x:10,y:Math.min(25,energy*.2),z:5},true);}}
    cable.ends[end].y=.15;this.held=undefined;this.game.holdingPlug=false;
  }
  pull(){if(!this.held)return {x:0,z:0};return this.held.cable.rope.pull(this.game.player.translation());}
  bridgeNear(p:Point){return this.game.props.some(prop=>prop.spec.kind==='bridge'&&distance(prop.body.translation(),p)<1.15&&prop.body.translation().y<.6);}
  step(dt:number){const g=this.game,p=g.player.translation();this.cooldown=Math.max(0,this.cooldown-dt);
    for(const port of this.ports)if(port.bodyId){const prop=this.prop(port.bodyId);if(prop){const pos=prop.body.translation();port.pos.set(pos.x,pos.y+.45,pos.z);}}
    const wedge=this.prop('wedge')!,wedgePos=wedge.body.translation(),wedged=g.held!==wedge&&distance(wedgePos,{x:0,z:.5})<1.7&&wedgePos.y<1.2;
    const open=wedged||distance(p,{x:0,z:.1})<2.1;this.doorAngle=T.MathUtils.lerp(this.doorAngle,open?Math.PI*.94:0,dt*5);this.door.rotation.y=this.doorAngle;
    const doorCenter=new T.Vector3(1.45,1.05,0).applyAxisAngle(new T.Vector3(0,1,0),this.doorAngle).add(this.door.position);this.doorBody.setNextKinematicTranslation(doorCenter);this.doorBody.setNextKinematicRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),this.doorAngle));
    if(g.held?.spec.id==='mop'&&distance(p,{x:0,z:1})<2)this.water=Math.max(0,this.water-dt*.3);
    if(g.held?.spec.id==='cooler-box'&&distance(p,{x:-5.6,z:-1.8})<2){this.job.cooled=true;g.audio.tone(550,.1,.03);g.held=undefined;}
    const capacitor=this.prop('capacitor')!,capPos=capacitor.body.translation();this.circuit.loads.find(l=>l.id==='lift')!.capacitor!.atLoad=distance(capPos,{x:12,z:-4.8})<2;
    if(this.held?.cable.rating===10){const dolly=this.prop('thick-dolly')!,pos=dolly.body.translation();dolly.body.setLinvel({x:(p.x-pos.x)*5,y:dolly.body.linvel().y,z:(p.z-pos.z)*5},true);}
    const lampPos=this.prop('portable-lamp')!.body.translation();this.lampBulbs.get('kitchen-lamp')!.position.set(lampPos.x,lampPos.y+.7,lampPos.z);
    for(const cable of this.cables){
      for(const end of [0,1] as const){const port=this.ports.find(p=>p.id===cable.ports[end]);if(port)cable.ends[end].copy(port.pos);}
      if(this.held?.cable===cable)cable.ends[this.held.end].set(p.x+Math.sin(g.heading)*.6,p.y+.1,p.z+Math.cos(g.heading)*.6);
      const active=this.held?.cable===cable?this.held.end:1,other=(1-active) as 0|1;cable.rope.anchor=cable.ends[other];cable.points=cable.rope.update(cable.ends[active],g.level.obstacles);
      const port0=this.ports.find(p=>p.id===cable.ports[0]);const reversed=port0?.role==='in'||(port0?.role==='both'&&this.ports.find(p=>p.id===cable.ports[1])?.role==='out');
      cable.lead.from=(reversed?cable.ports[1]:cable.ports[0])??'';cable.lead.to=(reversed?cable.ports[0]:cable.ports[1])??'';cable.lead.closed=!!cable.lead.from&&!!cable.lead.to;
      const crossing=cable.points.slice(1).some((b,i)=>segmentDistance({x:0,z:1},cable.points[i],b)<1.5);
      cable.lead.wet=this.water>.1&&crossing&&!this.bridgeNear({x:0,z:1});
      if(this.doorWasOpen&&!open&&!wedged&&cable.points.slice(1).some((b,i)=>segmentHits(cable.points[i],b,{id:'door',minX:-1.4,maxX:1.4,minZ:-.15,maxZ:.45}))){cable.lead.dead=true;g.audio.tone(80,.2,.08,'sawtooth');g.burst(new T.Vector3(0,.5,.15),'#f7d967',10);}
      if(cable.rope.strain>1.25&&cable.lead.closed){cable.ports[1]=null;cable.lead.closed=false;g.audio.tone(110,.2,.05);}
    }
    this.doorWasOpen=open;
    this.bots.forEach((bot,i)=>{const t=(g.time*.8+i*23)%46;const pos=t<19?new T.Vector3(-5+t,.05,3):t<23?new T.Vector3(14,.05,3+t-19):t<42?new T.Vector3(14-(t-23),.05,7):new T.Vector3(-5,.05,7-(t-42));bot.position.copy(pos);
      if(this.cooldown===0&&!this.bridgeNear(pos))for(const cable of this.cables)if(cable.lead.closed&&cable.points.slice(1).some((b,j)=>segmentDistance(pos,cable.points[j],b)<.35)){cable.ports[1]=null;cable.ends[1].copy(pos);this.cooldown=3;g.audio.tone(140,.2,.06);break;}
    });
    this.circuit.tick(dt);
    for(const event of this.circuit.events.slice(this.eventIndex)){if(event.kind==='trip'||event.kind==='short'||event.kind==='scorch'){g.audio.tone(75,.2,.08,'square');const source=this.ports.find(p=>p.id===event.id);g.burst(source?.pos??new T.Vector3(0,.4,0),'#898b91',8);}}
    this.eventIndex=this.circuit.events.length;
    this.job.tick(dt,{oven:this.powered('oven'),fridge:this.powered('fridge'),conveyor:this.powered('conveyor'),lift:this.powered('lift')});
    const tray=this.prop('tray')!;
    if(this.job.tray==='baked'&&!tray.mesh.visible){tray.mesh.visible=true;tray.body.setEnabled(true);tray.body.setTranslation({x:-2.5,y:1,z:-6.4},true);g.audio.tone(700,.3,.06);}
    if(g.held===tray)this.job.pickTray();
    if(this.job.tray==='carried'&&g.held!==tray&&distance(tray.body.translation(),{x:0,z:-7})<2){this.job.placeTray();tray.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);}
    if(['conveyor','lift','delivered'].includes(this.job.tray)){const along=this.job.transport;tray.body.setNextKinematicTranslation({x:along<1?along*12:12,y:1.3+this.job.height*2.5,z:-7});}
    if(this.job.done&&!g.won)g.win();
    if(this.job.failed&&!g.won){g.won=true;const result=g.hud.querySelector<HTMLElement>('.result')!;result.hidden=false;result.innerHTML=`<div class="medal">${icon(this.job.tray==='burned'?'oven':'thermometer')}</div><button aria-label="Retry Lunch Rush">${icon('retry')}</button>`;result.querySelector('button')!.onclick=()=>location.reload();g.audio.tone(120,.7,.05,'triangle');}
  }
  render(){const g=this.game;
    this.puddle.scale.set(this.water,1.9*this.water,1);this.dark.visible=!this.lit();
    for(const id of ['capacitor','cooler-box','shelf']){const prop=this.prop(id);if(prop)prop.mesh.visible=this.lit();}
    this.ovenDial.scale.y=Math.max(.02,this.job.bake/20);this.thermometer.scale.y=Math.max(.02,this.job.temperature);(this.thermometer.material as T.MeshToonMaterial).color.set(this.job.temperature>.8?'#ee5360':'#76c7aa');
    this.liftPlatform.position.y=1.1+this.job.height*2.5;
    for(const [id,lamp] of this.lampBulbs)lamp.material=toon(this.powered(id)?'#ffe399':'#5d6476');
    for(const port of this.ports){port.ring.position.copy(port.pos);const source=this.circuit.sources.find(s=>s.id===port.id);(port.ring.material as T.MeshBasicMaterial).color.set(source?.tripped?'#f35b66':'#63d8d0');port.bars.forEach((bar,i)=>{bar.position.set(port.pos.x+(i-(port.bars.length-1)/2)*.2,port.pos.y+.2,port.pos.z-.35);bar.material=toon((this.circuit.draw.get(port.id)??0)>i?'#ffcd55':'#384858');});}
    for(const cable of this.cables){const active=this.held?.cable===cable?this.held.end:1;const pts=cable.points.map((p,i)=>new T.Vector3(p.x,i===0?cable.ends[(1-active) as 0|1].y:i===cable.points.length-1?cable.ends[active].y:.1,p.z));
      if(pts.length>1){const sampled:T.Vector3[]=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];for(let j=0;j<8;j++){const t=j/8,v=a.clone().lerp(b,t);v.y=Math.max(.09,v.y-Math.sin(t*Math.PI)*.35);sampled.push(v);}}sampled.push(pts.at(-1)!);cable.mesh.geometry.dispose();cable.mesh.geometry=new T.TubeGeometry(new T.CatmullRomCurve3(sampled),Math.max(24,sampled.length*2),cable.rating>3?.085:.045,5,false);}
      (cable.mesh.material as T.MeshToonMaterial).color.set(cable.lead.dead?'#333849':cable.lead.heat>.5?'#ff773f':this.held?.cable===cable?strainColor(cable.rope.strain):cable.rating>3?'#e4b94a':'#efedda');
      cable.plugs.forEach((plug,i)=>plug.position.copy(cable.ends[i]));
    }
    if(this.held){g.rope=this.held.cable.rope;g.audio.strain(g.rope.strain);}else g.audio.strain(0);
    g.hud.querySelector('#oven-stage')?.classList.toggle('done',this.job.tray!=='raw');g.hud.querySelector('#belt-stage')?.classList.toggle('done',this.job.transport>=1);g.hud.querySelector('#lift-stage')?.classList.toggle('done',this.job.done);
    (g.hud.querySelector('#fridge-stage') as HTMLElement).style.color=this.job.temperature>.8?'#e85c65':'#528979';
  }
  snapshot(){return {job:{...this.job},water:this.water,doorWedged:distance(this.prop('wedge')!.body.translation(),{x:0,z:.5})<1.7,lit:this.lit(),held:this.held?{id:this.held.cable.id,end:this.held.end}:null,sources:this.circuit.sources,loads:this.circuit.loads,cables:this.cables.map(c=>({id:c.id,ports:c.ports,ends:c.ends.map(p=>({x:p.x,y:p.y,z:p.z})),dead:c.lead.dead,heat:c.lead.heat,strain:c.rope.strain})),events:this.circuit.events};}
}
