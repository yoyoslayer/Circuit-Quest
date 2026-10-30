// Big Meeting's load budget. The power strip at the boardroom door already feeds a kettle and a fan
// heater (left on, as office kettles and heaters are). Powered through the reel they draw 4.5 A of
// the strip's 5 A; switching the projector on as well tips it over and the strip's own overload
// breaker trips. Pip unplugs one of them (the boardroom groans) and presses the strip's reset.
// A gauge on the wall above the strip shows its load the whole time, in the same units as the cart
// gauges in Lunch Rush. Truthful at this level: loads on one strip add up; a breaker trips on the
// total; it stays off until reset.
import * as T from 'three';
import type {Game} from './game';
import type {Lead,Load} from './sim/electrical';
import {toon,rbox,box,cyl,sphere,part,group,glow,glyph,cachedTexture,Gauge,INK,METAL,DMETAL} from './render/kit';
import {hot} from './render/actors';
import {solid} from './levels/decor';

type Point={x:number;z:number};
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
/** The strip's built-in breaker (A), and what each appliance draws. Game tuning values. */
export const STRIP_LIMIT=5;
const APPLIANCES=[{id:'kettle',draw:2.5,at:{x:13.95,z:-1.62}},{id:'heater',draw:2,at:{x:15.15,z:-1.68}}] as const;
type ApplianceId=typeof APPLIANCES[number]['id'];
interface Appliance {id:ApplianceId;at:Point;plugged:boolean;lead:Lead;load:Load;cord:T.Mesh;glow:T.Sprite;hot:T.Mesh}

