// Clockwork Kitchen set dressing: a retro diner kitchen. Mint-and-cream checker tiles, cream
// walls with a mint wainscot, chrome and cherry-red trim. The big wall clock and the blinking
// reference beacon hang on the back wall over the cook line (a range, a hood, a tall fridge); the
// storeroom with the clock-module shelf and the dough rack sits by the door; a diner counter with
// stools fills the front of the room.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,flat,DMETAL,INK} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';

export const MINT='#8fd9c0',CREAM='#fbf3e2',CHERRY='#e5484d',CHROME='#dfe4ea';
/** Where the clock-module shelf parks (right end of the bench) and the dough trays land (left end). */
export const SHELF_SPOT={x:3.25,z:-2.45},DOUGH_SPOT={x:-3.2,z:-2.45};

function plaque(text:string,w:number,h:number,bg:string,fg=INK,size=40){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(22,h/3));c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';let s=size;const f=(n:number)=>`700 ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;c.font=f(s);while(s>12&&c.measureText(text).width>w-40){s--;c.font=f(s);}c.fillText(text,w/2,h/2+2);});
}
const clockFace=()=>canvasTex(512,512,c=>{
  c.fillStyle=CREAM;c.beginPath();c.arc(256,256,250,0,7);c.fill();c.strokeStyle=CHERRY;c.lineWidth=18;c.beginPath();c.arc(256,256,236,0,7);c.stroke();
  c.fillStyle=INK;c.textAlign='center';c.textBaseline='middle';c.font='700 58px "Fredoka Variable", "Fredoka", system-ui, sans-serif';
  for(let i=1;i<=12;i++){const a=i/12*Math.PI*2;c.fillText(String(i),256+Math.sin(a)*176,256-Math.cos(a)*176);}
  for(let i=0;i<60;i++){const a=i/60*Math.PI*2,r0=i%5?214:204;c.lineWidth=i%5?4:8;c.beginPath();c.moveTo(256+Math.sin(a)*r0,256-Math.cos(a)*r0);c.lineTo(256+Math.sin(a)*224,256-Math.cos(a)*224);c.stroke();}
  c.fillStyle=MINT;c.font='700 30px "Fredoka Variable", "Fredoka", system-ui, sans-serif';c.fillText('REFERENCE',256,330);
});
/** A clock hand pivoting at the group origin (points up at rotation 0). */
function hand(parent:T.Object3D,len:number,w:number,color:string,z:number){const g=group(parent,0,0,z);part(g,box(w,len,.02),toon(color),0,len/2-.04,0,false);return g;}

