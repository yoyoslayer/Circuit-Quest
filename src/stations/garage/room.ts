// Robot Garage set dressing: a bright service garage. Pale concrete with safety-yellow lanes,
// pegboard walls hung with tools, teal delivery robots on their charging pads along the back wall,
// a rolling-road test stand behind the bench, and the delivery dock (roller door + stop line) in
// the back-left corner where the finished robot ends its route. Warm work lamps, none hanging
// over the bench.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,flat,decal,glyph,boltGlyph,DMETAL,INK,plaqueBoard} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pointLamp,lampPool,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';

export const TEAL='#2fb3a6',TEAL2='#5fd0c4',YELLOW='#ffc629',CREAM='#fbf3e2',PEG='#e9d6b0';
/** The rolling-road test stand (world), the robot's charging pad, and the delivery route. */
export const STAND={x:.7,z:-4.45,y:.63};
export const PAD={x:6.4,z:-5.2};
/** The route's last leg runs up to the dock door in the back wall (z −10 since the room grew to 30 × 20). */
export const ROUTE:[number,number][]=[[STAND.x,STAND.z],[3.6,-4.45],[3.9,1.9],[-6.4,2.3],[-8.1,-1.2],[-8.1,-7.6]];
export const DOCK={x:-8.1,z:-8.05};

const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
export function plaque(text:string,w:number,h:number,bg:string,fg=INK,size=48){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(26,h*.3));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';let s=size;c.font=FONT(s);while(s>12&&c.measureText(text).width>w-40){s--;c.font=FONT(s);}c.fillText(text,w/2,h/2+2);});
}
/** Pegboard with painted tool outlines and the tools hung on it. */
const pegboard=(seed:number)=>canvasTex(768,384,c=>{
  c.fillStyle=PEG;c.fillRect(0,0,768,384);c.fillStyle='rgba(120,90,50,.35)';for(let y=12;y<384;y+=24)for(let x=12;x<768;x+=24){c.beginPath();c.arc(x,y,3,0,7);c.fill();}
  const r=TX.rng(seed);c.lineCap='round';c.lineJoin='round';
  for(let k=0;k<9;k++){const x=50+k*80+r()*14,y=110+r()*150,kind=Math.floor(r()*4),col=['#e5484d','#3f7fd6',TEAL,'#f08a4b'][Math.floor(r()*4)];
    c.save();c.translate(x,y);c.rotate((r()-.5)*.3);
    c.strokeStyle='rgba(43,45,66,.18)';c.lineWidth=14;c.beginPath();c.moveTo(0,-70);c.lineTo(0,70);c.stroke(); // painted shadow outline
    c.strokeStyle=INK;c.lineWidth=5;
    if(kind===0){c.fillStyle='#b8bfcc';c.fillRect(-5,-60,10,90);c.strokeRect(-5,-60,10,90);c.fillStyle=col;c.beginPath();c.roundRect(-11,30,22,44,8);c.fill();c.stroke();} // screwdriver
    if(kind===1){c.fillStyle='#b8bfcc';c.beginPath();c.moveTo(-6,60);c.lineTo(-6,-30);c.arc(0,-44,18,Math.PI*.7,Math.PI*2.3);c.lineTo(6,60);c.closePath();c.fill();c.stroke();c.fillStyle=PEG;c.fillRect(-6,-66,12,16);} // spanner
    if(kind===2){c.fillStyle=col;c.beginPath();c.roundRect(-8,0,16,64,6);c.fill();c.stroke();c.fillStyle='#8a8f9c';c.beginPath();c.roundRect(-24,-30,48,26,6);c.fill();c.stroke();} // hammer
    if(kind===3){c.fillStyle=col;for(const s of [-1,1]){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(s*18,30,s*10,64);c.lineTo(s*2,64);c.quadraticCurveTo(s*8,30,0,8);c.fill();c.stroke();}c.fillStyle='#b8bfcc';c.beginPath();c.moveTo(-8,0);c.lineTo(0,-50);c.lineTo(8,0);c.closePath();c.fill();c.stroke();} // pliers
    c.restore();}
});
/** A small concrete floor with scuffs and expansion joints. */

