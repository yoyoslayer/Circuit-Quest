// Fabrication Bay set dressing: a calm assembly shop in lavender and periwinkle with pale wood
// floors, soldermask-green boards everywhere and a gantry-yellow pick-and-place. The layout bench
// sits mid-room; machines line the back wall; the stock shelf with the parts crate is by the side
// wall. No lamps hang over the bench so the bench camera sees the whole board.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,part,group,glow,canvasTex,reel,DMETAL,INK} from '../../render/kit';
import {hot} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';

const LAV='#d9d4f2',PERI='#8f96d8',MASK='#4c9f76',YEL='#ffc629',CREAM='#f4efe6';
/** A small green board with a chip on it (racks, desks, the crane's frame). */
function miniBoard(parent:T.Object3D,x:number,y:number,z:number,w=.5,d=.34,ry=0){const g=group(parent,x,y,z,ry);part(g,box(w,.025,d),toon(MASK));part(g,box(.1,.03,.1),toon('#34364d'),-w*.15,.02,0);
  for(const k of [0,1])part(g,box(.05,.028,.025),toon('#d8b88c'),w*.2,.02,-.06+k*.12);return g;}
function panelTex(title:string,draw:(c:CanvasRenderingContext2D)=>void){return canvasTex(256,340,c=>{c.fillStyle='#fffaf0';c.fillRect(0,0,256,340);c.fillStyle=INK;c.font='700 30px "Fredoka Variable", system-ui, sans-serif';c.textAlign='center';c.fillText(title,128,44);draw(c);});}
export function dressFabBay(game:Game,kit:RoomKit,table:T.Vector3){
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // Pale planks where people work; a soft lavender tile floor in the machine bay at the back.
  kit.floor(-W,W,-4.3,D,TX.woodPlanks('#e2c28f'),3.2);kit.floor(-W,W,-D,-4.3,TX.kitchenTiles('#ecebf7','#c9c6ee',8),4);
  kit.floor(table.x-2.9,table.x+3.6,table.z-1.5,table.z+2.5,TX.rugTex('#8f96d8','#e3e1fa'),2.2,.006);
  // Lavender walls with a periwinkle wainscot (drawn over the shell's own finish).
  for(const [wall,len] of [[kit.back,l.width],[kit.side,l.depth]] as const){
    part(wall,box(len,1.88,.02),toon('#ffffff',{map:TX.wallpaper(LAV)}),0,2.01,.15,false);part(wall,box(len,.9,.02),toon(PERI),0,.56,.16,false);part(wall,box(len,.06,.05),toon('#6f76c4'),0,1.04,.17,false);}
  kit.backWindows(x=>x<-3.2,.14);
  // Pick-and-place under a gantry-yellow crane, with its feeder bank of tape reels.
  const pnp=group(r,-6.4,0,-6.7);part(pnp,rbox(2.8,.9,1.7,.08),toon(CREAM),0,.45,0);part(pnp,box(2.82,.08,1.72),toon(PERI),0,.92,0);
  part(pnp,box(2.5,.04,1.2),toon(MASK),0,.98,0);for(let k=0;k<3;k++)miniBoard(pnp,-.8+k*.8,1.0,0,.6,.45);
  for(const x of [-1.3,1.3])part(pnp,rbox(.16,.9,1.5,.04),toon(YEL),x,1.4,0);part(pnp,rbox(2.76,.14,.2,.04),toon(YEL),0,1.9,0);part(pnp,rbox(.3,.36,.3,.05),toon('#fffaf0'),.3,1.72,.02);part(pnp,cyl(.03,.02,.2,10),toon(DMETAL),.3,1.44,.02);
  for(let k=0;k<7;k++){const f=reel(pnp,-1.2+k*.4,.62,.92,k%2?'#fffaf0':'#e9e6f5',k%3?PERI:YEL,.36);f.rotation.y=Math.PI/2;}
  const hood=part(game.root,rbox(2.7,.95,1.55,.08),toon('#cfe8f5',{opacity:.2}),-6.4,1.45,-6.7,false);hood.userData.noAO=true;
  solid(game,2.8,2,1.8,-6.4,1,-6.7);
  // Overhead crane: two yellow legs and a beam across the machine bay (well behind the bench).
  for(const x of [-9.4,-3.4]){part(r,rbox(.24,2.9,.24,.05),toon(YEL),x,1.45,-4.9);part(r,box(.4,.08,.4),toon(INK),x,.04,-4.9);solid(game,.3,2.9,.3,x,1.45,-4.9);}
  part(r,rbox(6.3,.26,.26,.05),toon(YEL),-6.4,2.95,-4.9);for(let k=0;k<12;k++)part(r,box(.2,.27,.02),toon(INK),-9.2+k*.5,2.95,-4.77,false);
  const trolley=group(r,-5.2,2.72,-4.9);part(trolley,rbox(.4,.22,.4,.05),toon('#3a3d55'));part(trolley,cyl(.012,.012,.7,6),toon(INK),0,-.45,0);part(trolley,box(.26,.05,.05),toon(DMETAL),0,-.82,0);
  // Reflow oven: a long periwinkle tunnel with glowing windows and a conveyor out each end.
  const oven=group(r,1.8,0,-6.9);part(oven,rbox(4.2,1.05,1.15,.08),toon(PERI),0,.53,0);part(oven,box(4.22,.1,1.17),toon('#6f76c4'),0,1.02,0);
  for(let k=0;k<4;k++)part(game.root,box(.7,.26,.02),hot(['#ffb35a','#ff9a4a','#ff7a3d','#ffb35a'][k],1.25),1.8-1.5+k*1,.62,-6.31,false);
  for(const x of [-2.55,2.55]){part(oven,box(.9,.06,.6),toon(DMETAL),x,.8,0);part(oven,box(.9,.04,.5),toon('#3a3d55'),x,.84,0);miniBoard(oven,x,.87,0,.5,.34);}
  part(oven,rbox(.5,.3,.08,.03),toon('#fffaf0'),1.4,1.2,.58);glow(game.root,'rgba(255,150,80,1)',2.8,.14).position.set(1.8,.9,-6.1);
  solid(game,6,1.1,1.2,1.8,.55,-6.9);
  // Inspection station: optical inspection box with a monitor showing a layout.
  const aoi=group(r,7.6,0,-6.8);part(aoi,rbox(1.5,1.3,1.1,.08),toon(CREAM),0,.65,0);part(aoi,rbox(1.3,.5,.9,.06),toon('#b9bfeb'),0,1.55,0);part(aoi,box(.9,.28,.02),toon('#cfe8f5',{opacity:.6}),0,1.52,.46);
  const mon=group(aoi,.4,1.9,.3);part(mon,box(.7,.45,.05),toon(INK));const scr=new T.Mesh(new T.PlaneGeometry(.64,.39),new T.MeshBasicMaterial({map:TX.screen('code')}));scr.position.z=.03;mon.add(scr);
  solid(game,1.5,1.9,1.1,7.6,.95,-6.8);
  // Stock shelf by the side wall: bins, reels, and the taped spot the parts crate waits on.
  const shelf=group(r,-10.25,0,2.2);for(const y of [.35,1.05,1.75])part(shelf,box(.9,.06,3.6),toon('#ecd3a6'),0,y,0);for(const z of [-1.75,1.75])for(const x of [-.4,.4])part(shelf,box(.06,1.9,.06),toon(PERI),x,.95,z);
  for(let k=0;k<6;k++){const z=-1.4+k*.56;part(shelf,rbox(.6,.34,.44,.05),toon([PERI,YEL,'#b9bfeb',MASK,'#f5c4c4','#c8f0dc'][k]),0,1.25,z);part(shelf,box(.3,.12,.02),toon('#fffaf0'),.31,1.27,z,false);}
  for(let k=0;k<4;k++){const f=reel(shelf,0,.62,-1.2+k*.8,'#fffaf0',k%2?PERI:YEL,.5);f.rotation.y=Math.PI/2;}
  for(let k=0;k<5;k++)miniBoard(shelf,0,1.8,-1.2+k*.6,.45,.3,Math.PI/2);solid(game,.9,1.9,3.6,-10.25,.95,2.2);
  const tape=toon(YEL);for(const [w,d,dx,dz] of [[1.1,.07,0,-.55],[1.1,.07,0,.55],[.07,1.1,-.55,0],[.07,1.1,.55,0]] as const)part(r,box(w,.01,d),tape,-8.8+dx,.008,2.2+dz,false);
  const stock=canvasTex(256,96,c=>{c.fillStyle=YEL;c.beginPath();c.roundRect(4,4,248,88,22);c.fill();c.lineWidth=6;c.strokeStyle=INK;c.stroke();c.fillStyle=INK;c.font='700 50px "Fredoka Variable", system-ui, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('STOCK',128,50);});
  const sign=part(kit.side,new T.PlaneGeometry(1.1,.41),new T.MeshBasicMaterial({map:stock}),-2.2,2.45,.2,false);sign.userData.noAO=true;
  // Posters: a QFN footprint with its pin 1 dot, a decoupling loop, and the usual office art.
  const qfnPoster=panelTex('QFN',c=>{c.fillStyle=MASK;c.fillRect(38,70,180,180);c.fillStyle='#e9c46a';for(let i=0;i<3;i++){for(const [x,y] of [[48,110+i*40],[188,110+i*40],[88+i*40,80],[88+i*40,220]])c.fillRect(x,y,20,20);}
    c.fillRect(98,120,60,60);c.fillStyle=INK;c.beginPath();c.arc(58,84,7,0,7);c.fill();c.font='600 22px system-ui';c.fillText('pin 1 · exposed pad',128,290);});
  const loopPoster=panelTex('SHORT LOOP',c=>{c.lineWidth=10;c.strokeStyle='#e5484d';c.beginPath();c.moveTo(60,120);c.lineTo(150,120);c.stroke();c.strokeStyle='#3f7fd6';c.beginPath();c.moveTo(60,190);c.lineTo(150,190);c.stroke();
    c.fillStyle='#34364d';c.fillRect(150,95,70,120);c.fillStyle='#d8b88c';c.fillRect(48,112,24,86);c.font='600 22px system-ui';c.fillStyle=INK;c.fillText('cap beside the pins',128,262);c.fillText('(not across the board)',128,292);});
  for(const [tex,x] of [[qfnPoster,-5.2],[loopPoster,-3.9]] as const){const g=group(kit.side,x,1.95,.16);part(g,box(.8,1.06,.04),toon(INK));const f=new T.Mesh(new T.PlaneGeometry(.72,.96),toon('#ffffff',{map:tex}));f.position.z=.025;g.add(f);}
  wallArt(kit.side,'graph',4.4,1.9,.16);wallArt(kit.back,'bolt',9.6,1.95,.18,0,.8);
  // Work desks at the front right with layout screens; a board rack beside them.
  for(const [x,z] of [[6.6,3.9],[8.4,3.9]]){const d=group(r,x,0,z);part(d,box(1.6,.06,.8),toon('#ecd3a6'),0,.76,0);for(const [dx,dz] of [[-.72,-.32],[.72,-.32],[-.72,.32],[.72,.32]])part(d,box(.06,.74,.06),toon(PERI),dx,.37,dz);
    const m=group(d,0,1.04,-.22);part(m,box(.62,.4,.04),toon(INK));const s=new T.Mesh(new T.PlaneGeometry(.56,.34),new T.MeshBasicMaterial({map:TX.screen(x<7?'code':'chart')}));s.position.z=.025;m.add(s);part(d,box(.06,.25,.06),toon(INK),0,.9,-.22);
    miniBoard(d,.45,.8,.15,.35,.25);solid(game,1.6,.8,.8,x,.4,z);}
  const rack=group(r,9.9,0,.2);part(rack,box(.8,1.5,1.6),toon(CREAM),0,.75,0);for(let k=0;k<7;k++)part(rack,box(.6,.03,1.4),toon(k%2?MASK:'#5aae84'),.04,.2+k*.19,0);solid(game,.8,1.5,1.6,9.9,.75,.2);
  // Light: pendants over the machine bay only; the bench gets a soft lamp from the front.
  pendant(game.root,-6.4,-5.4,{y:2.7,color:YEL});pendant(game.root,1.8,-5.5,{y:2.7,color:PERI,light:false});pendant(game.root,7.6,-5.4,{y:2.7,color:YEL,light:false});
  pointLamp(game.root,table.x,2.7,table.z+1.2,{color:'#fff1e0',intensity:5,distance:5.5});lampPool(game.root,table.x,table.z+.6,2.4,.16);
  pointLamp(game.root,1.8,1.6,-5.8,{color:'#ffb070',intensity:3,distance:5});
  rug(r,7.5,5.4,4.4,2.2,PERI,'#e3e1fa');
  return {};
}
