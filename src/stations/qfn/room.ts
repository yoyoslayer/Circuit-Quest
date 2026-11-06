// Fabrication Bay set dressing: a calm assembly shop in lavender and periwinkle with pale wood
// floors, soldermask-green boards everywhere and a gantry-yellow pick-and-place. The layout bench
// sits mid-room; machines line the back wall; the stock shelf with the parts crate is by the side
// wall. No lamps hang over the bench so the bench camera sees the whole board.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,part,group,glow,canvasTex,reel,stripes,repeat,DMETAL,INK,plaqueBoard} from '../../render/kit';
import {hot} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';

// CRANE: safety orange for the gantries, so job yellow stays on the job (DR-45, R5-101).
const LAV='#d9d4f2',PERI='#8f96d8',MASK='#4c9f76',YEL='#ffc629',CREAM='#f4efe6',CRANE='#e5733a';
/** A small green board with a chip on it (racks, desks, the crane's frame). */
function miniBoard(parent:T.Object3D,x:number,y:number,z:number,w=.5,d=.34,ry=0){const g=group(parent,x,y,z,ry);part(g,box(w,.025,d),toon(MASK));part(g,box(.1,.03,.1),toon('#34364d'),-w*.15,.02,0);
  for(const k of [0,1])part(g,box(.05,.028,.025),toon('#d8b88c'),w*.2,.02,-.06+k*.12);return g;}
/** An ESD workbench: green mat top, a soldering station with its iron in a holder, a fume extractor on
 *  a bent arm and a magnifier lamp (local +z is the side people work from). */
function esdBench(game:Game,parent:T.Object3D,x:number,z:number,ry=0){
  const g=group(parent,x,0,z,ry);part(g,rbox(1.4,.06,.7,.02),toon('#d9d4f2'),0,.76,0);part(g,box(1.36,.012,.62),toon('#3f9a6a'),0,.795,0);
  for(const [dx,dz] of [[-.64,-.28],[.64,-.28],[-.64,.28],[.64,.28]])part(g,box(.06,.74,.06),toon(PERI),dx,.37,dz);part(g,box(1.3,.04,.04),toon(PERI),0,.2,-.28);
  // Soldering station: ink box with a dial, the iron resting in its holder coil.
  part(g,rbox(.24,.12,.18,.03),toon('#3a3d55'),-.42,.86,-.12);part(g,cyl(.035,.035,.02,14,'z'),toon(YEL),-.42,.87,-.02);
  const holder=group(g,-.18,.8,-.14);part(holder,cyl(.05,.06,.03,14),toon(INK),0,.015,0);const coil=part(holder,cyl(.03,.03,.16,12),toon(DMETAL),0,.1,0);coil.rotation.z=.7;
  const iron=part(holder,cyl(.014,.01,.24,10),toon('#e5484d'),.05,.16,0);iron.rotation.z=.7;
  // Fume extractor: a rounded box on a jointed arm reaching over the mat.
  part(g,rbox(.22,.24,.16,.05),toon(CREAM),.48,.92,-.22);const arm=part(g,cyl(.022,.022,.36,10),toon(DMETAL),.36,1.12,-.16);arm.rotation.z=1.0;part(g,cyl(.07,.05,.06,16),toon(CREAM),.2,1.2,-.1);
  // Magnifier lamp: ring and lens on a stalk.
  part(g,cyl(.018,.018,.5,10),toon(DMETAL),.6,1.04,.2);const ring=part(g,new T.TorusGeometry(.09,.018,8,24),toon(CREAM),.5,1.28,.16);ring.rotation.x=1.2;
  const lens=part(g,cyl(.08,.08,.006,20),toon('#cfe8f5',{opacity:.5}),.5,1.28,.16,false);lens.rotation.x=1.2-Math.PI/2;
  miniBoard(g,0,.81,.12,.36,.24);solid(game,1.4,.8,.7,x,.4,z);
  return g;}
