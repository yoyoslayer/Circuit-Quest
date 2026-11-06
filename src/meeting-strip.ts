// Big Meeting's load budget. The power strip at the boardroom door already feeds a tea urn and a fan
// heater (an urn sits on its thermostat all day; the heater runs all winter). Powered through the
// reel they draw 4.5 A of the strip's 5 A; switching the projector on as well tips it over. The
// strip's breaker is thermal (src/sim/thermal.ts): it carries the 5.5 A for about two seconds, the
// needle sitting past the line and the strip humming, then it trips. Pip unplugs one load (the
// boardroom groans) and presses the strip's reset.
// The strip is the visible hub (R5-030): the reel's plug seats in its inlet end, and the urn, heater
// and projector cords end in plug heads in its outlets. A load board on a stand beside it shows each
// plugged load as a segment of its 5 A limit (R5-062), and reads 0 A while the breaker is open,
// with the demand left as a ghost so unplugging still shows its effect (R5-042).
// Truthful at this level: loads on one strip add up; the breaker trips on the total, a little late;
// it stays off until reset.
import * as T from 'three';
import type {Game} from './game';
import type {Lead,Load} from './sim/electrical';
import {thermalStep,THERMAL_TRIP,THERMAL_INSTANT} from './sim/thermal';
import {toon,rbox,box,cyl,sphere,part,group,glyph,cachedTexture,decal,INK,METAL,DMETAL} from './render/kit';
import {hot,Pulses} from './render/actors';
import {solid} from './levels/decor';
import {TOWER} from './levels/meeting';
import type {PropSpec} from './props/prefabs';

type Point={x:number;z:number};
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
/** The strip's breaker rating (A), and what each load draws. Game tuning values. */
export const STRIP_LIMIT=5;
const PROJECTOR_DRAW=1;
/** Outlets on the strip, in its local frame (prefabs.ts 'strip': four sockets along x, inlet at -x). */
const outletX=(k:number)=>-.3+k*.19;
const APPLIANCES=[{id:'urn',name:'tea urn',draw:2.5,at:{x:13.95,z:-1.62},outlet:2,color:'#7fc8f0'},{id:'heater',name:'heater',draw:2,at:{x:15.15,z:-1.68},outlet:3,color:'#ff8a3d'}] as const;
type ApplianceId=typeof APPLIANCES[number]['id'];
interface Cord {mesh:T.Mesh;head:T.Mesh;coil:T.Mesh;pulses:Pulses;key:string;curve?:T.Curve<T.Vector3>;length:number}
interface Appliance {id:ApplianceId;name:string;at:Point;draw:number;outlet:number;color:string;plugged:boolean;lead:Lead;load:Load;cord:Cord;lamp:T.Mesh}
const BOARD={x:13.2,z:-1.7,y:1.3};
const PROJ={x:12,z:-4.5};

/** A small rating plate ("2.5 A") for an appliance's housing. */
function plate(text:string){return cachedTexture(`rating-${text}`,()=>{const cv=document.createElement('canvas');cv.width=128;cv.height=72;const c=cv.getContext('2d')!;
  c.fillStyle='#f4f1e8';c.beginPath();c.roundRect(3,3,122,66,10);c.fill();c.lineWidth=5;c.strokeStyle=INK;c.stroke();c.fillStyle=INK;c.font='bold 38px Fredoka, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,64,38);
  const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;return t;});}

