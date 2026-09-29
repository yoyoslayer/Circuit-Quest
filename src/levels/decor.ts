// Static set dressing per level: floors, walls, fixtures. Visual style follows
// reference/render_kit (office.js / wing.js); colliders are separate, invisible boxes.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../game';
import type {Obstacle} from '../sim/cable';
import {INK,DMETAL,TRIM,WOOD,toon,rbox,box,cyl,sphere,part,group,repeat,planks,carpet,checker,concrete,glow,lit,unlit} from '../render/kit';

export interface Decor {screen?:T.Mesh;beam?:T.Object3D}
const WALL='#e3d6c0';
/** Invisible static collider; interior walls are taller than they look so Pip can't hop them. */
export function solid(game:Game,w:number,h:number,d:number,x:number,y:number,z:number,ry=0){
  const body=game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z).setRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),ry)));
  game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2).setFriction(.7),body);
}
function floor(game:Game,x0:number,x1:number,z0:number,z1:number,map:T.Texture,tile=4,y=0){
  const w=x1-x0,d=z1-z0,m=part(game.decorRoot,new T.PlaneGeometry(w,d),toon('#ffffff',{map:repeat(map,w/tile,d/tile)}),(x0+x1)/2,y+.001,(z0+z1)/2,false);
  m.rotation.x=-Math.PI/2;m.userData.outline=false;return m;
}
/** A fading full-height shell wall with a trim cap. */
/** Full-height back/side wall. When the camera swings round behind it, it drops to a stub (cutaway). */
function shellWall(game:Game,w:number,d:number,x:number,z:number,normal:[number,number],h=3){
  const wall=group(game.root,x,0,z);part(wall,box(w,h,d),toon(WALL),0,h/2-.05,0);part(wall,box(w+.02,.08,d+.05),toon(TRIM),0,h-.05,0);
  game.shellWalls.push({group:wall,normal:new T.Vector3(normal[0],0,normal[1]),height:h});solid(game,w,h,d,x,h/2,z);
}
function interiorWall(game:Game,o:Obstacle,color=WALL,h=1.35){
  const w=o.maxX-o.minX,d=o.maxZ-o.minZ,x=(o.minX+o.maxX)/2,z=(o.minZ+o.maxZ)/2;
  part(game.decorRoot,box(w,h,d),toon(color),x,h/2,z);part(game.decorRoot,box(w+.03,.08,d+.03),toon(TRIM),x,h,z);solid(game,w,2.6,d,x,1.3,z);
}
function pillar(game:Game,o:Obstacle){
  const w=o.maxX-o.minX,d=o.maxZ-o.minZ,x=(o.minX+o.maxX)/2,z=(o.minZ+o.maxZ)/2;
  const material=toon('#d9ccb6').clone();material.transparent=true;const m=part(game.root,box(w,3,d),material,x,1.5,z);game.occluders.push(m);
  part(game.decorRoot,box(w+.1,.2,d+.1),toon(TRIM),x,.1,z);solid(game,w,3,d,x,1.5,z);
}
function windows(game:Game,z:number,skyline=true){
  const l=game.level;
  for(let x=-l.width/2+2.2;x<l.width/2-1.5;x+=3.2){
    part(game.decorRoot,box(2.4,1.5,.06),toon('#8fc3e0'),x,1.9,z+.16,false);part(game.decorRoot,box(.08,1.5,.1),toon('#f4efe6'),x,1.9,z+.2,false);
    if(skyline)for(let i=0;i<3;i++)part(game.decorRoot,box(.35+((i*7+x*3)%5)*.08,.35+((i*5+x)%7)*.12,.04),toon(['#6f8fb0','#7fa0bf','#5f7f9f'][i]),x-.8+i*.7,1.3+((i+x)%3)*.1,z+.13,false);
  }
}
export function decorate(game:Game):Decor{
  const l=game.level;
  // Outer shell: fading back and left walls, low front rails keep physics contained.
  shellWall(game,l.width,.25,0,-l.depth/2,[0,-1]);shellWall(game,.25,l.depth,-l.width/2,0,[-1,0]);
  part(game.decorRoot,box(l.width,.3,.22),toon(WALL),0,.1,l.depth/2);solid(game,l.width,1,.22,0,.5,l.depth/2);
  part(game.decorRoot,box(.22,.3,l.depth),toon(WALL),l.width/2,.1,0);solid(game,.22,1,l.depth,l.width/2,.5,0);
  if(l.id==='meeting')return meeting(game);
  if(l.id==='lunch')return lunch(game);
  return playground(game);
}
function playground(game:Game):Decor{
  const l=game.level;floor(game,-l.width/2,l.width/2,-l.depth/2,l.depth/2,concrete('#b9c4c6'),4);windows(game,-l.depth/2,false);
  for(const o of l.obstacles)pillar(game,o);
  part(game.decorRoot,box(.14,1.7,.14),toon(DMETAL),l.target.x,.85,l.target.z);
  const screen=part(game.root,sphere(.45,16,12),toon('#495469'),l.target.x,1.9,l.target.z);
  // A few crates and cones make the empty test room read as a warehouse corner.
  for(const [x,z] of [[8,8],[8.8,8.2],[-8.5,-8.5]])part(game.decorRoot,rbox(.8,.6,.7,.05),toon('#c98f5a'),x,.3,z);solid(game,1.8,.6,.8,8.4,.3,8.1);solid(game,.8,.6,.7,-8.5,.3,-8.5);
  return {screen};
}
function meeting(game:Game):Decor{
  const l=game.level;
  floor(game,-l.width/2,9.1,-l.depth/2,l.depth/2,carpet('#8fa3b8'),4);floor(game,9.1,l.width/2,-l.depth/2,l.depth/2,planks('#c99a64','rgba(110,70,35,0.35)'),3);
  windows(game,-l.depth/2);
  for(const o of l.obstacles)if(o.id.startsWith('pillar'))pillar(game,o);else interiorWall(game,o,'#bfb4a2');
  // Server closet: racks with blinking LEDs, UPS, and the one live outlet on its east wall.
  for(let i=0;i<4;i++){const x=-15.9+i*1.0;part(game.decorRoot,rbox(.8,2.3,.9,.05),toon('#3a3d55'),x,1.15,-9.4);for(let k=0;k<7;k++)part(game.decorRoot,box(.06,.04,.02),lit(['#57e38f','#ffc94d','#5b9cf0'][(i+k)%3],['#3fdc7f','#ffb020','#4a8cff'][(i+k)%3]),x-.2+(k%3)*.2,.4+k*.28,-8.94,false);}
  solid(game,4,2.3,.9,-14.4,1.15,-9.4);
  part(game.decorRoot,rbox(.8,.5,.6,.06),toon(DMETAL),-14.6,.25,-6.6);solid(game,.8,.5,.6,-14.6,.25,-6.6);
  part(game.decorRoot,rbox(.4,.4,.12,.06).clone().rotateY(Math.PI/2),toon('#f0ece2'),-11.72,.55,-7.8);glow(game.root,'rgba(120,255,160,1)',.8,.5).position.set(-11.6,.55,-7.8);
  // Boardroom: glass front with a door gap, wooden table, dark projector and screen.
  for(const [x0,x1] of [[9.3,11],[13.8,l.width/2]]){const w=x1-x0,x=(x0+x1)/2;part(game.decorRoot,box(w,2.5,.06),toon('#bfe6f5',{opacity:.28}),x,1.3,-2,false);part(game.decorRoot,box(w,.08,.1),toon(DMETAL),x,2.6,-2);part(game.decorRoot,box(w,.1,.1),toon(DMETAL),x,.05,-2);solid(game,w,2.6,.14,x,1.3,-2);}
  for(const x of [11,13.8])part(game.decorRoot,box(.1,2.6,.1),toon(DMETAL),x,1.3,-2);
  part(game.decorRoot,rbox(1.6,.1,4.6,.4),toon('#8a5a2b'),12,.78,-6.4);for(const z of [-8,-4.8])part(game.decorRoot,cyl(.1,.25,.75,12),toon(INK),12,.38,z);solid(game,1.6,.8,4.6,12,.4,-6.4);
  const projector=group(game.decorRoot,12,0,-4.5);part(projector,rbox(.6,.25,.5,.06),toon('#dcdfe6'),0,.96,0);part(projector,cyl(.1,.1,.1,14,'z'),toon(INK),0,.96,-.28);
  const lead=new T.CatmullRomCurve3([[12.1,.9,-4.3],[12.2,.3,-3.9],[12.4,.05,-3.2],[12.3,.05,-2.4]].map(p=>new T.Vector3(...p)));part(game.decorRoot,new T.TubeGeometry(lead,40,.035,6),toon(INK));
  const screen=part(game.root,box(4.2,2.3,.05),toon('#2a2c42'),12.2,1.9,-9.8);
  const beam=part(game.root,new T.CylinderGeometry(1.4,.1,5.1,20,1,true).rotateX(Math.PI/2),unlit('#fff3c8',{transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide}),12.1,1.4,-7.2,false);beam.lookAt(12.2,1.9,-9.8);beam.visible=false;
  // Coffee corner counter and a lounge rug.
  part(game.decorRoot,new T.CircleGeometry(1.8,32).rotateX(-Math.PI/2),toon('#d7a56d'),12.5,.012,5.3,false);
  part(game.decorRoot,rbox(.8,.95,3.4,.06),toon(WOOD),-15.9,.47,4.6);part(game.decorRoot,box(.85,.06,3.5),toon('#f1ebe0'),-15.9,.97,4.6);solid(game,.8,.97,3.4,-15.9,.48,4.6);
  return {screen,beam};
}
function lunch(game:Game):Decor{
  const l=game.level;
  floor(game,-l.width/2,-7.8,0,l.depth/2,concrete('#bdb6a8'),4);floor(game,-l.width/2,-7.8,-l.depth/2,0,concrete('#a9a296'),4);
  floor(game,-7.8,8,-l.depth/2,0,checker('#e9e3d3','#8cc7bd'),3.2);
  floor(game,8,l.width/2,-l.depth/2,0,concrete('#9aa3b2'),3);
  floor(game,-7.8,l.width/2,0,l.depth/2,planks('#d4ab74','rgba(110,70,35,0.35)'),3);
  windows(game,-l.depth/2);
  const colors:Record<string,string>={store:'#c9bfae',kitchen:'#e8dcc6',lift:'#b9c0cc'};
  for(const o of l.obstacles)interiorWall(game,o,colors[o.id.split('-')[0]]??WALL);
  return {};
}