/** A stand of SMT tape reels on a spindle, ready for the pick-and-place feeders. */
function reelTower(game:Game,parent:T.Object3D,x:number,z:number){
  const g=group(parent,x,0,z);part(g,cyl(.3,.32,.06,20),toon(DMETAL),0,.03,0);part(g,cyl(.03,.03,1.4,10),toon(DMETAL),0,.73,0);
  for(let k=0;k<6;k++){const r=reel(g,0,.22+k*.21,0,'#fffaf0',[PERI,YEL,MASK][k%3],.34);r.rotation.x=Math.PI/2;}
  solid(game,.6,1.4,.6,x,.7,z);return g;}
/** A small-parts cabinet: rows of tiny pastel drawers with dark pulls. */
function drawers(game:Game,parent:T.Object3D,x:number,z:number,ry=0){
  const g=group(parent,x,0,z,ry);part(g,rbox(.6,.9,.35,.03),toon('#9aa3dc'),0,.45,0);
  const cols=['#ffffff','#f5c4c4','#c8f0dc','#e3e1fa'];for(let r=0;r<6;r++)for(let c=0;c<4;c++){part(g,box(.12,.12,.02),toon(cols[(r+c)%4]),-.21+c*.14,.1+r*.14,.18,false);part(g,box(.04,.012,.012),toon(INK),-.21+c*.14,.08+r*.14,.195,false);}
  solid(game,.6,.9,.35,x,.45,z);return g;}
/** Stencil printer: the head of the SMT line. A cream cabinet with a window onto the stencil frame
 *  and its squeegee, a small screen, and a link conveyor carrying boards on to the pick-and-place. */
function stencilPrinter(game:Game,parent:T.Object3D,x:number,z:number,linkTo:number){
  const g=group(parent,x,0,z);part(g,rbox(2.0,1.0,1.3,.08),toon(CREAM),0,.5,0);part(g,box(2.02,.08,1.32),toon(PERI),0,1.02,0);
  part(g,rbox(1.9,.5,1.2,.06),toon('#b9bfeb'),0,1.31,0);part(g,box(1.3,.3,.02),toon('#cfe8f5',{opacity:.6}),0,1.3,.61,false);
  // Behind the window: the steel stencil in its frame and the squeegee bar across it.
  part(g,box(1.2,.03,.9),toon('#c7ccd6'),0,1.12,0);part(g,box(1.0,.012,.7),toon('#9aa3b2'),0,1.14,0);part(g,rbox(1.1,.08,.1,.03),toon(CRANE),0,1.26,.15);
  const mon=group(g,.72,1.75,.4);part(mon,box(.5,.34,.04),toon(INK));const s=new T.Mesh(new T.PlaneGeometry(.45,.29),new T.MeshBasicMaterial({map:TX.screen('chart')}));s.position.z=.025;mon.add(s);part(g,cyl(.02,.02,.2,8),toon(INK),.72,1.6,.4);
  // Paste jars on the ledge, and the link conveyor to the next machine.
  for(const k of [0,1,2])part(g,cyl(.06,.06,.1,12),toon(k===1?'#9aa3b2':'#c7ccd6'),-.7+k*.16,1.11,.5);
  solid(game,2.0,1.6,1.3,x,.8,z);
  const x0=x+1.0,len=linkTo-x0;if(len>.2){const c=group(parent,x0+len/2,0,z);part(c,box(len,.08,.5),toon(DMETAL),0,.82,0);part(c,box(len,.03,.4),toon('#3a3d55'),0,.87,0);
    for(const dx of [-len/2+.15,len/2-.15])for(const dz of [-.2,.2])part(c,box(.05,.8,.05),toon(PERI),dx,.4,dz);miniBoard(c,0,.9,0,.45,.3);solid(game,len,.9,.5,x0+len/2,.45,z);}
  return g;}
/** Dry cabinet: moisture-sensitive chips (QFNs among them) wait in here between builds. A tall
 *  periwinkle cabinet with glass doors, trays of reels inside and a green humidity readout. */
