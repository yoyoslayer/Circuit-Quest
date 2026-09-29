// Waterworks set dressing: a bright municipal pump room. Aqua tiles and cream walls, brass and
// copper pipe runs along the back wall, a big header tank and a pair of navy pumps behind the test
// bench, a slow water wheel on the side wall, and the stores (with the load-wheel cart) by the door.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,INK,DMETAL} from '../../render/kit';
import {glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';

const BRASS='#d9a441',COPPER='#c9773f',NAVY='#2c3e66',AQUA='#43b8c4',CREAM='#fbf3e2';
/** A straight pipe between two points with flanges at both ends. */
function pipe(parent:T.Object3D,a:[number,number,number],b:[number,number,number],r:number,color:string){
  const A=new T.Vector3(...a),B=new T.Vector3(...b),len=A.distanceTo(B),m=part(parent,cyl(r,r,len,14),glossyToon(color,{spec:.7,size:.97}),(A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.clone().sub(A).normalize());
  for(const p of [A,B]){const f=part(parent,cyl(r*1.45,r*1.45,.06,14),toon(BRASS),p.x,p.y,p.z);f.quaternion.copy(m.quaternion);}
  return m;
}
function valveWheel(parent:T.Object3D,x:number,y:number,z:number,r=.16,color='#e5484d'){
  const g=group(parent,x,y,z);part(g,new T.TorusGeometry(r,.025,8,28),toon(color));for(const a of [0,Math.PI/2])part(g,box(r*2,.03,.03),toon(color)).rotation.z=a;part(g,cyl(.04,.04,.12,10,'z'),toon(INK),0,0,-.05);return g;
}
function wallGauge(parent:T.Object3D,x:number,y:number,z:number,s=1){
  const g=group(parent,x,y,z);g.scale.setScalar(s);part(g,cyl(.2,.2,.06,24,'z'),toon(BRASS));const f=part(g,new T.CircleGeometry(.16,32),toon(CREAM),0,0,.035);f.userData.noAO=true;
  const n=part(g,box(.02,.13,.01),toon('#e5484d'),.03,.04,.045);n.rotation.z=-.6;part(g,cyl(.02,.02,.02,8,'z'),toon(INK),0,0,.05);return g;
}
/** The analogy poster: short, and it says what the analogy does not cover. */
const analogyPoster=()=>canvasTex(512,680,c=>{
  c.fillStyle=CREAM;c.fillRect(0,0,512,680);c.fillStyle=NAVY;c.fillRect(0,0,512,110);
  c.fillStyle=CREAM;c.font='700 44px "Fredoka Variable", system-ui, sans-serif';c.textAlign='center';c.fillText('AN ANALOGY',256,72);
  const rows:[string,string,string][]=[['pressure','≈','voltage'],['flow','≈','current'],['restriction','≈','resistance']];
  rows.forEach(([a,s,b],i)=>{const y=190+i*110;c.fillStyle=i===0?AQUA:i===1?BRASS:COPPER;c.beginPath();c.roundRect(34,y-50,444,86,20);c.fill();
    c.fillStyle=INK;c.font='700 38px "Fredoka Variable", system-ui, sans-serif';c.textAlign='right';c.fillText(a,220,y+6);c.textAlign='center';c.fillText(s,256,y+6);c.textAlign='left';c.fillText(b,292,y+6);});
  c.fillStyle=INK;c.font='600 30px "Fredoka Variable", system-ui, sans-serif';c.textAlign='center';
  ['Steady, linear cases only.','Real pipes are not circuits.'].forEach((t,i)=>c.fillText(t,256,560+i*44));
});

export function dressWaterworks(game:Game,kit:RoomKit){
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // Aqua tiles in the pump hall and around the bench; warm planks by the stores and the door.
  kit.floor(-W,W,-D,1.2,TX.kitchenTiles('#eef7f4','#9fdcd6',8),4);kit.floor(-W,W,1.2,D,TX.woodPlanks('#d8ad72'),3.2);
  kit.floor(-3.4,2.2,-1.9,-.6,TX.rugTex(NAVY,'#9fdcd6'),2,.006);
  kit.backWindows(x=>Math.abs(x)<5.5,.14);
  // Back wall: two long pipe runs with valves and gauges.
  const bw=kit.back;
  pipe(bw,[-10.6,2.25,.35],[10.6,2.25,.35],.11,COPPER);pipe(bw,[-10.6,1.55,.3],[-2,1.55,.3],.08,BRASS);pipe(bw,[2.2,1.55,.3],[10.6,1.55,.3],.08,BRASS);
  for(const x of [-5.5,-1.2,3,7.2])pipe(bw,[x,.05,.35],[x,2.25,.35],.07,COPPER);
  for(const x of [-7.8,-3.3,5.2,9])valveWheel(bw,x,1.55,.46,.14);
  for(const [x,y] of [[-4.4,2.62],[-.1,2.62],[1.9,1.2],[4.2,2.62],[8.2,2.62]] as const)wallGauge(bw,x,y,.36,.9);
  // A big header tank with a sight glass, and two navy pumps: all behind the bench.
  const tank=group(r,-8.2,0,-5.9);part(tank,cyl(1.05,1.05,2.4,28),toon('#e8eef0'),0,1.3,0);part(tank,sphere(1.05,24,12),toon('#e8eef0'),0,2.5,0).scale.y=.35;
  for(const y of [.4,1.3,2.2])part(tank,cyl(1.08,1.08,.08,28),toon(NAVY),0,y,0);
  part(tank,box(.14,1.6,.06),toon(INK),.75,1.3,.72).rotation.y=-.8;part(tank,box(.09,.9,.07),toon(AQUA),.75,1,.73).rotation.y=-.8;
  for(const a of [0,2.1,4.2])part(tank,cyl(.06,.06,.3,8),toon(DMETAL),Math.cos(a)*.9,.1,Math.sin(a)*.9);solid(game,2.1,2.8,2.1,-8.2,1.4,-5.9);
  pipe(r,[-7.15,.5,-5.9],[-5.4,.5,-5.9],.09,COPPER);pipe(r,[-5.4,.5,-5.9],[-5.4,.5,-7.6],.09,COPPER);
  for(const [x,c] of [[5.2,NAVY],[7.4,NAVY]] as const){const p=group(r,x,0,-6.4);part(p,rbox(1.4,.18,1,.05),toon(DMETAL),0,.09,0);part(p,cyl(.36,.36,.7,22,'x'),toon(c),-.2,.62,0);part(p,cyl(.4,.4,.08,22,'x'),toon(BRASS),.18,.62,0);
    part(p,sphere(.34,20,14),toon(AQUA),.42,.62,0).scale.x=.6;part(p,cyl(.1,.1,.9,12),toon(COPPER),.42,1.3,0);part(p,rbox(.3,.18,.2,.04),toon(CREAM),-.2,1.06,0);solid(game,1.4,1.2,1,x,.6,-6.4);}
  // Side wall: a slow wooden water wheel in a trough, and the analogy poster.
  const side=kit.side;
  const wheel=group(side,-5.2,1.35,.5);wheel.name='ww-bigwheel';
  part(wheel,new T.TorusGeometry(1.05,.06,10,40),toon('#a8734a'));part(wheel,new T.TorusGeometry(.62,.05,10,32),toon('#a8734a'));part(wheel,cyl(.14,.14,.4,16,'z'),toon(INK));
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2,p=part(wheel,box(.1,.36,.34),toon('#c99a64'),Math.cos(a)*1.02,Math.sin(a)*1.02,0);p.rotation.z=a;const s=part(wheel,box(.05,.95,.06),toon('#a8734a'),Math.cos(a)*.5,Math.sin(a)*.5,0);s.rotation.z=a+Math.PI/2;}
  part(side,rbox(2.6,.35,.8,.05),toon(AQUA),-5.2,.18,.5);part(side,box(2.3,.05,.6),toon('#8fd3e8',{opacity:.8}),-5.2,.34,.5);
  const poster=group(side,-1.2,1.85,.16);part(poster,box(1.02,1.36,.04),toon(INK));const pf=new T.Mesh(new T.PlaneGeometry(.94,1.26),toon('#ffffff',{map:analogyPoster()}));pf.position.z=.025;poster.add(pf);
  wallArt(side,'graph',2.6,1.9,.16);wallArt(side,'mountain',-9,1.9,.16,0,.9);
  // Stores by the door: shelving with spare wheels and valve wheels, and a "STORE" sign.
  const shelf=group(r,-8.6,0,6.4);part(shelf,box(3,.08,1),toon('#a8734a'),0,.5,0);part(shelf,box(3,.08,1),toon('#a8734a'),0,1.35,0);
  for(const x of [-1.45,1.45])for(const z of [-.45,.45])part(shelf,box(.08,1.7,.08),toon(DMETAL),x,.85,z);
  for(let k=0;k<4;k++){const w=group(shelf,-1+k*.66,1.72,0);part(w,new T.TorusGeometry(.26,.035,8,24),toon(k%2?BRASS:'#9fd8a0'));part(w,cyl(.05,.05,.12,10,'z'),toon(INK));}
  for(let k=0;k<3;k++)valveWheel(shelf,-.9+k*.9,.72,0,.16,k===1?AQUA:'#e5484d').rotation.x=-Math.PI/2;
  solid(game,3,1.8,1,-8.6,.9,6.4);
  const storeSign=part(r,new T.PlaneGeometry(1.4,.34),new T.MeshBasicMaterial({map:canvasTex(512,124,c=>{c.fillStyle=NAVY;c.beginPath();c.roundRect(4,4,504,116,26);c.fill();c.fillStyle=CREAM;c.font='700 64px "Fredoka Variable", system-ui, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('STORES',256,66);}),transparent:true}),-8.6,2.35,5.85,false);
  (storeSign.material as T.Material).userData.outlineParameters={visible:false};
  rug(r,-7.4,3.6,2.6,2,AQUA,'#d6eef0');
  // Lamps hang over the pump hall and the stores, clear of the bench view.
  pendant(game.root,-7.6,-3.6,{y:2.7,color:AQUA});pendant(game.root,6.4,-3.8,{y:2.7,color:AQUA,light:false});pendant(game.root,-7.6,4.4,{y:2.6,color:BRASS,light:false});
  pointLamp(game.root,-.6,2.7,-1.4,{color:'#fff1d6',intensity:5,distance:5.5});lampPool(game.root,-.6,-2.4,2.8,.18);
  pointLamp(game.root,6.3,2.2,-5.6,{color:'#9ff3ea',intensity:4,distance:6});glow(game.root,'rgba(120,230,255,1)',2.8,.1).position.set(6.3,1.2,-6);
  return {};
}
