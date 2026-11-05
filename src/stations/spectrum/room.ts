// Spectrum Delivery set dressing: a bright research hall in white and cream with rainbow
// wayfinding stripes. Three destinations stand around it, each a different obstacle: the brick
// storeroom (back left, with a wooden side door), the glass lab behind its metal shutter (back
// right), and the copper-mesh quiet room (front right). The tea corner's toaster smokes between the
// desk and the quiet room. An exhibits case of the bands that are not safe to stand beside sits by
// the back wall, under the ladder to the rooftop hatch. Geometry comes from ./logic (one source).
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,flat,DMETAL,INK,plaqueBoard} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pointLamp,lampPool,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';
import {STORE,LAB,QUIET,HATCH,BANDS,BAND_IDS,POD_HOME,PADS,DOORS,DOOR_IDS,type DoorId,type Band,type Material} from './logic';

export const CREAM='#fbf6ec',PAPER='#fffdf8',BRICK='#c8674a',COPPER='#cf8a4e',STEEL='#8e9bb0';
const RAINBOW=BAND_IDS.map(b=>BANDS[b].color);
// The room's decorative bands (floor stripes, wall rail): only Visible keeps a solid real hue; the invisible
// bands are greyed false-colour tints, so the decor never says near-IR is pink light (R5-050, DR-35).
const DECOR_BANDS=BAND_IDS.map(b=>b==='vis'?BANDS[b].color:'#'+new T.Color(BANDS[b].color).lerp(new T.Color('#b9b4aa'),.6).getHexString());
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
/** A wall material that can fade when it hides Pip (each wall gets its own copy). */
const fading=(m:T.Material)=>{const c=m.clone();c.transparent=true;return c;};

const brickTex=()=>{const t=canvasTex(256,256,c=>{c.fillStyle='#e8d6c4';c.fillRect(0,0,256,256);
  for(let row=0;row<8;row++)for(let k=-1;k<5;k++){const x=k*64+(row%2)*32,y=row*32;const r=TX.rng(row*9+k+20)();c.fillStyle=['#c8674a','#bf5f44','#cf7152','#b85a40'][Math.floor(r*4)];c.fillRect(x+3,y+3,58,26);}});
  t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
/** Fine copper weave: 32 wires per tile over a 0.25 m repeat, so the holes are about 8 mm (well under
 *  a tenth of Wi-Fi's 12.5 cm wave), drawn thin so the far view reads as a copper haze, not moiré. */
const MESH_TILE=.25;
const meshTex=()=>{const t=canvasTex(128,128,c=>{c.clearRect(0,0,128,128);c.fillStyle='rgba(207,138,78,.22)';c.fillRect(0,0,128,128);c.strokeStyle='rgba(207,138,78,.9)';c.lineWidth=1;for(let k=.5;k<=128;k+=4){c.beginPath();c.moveTo(k,0);c.lineTo(k,128);c.stroke();c.beginPath();c.moveTo(0,k);c.lineTo(128,k);c.stroke();}});
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;};
/** Rewrites a box's UVs so every face is mapped at world scale (one texture tile per `tile` metres):
 *  short end faces get short bricks, not squeezed slivers. Use with texture repeat (1, 1). */
function worldUV(geo:T.BufferGeometry,w:number,h:number,d:number,tile:number){
  // BoxGeometry face order: +x, −x (depth × height), +y, −y (width × depth), +z, −z (width × height).
  const size:[number,number][]=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]],uv=geo.attributes.uv as T.BufferAttribute;
  for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*size[f][0]/tile,uv.getY(i)*size[f][1]/tile);}
  uv.needsUpdate=true;return geo;
}
const slatTex=()=>{const t=canvasTex(64,128,c=>{c.fillStyle='#a9b5c8';c.fillRect(0,0,64,128);for(let y=0;y<128;y+=16){c.fillStyle='#8e9bb0';c.fillRect(0,y+11,64,5);c.fillStyle='#c3cddb';c.fillRect(0,y,64,3);}});
  t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
export function plaque(text:string,w:number,h:number,bg:string,fg=INK,size=40){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(22,h*.3));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';let s=size;c.font=FONT(s);while(s>12&&c.measureText(text).width>w-36){s--;c.font=FONT(s);}c.fillText(text,w/2,h/2+2);});
}
/** A sign facing +z: the text on a housed board (a darker edge), readable from both sides. The
 *  caller mounts it on something (a wall face, a rail, a post). Returns the board group. */