export interface KitchenRoom {lightUp:()=>void;clock:{hour:T.Object3D;minute:T.Object3D;second:T.Object3D};beacon:T.Mesh;beaconGlow:T.Sprite;fridgeLight:T.Mesh}
export function dressClockwork(game:Game,kit:RoomKit):KitchenRoom{
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // Floors: diner checker tiles everywhere, a warm plank dining area at the front, a red runner.
  kit.floor(-W,W,-D,D,TX.kitchenTiles('#f7efdc','#8fd9c0',8),3);
  kit.floor(-W,W,2.2,D,TX.woodPlanks('#dcb07a'),3.2,.004);
  kit.floor(-2.6,2.6,-1.3,1.9,TX.rugTex(CHERRY,'#ffd9cf'),2,.006);
  kit.backWindows(x=>Math.abs(x)<6.5,.14);
  // ---- The cook line along the back wall: range + hood, a flat-top, a tall chrome fridge.
  const line=group(r,0,0,-D+.55);
  for(const [x,w,col] of [[-4.4,2.2,CHROME],[-1.8,2.6,CHERRY],[1.1,2.2,CHROME]] as const){part(line,rbox(w,.95,.9,.06),toon(col),x,.47,0);part(line,box(w+.04,.06,.94),toon('#c9ced6'),x,.97,0);}
  for(let k=0;k<4;k++){part(line,cyl(.16,.16,.03,20),toon(INK),-2.6+k*.55,1.02,0);part(line,cyl(.1,.12,.12,16),toon(k%2?'#c7ccd6':CHERRY),-2.6+k*.55,1.1,0);}
  for(let k=0;k<5;k++)part(line,cyl(.045,.045,.05,12,'z'),toon(INK),-2.9+k*.28,.72,.46);
  part(line,box(2.4,.5,.03),toon('#3a3d55'),-1.8,.45,.46,false);
  const hood=group(line,-1.8,2.1,-.1);part(hood,rbox(3,.35,1.1,.05),toon(CHROME),0,0,.05);part(hood,box(2.2,.9,.8),toon('#c9ced6'),0,.6,-.1);
  // Tall fridge and a pie case with glowing shelves.
  const fridge=group(r,4.6,0,-D+.6);part(fridge,rbox(1.3,2.3,1,.1),glossyToon(MINT,{spec:.7,size:.96}),0,1.15,0);part(fridge,box(.06,.9,.06),toon(CHROME),.45,1.5,.52);part(fridge,box(.06,.6,.06),toon(CHROME),.45,.5,.52);
  part(fridge,box(1.3,.04,1.02),toon(CHROME),0,1.02,0);solid(game,1.3,2.3,1,4.6,1.15,-D+.6);
  const pie=group(r,6.8,0,-D+.6);part(pie,rbox(1.6,.9,.9,.06),toon(CREAM),0,.45,0);part(pie,box(1.5,.8,.8),toon('#cfefff',{opacity:.35}),0,1.3,0);
  for(let s=0;s<2;s++)for(let k=0;k<3;k++){const y=1.05+s*.35,x=-.45+k*.45;part(pie,cyl(.17,.17,.07,20),toon(['#e0a247','#e5484d','#f2c46b'][(k+s)%3]),x,y,0);part(pie,cyl(.19,.19,.01,20),toon(CREAM),x,y-.04,0);}
  const fridgeLight=part(game.root,box(1.44,.02,.76),hot('#fff1d6',1.2),6.8,1.68,-D+.6,false);
  solid(game,1.6,1.8,.9,6.8,.9,-D+.6);solid(game,7.4,1,1,-1.8,.5,-D+.55);
  // ---- The big wall clock (reference) and the blinking beacon beside it.
  const cx=1.9,cy=2.05;
  const rim=group(kit.back,cx,cy,.2);part(rim,cyl(.66,.66,.1,40,'z'),toon(CHERRY));part(rim,cyl(.7,.7,.06,40,'z'),toon(CHROME),0,0,-.04);
  const face=new T.Mesh(new T.CircleGeometry(.6,48),flat(clockFace()));face.position.z=.056;rim.add(face);
  const hour=hand(rim,.34,.06,INK,.07),minute=hand(rim,.5,.04,INK,.08),second=hand(rim,.54,.018,CHERRY,.09);part(rim,cyl(.045,.045,.04,16,'z'),toon(CHERRY),0,0,.1,false);
  // The beacon blinks once a second, beside the clock.
  const beaconBase=group(kit.back,cx+1.25,cy+.25,.2);part(beaconBase,rbox(.34,.16,.12,.04),toon(CHROME),0,-.14,0);
  const beacon=part(game.root,sphere(.13,18,12),toon('#8a3a3a'),cx+1.25,cy+.28,-D+.36,false);const beaconGlow=glow(game.root,'rgba(255,90,90,1)',1.1,0);beaconGlow.position.set(cx+1.25,cy+.28,-D+.5);
  const bp=new T.Mesh(new T.PlaneGeometry(.9,.22),flat(plaque('1 s BEACON',360,88,CREAM)));bp.position.set(cx+1.25,cy-.1,.23);kit.back.add(bp);
  const sign=new T.Mesh(new T.PlaneGeometry(3.2,.5),flat(plaque('CLOCKWORK KITCHEN',1024,160,CHERRY,CREAM,92)));sign.position.set(4.9,2.72,.2);kit.back.add(sign);
  // ---- Side wall: open shelves with pots and jars, a menu board and a timing poster.
  const shelves=group(kit.side,-2.4,0,.3);for(const y of [1.35,1.85]){part(shelves,box(2.6,.05,.36),toon('#c98a55'),0,y,0);for(let k=0;k<6;k++)part(shelves,cyl(.1,.09,.2,14),toon(['#e5484d',CHROME,MINT,'#f2c46b','#c7ccd6',CHERRY][(k+(y>1.5?2:0))%6]),-1.05+k*.42,y+.13,0);}
  const menu=new T.Mesh(new T.PlaneGeometry(1.6,1.1),flat(canvasTex(512,352,c=>{c.fillStyle='#2f3b3a';c.beginPath();c.roundRect(0,0,512,352,24);c.fill();c.strokeStyle='#c98a55';c.lineWidth=14;c.stroke();
    c.fillStyle=CREAM;c.textAlign='center';c.font='700 50px "Fredoka Variable", system-ui, sans-serif';c.fillText('TODAY',256,70);c.font='600 36px "Fredoka Variable", system-ui, sans-serif';c.textAlign='left';
    [['Soft eggs','3:00'],['Bread','10:00'],['Pastry','5:00']].forEach(([a,b],i)=>{c.fillStyle=CREAM;c.fillText(a,50,150+i*62);c.fillStyle='#ffd66b';c.textAlign='right';c.fillText(b,462,150+i*62);c.textAlign='left';});})));
  menu.position.set(2.2,1.9,.17);kit.side.add(menu);
  wallArt(kit.side,'sun',5.2,1.9,.16);wallArt(kit.back,'graph',8.6,1.95,.18,0,.8);
  // ---- Storeroom corner by the door: a rack of stock, the tray rack, sacks of flour.
  const rack=group(r,-9.9,0,4.6,Math.PI/2);part(rack,box(2.6,.08,.55),toon('#c98a55'),0,1,0);part(rack,box(2.6,.08,.55),toon('#c98a55'),0,1.8,0);for(const sx of [-1.25,1.25])part(rack,box(.08,1.9,.08),toon(DMETAL),sx,.95,.2);
  for(let k=0;k<5;k++)part(rack,rbox(.42,.34,.4,.05),toon(k%2?'#d7a56d':'#c98f5a'),-1+k*.5,1.22,0);for(let k=0;k<4;k++)part(rack,cyl(.14,.14,.4,14),toon(k%2?CREAM:MINT),-.9+k*.6,2.04,0);
  solid(game,.6,1.9,2.6,-9.9,.95,4.6);
  for(const [x,z] of [[-9.5,1.6],[-9,1.2],[-9.7,.8]]){const s=part(r,sphere(.3,14,10),toon('#efe4cf'),x,.22,z);s.scale.set(1,.72,1.2);}
  // Hazard tape where the shelf starts, and a painted parking bay at the bench's right end.
  kit.floor(SHELF_SPOT.x-.75,SHELF_SPOT.x+.75,SHELF_SPOT.z+.8,SHELF_SPOT.z+.95,TX.hazardStripe(),.6,.008);
  // ---- Diner counter with stools across the front right; a jukebox by the side wall.
  const counter=group(r,6.2,0,4.4);part(counter,rbox(4.2,1,.9,.08),toon(CHERRY),0,.5,0);part(counter,box(4.3,.08,1.05),toon(CREAM),0,1.02,0);part(counter,box(4.22,.08,.04),toon(CHROME),0,.2,.46);
  solid(game,4.2,1.05,.9,6.2,.52,4.4);
  for(let k=0;k<4;k++){const s=group(r,4.7+k*1,0,5.4);part(s,cyl(.05,.05,.7,10),toon(CHROME),0,.35,0);part(s,cyl(.22,.22,.1,20),toon(k%2?MINT:CHERRY),0,.74,0);part(s,cyl(.2,.24,.04,20),toon(CHROME),0,.02,0);}
  for(let k=0;k<3;k++){const x=5+k*1.2;part(r,cyl(.14,.12,.12,14),toon(CREAM),x,1.12,4.3);part(r,sphere(.1,12,8),toon(['#f2c46b','#e5484d','#8fd9c0'][k]),x,1.2,4.3).scale.y=.7;}
  const juke=group(r,-9.9,0,-2.2,Math.PI/2);part(juke,rbox(1,1.6,.6,.2),toon(CHERRY),0,.8,0);part(juke,cyl(.5,.5,.6,24,'z'),toon(CHERRY),0,1.6,0);
  part(game.root,cyl(.38,.38,.02,24,'x'),hot('#ffd66b',1.3),-9.58,1.62,-2.2,false);for(let k=0;k<5;k++)part(game.root,box(.02,.08,.5),hot(['#8fd9c0','#ffd66b','#ff8a8a'][k%3],1.4),-9.58,.5+k*.18,-2.2,false);
  solid(game,.6,2,1,-9.9,1,-2.2);
  rug(r,-5.6,3.6,3,2.2,MINT,'#e8fff6');
  // Lamps over the cook line and the counter; soft light over the bench (nothing hangs over it).
  for(const x of [-4.6,.2])pendant(game.root,x,-6.6,{y:2.6,color:CHERRY,light:x===.2});
  for(const x of [5,7.4])pendant(game.root,x,4.4,{y:2.45,color:MINT,light:x===5});
  pointLamp(game.root,0,2.7,-1.7,{color:'#fff1d6',intensity:5,distance:5.5});lampPool(game.root,0,-2.2,2.6,.2);
  pointLamp(game.root,-1.8,2.3,-6.6,{color:'#ffd9a8',intensity:4,distance:6});
  // Every tray golden: the pie case and the fridge light up and the beacon glows steady green.
  const lightUp=()=>{fridgeLight.material=hot('#fff1d6',2.2);glow(game.root,'rgba(255,220,150,1)',3,.3).position.set(6.8,1.4,-D+1.2);pointLamp(game.root,0,2,-5,{color:'#ffe0b0',intensity:8,distance:9});};
  return {lightUp,clock:{hour,minute,second},beacon,beaconGlow,fridgeLight};
}
