// Spectrum Delivery set dressing: a bright research hall in white and cream with rainbow
// wayfinding stripes. Three destinations stand around it, each a different obstacle: the brick
// storeroom (back left, with a wooden side door), the glass lab behind its metal shutter (back
// right), and the copper-mesh quiet room (front right). The tea corner's toaster smokes between the
// desk and the quiet room. An exhibits case of the bands that are not safe to stand beside sits by
// the back wall, under the ladder to the rooftop hatch. Geometry comes from ./logic (one source).
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,flat,DMETAL,INK} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pointLamp,lampPool,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';
import {STORE,LAB,QUIET,HATCH,BANDS,BAND_IDS,POD_HOME} from './logic';

export const CREAM='#fbf6ec',PAPER='#fffdf8',BRICK='#c8674a',COPPER='#cf8a4e',STEEL='#8e9bb0';
const RAINBOW=BAND_IDS.map(b=>BANDS[b].color);
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
/** A wall material that can fade when it hides Pip (each wall gets its own copy). */
const fading=(m:T.Material)=>{const c=m.clone();c.transparent=true;return c;};

const brickTex=()=>{const t=canvasTex(256,256,c=>{c.fillStyle='#e8d6c4';c.fillRect(0,0,256,256);
  for(let row=0;row<8;row++)for(let k=-1;k<5;k++){const x=k*64+(row%2)*32,y=row*32;const r=TX.rng(row*9+k+20)();c.fillStyle=['#c8674a','#bf5f44','#cf7152','#b85a40'][Math.floor(r*4)];c.fillRect(x+3,y+3,58,26);}});
  t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
const meshTex=()=>{const t=canvasTex(128,128,c=>{c.clearRect(0,0,128,128);c.strokeStyle='rgba(207,138,78,.95)';c.lineWidth=3;for(let k=0;k<=128;k+=16){c.beginPath();c.moveTo(k,0);c.lineTo(k,128);c.stroke();c.beginPath();c.moveTo(0,k);c.lineTo(128,k);c.stroke();}});
  t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
const slatTex=()=>{const t=canvasTex(64,128,c=>{c.fillStyle='#a9b5c8';c.fillRect(0,0,64,128);for(let y=0;y<128;y+=16){c.fillStyle='#8e9bb0';c.fillRect(0,y+11,64,5);c.fillStyle='#c3cddb';c.fillRect(0,y,64,3);}});
  t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
export function plaque(text:string,w:number,h:number,bg:string,fg=INK,size=40){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(22,h*.3));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';let s=size;c.font=FONT(s);while(s>12&&c.measureText(text).width>w-36){s--;c.font=FONT(s);}c.fillText(text,w/2,h/2+2);});
}
/** A standing sign plate facing +z (rotate the returned mesh to face elsewhere). */
function standingSign(parent:T.Object3D,text:string,x:number,y:number,z:number,w:number,bg:string,fg=INK,ry=0){
  const h=w*.22,m=part(parent,new T.PlaneGeometry(w,h),flat(plaque(text,512,Math.round(512*h/w),bg,fg,44)),x,y,z,false);m.rotation.y=ry;m.userData.noAO=true;return m;
}
/** A straight wall slab between two plan points (axis-aligned), with a collider. */
function slab(game:Game,x0:number,z0:number,x1:number,z1:number,h:number,thick:number,material:T.Material,fade=true,parent:T.Object3D=game.root){
  const w=Math.max(thick,Math.abs(x1-x0)),d=Math.max(thick,Math.abs(z1-z0)),x=(x0+x1)/2,z=(z0+z1)/2;
  const m=part(parent,box(w,h,d),fade?fading(material):material,x,h/2,z);if(fade)game.occluders.push(m);
  solid(game,w,2.6,d,x,1.3,z);return m;
}

export interface SpectrumRoom {hatchDoor:T.Object3D;smoke:T.Sprite[];lightUp:()=>void}
export function dressSpectrum(game:Game,kit:RoomKit):SpectrumRoom{
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // ---- Floors: pale research-hall tiles; warm oak in the storeroom; pale blue lino in the lab; a rug in the quiet room.
  kit.floor(-W,W,-D,D,TX.kitchenTiles('#f6f2ea','#e7eef5',6),3.2);
  kit.floor(STORE.x0,STORE.x1,STORE.z0,STORE.z1,TX.woodPlanks('#d9ae78'),2.6,.004);
  kit.floor(LAB.x0,LAB.x1,LAB.z0,LAB.z1,TX.kitchenTiles('#eaf4fb','#d3e6f3',4),2.4,.004);
  kit.floor(QUIET.x0,QUIET.x1,QUIET.z0,QUIET.z1,TX.carpetTiles('#c9b8ea'),2.4,.004);
  rug(r,8.3,5,3.2,2.4,'#8b7be8','#e2dbff');rug(r,-6.4,5.4,2.4,2,'#3fae6a','#d5f2de');
  // Rainbow wayfinding stripes on the floor, from the entrance along the front of the hall.
  RAINBOW.forEach((c,i)=>part(r,box(13.5,.006,.1),toon(c),-3.9,.008,6.9-i*.16,false));
  // A rainbow band at rail height on the back and side walls.
  RAINBOW.forEach((c,i)=>{part(kit.back,box(l.width-.4,.05,.02),toon(c),0,1.3+i*.055,.14,false);part(kit.side,box(l.depth-.4,.05,.02),toon(c),0,1.3+i*.055,.14,false);});
  // Windows light the (sunny) lab; the storeroom has none and the hall's back wall holds the exhibits.
  kit.backWindows(x=>x<LAB.x0+.6,.16);

  // ---- The brick storeroom (back left): brick front with a doorway at the far left, brick side wall with a wooden door.
  const brick=brickTex();const bm=(len:number)=>{const t=brick.clone();t.needsUpdate=true;t.repeat.set(len/1.3,1.6);return toon('#ffffff',{map:t});};
  const bh=2.1,s=STORE;
  slab(game,s.door[1],s.z1,s.x1,s.z1,bh,.3,bm(s.x1-s.door[1]));
  slab(game,s.x1,s.z0,s.x1,s.wood[0],bh,.3,bm(s.wood[0]-s.z0));slab(game,s.x1,s.wood[1],s.x1,s.z1,bh,.3,bm(s.z1-s.wood[1]));
  // The wooden door: planks, frame and handle (closed; the way in is the doorway at the front left).
  const door=group(game.root,s.x1,0,(s.wood[0]+s.wood[1])/2);part(door,box(.12,2,s.wood[1]-s.wood[0]),toon('#b98552'),0,1,0);for(const dz of [-.45,0,.45])part(door,box(.14,1.9,.02),toon('#9c6d42'),0,1,dz,false);
  part(door,sphere(.05,10,8),toon('#ffc94d'),.1,1,.5);part(door,box(.16,.1,s.wood[1]-s.wood[0]+.2),toon('#8e5a36'),0,2.05,0);solid(game,.12,2.6,s.wood[1]-s.wood[0],s.x1,1.3,(s.wood[0]+s.wood[1])/2);
  for(const x of [s.door[1],s.x1])part(r,box(.34,.12,.34),toon('#8e5a36'),x,bh+.06,s.z1);
  part(r,box(s.x1-s.door[1]+.3,.08,.36),toon('#e8d6c4'),(s.x1+s.door[1])/2,bh+.04,s.z1,false);
  standingSign(game.root,'STOREROOM',(s.door[1]+s.x1)/2,1.75,s.z1+.17,1.5,'#ffe7c2');
  // Inside: shelves of stock along the back and left.
  for(const [x,z,ry] of [[-9.6,-7.55,0],[-7.2,-7.55,0]] as const){const sh=group(r,x,0,z,ry);for(const y of [.4,1.1,1.8])part(sh,box(2,.06,.5),toon('#c98a55'),0,y,0);for(const dx of [-.97,.97])part(sh,box(.06,2,.5),toon('#8e5a36'),dx,1,0);
    for(let k=0;k<5;k++)part(sh,rbox(.3,.28,.34,.04),toon(['#d7a56d','#c98f5a','#e5c07b'][k%3]),-.7+k*.35,.58+(k%2)*.7,0);solid(game,2,2,.5,x,1,z);}

  // ---- The glass lab (back right): a brick side wall, glass across the front with the metal shutter down in front of it.
  const lb=LAB;slab(game,lb.x0,lb.z0,lb.x0,lb.z1,bh,.3,toon('#efe6d8'));
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
  standingSign(game.root,'HATCH',(HATCH.x0+HATCH.x1)/2,1.82,lb.z1+.1,.62,'#ffc629');
  standingSign(game.root,'GLASS LAB',7.4,1.82,lb.z1+.1,1.4,'#d8ecff');
  // Inside the lab: benches with glassware in the sunshine, a fume hood.
  for(const x of [4.2,8]){const b=group(r,x,0,-7.3);part(b,rbox(2.4,.9,.8,.05),toon('#e9eef5'),0,.45,0);part(b,box(2.5,.05,.9),toon(PAPER),0,.92,0);
    for(let k=0;k<4;k++)part(b,cyl(.07,.09,.22,12),toon(['#bfe6f5','#d8f5c8','#ffe1dc','#e8dcff'][k],{opacity:.7}),-.9+k*.55,1.06,0);solid(game,2.4,1,.8,x,.5,-7.3);}

  // ---- The quiet room (front right): a copper-mesh screened cage on copper posts.
  const q=QUIET,mt=meshTex(),mh=2.2,meshWall=(x0:number,z0:number,x1:number,z1:number)=>{const len=Math.hypot(x1-x0,z1-z0),t=mt.clone();t.needsUpdate=true;t.repeat.set(len/.5,mh/.5);
    const m=new T.Mesh(new T.PlaneGeometry(len,mh),new T.MeshBasicMaterial({map:t,transparent:true,side:T.DoubleSide,depthWrite:false}));m.material.userData.outlineParameters={visible:false};
    m.position.set((x0+x1)/2,mh/2,(z0+z1)/2);m.rotation.y=x0===x1?Math.PI/2:0;m.userData.noAO=true;game.root.add(m);
    const posts=Math.max(2,Math.round(len/1.6)+1);for(let k=0;k<posts;k++){const f=k/(posts-1);part(r,box(.08,mh,.08),glossyToon(COPPER,{spec:.8,size:.96}),x0+(x1-x0)*f,mh/2,z0+(z1-z0)*f);}
    part(r,box(Math.abs(x1-x0)+.08,.06,Math.abs(z1-z0)+.08),glossyToon(COPPER,{spec:.8,size:.96}),(x0+x1)/2,mh,(z0+z1)/2);part(r,box(Math.abs(x1-x0)+.08,.06,Math.abs(z1-z0)+.08),toon(COPPER),(x0+x1)/2,.03,(z0+z1)/2);
    solid(game,Math.max(.1,Math.abs(x1-x0)),2.6,Math.max(.1,Math.abs(z1-z0)),(x0+x1)/2,1.3,(z0+z1)/2);};
  meshWall(q.x0,q.z0,q.x0,q.z1);meshWall(q.x0,q.z0,q.door[0],q.z0);
  standingSign(game.root,'QUIET ROOM · SCREENED',7.45,2.45,q.z0+.02,1.9,'#f3d9c2');
  const chair=group(r,9.9,0,6.6,-2.4);part(chair,rbox(.9,.45,.8,.12),toon('#8b7be8'),0,.3,0);part(chair,rbox(.9,.6,.2,.08),toon('#7a6ad6'),0,.7,-.32);solid(game,.9,.9,.8,9.9,.45,6.6);
  const lamp=group(r,10.4,0,7.4);part(lamp,cyl(.2,.24,.05,16),toon(INK),0,.03,0);part(lamp,cyl(.025,.025,1.5,8),toon(COPPER),0,.78,0);part(lamp,cyl(.16,.28,.3,16),toon('#fff1d6'),0,1.55,0);

  // ---- Tea corner: a counter with the smoking toaster and a kettle.
  const tea=group(r,2.4,0,4.85);part(tea,rbox(2.2,.9,.62,.05),toon('#f4c9c3'),0,.45,0);part(tea,box(2.3,.05,.7),toon(PAPER),0,.92,0);
  const toaster=group(tea,-.3,.95,0);part(toaster,rbox(.36,.24,.22,.06),glossyToon('#dfe3ea',{spec:.8,size:.96}),0,.12,0);for(const dx of [-.07,.07])part(toaster,box(.04,.02,.16),toon(INK),dx,.245,0);
  for(const dx of [-.07,.07])part(toaster,box(.03,.1,.13),toon('#3a2a20'),dx,.28,0);
  const kettle=group(tea,.5,.95,.05);part(kettle,cyl(.12,.15,.22,16),toon('#e5484d'),0,.11,0);part(kettle,cyl(.03,.02,.16,8),toon('#e5484d'),.15,.14,0).rotation.z=-1;
  part(tea,cyl(.05,.045,.1,10),toon('#ffc94d'),.85,1,-.1);solid(game,2.2,1,.62,2.4,.5,4.85);
  standingSign(game.root,'TEA',2.4,1.5,5.2,.5,'#f4c9c3');
  // Smoke: soft billboards drifting over the corner (the beam test uses the cloud in logic.SMOKE).
  const smoke:T.Sprite[]=[],puff=TX.radial('smoke','rgba(255,255,255,1)','rgba(255,255,255,0)',.18);
  for(let k=0;k<14;k++){const m=new T.Sprite(new T.SpriteMaterial({map:puff,color:'#7d8292',transparent:true,opacity:.7,depthWrite:false}));const s=1+(k%4)*.35;m.scale.set(s,s,1);m.userData.noAO=true;m.userData.seed=k;game.root.add(m);smoke.push(m);}

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
  standingSign(game.root,'POD DOCK',POD_HOME.x,.35,POD_HOME.z+.84,.8,'#d5f2de');
  const chart=new T.Mesh(new T.PlaneGeometry(3.4,1.5),flat(canvasTex(1024,452,c=>{c.fillStyle=PAPER;c.beginPath();c.roundRect(6,6,1012,440,30);c.fill();c.lineWidth=8;c.strokeStyle=INK;c.stroke();
    c.fillStyle=INK;c.font=FONT(46);c.textAlign='center';c.fillText('WHAT GETS THROUGH?',512,70);c.font=FONT(24,600);c.fillStyle='#6b6f87';c.fillText('simplified, for this hall',512,104);
    const cols=['brick','glass','metal','mesh','smoke'],rows=BAND_IDS,cell=(b:string,m:string)=>({brick:{radio:1,micro:.5},glass:{radio:1,micro:1,nir:1,vis:1},metal:{},mesh:{thermal:1,nir:1,vis:1},smoke:{radio:1,micro:1,thermal:1,nir:.5}} as Record<string,Record<string,number>>)[m][b]??0;
    cols.forEach((m,i)=>{c.fillStyle=INK;c.font=FONT(28);c.fillText(m.toUpperCase(),420+i*130,150);});
    rows.forEach((b,j)=>{const y=190+j*50;c.fillStyle=BANDS[b].color;c.beginPath();c.roundRect(30,y-24,300,40,12);c.fill();c.fillStyle='#fffaf0';c.font=FONT(24);c.textAlign='center';c.fillText(BANDS[b].short,180,y+5);
      cols.forEach((m,i)=>{const v=cell(b,m);c.fillStyle=v===1?'#3fae6a':v>0?'#ffc94d':'#e5484d';c.beginPath();c.arc(420+i*130,y-4,15,0,7);c.fill();});});
  })));chart.position.set(-4.6,1.95,.17);kit.side.add(chart);
  // (The side wall's local x runs toward the back: +2 is world z = −2.)
  wallArt(kit.side,'graph',-.9,1.95,.16,0,.9);wallArt(kit.side,'sun',1.6,1.95,.16,0,.9);
  // ---- Light: a soft pool over the desk (no hanging lamps in the bench view), one per room.
  pointLamp(game.root,-3.5,2.8,3.1,{color:'#fff4e0',intensity:5,distance:6});lampPool(game.root,-3.5,3,2.8,.18);
  pointLamp(game.root,-7.8,2.4,-5.8,{color:'#ffd9a8',intensity:4,distance:5.5});pointLamp(game.root,6.8,2.5,-5.6,{color:'#eaf6ff',intensity:5,distance:6.5});
  pointLamp(game.root,8.2,2.4,4.8,{color:'#e8dcff',intensity:4,distance:5.5});pointLamp(game.root,2.4,2.4,3.8,{color:'#ffe2c8',intensity:3,distance:5});
  // When the last message lands, the rainbow stripes glow.
  const lightUp=()=>{RAINBOW.forEach((c,i)=>{const g=part(game.root,box(13.5,.01,.1),hot(c,1.6),-3.9,.014,6.9-i*.16,false);g.userData.noAO=true;});glow(game.root,'rgba(255,240,200,1)',6,.25).position.set(1,2,0);};
  return {hatchDoor,smoke,lightUp};
}
