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
import {rng} from '../../render/textures';
import {SHIFT,rushOrder,PADS,FINISHES,PROFILE,blank,judge,kindOf,ring,cost,cheapest,drillSize,isLaser,type Build,type Drill,type Finish,type Layer,type Order,type Verdict} from './logic';

const COPPER='#e98a42',PREPREG='#b7c77c',CORE='#86ad64',MASK='#2f9a62',FILL='#9aa0ad';
// Display thicknesses (world units) for the cutaway, top to bottom: L1, prepreg, L2, core, L3, prepreg, L4.
const SLABS:{kind:'cu'|'pp'|'core';layer?:Layer;h:number;group:number}[]=[
  {kind:'cu',layer:1,h:.028,group:0},{kind:'pp',h:.05,group:1},{kind:'cu',layer:2,h:.028,group:2},{kind:'core',h:.15,group:2},{kind:'cu',layer:3,h:.028,group:2},{kind:'pp',h:.05,group:3},{kind:'cu',layer:4,h:.028,group:4}];
const BOARD_W=.9,BOARD_D=.34,BASE_Y=.14,GAP=.06,SCALE=.3;
const DRILL_NAMES:Record<Drill,string>={'mech-0.30':'0.30 mm bit','mech-0.20':'0.20 mm bit','laser-0.10':'Laser 0.10 mm'};
const FINISH_NAMES:Record<Finish,string>={open:'Open','tented':'Tented','plugged':'Plugged','filled-capped':'Filled + capped'};
/** Rush mode: a three-minute shift of endless orders; each customer waits this long. */
export const RUSH_TIME=180,PATIENCE=50;
const KIND_NAMES={through:'through via',buried:'buried via',micro:'microvia',blind:'blind via'};
const GLOW_OK=hot('#ffe36e',1.4),GLOW_BAD=hot('#ff6b6b',1.2);
const countLabels=new Map<number,T.Texture>();
const countLabel=(n:number)=>{let t=countLabels.get(n);if(!t){t=label(`×${n}`,'#fffaf0',INK,128,80);countLabels.set(n,t);}return t;};

