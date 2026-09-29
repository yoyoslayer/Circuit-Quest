// Static set dressing per level: floors, walls, fixtures. Staging follows the look-dev target
// (mockups/look/meeting.js, lunch.js); colliders are separate, invisible boxes.
// Anything the AO pass must ignore (additive shafts, glows, glass) goes on game.root, not
// decorRoot: freeze() merges decorRoot and would drop the userData.noAO flag.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../game';
import type {Obstacle} from '../sim/cable';
import {DMETAL,TRIM,WOOD,toon,rbox,box,cyl,sphere,part,group,glow,glyph,cachedTexture} from '../render/kit';
import {INK} from '../render/toon';
import {glossyToon,hot} from '../render/actors';
import * as TX from '../render/textures';
import {windowUnit,windowShaft,wallArt,pendant,pointLamp,lampPool,rug,shadowDecal,type WallArt} from './dressing';

export interface Decor {screen?:T.Mesh;beam?:T.Object3D;clock?:{hand:T.Object3D;minute:T.Object3D;face:T.Mesh};lightUp?:()=>void}
const WALL_UP='#efe2c8',WALL_LOW='#c7b08e',RAIL='#a8734a',BASE='#7a4f33',CAP='#c98a55',CAP_DARK='#8e5a36';
// Big flat wall faces skip OutlineEffect: its hull pokes through them at grazing angles as stripes.
const plainMaterials=new Map<string,T.Material>();
const plain=(color:string,map?:T.Texture)=>{const key=color+(map?.uuid??'');let m=plainMaterials.get(key);if(!m){m=toon(color,{map}).clone();m.userData.outlineParameters={visible:false};plainMaterials.set(key,m);}return m;};
/** Invisible static collider; interior walls are taller than they look so Pip can't hop them. */
export function solid(game:Game,w:number,h:number,d:number,x:number,y:number,z:number,ry=0){
  const body=game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z).setRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),ry)));
  game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2).setFriction(.7),body);
}
function floor(game:Game,x0:number,x1:number,z0:number,z1:number,map:T.Texture,tile=4,y=0){
  const w=x1-x0,d=z1-z0,t=map.clone();t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(w/tile,d/tile);t.needsUpdate=true;
  const m=part(game.decorRoot,new T.PlaneGeometry(w,d),toon('#ffffff',{map:t}),(x0+x1)/2,y+.002,(z0+z1)/2,false);m.rotation.x=-Math.PI/2;return m;
}
/** Dressed back/side wall: wallpaper, wainscot, rail, baseboard and a thick cap. The upper part
 *  (above the rail) folds away when the camera swings behind it. The returned group's local +z
 *  points into the room and y=0 is the floor, for windows and wall art. */
function shellWall(game:Game,length:number,x:number,z:number,normal:[number,number],h=3,thick=.25){
  const wall=group(game.root,x,0,z,normal[0]!==0?-Math.PI/2*normal[0]:normal[1]<0?0:Math.PI);
  const face=thick/2,upper=group(wall,0,1.06,0),inside=group(upper,0,-1.06,0);
  part(wall,box(length,1.06,thick),plain(WALL_LOW),0,.53,0);part(wall,box(length,.16,.07),toon(BASE),0,.08,face+.035);part(wall,box(length,1,.05),toon(WALL_LOW),0,.55,face+.025);
  part(wall,box(length,.07,.09),toon(RAIL),0,1.06,face+.04);
  part(inside,box(length,h-1.06,thick),plain(WALL_UP),0,1.06+(h-1.06)/2,0);part(inside,box(length,h-1.05,.02),plain('#ffffff',TX.wallpaper(WALL_UP)),0,1.05+(h-1.05)/2,face+.011);
  part(inside,box(length+.04,.14,thick+.22),toon(CAP),0,h+.07,.02);part(inside,box(length+.06,.04,thick+.26),toon(CAP_DARK),0,h+.16,.02);
  wall.traverse(o=>{o.receiveShadow=false;});
  game.shellWalls.push({group:upper,normal:new T.Vector3(normal[0],0,normal[1]),height:h});
  solid(game,normal[0]!==0?thick:length,h,normal[0]!==0?length:thick,x,h/2,z);
  return inside;
}
function interiorWall(game:Game,o:Obstacle,upperColor=WALL_UP,lowerColor=WALL_LOW,h=1.35){
  const w=o.maxX-o.minX,d=o.maxZ-o.minZ,x=(o.minX+o.maxX)/2,z=(o.minZ+o.maxZ)/2,r=game.decorRoot;
  part(r,box(w,.8,d),plain(lowerColor),x,.4,z);part(r,box(w,h-.8,d),plain(upperColor),x,.8+(h-.8)/2,z);part(r,box(w+.03,.12,d+.05),toon(BASE),x,.06,z);
  part(r,box(w+.05,.1,d+.07),toon(CAP),x,h,z);part(r,box(w+.06,.04,d+.08),toon(CAP_DARK),x,h+.06,z);solid(game,w,2.6,d,x,1.3,z);
}
/** Pillars: capped and trimmed; alternate ones carry a poster or an extinguisher. The fading
 *  pillar body stays on root (it is an occluder). */