export interface RobotParts {root:T.Group;wheels:T.Object3D[];eyes:T.Mesh[];lamp:T.Mesh;face:T.Mesh;cargo:T.Object3D}
/** The teal delivery robot (front = +x), drawn to fit the cart's physics box (1.2 × 0.65 × 0.75)
 *  around its centre. Decor copies use the same model. */
export function robotMesh(body=TEAL,accent=TEAL2,port=false):RobotParts{
  const g=new T.Group(),wheels:T.Object3D[]=[];
  for(const [x,z] of [[-.36,-.33],[.36,-.33],[-.36,.33],[.36,.33]]){const w=group(g,x,-.18,z);part(w,cyl(.15,.15,.1,18,'z'),toon(INK));part(w,cyl(.07,.07,.11,12,'z'),toon('#dfe3ea'));
    for(let k=0;k<3;k++){const s=part(w,box(.2,.03,.112),toon('#9aa3b2'),0,0,0,false);s.rotation.z=k*Math.PI/3;}wheels.push(w);}
  part(g,rbox(1.1,.16,.62,.05),toon('#2b4a55'),0,-.12,0);
  for(const x of [-.57,.57])part(g,rbox(.08,.1,.64,.03),toon(YELLOW),x,-.12,0);
  part(g,rbox(.98,.38,.6,.1),glossyToon(body,{spec:.6,size:.97}),0,.1,0);
  part(g,box(.99,.05,.605),toon(YELLOW),0,.02,0);
  // Cargo bin with a safety-yellow lid, and the head with a face screen and antenna lamp.
  const cargo=group(g,-.18,.29,0);part(cargo,rbox(.5,.26,.54,.05),toon(CREAM),0,.13,0);part(cargo,rbox(.54,.05,.58,.03),toon(YELLOW),0,.28,0);part(cargo,rbox(.14,.04,.08,.02),toon(INK),0,.315,0);
  const head=group(g,.3,.29,0);part(head,rbox(.34,.3,.5,.1),glossyToon(accent,{spec:.6,size:.97}),0,.15,0);
  const face=part(head,rbox(.04,.2,.4,.02),toon('#1d2b33'),.16,.16,0);
  const eyes=[-.1,.1].map(z=>{const e=part(head,sphere(.045,12,10),hot('#7fffe8',1.6),.185,.17,z,false);e.scale.set(.4,1,1);return e;});
  part(head,cyl(.012,.012,.26,6),toon(INK),-.06,.42,.14);const lamp=part(head,sphere(.04,12,10),hot('#8dffb0',1.6),-.06,.56,.14,false);
  // The job robot's service port on its bench-side flank (+z), clear of the wheels: the bench harness plugs in here.
  if(port){part(g,rbox(.14,.09,.04,.015),toon(INK),0,.1,.31);part(g,rbox(.08,.05,.02,.01),toon('#e5484d'),0,.1,.335);}
  return {root:g,wheels,eyes,lamp,face,cargo};
}