export class MeetingStrip {
  appliances:Appliance[]=[];trips=0;unplugged=0;
  /** Breaker heat (THERMAL_TRIP trips it). */
  heat=0;
  private eventIndex=0;private couplerBadge:T.Sprite;private resetCap:T.Mesh;private flag:T.Group;private flagUp=0;
  private board=document.createElement('canvas');private boardTex:T.CanvasTexture;private boardKey='';private boardLamp:T.Mesh;
  private projectorCord:Cord;private led:T.Mesh;private rocker:T.Object3D;private hum=0;
  private toast?:HTMLElement;private toastUntil=0;private unpluggedAtTrip=-1;
  private towerCheered=false;
  /** One glow material per lamp mesh, recoloured in place: a fresh hot() every frame grows
   *  OutlineEffect's per-material cache without bound (sim-1). */
  private glows=new Map<T.Mesh,T.MeshBasicMaterial>();
  constructor(private game:Game){
    const c=game.circuit,root=game.root;
    // The reel feeds the strip (a heavy reel: the strip's breaker is the limit, not the cable). The
    // Circuit's own instant trip is left only for a dead short (THERMAL_INSTANT x); the thermal part
    // is stepped here.
    c.sources[0].limit=STRIP_LIMIT*THERMAL_INSTANT;c.leads[0].to='strip';c.leads[0].rating=10;c.loads[0].steady=PROJECTOR_DRAW;
    c.leads.push({id:'strip-projector',from:'strip',to:'projector',rating:10,closed:true,heat:0,dead:false});
    for(const a of APPLIANCES){
      const lead:Lead={id:`strip-${a.id}`,from:'strip',to:a.id,rating:10,closed:true,heat:0,dead:false},load:Load={id:a.id,steady:a.draw,enabled:true,state:'off',started:0};
      c.leads.push(lead);c.loads.push(load);
      // Built on root, not decorRoot: freeze() would swallow the lamp and grille swaps (R5-355).
      const g=group(root,a.at.x,0,a.at.z);let lamp:T.Mesh;
      if(a.id==='urn'){
        // A little side table with a steel tea urn (tap, lid, side handles, water window) and two mugs.
        part(g,rbox(.7,.06,.46,.03),toon('#c98f5a'),0,.78,0);for(const [x,z] of [[-.3,-.18],[.3,-.18],[-.3,.18],[.3,.18]])part(g,box(.05,.76,.05),toon(DMETAL),x,.38,z);
        const u=group(g,-.08,.81,-.02);part(u,cyl(.15,.16,.04,18),toon(INK),0,.02,0);part(u,cyl(.13,.13,.4,18),toon('#d7dde3'),0,.24,0);part(u,cyl(.1,.13,.05,18),toon('#c7ccd6'),0,.46,0);part(u,sphere(.03,10,8),toon(INK),0,.5,0);
        for(const s of [-1,1])part(u,box(.04,.04,.12),toon(INK),s*.15,.38,0);part(u,box(.02,.26,.006),toon('#9fd8ff'),-.06,.25,.131,false);
        part(u,box(.06,.05,.08),toon(INK),.03,.1,.16);part(u,cyl(.012,.012,.06,8),toon(METAL),.03,.06,.19,false);
        lamp=part(u,sphere(.022,10,8),toon('#5a5f70'),.07,.32,.13,false);decal(u,plate('2.5 A'),.13,.073,-.05,.4,.132);
        for(const x of [.16,.26])part(g,cyl(.045,.04,.1,12),toon(x<.2?'#ffc94d':'#e5484d'),x,.86,.1);
        solid(game,.7,.85,.46,a.at.x,.42,a.at.z);
      }else{
        // A fan heater on its feet, its grille glowing orange while it runs.
        part(g,rbox(.5,.55,.3,.08),toon('#f0ece2'),0,.32,0);part(g,box(.6,.04,.32),toon(DMETAL),0,.03,0);
        lamp=part(g,rbox(.36,.3,.02,.04),toon('#5a5f70'),0,.36,.16);for(let k=0;k<4;k++)part(g,box(.34,.02,.03),toon(METAL),0,.24+k*.08,.17,false);
        decal(g,plate('2 A'),.13,.073,.14,.56,.152);
        solid(game,.5,.6,.32,a.at.x,.3,a.at.z);
      }
      this.appliances.push({id:a.id,name:a.name,at:a.at,draw:a.draw,outlet:a.outlet,color:a.color,plugged:true,lead,load,cord:this.cord(),lamp});
    }
    this.projectorCord=this.cord();
    // The projector's rocker and status LED, on its back face toward the door (R5-281): off dark,
    // amber when switched on with no power, green while it runs. Its rating plate says 1 A.
    {const p=group(root,PROJ.x,0,PROJ.z);part(p,rbox(.12,.08,.02,.02),toon(INK),.16,.98,.255,false);this.rocker=part(p,box(.07,.045,.03),toon('#f0ece2'),.16,.98,.27,false);
      this.led=part(p,sphere(.022,10,8),toon('#5a5f70'),.03,.98,.26,false);decal(p,plate('1 A'),.12,.068,-.14,.98,.256);}
    // The load board on a stand beside the strip's spot: a stacked bar of what is plugged in against
    // the strip's 5 A line (R5-062/R5-142), in a finished housing on root so it can redraw.
    this.board.width=256;this.board.height=160;this.boardTex=new T.CanvasTexture(this.board);this.boardTex.colorSpace=T.SRGBColorSpace;
    {const s=group(root,BOARD.x,0,BOARD.z);part(s,cyl(.2,.22,.05,18),toon(INK),0,.025,0);part(s,cyl(.03,.03,BOARD.y-.25,8),toon(DMETAL),0,(BOARD.y-.25)/2+.05,0);
      const S=1.35;part(s,rbox(.82*S,.54*S,.1,.04),toon(INK),0,BOARD.y,0);part(s,box(.78*S,.5*S,.01),toon('#3a3d55'),0,BOARD.y,-.056,false);part(s,box(.86*S,.04,.16),toon(INK),0,BOARD.y+.29*S,.02);
      decal(s,this.boardTex,.74*S,.46*S,0,BOARD.y,.052);this.boardLamp=part(s,sphere(.05,10,8),toon('#5a5f70'),.33*S,BOARD.y+.29*S+.06,.03,false);
      solid(game,.3,1.6,.3,BOARD.x,.8,BOARD.z);}
    // The strip's own reset: its red switch pops up and pulses while tripped, with a tall red flag
    // on a stalk that clears Pip's silhouette from the game camera (R5-039).
    this.resetCap=part(root,sphere(.05,12,10),toon('#d63a3f'),0,-5,0,false);
    this.flag=group(root,0,-5,0);part(this.flag,cyl(.012,.012,.95,6),toon(INK),0,.475,0);part(this.flag,box(.24,.15,.012),hot('#ff5a4d',1.3),.12,.86,0,false);this.flag.visible=false;
    // After the reel refuses to mate without the coupler, the coupler wears a badge until it is fitted.
    this.couplerBadge=new T.Sprite(new T.SpriteMaterial({map:cachedTexture('coupler-badge',()=>glyph(c=>{c.fillStyle='#fffaf0';c.beginPath();c.arc(128,128,112,0,7);c.fill();c.lineWidth=14;c.strokeStyle=INK;c.stroke();
      c.fillStyle='#ffcc52';c.beginPath();c.roundRect(60,96,136,64,18);c.fill();c.stroke();c.fillStyle=INK;for(const y of [114,142]){c.fillRect(196,y-6,34,12);c.fillRect(26,y-6,34,12);}})),depthTest:false}));
    this.couplerBadge.scale.set(.8,.8,1);this.couplerBadge.renderOrder=9;this.couplerBadge.visible=false;root.add(this.couplerBadge);
  }
  private cord():Cord{
    const root=this.game.root,mat=toon('#3a3d55');
    const mesh=part(root,new T.BufferGeometry(),mat,0,0,0,false),head=part(root,rbox(.1,.08,.12,.03),toon(INK),0,-5,0,false);
    const coil=part(root,new T.TorusGeometry(.12,.025,6,20).rotateX(Math.PI/2),mat,0,-5,0,false);coil.visible=false;
    return {mesh,head,coil,pulses:new Pulses(root,2,.035),key:'',length:0};
  }
  /** Lights a lamp mesh like hot(color,k), reusing that mesh's own material. */
  private glow(mesh:T.Mesh,color:string,k:number){let m=this.glows.get(mesh);if(!m){m=hot(color,k);this.glows.set(mesh,m);}else m.color.set(color).multiplyScalar(k);return m;}
  private stripProp(){return this.game.props.find(p=>p.spec.id==='strip');}
  /** The strip's world frame (its body), or undefined while it is not set at the door. */
  private frame(){const p=this.stripProp();if(!p||!this.game.stripPlaced())return;const q=p.body.translation(),r=p.body.rotation();
    return new T.Matrix4().compose(new T.Vector3(q.x,q.y,q.z),new T.Quaternion(r.x,r.y,r.z,r.w),new T.Vector3(1,1,1));}
  /** A point on the strip, in its local frame, as world coordinates (falls back to its spot by the door). */
  private onStrip(x:number,y:number,z=0){const m=this.frame(),t=this.game.level.target;return m?new T.Vector3(x,y,z).applyMatrix4(m):new T.Vector3(t.x+x,.08+y,t.z+.3+z);}
  /** Where the strip is (public for the job card's marker, R5-123). */
  stripAt():Point{const q=this.stripProp()?.body.translation();return q?{x:q.x,z:q.z}:this.game.level.target;}
  /** Where the reel's plug sits once seated: in the strip's inlet end, prongs in. */
  seatAt(){return this.onStrip(-.66,.05);}
  get tripped(){return this.game.circuit.sources[0].tripped;}
  /** Past its rating but not yet tripped: the projector is not "running" while the strip hums. */
  get overloaded(){return !this.tripped&&(this.game.circuit.draw.get('supply')??0)>STRIP_LIMIT+1e-6;}
  /** Everything plugged into the strip that is switched on: what it would carry if live. */
  demand(){const g=this.game;if(!g.stripPlaced())return [] as {id:string;draw:number;color:string}[];
    const list:{id:string;draw:number;color:string}[]=this.appliances.filter(a=>a.plugged).map(a=>({id:a.id,draw:a.draw,color:a.color}));
    if(g.switchedOn)list.push({id:'projector',draw:PROJECTOR_DRAW,color:'#3f7fd6'});return list;}
  /** The chaos target (R5-098): every carton of the paper tower by the aisle end is down. */
  isTower(p:{spec:PropSpec}){return TOWER.includes(p.spec);}
  towerDown(){const up=new T.Vector3(),tower=this.game.props.filter(p=>this.isTower(p));
    const down=(p:{body:{rotation():{x:number;y:number;z:number;w:number};translation():{x:number;y:number;z:number}};spec:PropSpec})=>{const q=p.body.rotation(),t=p.body.translation();up.set(0,1,0).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w));return up.y<.7||Math.hypot(t.x-p.spec.x,t.z-p.spec.z)>.5||t.y<(p.spec.y??0)-.3;};
    // Down = the top carton has come off and most of the stack has moved (like Playground's pins).
    const top=tower.find(p=>p.spec.y===Math.max(...tower.map(q=>q.spec.y??0)));return !!top&&down(top)&&tower.filter(down).length>=3;}
  private nearAppliance(pos:Point){return this.appliances.map(a=>({a,d:dist(pos,a.at)})).filter(x=>x.d<1.25).sort((x,y)=>x.d-y.d)[0]?.a;}
  /** Reset only from right at the strip, and not when the projector switch is the nearer thing (R5-039). */
  private atReset(pos:Point){const g=this.game,s=this.stripAt();return this.tripped&&g.stripPlaced()&&dist(pos,s)<.8&&(!g.level.switchAt||dist(pos,s)<dist(pos,g.level.switchAt));}
  /** E near an appliance pulls (or pushes back) its plug; E at a tripped strip resets its breaker. */
  interact(pos:Point):boolean{
    const g=this.game,a=g.audio;
    if(this.atReset(pos)){g.circuit.resetBreaker('supply');this.heat=0;a.noise(.08,.1,500);a.tone(640,.06,.04,'triangle');return true;}
    // Plugs come out of a strip that is there: before it is set at the door the cords already lie on the floor.
    const near=g.stripPlaced()&&this.nearAppliance(pos);if(!near)return false;
    const total=()=>this.demand().reduce((s,l)=>s+l.draw,0),before=total();
    near.plugged=!near.plugged;a.pop();a.noise(.03,.06,2400,'highpass');
    if(!near.plugged){this.unplugged++;
      // Somebody wanted that tea (or that warmth): one disappointed 'hm' from the boardroom, and a
      // little bell once what is left on the strip fits under its limit again.
      setTimeout(()=>a.voice('hm',.9),120);
      if(before>STRIP_LIMIT+1e-6&&total()<=STRIP_LIMIT+1e-6)a.bell(988,.3,.03,.3);}
    return true;
  }
  prompt(pos:Point):{key:string;text:string}|null{
    if(this.atReset(pos))return {key:'E',text:'Reset the strip'};
    const near=this.game.stripPlaced()&&this.nearAppliance(pos);
    return near?{key:'E',text:`${near.plugged?'Unplug':'Plug in'} the ${near.name}`}:null;
  }
  /** Before each circuit tick: plugs follow the appliances, and the thermal breaker heats on the
   *  current the last tick carried. */
  step(dt=1/60){
    const c=this.game.circuit,s=c.sources[0];for(const x of this.appliances)x.lead.closed=x.plugged;
    if(s.tripped){this.heat=0;return;}
    this.heat=thermalStep(this.heat,c.draw.get('supply')??0,STRIP_LIMIT,dt);
    if(this.heat>=THERMAL_TRIP){s.tripped=true;this.heat=0;c.events.push({time:c.time,kind:'trip',id:s.id});}
  }
  private say(text:string){
    const layer=document.querySelector<HTMLElement>('[data-layer="hud"]');if(!layer)return;
    if(!this.toast){this.toast=document.createElement('div');this.toast.className='station-toast meeting-toast';}
    if(!this.toast.isConnected)layer.append(this.toast);
    this.toast.textContent=text;this.toast.dataset.tone='bad';this.toast.hidden=false;this.toastUntil=this.game.time+4;
  }
  /** Where a cord ends: in its outlet while plugged and the strip is placed, else on the floor by its foot. */
  private drawCord(cord:Cord,from:T.Vector3[],outlet:number|undefined,side:number,lieAt:T.Vector3,on:boolean,jiggle:number){
    const time=this.game.last/1000;
    const head=outlet!==undefined?this.onStrip(outletX(outlet),.11):lieAt;
    const key=`${head.x.toFixed(2)},${head.y.toFixed(2)},${head.z.toFixed(2)},${outlet!==undefined}`;
    if(cord.key!==key){cord.key=key;cord.mesh.geometry.dispose();
      const last=from[from.length-1],pts=[...from];
      if(outlet!==undefined){const approach=head.clone().add(new T.Vector3(0,-.08,side*.32));approach.y=.03;
        pts.push(last.clone().lerp(approach,.5).setY(.03).add(new T.Vector3(side*.12,0,side*.1)),approach,head.clone().add(new T.Vector3(0,-.02,side*.07)));}
      else pts.push(last.clone().lerp(lieAt,.5).setY(.03),lieAt.clone().add(new T.Vector3(0,.0,0)));
      cord.curve=new T.CatmullRomCurve3(pts);cord.length=cord.curve.getLength();cord.mesh.geometry=new T.TubeGeometry(cord.curve,40,.025,5);}
    cord.head.position.copy(head);cord.head.rotation.set(0,0,0);if(outlet===undefined){cord.head.position.y=.04;cord.head.rotation.y=.6;}
    cord.coil.visible=outlet===undefined;if(cord.coil.visible)cord.coil.position.set(lieAt.x-.18,.03,lieAt.z-.05);
    cord.mesh.position.set(jiggle?(Math.random()-.5)*jiggle:0,0,jiggle?(Math.random()-.5)*jiggle:0);
    // Current runs from the strip out to the load (the curve starts at the load).
    cord.pulses.update(cord.curve,cord.length,time,on,true);
  }
  render(dt:number){
    const g=this.game,c=g.circuit,time=g.time,placed=g.stripPlaced();
    const live=c.draw.get('supply')??0,overloaded=this.overloaded;
    // New trips: a clack at the strip, a smoke column above Pip's head, the flag, one sentence.
    for(const e of c.events.slice(this.eventIndex))if(e.kind==='trip'){this.trips++;const at=this.onStrip(.39,.1);
      g.burst({x:at.x,y:.3,z:at.z},'#fff3a3',16,'spark');for(const y of [.6,1,1.4])g.burst({x:at.x,y,z:at.z},'#8d8a96',3,'smoke');g.burst({x:at.x,y:.3,z:at.z},'#8d8a96',4,'dust');
      // The breaker's clack and every load on it winding down, a hitstop and a coral flash; the
      // boardroom notices and groans (twice).
      g.audio.breakerTrip(Math.max(1,this.demand().length));g.freeze(.08);g.flash('#ff7a6b',.22);
      g.alarm(at,4);g.alarm({x:12,z:-5.5},6);for(let i=0;i<2;i++)setTimeout(()=>g.audio.voice('groan',.85+i*.15),180+i*280);
      g.shake=.12;this.flagUp=0;
      // A repeat trip with nothing unplugged since: a double buzz, and the shorter sentence.
      const again=this.trips>1&&this.unplugged===this.unpluggedAtTrip;
      if(again){g.audio.tone(110,.12,.07,'square',.3);g.audio.tone(110,.12,.07,'square',.48);}
      this.say(again?'Still too much on the strip.':'The strip cut out: everything plugged into it added up past its limit.');this.unpluggedAtTrip=this.unplugged;}
    this.eventIndex=c.events.length;
    if(this.toast&&!this.toast.hidden&&(time>this.toastUntil||g.won))this.toast.hidden=true;
    // Overloaded but not yet tripped: the strip hums, rising as the breaker heats.
    if(overloaded&&g.running&&!g.paused){this.hum-=dt;if(this.hum<=0){this.hum=.22;g.audio.tone(90+60*this.heat/THERMAL_TRIP,.24,.045,'sawtooth');}}else this.hum=0;
    // The load board.
    this.drawBoard(live,placed,overloaded);
    this.boardLamp.material=this.tripped&&placed?this.glow(this.boardLamp,'#ff5a4d',1.4+Math.sin(time*10)*.4):toon('#5a5f70');
    // The strip's switch pops up and pulses while tripped, and the flag rises beside it.
    const tripShown=this.tripped&&placed;this.resetCap.visible=tripShown;this.flag.visible=tripShown;
    if(tripShown){const s=this.onStrip(.39,.1);this.resetCap.position.set(s.x,s.y+.02+Math.sin(time*8)*.015,s.z);this.resetCap.material=this.glow(this.resetCap,'#ff5a4d',1.4+Math.sin(time*10)*.4);
      this.flagUp=Math.min(1,this.flagUp+dt/.25);this.flag.position.set(s.x,s.y-.05,s.z+.06);this.flag.scale.set(1,this.flagUp,1);this.flag.rotation.y=Math.sin(time*3)*.15;}
    const coupler=g.props.find(p=>p.spec.id==='coupler');this.couplerBadge.visible=g.couplerHint&&!g.coupler&&!!coupler?.mesh.visible;
    if(this.couplerBadge.visible){const q=coupler!.body.translation();this.couplerBadge.position.set(q.x,q.y+1.1+Math.sin(time*4)*.08,q.z);}
    // Each appliance: its lamp (the urn's red lamp, the heater's grille) shows it is running; while
    // the strip hums they flicker. Its cord runs to its outlet on the strip, or lies coiled.
    const flicker=overloaded&&Math.sin(time*37)>.2;
    for(const x of this.appliances){const on=x.load.state==='on';
      x.lamp.material=on&&!flicker?this.glow(x.lamp,x.id==='urn'?'#ff5a4d':'#ff8a3d',x.id==='urn'?1.6:1.3):toon('#5a5f70');
      if(on&&x.id==='urn'&&Math.random()<dt*2.5)g.burst({x:x.at.x-.08,y:1.35,z:x.at.z-.02},'#fffaf0',1,'smoke');
      const from=x.id==='urn'?[new T.Vector3(x.at.x-.2,.84,x.at.z-.14),new T.Vector3(x.at.x-.34,.78,x.at.z-.16),new T.Vector3(x.at.x-.36,.35,x.at.z-.12),new T.Vector3(x.at.x-.42,.03,x.at.z+.02)]
        :[new T.Vector3(x.at.x-.24,.12,x.at.z-.06),new T.Vector3(x.at.x-.4,.03,x.at.z+.05)];
      this.drawCord(x.cord,from,x.plugged&&placed?x.outlet:undefined,1,new T.Vector3(x.at.x-.5,.03,x.at.z+.38),on,overloaded&&this.trips>0?.03:0);}
    // The projector's own lead runs out of the boardroom to the strip's first outlet; until the
    // strip is set down it lies on the floor where the strip belongs.
    {const t=g.level.target,proj=c.loads[0];
      this.drawCord(this.projectorCord,[new T.Vector3(PROJ.x+.1,.9,PROJ.z+.2),new T.Vector3(PROJ.x+.2,.3,PROJ.z+.6),new T.Vector3(PROJ.x+.4,.03,PROJ.z+1.3)],placed?0:undefined,-1,new T.Vector3(t.x-.3,.03,t.z+.15),proj.state==='on',0);
      this.led.material=!g.switchedOn?toon('#5a5f70'):proj.state==='on'&&!overloaded?this.glow(this.led,'#57e38f',1.8):this.glow(this.led,'#ffb340',1.6+Math.sin(time*6)*.3);
      this.rocker.rotation.x=g.switchedOn?.35:-.35;}
    // The paper tower: all down is a chaos win worth a cheer (the bonus itself lives on the job card).
    if(!this.towerCheered&&this.towerDown()){this.towerCheered=true;g.burst({x:8,y:1.2,z:-2.35},'#ffcf52',40,'confetti');g.audio.jingle();g.alarm({x:8,z:-2.35},6);}
  }
  private drawBoard(live:number,placed:boolean,overloaded:boolean){
    const g=this.game,tripped=this.tripped&&placed,loads=this.demand(),flash=overloaded&&Math.floor(g.time*6)%2===0;
    const key=`${live.toFixed(2)}|${loads.map(l=>l.id).join(',')}|${tripped}|${flash}|${placed}`;if(key===this.boardKey)return;this.boardKey=key;
    const c=this.board.getContext('2d')!,X0=16,W=224,MAX=7.5,lx=X0+W*STRIP_LIMIT/MAX,y0=70,h=46;
    c.clearRect(0,0,256,160);c.fillStyle='#fffaf0';c.beginPath();c.roundRect(4,4,248,152,20);c.fill();c.lineWidth=8;c.strokeStyle=INK;c.stroke();
    // Live current, the strip's own reading: 0 A while the breaker is open.
    c.fillStyle=tripped?'#e5484d':INK;c.font='bold 34px Fredoka, sans-serif';c.textBaseline='alphabetic';c.textAlign='left';c.fillText(`${live.toFixed(1)} A`,18,52);
    if(tripped){c.fillStyle='#e5484d';c.beginPath();c.roundRect(132,20,104,36,10);c.fill();c.fillStyle='#fffaf0';c.font='bold 22px Fredoka, sans-serif';c.textAlign='center';c.fillText('TRIPPED',184,46);}
    // Past the limit is the red zone.
    c.fillStyle=flash?'#ff9b8f':'#ffd9d3';c.fillRect(lx,y0,X0+W-lx,h);c.fillStyle='#ece6d8';c.fillRect(X0,y0,lx-X0,h);
    // Each plugged load is a segment as long as its draw: solid while current flows, a hatched
    // ghost of the demand while nothing does (tripped, or the reel is not in).
    let x=X0;const flowing=live>0;
    for(const l of loads){const w=W*l.draw/MAX;c.save();c.beginPath();c.rect(x+1.5,y0+3,w-3,h-6);c.clip();
      if(flowing){c.fillStyle=l.color;c.fillRect(x,y0,w,h);}else{c.fillStyle='#fffaf0';c.fillRect(x,y0,w,h);c.strokeStyle=l.color;c.lineWidth=6;for(let k=-h;k<w;k+=14){c.beginPath();c.moveTo(x+k,y0+h);c.lineTo(x+k+h,y0);c.stroke();}}
      c.restore();c.lineWidth=3;c.strokeStyle=INK;c.strokeRect(x+1.5,y0+3,w-3,h-6);this.icon(c,l.id,x+w/2,y0+h/2,flowing);x+=w;}
    c.lineWidth=4;c.strokeStyle=INK;c.strokeRect(X0,y0,W,h);
    // The limit line with its plaque.
    c.fillStyle=INK;c.fillRect(lx-3,y0-10,6,h+20);c.beginPath();c.roundRect(lx-34,y0+h+12,68,28,8);c.fill();c.fillStyle='#fffaf0';c.font='bold 20px Fredoka, sans-serif';c.textAlign='center';c.fillText('5 A',lx,y0+h+33);
    this.boardTex.needsUpdate=true;
  }
  /** Tiny pictograms for the board's segments: urn, heater, projector. */
  private icon(c:CanvasRenderingContext2D,id:string,x:number,y:number,on:boolean){
    c.save();c.translate(x,y);c.strokeStyle=INK;c.fillStyle=on?'#fffaf0':INK;c.lineWidth=3;
    if(id==='urn'){c.beginPath();c.roundRect(-8,-12,16,22,3);c.fill();c.stroke();c.fillRect(8,2,6,4);c.strokeRect(8,2,6,4);}
    else if(id==='heater'){c.beginPath();c.roundRect(-11,-11,22,20,4);c.fill();c.stroke();c.beginPath();for(const yy of [-5,0,5]){c.moveTo(-7,yy);c.lineTo(7,yy);}c.strokeStyle=on?'#e5484d':'#fffaf0';c.stroke();}
    else{c.beginPath();c.roundRect(-13,-8,22,16,3);c.fill();c.strokeStyle=INK;c.stroke();c.beginPath();c.arc(12,0,5,0,7);c.fill();c.stroke();}
    c.restore();
  }
  snapshot(){return {pulses:this.game.pulses.group.visible,tripped:this.tripped,trips:this.trips,unplugged:this.unplugged,heat:this.heat,overloaded:this.overloaded,towerDown:this.towerDown(),draw:this.game.circuit.draw.get('supply')??0,
    demand:this.demand().reduce((s,l)=>s+l.draw,0),appliances:this.appliances.map(x=>({id:x.id,plugged:x.plugged,state:x.load.state})),
    // Which material each lamp wears: a lit lamp keeps the same one from frame to frame.
    lamps:[...this.appliances.map(x=>x.lamp),this.led,this.boardLamp,this.resetCap].map(m=>(m.material as T.Material).uuid)};}
}
