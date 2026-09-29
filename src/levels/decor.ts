// Static set dressing per level: floors, walls, fixtures. Palette and staging follow
// mockups/review/REVIEW.md; colliders are separate, invisible boxes.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../game';
import type {Obstacle} from '../sim/cable';
import {INK,DMETAL,TRIM,toon,rbox,box,cyl,sphere,part,group,repeat,planks,tiles,stripes,skyView,concrete,glow,lit,unlit,glyph,decal,cachedTexture} from '../render/kit';

export interface Decor {screen?:T.Mesh;beam?:T.Object3D;clock?:{hand:T.Object3D;minute:T.Object3D;face:T.Mesh}}
const CREAM='#f4e7cf',WAINSCOT='#d9774a',BASE='#7a4a33';
/** Invisible static collider; interior walls are taller than they look so Pip can't hop them. */
export function solid(game:Game,w:number,h:number,d:number,x:number,y:number,z:number,ry=0){
  const body=game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z).setRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),ry)));
  game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2).setFriction(.7),body);
}
function floor(game:Game,x0:number,x1:number,z0:number,z1:number,map:T.Texture,tile=4,y=0){
  const w=x1-x0,d=z1-z0,m=part(game.decorRoot,new T.PlaneGeometry(w,d),toon('#ffffff',{map:repeat(map.clone(),w/tile,d/tile)}),(x0+x1)/2,y+.001,(z0+z1)/2,false);
  m.rotation.x=-Math.PI/2;return m;
}
/** Back/side wall: terracotta wainscot and baseboard below 0.9 m, cream above. When the camera
 *  swings behind it the upper part folds away (cutaway). Returns the upper group, in wall-local
 *  coordinates with +z (or +x) pointing into the room. */