function dryCabinet(game:Game,parent:T.Object3D,x:number,z:number,ry=0){
  const g=group(parent,x,0,z,ry);part(g,rbox(1.0,1.8,.6,.04),toon('#6f76c4'),0,.9,0);
  for(const dx of [-.24,.24])part(g,box(.44,1.5,.02),toon('#cfe8f5',{opacity:.45}),dx,.92,.31,false);part(g,box(.02,1.5,.03),toon(INK),0,.92,.31);
  for(let k=0;k<4;k++){const y=.32+k*.36;part(g,box(.9,.025,.5),toon('#e9e6f5'),0,y,0,false);for(const [i,dx] of [-.28,0,.28].entries())reel(g,dx,y+.14,0,'#fffaf0',[PERI,MASK,CREAM][(k+i)%3],.3);}
  const lcd=canvasTex(128,64,c=>{c.fillStyle='#1d2a24';c.fillRect(0,0,128,64);c.fillStyle='#6cf0a0';c.font='700 34px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText('3%',64,34);});
  const d=new T.Mesh(new T.PlaneGeometry(.22,.11),new T.MeshBasicMaterial({map:lcd}));d.position.set(.3,1.72,.305);g.add(d);
  solid(game,ry?.6:1.0,1.8,ry?1.0:.6,x,.9,z);return g;}
/** Packing table at the end of the line: shipped boards go out in kraft cartons with bubble wrap,
 *  and a pallet of sealed cartons waits beside it. */
function packingTable(game:Game,parent:T.Object3D,x:number,z:number){
  const g=group(parent,x,0,z);part(g,box(2.2,.06,.9),toon('#ecd3a6'),0,.8,0);for(const [dx,dz] of [[-1.02,-.37],[1.02,-.37],[-1.02,.37],[1.02,.37]])part(g,box(.06,.78,.06),toon(PERI),dx,.39,dz);
  part(g,box(2.0,.04,.04),toon(PERI),0,.22,-.37);
  // An open carton with a board going in, a sealed one, the tape gun and a bubble-wrap roll.
  const kraft='#d7a56d';part(g,box(.5,.3,.4),toon(kraft),-.6,.98,0);part(g,box(.46,.02,.36),toon('#3a3d55'),-.6,1.12,0,false);miniBoard(g,-.6,1.14,0,.36,.24);
  for(const s of [-1,1]){const flap=part(g,box(.5,.01,.2),toon('#c98f5a'),-.6,1.14,s*.3);flap.rotation.x=s*.6;}
  part(g,box(.5,.3,.4),toon('#c98f5a'),.05,.98,-.1);part(g,box(.52,.04,.06),toon('#e9e6f5'),.05,1.14,-.1,false);
  part(g,rbox(.22,.14,.08,.03),toon(CRANE),.45,.9,.25);const roll=part(g,cyl(.18,.18,.8,18,'x'),toon('#eef3fb',{opacity:.85}),.6,1.0,-.15);roll.userData.noAO=true;
  solid(game,2.2,1.2,.9,x,.6,z);
  // The pallet: slatted deck on runners with a shrink-wrapped stack of cartons.
  const p=group(parent,x+.6,0,z+1.55);part(p,box(1.2,.04,1.0),toon('#c8a06a'),0,.13,0);for(const dz of [-.42,0,.42])part(p,box(1.2,.09,.12),toon('#a87d4a'),0,.05,dz);
  for(const [dx,dz,y] of [[-.28,-.24,.36],[.28,-.24,.36],[-.28,.24,.36],[.28,.24,.36],[-.28,0,.82],[.28,0,.82]] as const)part(p,box(.54,.44,.46),toon(dx<0?kraft:'#c98f5a'),dx,y,dz);
  part(p,box(1.16,.9,.96),toon('#eef3fb',{opacity:.22}),0,.6,0,false);solid(game,1.2,1.1,1.0,x+.6,.55,z+1.55);
  return g;}
function panelTex(title:string,draw:(c:CanvasRenderingContext2D)=>void){return canvasTex(256,340,c=>{c.fillStyle='#fffaf0';c.fillRect(0,0,256,340);c.fillStyle=INK;c.font='700 30px "Fredoka Variable", system-ui, sans-serif';c.textAlign='center';c.fillText(title,128,44);draw(c);});}
export function dressFabBay(game:Game,kit:RoomKit,table:T.Vector3){
  // BAY: where the machine bay's tiles and hazard tape start, a fixed depth in front of the back wall.
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2,BAY=-D+3.7;
  // Pale planks where people work; a soft lavender tile floor in the machine bay at the back.
  kit.floor(-W,W,BAY,D,TX.woodPlanks('#c8a06a'),3.2);kit.floor(-W,W,-D,BAY,TX.kitchenTiles('#d9d6ee','#b3afe0',8),4);
  kit.floor(table.x-2.9,table.x+3.6,table.z-1.5,table.z+2.5,TX.rugTex('#7a82cc','#cfcdf2'),2.2,.006);
  // Lavender walls with a periwinkle wainscot (drawn over the shell's own finish).
  for(const [wall,len] of [[kit.back,l.width],[kit.side,l.depth]] as const){
    part(wall,box(len,1.88,.02),toon('#ffffff',{map:TX.wallpaper(LAV)}),0,2.01,.15,false);part(wall,box(len,.9,.02),toon(PERI),0,.56,.16,false);part(wall,box(len,.06,.05),toon('#6f76c4'),0,1.04,.17,false);}
  kit.backWindows(x=>x<-3.2,.14);
  // Pick-and-place under a safety-orange gantry, with its feeder bank of tape reels.
  const pnp=group(r,-6.4,0,-8.7);part(pnp,rbox(2.8,.9,1.7,.08),toon(CREAM),0,.45,0);part(pnp,box(2.82,.08,1.72),toon(PERI),0,.92,0);
  part(pnp,box(2.5,.04,1.2),toon(MASK),0,.98,0);for(let k=0;k<3;k++)miniBoard(pnp,-.8+k*.8,1.0,0,.6,.45);
  for(const x of [-1.3,1.3])part(pnp,rbox(.16,.9,1.5,.04),toon(CRANE),x,1.4,0);part(pnp,rbox(2.76,.14,.2,.04),toon(CRANE),0,1.9,0);part(pnp,rbox(.3,.36,.3,.05),toon('#fffaf0'),.3,1.72,.02);part(pnp,cyl(.03,.02,.2,10),toon(DMETAL),.3,1.44,.02);
  // Feeder bank along the front, with the tape reels seated in its slots.
  part(pnp,rbox(2.6,.35,.25,.03),toon(DMETAL),0,.55,.95);for(let k=0;k<8;k++)part(pnp,box(.02,.3,.25),toon(INK),-1.2+k*.343,.6,.96,false);
  for(let k=0;k<7;k++){const f=reel(pnp,-1.03+k*.343,.66,1.02,k%2?'#fffaf0':'#e9e6f5',k%3?PERI:YEL,.3);f.rotation.y=Math.PI/2;}
  // The glass hood clears the gantry: it spans the posts and stands on the machine's top.
  const hood=part(game.root,rbox(2.9,1.0,1.6,.08),toon('#cfe8f5',{opacity:.2}),-6.4,1.505,-8.7,false);hood.userData.noAO=true;
  for(const [dx,dz] of [[-1.42,-.77],[1.42,-.77],[-1.42,.77],[1.42,.77]])part(r,rbox(.05,1.0,.05,.02),toon(INK),-6.4+dx,1.505,-8.7+dz);
  solid(game,2.8,2,1.8,-6.4,1,-8.7);
  // Overhead crane: two orange legs and a beam across the machine bay (well behind the bench).
  for(const x of [-9.4,-3.4]){part(r,rbox(.24,2.9,.24,.05),toon(CRANE),x,1.45,-6.9);part(r,box(.4,.08,.4),toon(INK),x,.04,-6.9);solid(game,.3,2.9,.3,x,1.45,-6.9);}
  // The beam wears its hazard stripes all the way round (one sleeve), with caps over the legs and a rail under it.
  part(r,box(6.3,.26,.26),toon('#ffffff',{map:repeat(stripes(CRANE,INK),24,1)}),-6.4,2.95,-6.9);for(const x of [-9.4,-3.4])part(r,rbox(.3,.3,.3,.05),toon(CRANE),x,2.95,-6.9);
  part(r,box(5.9,.04,.08),toon(DMETAL),-6.4,2.8,-6.9);
  const trolley=group(r,-5.2,2.72,-6.9);part(trolley,rbox(.4,.22,.4,.05),toon('#3a3d55'));part(trolley,cyl(.012,.012,.7,6),toon(INK),0,-.45,0);part(trolley,box(.26,.05,.05),toon(DMETAL),0,-.82,0);
  // Reflow oven: a long periwinkle tunnel with glowing windows and a conveyor out each end.
  const oven=group(r,1.8,0,-8.9);part(oven,rbox(4.2,1.05,1.15,.08),toon(PERI),0,.53,0);part(oven,box(4.22,.1,1.17),toon('#6f76c4'),0,1.02,0);
  for(let k=0;k<4;k++)part(game.root,box(.7,.26,.02),hot(['#ffb35a','#ff9a4a','#ff7a3d','#ffb35a'][k],1.25),1.8-1.5+k*1,.62,-8.31,false);
  for(const x of [-2.55,2.55]){part(oven,box(.9,.06,.6),toon(DMETAL),x,.8,0);part(oven,box(.9,.04,.5),toon('#3a3d55'),x,.84,0);miniBoard(oven,x,.87,0,.5,.34);}
  part(oven,rbox(.5,.3,.08,.03),toon('#fffaf0'),1.4,1.2,.58);glow(game.root,'rgba(255,150,80,1)',2.8,.14).position.set(1.8,.9,-8.1);
  solid(game,6,1.1,1.2,1.8,.55,-8.9);
  // Inspection station: optical inspection box with a monitor showing a layout.
  const aoi=group(r,7.6,0,-8.8);part(aoi,rbox(1.5,1.3,1.1,.08),toon(CREAM),0,.65,0);part(aoi,rbox(1.3,.5,.9,.06),toon('#b9bfeb'),0,1.55,0);part(aoi,box(.9,.28,.02),toon('#cfe8f5',{opacity:.6}),0,1.52,.46);
  part(aoi,box(.2,.02,.15),toon(INK),.4,1.81,.3);part(aoi,cyl(.025,.025,.3,10),toon(INK),.4,1.95,.3);
  const mon=group(aoi,.4,2.2,.3);part(mon,box(.7,.45,.05),toon(INK));const scr=new T.Mesh(new T.PlaneGeometry(.64,.39),new T.MeshBasicMaterial({map:TX.screen('code')}));scr.position.z=.03;mon.add(scr);
  solid(game,1.5,1.9,1.1,7.6,.95,-8.8);
  // Stock shelf by the side wall: bins, reels, and the taped spot the parts crate waits on.
  const shelf=group(r,-14.25,0,2.2);for(const y of [.35,1.05,1.75])part(shelf,box(.9,.06,3.6),toon('#ecd3a6'),0,y,0);for(const z of [-1.75,1.75])for(const x of [-.4,.4])part(shelf,box(.06,1.9,.06),toon(PERI),x,.95,z);
  for(let k=0;k<6;k++){const z=-1.4+k*.56;part(shelf,rbox(.6,.34,.44,.05),toon([PERI,'#e9e6f5','#b9bfeb',MASK,'#f5c4c4','#c8f0dc'][k]),0,1.25,z);part(shelf,box(.3,.12,.02),toon('#fffaf0'),.31,1.27,z,false);}
  for(let k=0;k<4;k++){const f=reel(shelf,0,.59,-1.2+k*.8,'#fffaf0',k%2?PERI:YEL,.5);f.rotation.y=Math.PI/2;}
  for(let k=0;k<5;k++)miniBoard(shelf,0,1.8,-1.2+k*.6,.45,.3,Math.PI/2);solid(game,.9,1.9,3.6,-14.25,.95,2.2);
  const tape=toon(YEL);for(const [w,d,dx,dz] of [[1.1,.07,0,-.55],[1.1,.07,0,.55],[.07,1.1,-.55,0],[.07,1.1,.55,0]] as const)part(r,box(w,.01,d),tape,-12.8+dx,.008,2.2+dz,false);
  const stock=canvasTex(256,96,c=>{c.fillStyle=YEL;c.beginPath();c.roundRect(4,4,248,88,22);c.fill();c.lineWidth=6;c.strokeStyle=INK;c.stroke();c.fillStyle=INK;c.font='700 50px "Fredoka Variable", system-ui, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('STOCK',128,50);});
  plaqueBoard(kit.side,stock,1.1,.41,-2.2,2.45,.175,{back:false,depth:.03});
  // Posters: a QFN footprint with its pin 1 dot, a decoupling loop, and the usual office art.
  const qfnPoster=panelTex('QFN',c=>{c.fillStyle=MASK;c.fillRect(38,70,180,180);c.fillStyle='#e9c46a';for(let i=0;i<3;i++){for(const [x,y] of [[48,110+i*40],[188,110+i*40],[88+i*40,80],[88+i*40,220]])c.fillRect(x,y,20,20);}
    c.fillRect(98,120,60,60);c.fillStyle=INK;c.beginPath();c.arc(58,84,7,0,7);c.fill();c.font='600 22px system-ui';c.fillText('pin 1 · exposed pad',128,290);});
  // Two chips, two caps: the one with the small loop smiles, the one with the big loop doesn't.
  const face=(c:CanvasRenderingContext2D,x:number,y:number,happy:boolean)=>{c.fillStyle='#34364d';c.fillRect(x-30,y-30,60,60);c.fillStyle='#fffaf0';c.beginPath();c.arc(x-11,y-8,5,0,7);c.arc(x+11,y-8,5,0,7);c.fill();
    c.strokeStyle='#fffaf0';c.lineWidth=5;c.beginPath();if(happy)c.arc(x,y+2,13,.2,Math.PI-.2);else c.arc(x,y+22,13,Math.PI+.3,-.3);c.stroke();};
  const loopPoster=panelTex('LOOPS',c=>{c.lineWidth=8;c.strokeStyle='#e5484d';c.beginPath();c.moveTo(150,96);c.lineTo(112,96);c.stroke();c.strokeStyle='#3f7fd6';c.beginPath();c.moveTo(150,124);c.lineTo(112,124);c.stroke();
    c.fillStyle='#d8b88c';c.fillRect(98,88,20,44);face(c,180,110,true);
    c.strokeStyle='#e5484d';c.beginPath();c.moveTo(150,218);c.lineTo(40,218);c.lineTo(40,290);c.stroke();c.strokeStyle='#3f7fd6';c.beginPath();c.moveTo(150,246);c.lineTo(70,246);c.lineTo(70,290);c.stroke();
    c.fillStyle='#d8b88c';c.fillRect(32,282,46,20);face(c,180,232,false);});
  for(const [tex,x] of [[qfnPoster,-5.2],[loopPoster,-3.9]] as const){const g=group(kit.side,x,1.95,.16);part(g,box(.8,1.06,.04),toon(INK));const f=new T.Mesh(new T.PlaneGeometry(.72,.96),toon('#ffffff',{map:tex}));f.position.z=.025;g.add(f);}
  wallArt(kit.side,'graph',4.4,1.9,.16);wallArt(kit.back,'bolt',9.6,1.95,.18,0,.8);
  // Work desks at the front right with layout screens; a board rack beside them.
  for(const [x,z] of [[9.6,5.9],[11.4,5.9]]){const d=group(r,x,0,z);part(d,box(1.6,.06,.8),toon('#ecd3a6'),0,.76,0);for(const [dx,dz] of [[-.72,-.32],[.72,-.32],[-.72,.32],[.72,.32]])part(d,box(.06,.74,.06),toon(PERI),dx,.37,dz);
    const m=group(d,0,1.04,-.22);part(m,box(.62,.4,.04),toon(INK));const s=new T.Mesh(new T.PlaneGeometry(.56,.34),new T.MeshBasicMaterial({map:TX.screen(x<10?'code':'chart')}));s.position.z=.025;m.add(s);part(d,box(.06,.25,.06),toon(INK),0,.9,-.22);
    miniBoard(d,.45,.8,.15,.35,.25);solid(game,1.6,.8,.8,x,.4,z);}
  // Board rack: an open frame facing the room, boards slid in on rails with their front edges showing.
  const rack=group(r,13.9,0,.2);for(const z of [-.78,.78])part(rack,rbox(.8,1.5,.05,.02),toon(CREAM),0,.75,z);part(rack,rbox(.05,1.5,1.6,.02),toon(CREAM),.38,.75,0);
  part(rack,rbox(.8,.05,1.6,.02),toon(CREAM),0,1.48,0);part(rack,box(.8,.08,1.6),toon(PERI),0,.04,0);
  for(let k=0;k<7;k++){const y=.2+k*.19;for(const z of [-.72,.72])part(rack,box(.6,.02,.02),toon(INK),0,y-.02,z);part(rack,box(.6,.025,1.4),toon(k%2?MASK:'#5aae84'),-.12,y,0);if(k%2===0)part(rack,box(.01,.04,.1),toon('#fffaf0'),-.42,y+.02,.4);}
  solid(game,.8,1.5,1.6,13.9,.75,.2);
  // The fab kit around the bay: ESD benches with soldering stations, reel towers, small-parts drawers,
  // and hazard tape where the machine bay starts.
  esdBench(game,r,-4.3,-5.35,Math.PI);esdBench(game,r,7.2,-5.9,Math.PI);
  reelTower(game,r,-1.7,-6.75);reelTower(game,r,11.2,-6.6);
  drawers(game,r,14.6,3.0,-Math.PI/2);drawers(game,r,-14.6,-2.6,Math.PI/2);
  // The rest of the line in the bigger bay: a stencil printer feeding the pick-and-place, the packing
  // table past the inspection box, and the dry cabinet for moisture-sensitive chips on the left wall.
  stencilPrinter(game,r,-11.6,-8.7,-7.8);packingTable(game,r,12.6,-8.9);dryCabinet(game,r,-14.45,-5.6,Math.PI/2);
  // Rework island at the front left: two pairs of ESD benches back to back (their magnifiers light them).
  for(const x of [-6.8,-5.2]){esdBench(game,r,x,6.05,Math.PI);esdBench(game,r,x,6.75);}
  const tapeLine=part(r,box(l.width-.4,.008,.1),toon('#ffffff',{map:repeat(stripes(YEL,INK),60,1)}),0,.012,BAY,false);tapeLine.userData.noAO=true;
  // Light: pendants over the machine bay only; the bench gets a soft lamp from the front.
  pendant(game.root,-6.4,-7.4,{y:2.7,color:YEL});pendant(game.root,1.8,-7.5,{y:2.7,color:PERI,light:false});pendant(game.root,7.6,-7.4,{y:2.7,color:YEL,light:false});
  pointLamp(game.root,table.x,2.7,table.z+1.2,{color:'#fff1e0',intensity:5,distance:5.5});lampPool(game.root,table.x,table.z+.6,2.4,.16);
  pointLamp(game.root,1.8,1.6,-7.8,{color:'#ffb070',intensity:3,distance:5});
  rug(r,10.5,7.4,4.4,2.2,PERI,'#e3e1fa');
  return {};
}
