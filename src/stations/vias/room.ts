// The reference spatial workshop: every central machine is usable, with a clear
// U-shaped process aisle, stock storage at the side and customer dispatch at the back.
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {box,cyl,part,group,toon,DMETAL,concrete} from '../../render/kit';
import * as TX from '../../render/textures';
import {pendant,pointLamp} from '../../levels/dressing';
import {solid} from '../../levels/decor';
import {signPlate} from '../../render/labels';
export function dressViaFoundry(game:Game,kit:RoomKit){
  const r=game.decorRoot,W=game.level.width/2,D=game.level.depth/2;
  kit.floor(-W,W,-D,D,concrete('#c3cec9'),4);
  kit.floor(-6,6,-1.35,7.2,TX.kitchenTiles('#d7dfd8','#c5d1ca',8),4,.009);
  kit.floor(-W,W,-D,-3.5,TX.woodPlanks('#c1a887'),3);
  kit.backWindows(x=>Math.abs(x)<5,.08);
  // Side stock bays create a room with paths and sightlines, not loose clutter.
  for(const x of [-10,10]){
    const rack=group(r,x,0,1);for(const y of [.3,1.15,2])part(rack,box(2.3,.07,3.4),toon('#738b91'),0,y,0);
    for(const sx of [-1.05,1.05])for(const z of [-1.55,1.55])part(rack,box(.08,2.2,.08),toon(DMETAL),sx,1.1,z);
    for(let k=0;k<6;k++)part(rack,box(.07,.4,1.1),toon(k%2?'#497d62':'#a37350'),-.8+k*.32,1.4,0);
    solid(game,2.3,2.2,3.4,x,1.1,1);
  }
  const annex={id:'stockroom',minX:7.5,maxX:7.8,minZ:-8,maxZ:-2};kit.interiorWall(annex,'#c1d1ce','#799a96',3.2);
  const ceiling=part(game.root,box(6,.15,6),toon('#c5ceca').clone(),10.5,3.27,-5);
  (ceiling.material as import('three').Material).transparent=true;game.occluders.push(ceiling);solid(game,6,.15,6,10.5,3.27,-5);
  const rack=group(r,10,0,-5);part(rack,box(3,.12,1.2),toon('#a58b6d'),0,.9,0);
  for(const x of [-1.3,1.3])part(rack,cyl(.055,.055,.9,10),toon(DMETAL),x,.45,0);
  solid(game,3,1,1.2,10,.5,-5);signPlate(rack,'PROCESS MATERIALS',0,.72,.63,2.3,{bg:'#e7e6d7'});
  // Clear process lane remains open; the customer lane is separated by dispatch.
  for(const z of [-1.3,7.3])for(const x of [-5,5])part(r,box(2,.008,.06),toon('#c5a45c'),x,.018,z,false);
  pendant(game.root,2.5,2,{y:3.1,color:'#d2dbd0',cord:.3});pendant(game.root,-4,4.8,{y:3.1,light:false,cord:.3});pendant(game.root,4,4.8,{y:3.1,light:false,cord:.3});
  pointLamp(game.root,0,3,-1,{color:'#fff4df',intensity:5,distance:8});
  pointLamp(game.root,4,2.8,4.8,{color:'#c1e2e3',intensity:3,distance:5});
  return {};
}
