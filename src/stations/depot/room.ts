// Delivery Depot set dressing: a warm loading dock. Brick upper walls over cream wainscot, two big
// roller doors on the back wall with orange delivery trucks backed up to them, blue painted lanes on
// the concrete, hazard-striped dock edges, pallet racks at the back left, and the analogy poster
// (which says where the truck picture stops being true) on the side wall.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,part,group,glow,canvasTex,INK,DMETAL} from '../../render/kit';
import * as TX from '../../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';

const ORANGE='#f28c28',CREAM='#fbf3e2',BRICK='#b5573b',BLUE='#3f7fd6',NAVY='#2c3e66';
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
const flatMat=(map:T.Texture)=>{const m=new T.MeshBasicMaterial({map,transparent:true});m.userData.outlineParameters={visible:false};return m;};
/** Warm brick, drawn once and tiled. */
const brickTex=()=>TX.tex('depot-brick',512,512,c=>{
  c.fillStyle='#e7d7c2';c.fillRect(0,0,512,512);const bh=32,bw=96;
  for(let row=0;row<512/bh;row++)for(let k=-1;k<512/bw+1;k++){const x=k*bw+(row%2?bw/2:0),y=row*bh,shade=((row*7+k*13)%5)/5;
    c.fillStyle=`rgb(${176+shade*22|0},${88+shade*14|0},${62+shade*10|0})`;c.fillRect(x+3,y+3,bw-6,bh-6);}
},{repeat:[1,1]});
const slatTex=()=>TX.tex('depot-slats',256,256,c=>{c.fillStyle='#b9c4cf';c.fillRect(0,0,256,256);for(let y=0;y<256;y+=16){c.fillStyle='#9aa7b5';c.fillRect(0,y+11,256,5);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(0,y+2,256,2);}});
/** The analogy poster: what the trucks stand for, and where the picture stops being true. */
const analogyPoster=()=>canvasTex(560,720,c=>{
  c.fillStyle=CREAM;c.fillRect(0,0,560,720);c.fillStyle=ORANGE;c.fillRect(0,0,560,110);
  c.fillStyle=CREAM;c.font=FONT(44);c.textAlign='center';c.fillText('THE TRUCK ANALOGY',280,72);
  const rows:[string,string,string][]=[['road height','≈','voltage'],['trucks / second','≈','current'],['cargo / second','≈','power']];
  rows.forEach(([a,s,b],i)=>{const y=185+i*100;c.fillStyle=[NAVY,BLUE,'#ffc94d'][i];c.beginPath();c.roundRect(28,y-46,504,80,20);c.fill();
    c.fillStyle=i===2?INK:CREAM;c.font=FONT(32);c.textAlign='right';c.fillText(a,260,y+6);c.textAlign='center';c.fillText(s,288,y+6);c.textAlign='left';c.fillText(b,316,y+6);});
  c.fillStyle=INK;c.font=FONT(28,600);c.textAlign='center';
  ['Trucks are never used up:','they come back empty, not gone.','Voltage is not a number of trucks.','It is an analogy. Meters tell the truth.'].forEach((t,i)=>c.fillText(t,280,510+i*46));
});
function signBoard(parent:T.Object3D,text:string,x:number,y:number,z:number,w:number,h:number,bg:string,fg:string){
  const m=part(parent,new T.PlaneGeometry(w,h),flatMat(canvasTex(512,Math.round(512*h/w),(c,W,H)=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,W-8,H-8,24);c.fill();c.fillStyle=fg;c.font=FONT(Math.round(H*.5));c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H/2+3);})),x,y,z,false);
  return m;
}
/** A box truck backed up to a roller door (the cab is outside, past the wall). */
function truck(game:Game,x:number,zBack:number){
  const r=game.decorRoot,g=group(r,x,0,zBack);
  part(g,rbox(1.9,2,3.1,.12),toon(ORANGE),0,1.45,-1.55);part(g,box(1.94,.1,3.12),toon('#c9621a'),0,.5,-1.55);
  part(g,box(1.7,.06,.04),toon(CREAM),0,2.2,.01);
  // Rear doors swung open; crates inside the box.
  for(const s of [-1,1]){const d=part(g,rbox(.9,1.8,.05,.03),toon('#ffa54a'),s*1.35,1.45,.2);d.rotation.y=s*1.35;}
  part(g,box(1.7,1.7,.02),toon('#3a2f2c'),0,1.4,-.02,false);
  for(const [cx,cy] of [[-.45,.8],[.2,.8],[-.1,1.35]])part(g,rbox(.5,.5,.5,.05),toon('#c98f5a'),cx,cy,-.35);
  for(const [wx,wz] of [[-.95,-.6],[.95,-.6],[-.95,-2.4],[.95,-2.4]])part(g,cyl(.4,.4,.3,20,'x'),toon(INK),wx,.4,wz);
  part(g,box(2,.14,.16),toon(INK),0,.5,.08);for(const s of [-1,1])part(g,box(.14,.1,.04),toon('#e5484d'),s*.8,.62,.17);
  solid(game,2,2.4,3.2,x,1.2,zBack-1.55);
}
function rollerDoor(back:T.Object3D,x:number,open:number){
  const w=2.5,h=2.6,top=h,bottom=open;
  for(const s of [-1,1])part(back,box(.16,h+.1,.2),toon('#e6b35a'),x+s*(w/2+.08),h/2,.12);
  part(back,cyl(.2,.2,w+.3,16,'x'),toon('#8f99a6'),x,h+.22,.25);part(back,box(w+.36,.14,.24),toon('#e6b35a'),x,h+.02,.12);
  const slats=part(back,new T.PlaneGeometry(w,top-bottom),toon('#ffffff',{map:slatTex()}),x,(top+bottom)/2,.15,false);slats.userData.noAO=true;
  part(back,box(w,.08,.08),toon('#6b7385'),x,bottom,.17);
  // Daylight under the raised door.
  const sky=part(back,new T.PlaneGeometry(w,bottom),new T.MeshBasicMaterial({color:'#ffe3b8'}),x,bottom/2,.13,false);(sky.material as T.Material).userData.outlineParameters={visible:false};
}

