// Robot Garage set dressing: a bright service garage. Pale concrete with safety-yellow lanes,
// pegboard walls hung with tools, teal delivery robots on their charging pads along the back wall,
// a rolling-road test stand behind the bench, and the delivery dock (roller door + stop line) in
// the back-left corner where the finished robot ends its route. Warm work lamps, none hanging
// over the bench.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,flat,decal,glyph,boltGlyph,DMETAL,INK} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pointLamp,lampPool,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';

export const TEAL='#2fb3a6',TEAL2='#5fd0c4',YELLOW='#ffc629',CREAM='#fbf3e2',PEG='#e9d6b0';
/** The rolling-road test stand (world), the robot's charging pad, and the delivery route. */
export const STAND={x:.7,z:-4.45,y:.63};
export const PAD={x:6.4,z:-5.2};
export const ROUTE:[number,number][]=[[STAND.x,STAND.z],[3.6,-4.45],[3.9,1.9],[-6.4,2.3],[-8.1,-1.2],[-8.1,-5.6]];
export const DOCK={x:-8.1,z:-6.05};

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
  kit.backWindows(x=>x<-2||x>6,.14);
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
  const sp=part(game.root,new T.PlaneGeometry(1.2,.3),flat(plaque('TEST STAND',512,128,YELLOW)),STAND.x,.9,STAND.z-.9,false);sp.rotation.x=-.2;
  part(stand,box(.06,.8,.06),toon(DMETAL),0,.4,-.85);solid(game,2,.14,1.3,STAND.x,.07,STAND.z);
  // The harness: from the harness board's battery end, over the bench's back lip, along the floor and
  // up into the service port on the robot's flank (the station shows it only while the robot is on the stand).
  const harness=new T.CatmullRomCurve3([[-1.92,1.1,-2.42],[-2.02,1.16,-2.95],[-1.95,1.07,-3.14],[-1.55,.35,-3.5],[-.7,.1,-3.86],[.3,.18,-3.96],[.64,.5,-4.0],[.7,.73,-4.115]].map(([x,y,z])=>new T.Vector3(x,y,z)));
  const hm=part(game.root,new T.TubeGeometry(harness,48,.025,6),toon('#e5484d'),0,0,0,false);hm.name='garage-harness';
  const plug=part(hm,rbox(.1,.07,.05,.015),toon(INK),.7,.73,-4.1,false);plug.rotation.y=0;
  // ---- Charging bays along the back right: teal robots on glowing pads (decor), one empty pad.
  const bw=kit.back;
  // Each bay's wall charger: a dark unit with a cream face, a bolt, a 4-segment charge meter and a
  // cable to a plug on the pad. The parked robots are other colours, fully charged, eyes off (asleep);
  // the job robot's bay meter is empty and its plug lies on the pad.
  const bolt=glyph(boltGlyph),segOn=hot('#8dffb0',1.4),segOff=toon('#4a4f63');
  for(const [x,occupied,body] of [[4.4,true,'#6cc58a'],[PAD.x,false,TEAL],[8.4,true,'#b392f0']] as const){const pad=group(r,x,0,PAD.z);part(pad,rbox(1.5,.05,1.1,.03),toon('#2b4a55'),0,.025,0);
    part(pad,box(1.3,.012,.9),hot('#7fffe8',.9),0,.056,0,false);
    const ch=group(bw,x,.72,.26);part(ch,rbox(.42,.62,.14,.05),toon('#3a3d55'),0,0,0);part(ch,rbox(.34,.4,.02,.03),toon(CREAM),0,.04,.075);
    decal(ch,bolt,.16,.16,-.06,.08,.088);for(let k=0;k<4;k++)part(ch,box(.06,.08,.02),occupied?segOn:segOff,.1,-.07+k*.095,.088,false);
    const cable=new T.CatmullRomCurve3([[x,.42,-D+.3],[x+.1,.05,-D+.5],[x+.05,.04,PAD.z-1.2],[x,.07,PAD.z-.5]].map(([a,b,c])=>new T.Vector3(a,b,c)));
    part(r,new T.TubeGeometry(cable,20,.022,6),toon(INK),0,0,0,false);part(r,rbox(.1,.06,.14,.02),toon(INK),x,.08,PAD.z-.47);
    if(occupied){const bot=robotMesh(body);bot.root.position.set(x,.38,PAD.z);bot.root.rotation.y=Math.PI/2;r.add(bot.root);
      const asleep=toon('#34424a');bot.eyes.forEach(e=>{e.material=asleep;e.scale.set(.4,.25,1);});bot.lamp.material=toon('#4a4f63');solid(game,.75,1,1.2,x,.5,PAD.z);}}
  const cs=new T.Mesh(new T.PlaneGeometry(3.8,.36),flat(plaque('CHARGING BAYS',1024,96,TEAL,'#fffaf0')));cs.position.set(6.4,2.35,.2);bw.add(cs);
  // ---- Pegboards with tools on the back wall and the side wall; a red tool chest; wheel stacks.
  for(const [x,seed] of [[-4,9]] as const){part(bw,box(3.3,1.55,.05),toon('#b99f71'),x,1.75,.16);const pb=new T.Mesh(new T.PlaneGeometry(3.2,1.45),toon('#ffffff',{map:pegboard(seed)}));pb.position.set(x,1.75,.2);bw.add(pb);}
  const sd=kit.side;part(sd,box(4.2,1.55,.05),toon('#b99f71'),1.2,1.75,.16);const pb2=new T.Mesh(new T.PlaneGeometry(4.1,1.45),toon('#ffffff',{map:pegboard(17)}));pb2.position.set(1.2,1.75,.2);sd.add(pb2);
  wallArt(sd,'bolt',-3.4,1.9,.16);wallArt(sd,'graph',5.6,1.9,.16,0,.9);
  const chest=group(r,-3.6,0,-7.3);part(chest,rbox(1.3,1,.6,.05),glossyToon('#e5484d',{spec:.7,size:.97}),0,.55,0);for(let k=0;k<4;k++)part(chest,box(1.1,.03,.02),toon(INK),0,.25+k*.2,.31);
  for(const x of [-.5,.5])part(chest,cyl(.06,.06,.06,10,'z'),toon(INK),x,.03,.2);part(chest,rbox(1.34,.06,.64,.03),toon(DMETAL),0,1.08,0);solid(game,1.3,1.1,.6,-3.6,.55,-7.3);
  for(const [x,z,n] of [[9.8,-2.8,4],[9.9,-1.7,3],[-9.9,4.6,5]] as const){const st=group(r,x,0,z);for(let k=0;k<n;k++){part(st,new T.TorusGeometry(.3,.13,10,24),toon('#2e3036'),0,.13+k*.26,0).rotation.x=Math.PI/2;part(st,cyl(.18,.18,.2,16),toon('#b8bfcc'),0,.13+k*.26,0);}solid(game,.85,n*.26,.85,x,n*.13,z);}
  // ---- The delivery dock: a roller door in the back wall with a lamp over it and parcel shelves.
  const door=group(bw,DOCK.x,0,0);part(door,box(2.6,2.7,.08),toon('#2b4a55'),0,1.35,.12);part(door,box(2.3,2.4,.05),toon('#c9ced8'),0,1.25,.18);
  for(let k=0;k<11;k++)part(door,box(2.3,.025,.02),toon('#9aa3b2'),0,.12+k*.22,.21,false);
  const dl=part(door,box(.5,.16,.08),toon('#6b6f84'),0,2.75,.22,false);dl.name='dock-lamp';
  const hs=new T.Mesh(new T.PlaneGeometry(2.2,.36),flat(plaque('DELIVERY DOCK',768,128,YELLOW)));hs.position.set(0,2.98,.2);door.add(hs);
  // Parcel shelves standing against the wall: four posts each and back rails, so nothing cantilevers.
  for(const [dx,dz] of [[1.9,.3],[-1.9,.3]]){const sh=group(r,DOCK.x+dx,0,-D+dz);part(sh,box(.9,.06,.5),toon('#a8734a'),0,.6,0);part(sh,box(.9,.06,.5),toon('#a8734a'),0,1.2,0);
    for(const px of [-.42,.42])for(const pz of [-.22,.22])part(sh,box(.05,1.3,.05),toon(DMETAL),px,.65,pz);for(const yy of [.62,1.22])part(sh,box(.9,.04,.03),toon(DMETAL),0,yy+.05,-.23);for(let k=0;k<2;k++)part(sh,rbox(.32,.24,.3,.03),toon(k?'#c98f5a':'#d7a56d'),-.2+k*.38,.76,0);part(sh,rbox(.4,.26,.32,.03),toon('#c98f5a'),0,1.36,0);solid(game,.9,1.4,.5,DOCK.x+dx,.7,-D+dz);}
  rug(r,-6.8,4.4,3,2,TEAL,'#cdeee9');
  // Warm work lamps: floor spots in the corners and a soft light over the bench (nothing hanging in its view).
  for(const [x,z,ry] of [[-9.6,-6.6,.7],[9.4,-6.4,-.8],[-9.6,6.6,2.4]] as const){const lp=group(r,x,0,z,ry);part(lp,cyl(.22,.26,.06,16),toon(INK),0,.03,0);part(lp,cyl(.025,.025,1.8,8),toon(DMETAL),0,.93,0);
    const hd=part(lp,new T.ConeGeometry(.2,.3,16,1,true),glossyToon(YELLOW,{spec:.8,size:.95}),0,1.85,.08);hd.rotation.x=-2.2;(hd.material as T.Material).side=T.DoubleSide;
    part(lp,sphere(.08,10,8),hot('#ffe6b0',2.2),0,1.8,.14,false);pointLamp(lp,0,1.6,.6,{color:'#ffd9a0',intensity:4,distance:6});solid(game,.4,1.9,.4,x,.95,z);}
  pointLamp(game.root,0,2.7,-1.7,{color:'#fff1d6',intensity:5,distance:5.5});lampPool(game.root,0,-2.3,2.6,.2);
  pointLamp(game.root,STAND.x,2.4,STAND.z+.2,{color:'#ffe6c0',intensity:3.5,distance:4.5});
  pointLamp(game.root,5,2.4,2,{color:'#ffe0b0',intensity:3,distance:7});pointLamp(game.root,-5,2.4,2.5,{color:'#ffe0b0',intensity:3,distance:7});
  // When the robot reaches the dock, the dock lamp glows green.
  const lightUp=()=>{const lamp=door.getObjectByName('dock-lamp') as T.Mesh;lamp.material=hot('#8dffb0',2);const p=lamp.getWorldPosition(new T.Vector3());
    glow(game.root,'rgba(140,255,180,1)',2.4,.45).position.copy(p);pointLamp(game.root,p.x,p.y-.6,p.z+1,{color:'#bfffd0',intensity:6,distance:6});};
  return {lightUp};
}