export function dressGarage(game:Game,kit:RoomKit){
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // Mid-grey concrete everywhere (floor luma inside DR-54's 140-185 so pale props and job yellow read on it, R5-154); warm planks under the bench.
  kit.floor(-W,W,-D,D,TX.concreteFloor('#a49e92'),4);kit.floor(-3,3,-2.2,-.6,TX.woodPlanks('#d8ad72'),2.2,.006);
  // Windows over the bench and over the drums in the back-right corner; none behind the racks or the dock.
  kit.backWindows(x=>x<-2||(x>6&&x<11),.14);
  // The delivery lane: dashed safety-yellow markings along the robot's route, a stop line at the dock.
  const dash=toon(YELLOW);
  for(let k=1;k<ROUTE.length;k++){const [x0,z0]=ROUTE[k-1],[x1,z1]=ROUTE[k],len=Math.hypot(x1-x0,z1-z0),n=Math.floor(len/.9);
    for(let s=0;s<n;s++){const u=(s+.5)/n,m=part(r,box(.42,.012,.08),dash,x0+(x1-x0)*u,.009,z0+(z1-z0)*u,false);m.rotation.y=-Math.atan2(z1-z0,x1-x0);}}
  part(r,box(1.6,.014,.16),toon(INK),DOCK.x,.01,DOCK.z+.38,false);part(r,box(1.6,.016,.1),toon('#fffaf0'),DOCK.x,.012,DOCK.z+.38,false);
  // ---- Test stand (rolling road) behind the bench, with hazard edging.
  const stand=group(r,STAND.x,0,STAND.z);part(stand,rbox(2,.14,1.3,.05),toon('#3a3d55'),0,.07,0);
  const hz=new T.MeshBasicMaterial({map:TX.hazardStripe()});hz.userData.outlineParameters={visible:false};
  for(const z of [-.62,.62]){const s=part(stand,new T.PlaneGeometry(2,.12),hz,0,.142,z,false);s.rotation.x=-Math.PI/2;s.userData.noAO=true;}
  // The rolling road: one long knurled drum per axle, sunk in a dark slot, under both wheels of that axle.
  for(const x of [-.36,.36]){part(stand,box(.28,.02,1.1),toon(INK),x,.141,0,false);part(stand,cyl(.11,.11,1.0,24,'z'),toon(DMETAL),x,.17,0);
    for(let k=0;k<6;k++)part(stand,cyl(.113,.113,.012,24,'z'),toon(INK),x,.17,-.4+k*.16,false);
    for(const z of [-.52,.52])part(stand,box(.12,.12,.04),toon('#3a3d55'),x,.16,z);}
  plaqueBoard(stand,plaque('TEST STAND',512,128,YELLOW),1.2,.3,0,.98,-.9,{rx:-.2});
  part(stand,box(.06,.84,.06),toon(DMETAL),0,.42,-.88);solid(game,2,.14,1.3,STAND.x,.07,STAND.z);
  // The harness: from the harness board's battery end, over the bench's back lip, along the floor and
  // up into the service port on the robot's flank (the station shows it only while the robot is on the stand).
  const harness=new T.CatmullRomCurve3([[-1.92,1.1,-2.42],[-2.02,1.16,-2.95],[-1.95,1.07,-3.14],[-1.55,.35,-3.5],[-.7,.1,-3.86],[.3,.18,-3.96],[.64,.5,-4.0],[.7,.73,-4.115]].map(([x,y,z])=>new T.Vector3(x,y,z)));
  const hm=part(game.root,new T.TubeGeometry(harness,48,.025,6),toon('#e5484d'),0,0,0,false);hm.name='garage-harness';
  const plug=part(hm,rbox(.1,.07,.05,.015),toon(INK),.7,.73,-4.1,false);plug.rotation.y=0;
  // ---- Charging bays at the back right: teal robots on glowing pads (decor), one empty pad.
  const bw=kit.back;
  // Each bay's charger stands on its own post behind the pad (the back wall is 4.8 m away since the
  // room grew): a dark unit with a cream face, a bolt, a 4-segment charge meter and a cable to a plug
  // on the pad. The posts share a floor cable trunk that runs back to a distribution box on the wall.
  // The parked robots are other colours, fully charged, eyes off (asleep); the job robot's bay meter
  // is empty and its plug lies on the pad.
  const bolt=glyph(boltGlyph),segOn=hot('#8dffb0',1.4),segOff=toon('#4a4f63'),PZ=PAD.z-.95;
  for(const [x,occupied,body] of [[4.4,true,'#6cc58a'],[PAD.x,false,TEAL],[8.4,true,'#b392f0']] as const){const pad=group(r,x,0,PAD.z);part(pad,rbox(1.5,.05,1.1,.03),toon('#2b4a55'),0,.025,0);
    part(pad,box(1.3,.012,.9),hot('#7fffe8',.9),0,.056,0,false);
    const post=group(r,x,0,PZ);part(post,rbox(.5,.06,.4,.02),toon(INK),0,.03,0);part(post,rbox(.16,.84,.16,.03),toon('#3a3d55'),0,.48,0);
    const ch=group(post,0,1.1,.02);part(ch,rbox(.42,.62,.14,.05),toon('#3a3d55'),0,0,0);part(ch,rbox(.34,.4,.02,.03),toon(CREAM),0,.04,.075);part(ch,rbox(.46,.05,.18,.02),toon(DMETAL),0,.33,0);
    decal(ch,bolt,.16,.16,-.06,.08,.088);for(let k=0;k<4;k++)part(ch,box(.06,.08,.02),occupied?segOn:segOff,.1,-.07+k*.095,.088,false);
    const cable=new T.CatmullRomCurve3([[x+.14,.84,PZ+.06],[x+.2,.35,PZ+.16],[x+.12,.05,PZ+.34],[x,.07,PAD.z-.5]].map(([a,b,c])=>new T.Vector3(a,b,c)));
    part(r,new T.TubeGeometry(cable,20,.022,6),toon(INK),0,0,0,false);part(r,rbox(.1,.06,.14,.02),toon(INK),x,.08,PAD.z-.47);solid(game,.5,1.45,.4,x,.72,PZ);
    if(occupied){const bot=robotMesh(body);bot.root.position.set(x,.38,PAD.z);bot.root.rotation.y=Math.PI/2;r.add(bot.root);
      const asleep=toon('#34424a');bot.eyes.forEach(e=>{e.material=asleep;e.scale.set(.4,.25,1);});bot.lamp.material=toon('#4a4f63');solid(game,.75,1,1.2,x,.5,PAD.z);}}
  // The cable trunk (a low ink-capped floor channel) behind the posts and back to the wall's distribution box.
  const trunk=toon('#4a4f63'),cap=toon(INK),TX0=4,TX1=9.6,TZ=PZ-.3;
  part(r,rbox(TX1-TX0,.06,.2,.02),trunk,(TX0+TX1)/2,.03,TZ,false);part(r,box(TX1-TX0,.012,.08),cap,(TX0+TX1)/2,.062,TZ,false);
  part(r,rbox(.2,.06,TZ+D,.02),trunk,TX1,.03,(TZ-D)/2,false);part(r,box(.08,.012,TZ+D),cap,TX1,.062,(TZ-D)/2,false);
  part(bw,rbox(.56,.76,.16,.04),toon('#9aa3b2'),TX1,1.05,.22);part(bw,rbox(.44,.5,.02,.03),toon('#dfe3ea'),TX1,1.08,.31);decal(bw,bolt,.2,.2,TX1,1.12,.325);
  part(bw,box(.12,.7,.08),trunk,TX1,.35,.18);
  const cs=new T.Mesh(new T.PlaneGeometry(3.8,.36),flat(plaque('CHARGING BAYS',1024,96,TEAL,'#fffaf0')));cs.position.set(6.4,2.35,.2);bw.add(cs);
  // Spare-parts racks against the back wall behind the bays: wheels, spare heads and battery packs.
  for(const [cx,seed] of [[5.6,1],[8,2]] as const){const rk=group(r,cx,0,-D+.4),rr=TX.rng(seed);
    for(const px of [-1.07,1.07])for(const pz of [-.24,.24])part(rk,box(.06,1.9,.06),toon('#2f6fb0'),px,.95,pz);
    for(const yy of [.12,.75,1.38])part(rk,box(2.2,.05,.56),toon('#c9ced8'),0,yy,0);
    for(const yy of [.6,1.23,1.86])part(rk,box(2.2,.06,.04),toon('#e5484d'),0,yy,.27,false);
    for(const [yy,row] of [[.145,0],[.775,1],[1.405,2]] as const)for(let k=0;k<4;k++){const ix=-.78+k*.52,kind=(k+row+seed)%3;
      if(kind===0){const w=part(rk,cyl(.17,.17,.12,16,'z'),toon('#2e3036'),ix,yy+.17,0);part(w,cyl(.08,.08,.13,12,'z'),toon('#b8bfcc'),0,0,0);}
      else if(kind===1){part(rk,rbox(.34,.28,.36,.08),glossyToon(rr()<.5?TEAL2:'#6cc58a',{spec:.5,size:.97}),ix,yy+.14,0);part(rk,rbox(.02,.16,.28,.02),toon('#1d2b33'),ix+.17,yy+.15,0,false);}
      else{part(rk,rbox(.36,.2,.3,.03),toon('#3a3d55'),ix,yy+.1,0);part(rk,box(.37,.04,.31),toon('#e5484d'),ix,yy+.16,0,false);}}
    solid(game,2.2,1.9,.56,cx,.95,-D+.4);}
  // ---- Pegboards with tools on the back wall and the side wall; a red tool chest; wheel stacks.
  for(const [x,seed] of [[-4,9]] as const){part(bw,box(3.3,1.55,.05),toon('#b99f71'),x,1.75,.16);const pb=new T.Mesh(new T.PlaneGeometry(3.2,1.45),toon('#ffffff',{map:pegboard(seed)}));pb.position.set(x,1.75,.2);bw.add(pb);}
  const sd=kit.side;part(sd,box(4.2,1.55,.05),toon('#b99f71'),1.2,1.75,.16);const pb2=new T.Mesh(new T.PlaneGeometry(4.1,1.45),toon('#ffffff',{map:pegboard(17)}));pb2.position.set(1.2,1.75,.2);sd.add(pb2);
  // (The side wall's local x runs along world −z.) The bolt sign that marked the socket is on the power pillar now.
  wallArt(sd,'graph',5.6,1.9,.16,0,.9);wallArt(sd,'sun',-8.2,1.85,.16,0,.8);
  const CZ=-D+.7,chest=group(r,-3.6,0,CZ);part(chest,rbox(1.3,1,.6,.05),glossyToon('#e5484d',{spec:.7,size:.97}),0,.55,0);for(let k=0;k<4;k++)part(chest,box(1.1,.03,.02),toon(INK),0,.25+k*.2,.31);
  for(const x of [-.5,.5])part(chest,cyl(.06,.06,.06,10,'z'),toon(INK),x,.03,.2);part(chest,rbox(1.34,.06,.64,.03),toon(DMETAL),0,1.08,0);solid(game,1.3,1.1,.6,-3.6,.55,CZ);
  // ---- The parts bench under the side pegboard: a steel cabinet with a wood top, a vice, and a
  // delivery robot's spare head opened up on it, its face screen beside it.
  const pbz=-1.2,pbx=-W+.44,pbench=group(r,pbx,0,pbz);part(pbench,rbox(.76,.86,3,.04),toon('#9aa3b2'),0,.43,0);part(pbench,rbox(.84,.07,3.08,.03),toon('#d8ad72'),0,.895,0);
  for(let k=0;k<3;k++){part(pbench,box(.02,.66,.9),toon('#7d8597'),.385,.44,-1+k,false);part(pbench,box(.03,.04,.24),toon(INK),.4,.7,-1+k,false);}
  const vice=group(pbench,.05,.93,1.1);part(vice,rbox(.26,.14,.18,.03),toon('#3f7fd6'),0,.07,0);part(vice,box(.3,.1,.04),toon(DMETAL),0,.17,-.06);part(vice,box(.3,.1,.04),toon(DMETAL),0,.17,.06);part(vice,cyl(.012,.012,.3,6,'x'),toon(INK),.2,.12,0);
  const spare=group(pbench,0,.93,-.2);part(spare,rbox(.34,.3,.5,.1),glossyToon(TEAL2,{spec:.6,size:.97}),0,.15,0);part(spare,box(.36,.04,.34),toon('#1d2b33'),0,.31,0,false);
  part(spare,rbox(.04,.2,.4,.02),toon('#1d2b33'),.06,.12,-.62).rotation.x=-.3;part(spare,cyl(.15,.15,.1,18,'z'),toon(INK),0,.15,-1.1);
  solid(game,.84,.95,3.08,pbx,.47,pbz);
  // ---- The tyre rack along the left wall past the bench: two rows of wheels standing in a steel frame.
  const trz=4.8,trx=-W+.48,trk=group(r,trx,0,trz);
  for(const pz of [-1.75,0,1.75])for(const px of [-.3,.3])part(trk,box(.06,1.95,.06),toon('#2f6fb0'),px,.975,pz);
  for(const yy of [.08,1.02])for(const px of [-.3,.3])part(trk,box(.06,.06,3.56),toon('#2f6fb0'),px,yy,0);
  for(const yy of [.1,1.04])for(let k=0;k<9;k++){const t=group(trk,0,yy+.42,-1.44+k*.36);part(t,new T.TorusGeometry(.3,.12,10,24),toon('#2e3036'),0,0,0);part(t,cyl(.17,.17,.18,16,'z'),toon(k%3?'#b8bfcc':'#e5484d'),0,0,0);}
  solid(game,.7,1.95,3.6,trx,.98,trz);
  // ---- The power pillar: the bench's wall socket (the floor box at level.target) sits at its foot,
  // where the small room's left wall stood. Steel post with hazard wrap, a fused switch box, conduit
  // down to the socket and the bolt sign on two faces.
  const tg=game.level.target,pl=group(r,tg.x-.55,0,tg.z),hzp=new T.MeshBasicMaterial({map:TX.hazardStripe()});hzp.userData.outlineParameters={visible:false};
  part(pl,rbox(.6,.06,.6,.02),toon(DMETAL),0,.03,0);part(pl,box(.34,2.5,.34),toon('#3a3d55'),0,1.25,0);part(pl,box(.36,.5,.36),hzp,0,.3,0,false);part(pl,rbox(.42,.08,.42,.02),toon(DMETAL),0,2.52,0);
  part(pl,rbox(.2,.42,.3,.04),toon('#9aa3b2'),.27,1.12,0);part(pl,box(.04,.12,.06),toon('#e5484d'),.38,1.18,0);part(pl,box(.06,.62,.08),toon('#4a4f63'),.21,.55,0);
  wallArt(pl,'bolt',.175,1.75,0,Math.PI/2,.5);wallArt(pl,'bolt',0,1.75,.175,0,.5);solid(game,.36,2.5,.36,tg.x-.55,1.25,tg.z);
  // ---- Tyre stacks: two by the right edge, and the one the bench lead bends round by the pillar (job: it stays put).
  for(const [x,z,n] of [[W-1.2,-2.8,4],[W-1.1,-1.7,3],[-9.9,4.6,5]] as const){const st=group(r,x,0,z);for(let k=0;k<n;k++){part(st,new T.TorusGeometry(.3,.13,10,24),toon('#2e3036'),0,.13+k*.26,0).rotation.x=Math.PI/2;part(st,cyl(.18,.18,.2,16),toon('#b8bfcc'),0,.13+k*.26,0);}solid(game,.85,n*.26,.85,x,n*.13,z);}
  // ---- The delivery dock: a roller door in the back wall with a lamp over it and parcel shelves.
  const door=group(bw,DOCK.x,0,0);part(door,box(2.6,2.7,.08),toon('#2b4a55'),0,1.35,.12);part(door,box(2.3,2.4,.05),toon('#c9ced8'),0,1.25,.18);
  for(let k=0;k<11;k++)part(door,box(2.3,.025,.02),toon('#9aa3b2'),0,.12+k*.22,.21,false);
  const dl=part(door,box(.5,.16,.08),toon('#6b6f84'),0,2.75,.22,false);dl.name='dock-lamp';
  const hs=new T.Mesh(new T.PlaneGeometry(2.2,.36),flat(plaque('DELIVERY DOCK',768,128,YELLOW)));hs.position.set(0,2.98,.2);door.add(hs);
  // Parcel shelves standing against the wall: four posts each and back rails, so nothing cantilevers.
  for(const [dx,dz] of [[1.9,.3],[-1.9,.3]]){const sh=group(r,DOCK.x+dx,0,-D+dz);part(sh,box(.9,.06,.5),toon('#a8734a'),0,.6,0);part(sh,box(.9,.06,.5),toon('#a8734a'),0,1.2,0);
    for(const px of [-.42,.42])for(const pz of [-.22,.22])part(sh,box(.05,1.3,.05),toon(DMETAL),px,.65,pz);for(const yy of [.62,1.22])part(sh,box(.9,.04,.03),toon(DMETAL),0,yy+.05,-.23);for(let k=0;k<2;k++)part(sh,rbox(.32,.24,.3,.03),toon(k?'#c98f5a':'#d7a56d'),-.2+k*.38,.76,0);part(sh,rbox(.4,.26,.32,.03),toon('#c98f5a'),0,1.36,0);solid(game,.9,1.4,.5,DOCK.x+dx,.7,-D+dz);}
  // ---- Roll cages of outgoing parcels in the back-left corner beside the dock: wire sides, open front.
  for(const [x,seed] of [[-11.7,3],[-12.85,5]] as const){const cg=group(r,x,0,-D+.62),rr=TX.rng(seed),wire=toon('#9aa3b2');
    part(cg,rbox(.8,.08,.7,.02),toon(DMETAL),0,.14,0);for(const px of [-.32,.32])for(const pz of [-.27,.27])part(cg,cyl(.05,.05,.05,10,'z'),toon(INK),px,.05,pz);
    for(const px of [-.38,.38])for(const pz of [-.33,.33])part(cg,box(.04,1.5,.04),wire,px,.9,pz);
    for(let k=0;k<5;k++){const yy=.4+k*.27;part(cg,box(.78,.02,.02),wire,0,yy,-.33,false);for(const px of [-.38,.38])part(cg,box(.02,.02,.68),wire,px,yy,0,false);}
    for(let k=0;k<4;k++)part(cg,rbox(.3+rr()*.08,.24+rr()*.1,.28,.03),toon(['#c98f5a','#d7a56d','#e0b47a'][k%3]),-.17+(k%2)*.34,.32+Math.floor(k/2)*.3,(rr()-.5)*.1).rotation.y=(rr()-.5)*.4;
    solid(game,.8,1.65,.7,x,.82,-D+.62);}
  // ---- Oil drums on a drip tray in the back-right corner, under the window.
  const dt0=group(r,11.1,0,-D+.75);part(dt0,rbox(1.9,.08,1.1,.03),toon('#2b4a55'),0,.04,0);
  for(const [dx,dz,c] of [[-.5,-.15,'#3f7fd6'],[.2,-.2,'#e5484d'],[-.15,.32,'#2b4a55']] as const){part(dt0,cyl(.29,.29,.88,18),glossyToon(c,{spec:.5,size:.96}),dx,.52,dz);for(const yy of [.32,.72])part(dt0,cyl(.3,.3,.03,18),toon(INK),dx,yy,dz,false);part(dt0,cyl(.05,.05,.03,8),toon(DMETAL),dx+.12,.975,dz);}
  solid(game,1.9,.97,1.1,11.1,.49,-D+.75);
  // ---- The service lift on the right: a scissor lift with a delivery robot up on it, its cargo bin
  // off on the deck and its eyes dark (it's in for a service).
  const LX=12,LZ=-4.8,lift=group(r,LX,0,LZ);part(lift,rbox(1.9,.08,1.3,.03),toon(DMETAL),0,.04,0);
  for(const s of [-1,1]){for(const a of [-1,1]){const arm=part(lift,box(1.7,.07,.06),toon('#3f7fd6'),0,.42,s*.5);arm.rotation.z=a*.42;}part(lift,cyl(.04,.04,.14,8,'z'),toon(INK),0,.42,s*.5);}
  part(lift,rbox(1.8,.1,1.2,.03),toon('#3a3d55'),0,.8,0);for(const z of [-.56,.56]){const s=part(lift,new T.PlaneGeometry(1.8,.1),hzp,0,.856,z,false);s.rotation.x=-Math.PI/2;s.userData.noAO=true;}
  const svc=robotMesh('#f08a4b');svc.root.position.set(.1,.85+.33,0);svc.root.rotation.y=Math.PI;lift.add(svc.root);svc.cargo.visible=false;
  svc.eyes.forEach(e=>{e.material=toon('#34424a');e.scale.set(.4,.25,1);});svc.lamp.material=toon('#4a4f63');
  const bin=group(lift,.62,.85,.34);part(bin,rbox(.5,.26,.54,.05),toon(CREAM),0,.13,0);part(bin,rbox(.54,.05,.58,.03),toon(YELLOW),-.06,.3,.1).rotation.z=.35;
  const ctl=group(r,LX+1.15,0,LZ+.5);part(ctl,box(.08,1.1,.08),toon(DMETAL),0,.55,0);part(ctl,rbox(.2,.28,.12,.03),toon('#3a3d55'),0,1.15,0);part(ctl,cyl(.035,.035,.02,10,'x'),toon('#57e38f'),-.1,1.2,0);part(ctl,cyl(.035,.035,.02,10,'x'),toon('#e5484d'),-.1,1.1,0);
  solid(game,1.9,1.55,1.3,LX,.78,LZ);
  rug(r,-6.8,4.4,3,2,TEAL,'#cdeee9');
  // Warm work lamps: floor spots in the corners and a soft light over the bench (nothing hanging in its view).
  for(const [x,z,ry] of [[-W+.9,-D+1.2,.7],[W-1.6,-D+1.6,-.8],[-W+1.4,D-1.4,2.4]] as const){const lp=group(r,x,0,z,ry);part(lp,cyl(.22,.26,.06,16),toon(INK),0,.03,0);part(lp,cyl(.025,.025,1.8,8),toon(DMETAL),0,.93,0);
    // Work-light head: a closed cup shell with an ink rim, a dark inner face and a recessed bulb,
    // on a swivel, aimed down and forward (reads as a lamp from any orbit, not a flag).
    part(lp,sphere(.05,10,8),toon(DMETAL),0,1.84,.02);const hd=group(lp,0,1.84,.08);hd.rotation.x=.9;
    part(hd,cyl(.24,.12,.26,16),glossyToon(YELLOW,{spec:.8,size:.95}),0,0,0);part(hd,new T.TorusGeometry(.24,.02,8,24),toon(INK),0,-.13,0).rotation.x=Math.PI/2;
    part(hd,cyl(.2,.2,.01,16),toon('#3a3d55'),0,-.12,0,false);part(hd,sphere(.08,10,8),hot('#ffe6b0',2.2),0,-.1,0,false);pointLamp(lp,0,1.6,.6,{color:'#ffd9a0',intensity:4,distance:6});solid(game,.4,1.9,.4,x,.95,z);}
  pointLamp(game.root,0,2.7,-1.7,{color:'#fff1d6',intensity:5,distance:5.5});lampPool(game.root,0,-2.3,2.6,.2);
  pointLamp(game.root,STAND.x,2.4,STAND.z+.2,{color:'#ffe6c0',intensity:3.5,distance:4.5});
  pointLamp(game.root,5,2.4,2,{color:'#ffe0b0',intensity:3,distance:7});pointLamp(game.root,-5,2.4,2.5,{color:'#ffe0b0',intensity:3,distance:7});
  // The outer bays the bigger room added: the service lift, and the parts bench and tyre rack on the left.
  pointLamp(game.root,LX-.6,2.6,LZ+1,{color:'#ffe6c0',intensity:3.5,distance:6.5});pointLamp(game.root,-12.6,2.5,1.6,{color:'#ffe0b0',intensity:3,distance:7});
  // When the robot reaches the dock, the dock lamp glows green.
  const lightUp=()=>{const lamp=door.getObjectByName('dock-lamp') as T.Mesh;lamp.material=hot('#8dffb0',2);const p=lamp.getWorldPosition(new T.Vector3());
    glow(game.root,'rgba(140,255,180,1)',2.4,.45).position.copy(p);pointLamp(game.root,p.x,p.y-.6,p.z+1,{color:'#bfffd0',intensity:6,distance:6});};
  return {lightUp};
}
