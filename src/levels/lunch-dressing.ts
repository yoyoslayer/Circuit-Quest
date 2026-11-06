// Lunch Rush dressing for the 36 × 24 m room (review 6). decor.ts's lunch() still lays its fixtures
// out for the old 33 × 20 m shell, and the job (kitchen, lift, storeroom door, carts) stays where it
// was, so this runs from the Lunch runtime (after decor and clutter, before freezeDecor) and
//  - moves the wall-huggers out with the walls (the corridor rack, the vending/cooler/bench line,
//    the café lounge and its floor lamp, the right-hand plants), colliders included;
//  - moves two back-wall posters off the new window positions onto the piers between them;
//  - adds the kitchen's new back counters along the back wall.
// The level's clutter lanes (lunch.ts) keep the clutter off the moved and new pieces.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../game';
import type {Obstacle} from '../sim/cable';
import {solid} from './decor';
import {METAL,DMETAL,toon,rbox,box,cyl,sphere,part} from '../render/kit';
import {INK} from '../render/toon';

/** The shell decor.ts's lunch() was laid out for. */
const OLD_W=33,OLD_D=20;
type Shift={minX:number;maxX:number;minZ:number;maxZ:number;dx:number;dz:number};
/** Old-room boxes (world x/z) holding each wall-hugging group, and how far it moves. */
function shifts(game:Game):Shift[]{
  const ex=game.level.width/2-OLD_W/2,ez=game.level.depth/2-OLD_D/2;
  return [
    // The storeroom rack on the corridor's left wall (x -16.1): out with the left wall.
    {minX:-16.6,maxX:-15.3,minZ:2.5,maxZ:7.5,dx:-ex,dz:0},
    // Vending machine, water cooler and the two benches along the front edge (z 9.3-9.8).
    {minX:-7.6,maxX:-1.8,minZ:8.6,maxZ:10,dx:0,dz:ez},
    // The café table, its chairs and rug, and the floor lamp in the front-right corner.
    {minX:11.5,maxX:16.5,minZ:6.2,maxZ:10,dx:ex,dz:ez},
    // The potted plants by the right-hand edge (x 15.6-15.8).
    {minX:15.2,maxX:16.5,minZ:-2,maxZ:5.6,dx:ex,dz:0},
    // The two cardboard box stacks by the front edge (decor.ts, at x -8.9 and 7.8, z ~9.1).
    {minX:-9.4,maxX:-8.4,minZ:8.6,maxZ:9.7,dx:0,dz:ez},{minX:7.3,maxX:8.3,minZ:8.6,maxZ:9.8,dx:0,dz:ez}];
}
const inside=(s:Shift,x:number,z:number)=>x>=s.minX&&x<=s.maxX&&z>=s.minZ&&z<=s.maxZ;

/** Cable-wrap boxes for the pieces this file moves or adds (the runtime's FIXED list uses these). */
export function lunchDressingObstacles(width:number,depth:number):Obstacle[]{
  const ex=width/2-OLD_W/2,ez=depth/2-OLD_D/2,back=-depth/2;
  const o=(id:string,minX:number,maxX:number,minZ:number,maxZ:number,dx=0,dz=0):Obstacle=>({id,minX:minX+dx,maxX:maxX+dx,minZ:minZ+dz,maxZ:maxZ+dz});
  return [o('vending',-7.4,-6.4,8.9,9.7,0,ez),o('water',-5.85,-5.35,9.15,9.65,0,ez),o('lounge',12.5,13.9,7.4,8.8,ex,ez),
    o('bench-1',-4.85,-3.55,9.22,9.68,0,ez),o('bench-2',-3.25,-1.95,9.22,9.68,0,ez),o('plant-1',15.34,15.86,4.94,5.46,ex),
    o('plant-3',15.54,16.06,-1.76,-1.24,ex),o('rack',-16.35,-15.5,2.9,6.7,-ex),
    o('back-counter-west',-7.3,.5,back+.18,back+.88),o('back-counter-east',1.3,7.4,back+.18,back+.88)];
}

export function dressLunch(game:Game){relocate(game);posters(game);backCounters(game);}

/** Moves decor.ts's wall-huggers (meshes, groups and their static colliders) out with the walls. */
function relocate(game:Game){
  const table=shifts(game),find=(x:number,z:number)=>table.find(s=>inside(s,x,z));
  for(const o of game.decorRoot.children){const s=find(o.position.x,o.position.z);if(s){o.position.x+=s.dx;o.position.z+=s.dz;}}
  // On root only the floor lamp's glow sprite and light pool (props and coworkers are root children too).
  for(const o of game.root.children){if(!(o instanceof T.Sprite||(o instanceof T.Mesh&&o.userData.noAO&&o.geometry.type==='PlaneGeometry')))continue;
    const s=find(o.position.x,o.position.z);if(s){o.position.x+=s.dx;o.position.z+=s.dz;}}
  // Their colliders: the static boxes decor.ts's solid() made (one fixed body each). Coworker capsules
  // and props are left alone.
  const moves:[RAPIER.RigidBody,Shift][]=[];
  game.world.forEachCollider(c=>{const b=c.parent();if(!b||!b.isFixed()||c.shape.type!==RAPIER.ShapeType.Cuboid||b.numColliders()!==1)return;
    const t=b.translation(),s=find(t.x,t.z);if(s)moves.push([b,s]);});
  for(const [b,s] of moves){const t=b.translation();b.setTranslation({x:t.x+s.dx,y:t.y,z:t.z+s.dz},false);}
  game.world.propagateModifiedBodyPositionsToColliders();
}