function shellWall(game:Game,w:number,d:number,x:number,z:number,normal:[number,number],h=3){
  const wall=group(game.root,x,0,z),upper=group(wall,0,.9,0);
  part(wall,box(w,.9,d),toon(WAINSCOT),0,.45,0);part(wall,box(w+.02,.14,d+.06),toon(BASE),0,.07,0);part(wall,box(w+.02,.05,d+.05),toon(TRIM),0,.9,0);
  part(upper,box(w,h-.9,d),toon(CREAM),0,(h-.9)/2-.05,0);part(upper,box(w+.02,.09,d+.06),toon(TRIM),0,h-.95,0);
  // Grazing sun on the long wall faces only produces acne; walls don't need to receive shadows.
  wall.traverse(o=>{o.receiveShadow=false;});
  game.shellWalls.push({group:upper,normal:new T.Vector3(normal[0],0,normal[1]),height:h});solid(game,w,h,d,x,h/2,z);
  return upper;
}
function interiorWall(game:Game,o:Obstacle,upperColor=CREAM,lowerColor=WAINSCOT,h=1.35){
  const w=o.maxX-o.minX,d=o.maxZ-o.minZ,x=(o.minX+o.maxX)/2,z=(o.minZ+o.maxZ)/2,r=game.decorRoot;
  part(r,box(w,.8,d),toon(lowerColor),x,.4,z);part(r,box(w,h-.8,d),toon(upperColor),x,.8+(h-.8)/2,z);part(r,box(w+.03,.12,d+.05),toon(BASE),x,.06,z);
  part(r,box(w+.05,.1,d+.07),toon(TRIM),x,h,z);solid(game,w,2.6,d,x,1.3,z);
}
function pillar(game:Game,o:Obstacle,hazard=false){
  const w=o.maxX-o.minX,d=o.maxZ-o.minZ,x=(o.minX+o.maxX)/2,z=(o.minZ+o.maxZ)/2;
  const material=(hazard?toon('#ffffff',{map:repeat(stripes(),1,3)}):toon('#efe2c8')).clone();material.transparent=true;const m=part(game.root,box(w,3,d),material,x,1.5,z);game.occluders.push(m);
  part(game.decorRoot,box(w+.12,.22,d+.12),toon(hazard?INK:BASE),x,.11,z);part(game.decorRoot,box(w+.12,.08,d+.12),toon(TRIM),x,.26,z);solid(game,w,3,d,x,1.5,z);
}
/** Deep-framed windows looking out on a sky and skyline, mounted on a wall's upper group. */
function windows(upper:T.Group,width:number,skip:(x:number)=>boolean=()=>false){
  for(let x=-width/2+2.2,i=0;x<width/2-1.5;x+=3.2,i++){if(skip(x))continue;
    part(upper,box(2.4,1.5,.04),toon('#ffffff',{map:cachedTexture(`sky${i%4}`,()=>skyView(i%4))}),x,1,.12,false);
    for(const [w,h,dx,dy] of [[2.56,.1,0,.8],[2.56,.14,0,-.8],[.1,1.6,-1.25,0],[.1,1.6,1.25,0],[.06,1.5,0,0]] as const)part(upper,box(w,h,.18),toon('#fbf5ea'),x+dx,1+dy,.16);
    part(upper,box(2.6,.06,.26),toon('#e8dcc4'),x,.2,.22);
  }
}
function poster(parent:T.Object3D,x:number,y:number,z:number,ry:number,kind:number){
  const tex=cachedTexture(`poster${kind}`,()=>glyph(c=>{const bg=['#ff7a6b','#4fcfa6','#5ba8f0','#ffc629'][kind%4];c.fillStyle=bg;c.fillRect(0,0,256,256);c.fillStyle='#fff6e6';
    if(kind%4===0){c.beginPath();c.moveTo(150,30);c.lineTo(80,140);c.lineTo(126,140);c.lineTo(104,230);c.lineTo(180,110);c.lineTo(134,110);c.closePath();c.fill();}
    else if(kind%4===1){c.beginPath();c.arc(128,120,70,0,7);c.fill();c.fillStyle=bg;c.beginPath();c.arc(128,120,40,0,7);c.fill();c.fillStyle='#fff6e6';c.fillRect(60,210,136,18);}
    else if(kind%4===2){for(let i=0;i<4;i++)c.fillRect(50+i*42,190-i*40,28,40+i*40);}
    else{c.beginPath();c.arc(128,110,64,0,7);c.fill();c.fillStyle=bg;c.fillRect(100,100,56,10);c.beginPath();c.arc(108,86,8,0,7);c.arc(148,86,8,0,7);c.fill();}}));
  const g=group(parent,x,y,z,ry);part(g,box(.9,1.2,.03),toon('#fbf5ea'),0,0,0);decal(g,tex,.78,1.08,0,0,.02);
}
function slab(game:Game){
  const l=game.level;part(game.decorRoot,box(l.width+.5,.7,l.depth+.5),toon('#5a5f7a'),0,-.37,0,false);part(game.decorRoot,box(l.width+.54,.12,l.depth+.54),toon('#cfc6b4'),0,-.06,0,false);
}
function frontRails(game:Game){
  const l=game.level,r=game.decorRoot;
  part(r,box(l.width,.3,.22),toon(WAINSCOT),0,.15,l.depth/2);part(r,box(l.width+.02,.06,.26),toon(TRIM),0,.31,l.depth/2);solid(game,l.width,1,.22,0,.5,l.depth/2);
  part(r,box(.22,.3,l.depth),toon(WAINSCOT),l.width/2,.15,0);part(r,box(.26,.06,l.depth+.02),toon(TRIM),l.width/2,.31,0);solid(game,.22,1,l.depth,l.width/2,.5,0);
}
export function decorate(game:Game):Decor{
  const l=game.level;slab(game);frontRails(game);
  const back=shellWall(game,l.width,.25,0,-l.depth/2,[0,-1]),side=shellWall(game,.25,l.depth,-l.width/2,0,[-1,0]);
  // The side wall's upper group is rotated so its local +z points into the room, like the back wall.
  const sideFace=group(side,0,0,0,Math.PI/2);
  if(l.id==='meeting')return meeting(game,back,sideFace);
  if(l.id==='lunch')return lunch(game,back,sideFace);
  return playground(game,back,sideFace);
}
function playground(game:Game,back:T.Group,side:T.Group):Decor{
  const l=game.level,r=game.decorRoot;floor(game,-l.width/2,l.width/2,-l.depth/2,l.depth/2,concrete('#d8cdb8'),4);windows(back,l.width);
  // Painted lane lines lead from the reel to the lamp socket.
  const lane=unlit('#ffc629');for(const [x0,z0,x1,z1] of [[-9.6,5.8,9.6,5.8],[-9.6,-8.2,9.6,-8.2],[-9.6,5.8,-9.6,-8.2]]){const len=Math.hypot(x1-x0,z1-z0);const m=part(r,box(len,.01,.12),lane,(x0+x1)/2,.006,(z0+z1)/2,false);m.rotation.y=-Math.atan2(z1-z0,x1-x0);}
  for(const o of l.obstacles)pillar(game,o,true);
  part(r,box(.14,1.7,.14),toon(DMETAL),l.target.x,.85,l.target.z);part(r,cyl(.3,.36,.12,18),toon(INK),l.target.x,.06,l.target.z);
  const screen=part(game.root,sphere(.45,18,14),toon('#495469'),l.target.x,1.9,l.target.z);
  // Pallets and cones make the empty test room read as a warehouse training bay.
  for(const [x,z] of [[8,8],[8.8,8.2],[-8.5,-8.5]]){part(r,box(1.1,.14,.9),toon('#c9925e'),x,.07,z);part(r,rbox(.8,.6,.7,.08),toon('#d7a56d'),x,.44,z);}
  solid(game,1.9,.74,.9,8.4,.37,8.1);solid(game,1.1,.74,.9,-8.5,.37,-8.5);
  for(const [x,z] of [[6,-2],[6.6,-1.2],[-6,7.5]]){part(r,box(.5,.05,.5),toon('#ff8a3d'),x,.025,z);part(r,cyl(.03,.22,.6,14),toon('#ff8a3d'),x,.33,z);part(r,cyl(.13,.16,.1,14),toon('#fff6e6'),x,.4,z);}
  poster(side,-4,.9,.14,0,0);poster(side,3,.9,.14,0,1);
  return {screen};
}
function meeting(game:Game,back:T.Group,side:T.Group):Decor{
  const l=game.level,r=game.decorRoot;
  floor(game,-l.width/2,9.1,-l.depth/2,l.depth/2,tiles('#4f7fb8','#5b8cc4','rgba(20,30,60,0.22)',4),4);
  floor(game,9.1,l.width/2,-l.depth/2,-2,planks('#d39a5b','rgba(110,70,35,0.35)'),3);floor(game,9.1,l.width/2,-2,l.depth/2,planks('#e2b477','rgba(110,70,35,0.3)'),3);
  windows(back,l.width,x=>x< -11.5);
  // Deadline clock between two windows: the minute hand sweeps the four-minute meeting.
  const clock=group(back,-3.1,1.45,.16);const face=part(clock,cyl(.36,.36,.06,32,'z'),toon('#fbf5ea'),0,0,0);part(clock,cyl(.4,.4,.05,32,'z'),toon(INK),0,0,-.02);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;part(clock,box(.03,.07,.02),toon(INK),Math.sin(a)*.29,Math.cos(a)*.29,.04,false).rotation.z=-a;}
  const hand=group(clock,0,0,.05);part(hand,box(.035,.2,.02),toon(INK),0,.09,0,false);const minute=group(clock,0,0,.06);part(minute,box(.025,.3,.02),toon('#e5484d'),0,.14,0,false);
  poster(side,-8,.95,.14,0,2);poster(side,-1,.95,.14,0,3);poster(side,6,.95,.14,0,0);
  for(const o of l.obstacles)if(o.id.startsWith('pillar'))pillar(game,o);else interiorWall(game,o,'#c9c2d9','#5a5f7a');
  // Server closet: blue-lit racks with LEDs (animated by game), UPS, and the one live outlet.
  for(let i=0;i<4;i++){const x=-15.9+i*1.0;part(r,rbox(.8,2.3,.9,.05),toon('#3a3d55'),x,1.15,-9.4);for(let k=0;k<7;k++)part(r,box(.06,.04,.02),lit(['#57e38f','#ffc94d','#5b9cf0'][(i+k)%3],['#3fdc7f','#ffb020','#4a8cff'][(i+k)%3]),x-.2+(k%3)*.2,.4+k*.28,-8.94,false);}
  part(r,new T.PlaneGeometry(4.3,4.3).rotateX(-Math.PI/2),unlit('#3a5ab0',{transparent:true,opacity:.18,depthWrite:false}),-14.2,.004,-7.8,false);
  solid(game,4,2.3,.9,-14.4,1.15,-9.4);
  part(r,rbox(.8,.5,.6,.06),toon(DMETAL),-14.6,.25,-6.6);solid(game,.8,.5,.6,-14.6,.25,-6.6);
  part(r,rbox(.4,.4,.12,.06).clone().rotateY(Math.PI/2),toon('#f0ece2'),-11.72,.55,-7.8);glow(game.root,'rgba(120,255,160,1)',.8,.5).position.set(-11.6,.55,-7.8);
  part(r,cyl(.12,.12,.5,14),toon('#e5484d'),-11.6,.3,-5.2);part(r,box(.08,.14,.08),toon(INK),-11.6,.62,-5.2);
  // Boardroom: frosted-banded glass front, honey-wood table, dark projector and screen.
  for(const [x0,x1] of [[9.3,11],[13.8,l.width/2]]){const w=x1-x0,x=(x0+x1)/2;part(r,box(w,2.5,.06),toon('#bfe6f5',{opacity:.28}),x,1.3,-2,false);part(r,box(w,.3,.07),toon('#f4f8fb',{opacity:.7}),x,1.2,-2,false);part(r,box(w,.08,.1),toon(DMETAL),x,2.6,-2);part(r,box(w,.1,.1),toon(DMETAL),x,.05,-2);solid(game,w,2.6,.14,x,1.3,-2);}
  for(const x of [11,13.8])part(r,box(.1,2.6,.1),toon(DMETAL),x,1.3,-2);
  part(r,rbox(1.7,.12,4.7,.45),toon('#b8773b'),12,.78,-6.4);for(const z of [-8,-4.8])part(r,cyl(.1,.25,.75,12),toon(INK),12,.38,z);solid(game,1.6,.8,4.6,12,.4,-6.4);
  const projector=group(r,12,0,-4.5);part(projector,rbox(.6,.25,.5,.06),toon('#dcdfe6'),0,.96,0);part(projector,cyl(.1,.1,.1,14,'z'),toon(INK),0,.96,-.28);
  const lead=new T.CatmullRomCurve3([[12.1,.9,-4.3],[12.2,.3,-3.9],[12.4,.05,-3.2],[12.3,.05,-2.4]].map(p=>new T.Vector3(...p)));part(r,new T.TubeGeometry(lead,40,.035,6),toon(INK));
  const screen=part(game.root,box(4.2,2.3,.05),toon('#2a2c42'),12.2,1.9,-9.8);
  const beam=part(game.root,new T.CylinderGeometry(1.4,.1,5.1,20,1,true).rotateX(Math.PI/2),unlit('#fff3c8',{transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide}),12.1,1.4,-7.2,false);beam.lookAt(12.2,1.9,-9.8);beam.visible=false;
  // Lounge rug and coffee counter.
  part(r,new T.CircleGeometry(2.1,40).rotateX(-Math.PI/2),toon('#f2b541'),12.5,.012,5.3,false);part(r,new T.RingGeometry(1.8,1.95,40).rotateX(-Math.PI/2),toon('#e59a2e'),12.5,.014,5.3,false);
  part(r,rbox(.8,.95,3.4,.06),toon('#b98552'),-15.9,.47,4.6);part(r,box(.85,.06,3.5),toon('#f1ebe0'),-15.9,.97,4.6);solid(game,.8,.97,3.4,-15.9,.48,4.6);
  return {screen,beam,clock:{hand,minute,face}};
}
function lunch(game:Game,back:T.Group,side:T.Group):Decor{
  const l=game.level;
  floor(game,-l.width/2,-7.8,0,l.depth/2,concrete('#cbbfa8'),4);floor(game,-l.width/2,-7.8,-l.depth/2,0,concrete('#8f8aa0'),4);
  floor(game,-7.8,8,-l.depth/2,0,tiles('#f4ecd8','#6cc3b4','rgba(40,60,60,0.16)',4),2.4);
  floor(game,8,l.width/2,-l.depth/2,0,concrete('#7d8aa3'),3);
  floor(game,-7.8,l.width/2,0,l.depth/2,planks('#e2b477','rgba(110,70,35,0.32)'),3);
  // Hazard edge around the lift shaft.
  part(game.decorRoot,new T.PlaneGeometry(3.4,.3).rotateX(-Math.PI/2),toon('#ffffff',{map:repeat(stripes(),6,1)}),12,.006,-5.6,false);
  windows(back,l.width);poster(side,3,.95,.14,0,1);
  const colors:Record<string,[string,string]>={store:['#b9b3c9','#6a6488'],kitchen:[CREAM,'#6cc3b4'],lift:['#c9d1db','#5a6378']};
  for(const o of l.obstacles){const [u,d]=colors[o.id.split('-')[0]]??[CREAM,WAINSCOT];interiorWall(game,o,u,d);}
  return {};
}
