// Via service counter (Via Foundry). Customers bring pictorial orders to the window; Pip builds
// each via on the counter: pick the layers, press the stack, drill, plate, set the pad, pick a
// finish, test, and serve. The fixture shows a cutaway of the board (not to scale), so every
// choice is visible in copper. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressViaFoundry} from './room';
import {toon,box,cyl,sphere,part,group,glow,canvasTex,INK,DMETAL} from '../../render/kit';
import {hot} from '../../render/actors';
import {equipment} from './equipment';
import {CELLS,cellFor,type Workcell} from './workflow';
import {DeviceFixture} from './devices';
import {sectionSlab,sectionBarrel,CHOICES} from './section';
import {sectionLayout} from './sectionLayout';
import {rng} from '../../render/textures';
import {SHIFT,rushOrder,PADS,FINISHES,PROFILE,blank,judge,kindOf,ring,cost,cheapest,drillSize,isLaser,type Build,type Drill,type Finish,type Layer,type Order,type Verdict} from './logic';

const COPPER='#e98a42',PREPREG='#b7c77c',CORE='#86ad64',MASK='#2f9a62',FILL='#9aa0ad';
// Display thicknesses (world units) for the cutaway, top to bottom: L1, prepreg, L2, core, L3, prepreg, L4.
const SLABS:{kind:'cu'|'pp'|'core';layer?:Layer;h:number;group:number}[]=[
  {kind:'cu',layer:1,h:.028,group:0},{kind:'pp',h:.05,group:1},{kind:'cu',layer:2,h:.028,group:2},{kind:'core',h:.15,group:2},{kind:'cu',layer:3,h:.028,group:2},{kind:'pp',h:.05,group:3},{kind:'cu',layer:4,h:.028,group:4}];
const BOARD_W=1.2,BOARD_D=.7,BASE_Y=.14,GAP=.06;
const DRILL_NAMES:Record<Drill,string>={'mech-0.30':'0.30 mm bit','mech-0.20':'0.20 mm bit','laser-0.10':'Laser 0.10 mm'};
const FINISH_NAMES:Record<Finish,string>={open:'Open','tented':'Tented','plugged':'Plugged','filled-capped':'Filled + capped'};
/** Rush mode: a three-minute shift of endless orders; each customer waits this long. */
export const RUSH_TIME=180,PATIENCE=50;
const KIND_NAMES={through:'through via',buried:'buried via',micro:'microvia',blind:'blind via'};
const GLOW_OK=hot('#ffe36e',1.4),GLOW_BAD=hot('#ff6b6b',1.2);
const countLabels=new Map<number,T.Texture>();
const countLabel=(n:number)=>{let t=countLabels.get(n);if(!t){t=label(`×${n}`,'#fffaf0',INK,128,80);countLabels.set(n,t);}return t;};