export function dressDepot(game:Game,kit:RoomKit){
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // Concrete floor; the loading lane on the right is a darker pad with a hazard edge at the dock.
  kit.floor(-W,W,-D,D,TX.concreteFloor('#d6cbb8'),4);
  kit.floor(4.6,W,-D,-3.8,TX.concreteFloor('#b9b2a6'),3,.004);
  part(r,box(W-4.6,.012,.22),toon('#ffffff',{map:TX.hazardStripe()}),(4.6+W)/2,.01,-3.8,false);
  // Blue painted lanes: a loop from the dock to the bench area and back.
  const lane=toon(BLUE);for(const [x0,z0,x1,z1] of [[-9.8,1.4,9.8,1.4],[-9.8,5.6,9.8,5.6],[4.4,-3.6,4.4,1.4],[-9.8,1.4,-9.8,5.6]]){const len=Math.hypot(x1-x0,z1-z0),m=part(r,box(len,.01,.12),lane,(x0+x1)/2,.007,(z0+z1)/2,false);m.rotation.y=-Math.atan2(z1-z0,x1-x0);}
  for(let k=0;k<6;k++){const m=part(r,box(.5,.011,.14),toon(CREAM),-7+k*2.6,.008,3.5,false);m.rotation.y=0;}
  kit.floor(-3.6,2.8,-1.9,-.8,TX.rugTex(NAVY,'#f2c98f'),2,.006);
  // Brick above the wainscot on both walls, roller doors and trucks on the right of the back wall.
  const back=kit.back,side=kit.side;
  const brick=(parent:T.Object3D,x:number,len:number)=>{const t=brickTex().clone();t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(len/2.4,1.94/2.4);t.needsUpdate=true;
    const m=part(parent,new T.PlaneGeometry(len,1.94),toon('#ffffff',{map:t}),x,1.06+.97,.152,false);m.userData.noAO=true;};
  brick(back,0,l.width);brick(side,0,l.depth);
  kit.backWindows(x=>x>1.5,.14);
  rollerDoor(back,5.9,1.9);rollerDoor(back,9,1.1);
  truck(game,5.9,-D+3.35+.02);truck(game,9,-D+3.35+.02);
  for(const x of [5.9,9])for(const s of [-1,1])part(r,rbox(.22,.34,.14,.04),toon(INK),x+s*.8,.35,-D+.35);
  signBoard(back,'DELIVERY DEPOT',3.05,2.6,.2,2.1,.42,ORANGE,CREAM);
  // Wall meters over the dock: the real instruments, next to the trucks.
  for(const [x,t] of [[2.65,'V'],[3.55,'A']] as const){const g=group(back,x,1.75,.2);part(g,cyl(.34,.34,.08,28,'z'),toon(INK));part(g,new T.CircleGeometry(.28,32),toon(CREAM),0,0,.045);
    const n=part(g,box(.025,.22,.01),toon('#e5484d'),.05,.06,.055);n.rotation.z=-.5;signBoard(g,t,0,-.14,.056,.16,.12,CREAM,INK);}
  // Pallet racks at the back left with boxes on them.
  for(const rx of [-8.6,-5.8]){const rack=group(r,rx,0,-D+.9);for(const x of [-1.25,1.25])for(const z of [-.45,.45])part(rack,box(.1,2.3,.1),toon(ORANGE),x,1.15,z);
    for(const y of [.12,1.1,2.1]){part(rack,box(2.6,.08,1),toon('#c9a07a'),0,y,0);part(rack,box(2.6,.1,.08),toon(BLUE),0,y,.5);}
    for(let k=0;k<4;k++)part(rack,rbox(.55,.45,.6,.05),toon(k%2?'#c98f5a':'#d7a56d'),-.9+k*.6,1.37,0);
    for(let k=0;k<3;k++)part(rack,rbox(.6,.5,.7,.05),toon(k%2?'#d7a56d':'#b5835a'),-.7+k*.7,.41,0);
    solid(game,2.7,2.4,1.1,rx,1.2,-D+.9);}
  // Side wall: the analogy poster, a clock-in board and a big voltage-per-charge wall art.
  const poster=group(side,-.8,1.85,.16);part(poster,box(1.14,1.46,.04),toon(INK));const pf=new T.Mesh(new T.PlaneGeometry(1.06,1.38),toon('#ffffff',{map:analogyPoster()}));pf.position.z=.025;poster.add(pf);
  wallArt(side,'cork',3.4,1.9,.16,0,1);wallArt(side,'graph',-4.6,1.9,.16,0,.9);
  // Dispatcher's corner: a raised desk and a rug.
  rug(r,6.8,5.2,3,2.2,ORANGE,'#ffe0b8');
  // A stack of pallets and a charging point by the lane.
  for(let k=0;k<4;k++)part(r,box(1.2,.12,1),toon('#c9a07a'),-9.6,.06+k*.14,-3.2);solid(game,1.2,.6,1,-9.6,.3,-3.2);
  const cp=group(r,3.7,0,-5.4);part(cp,rbox(.5,1.3,.34,.06),toon(NAVY),0,.65,0);part(cp,box(.34,.2,.02),toon('#9ff3ea'),0,1,.18,false);glow(cp,'rgba(120,230,255,1)',.8,.3).position.set(0,1,.25);solid(game,.5,1.3,.34,3.7,.65,-5.4);
  // Lamps hang over the dock and the racks, clear of the bench view.
  pendant(game.root,7.4,-2.4,{y:2.8,color:ORANGE});pendant(game.root,-7.2,-4.2,{y:2.7,color:ORANGE,light:false});pendant(game.root,6.8,5,{y:2.7,color:'#ffc94d',light:false});
  pointLamp(game.root,-.5,2.7,-1.3,{color:'#fff1d6',intensity:5,distance:5.5});lampPool(game.root,-.5,-2.4,2.8,.18);
  pointLamp(game.root,7.5,2.4,-4.6,{color:'#ffd9a8',intensity:4,distance:7});
  void DMETAL;
  return {};
}