/** Label decal texture for the counter (short words are fine now: see PROGRESS "on-screen text"). */
function label(text:string,bg='#fffaf0',fg=INK,w=256,h=80){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,18);c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    // Shrink the type until the words fit the plate.
    let size=Math.round(h*.46);const font=(n:number)=>`700 ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;c.font=font(size);while(size>10&&c.measureText(text).width>w-30){size--;c.font=font(size);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);});
}
function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,w=.46,tilt=-.75,bg?:string,fg?:string){
  const m=new T.MeshBasicMaterial({map:label(text,bg,fg),transparent:true});m.userData.outlineParameters={visible:false};
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
  readonly view={distance:6.4,pitch:.62,lookY:.32};
  readonly limits={time:420,damage:1,cost:0};
  readonly stand={x:0,z:-1.55};readonly table=new T.Vector3(0,1,-2.45);readonly facing=Math.PI;
  build:Build=blank();order=0;served:{order:string;verdict:Verdict}[]=[];mistakes=0;spent=0;blanksReady=false;active=false;
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
    this.limits.cost=this.rush?90:Math.ceil(SHIFT.reduce((n,o)=>n+(cheapest(o)?.cost??0),0)*12.5);
    if(this.rush){this.limits.damage=2;this.limits.time=RUSH_TIME;}
    this.job=this.rush?{goal:`Via Rush: serve as many orders as you can in ${RUSH_TIME/60} minutes`,
      steps:[
        {text:'Bring the crate of board blanks to the counter',done:()=>this.blanksReady,at:()=>this.crate?.body.translation()??this.stand},
        {text:'Step up to the via counter (E)',done:()=>this.active||this.served.length>0,at:()=>this.stand},
        {text:'Serve 3 orders',done:()=>this.served.length>=3},{text:'Serve 6 orders',done:()=>this.served.length>=6},
        {text:'Keep serving until the whistle',done:()=>this.complete()}],
      bonuses:[{text:'Serve 8 orders',ok:()=>this.served.length>=8},{text:'Every via works reliably',ok:()=>this.served.every(s=>s.verdict.tier>=2)},{text:'Nobody gives up waiting',ok:()=>this.misses===0}]}:
    {goal:'Run the via counter: fill five customer orders',
      steps:[
        {text:'Bring the crate of board blanks to the counter',done:()=>this.blanksReady,at:()=>this.crate?.body.translation()??this.stand},
        {text:'Step up to the via counter (E)',done:()=>this.active||this.served.length>0,at:()=>this.stand},
        ...SHIFT.map((o,i)=>({text:`Order ${i+1} · ${o.customer}: ${this.orderTitle(o)}`,done:()=>this.served.length>i,at:()=>this.stand}))],
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
  private setup(){this.ready=true;this.crate=this.game.props.find(p=>p.spec.id==='blanks');this.buildQueue();}
  orderTitle(o:Order){const k=kindOf(o.from,o.to);return `L${o.from}→L${o.to} ${KIND_NAMES[k]}${o.inPad?' in a pad':''}${o.stitch?`, row of ${o.stitch}`:''}`;}
  current():Order|undefined{if(this.rush){if(this.complete())return undefined;while(this.orders.length<=this.order+5)this.orders.push(rushOrder(this.random,this.orders.length));}return this.orders[this.order];}
  /** The coworker playing the customer for an order (rush reuses the five in a loop). */
  private customer(i:number){const n=this.game.npcs;return this.rush?n[i%5]:n[i];}

  // ---------- the counter ----------
  private buildCounter(){
    const g=this.game,t=this.table,top=group(this.root,t.x,t.y,t.z);
    // Counter body, worktop, and the glass service window behind it.
    part(g.decorRoot,box(4.4,1,1.1),toon('#e0cfb0'),t.x,.5,t.z);part(g.decorRoot,box(4.5,.06,1.2),toon('#f4ead6'),t.x,1.0,t.z);part(g.decorRoot,box(4.42,.1,.04),toon('#c98a55'),t.x,.95,t.z+.57);
    this.solid(4.4,1.05,1.1,t.x,.52,t.z);
    for(const x of [-2.2,2.2])part(g.decorRoot,box(.12,1.4,.12),toon(DMETAL),t.x+x,1.7,t.z-.5);
    part(g.decorRoot,box(4.5,.12,.14),toon('#c98a55'),t.x,2.42,t.z-.5);
    const glass=part(g.root,box(4.3,1.3,.04),toon('#bfe6f5',{opacity:.18}),t.x,1.72,t.z-.5,false);glass.userData.noAO=true;
    this.solid(4.4,2.6,.14,t.x,1.3,t.z-.5);
    sign(g.root,'VIA COUNTER',t.x,2.62,t.z-.43,1.4,0,'#ffc629');
    // Fixture: a vice-like base under the cutaway board, with the layer tabs on its left.
    part(top,box(1.2,.1,.6),toon('#3a3d55'),0,.05,0);part(top,box(1.1,.02,.02),toon('#ffc629'),0,.1,.3);
    for(const x of [-.5,.5])part(top,box(.06,.5,.06),toon(DMETAL),x,.3,-.2);
    top.add(this.boardGroup);this.boardGroup.add(this.viaGroup);
    sign(top,'CUTAWAY · NOT TO SCALE',0,.08,.4,.7);
    SLABS.forEach((s,i)=>{if(s.kind!=='cu')return;const tab=part(top,box(.2,.07,.14),toon('#fffaf0'),-.64,0,.1);tab.userData.slab=i;this.tabs.push(tab);this.click(tab,'layer',s.layer);
      const tl=sign(tab,`L${s.layer}`,0,0,.072,.2,0);tl.position.set(0,0,.072);});
    // Left tools: scrap bin, press, drill press with its bits, plating tank.
    const scrap=group(top,-1.95,0,.1);part(scrap,cyl(.14,.12,.3,18),toon('#6b7385'),0,.15,0);part(scrap,cyl(.15,.15,.03,18),toon(INK),0,.31,0);this.click(scrap,'scrap');sign(top,'SCRAP',-1.95,.08,.38);
    const press=group(top,-1.55,0,-.05);part(press,box(.36,.08,.3),toon('#3f7fd6'),0,.04,0);part(press,box(.36,.08,.3),toon('#3f7fd6'),0,.42,0);
    for(const x of [-.15,.15])part(press,cyl(.025,.025,.42,10),toon(DMETAL),x,.23,-.1);const lever=group(press,.2,.46,0);part(lever,cyl(.02,.02,.3,8,'x'),toon(DMETAL),.15,0,0);part(lever,sphere(.05,12,10),toon('#e5484d'),.3,0,0);
    this.click(press,'press');sign(top,'PRESS',-1.55,.08,.38);
    const drill=group(top,-1.08,0,-.12);part(drill,box(.34,.06,.34),toon('#3a3d55'),0,.03,0);part(drill,cyl(.035,.035,.8,12),toon(DMETAL),-.1,.43,-.12);
    drill.add(this.drillHead);this.drillHead.position.set(0,.62,0);part(this.drillHead,box(.24,.14,.2),toon('#ffc629'),0,0,0);part(this.drillHead,cyl(.012,.004,.16,8),toon('#dfe3ea'),0,-.14,0);
    this.click(drill,'drill');sign(top,'DRILL',-1.08,.62,-.12,.46,0,'#ffc629');
    (['mech-0.30','mech-0.20','laser-0.10'] as Drill[]).forEach((d,k)=>{const b=part(top,cyl(.045,.045,.03,16),toon(isLaser(d)?'#e5484d':'#dfe3ea'),-1.22+k*.14,.015,.14);b.userData.drill=d;this.bitButtons.push(b);this.click(b,'bit',d);});
    sign(top,'BIT: 0.30 · 0.20 · LASER',-1.08,.08,.34,.62);
    const tank=group(top,-.8,0,-.05);part(tank,box(.26,.2,.26),toon('#3f7fd6',{opacity:.55}),0,.1,0);part(tank,box(.26,.02,.26),toon('#7fd3ff'),0,.19,0);part(tank,box(.3,.03,.3),toon(DMETAL),0,.01,0);
    this.click(tank,'plate');sign(top,'PLATE',-.8,.08,.3,.38);
    // Right tools: pad sizes, finish jars, stitch row count, tester, serve bell.
    PADS.forEach((p,k)=>{const b=part(top,cyl(p*.28,p*.28,.03,24),toon(COPPER),.72+k*.2,.015,.05);b.userData.pad=p;this.padButtons.push(b);this.click(b,'pad',p);});
    sign(top,'PAD 0.30 · 0.45 · 0.60',.92,.08,.34,.62);
    FINISHES.forEach((f,k)=>{const jar=group(top,1.3+(k%2)*.16,0,-.12+Math.floor(k/2)*.18);const m=part(jar,cyl(.055,.055,.12,16),toon(f==='open'?'#fffaf0':f==='tented'?MASK:f==='plugged'?FILL:COPPER),0,.06,0);part(jar,cyl(.058,.058,.025,16),toon(INK),0,.13,0);this.finishJars.push(m);this.click(jar,'finish',f);});
    sign(top,'FINISH',1.38,.36,-.35,.4,0);
    const row=group(top,1.72,0,.12);for(const [x,a] of [[-.12,-1],[.12,1]] as const){const b=part(row,box(.09,.05,.09),toon(a>0?'#6cc58a':'#e5484d'),x,.025,0);this.click(b,'count',a);}
    this.countText=part(row,new T.PlaneGeometry(.12,.08),new T.MeshBasicMaterial({map:label('×1','#fffaf0',INK,128,80),transparent:true}),0,.06,0,false);this.countText.rotation.x=-1.1;(this.countText.material as T.Material).userData.outlineParameters={visible:false};
    sign(top,'ROW',1.72,.08,.36,.3);
    const tester=group(top,1.72,0,-.2);part(tester,box(.22,.14,.14),toon('#ffc94d'),0,.07,0);part(tester,box(.15,.07,.01),toon('#bfeaf5'),0,.1,.072);this.click(tester,'test');sign(tester,'TEST',0,.24,0,.3,0,'#ffc629');
    const bell=group(top,2.02,0,-.2);part(bell,cyl(.09,.11,.03,18),toon(INK),0,.015,0);part(bell,sphere(.08,14,10,),toon('#ffc629'),0,.07,0).scale.y=.8;part(bell,cyl(.012,.012,.04,8),toon(INK),0,.14,0);this.click(bell,'serve');sign(top,'SERVE',2.02,.3,-.2,.34,0,'#6cc58a');
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
    for(let k=0;k<5;k++){const i=this.order+k,n=this.customer(i);if(!n||(!this.rush&&i>=this.orders.length))continue;const x=k===0?this.table.x:this.table.x+1.3+k*1.05,z=k===0?this.table.z-1.2:this.table.z-2.1;
      n.group.userData.goal=new T.Vector3(x,0,z);n.restYaw=0;if(instant)n.group.position.set(x,0,z);}
    const o=this.current(),cur=o&&this.customer(this.order);this.bubble.visible=!!cur;if(o&&cur)(this.bubble.material as T.SpriteMaterial).map=ticketTexture(o);this.patience=PATIENCE;
  }

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const b=this.build,o=this.current(),a=this.game.audio;
    if(!o)return false;
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
        const at=this.table.clone().add(new T.Vector3(0,.5,0));this.game.burst(at,isLaser(b.drill)?'#ff8a8a':'#fff3a3',10,'spark');break;}
      case 'plate':{if(!b.drill){this.say('Drill the hole first, then plate its barrel.');return false;}if(b.plated){this.say('Already plated.');return false;}b.plated=true;b.platedPressed=b.pressed;a.noise(.6,.03,900,'lowpass');a.bell(660,.4,.03,.3);break;}
      case 'pad':{b.pad=arg as number;a.tone(420+(b.pad*400),.06,.04,'triangle');break;}
      case 'finish':{const f=arg as Finish;if(f!=='open'&&!b.plated){this.say('Finish comes after plating.');return false;}b.finish=f;a.pop();break;}
      case 'count':{b.count=Math.max(1,Math.min(8,b.count+(arg as number)));a.tone(b.count*90+300,.05,.03);break;}
      case 'test':{const v=this.verdict();this.testGlow=1.2;this.testOk=v.tier>0;
        this.say(v.tier>0?`${['','Works','Works reliably','Works reliably · elegant'][v.tier]}. ${v.notes[0]??''}`:v.problems.slice(0,2).join(' '),v.tier>0?'ok':'bad');
        if(v.tier>0)a.bell(1175,.4,.04);else a.tone(160,.25,.06,'square');break;}
      case 'serve':{const v=this.verdict();
        if(v.tier===0){this.mistakes++;this.spent+=v.cost;this.say(`${o.customer} sends it back: ${v.problems[0]}`,'bad');a.voice('groan',1);this.game.alarm({x:this.table.x,z:this.table.z-1.2},2);return true;}
        this.served.push({order:o.id,verdict:v});this.spent+=v.cost;
        this.say(`${o.customer}: “${['','Thanks!','Lovely work.','Perfect, and cheap too!'][v.tier]}” · ${['','Works','Reliable','Elegant'][v.tier]}${v.notes[0]?` · ${v.notes[0]}`:''}`,'ok');
        a.cheer();a.bell(1319,.5,.05);this.sendOff(this.order);
        this.game.burst(this.table.clone().add(new T.Vector3(0,.8,-1)),'#ffcf52',30,'confetti');
        this.order++;this.build=blank();this.press=0;this.pressTarget=0;this.placeQueue();break;}
      case 'scrap':{if(b.drill)this.spent+=cost(b);this.build=blank();this.press=0;this.pressTarget=0;a.thud(2);a.clatter();break;}
      default:return false;
    }
    this.redraw();if(name==='test')this.glowVia();return true;
  }
  /** Test result: the via's copper lights gold if the layers connect, red if not. */
  private glowVia(){const m=this.testOk?GLOW_OK:GLOW_BAD;this.viaGroup.traverse(o=>{if(o instanceof T.Mesh)o.material=m;});}
  private bit:Drill='mech-0.30';
  /** A served (or fed-up) customer walks off to the right; in rush they rejoin the back of the queue. */
  private sendOff(i:number){const npc=this.customer(i);if(npc){npc.alarm=0;this.leaving.push({g:npc.group,t:0});}}
  verdict(){return judge(this.current()!,this.build);}

  // ---------- drawing ----------
  private slabY(i:number){let y=BASE_Y;for(let k=SLABS.length-1;k>i;k--)y+=SLABS[k].h+(SLABS[k].group!==SLABS[k-1].group?GAP*(1-this.press):0);return y+SLABS[i].h/2;}
  private layerY(l:Layer){return this.slabY(SLABS.findIndex(s=>s.layer===l));}
  redraw(){
    const b=this.build;
    // Board slabs (rebuilt each redraw; they are few).
    this.boardGroup.children.filter(c=>c!==this.viaGroup).forEach(c=>this.boardGroup.remove(c));
    SLABS.forEach((s,i)=>{const col=s.kind==='cu'?COPPER:s.kind==='pp'?PREPREG:CORE;const inSpan=s.layer&&(s.layer===b.from||s.layer===b.to);
      const m=part(this.boardGroup,box(BOARD_W,s.h,BOARD_D),toon(inSpan?'#ffb35a':col),0,this.slabY(i),0);m.userData.slab=i;});
    this.tabs.forEach(t=>{const i=t.userData.slab as number,l=SLABS[i].layer!;t.position.y=this.slabY(i);(t.material as T.Material)=toon(l===b.from||l===b.to?'#ffc629':'#fffaf0');});
    // The via(s), drawn on the cutaway face.
    this.viaGroup.clear();
    if(b.drill&&b.from!==undefined&&b.to!==undefined){
      const [a,z]=b.from<b.to?[b.from,b.to]:[b.to,b.from],ia=SLABS.findIndex(s=>s.layer===a),iz=SLABS.findIndex(s=>s.layer===z);
      const w=Math.max(.035,drillSize(b.drill)*SCALE),n=Math.max(1,b.count),face=BOARD_D/2+.004;
      for(let k=0;k<n;k++){const x=n===1?0:-.34+.68*k/(n-1);
        for(let i=ia;i<=iz;i++){const s=SLABS[i],y=this.slabY(i),loose=!b.drilledPressed&&s.group!==SLABS[ia].group;
          // Holes drilled before the press don't line up once the loose layers are stacked.
          const dx=loose?(i%2?.035:-.035):0;
          part(this.viaGroup,box(w,s.h+.001,.006),toon('#1d1f30'),x+dx,y,face,false);
          if(b.plated&&!(kindOf(a,z)==='buried'&&b.platedPressed)){for(const sx of [-1,1])part(this.viaGroup,box(.012,s.h+.002,.008),toon(COPPER),x+dx+sx*(w/2),y,face+.001,false);
            if(b.finish==='filled-capped'||b.finish==='plugged')part(this.viaGroup,box(w-.01,s.h,.007),toon(b.finish==='plugged'&&i>ia?'#1d1f30':FILL),x+dx,y,face+.002,false);}
        }
        const top=this.slabY(ia)+SLABS[ia].h/2,bottom=this.slabY(iz)-SLABS[iz].h/2;
        if(b.pad!==undefined){const pw=b.pad*SCALE;for(const [yy,d] of [[top,1],[bottom,-1]] as const)part(this.viaGroup,box(pw,.012,.01),toon(COPPER),x,yy+d*.006,face+.003,false);
          if(b.finish==='filled-capped')part(this.viaGroup,box(pw,.014,.012),toon('#f3a15c'),x,top+.018,face+.004,false);
          if(b.finish==='tented'){const tent=part(this.viaGroup,sphere(pw*.55,14,8),toon(MASK),x,top+.01,face+.004,false);tent.scale.set(1,.35,.2);}}
      }
    }
    // Tool states.
    this.bitButtons.forEach(m=>m.position.y=m.userData.drill===this.bit?.035:.015);
    this.padButtons.forEach(m=>m.position.y=m.userData.pad===b.pad?.04:.015);
    this.finishJars.forEach((m,k)=>m.parent!.position.y=FINISHES[k]===b.finish?.04:0);
    (this.countText.material as T.MeshBasicMaterial).map=countLabel(b.count);
    this.shown='';
  }
  /** Tabletop hits: clicks run the action; hover lifts the tool a touch. */
  pointer(e:Pointer){
    const hits=e.ray.intersectObjects(this.clickables.map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.12);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found)this.act(found.act,found.arg);
  }
  key(code:string){
    const map:Record<string,[string,unknown?]>={Digit1:['layer',1],Digit2:['layer',2],Digit3:['layer',3],Digit4:['layer',4],KeyP:['press'],KeyD:['drill'],KeyL:['plate'],KeyT:['test'],Enter:['serve'],Backspace:['scrap'],Equal:['count',1],Minus:['count',-1]};
    const m=map[code];if(!m)return false;this.act(m[0],m[1]);return true;
  }
  setActive(active:boolean){this.active=active;if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';}
  dropped(p:Game['props'][number]){
    if(p.spec.id!=='blanks'||this.blanksReady)return;const q=p.body.translation();
    if(Math.hypot(q.x-(this.table.x+2.75),q.z-this.table.z)<2.2||Math.hypot(q.x-this.stand.x,q.z-this.stand.z)<2){
      this.blanksReady=true;p.body.setTranslation({x:this.table.x+2.75,y:1.25,z:this.table.z},true);p.body.setRotation(new T.Quaternion(),true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);
      this.game.audio.plug();this.game.burst({x:this.table.x+2.75,y:1.3,z:this.table.z},'#8ff3ea',1,'ring');}
  }
  update(dt:number){
    if(!this.ready)this.setup();
    this.press+=(this.pressTarget-this.press)*Math.min(1,dt*6);if(Math.abs(this.pressTarget-this.press)>.002)this.redrawBoardOnly();
    this.drillAnim=Math.max(0,this.drillAnim-dt*1.6);this.drillHead.position.y=.62-Math.sin(this.drillAnim*Math.PI)*.22;this.drillHead.rotation.y+=this.drillAnim*dt*60;
    if(this.testGlow>0){this.testGlow=Math.max(0,this.testGlow-dt);if(this.testGlow===0)this.redraw();}
    // Customers walk to their spot; served ones leave through the side door.
    for(const n of this.game.npcs){const goal=n.group.userData.goal as T.Vector3|undefined;if(goal&&!this.leaving.some(l=>l.g===n.group))n.group.position.lerp(goal,Math.min(1,dt*2.5));}
    for(const l of this.leaving){l.t+=dt;l.g.position.x+=dt*2.2;if(l.t>4)l.g.visible=false;}
    if(this.rush){for(const l of this.leaving)if(l.t>4.5){l.g.visible=true;l.g.position.set(this.table.x+8,0,this.table.z-2.1);}this.leaving=this.leaving.filter(l=>l.t<=4.5);
      // Patience only runs while a customer is at the window and the counter is stocked.
      if(this.blanksReady&&this.current()){this.patience-=dt;if(this.patience<=0){const o=this.current()!;this.misses++;this.say(`${o.customer} gave up waiting.`,'bad');this.game.audio.voice('groan',.9);this.sendOff(this.order);this.order++;this.build=blank();this.press=0;this.pressTarget=0;this.placeQueue();this.redraw();}}}
    const cur=this.customer(this.order);if(cur&&this.bubble.visible)this.bubble.position.set(cur.group.position.x+.75,2.05+Math.sin(this.game.last*.004)*.05,cur.group.position.z);
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
    const key=JSON.stringify([this.active,this.order,b,this.bit,this.blanksReady,this.rush?Math.ceil(this.game.time):0]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel';this.layer()?.append(this.panel);}
    this.panel.hidden=!o;if(!o)return;
    const span=b.from===undefined?'pick two layers':b.to===undefined?`L${b.from} → ?`:`L${b.from} → L${b.to} · ${KIND_NAMES[kindOf(b.from,b.to)]}`;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const head=this.rush?`RUSH · ${Math.max(0,Math.ceil(RUSH_TIME-this.game.time))} s left · served ${this.served.length}`:`ORDER ${this.order+1}/${SHIFT.length}`;
    this.panel.innerHTML=`<header><small>${head} · ${o.customer}</small>${this.rush?`<i class="patience" style="--p:${Math.max(0,this.patience/PATIENCE).toFixed(2)}"></i>`:''}<h4>${this.orderTitle(o)}</h4><p>${o.ask}</p></header>`+
      (this.active?`<ul class="build">${row('Joins',span,b.to!==undefined)}${row('Stack',b.pressed?'pressed':'loose layers',b.pressed)}${row('Hole',b.drill?`${DRILL_NAMES[b.drill]} · ${b.drilledPressed?'after press':'before press'}`:`${DRILL_NAMES[this.bit]} ready`,!!b.drill)}`+
        `${row('Barrel',b.plated?'plated':'bare',b.plated)}${row('Pad',b.pad!==undefined?`${b.pad.toFixed(2)} mm · ring ${r!.toFixed(3)}`:'—',b.pad!==undefined)}${row('Finish',FINISH_NAMES[b.finish??'open'])}${row('Row',`×${b.count}`)}${row('Cost',String(cost(b)))}</ul>`+
        `<p class="profile">${PROFILE.name}: ring ≥ ${PROFILE.minRing} mm (laser microvias ${PROFILE.microMinRing}), aspect ≤ ${PROFILE.maxAspect}:1. Shop values, not universal rules.</p>`:'');
  }

  prompt(atBench:boolean):Prompt|null{
    if(!this.current())return null;
    if(!atBench){const p=this.game.player.translation();
      if(this.game.held?.spec.id==='blanks'&&Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<2.4)return {key:'E',text:'Set the crate of blanks on the counter'};
      if(Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6)return this.blanksReady?{key:'E',text:'Work at the via counter'}:{key:'E',text:'Work at the counter (the blanks crate is still on the rack)'};return null;}
    const b=this.build;
    if(!this.blanksReady)return {key:'E',text:'Step back and fetch the crate of board blanks'};
    if(b.to===undefined)return {key:'Click',text:'Pick the two layers this via joins (L1–L4 tabs, or keys 1–4)'};
    if(!b.drill)return {key:'Click',text:kindOf(b.from!,b.to)==='buried'?'Buried vias are drilled in the core, before pressing: pick a bit and DRILL':'Press the stack if needed, pick a bit, then DRILL'};
    if(!b.plated)return {key:'Click',text:'PLATE the barrel so it conducts'};
    if(b.pad===undefined)return {key:'Click',text:'Choose a PAD size (watch the annular ring)'};
    if(!b.pressed)return {key:'Click',text:'PRESS the stack before it ships'};
    return {key:'Enter',text:'TEST it, then ring SERVE (Enter)'};
  }
  complete(){return this.rush?this.game.time>=RUSH_TIME:this.served.length>=SHIFT.length;}
  score(){return {mistakes:this.mistakes+this.misses,cost:Math.round(this.spent*10)};}
  snapshot(){return {current:this.current(),rush:this.rush,misses:this.misses,patience:this.patience,order:this.order,served:this.served.map(s=>({order:s.order,tier:s.verdict.tier})),build:this.build,bit:this.bit,blanksReady:this.blanksReady,mistakes:this.mistakes,spent:this.spent};}
}