/** Label decal texture for the counter (short words are fine now: see PROGRESS "on-screen text"). */
function makeLabel(text:string,bg='#fffaf0',fg=INK,w=256,h=80){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,18);c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    // Shrink the type until the words fit the plate.
    let size=Math.round(h*.46);const font=(n:number)=>`700 ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;c.font=font(size);while(size>10&&c.measureText(text).width>w-30){size--;c.font=font(size);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);});
}
const labelCache=new Map<string,T.Texture>();
function label(text:string,bg='#fffaf0',fg=INK,w=256,h=80){const key=JSON.stringify([text,bg,fg,w,h]);let t=labelCache.get(key);if(!t){t=makeLabel(text,bg,fg,w,h);labelCache.set(key,t);}return t;}
function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,w=.46,tilt=-.75,bg?:string,fg?:string){
  const m=new T.MeshBasicMaterial({map:label(text,bg,fg),transparent:true});m.userData.outlineParameters={visible:false};m.userData.transient=true;
  const p=part(parent,new T.PlaneGeometry(w,w*80/256),m,x,y,z,false);p.rotation.x=tilt;p.userData.noAO=true;return p;
}
/** Order ticket art: the 4-layer stack with the span to join, plus badges. */
function ticketTexture(o:Order){
  return canvasTex(256,256,c=>{c.fillStyle='#fffaf0';c.beginPath();c.roundRect(8,8,240,240,26);c.fill();c.lineWidth=10;c.strokeStyle=INK;c.stroke();
    const ys=[64,96,160,192];ys.forEach((y,i)=>{c.fillStyle=COPPER;c.fillRect(40,y-7,140,14);c.fillStyle=INK;c.font='700 26px system-ui';c.fillText(`L${i+1}`,190,y+9);});
    c.fillStyle='rgba(134,173,100,.5)';c.fillRect(40,71,140,18);c.fillRect(40,103,140,50);c.fillRect(40,167,140,18);
    const a=ys[Math.min(o.from,o.to)-1],b=ys[Math.max(o.from,o.to)-1],n=o.stitch?3:1;
    for(let k=0;k<n;k++){const x=n>1?70+k*40:110;c.fillStyle='#ffc629';c.fillRect(x-9,a-12,18,b-a+24);c.strokeStyle=INK;c.lineWidth=5;c.strokeRect(x-9,a-12,18,b-a+24);}
    let bx=26;const badge=(t:string,col:string)=>{c.fillStyle=col;c.beginPath();c.roundRect(bx,212,t.length*15+18,30,12);c.fill();c.fillStyle='#fffaf0';c.font='700 20px system-ui';c.fillText(t,bx+9,234);bx+=t.length*15+26;};
    if(o.inPad)badge('PAD','#e5484d');if(o.maxPad)badge('FINE','#3f7fd6');if(o.covered)badge('SHIELD','#6b7385');if(o.stitch)badge(`×${o.stitch}`,'#2f9a62');
  });
}

interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
export class ViaCounter implements Station {
  readonly view={distance:7.8,pitch:.7,lookY:.3,lookX:.2};
  readonly limits={time:420,damage:1,cost:0};
  readonly stand={x:0,z:-.85};readonly inspectionTable=new T.Vector3(0,1,-2.45);readonly table=this.inspectionTable.clone();get facing(){const c=CELLS[this.cell];return Math.atan2(c.table.x-c.at.x,c.table.z-c.at.z);}
  readonly showsWorker=true;private actionTime=0;private actionKind='inspect';
  private cell:Workcell='inspect';private machines!:ReturnType<typeof equipment>;private devices!:DeviceFixture;private plateAnim=0;private help='layers';private gesture?:{kind:'press'|'plate'|'drill';plane:T.Plane;startY:number;progress:number};
  build:Build=blank();order=0;served:{order:string;verdict:Verdict}[]=[];mistakes=0;spent=0;blanksReady=true;active=false;
  private root=new T.Group();private boardGroup=new T.Group();private viaGroup=new T.Group();private press=0;private pressTarget=0;
  private clickables:Clickable[]=[];private hovered?:Clickable;private drillHead=new T.Group();private drillAnim=0;private testGlow=0;private testOk=false;
  private tabs:T.Mesh[]=[];private padButtons:T.Mesh[]=[];private finishJars:T.Mesh[]=[];private bitButtons:T.Mesh[]=[];private countText!:T.Mesh;
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';private bubble!:T.Sprite;private leaving:{g:T.Group;t:number}[]=[];
  private crate?:Game['props'][number];
  readonly job:StationJob;
  /** Rush (level vias-rush) keeps generating orders; the story shift is the fixed five. */
  readonly rush:boolean;private orders:Order[];private random=rng(20260929);misses=0;patience=PATIENCE;
  constructor(private game:Game){
    this.rush=game.level.id==='vias-rush';this.orders=this.rush?[]:[...SHIFT];
    this.limits.cost=this.rush?9:Math.ceil(SHIFT.reduce((n,o)=>n+(cheapest(o)?.cost??0),0)*1.25);
    // Rush always runs the full shift, so its time row can't be failed.
    if(this.rush){this.limits.damage=2;this.limits.time=RUSH_TIME+10;}
    this.job=this.rush?{goal:`Via Rush: serve as many orders as you can in ${RUSH_TIME/60} minutes`,
      steps:[
        {text:'Inspect the customer board requirements',done:()=>this.active||this.served.length>0,at:()=>CELLS.inspect.at},
        {text:'Step up to the via counter (E)',done:()=>this.active||this.served.length>0,at:()=>this.stand},
        {text:'Serve 3 orders',done:()=>this.served.length>=3},{text:'Serve 6 orders',done:()=>this.served.length>=6},
        {text:'Keep serving until the whistle',done:()=>this.complete()}],
      bonuses:[{text:'Serve 8 orders',ok:()=>this.served.length>=8},{text:'Every via works reliably',ok:()=>this.served.every(s=>s.verdict.tier>=2)},{text:'Nobody gives up waiting',ok:()=>this.misses===0}]}:
    {goal:'Run the via counter: fill five customer orders',
      steps:[
        {text:'Inspect the customer board requirements',done:()=>this.active||this.served.length>0,at:()=>CELLS.inspect.at},
        {text:'Step up to the via counter (E)',done:()=>this.active||this.served.length>0,at:()=>this.stand},
        ...SHIFT.map((o,i)=>({text:`Order ${i+1} · ${o.customer}: ${this.orderTitle(o)}`,done:()=>this.served.length>i,at:()=>CELLS.inspect.at}))],
      bonuses:[
        {text:'Every via works reliably',ok:()=>this.served.every(s=>s.verdict.tier>=2)},
        {text:'Elegant: no process a via didn\'t need',ok:()=>this.served.every(s=>s.verdict.tier===3)},
        {text:'No sample sent back',ok:()=>this.mistakes===0}]};
    game.root.add(this.root);
    this.buildCounter();this.redraw();
  }
  dress(kit:RoomKit){return dressViaFoundry(this.game,kit);}
  /** Coworkers and props are added after the room, so the queue is set up on the first update. */
  private ready=false;
  private setup(){this.ready=true;this.crate=this.game.props.find(p=>p.spec.id==='blanks');this.buildQueue();this.setActive(false);}
  orderTitle(o:Order){const k=kindOf(o.from,o.to);return `L${o.from}→L${o.to} ${KIND_NAMES[k]}${o.inPad?' in a pad':''}${o.stitch?`, row of ${o.stitch}`:''}`;}
  current():Order|undefined{if(this.rush){if(this.complete())return undefined;while(this.orders.length<=this.order+5)this.orders.push(rushOrder(this.random,this.orders.length));}return this.orders[this.order];}
  /** The coworker playing the customer for an order (rush reuses the five in a loop). */
  private customer(i:number){const n=this.game.npcs;return this.rush?n[i%5]:n[i];}

  // ---------- the counter ----------
  private buildCounter(){
    const g=this.game,t=this.inspectionTable,top=group(this.root,t.x,t.y,t.z);
    // Counter body, worktop, and the glass service window behind it.
    part(g.decorRoot,box(6.2,1,1.7),toon('#e0cfb0'),t.x,.5,t.z);part(g.decorRoot,box(6.3,.08,1.8),toon('#f4ead6'),t.x,1.0,t.z);part(g.decorRoot,box(6.22,.1,.04),toon('#c98a55'),t.x,.95,t.z+.57);
    this.solid(6.2,1.05,1.7,t.x,.52,t.z);
    sign(g.root,'SAMPLE INSPECTION',t.x,1.7,t.z-.8,1.8,0,'#d1dfd3');
    // Fixture: a vice-like base under the cutaway board, with the layer tabs on its left.
    part(top,box(1.8,.1,.7),toon('#3a3d55'),0,.05,0);part(top,box(1.7,.02,.02),toon('#ffc629'),0,.1,.3);
    for(const x of [-.8,.8])part(top,box(.06,.5,.06),toon(DMETAL),x,.3,-.2);
    top.add(this.boardGroup);this.boardGroup.scale.setScalar(1.65);this.boardGroup.add(this.viaGroup);
    sign(top,'CUTAWAY · NOT TO SCALE',0,.08,.4,.7);
    SLABS.forEach((s,i)=>{if(s.kind!=='cu')return;const tab=part(top,box(.2,.07,.14),toon('#fffaf0'),-.96,0,.1);tab.userData.slab=i;this.tabs.push(tab);this.click(tab,'layer',s.layer);
      const tl=sign(tab,`L${s.layer}`,0,0,.072,.2,0);tl.position.set(0,0,.072);});
    // Full-size physical equipment in separate work areas; none of these process
    // controls remain available remotely from the inspection counter.
    this.machines=equipment(g,(obj,act,arg)=>this.click(obj,act,arg));
    this.devices=new DeviceFixture(g,(obj,act)=>this.click(obj,act));
    this.drillHead=this.machines.drillHead;this.bitButtons=this.machines.bits;
    const scrap=group(top,-2.35,0,.1);part(scrap,cyl(.2,.18,.4,18),toon('#6b7385'),0,.2,0);this.click(scrap,'scrap');sign(top,'SCRAP',-2.35,.1,.5,.5);
    // Right tools: pad sizes, finish jars, stitch row count, tester, serve bell.
    PADS.forEach((p,k)=>{const b=part(top,cyl(p*.28,p*.28,.03,24),toon(COPPER),1.05+k*.25,.015,.05);b.userData.pad=p;this.padButtons.push(b);this.click(b,'pad',p);});
    sign(top,'PAD 0.30 · 0.45 · 0.60',1.3,.08,.38,.85);
    FINISHES.forEach((f,k)=>{const jar=group(top,1.8+(k%2)*.25,0,-.12+Math.floor(k/2)*.18);const m=part(jar,cyl(.055,.055,.12,16),toon(f==='open'?'#fffaf0':f==='tented'?MASK:f==='plugged'?FILL:COPPER),0,.06,0);part(jar,cyl(.058,.058,.025,16),toon(INK),0,.13,0);this.finishJars.push(m);this.click(jar,'finish',f);});
    sign(top,'FINISH',1.92,.08,.4,.5);
    const row=group(top,2.45,0,.56);for(const [x,a] of [[-.12,-1],[.12,1]] as const){const b=part(row,box(.09,.05,.09),toon(a>0?'#6cc58a':'#e5484d'),x,.025,0);this.click(b,'count',a);}
    this.countText=part(row,new T.PlaneGeometry(.12,.08),new T.MeshBasicMaterial({map:label('×1','#fffaf0',INK,128,80),transparent:true}),0,.06,0,false);this.countText.rotation.x=-1.1;(this.countText.material as T.Material).userData.outlineParameters={visible:false};
    sign(top,'ROW',2.45,.08,.73,.3,-.75);
    // The crate of blanks sits at the counter's end once delivered.
    part(g.decorRoot,box(.9,.06,.8),toon('#c98a55'),t.x+2.75,.9,t.z);
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}

  // ---------- customers ----------
  private buildQueue(){
    this.bubble=new T.Sprite(new T.SpriteMaterial({map:ticketTexture(this.current()??SHIFT[0]),depthTest:false}));this.bubble.scale.set(.75,.75,1);this.bubble.renderOrder=9;this.game.root.add(this.bubble);
    this.placeQueue(true);
  }
  private placeQueue(instant=false){
    for(let k=0;k<5;k++){const i=this.order+k,n=this.customer(i);if(!n||(!this.rush&&i>=this.orders.length))continue;const x=k===0?6.6:8.4+k*.9,z=k===0?-2.9:-3.8;
      n.group.userData.goal=new T.Vector3(x,0,z);n.restYaw=0;if(instant)n.group.position.set(x,0,z);}
    const o=this.current(),cur=o&&this.customer(this.order);this.bubble.visible=!!cur;if(o&&cur)(this.bubble.material as T.SpriteMaterial).map=ticketTexture(o);this.patience=PATIENCE;
  }

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const b=this.build,o=this.current(),a=this.game.audio;
    if(!o)return false;
    if(!this.active||cellFor(name)!==this.cell){this.say(`Use ${CELLS[cellFor(name)].label} in the room for this operation.`);return false;}
    if(!this.blanksReady&&name!=='test'){this.say('No board blanks yet: bring the crate from the rack to the counter.');a.voice('hm',1.4);return false;}
    switch(name){
      case 'layer':{const l=arg as Layer;if(b.drill){this.say('Already drilled. Scrap the blank to start a different via.');return false;}
        if(b.from===undefined||b.to!==undefined){b.from=l;b.to=undefined;}else if(l===b.from){b.from=undefined;}else b.to=l;
        a.tone(500+l*80,.06,.04,'triangle');break;}
      case 'press':{if(b.pressed){this.say('The stack is already pressed.');return false;}b.pressed=true;this.pressTarget=1;a.thud(8);a.noise(.4,.05,500);break;}
      case 'bit':{this.bit=arg as Drill;a.tone(700,.05,.03);break;}
      case 'drill':{if(b.from===undefined||b.to===undefined){this.say('Click two layer tabs (L1–L4) to choose what the via joins.');return false;}
        if(b.drill){this.say('This blank already has its hole. Scrap it to try again.');return false;}
        b.drill=this.bit;b.drilledPressed=b.pressed;this.drillAnim=1;if(isLaser(b.drill)){a.tone(1800,.25,.03,'sawtooth');}else{a.noise(.5,.06,1800,'bandpass');a.tone(140,.5,.03,'sawtooth');}
        const at=this.inspectionTable.clone().add(new T.Vector3(0,.5,0));this.game.burst(at,isLaser(b.drill)?'#ff8a8a':'#fff3a3',10,'spark');break;}
      case 'plate':{if(!b.drill){this.say('Drill the hole first, then plate its barrel.');return false;}if(b.plated){this.say('Already plated.');return false;}b.plated=true;b.platedPressed=b.pressed;this.plateAnim=1;a.noise(.6,.03,900,'lowpass');a.bell(660,.4,.03,.3);break;}
      case 'pad':{b.pad=arg as number;a.tone(420+(b.pad*400),.06,.04,'triangle');break;}
      case 'finish':{const f=arg as Finish;if(f!=='open'&&!b.plated){this.say('Finish comes after plating.');return false;}b.finish=f;a.pop();break;}
      case 'count':{b.count=Math.max(1,Math.min(8,b.count+(arg as number)));a.tone(b.count*90+300,.05,.03);break;}
      case 'test':{const v=this.verdict();this.devices.test(v.tier);this.testGlow=1.2;this.testOk=v.tier>0;
        this.say(v.tier>0?`${['','Works','Works reliably','Works reliably · elegant'][v.tier]}. ${v.notes[0]??''}`:v.problems.slice(0,2).join(' '),v.tier>0?'ok':'bad');
        if(v.tier>0)a.bell(1175,.4,.04);else a.tone(160,.25,.06,'square');break;}
      case 'serve':{const v=this.verdict();this.devices.test(v.tier);
        if(v.tier===0){this.returned=true;this.mistakes++;this.spent+=v.cost;this.say(`${o.customer} sends it back: ${v.problems[0]}`,'bad');a.voice('groan',1);this.game.alarm({x:this.inspectionTable.x,z:this.inspectionTable.z-1.2},2);return true;}
        this.served.push({order:o.id,verdict:v});this.spent+=v.cost;
        this.say(`${o.customer}: “${['','Thanks!','Lovely work.','Perfect, and cheap too!'][v.tier]}” · ${['','Works','Reliable','Elegant'][v.tier]}${v.notes[0]?` · ${v.notes[0]}`:''}`,'ok');
        a.cheer();a.bell(1319,.5,.05);this.sendOff(this.order);
        this.game.burst(this.inspectionTable.clone().add(new T.Vector3(0,.8,-1)),'#ffcf52',30,'confetti');
        this.returned=false;this.order++;this.build=blank();this.press=0;this.pressTarget=0;this.placeQueue();break;}
      case 'scrap':{this.returned=false;if(b.drill)this.spent+=cost(b);this.build=blank();this.press=0;this.pressTarget=0;a.thud(2);a.clatter();break;}
      default:return false;
    }
    this.actionTime=1;this.actionKind=name;this.redraw();this.updatePanel();if(name==='test')this.glowVia();return true;
  }
  /** Test result: the via's copper lights gold if the layers connect, red if not. */
  private glowVia(){const m=this.testOk?GLOW_OK:GLOW_BAD;this.viaGroup.traverse(o=>{if(o instanceof T.Mesh){if(!Array.isArray(o.material)&&o.material.userData.transient)o.material.dispose();o.material=m;}});}
  private bit:Drill='mech-0.30';private returned=false;
  /** A served (or fed-up) customer walks off to the right; in rush they rejoin the back of the queue. */
  private sendOff(i:number){const npc=this.customer(i);if(npc){npc.alarm=0;this.leaving.push({g:npc.group,t:0});}}
  verdict(){return judge(this.current()!,this.build);}

  // ---------- drawing ----------
  private slabY(i:number){let y=BASE_Y;for(let k=SLABS.length-1;k>i;k--)y+=SLABS[k].h+(SLABS[k].group!==SLABS[k-1].group?GAP*(1-this.press):0);return y+SLABS[i].h/2;}
  private layerY(l:Layer){return this.slabY(SLABS.findIndex(s=>s.layer===l));}
  redraw(){
    const o=this.current();if(o)this.devices.order(o);const b=this.build;
    const clear=(g:T.Group,keep?:T.Object3D)=>{for(const c of [...g.children]){if(c===keep)continue;c.traverse(o=>{if(o instanceof T.Mesh){if(o.geometry.userData.transient)o.geometry.dispose();if(!Array.isArray(o.material)&&o.material.userData.transient)o.material.dispose();}});g.remove(c);}};
    clear(this.boardGroup,this.viaGroup);clear(this.viaGroup);
    const layout=sectionLayout(b.count,BOARD_W),xs=layout.xs;
    const lo=Math.min(b.from??1,b.to??1) as Layer,hi=Math.max(b.from??1,b.to??1) as Layer,r=b.drill?drillSize(b.drill)*layout.scale/2:0;
    SLABS.forEach((s,i)=>{
      const layer=SLABS.findIndex(q=>q.layer===lo),end=SLABS.findIndex(q=>q.layer===hi);
      const holes=b.drill&&i>=layer&&i<=end?xs.map(x=>({x,r})):[];
      const col=s.kind==='cu'?COPPER:s.kind==='pp'?PREPREG:CORE,inSpan=s.layer&&(s.layer===b.from||s.layer===b.to);
      const material=toon(inSpan?'#ffb35a':col).clone();material.side=T.DoubleSide;material.userData.transient=true;material.userData.outlineParameters={visible:false};
      const m=part(this.boardGroup,sectionSlab(BOARD_W,BOARD_D,s.h,holes),material,0,this.slabY(i),0);m.userData.slab=i;m.name=`section-${i}`;
      if(s.layer)sign(this.boardGroup,`L${s.layer}`,-.39,this.slabY(i)+.003,-.12,.13,-Math.PI/2,col,INK);
    });
    this.tabs.forEach(t=>{const i=t.userData.slab as number,l=SLABS[i].layer!;t.position.y=this.slabY(i)*1.65;t.material=toon(l===b.from||l===b.to?'#ffc629':'#fffaf0');});
    if(b.drill&&b.from!==undefined&&b.to!==undefined){
      const ia=SLABS.findIndex(s=>s.layer===lo),iz=SLABS.findIndex(s=>s.layer===hi);
      const top=this.slabY(ia)+SLABS[ia].h/2,bottom=this.slabY(iz)-SLABS[iz].h/2;
      for(const x of xs){
        if(b.plated&&!(kindOf(lo,hi)==='buried'&&b.platedPressed)){
          const g=sectionBarrel(r,top-bottom);
          const copper=toon(COPPER).clone();copper.side=T.DoubleSide;copper.userData.transient=true;copper.userData.outlineParameters={visible:false};
          part(this.viaGroup,g,copper,x,(top+bottom)/2,0).name='copper-barrel';
          if(b.finish==='filled-capped'||b.finish==='plugged'){const fill=new T.CylinderGeometry(r*.9,r*.9,(top-bottom)*(b.finish==='plugged'?.25:1),24,1,false,Math.PI/2,Math.PI);fill.userData.transient=true;part(this.viaGroup,fill,toon(FILL),x,top-(top-bottom)*(b.finish==='plugged'?.125:.5),0);}
        }
        if(b.pad!==undefined){const outer=b.pad*layout.scale/2;
          for(const y of [top+.003,bottom-.003]){const g=new T.RingGeometry(r,outer,32,1,Math.PI,Math.PI);g.rotateX(Math.PI/2);g.userData.transient=true;const pad=part(this.viaGroup,g,toon(COPPER),x,y,0);(pad.material as T.Material).side=T.DoubleSide;}
          if(b.finish==='filled-capped'||b.finish==='tented'){const g=new T.CircleGeometry(outer,32,Math.PI,Math.PI);g.rotateX(Math.PI/2);g.userData.transient=true;part(this.viaGroup,g,toon(b.finish==='tented'?MASK:COPPER),x,top+.012,0);}
        }
      }
    }
    // Recognisable package bodies and leads on the untouched rear surface.
    if(b.pressed){const top=this.slabY(0)+.02;
      for(const x of [-.24,.24]){part(this.boardGroup,box(.12,.045,.08),toon(INK),x,top,-.105);for(const side of [-1,1])for(let k=0;k<3;k++)part(this.boardGroup,box(.015,.01,.035),toon('#c6cbd0'),x-.04+k*.04,top-.015,-.105+side*.047);}
    }
    // Tool states.
    this.bitButtons.forEach(m=>m.scale.setScalar(m.userData.drill===this.bit?1.2:1));
    this.padButtons.forEach(m=>m.position.y=m.userData.pad===b.pad?.04:.015);
    this.finishJars.forEach((m,k)=>m.parent!.position.y=FINISHES[k]===b.finish?.04:0);
    (this.countText.material as T.MeshBasicMaterial).map=countLabel(b.count);
    this.shown='';
  }
  /** Tabletop hits: clicks run the action; hover lifts the tool a touch. */
  pointer(e:Pointer){
    if(this.gesture){const g=this.gesture,point=e.ray.ray.intersectPlane(g.plane,new T.Vector3());
      if(point&&g.kind!=='drill')g.progress=T.MathUtils.clamp((g.startY-point.y)/.3,0,1);
      if(e.kind==='up'){if(g.kind!=='drill'&&g.progress>.75)this.act(g.kind);this.gesture=undefined;return;}
      if(e.kind==='move')return;
    }
    const hits=e.ray.intersectObjects(this.clickables.map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(found){this.help=found.act==='layer'?'layers':found.act==='bit'?'drill':found.act;this.shown='';}if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.12);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found){
      if(['press','plate','drill'].includes(found.act)&&cellFor(found.act)===this.cell){
        const point=found.obj.getWorldPosition(new T.Vector3()),normal=this.game.view.camera.getWorldDirection(new T.Vector3()),plane=new T.Plane().setFromNormalAndCoplanarPoint(normal,point);
        const hit=e.ray.ray.intersectPlane(plane,new T.Vector3());if(hit)this.gesture={kind:found.act as 'press'|'plate'|'drill',plane,startY:hit.y,progress:0};
      }else this.act(found.act,found.arg);
    }
  }
  key(code:string){
    const map:Record<string,[string,unknown?]>={Digit1:['layer',1],Digit2:['layer',2],Digit3:['layer',3],Digit4:['layer',4],KeyP:['press'],KeyD:['drill'],KeyL:['plate'],KeyT:['test'],Enter:['serve'],Backspace:['scrap'],Equal:['count',1],Minus:['count',-1]};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  selectWorkplace(pos:{x:number;z:number}){const found=(Object.keys(CELLS) as Workcell[]).find(id=>Math.hypot(pos.x-CELLS[id].at.x,pos.z-CELLS[id].at.z)<1.6);if(!found)return false;this.cell=found;Object.assign(this.stand,CELLS[found].at);this.table.copy(CELLS[found].table);this.help=found==='inspect'?'layers':found==='verify'?'test':found;Object.assign(this.view,{distance:found==='inspect'?6.8:5.6,pitch:found==='inspect'?.5:.32,lookY:found==='inspect'?.38:.58,lookX:found==='inspect'?.2:.6});return true;}
  workPose(){const kind=this.gesture?.kind??this.actionKind;if(!this.gesture&&this.actionTime<=0)return undefined;
    const handle=kind==='press'?this.machines.pressHandle:kind==='drill'?this.machines.drillHandle:kind==='plate'?this.machines.plateHandle:undefined;
    return {kind,progress:this.gesture?.progress??1-this.actionTime,target:handle?.getWorldPosition(new T.Vector3())};}
  carryingWorkpiece(){return this.blanksReady&&!this.active&&!!this.current();}
  setActive(active:boolean){this.active=active;this.gesture=undefined;
    this.root.attach(this.boardGroup);this.boardGroup.position.copy(active?this.table:this.inspectionTable);this.boardGroup.scale.setScalar(active?1.65:.5);if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';this.updatePanel();}
  dropped(p:Game['props'][number]){
    if(p.spec.id!=='blanks'||this.blanksReady)return;const q=p.body.translation();
    if(Math.hypot(q.x-(this.inspectionTable.x+2.75),q.z-this.inspectionTable.z)<2.2||Math.hypot(q.x-this.stand.x,q.z-this.stand.z)<2){
      this.blanksReady=true;p.body.setTranslation({x:this.inspectionTable.x+2.75,y:1.25,z:this.inspectionTable.z},true);p.body.setRotation(new T.Quaternion(),true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);
      this.game.audio.plug();this.game.burst({x:this.inspectionTable.x+2.75,y:1.3,z:this.inspectionTable.z},'#8ff3ea',1,'ring');}
  }
  update(dt:number){
    if(!this.ready)this.setup();this.actionTime=Math.max(0,this.actionTime-dt);
    this.press+=(this.pressTarget-this.press)*Math.min(1,dt*6);if(Math.abs(this.pressTarget-this.press)>.002)this.redrawBoardOnly();
    this.drillAnim=Math.max(0,this.drillAnim-dt*1.6);this.machines.spindle.position.y=-.26-Math.sin(this.drillAnim*Math.PI)*.15;this.machines.spindle.rotation.y+=this.drillAnim*dt*60;
        if(this.gesture?.kind==='drill'){this.gesture.progress+=dt/ .65;if(this.gesture.progress>=1){this.act('drill');this.gesture=undefined;}}
    const drag=this.gesture;
    this.machines.pressHead.position.y=1.8-(drag?.kind==='press'?drag.progress:this.press)*.22;
    this.machines.lever.rotation.x=(drag?.kind==='press'?drag.progress:this.press)*.8;
    if(drag?.kind==='drill'){this.machines.spindle.position.y=-.26-drag.progress*.15;this.machines.spindle.rotation.y+=dt*45;}this.machines.spindle.visible=!isLaser(this.bit);this.machines.laserBeam.visible=isLaser(this.bit)&&(this.drillAnim>0||drag?.kind==='drill');

    this.plateAnim=Math.max(0,this.plateAnim-dt*.8);this.machines.basket.position.y=1.9-(drag?.kind==='plate'?drag.progress:Math.sin(this.plateAnim*Math.PI))*.45;
    this.machines.bubbles.forEach((m,i)=>{m.position.y=1.57+((this.game.time*.18+i*.07)% .22);m.scale.setScalar(.6+Math.sin(this.game.time*3+i)*.15);});
    if(this.carryingWorkpiece()){const p=this.game.player.translation(),h=this.game.heading;this.boardGroup.position.set(p.x+Math.sin(h)*.58,p.y+.14,p.z+Math.cos(h)*.58);this.boardGroup.rotation.y=h;this.boardGroup.scale.setScalar(.5);}else {this.boardGroup.position.copy(this.table);this.boardGroup.scale.setScalar(this.cell==='inspect'?1.65:.8);this.boardGroup.position.y=this.cell==='plate'?1.6:1.05;}
    if(!this.carryingWorkpiece()){const c=CELLS[this.cell];this.boardGroup.rotation.y=Math.PI+Math.atan2(c.at.x-c.table.x,c.at.z-c.table.z);if(this.cell==='verify')this.boardGroup.position.x-=.55;}
    if(this.testGlow>0){this.testGlow=Math.max(0,this.testGlow-dt);if(this.testGlow===0)this.redraw();}
    // Customers walk to their spot; served ones leave through the side door.
    for(const n of this.game.npcs){const goal=n.group.userData.goal as T.Vector3|undefined;if(goal&&!this.leaving.some(l=>l.g===n.group))n.group.position.lerp(goal,Math.min(1,dt*2.5));}
    for(const l of this.leaving){l.t+=dt;l.g.position.x+=dt*2.2;if(l.t>4)l.g.visible=false;}
    if(this.rush){for(const l of this.leaving)if(l.t>4.5){l.g.visible=true;l.g.position.set(this.inspectionTable.x+8,0,this.inspectionTable.z-2.1);}this.leaving=this.leaving.filter(l=>l.t<=4.5);
      // Patience only runs while a customer is at the window and the counter is stocked.
      if(this.blanksReady&&this.current()){this.patience-=dt;if(this.patience<=0){const o=this.current()!;this.misses++;this.say(`${o.customer} gave up waiting.`,'bad');this.game.audio.voice('groan',.9);this.sendOff(this.order);this.order++;this.build=blank();this.press=0;this.pressTarget=0;this.placeQueue();this.redraw();}}}
    const cur=this.customer(this.order);if(cur&&this.bubble.visible)this.bubble.position.set(cur.group.position.x+1.35,1.85+Math.sin(this.game.last*.004)*.05,cur.group.position.z);
    this.updatePanel();
  }
  private redrawBoardOnly(){this.redraw();}

  // ---------- panels ----------
  private say(text:string,tone:'ok'|'bad'|'info'='info'){
    if(!this.toast){this.toast=document.createElement('div');this.toast.className='station-toast';this.layer()?.append(this.toast);}
    this.toast.textContent=text;this.toast.dataset.tone=tone;this.toast.hidden=false;this.toastUntil=this.game.time+Math.max(4,text.length*.06);
  }
  private layer(){return document.querySelector<HTMLElement>('[data-layer="hud"]');}
  private updatePanel(){
    if(this.toast&&!this.toast.hidden&&this.game.time>this.toastUntil&&this.game.running)this.toast.hidden=true;
    const o=this.current(),b=this.build,r=ring(b);
    const key=JSON.stringify([this.cell,this.help,this.active,this.order,b,this.bit,this.blanksReady,this.rush?Math.ceil(this.game.time):0]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel via-panel panel';this.panel.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-cycle]');if(b)this.act(b.dataset.cycle!);});this.layer()?.append(this.panel);}
    this.panel.hidden=!o;if(!o)return;
    const span=b.from===undefined?'pick two layers':b.to===undefined?`L${b.from} → ?`:`L${b.from} → L${b.to} · ${KIND_NAMES[kindOf(b.from,b.to)]}`;
    // Green only when a choice is right for this order, red when it is set but wrong.
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'bad'}"><span>${k}</span><b>${v}</b></li>`;
    const kind=kindOf(o.from,o.to),spanOk=b.to!==undefined?((b.from===o.from&&b.to===o.to)||(b.from===o.to&&b.to===o.from)):undefined;
    const holeOk=b.drill?(isLaser(b.drill)===(kind==='micro')&&b.drilledPressed===(kind!=='buried')):undefined;
    const minRing=b.drill&&isLaser(b.drill)?PROFILE.microMinRing:PROFILE.minRing;
    const padOk=b.pad!==undefined&&b.drill?(r!>=minRing&&(o.maxPad===undefined||b.pad<=o.maxPad)):undefined;
    const fin=b.finish??'open',finishOk=o.inPad?(b.plated?fin==='filled-capped':undefined):o.covered?(b.plated?fin!=='open':undefined):(b.finish?true:undefined);
    const rowOk=o.stitch?b.count>=o.stitch:b.count===1?undefined:false;
    const head=this.rush?`RUSH · ${Math.max(0,Math.ceil(RUSH_TIME-this.game.time))} s left · served ${this.served.length}`:`ORDER ${this.order+1}/${SHIFT.length}`;
    this.panel.innerHTML=`<header><small>${head} / ${o.customer}</small>${this.rush?`<i class="patience" style="--p:${Math.max(0,this.patience/PATIENCE).toFixed(2)}"></i>`:''}<h4>${this.orderTitle(o)}</h4><p>${o.ask}</p></header>`+
      `<p class="workcell-name">${CELLS[this.cell].label}</p>${['press','drill','plate'].includes(this.cell)?`<button type="button" class="btn via-cycle" data-cycle="${this.cell}">Run ${this.cell} cycle</button>`:''}<details><summary>Sample measurements</summary><ul class="build">${row('Joins',span)}${row('Stack',b.pressed?'laminated':'loose')}${row('Hole',b.drill?DRILL_NAMES[b.drill]:'not drilled')}${row('Barrel',b.plated?'copper':'bare dielectric')}${row('Annular ring',r!==undefined?`${r.toFixed(3)} mm`:'choose hole and pad')}${row('Finish',FINISH_NAMES[fin])}${row('Cost',String(cost(b)))}</ul></details>`+
      `<details><summary>Why these choices?</summary><p>${CHOICES[this.help as keyof typeof CHOICES]??CHOICES.test}</p><p class="profile">${PROFILE.name}: mechanical ring at least ${PROFILE.minRing} mm, laser ring at least ${PROFILE.microMinRing} mm; mechanical aspect at most ${PROFILE.maxAspect}:1. Shop values.</p></details>`;

  }

  prompt(atBench:boolean):Prompt|null{
    if(!this.current())return null;
    if(!atBench){const p=this.game.player.translation();
      if(this.game.held?.spec.id==='blanks'&&Math.hypot(p.x-CELLS.inspect.at.x,p.z-CELLS.inspect.at.z)<2.4)return {key:'E',text:'Load the blanks at inspection'};
      const id=(Object.keys(CELLS) as Workcell[]).find(id=>Math.hypot(p.x-CELLS[id].at.x,p.z-CELLS[id].at.z)<1.6);
      return id?{key:'E',text:CELLS[id].label}:null;}
    if(this.cell==='verify')return {key:'T / Enter',text:'Test the sample on the customer hardware, then send it'};
    if(this.cell!=='inspect')return {key:this.cell==='press'?'P':this.cell==='drill'?'D':'L',text:this.cell==='drill'?'Hold the feed wheel to drill; D runs a cycle':this.cell==='press'?'Pull the lever down to laminate; P runs a cycle':'Lower the basket to plate; L runs a cycle'};
    const b=this.build;
    if(!this.blanksReady)return {key:'E',text:'Step back and fetch the crate of board blanks'};
    if(this.returned)return {key:'Backspace',text:'Sent back: revise the sample using the test feedback, or scrap it and start again'};
    if(b.to===undefined)return {key:'1–4',text:'Pick the two layers this via joins (click the L1–L4 tabs)'};
    if(!b.drill)return {key:'Esc',text:'Carry the sample to the press or drill; choose when to seal the layers'};
    if(!b.plated)return {key:'Esc',text:'The hole is bare dielectric; use the copper plating bath'};
    if(b.pad===undefined)return {key:'PAD',text:'Click a PAD size (watch the annular ring)'};
    if(!b.pressed)return {key:'Esc',text:'The stack is still loose; use the lamination press'};
    return {key:'Esc',text:'Try the sample on the customer hardware at the test area'};
  }
  complete(){return this.rush?this.game.time>=RUSH_TIME:this.served.length>=SHIFT.length;}
  score(){return {mistakes:this.mistakes+this.misses,cost:Math.round(this.spent*10)/10};}
  /** Rush: orders served and the seconds left, for the HUD clock and the result card. */
  rushStatus(){return this.rush?{served:this.served.length,left:Math.max(0,RUSH_TIME-this.game.time)}:undefined;}
  snapshot(){const tools:Record<string,[number,number]>={};const c=this.game.view.renderer.domElement;
    for(const [name,obj] of Object.entries({press:this.machines.pressHandle,drill:this.machines.drillHandle,plate:this.machines.plateHandle})){const p=obj.getWorldPosition(new T.Vector3()).project(this.game.view.camera);tools[name]=[(p.x+1)*c.clientWidth/2,(1-p.y)*c.clientHeight/2];}
    return {sample:{position:this.boardGroup.position.clone(),facing:this.boardGroup.rotation.y},tools,gesture:this.gesture?{kind:this.gesture.kind,progress:this.gesture.progress}:null,cell:this.cell,workcells:CELLS,current:this.current(),rush:this.rush,misses:this.misses,patience:this.patience,order:this.order,served:this.served.map(s=>({order:s.order,tier:s.verdict.tier})),build:this.build,bit:this.bit,blanksReady:this.blanksReady,mistakes:this.mistakes,spent:this.spent};}
}
