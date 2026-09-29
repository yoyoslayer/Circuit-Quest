// Via Foundry set dressing: a bright fab shop in teal and copper. Machines line the back wall
// (drills, plating line, lamination press, inspection scope); board racks and the blanks shelf
// sit by the entrance; the customer lane runs behind the counter window.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,DMETAL,TRIM,INK} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';

const COPPER='#e98a42',TEAL='#3fb6a8',BOARD='#3f9a62';
export function dressViaFoundry(game:Game,kit:RoomKit){
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // Warm planks where Pip works, a clean teal-grey fab floor behind the counter.
  kit.floor(-W,W,-2.45,D,TX.woodPlanks('#d8a86a'),3.2);kit.floor(-W,W,-D,-2.45,TX.kitchenTiles('#e7ece6','#9fd3c9',8),4);
  kit.floor(-1.2,6.6,-4.9,-3.1,TX.rugTex('#3fb6a8','#bff0e6'),2,.006);
  kit.backWindows(x=>Math.abs(x)<4,.14);
  wallArt(kit.side,'graph',-4,1.9,.16);wallArt(kit.side,'bolt',2,1.9,.16);wallArt(kit.back,'mountain',-9.4,1.95,.18,0,.8);
  // Half-height partitions carry the counter line to either side, leaving gaps at the ends.
  kit.interiorWall({id:'lane-w',minX:-7,maxX:-2.3,minZ:-2.62,maxZ:-2.28},'#d9efe9','#3fb6a8',1.1);
  kit.interiorWall({id:'lane-e',minX:2.3,maxX:7.4,minZ:-2.62,maxZ:-2.28},'#d9efe9','#3fb6a8',1.1);
  // Back wall machines: two drill presses, a plating line with bubbling tanks, a lamination press.
  for(const x of [-9,-7.2]){const m=group(r,x,0,-7.1);part(m,rbox(1.3,.9,1,.06),toon('#3a3d55'),0,.45,0);part(m,box(.18,1.6,.18),toon(DMETAL),-.35,1.7,-.3);
    part(m,rbox(.7,.45,.6,.06),toon('#ffc629'),0,2.1,0);part(m,cyl(.03,.01,.3,10),toon('#dfe3ea'),0,1.72,0);part(m,box(1,.04,.8),toon(BOARD),0,.92,0);
    part(m,box(.4,.3,.05),toon('#bfeaf5'),.3,2.1,.31);solid(game,1.3,2.4,1,x,1.2,-7.1);}
  const line=group(r,5.4,0,-7.2);for(let k=0;k<4;k++){const x=-1.8+k*1.2;part(line,rbox(1,.9,1,.05),toon(k%2?'#5b9cf0':TEAL,{opacity:.85}),x,.45,0);part(line,box(1.02,.06,1.02),toon(DMETAL),x,.92,0);
    for(let b=0;b<3;b++)part(game.root,sphere(.05,10,8),toon('#dff6ff',{opacity:.7}),5.4+x-.2+b*.2,.95,-7.2+(b-1)*.15,false);}
  part(line,box(5.2,.08,.08),toon(DMETAL),0,1.8,-.3);for(let k=0;k<5;k++)part(line,box(.05,.8,.5),toon(BOARD),-2+k,1.3,-.3);solid(game,5,1,1,5.4,.5,-7.2);
  const press=group(r,9.4,0,-6.8);part(press,rbox(1.4,.5,1.2,.06),toon('#3f7fd6'),0,.25,0);part(press,rbox(1.4,.4,1.2,.06),toon('#3f7fd6'),0,1.9,0);
  for(const [x,z] of [[-.55,-.45],[.55,-.45],[-.55,.45],[.55,.45]])part(press,cyl(.07,.07,1.4,12),toon(DMETAL),x,1.1,z);part(press,box(1.1,.08,.9),toon(BOARD),0,.55,0);
  part(press,rbox(.45,.3,.1,.04),toon('#fffaf0'),0,1.9,.62);solid(game,1.4,2.2,1.2,9.4,1.1,-6.8);
  // Inspection scope on a stand and a big cutaway poster of a via.
  const scope=group(r,-4.6,0,-7.2);part(scope,rbox(.9,.9,.8,.05),toon('#f4efe6'),0,.45,0);part(scope,cyl(.08,.08,.7,14),toon(INK),0,1.25,0);part(scope,cyl(.13,.1,.3,14),toon('#dfe3ea'),0,1.7,.1);solid(game,.9,1,.8,-4.6,.5,-7.2);
  // Entrance side: board rack and the blanks shelf the crate starts on.
  const rack=group(r,-8.1,0,4.6);part(rack,box(2.4,.08,1.1),toon(TRIM),0,.5,0);part(rack,box(2.4,.08,1.1),toon(TRIM),0,1.5,0);for(const x of [-1.15,1.15])for(const z of [-.5,.5])part(rack,box(.08,1.6,.08),toon(DMETAL),x,.8,z);
  for(let k=0;k<7;k++)part(rack,box(.06,.4,.9),toon(k%3?BOARD:'#2f7fbf'),-1+k*.3,1.75,0);solid(game,2.4,1.8,1.1,-8.1,.9,4.6);
  // Copper coil spools and a cutaway poster near the counter.
  for(const [x,z] of [[8.6,4.2],[9.2,4.9]]){const s=group(r,x,.35,z);for(const d of [-.2,.2])part(s,cyl(.35,.35,.05,24,'z'),toon(DMETAL),0,0,d);part(s,cyl(.26,.26,.36,24,'z'),glossyToon(COPPER,{spec:.8,size:.97}));solid(game,.8,.7,.6,x,.35,z);}
  // Lamps hang over the customer lane, clear of the counter view; a soft light over the worktop.
  pendant(game.root,-1.6,-4.2,{y:2.7,color:TEAL});pendant(game.root,2.4,-4.2,{y:2.7,color:TEAL,light:false});pendant(game.root,5.4,-4.2,{y:2.7,color:TEAL,light:false});
  pointLamp(game.root,0,2.6,-1.8,{color:'#fff1d6',intensity:5,distance:5});lampPool(game.root,0,-2.2,2.6,.2);pointLamp(game.root,5.4,2.2,-6.4,{color:'#9ff3ea',intensity:4,distance:6});glow(game.root,'rgba(120,255,220,1)',2.6,.12).position.set(5.4,1.2,-6.5);
  rug(r,-3,3.4,3.2,2.2,'#3fb6a8','#bff0e6');
  // Hot "OPEN" lamp over the window.
  part(game.root,box(.6,.18,.05),hot('#ff8a5c',1.6),3.2,2.55,-2.95,false);
  return {};
}