function standingSign(parent:T.Object3D,text:string,x:number,y:number,z:number,w:number,bg:string,fg=INK,ry=0){
  const h=w*.22;return plaqueBoard(parent,plaque(text,512,Math.round(512*h/w),bg,fg,44),w,h,x,y,z,{ry,board:new T.Color(bg).offsetHSL(0,0,-.25).getStyle()});
}
/** A straight wall slab between two plan points (axis-aligned), with a collider. */
function slab(game:Game,x0:number,z0:number,x1:number,z1:number,h:number,thick:number,material:T.Material,fade=true,parent:T.Object3D=game.root,uvTile?:number){
  const w=Math.max(thick,Math.abs(x1-x0)),d=Math.max(thick,Math.abs(z1-z0)),x=(x0+x1)/2,z=(z0+z1)/2;
  const m=part(parent,uvTile?worldUV(new T.BoxGeometry(w,h,d),w,h,d,uvTile):box(w,h,d),fade?fading(material):material,x,h/2,z);if(fade)game.occluders.push(m);
  solid(game,w,2.6,d,x,1.3,z);return m;
}
/** Trim that sits on a fading wall (caps, signs) fades with it. */
function fadeWith(game:Game,o:T.Object3D){o.traverse(m=>{if(!(m instanceof T.Mesh))return;const mat=(m.material as T.Material).clone();mat.transparent=true;m.material=mat;game.occluders.push(m);});return o;}

/** A door that swings on a spring: a pivot at the hinge, the leaf's kinematic collider, and the doorway. */
export interface SwingDoor {id:DoorId;pivot:T.Group;body:RAPIER.RigidBody;hinge:{x:number;z:number};closed:number;
  /** Turning the pivot by +angle swings the leaf toward this z side (+1 or −1). */
  sign:1|-1;width:number}
/** The wave-versus-material notebook on the wall: a cell fills in the first time a send shows it. */
export interface Chart {mark(band:Band,mat:Material,loss:number):boolean}
/** The smoking toaster is a real (asleep) physics body on the tea counter: something thrown hard at it
 *  knocks it off, and then the smoke stops (R5-079). The station keeps the mesh on the body. */