function pillar(game:Game,o:Obstacle,i:number,hazard=false){
  const w=o.maxX-o.minX,d=o.maxZ-o.minZ,x=(o.minX+o.maxX)/2,z=(o.minZ+o.maxZ)/2,r=game.decorRoot;
  const material=(hazard?toon('#ffffff',{map:TX.hazardStripe()}):toon('#e6dac4')).clone();material.transparent=true;const m=part(game.root,box(w,3,d),material,x,1.5,z);game.occluders.push(m);
  part(r,box(w+.1,.16,d+.1),toon(BASE),x,.08,z);part(r,box(w+.12,.12,d+.12),toon(CAP),x,3.02,z);part(r,box(w+.03,.06,d+.03),toon(RAIL),x,1.06,z);
  const face=z+d/2+.01;
  if(!hazard){if(i%2===0)wallArt(r,(['sun','cat','mountain'] as const)[i%3],x,1.9,face+.02,0,.7);else{part(r,cyl(.1,.1,.45,12),toon('#e5484d'),x+.25,.45,face+.1);part(r,cyl(.04,.04,.08,8),toon(INK),x+.25,.72,face+.1);}}
  part(r,rbox(.18,.22,.03,.03),toon('#f0ece2'),x-.22,.35,face+.01,false);
  solid(game,w,3,d,x,1.5,z);
}
function slab(game:Game){
  const l=game.level;part(game.decorRoot,box(l.width+.5,.5,l.depth+.5),toon('#3b3852'),0,-.27,0,false);shadowDecal(game.root,l.width*1.5,l.depth*1.7,.8,-.6,1.2,.7);
}
function frontLips(game:Game){
  const l=game.level,r=game.decorRoot;
  part(r,box(l.width,.32,.22),toon('#e3d6c0'),0,.12,l.depth/2);part(r,box(l.width+.02,.06,.28),toon(CAP),0,.31,l.depth/2);solid(game,l.width,1,.22,0,.5,l.depth/2);
  part(r,box(.22,.32,l.depth),toon('#e3d6c0'),l.width/2,.12,0);part(r,box(.28,.06,l.depth+.02),toon(CAP),l.width/2,.31,0);solid(game,.22,1,l.depth,l.width/2,.5,0);
}
const windowXs=(width:number)=>{const xs:number[]=[];for(let x=-width/2+2.2;x<width/2-1.5;x+=3.2)xs.push(x);return xs;};
export function decorate(game:Game):Decor{
  const l=game.level;slab(game);frontLips(game);
  const back=shellWall(game,l.width,0,-l.depth/2,[0,-1]),side=shellWall(game,l.depth,-l.width/2,0,[-1,0]);
  if(l.id==='meeting')return meeting(game,back,side);
  if(l.id==='lunch')return lunch(game,back,side);
  return playground(game,back,side);
}
/** Back-wall windows with blinds, each throwing a warm shaft into the room. */
function backWindows(game:Game,back:T.Group,skip:(x:number)=>boolean=()=>false,shaftOpacity=.18){
  const l=game.level;for(const x of windowXs(l.width)){if(skip(x))continue;windowUnit(back,x,1.95,.16);windowShaft(game.root,x,-l.depth/2+.2,{opacity:shaftOpacity});}
}
function playground(game:Game,back:T.Group,side:T.Group):Decor{
  const l=game.level,r=game.decorRoot;floor(game,-l.width/2,l.width/2,-l.depth/2,l.depth/2,TX.concreteFloor('#d8cdb8'),4);backWindows(game,back);
  // Painted lane lines lead from the reel to the lamp socket.
  const lane=toon('#ffc629');for(const [x0,z0,x1,z1] of [[-9.6,5.8,9.6,5.8],[-9.6,-8.2,9.6,-8.2],[-9.6,5.8,-9.6,-8.2]]){const len=Math.hypot(x1-x0,z1-z0);const m=part(r,box(len,.01,.12),lane,(x0+x1)/2,.006,(z0+z1)/2,false);m.rotation.y=-Math.atan2(z1-z0,x1-x0);}
  l.obstacles.forEach((o,i)=>pillar(game,o,i,true));
  // The payoff: a big dead street lamp by the socket that blooms warm when the cable goes in.
  const t=l.target,lamp=group(r,t.x+.55,0,t.z-.35);part(lamp,cyl(.34,.42,.16,20),toon(INK),0,.08,0);part(lamp,cyl(.07,.09,2.6,12),toon(DMETAL),0,1.4,0);part(lamp,box(.9,.08,.08),toon(DMETAL),-.35,2.68,0);
  const shade=part(lamp,new T.CylinderGeometry(.18,.42,.34,20,1,true),glossyToon('#ffc629',{spec:.7,size:.97}),-.75,2.55,0);(shade.material as T.Material).side=T.DoubleSide;
  const screen=part(game.root,sphere(.16,14,10),toon('#6b6f84'),t.x-.2,2.42,t.z-.35,false);solid(game,.5,2.8,.5,t.x+.55,1.4,t.z-.35);
  part(r,rbox(.48,.38,.3,.06),toon('#384454'),t.x,.2,t.z);
  const lightUp=()=>{screen.material=hot('#fff0c0',3);const bulb=screen.getWorldPosition(new T.Vector3());glow(game.root,'rgba(255,214,140,1)',3,.6).position.copy(bulb);
    pointLamp(game.root,bulb.x,bulb.y-.3,bulb.z,{intensity:10,distance:9});lampPool(game.root,t.x-.2,t.z-.35,3,.3);};
  for(const [x,z] of [[8.2,8.2],[8.9,8.4],[-8.5,-8.5]]){part(r,box(1.1,.14,.9),toon('#c9925e'),x,.07,z);solid(game,1.1,.14,.9,x,.07,z);}
  // A practice wall of sockets and a wordless how-to poster: reel, plug, socket, lamp.
  for(let k=0;k<5;k++){const x=-6+k*1.2;part(back,rbox(.38,.38,.1,.06),toon('#f0ece2'),x,.55,.18);part(back,cyl(.1,.1,.05,14,'z'),toon(INK),x,.55,.24);if(k===2)glow(game.root,'rgba(120,255,160,1)',.6,.45).position.set(x,.55,-l.depth/2+.35);}
  const howto=cachedTexture('howto',()=>glyph(c=>{c.fillStyle='#fffaf0';c.fillRect(0,0,256,256);c.lineWidth=10;
    c.fillStyle='#ffc94d';c.beginPath();c.arc(44,128,26,0,7);c.fill();c.stroke();c.strokeStyle='#ff922f';c.beginPath();c.moveTo(70,128);c.bezierCurveTo(100,90,120,170,150,128);c.stroke();c.strokeStyle='#2b2d42';
    c.fillStyle='#2b2d42';c.fillRect(150,116,26,24);c.fillRect(176,120,10,6);c.fillRect(176,130,10,6);c.fillStyle='#5ed6cc';c.beginPath();c.arc(200,128,16,0,7);c.fill();c.stroke();
    c.fillStyle='#ffe36e';c.beginPath();c.arc(210,60,24,0,7);c.fill();c.stroke();for(let a=0;a<8;a++){c.beginPath();c.moveTo(210+Math.cos(a*.8)*32,60+Math.sin(a*.8)*32);c.lineTo(210+Math.cos(a*.8)*42,60+Math.sin(a*.8)*42);c.stroke();}
    c.beginPath();c.moveTo(200,110);c.lineTo(210,86);c.stroke();}));
  const board=group(side,0,1.85,.16);part(board,box(1.9,1.3,.05),toon(INK));const face=new T.Mesh(new T.PlaneGeometry(1.8,1.2),toon('#ffffff',{map:howto}));face.position.z=.03;board.add(face);
  wallArt(side,'bolt',-4,1.9,.16);wallArt(back,'graph',8.4,1.9,.18,0,.8);
  // START: a taped square with a chevron where Pip begins, by the reel.
  const tape=toon('#ffc629');for(const [w,d,dx,dz] of [[1.8,.1,0,-.85],[1.8,.1,0,.85],[.1,1.8,-.85,0],[.1,1.8,.85,0]] as const)part(r,box(w,.012,d),tape,l.spawn.x+dx,.008,l.spawn.z+dz,false);
  for(const s of [-1,1]){const c=part(r,box(.55,.012,.12),tape,l.spawn.x+.25+s*0,.009,l.spawn.z+s*.18,false);c.rotation.y=s*.6;}
  // Supply cage in the corner: wire mesh with spare reels and boxes.
  const cage=group(r,-8.3,0,-5.2);const wire=toon(DMETAL);for(const [x,z] of [[-1,-.8],[1,-.8],[-1,.8],[1,.8]])part(cage,box(.06,1.8,.06),wire,x,.9,z);
  for(const y of [.05,.9,1.8]){part(cage,box(2,.04,.04),wire,0,y,-.8);part(cage,box(2,.04,.04),wire,0,y,.8);part(cage,box(.04,.04,1.6),wire,-1,y,0);}
  for(let k=0;k<9;k++){part(cage,box(.02,1.8,.02),wire,-1+k*.25,.9,-.8,false);part(cage,box(.02,1.8,.02),wire,-1+k*.25,.9,.8,false);}
  for(const [x,z,c] of [[-.4,-.2,'#ffc94d'],[.4,.3,'#e5484d']] as const){const reelGroup=group(cage,x,.36,z);for(const s of [-1,1])part(reelGroup,cyl(.32,.32,.06,20,'z'),toon(c),0,0,s*.2);part(reelGroup,cyl(.24,.24,.34,20,'z'),toon('#f4efe6'));}
  part(cage,rbox(.6,.5,.6,.05),toon('#c98f5a'),.5,.25,-.35);solid(game,2,1.8,1.6,-8.3,.9,-5.2);
  return {screen,lightUp};
}
function meeting(game:Game,back:T.Group,side:T.Group):Decor{
  const l=game.level,r=game.decorRoot;
  floor(game,-l.width/2,9.1,-l.depth/2,l.depth/2,TX.carpetTiles('#8395ab'),2.4);floor(game,9.1,l.width/2,-l.depth/2,l.depth/2,TX.woodPlanks('#c99a64'),3.2);
  // Walkway runner through the aisle and a rug island under each desk pod.
  floor(game,-9.5,8.6,-2.1,-.4,TX.carpetTiles('#a7a2a0'),2.4,.004);
  for(const [px,pz] of [[-6,-4.5],[-1,-4.5],[4,-4.5],[-6,1.5],[-1,1.5],[4,1.5],[-6,7.6],[-.8,7.6]])floor(game,px-2.05,px+2.05,pz-1.75,pz+1.75,TX.carpetTiles('#6c7f99'),2.4,.006);
  floor(game,-l.width/2,-11.9,-l.depth/2,-5.5,TX.concreteFloor('#9aa3b2'),3,.008);
  rug(r,12.4,5.4,4.2,4.2,'#d98c5f','#f6d49b');floor(game,10.4,13.9,-9.2,-3.6,TX.rugTex('#5f7fa8','#bcd3ee'),3.5,.01);
  backWindows(game,back,x=>x< -11.5,.2);
  // Deadline clock between two windows: its red minute hand sweeps the four-minute meeting.
  const clock=group(back,-3.1,2.55,.18);const face=part(clock,cyl(.3,.3,.06,32,'z'),toon('#fbf5ea'));part(clock,cyl(.34,.34,.05,32,'z'),toon(INK),0,0,-.02);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;part(clock,box(.03,.06,.02),toon(INK),Math.sin(a)*.24,Math.cos(a)*.24,.04,false).rotation.z=-a;}
  const hand=group(clock,0,0,.05);part(hand,box(.035,.17,.02),toon(INK),0,.075,0,false);const minute=group(clock,0,0,.06);part(minute,box(.025,.25,.02),toon('#e5484d'),0,.12,0,false);
  wallArt(back,'graph',15.2,1.9,.18,0,.9);
  // The side wall's local x runs along the level's z axis.
  for(const [kind,wz,s] of [['cork',.2,1.2],['bolt',-3.2,1],['plant',7.6,1],['mountain',2.7,.9],['sun',4.6,.9]] as [WallArt,number,number][])wallArt(side,kind,-wz,1.9,.16,0,s);
  const pillars=l.obstacles.filter(o=>o.id.startsWith('pillar'));pillars.forEach((o,i)=>pillar(game,o,i));
  for(const o of l.obstacles.filter(o=>!o.id.startsWith('pillar')))interiorWall(game,o,'#bfb4a2','#8f8574');
  // Server closet: racks with hot LEDs, cable spaghetti, a green glow, the one live outlet.
  for(let i=0;i<4;i++){const x=-15.9+i*1.0;part(r,rbox(.8,2.3,.9,.05),toon('#3a3d55'),x,1.15,-9.4);part(r,box(.66,2,.02),toon('#2a2c40'),x,1.2,-8.945,false);
    for(let k=0;k<9;k++)part(r,box(.07,.04,.02),hot(['#57e38f','#ffc94d','#5b9cf0'][(i+k)%3],2.2),x-.22+(k%3)*.2,.45+k*.2,-8.93,false);}
  for(let k=0;k<4;k++){const c=new T.CatmullRomCurve3([[-16+k,1.9,-8.95],[-15.7+k,.6,-8.6],[-15.2+k*.9,.04,-7.9+k*.2],[-14.6,.04,-6.9]].map(p=>new T.Vector3(...p)));part(r,new T.TubeGeometry(c,30,.03,5),toon(['#3f7fd6','#e5484d','#ffc94d',INK][k]),0,0,0,false);}
  glow(game.root,'rgba(90,255,150,1)',3.2,.12).position.set(-14.4,1.4,-8.4);pointLamp(game.root,-14.3,1.8,-7.6,{color:'#7dffb5',intensity:3.5,distance:5});
  solid(game,4,2.3,.9,-14.4,1.15,-9.4);
  part(r,rbox(.8,.5,.6,.06),toon(DMETAL),-14.6,.25,-6.6);solid(game,.8,.5,.6,-14.6,.25,-6.6);
  part(r,rbox(.4,.4,.12,.06).clone().rotateY(Math.PI/2),toon('#f0ece2'),-11.72,.55,-7.8);glow(game.root,'rgba(120,255,160,1)',.9,.5).position.set(-11.55,.55,-7.8);
  part(r,cyl(.12,.12,.5,14),toon('#e5484d'),-11.6,.3,-5.2);part(r,box(.08,.14,.08),toon(INK),-11.6,.62,-5.2);
  // Boardroom: frosted-banded glass front, table with papers, dark projector and screen, pendants.
  for(const [x0,x1] of [[9.3,11],[13.8,l.width/2]]){const w=x1-x0,x=(x0+x1)/2;part(game.root,box(w,2.5,.06),toon('#bfe6f5',{opacity:.24}),x,1.3,-2,false);part(game.root,box(w,.18,.07),toon('#ffffff',{opacity:.55}),x,1.25,-2,false);
    part(r,box(w,.08,.1),toon(DMETAL),x,2.6,-2);part(r,box(w,.1,.1),toon(DMETAL),x,.05,-2);solid(game,w,2.6,.14,x,1.3,-2);}
  for(const x of [11,13.8])part(r,box(.1,2.6,.1),toon(DMETAL),x,1.3,-2);
  part(r,rbox(1.6,.1,4.6,.4),toon('#8a5a2b'),12,.78,-6.4);for(const z of [-8,-4.8])part(r,cyl(.1,.25,.75,12),toon(INK),12,.38,z);solid(game,1.6,.8,4.6,12,.4,-6.4);
  for(let k=0;k<6;k++)part(r,box(.28,.02,.2),toon('#fffaf0'),11.6+(k%2)*.8,.84,-7.8+Math.floor(k/2)*1.3,false).rotation.y=(k*.37)%1-.5;
  const projector=group(r,12,0,-4.5);part(projector,rbox(.6,.25,.5,.06),toon('#dcdfe6'),0,.96,0);part(projector,cyl(.1,.1,.1,14,'z'),toon(INK),0,.96,-.28);
  const lead=new T.CatmullRomCurve3([[12.1,.9,-4.3],[12.2,.3,-3.9],[12.4,.05,-3.2],[12.3,.05,-2.4]].map(p=>new T.Vector3(...p)));part(r,new T.TubeGeometry(lead,40,.035,6),toon(INK));
  part(r,box(4.4,2.5,.08),toon(INK),12.2,1.9,-9.82);
  // Projector screen: a blue "no signal" card until the cable goes in, then a glowing slide.
  const noSignal=cachedTexture('no-signal',()=>glyph(c=>{c.fillStyle='#2a3b7a';c.fillRect(0,0,256,256);c.strokeStyle='#8fb0ff';c.lineWidth=12;c.beginPath();c.arc(128,120,46,0,7);c.stroke();c.beginPath();c.moveTo(96,152);c.lineTo(160,88);c.stroke();c.fillStyle='#8fb0ff';c.fillRect(70,200,116,10);}));
  const slide=cachedTexture('slide',()=>glyph(c=>{c.fillStyle='#fffaf0';c.fillRect(0,0,256,256);c.fillStyle='#ffc629';c.fillRect(0,0,256,34);c.fillStyle='#3f7fd6';for(let i=0;i<5;i++)c.fillRect(34+i*40,200-(i+1)*26,26,(i+1)*26);c.strokeStyle='#e5484d';c.lineWidth=8;c.beginPath();c.moveTo(30,170);c.lineTo(90,130);c.lineTo(140,146);c.lineTo(226,70);c.stroke();c.fillStyle='#2b2d42';c.fillRect(30,12,120,10);}));
  const screen=part(game.root,new T.PlaneGeometry(4.2,2.3),new T.MeshBasicMaterial({map:noSignal}),12.2,1.9,-9.77,false);(screen.material as T.Material).userData.outlineParameters={visible:false};
  const beam=part(game.root,new T.CylinderGeometry(1.4,.1,5.1,20,1,true).rotateX(Math.PI/2),new T.MeshBasicMaterial({color:'#fff3c8',transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide}),12.1,1.4,-7.2,false);
  (beam.material as T.Material).userData.outlineParameters={visible:false};beam.userData.noAO=true;beam.lookAt(12.2,1.9,-9.8);beam.visible=false;
  pendant(game.root,12,-7.6,{y:2.35,color:'#3f7fd6'});pendant(game.root,12,-5.2,{y:2.35,color:'#3f7fd6',light:false});lampPool(game.root,12,-6.4,2.4,.14);
  // Lounge and coffee corner.
  part(r,rbox(.8,.95,3.4,.06),toon(WOOD),-15.9,.47,4.6);part(r,box(.85,.06,3.5),toon('#f1ebe0'),-15.9,.97,4.6);solid(game,.8,.97,3.4,-15.9,.48,4.6);
  for(let k=0;k<5;k++)part(r,cyl(.07,.06,.15,10),toon(['#fffaf0','#e5484d','#3f7fd6','#ffc94d','#6cc58a'][k]),-15.8,1.08,3.3+k*.2);
  part(r,cyl(.2,.14,.1,16),toon('#f4efe6'),-15.8,1.05,6);for(let k=0;k<4;k++)part(r,sphere(.08,10,8),toon(['#e5484d','#ffc94d','#6cc58a','#f08a4b'][k]),-15.8+(k%2)*.08-.04,1.12+(k>1?.06:0),6+(k%3-1)*.07);
  pendant(game.root,12.4,5.4,{y:2.3,color:'#ffc94d'});lampPool(game.root,12.4,5.4,2.2,.18);
  const fl=group(r,15.4,0,7.6);part(fl,cyl(.22,.26,.05,16),toon(INK),0,.03,0);part(fl,cyl(.025,.025,1.7,6),toon(TRIM),0,.9,0);const fs=part(fl,new T.CylinderGeometry(.22,.34,.38,18,1,true),glossyToon('#f7ecd0'),0,1.8,0);(fs.material as T.Material).side=T.DoubleSide;
  glow(game.root,'rgba(255,210,140,1)',1.3,.35).position.set(15.4,1.72,7.6);lampPool(game.root,15.2,7.4,1.6,.22);
  // Floor clutter: paper drift, stacked boxes.
  for(const [x,z,ry] of [[-8.6,-1.2,.3],[7.2,3.6,-.4],[-2.6,5.1,.8],[2.2,-.8,.2],[-7.8,4.6,1.2],[6.8,-6.9,.5]])part(r,box(.3,.012,.23),toon('#fffaf0'),x,.01,z,false).rotation.y=ry;
  for(const [x,z] of [[-8.9,9.1],[7.8,9.2]]){part(r,rbox(.7,.6,.7,.05),toon('#c98f5a'),x,.3,z).rotation.y=.3;part(r,rbox(.6,.5,.6,.05),toon('#d7a56d'),x+.1,.85,z-.05).rotation.y=.8;}
  const lightUp=()=>{const m=new T.MeshBasicMaterial({map:slide});m.color.setScalar(1.8);m.userData.outlineParameters={visible:false};screen.material=m;
    pointLamp(game.root,12.2,1.9,-9,{color:'#dfe9ff',intensity:7,distance:7});lampPool(game.root,12.2,-8.4,2.4,.25,'#dfe9ff');glow(game.root,'rgba(220,235,255,1)',4,.35).position.set(12.2,1.9,-9.6);};
  return {screen,beam,lightUp,clock:{hand,minute,face}};
}
function lunch(game:Game,back:T.Group,side:T.Group):Decor{
  const l=game.level;
  floor(game,-l.width/2,-7.8,0,l.depth/2,TX.concreteFloor('#cbbfa8'),4);floor(game,-l.width/2,-7.8,-l.depth/2,0,TX.concreteFloor('#8f8aa0'),4);
  floor(game,-7.8,8,-l.depth/2,0,TX.kitchenTiles('#f4ecd8','#8fcac0',8),4);
  floor(game,8,l.width/2,-l.depth/2,0,TX.concreteFloor('#9aa3b2'),3);
  floor(game,-7.8,l.width/2,0,l.depth/2,TX.woodPlanks('#d9ab6e'),3.2);
  floor(game,10.4,13.6,-5.9,-5.45,TX.hazardStripe(),.6,.006);
  backWindows(game,back,x=>x< -7.6,.14);for(const x of windowXs(l.width))if(x< -7.6)windowUnit(back,x,1.95,.16);wallArt(side,'sun',-3,1.9,.16);wallArt(back,'plant',-8.5,1.95,.18,0,.8);
  const colors:Record<string,[string,string]>={store:['#b9b3c9','#6a6488'],kitchen:[WALL_UP,'#6cc3b4'],lift:['#c9d1db','#5a6378']};
  for(const o of l.obstacles){const [u,d]=colors[o.id.split('-')[0]]??[WALL_UP,WALL_LOW];interiorWall(game,o,u,d);}
  const r=game.decorRoot;
  wallArt(back,'graph',15.2,1.95,.18,0,.8);wallArt(side,'bolt',-3.6,1.95,.16);wallArt(side,'cork',-7.8,1.8,.16,0,1.1);
  // Kitchen: pots on the prep table, trays waiting on the belt, pendant lamps over the line.
  for(let k=0;k<4;k++)part(r,cyl(.16,.14,.22,14),toon(k%2?'#c7ccd6':'#e5484d'),-6.7+k*.5,1.12,-8.5);
  for(const x of [-5.5,-1,3.5])pendant(game.root,x,-5.2,{y:2.3,color:'#e9f0f2',light:x===-1});
  // Storeroom rack with stock boxes, lift room coolboxes waiting to go up.
  const rack=group(r,-16.1,0,5,Math.PI/2);part(rack,box(3.4,.08,.5),toon(TRIM),0,1,.1);part(rack,box(3.4,.08,.5),toon(TRIM),0,2.1,.1);for(const sx of [-1.6,1.6])part(rack,box(.08,2.2,.08),toon(DMETAL),sx,1.1,.3);
  for(let k=0;k<6;k++)part(r,rbox(.6,.5,.6,.05),toon(k%2?'#d7a56d':'#c98f5a'),-15.8,k<3?1.3:2.4,3.6+(k%3)*1.1).rotation.y=(k*.13)%.4;
  // Corridor: vending machine, water cooler, benches, a dining table with chairs, rugs, plants.
  part(r,rbox(1,2,.8,.08),toon('#e5484d'),-6.9,1,9.3);part(r,box(.66,1.24,.05),toon('#bfeaf5'),-6.98,1.12,9.72);for(let k=0;k<9;k++)part(r,box(.14,.14,.02),toon(['#ffc94d','#6cc58a','#3f7fd6','#f08a4b'][k%4]),-7.18+(k%3)*.2,.8+Math.floor(k/3)*.3,9.76,false);solid(game,1,2,.8,-6.9,1,9.3);
  part(r,rbox(.5,1,.5,.06),toon('#f4efe6'),-5.6,.5,9.4);part(r,cyl(.2,.2,.55,16),toon('#8fd0f0'),-5.6,1.3,9.4);solid(game,.5,1.5,.5,-5.6,.75,9.4);
  for(const x of [-4.2,-2.6]){part(r,rbox(1.3,.1,.45,.06),toon('#c98a55'),x,.46,9.45);for(const s of [-.5,.5])part(r,box(.08,.44,.36),toon(INK),x+s,.22,9.45);}
  rug(r,13.2,8.1,3.4,3.2,'#d98c5f','#f6d49b');part(r,cyl(.7,.7,.06,24),toon('#f4efe6'),13.2,.76,8.1);part(r,cyl(.08,.3,.74,12),toon(INK),13.2,.38,8.1);solid(game,1.4,.8,1.4,13.2,.4,8.1);
  for(let k=0;k<3;k++){const a=k*2.1+.4,cx=13.2+Math.cos(a)*1.1,cz=8.1+Math.sin(a)*1.1,chair=group(r,cx,0,cz,-a-Math.PI/2);part(chair,rbox(.55,.1,.55,.1),toon(['#e5484d','#3f7fd6','#ffc94d'][k]),0,.48,0);part(chair,rbox(.55,.5,.1,.08),toon(['#e5484d','#3f7fd6','#ffc94d'][k]),0,.78,-.24);part(chair,cyl(.03,.03,.4,8),toon(INK),0,.26,0);}
  for(const [x,z] of [[15.6,5.2],[-7.2,1.2],[15.8,-1.5]]){part(r,cyl(.26,.2,.42,14),toon('#e07a4f'),x,.21,z);for(const [dx,dy,dz,rr] of [[0,.66,0,.3],[.16,.5,.08,.24],[-.16,.54,-.05,.25]])part(r,sphere(rr,10,8),toon('#5cbf6a'),x+dx,dy,z+dz);}
  return {};
}