/** decor.ts hangs 'plant' at x -9.5 and 'graph' at 16.1 on the back wall; the wider wall puts windows
 *  there (x -9.4 and 16.2), so they move to the piers at -11 and 14.6. */
function posters(game:Game){
  const back=game.shellWalls[0]?.group.children[0];if(!back)return;
  for(const o of back.children){if(o.type!=='Group')continue;
    if(Math.abs(o.position.x+9.5)<.01)o.position.x=-11;else if(Math.abs(o.position.x-16.1)<.01)o.position.x=14.6;}
}

/** The kitchen's back line, along the new back wall: a sink run behind the prep table and oven, and a
 *  baking counter behind the belt. Low enough to sit under the back windows. */
function backCounters(game:Game){
  const r=game.decorRoot,z=-game.level.depth/2+.53,front=z+.35,item=z+.12;
  const body=toon('#8cc2b6'),seam=toon('#5f9488'),top=toon('#e9f0f2'),steel=toon(METAL),plate=toon('#fffaf0');
  const counter=(x0:number,x1:number)=>{const w=x1-x0,cx=(x0+x1)/2;
    part(r,rbox(w,.84,.7,.05),body,cx,.44,z);part(r,box(w+.06,.06,.76),top,cx,.89,z+.01);part(r,box(w-.04,.1,.04),toon(INK),cx,.05,front-.03,false);
    for(let x=x0+.65;x<x1-.2;x+=.65)part(r,box(.02,.62,.01),seam,x,.48,front+.005,false);
    for(let x=x0+.33;x<x1-.1;x+=.65)part(r,box(.16,.03,.03),steel,x,.74,front+.02,false);
    solid(game,w,.95,.7,cx,.475,z);};
  // West: sink, dish rack with plates on edge, plate stacks and a stock pot.
  counter(-7.3,.5);
  part(r,box(1,.02,.5),toon('#7d8697'),-5.4,.925,item-.05,false);part(r,cyl(.025,.025,.36,8),steel,-5.4,1.1,z-.22);part(r,box(.04,.04,.26),steel,-5.4,1.27,z-.1);
  part(r,box(.8,.05,.42),steel,-3.9,.95,item);for(let k=0;k<7;k++)part(r,cyl(.16,.16,.02,16,'x'),plate,-4.2+k*.1,1.12,item,false);
  for(const [x,n] of [[-2.6,6],[-2.15,4]] as const)for(let k=0;k<n;k++)part(r,cyl(.15,.14,.03,16),plate,x,.94+k*.035,item,false);
  part(r,cyl(.22,.2,.34,16),steel,-1.1,1.09,item);part(r,cyl(.23,.23,.03,16),toon(DMETAL),-1.1,1.27,item,false);
  part(r,cyl(.17,.15,.22,14),toon('#e5484d'),-.2,1.03,item);part(r,box(.3,.03,.03),toon(INK),.05,1.1,item,false);
  // East, behind the belt: a stand mixer, flour sacks and baking sheets.
  counter(1.3,7.4);
  part(r,rbox(.36,.12,.44,.05),toon('#e5484d'),2.2,.98,item);part(r,box(.14,.42,.16),toon('#e5484d'),2.2,1.2,item-.14);part(r,rbox(.4,.16,.44,.07),toon('#e5484d'),2.2,1.42,item-.05);
  part(r,cyl(.15,.11,.2,16),steel,2.2,1.06,item+.05);
  for(const [x,y,ry] of [[3.4,1.08,.2],[3.95,1.08,-.15],[3.68,1.32,.4]] as const){const s=part(r,rbox(.5,.26,.34,.12),toon('#efe6d2'),x,y,item);s.rotation.y=ry;}
  for(let k=0;k<5;k++)part(r,box(.6,.02,.42),steel,5.2,.93+k*.04,item,false);
  for(const [x,c] of [[6.3,'#6cc58a'],[6.7,'#f4efe6'],[7.05,'#e5484d']] as const){part(r,cyl(.1,.1,.24,12),toon(c),x,1.04,item);part(r,sphere(.07,10,8),toon(INK),x,1.18,item,false);}
}