export class MeetingStrip {
  appliances:Appliance[]=[];trips=0;unplugged=0;
  private gauge=new Gauge([[0,.7,'#3bb273'],[.7,.9,'#ffc94d'],[.9,1,'#e5484d']]);private gaugeMount:T.Group;private resetCap:T.Mesh;private eventIndex=0;private couplerBadge:T.Sprite;
  constructor(private game:Game){
    const c=game.circuit,root=game.root,decor=game.decorRoot,t=game.level.target;
    // The reel now feeds the strip (a heavy reel: the strip's breaker is the limit, not the cable).
    c.sources[0].limit=STRIP_LIMIT;c.leads[0].to='strip';c.leads[0].rating=10;
    c.leads.push({id:'strip-projector',from:'strip',to:'projector',rating:10,closed:true,heat:0,dead:false});
    for(const a of APPLIANCES){
      const lead:Lead={id:`strip-${a.id}`,from:'strip',to:a.id,rating:10,closed:true,heat:0,dead:false},load:Load={id:a.id,steady:a.draw,enabled:true,state:'off',started:0};
      c.leads.push(lead);c.loads.push(load);
      const g=group(decor,a.at.x,0,a.at.z);let hotPart:T.Mesh;
      if(a.id==='kettle'){
        // A little side table with the kettle and two mugs.
        part(g,rbox(.7,.06,.46,.03),toon('#c98f5a'),0,.78,0);for(const [x,z] of [[-.3,-.18],[.3,-.18],[-.3,.18],[.3,.18]])part(g,box(.05,.76,.05),toon(DMETAL),x,.38,z);
        part(g,cyl(.13,.15,.24,18),toon('#e9eef2'),-.08,.93,0);part(g,cyl(.05,.07,.05,12),toon(INK),-.08,1.07,0);hotPart=part(g,cyl(.155,.155,.03,18),toon('#5a5f70'),-.08,.82,0);
        part(g,box(.05,.14,.04),toon('#e9eef2'),.06,.95,0);for(const x of [.16,.26])part(g,cyl(.045,.04,.1,12),toon(x<.2?'#ffc94d':'#e5484d'),x,.86,.1);
        solid(game,.7,.85,.46,a.at.x,.42,a.at.z);
      }else{
        // A fan heater on its feet, its grille glowing orange while it runs.
        part(g,rbox(.5,.55,.3,.08),toon('#f0ece2'),0,.32,0);part(g,box(.6,.04,.32),toon(DMETAL),0,.03,0);
        hotPart=part(g,rbox(.36,.3,.02,.04),toon('#5a5f70'),0,.36,.16);for(let k=0;k<4;k++)part(g,box(.34,.02,.03),toon(METAL),0,.24+k*.08,.17,false);
        solid(game,.5,.6,.32,a.at.x,.3,a.at.z);
      }
      const halo=glow(root,a.id==='kettle'?'rgba(255,255,255,1)':'rgba(255,140,60,1)',a.id==='kettle'?.6:1,0);halo.position.set(a.at.x+(a.id==='kettle'?-.08:0),a.id==='kettle'?1.25:.45,a.at.z+(a.id==='kettle'?0:.25));
      const cord=part(root,new T.BufferGeometry(),toon('#3a3d55'),0,0,0,false);
      this.appliances.push({id:a.id,at:a.at,plugged:true,lead,load,cord,glow:halo,hot:hotPart});
    }
    // The load gauge on the wall above the strip's spot, and a breaker badge for when it trips.
    this.gaugeMount=this.gauge.mount(decor,t.x+.95,1.55,t.z+.06,.8);
    this.resetCap=part(root,sphere(.07,12,10),toon('#d63a3f'),0,-5,0,false);
    // After the reel refuses to mate without the coupler, the coupler wears a badge until it is fitted.
    this.couplerBadge=new T.Sprite(new T.SpriteMaterial({map:cachedTexture('coupler-badge',()=>glyph(c=>{c.fillStyle='#fffaf0';c.beginPath();c.arc(128,128,112,0,7);c.fill();c.lineWidth=14;c.strokeStyle=INK;c.stroke();
      c.fillStyle='#ffcc52';c.beginPath();c.roundRect(60,96,136,64,18);c.fill();c.stroke();c.fillStyle=INK;for(const y of [114,142]){c.fillRect(196,y-6,34,12);c.fillRect(26,y-6,34,12);}})),depthTest:false}));
    this.couplerBadge.scale.set(.8,.8,1);this.couplerBadge.renderOrder=9;this.couplerBadge.visible=false;root.add(this.couplerBadge);
  }
  private stripProp(){return this.game.props.find(p=>p.spec.id==='strip');}
  private stripAt():Point{const q=this.stripProp()?.body.translation();return q?{x:q.x,z:q.z}:this.game.level.target;}
  get tripped(){return this.game.circuit.sources[0].tripped;}
  /** E near an appliance pulls (or pushes back) its plug; E at a tripped strip resets its breaker. */
  interact(pos:Point):boolean{
    const g=this.game,a=g.audio;
    if(this.tripped&&g.stripPlaced()&&dist(pos,this.stripAt())<1.6){g.circuit.resetBreaker('supply');a.noise(.08,.1,500);a.tone(640,.06,.04,'triangle');return true;}
    const near=this.appliances.find(x=>dist(pos,x.at)<1.3);if(!near)return false;
    near.plugged=!near.plugged;a.pop();a.noise(.03,.06,2400,'highpass');
    if(!near.plugged){this.unplugged++;
      // Somebody wanted that tea (or that warmth): the boardroom groans.
      g.alarm({x:12,z:-5.5},6);for(let i=0;i<3;i++)setTimeout(()=>a.voice('groan',.85+i*.15),120+i*260);}
    return true;
  }
  prompt(pos:Point):{key:string;text:string}|null{
    if(this.tripped&&this.game.stripPlaced()&&dist(pos,this.stripAt())<1.6)return {key:'E',text:'Reset the strip'};
    const near=this.appliances.find(x=>dist(pos,x.at)<1.3);
    return near?{key:'E',text:`${near.plugged?'Unplug':'Plug in'} the ${near.id}`}:null;
  }
  step(){for(const x of this.appliances)x.lead.closed=x.plugged;}
  render(dt:number){
    const g=this.game,c=g.circuit,t=this.stripAt(),time=g.time;
    // New trips: a bang at the strip.
    for(const e of c.events.slice(this.eventIndex))if(e.kind==='trip'){this.trips++;const at={x:t.x,y:.3,z:t.z};g.burst(at,'#fff3a3',14,'spark');g.burst(at,'#8d8a96',4,'dust');g.audio.tone(75,.25,.1,'square');g.audio.noise(.25,.1,300);g.alarm(at,4);g.shake=.12;}
    this.eventIndex=c.events.length;
    const draw=c.draw.get('supply')??0;this.gauge.set(this.tripped?1:draw/STRIP_LIMIT*.9);
    this.gaugeMount.visible=g.stripPlaced();
    // The reset button on the strip pops up and pulses while tripped.
    const coupler=g.props.find(p=>p.spec.id==='coupler');this.couplerBadge.visible=g.couplerHint&&!g.coupler&&!!coupler?.mesh.visible;
    if(this.couplerBadge.visible){const q=coupler!.body.translation();this.couplerBadge.position.set(q.x,q.y+1.1+Math.sin(time*4)*.08,q.z);}
    this.resetCap.visible=this.tripped&&g.stripPlaced();if(this.resetCap.visible){this.resetCap.position.set(t.x+.32,.22+Math.sin(time*8)*.02,t.z);this.resetCap.material=hot('#ff5a4d',1.4+Math.sin(time*10)*.4);}
    for(const x of this.appliances){const on=x.load.state==='on';
      x.hot.material=on?hot(x.id==='kettle'?'#9fd8ff':'#ff8a3d',1.3):toon('#5a5f70');(x.glow.material as T.SpriteMaterial).opacity=on?.35+.1*Math.sin(time*6):0;
      if(on&&x.id==='kettle'&&Math.random()<dt*3)g.burst({x:x.at.x-.08,y:1.15,z:x.at.z},'#fffaf0',1,'smoke');
      // Its cord runs along the floor to the strip while plugged; unplugged, it lies coiled by the foot.
      x.cord.visible=true;const a=new T.Vector3(x.at.x,.06,x.at.z+.2),b=x.plugged&&g.stripPlaced()?new T.Vector3(t.x+.25,.08,t.z):a.clone().add(new T.Vector3(-.35,0,.15));
      const key=`${b.x.toFixed(2)},${b.z.toFixed(2)}`;if(x.cord.userData.key!==key){x.cord.userData.key=key;x.cord.geometry.dispose();
        x.cord.geometry=new T.TubeGeometry(new T.CatmullRomCurve3([a,a.clone().lerp(b,.5).setY(.04),b]),16,.025,5);}}
  }
  snapshot(){return {tripped:this.tripped,trips:this.trips,unplugged:this.unplugged,draw:this.game.circuit.draw.get('supply')??0,appliances:this.appliances.map(x=>({id:x.id,plugged:x.plugged,state:x.load.state}))};}
}