export interface Toaster {mesh:T.Object3D;body:RAPIER.RigidBody;home:T.Vector3}
export interface SpectrumRoom {hatchDoor:T.Object3D;smoke:T.Sprite[];doors:SwingDoor[];chart:Chart;lightUp:()=>void;toaster:Toaster}
export function dressSpectrum(game:Game,kit:RoomKit):SpectrumRoom{
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // ---- Floors: pale research-hall tiles; warm oak in the storeroom; pale blue lino in the lab; a rug in the quiet room.
  kit.floor(-W,W,-D,D,TX.kitchenTiles('#d9d2c4','#cdd5dc',6),3.2); // mid grey-cream, inside DR-54's luma band (R5-154)
  kit.floor(STORE.x0,STORE.x1,STORE.z0,STORE.z1,TX.woodPlanks('#d9ae78'),2.6,.004);
  kit.floor(LAB.x0,LAB.x1,LAB.z0,LAB.z1,TX.kitchenTiles('#c9dbe8','#b8cfe0',4),2.4,.004);
  kit.floor(QUIET.x0,QUIET.x1,QUIET.z0,QUIET.z1,TX.carpetTiles('#c9b8ea'),2.4,.004);
  rug(r,8.3,5,3.2,2.4,'#8b7be8','#e2dbff');rug(r,-6.4,5.4,2.4,2,'#3fae6a','#d5f2de');
  // Rainbow wayfinding stripes on the floor, from the entrance along the front of the hall: flat decals
  // in front of the pod dock's rug (not under it). They glow in place when the last message lands.
  const stripes=DECOR_BANDS.map((c,i)=>{const m=part(r,new T.PlaneGeometry(13.5,.1),toon(c),-3.9,.006,7.4-i*.16,false);m.rotation.x=-Math.PI/2;m.userData.noAO=true;return m;});
  // A rainbow band at rail height on the back and side walls.
  DECOR_BANDS.forEach((c,i)=>{part(kit.back,box(l.width-.4,.05,.02),toon(c),0,1.3+i*.055,.14,false);part(kit.side,box(l.depth-.4,.05,.02),toon(c),0,1.3+i*.055,.14,false);});
  // Windows light the (sunny) lab, with strong sun shafts; the storeroom has none and the hall's back wall holds the exhibits.
  kit.backWindows(x=>x<LAB.x0+.6,.3);
  // Sunlight lands on the lab pad and the benches: the glare the visible-light detector has to fight.
  lampPool(game.root,PADS.lab.x,PADS.lab.z,1.25,.34,'#ffe39a');lampPool(game.root,4.4,-6.4,1.1,.26,'#ffe39a');lampPool(game.root,8.9,-5.2,.9,.22,'#ffe39a');

  // ---- The brick storeroom (back left): brick front with a doorway at the far left, brick side wall with a wooden door.
  const brick=brickTex();brick.repeat.set(1,1);const bm=()=>toon('#ffffff',{map:brick});
  const bh=2.1,s=STORE;
  slab(game,s.door[1],s.z1,s.x1,s.z1,bh,.3,bm(),true,game.root,1.3);
  slab(game,s.x1,s.z0,s.x1,s.wood[0],bh,.3,bm(),true,game.root,1.3);slab(game,s.x1,s.wood[1],s.x1,s.z1,bh,.3,bm(),true,game.root,1.3);
  // The wooden door: planks, frame and handle (closed; the way in is the doorway at the front left).
  const door=group(game.root,s.x1,0,(s.wood[0]+s.wood[1])/2);part(door,box(.12,2,s.wood[1]-s.wood[0]),toon('#b98552'),0,1,0);for(const dz of [-.45,0,.45])part(door,box(.14,1.9,.02),toon('#9c6d42'),0,1,dz,false);
  part(door,sphere(.05,10,8),toon('#ffc94d'),.1,1,.5);part(door,box(.16,.1,s.wood[1]-s.wood[0]+.2),toon('#8e5a36'),0,2.05,0);solid(game,.12,2.6,s.wood[1]-s.wood[0],s.x1,1.3,(s.wood[0]+s.wood[1])/2);
  // The caps and the sign fade with the brick when Pip walks behind the wall.
  for(const x of [s.door[1],s.x1])fadeWith(game,part(game.root,box(.34,.12,.34),toon('#8e5a36'),x,bh+.06,s.z1));
  fadeWith(game,part(game.root,box(s.x1-s.door[1]+.3,.08,.36),toon('#e8d6c4'),(s.x1+s.door[1])/2,bh+.04,s.z1,false));
  fadeWith(game,standingSign(game.root,'STOREROOM',(s.door[1]+s.x1)/2,1.75,s.z1+.17,1.5,'#ffe7c2'));
  // Inside: shelves of stock along the back and left: taped cartons of mixed sizes, binders and paint tins.
  const KRAFT=['#d7a56d','#c98f5a','#e5c07b','#b98552'];
  for(const [x,z,ry,seed] of [[-9.6,-7.55,0,3],[-7.2,-7.55,0,8]] as const){const sh=group(r,x,0,z,ry),rand=TX.rng(seed);
    part(sh,box(2,1.9,.02),toon('#b98552'),0,.98,-.24);part(sh,box(2,.1,.46),toon('#8e5a36'),0,.05,0);
    for(const y of [.4,1.1,1.8])part(sh,box(2,.06,.5),toon('#c98a55'),0,y,0);for(const dx of [-.97,.97])part(sh,box(.06,2,.5),toon('#8e5a36'),dx,1,0);
    for(const y of [.43,1.13,1.83]){let cx=-.88;while(cx<.78){const kind=rand();
      if(kind<.18){const w=.07;for(let b=0;b<3&&cx<.86;b++){part(sh,box(w,.3,.25),toon(['#7f8fb8','#b06a6a','#6f9e86'][b]),cx+w/2,y+.15,0);cx+=w+.01;}cx+=.05;continue;}
      if(kind<.3){part(sh,cyl(.09,.09,.14,14),toon('#c9ced8'),cx+.09,y+.07,0);part(sh,cyl(.092,.092,.02,14),toon(DMETAL),cx+.09,y+.14,0);cx+=.24;continue;}
      const w=.26+rand()*.16,h=.2+rand()*.14,d=.3+rand()*.08;if(cx+w>.9)break;const col=KRAFT[Math.floor(rand()*KRAFT.length)];
      part(sh,rbox(w,h,d,.02),toon(col),cx+w/2,y+h/2,0);part(sh,box(w+.004,.004,.06),toon('#e8d6b0'),cx+w/2,y+h+.002,0,false);part(sh,box(.006,.004,d),toon('#7a5a3c'),cx+w/2,y+h+.003,0,false);
      cx+=w+.04;}}
    solid(game,2,2,.5,x,1,z);}

  // ---- The glass lab (back right): a metal-clad clean room. Slatted metal over the side wall, glass across
  // the front with the metal shutter down in front of it, and a metal door that swings shut.
  const lb=LAB,sideSlats=slatTex();sideSlats.repeat.set(1,1);slab(game,lb.x0,lb.z0,lb.x0,lb.z1,bh,.3,toon('#ffffff',{map:sideSlats}),true,game.root,1.1);
  part(r,box(.34,.1,lb.z1-lb.z0+.2),toon('#c98a55'),lb.x0,bh+.05,(lb.z0+lb.z1)/2);
  const glass=part(game.root,box(lb.door[0]-lb.x0,2.5,.05),toon('#cfefff',{opacity:.22}),(lb.x0+lb.door[0])/2,1.25,lb.z1-.1,false);glass.userData.noAO=true;
  solid(game,lb.door[0]-lb.x0,2.6,.2,(lb.x0+lb.door[0])/2,1.3,lb.z1-.02);
  for(const x of [lb.x0,lb.x0+2.4,lb.x0+4.8,lb.door[0]])part(r,box(.08,2.5,.1),toon('#e9eef5'),x,1.25,lb.z1-.1);part(r,box(lb.door[0]-lb.x0,.08,.14),toon('#e9eef5'),(lb.x0+lb.door[0])/2,2.5,lb.z1-.1);
  // The shutter: slatted metal on the hall side, with a roller box on top and the hatch opening.
  const slats=slatTex(),sh=2.05,shutter=(x0:number,x1:number)=>{const t=slats.clone();t.needsUpdate=true;t.repeat.set((x1-x0)/.6,sh/1.1);
    const m=part(game.root,box(x1-x0,sh,.06),fading(toon('#ffffff',{map:t})),(x0+x1)/2,sh/2,lb.z1+.02);game.occluders.push(m);return m;};
  shutter(lb.x0,HATCH.x0);shutter(HATCH.x1,lb.door[0]);
  // Around the hatch: metal above and below it, the hatch opening at beam height.
  const hy0=.95,hy1=1.55;
  part(game.root,box(HATCH.x1-HATCH.x0,hy0,.06),toon('#a9b5c8'),(HATCH.x0+HATCH.x1)/2,hy0/2,lb.z1+.02);part(game.root,box(HATCH.x1-HATCH.x0,sh-hy1,.06),toon('#a9b5c8'),(HATCH.x0+HATCH.x1)/2,(sh+hy1)/2,lb.z1+.02);
  const frame=group(r,(HATCH.x0+HATCH.x1)/2,(hy0+hy1)/2,lb.z1+.06);for(const [w,h,x,y] of [[.72,.06,0,.33],[.72,.06,0,-.33],[.06,.66,-.33,0],[.06,.66,.33,0]] as const)part(frame,box(w,h,.05),toon('#ffc629'),x,y,0);
  const hatchDoor=group(game.root,(HATCH.x0+HATCH.x1)/2,(hy0+hy1)/2,lb.z1+.08);part(hatchDoor,box(HATCH.x1-HATCH.x0,hy1-hy0,.04),toon('#7f8ca3'),0,0,0);part(hatchDoor,box(.2,.05,.05),toon(INK),0,-.2,.03);
  part(r,rbox(lb.door[0]-lb.x0+.2,.26,.3,.06),toon('#7f8ca3'),(lb.x0+lb.door[0])/2,sh+.1,lb.z1+.04);
  standingSign(game.root,'HATCH',(HATCH.x0+HATCH.x1)/2,1.82,lb.z1+.135,.62,'#ffc629');
  standingSign(game.root,'GLASS LAB',7.4,1.82,lb.z1+.135,1.4,'#d8ecff');
  // Inside the lab: benches with glassware in the sunshine, a fume hood.
  for(const x of [4.2,8]){const b=group(r,x,0,-7.3);part(b,rbox(2.4,.9,.8,.05),toon('#e9eef5'),0,.45,0);part(b,box(2.5,.05,.9),toon(PAPER),0,.92,0);
    for(let k=0;k<4;k++)part(b,cyl(.07,.09,.22,12),toon(['#bfe6f5','#d8f5c8','#ffe1dc','#e8dcff'][k],{opacity:.7}),-.9+k*.55,1.06,0);solid(game,2.4,1,.8,x,.5,-7.3);}

  // ---- The quiet room (front right): a copper-mesh screened cage on copper posts, closed all round:
  // mesh on its two hall sides, the hall's own walls lined with the same mesh, and a mesh door.
  const q=QUIET,mt=meshTex(),mh=2.2,meshPlane=(x0:number,z0:number,x1:number,z1:number,h=mh,opacity=1)=>{const len=Math.hypot(x1-x0,z1-z0),t=mt.clone();t.needsUpdate=true;t.repeat.set(len/MESH_TILE,h/MESH_TILE);
    const m=new T.Mesh(new T.PlaneGeometry(len,h),new T.MeshBasicMaterial({map:t,transparent:true,opacity,side:T.DoubleSide,depthWrite:false}));m.material.userData.outlineParameters={visible:false};
    m.position.set((x0+x1)/2,h/2,(z0+z1)/2);m.rotation.y=x0===x1?Math.PI/2:0;m.userData.noAO=true;game.root.add(m);return m;};
  const meshWall=(x0:number,z0:number,x1:number,z1:number)=>{const len=Math.hypot(x1-x0,z1-z0);meshPlane(x0,z0,x1,z1);
    const posts=Math.max(2,Math.round(len/1.6)+1);for(let k=0;k<posts;k++){const f=k/(posts-1);part(r,box(.08,mh,.08),glossyToon(COPPER,{spec:.8,size:.96}),x0+(x1-x0)*f,mh/2,z0+(z1-z0)*f);}
    part(r,box(Math.abs(x1-x0)+.08,.06,Math.abs(z1-z0)+.08),glossyToon(COPPER,{spec:.8,size:.96}),(x0+x1)/2,mh,(z0+z1)/2);part(r,box(Math.abs(x1-x0)+.08,.06,Math.abs(z1-z0)+.08),toon(COPPER),(x0+x1)/2,.03,(z0+z1)/2);
    solid(game,Math.max(.1,Math.abs(x1-x0)),2.6,Math.max(.1,Math.abs(z1-z0)),(x0+x1)/2,1.3,(z0+z1)/2);};
  meshWall(q.x0,q.z0,q.x0,q.z1);meshWall(q.x0,q.z0,q.door[0],q.z0);
  // The hall's side wall inside the room is lined too; the front edge (toward the camera) gets a faint lining.
  meshPlane(q.x1-.06,q.z0,q.x1-.06,q.z1,2.6);meshPlane(q.x0,q.z1-.06,q.x1,q.z1-.06,.5,.7);
  for(const x of [q.x0+1.8,q.x0+3.6])part(r,box(.06,.5,.06),glossyToon(COPPER,{spec:.8,size:.96}),x,.25,q.z1-.06);part(r,box(q.x1-q.x0,.05,.06),glossyToon(COPPER,{spec:.8,size:.96}),(q.x0+q.x1)/2,.5,q.z1-.06);

  // ---- The doors: each room's doorway has a door that swings open as Pip comes near (away from
  // him) and shuts on its spring once he has passed. Something left in the doorway props it open.
  const doors:SwingDoor[]=DOOR_IDS.map(id=>{const o=DOORS[id],wallSide=id==='store'?o.a.x:o.b.x,hinge={x:wallSide+(id==='store'?.04:-.04),z:o.a.z},width=Math.abs(o.b.x-o.a.x)-.1,closed=id==='store'?0:Math.PI;
    const pivot=group(game.root,hinge.x,0,hinge.z,closed),h=id==='quiet'?mh-.06:2.02;
    if(id==='store'){part(pivot,box(width,h,.08),toon('#b98552'),width/2,h/2,0);for(const dx of [.38,.76,1.14])part(pivot,box(.02,h-.1,.1),toon('#9c6d42'),dx,h/2,0,false);part(pivot,sphere(.05,10,8),toon('#ffc94d'),width-.12,1,.07);part(pivot,sphere(.05,10,8),toon('#ffc94d'),width-.12,1,-.07);}
    if(id==='lab'){const t=slatTex();t.repeat.set(1,1);part(pivot,worldUV(new T.BoxGeometry(width,h,.06),width,h,.06,1.1),toon('#ffffff',{map:t}),width/2,h/2,0);part(pivot,box(.5,.36,.07),toon('#cfefff',{opacity:.5}),width/2,1.45,0,false);
      part(pivot,box(.06,.3,.1),toon(INK),width-.14,1,0);}
    if(id==='quiet'){const leaf=new T.Mesh(new T.PlaneGeometry(width,h),new T.MeshBasicMaterial({map:(()=>{const t=mt.clone();t.needsUpdate=true;t.repeat.set(width/MESH_TILE,h/MESH_TILE);return t;})(),transparent:true,side:T.DoubleSide,depthWrite:false}));
      (leaf.material as T.Material).userData.outlineParameters={visible:false};leaf.position.set(width/2,h/2,0);leaf.userData.noAO=true;pivot.add(leaf);
      const cu=glossyToon(COPPER,{spec:.8,size:.96});for(const [w,hh,x,y] of [[width,.06,width/2,h],[width,.06,width/2,.04],[.06,h,.03,h/2],[.06,h,width-.03,h/2],[width,.04,width/2,1.05]] as const)part(pivot,box(w,hh,.05),cu,x,y,0);
      part(pivot,box(.06,.26,.09),toon(INK),width-.14,1.05,0);}
    const at=new T.Vector3(width/2,1.05,0).applyAxisAngle(new T.Vector3(0,1,0),closed).add(pivot.position);
    const body=game.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(at.x,1.05,at.z));game.world.createCollider(RAPIER.ColliderDesc.cuboid(width/2,1.05,.05),body);
    body.setRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),closed),true);
    return {id,pivot,body,hinge,closed,sign:id==='store'?-1:1,width};});
  // The sign stands on the mesh wall's copper top rail.
  standingSign(game.root,'QUIET ROOM · SCREENED',7.45,2.465,q.z0,1.9,'#f3d9c2');
  const chair=group(r,9.9,0,6.6,-2.4);part(chair,rbox(.9,.45,.8,.12),toon('#8b7be8'),0,.3,0);part(chair,rbox(.9,.6,.2,.08),toon('#7a6ad6'),0,.7,-.32);solid(game,.9,.9,.8,9.9,.45,6.6);
  const lamp=group(r,10.4,0,7.4);part(lamp,cyl(.2,.24,.05,16),toon(INK),0,.03,0);part(lamp,cyl(.025,.025,1.5,8),toon(COPPER),0,.78,0);part(lamp,cyl(.16,.28,.3,16),toon('#fff1d6'),0,1.55,0);

  // ---- Tea corner: a counter with the smoking toaster and a kettle.
  const tea=group(r,2.4,0,4.85);part(tea,rbox(2.2,.9,.62,.05),toon('#f4c9c3'),0,.45,0);part(tea,box(2.3,.05,.7),toon(PAPER),0,.92,0);
  // The toaster lives in the room root (not the frozen decor) so it can be knocked off; its body rests on
  // the counter's collider top (1.0 m), the mesh a little lower so it sits on the visible counter.
  const toastAt=new T.Vector3(2.1,1.125,4.85),toasterMesh=group(game.root,toastAt.x,toastAt.y,toastAt.z),toaster=group(toasterMesh,0,-.175,0);
  part(toaster,rbox(.36,.24,.22,.06),glossyToon('#dfe3ea',{spec:.8,size:.96}),0,.12,0);for(const dx of [-.07,.07])part(toaster,box(.04,.02,.16),toon(INK),dx,.245,0);
  for(const dx of [-.07,.07])part(toaster,box(.03,.1,.13),toon('#3a2a20'),dx,.28,0);
  const toastBody=game.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(toastAt.x,toastAt.y,toastAt.z).setLinearDamping(.3).setAngularDamping(.5).setCanSleep(true).setSleeping(true).setCcdEnabled(true));
  game.world.createCollider(RAPIER.ColliderDesc.cuboid(.18,.12,.11).setMass(1.2).setFriction(.7).setRestitution(.1),toastBody);
  const kettle=group(tea,.5,.95,.05);part(kettle,cyl(.12,.15,.22,16),toon('#e5484d'),0,.11,0);part(kettle,cyl(.03,.02,.16,8),toon('#e5484d'),.15,.14,0).rotation.z=-1;
  part(tea,cyl(.05,.045,.1,10),toon('#ffc94d'),.85,1,-.1);solid(game,2.2,1,.62,2.4,.5,4.85);
  part(tea,cyl(.02,.02,.62,8),toon(DMETAL),0,1.25,-.26);standingSign(tea,'TEA',0,1.6,-.26,.5,'#f4c9c3');
  // Smoke: toon puffs with a firm core, rising from the toaster and spreading over the cloud in
  // logic.SMOKE at beam height (the station animates them and thins them around Pip).
  const smoke:T.Sprite[]=[],puff=TX.radial('smoke-cel','rgba(255,255,255,1)','rgba(255,255,255,0)',.55);
  for(let k=0;k<12;k++){const m=new T.Sprite(new T.SpriteMaterial({map:puff,color:'#9a9dac',transparent:true,opacity:.3,depthWrite:false}));m.scale.set(.6,.6,1);m.userData.noAO=true;m.userData.seed=k;game.root.add(m);smoke.push(m);}

  // ---- Back wall between the rooms: the exhibits case and the ladder up to the rooftop hatch.
  const ex=group(r,-1.6,0,-7.35);part(ex,rbox(2.6,.9,.7,.06),toon('#e9e2d4'),0,.45,0);part(ex,box(2.7,.05,.8),toon('#c98a55'),0,.92,0);
  const caseGlass=part(game.root,box(2.5,.7,.6),toon('#dff3ff',{opacity:.25}),-1.6,1.3,-7.35,false);caseGlass.userData.noAO=true;
  const uv=group(ex,-.85,.95,0);part(uv,rbox(.4,.12,.2,.04),toon(INK),0,.06,0);part(uv,cyl(.03,.03,.36,10,'x'),hot('#b9a6ff',2),0,.16,0);
  const xr=group(ex,0,.95,0);part(xr,cyl(.09,.09,.44,14,'x'),toon('#cfe3ef',{opacity:.7}),0,.2,0);part(xr,cyl(.05,.05,.1,10,'x'),toon(DMETAL),-.22,.2,0);part(xr,cyl(.05,.05,.1,10,'x'),toon(DMETAL),.22,.2,0);
  const pig=group(ex,.85,.95,0);part(pig,cyl(.14,.16,.3,16),toon('#6b7385'),0,.15,0);part(pig,cyl(.15,.15,.05,16),toon('#ffd66b'),0,.32,0);
  const warn=part(kit.back,new T.PlaneGeometry(2.8,.5),flat(plaque('UV · X-RAY · GAMMA: exhibits only. Not safe to stand beside.',1200,214,'#ffe1dc','#7a1f22',60)),-1.6,2.05,.18,false);warn.userData.noAO=true;
  solid(game,2.6,1.7,.7,-1.6,.85,-7.35);
  const ladder=group(r,.9,0,-7.78);for(const x of [-.25,.25])part(ladder,box(.06,2.9,.06),toon(DMETAL),x,1.45,0);for(let k=0;k<8;k++)part(ladder,box(.5,.04,.05),toon(DMETAL),0,.3+k*.34,0);
  const roof=part(kit.back,new T.PlaneGeometry(1.2,.3),flat(plaque('ROOF HATCH ↑',512,128,'#fff1c2')),.9,2.75,.18,false);roof.userData.noAO=true;
  // ---- Front: the pod's charging dock by the entrance, and a band chart on the side wall.
  const dock=group(r,POD_HOME.x,0,POD_HOME.z);part(dock,cyl(.75,.8,.05,28),toon('#dff3e6'),0,.025,0);part(dock,new T.TorusGeometry(.72,.03,8,40),toon('#3fae6a'),0,.06,0).rotation.x=Math.PI/2;
  {const tag=part(r,new T.PlaneGeometry(.8,.176),flat(plaque('POD DOCK',512,113,'#d5f2de',INK,44)),POD_HOME.x,.013,POD_HOME.z+.92,false);tag.rotation.x=-Math.PI/2;tag.userData.noAO=true;}
  // The notebook chart: it starts empty and fills in, cell by cell, as sends show what each band does
  // at each material (green gets through, amber loses a lot, red stops it).
  const COLS:Material[]=['brick','glass','metal','mesh','smoke'],seen=new Map<string,number>();
  const cv=document.createElement('canvas');cv.width=1024;cv.height=452;const chartTex=new T.CanvasTexture(cv);chartTex.colorSpace=T.SRGBColorSpace;chartTex.anisotropy=8;
  const drawChart=()=>{const c=cv.getContext('2d')!;c.clearRect(0,0,1024,452);c.fillStyle=PAPER;c.beginPath();c.roundRect(6,6,1012,440,30);c.fill();c.lineWidth=8;c.strokeStyle=INK;c.stroke();
    c.fillStyle=INK;c.font=FONT(46);c.textAlign='center';c.fillText('WHAT GETS THROUGH?',512,70);c.font=FONT(24,600);c.fillStyle='#6b6f87';c.fillText('filled in by your sends · simplified, for this hall',512,104);
    COLS.forEach((m,i)=>{c.fillStyle=INK;c.font=FONT(28);c.fillText(m.toUpperCase(),420+i*130,150);});
    BAND_IDS.forEach((b,j)=>{const y=190+j*50;c.fillStyle=BANDS[b].color;c.beginPath();c.roundRect(30,y-24,300,40,12);c.fill();c.fillStyle='#fffaf0';c.font=FONT(24);c.textAlign='center';c.fillText(BANDS[b].short,180,y+5);
      COLS.forEach((m,i)=>{const v=seen.get(`${b}|${m}`);c.beginPath();c.arc(420+i*130,y-4,15,0,7);
        if(v===undefined){c.setLineDash([6,5]);c.lineWidth=3;c.strokeStyle='#b8b2a4';c.stroke();c.setLineDash([]);}else{c.fillStyle=v<5?'#3fae6a':v<=15?'#ffc94d':'#e5484d';c.fill();}});});
    chartTex.needsUpdate=true;};
  drawChart();
  const chart=new T.Mesh(new T.PlaneGeometry(3.4,1.5),flat(chartTex));chart.position.set(-4.6,1.95,.17);kit.side.add(chart);
  const chartApi:Chart={mark(band,mat,loss){if(!COLS.includes(mat))return false;const k=`${band}|${mat}`;if(seen.has(k))return false;seen.set(k,Number.isFinite(loss)?loss:Infinity);drawChart();return true;}};
  // (The side wall's local x runs toward the back: +2 is world z = −2.)
  wallArt(kit.side,'graph',-.9,1.95,.16,0,.9);wallArt(kit.side,'sun',1.6,1.95,.16,0,.9);
  // ---- Light: a soft pool over the desk (no hanging lamps in the bench view), one per room.
  pointLamp(game.root,-3.5,2.8,3.1,{color:'#fff4e0',intensity:5,distance:6});lampPool(game.root,-3.5,3,2.8,.18);
  pointLamp(game.root,-7.8,2.4,-5.8,{color:'#ffd9a8',intensity:4,distance:5.5});pointLamp(game.root,6.8,2.5,-5.6,{color:'#eaf6ff',intensity:5,distance:6.5});
  pointLamp(game.root,8.2,2.4,4.8,{color:'#e8dcff',intensity:4,distance:5.5});pointLamp(game.root,2.4,2.4,3.8,{color:'#ffe2c8',intensity:3,distance:5});
  // When the last message lands, the rainbow stripes glow.
  const lightUp=()=>{stripes.forEach((m,i)=>{m.material=hot(RAINBOW[i],1.6);});glow(game.root,'rgba(255,240,200,1)',6,.25).position.set(1,2,0);};
  return {hatchDoor,smoke,doors,chart:chartApi,lightUp,toaster:{mesh:toasterMesh,body:toastBody,home:toastAt.clone()}};
}
