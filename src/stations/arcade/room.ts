// Overheating Arcade set dressing: a neon-pastel arcade hall. Warm plum carpet with confetti,
// cream walls, candy cabinets along the back wall (the five broken ones sit dark with OUT OF
// ORDER marquees until Pip signs them off), a row of working cabinets on the right wall, a neon
// sign, an LED basics poster, and the storeroom (planks, shelves) where the resistor tray waits.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,flat,freeze,plaqueBoard,INK,DMETAL} from '../../render/kit';
import {hot} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pointLamp,lampPool,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';
import {JOBS} from './logic';

const PLUM='#3b2346',CREAM='#fbf3e2',PINK='#ff7eb6',MINT='#6fe0c0',LEMON='#ffd84d',GRAPE='#9b7bf0',SKY='#7cc8ff';
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
/** light(k): the k-th back-wall cabinet lights, once (rush passes the cabinet just fixed as its title). */
/** A prize box on the prize shelf: a real (light) physics body, so a thrown beanbag or a flung box
 *  knocks the pyramid over (R5-079 chaos bonus). The station keeps its mesh on the body. */
export interface Prize {mesh:T.Object3D;body:RAPIER.RigidBody;home:T.Vector3}
/** Where the prize pyramid stands (the level keeps clutter off it). */
export const PYRAMID={x:1.4,z:-8.75};
export interface ArcadeRoom {light(k:number,title?:string):void;lightUp():void;prizes:Prize[]}

// A dusty-mauve carpet with a light scatter of pastel confetti: arcade, but quiet enough to sit
// behind the props and the bench (the house brief is pale wood, cream and pastels).
const confetti=()=>TX.tex('arcade-carpet',512,512,c=>{
  c.fillStyle='#8f7aa6';c.fillRect(0,0,512,512);const r=TX.rng(11);
  c.fillStyle='rgba(255,255,255,.035)';for(let y=0;y<512;y+=64)for(let x=0;x<512;x+=64)if((x+y)%128===0)c.fillRect(x,y,64,64);
  const cols=['#f6b3cf','#a9e6d3','#f3de96','#c2b2ee','#a9d4f2','#f4c0a2'];c.globalAlpha=.75;
  for(let k=0;k<60;k++){const x=r()*512,y=r()*512,col=cols[k%cols.length];c.fillStyle=col;c.strokeStyle=col;c.save();c.translate(x,y);c.rotate(r()*6.3);c.scale(.8,.8);
    const kind=k%4;if(kind===0){c.fillRect(-9,-3,18,6);}else if(kind===1){c.beginPath();c.arc(0,0,5,0,7);c.fill();}
    else if(kind===2){c.lineWidth=4;c.beginPath();c.moveTo(-10,0);c.quadraticCurveTo(-5,-7,0,0);c.quadraticCurveTo(5,7,10,0);c.stroke();}
    else{c.beginPath();c.moveTo(0,-7);c.lineTo(6,5);c.lineTo(-6,5);c.closePath();c.fill();}c.restore();}c.globalAlpha=1;
});
// The back-row runner: lilac with pink edge stripes and a row of pale stars, seamless along x.
const runner=()=>TX.tex('arcade-runner',256,256,c=>{
  c.fillStyle='#b9a6dc';c.fillRect(0,0,256,256);c.fillStyle='#ff9fc8';c.fillRect(0,14,256,16);c.fillRect(0,226,256,16);
  c.fillStyle='#f3eaff';c.fillRect(0,40,256,4);c.fillRect(0,212,256,4);
  c.fillStyle='rgba(255,250,240,.75)';for(const x of [64,192]){c.save();c.translate(x,128);c.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,rr=k%2?14:32;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();c.restore();}
});
function plaque(text:string,w:number,h:number,bg:string,fg=INK,size=48,radius=22){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,radius);c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';let s=size;c.font=FONT(s);while(s>12&&c.measureText(text).width>w-40){s--;c.font=FONT(s);}c.fillText(text,w/2,h/2+2);});
}
/** A marquee: lit (candy gradient) or dark with OUT OF ORDER. */
function marqueeTex(title:string,lit:boolean,seed=0){
  return canvasTex(512,128,c=>{
    if(lit){const g=c.createLinearGradient(0,0,512,0);const cols=[[PINK,LEMON,MINT],[GRAPE,PINK,LEMON],[MINT,SKY,GRAPE]][seed%3];g.addColorStop(0,cols[0]);g.addColorStop(.5,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;}
    else c.fillStyle='#2a1c33';
    c.fillRect(0,0,512,128);
    c.fillStyle=lit?'rgba(255,255,255,.6)':'rgba(255,255,255,.08)';for(let x=12;x<512;x+=28){c.beginPath();c.arc(x,8,4,0,7);c.fill();c.beginPath();c.arc(x+14,120,4,0,7);c.fill();}
    c.textAlign='center';c.textBaseline='middle';let s=62;c.font=FONT(s);while(c.measureText(title).width>440){s--;c.font=FONT(s);}
    if(lit){c.lineWidth=10;c.strokeStyle=PLUM;c.strokeText(title,256,62);c.fillStyle='#fffaf0';c.fillText(title,256,62);}
    else{c.fillStyle='rgba(255,255,255,.28)';c.fillText(title,256,50);c.font=FONT(24);c.fillStyle='#ff8a9a';c.fillText('OUT OF ORDER',256,100);}
  });
}
const basicsPoster=()=>canvasTex(512,700,c=>{
  c.fillStyle=CREAM;c.fillRect(0,0,512,700);c.fillStyle=PLUM;c.fillRect(0,0,512,104);
  c.fillStyle=LEMON;c.font=FONT(46);c.textAlign='center';c.fillText('LED BASICS',256,68);
  // An LED: dome, rim with the flat, a long leg (+) and a short leg (−).
  c.fillStyle='#ff4b5c';c.beginPath();c.arc(256,230,70,Math.PI,0);c.lineTo(326,300);c.lineTo(186,300);c.closePath();c.fill();
  c.fillStyle='#e8e2d6';c.fillRect(170,300,172,22);c.fillStyle=CREAM;c.fillRect(326,300,16,22);
  c.fillStyle='#9aa0ad';c.fillRect(220,322,10,150);c.fillRect(284,322,10,100);
  c.fillStyle=INK;c.font=FONT(34);c.textAlign='right';c.fillText('+ anode',210,460);c.textAlign='left';c.fillText('− cathode',300,420);
  c.font=FONT(24,600);c.textAlign='center';c.fillText('long leg + · flat side −',256,512);
  c.fillStyle=PINK;c.beginPath();c.roundRect(40,540,432,120,20);c.fill();c.fillStyle=INK;c.font=FONT(36);
  c.fillText('R = (V − Vf) / I',256,588);c.font=FONT(28,600);c.fillText('always in SERIES',256,632);
});
/** A standard upright cabinet with a marquee, screen, control deck and coin door. */
function cabinet(parent:T.Object3D,x:number,z:number,ry:number,body:string,title:string,lit:boolean,seed=0){
  const c=group(parent,x,0,z,ry);
  part(c,rbox(.95,1.2,.8,.08),toon(body),0,.6,0);part(c,rbox(1,.1,.85,.05),toon(PLUM),0,.05,0);
  const head=group(c,0,1.2,-.05);head.rotation.x=.12;part(head,rbox(.95,.7,.7,.08),toon(body),0,.35,0);
  const scr=part(head,box(.72,.46,.03),lit?hot(['#4a3a78','#2f5a6e','#5a2f58'][seed%3],1.3):toon('#241a33'),0,.36,.35);scr.userData.noAO=true;
  part(c,rbox(.97,.08,.5,.03),toon(PLUM),0,1.2,.25);for(const [bx,col] of [[-.2,'#e5484d'],[0,LEMON],[.2,SKY]] as const)part(c,cyl(.05,.05,.04,16),toon(col),bx,1.26,.35);
  part(c,box(.26,.3,.02),toon(DMETAL),0,.45,.41);part(c,box(.05,.1,.02),toon(LEMON),0,.5,.425);
  const mq=group(c,0,2.02,.05);part(mq,rbox(1,.28,.3,.06),toon(PLUM),0,0,0);
  const face=part(mq,new T.PlaneGeometry(.92,.23),new T.MeshBasicMaterial({map:marqueeTex(title,lit,seed),toneMapped:false}),0,0,.155,false);(face.material as T.Material).userData.outlineParameters={visible:false};
  // Finished sides and back (the player orbits): ink T-molding down both front edges, a side art
  // panel with a star burst, and on the back a recessed service door, vent slots and a power cord.
  const ink=toon(INK),panel=toon(new T.Color(body).offsetHSL(0,0,-.1).getStyle()),accent=[PINK,MINT,LEMON,GRAPE,SKY][seed%5];
  for(const s of [-1,1]){part(c,box(.025,1.9,.03),ink,s*.475,1.05,.39,false);part(c,box(.008,.9,.56),panel,s*.479,.75,-.02,false);
    const star=part(c,new T.CircleGeometry(.16,5),toon(accent),s*.485,.8,-.02,false);star.rotation.y=s*Math.PI/2;}
  part(c,rbox(.6,1.0,.02,.02),panel,0,.75,-.405);for(let k=0;k<5;k++)part(c,box(.4,.02,.015),ink,0,1.4+k*.07,-.36,false);
  part(c,box(.05,.05,.02),toon(DMETAL),.3,.15,-.41);part(c,cyl(.015,.015,.15,6),ink,.3,.075,-.42,false);
  return {group:c,face,screen:scr};
}

export function dressArcade(game:Game,kit:RoomKit):ArcadeRoom{
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  kit.floor(-W,W,-D,D,confetti(),3.2);
  // Storeroom in the front-left corner: warm planks behind two short walls.
  kit.floor(-W,-6.4,2.6,D,TX.woodPlanks('#d8ad72'),3.2,.004);
  kit.interiorWall({id:'store-a',minX:-W,maxX:-8.6,minZ:2.45,maxZ:2.75},undefined,undefined,1.35);
  kit.interiorWall({id:'store-b',minX:-6.55,maxX:-6.25,minZ:2.45,maxZ:5.4},undefined,undefined,1.35);
  // The bigger room's storeroom reaches the front edge: a stub wall leaves a 2.2 m doorway on the hall side.
  kit.interiorWall({id:'store-c',minX:-6.55,maxX:-6.25,minZ:7.6,maxZ:D},undefined,undefined,1.35);
  // An arcade has no windows: the hall is lit by its cabinets.
  kit.backWindows(x=>Math.abs(x)<W,.1);
  rug(r,0,-1.2,5.6,2.2,PINK,'#ffd1e3');rug(r,8,3.9,4.6,3.4,GRAPE,'#e3d9ff');
  // A candy runner along the back row, where people queue for the cabinets (it tiles along x, so it
  // spans the hall at any width), and a mat under the skee-ball pair.
  kit.floor(-W+3,W-3,-6.9,-5.5,runner(),1.4,.006);rug(r,W-2.4,6.75,4,3.2,MINT,'#d9f7ee');
  // ---- The five broken cabinets along the back wall (dark until signed off).
  const lit:{face:T.Mesh;screen:T.Mesh;at:T.Vector3;title:string;done?:boolean}[]=[];
  // Cabinets stay on root but are merged in place at the end (R5-026); the broken ones keep their
  // marquee face and screen separate, because light(k) swaps them.
  const cabs:{group:T.Group;live:T.Object3D[]}[]=[];
  const spots:[number,number][]=[[-9.4,-D+1.1],[-6.2,-D+1.1],[5.2,-D+1.1],[8.4,-D+1.1],[W-1.3,-3.2]];
  JOBS.forEach((j,k)=>{const [x,z]=spots[k],ry=k===4?-Math.PI/2:0,cab=cabinet(game.root,x,z,ry,['#ff9fc8','#9ff0d2','#ffe08a','#c7b6ff','#ffb38a'][k],j.cabinet,false,k);
    cabs.push({group:cab.group,live:[cab.face,cab.screen]});cab.group.updateMatrixWorld(true);solid(game,1,2.2,.9,x,1.1,z,ry);lit.push({face:cab.face,screen:cab.screen,at:cab.group.localToWorld(new T.Vector3(0,2.1,.4)),title:j.cabinet});
    // Each broken cabinet has a tell: a pinball table, a dance pad, a claw box, a handheld, a hopper.
    const g=cab.group;
    if(j.id==='bumper'){const t=group(g,0,0,.95);part(t,rbox(.8,.14,1.1,.05),toon('#ff9fc8'),0,.85,0);part(t,box(.7,.02,1),toon('#2a1c33'),0,.93,0);for(const [bx,bz] of [[-.18,-.2],[.18,-.2],[0,.05]] as const)part(t,cyl(.07,.07,.08,14),toon(PINK),bx,.97,bz);for(const [lx,lz] of [[-.33,-.48],[.33,-.48],[-.33,.48],[.33,.48]] as const)part(t,box(.06,.8,.06),toon(PLUM),lx,.4,lz);solid(game,.8,1,1.1,x,.5,z+.95);}
    if(j.id==='rhythm'){const p=group(g,0,0,1);part(p,rbox(1.1,.08,.9,.04),toon(PLUM),0,.04,0);[[0,-.24,'#ff7eb6'],[-.28,0,'#6fe0c0'],[.28,0,'#ffd84d'],[0,.24,'#7cc8ff']].forEach(([ax,az,col])=>part(p,rbox(.24,.03,.22,.04),toon(col as string),ax as number,.09,az as number));}
    if(j.id==='claw'){const b=group(g,0,0,.8);part(b,rbox(.9,.9,.8,.05),toon('#ffe08a'),0,.45,0);const glass=toon('#dff4ff',{opacity:.35});part(b,box(.84,.8,.74),glass,0,1.3,0,false);for(let n=0;n<7;n++)part(b,sphere(.1,12,8),toon([PINK,MINT,GRAPE,SKY,LEMON][n%5]),-.28+(n%4)*.18,1.0+Math.floor(n/4)*.12,-.18+(n%3)*.16);part(b,cyl(.012,.012,.3,6),toon(DMETAL),.1,1.55,0);solid(game,.9,1.8,.8,x,.9,z+.8);}
    // The handheld stands on a display stand on the deck: a plum foot and a strut up its back.
    if(j.id==='handheld'){part(g,rbox(.34,.05,.22,.02),toon(PLUM),0,1.265,.38);part(g,box(.06,.32,.04),toon(PLUM),0,1.43,.29);
      const h=group(g,0,1.76,.38);h.rotation.x=-.2;part(h,rbox(.6,.95,.12,.08),toon('#c7b6ff'),0,0,0);part(h,box(.44,.36,.02),toon('#2a1c33'),0,.18,.065);part(h,cyl(.05,.05,.03,14,'z'),toon(PINK),.15,-.25,.065);part(h,box(.14,.04,.03),toon(INK),-.15,-.25,.065);part(h,box(.04,.14,.03),toon(INK),-.15,-.25,.065);}
    if(j.id==='hopper'){const s=group(g,0,0,.9);part(s,rbox(1.2,.9,.5,.05),toon('#ffb38a'),0,.45,0);for(let n=0;n<5;n++)part(s,sphere(.11,12,8),toon([PINK,MINT,LEMON,GRAPE,SKY][n]),-.44+n*.22,1.0,0);for(let n=0;n<6;n++)part(s,cyl(.05,.05,.015,14),toon('#d9a441'),-.3+n*.12,.92,.2);solid(game,.5,1,1.2,x-.9,.5,z);}
  });
  // ---- Working cabinets along the right wall and the left of the hall (the "too many lamps").
  [[W-1.3,-.6],[W-1.3,1.2],[W-1.3,3],[W-1.3,-6.6]].forEach(([x,z],k)=>{cabs.push({live:[],group:cabinet(game.root,x,z,-Math.PI/2,['#9ff0d2','#ff9fc8','#c7b6ff','#ffe08a'][k],['STAR BLASTER','KART DASH','BLOCK DROP','DINO RUN'][k],true,k).group});solid(game,.9,2.2,1,x,1.1,z,-Math.PI/2);});
  [[-W+1.1,-3.4],[-W+1.1,-1.5],[-W+1.1,.4]].forEach(([x,z],k)=>{cabs.push({live:[],group:cabinet(game.root,x,z,Math.PI/2,['#ffe08a','#9ff0d2','#ff9fc8'][k],['SNAKE','SPACE ROCKS','PONG'][k],true,k+1).group});solid(game,.9,2.2,1,x,1.1,z,Math.PI/2);});
  // ---- Back wall: the neon sign between the cabinets, and the LED basics poster.
  const bw=kit.back;
  const neon=new T.Mesh(new T.PlaneGeometry(4.6,.9),flat(canvasTex(1024,200,c=>{c.clearRect(0,0,1024,200);c.textAlign='center';c.textBaseline='middle';let fs=96;c.font=FONT(fs);while(c.measureText('OVERHEATING ARCADE').width>940){fs--;c.font=FONT(fs);}
    c.shadowColor=PINK;c.shadowBlur=26;c.lineWidth=8;c.strokeStyle=PINK;c.strokeText('OVERHEATING ARCADE',512,104);c.shadowBlur=0;c.fillStyle='#fff0f7';c.fillText('OVERHEATING ARCADE',512,104);}),{toneMapped:false}));
  neon.position.set(0,2.45,.2);bw.add(neon);part(bw,rbox(4.9,1.05,.08,.1),toon(PLUM),0,2.45,.15);glow(game.root,'rgba(255,126,182,1)',5,.18).position.set(0,2.4,-D+.8);
  // The poster hangs clear of the prize shelf, so the formula strip reads from the room.
  const poster=group(bw,3.05,1.45,.16);part(poster,box(.84,1.12,.04),toon(INK));const pf=new T.Mesh(new T.PlaneGeometry(.78,1.06),toon('#ffffff',{map:basicsPoster()}));pf.position.z=.025;poster.add(pf);
  wallArt(bw,'bolt',-1.9,1.5,.16,0,.9);
  // Change machine and a prize shelf behind the bench (low, so the bench view stays clear).
  const cm=group(r,-1.2,0,-D+.6);part(cm,rbox(.8,1.5,.6,.06),toon(SKY),0,.75,0);part(cm,box(.5,.3,.02),toon('#2a1c33'),0,1.1,.31);part(cm,box(.3,.06,.02),toon(LEMON),0,.7,.31);solid(game,.8,1.5,.6,-1.2,.75,-D+.6);
  const ps=group(r,1.4,0,-D+.5);part(ps,rbox(2,.9,.45,.05),toon(CREAM),0,.45,0);for(let n=0;n<6;n++)part(ps,sphere(.13,12,8),toon([PINK,MINT,LEMON,GRAPE,SKY,'#ff9a6b'][n]),-.8+n*.32,1.02,0);solid(game,2,1,.45,1.4,.5,-D+.5);
  // The prize pyramid on the floor in front of the shelf: ten candy gift boxes stacked 4-3-2-1, asleep
  // until something hits them (a thrown beanbag, a flung box, a shoved trolley, or Pip himself).
  const prizes:Prize[]=[],gift=rbox(.3,.3,.3,.04),ribbon=box(.31,.31,.07);let n=0;
  for(let row=0;row<4;row++)for(let k=0;k<4-row;k++){const x=1.4+(k-(3-row)/2)*.32,y=.16+row*.305,z=PYRAMID.z,g=group(game.root,x,y,z);
    part(g,gift,toon([PINK,MINT,LEMON,GRAPE,SKY,'#ff9a6b'][n%6]));part(g,ribbon,toon(CREAM),0,0,0,false);n++;
    const body=game.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,y,z).setLinearDamping(.3).setAngularDamping(.5).setCanSleep(true).setSleeping(true).setCcdEnabled(true));
    game.world.createCollider(RAPIER.ColliderDesc.cuboid(.15,.15,.15).setMass(.4).setFriction(.8).setRestitution(.08),body);prizes.push({mesh:g,body,home:new T.Vector3(x,y,z)});}
  // ---- Side wall: a ticket counter mural and posters.
  const side=kit.side;
  const tick=new T.Mesh(new T.PlaneGeometry(3.4,.6),flat(plaque('WIN TICKETS · FIX CABINETS',900,160,LEMON,PLUM,64)));tick.position.set(2.2,2.2,.16);side.add(tick);
  wallArt(side,'sun',-2.4,1.9,.16);wallArt(side,'cat',5.6,1.9,.16);
  // ---- Storeroom: shelves of resistor stock and a counter where the tray waits.
  const shelf=group(r,-W+1.4,0,D-.8);for(const y of [.5,1.2,1.9])part(shelf,box(2.4,.06,.6),toon('#a8734a'),0,y,0);for(const sx of [-1.15,1.15])part(shelf,box(.07,2,.6),toon(DMETAL),sx,1,0);
  // The stock is kraft cartons with a white label, like every other carton (DR-51/52).
  for(let n=0;n<9;n++){const y=[.5,1.2,1.9][n%3],bx=-.8+Math.floor(n/3)*.8;part(shelf,rbox(.5,.22,.4,.04),toon(['#c98f5a','#d7a56d','#b9875a'][(n+Math.floor(n/3))%3]),bx,y+.14,0);part(shelf,box(.2,.08,.01),toon('#fffaf0'),bx,y+.14,.205,false);}
  solid(game,2.4,2,.6,-W+1.4,1,D-.8);
  const counter=group(r,-9.2,0,4.3);part(counter,rbox(1.6,.84,.8,.05),toon('#e9c38e'),0,.42,0);part(counter,box(1.64,.04,.84),toon(PLUM),0,.85,0);solid(game,1.6,.86,.8,-9.2,.43,4.3);
  // The STOREROOM plaque hangs under a header beam carried on two posts that rise from the ends of
  // the storeroom walls, so it is mounted, has a back, and reads from both sides.
  for(const x of [-8.65,-6.4])part(r,box(.1,1.1,.12),toon(DMETAL),x,1.9,2.6);part(r,rbox(2.5,.16,.16,.04),toon(PLUM),-7.5,2.38,2.6);
  plaqueBoard(r,plaque('STOREROOM',512,124,GRAPE,'#fffaf0',60),1.5,.36,-7.6,2.1,2.6,{board:PLUM});
  // ---- Set pieces in the bigger hall (review 6): each stands on its own collider.
  // Photo booth in the back-left corner: a candy box with a striped curtain on the side facing the hall.
  {const bx=-W+1.6,bz=-D+1.4,b=group(r,bx,0,bz);part(b,rbox(1.8,2.3,1.6,.08),toon('#ffd1e3'),0,1.15,0);part(b,rbox(1.9,.12,1.7,.05),toon(PLUM),0,2.34,0);
    for(let k=0;k<6;k++)part(b,box(.2,1.8,.04),toon(k%2?PINK:CREAM),.94,1.0,-.55+k*.2,false);
    part(b,box(.06,.06,1.3),toon(DMETAL),.94,1.95,0,false);
    const top=new T.Mesh(new T.PlaneGeometry(1.5,.34),flat(plaque('PHOTO',384,88,LEMON,PLUM,54)));top.position.set(0,2.0,.81);b.add(top);
    for(let k=0;k<4;k++)part(b,box(.36,.26,.02),toon(['#ffe08a','#9ff0d2','#c7b6ff','#ffb38a'][k]),-.45+(k%2)*.5,.9+Math.floor(k/2)*.32,.81,false);
    solid(game,1.8,2.3,1.6,bx,1.15,bz);}
  // A twin racer, two seats under one wide screen, facing the back wall (the seat backs face the door).
  {const rx=-8.8,rz=-4.4,g=group(r,rx,0,rz);part(g,rbox(2.1,.18,1.7,.05),toon(PLUM),0,.09,0);
    part(g,rbox(2.1,1.9,.6,.08),toon(SKY),0,.95,-.55);const scr=part(g,box(1.8,.8,.03),hot('#2f5a6e',1.2),0,1.35,-.24);scr.userData.noAO=true;
    const mq=new T.Mesh(new T.PlaneGeometry(1.9,.3),flat(marqueeTex('TURBO TWINS',true,2)));mq.position.set(0,2.05,-.24);g.add(mq);
    for(const s of [-.5,.5]){part(g,rbox(.62,.5,.6,.08),toon(PINK),s,.43,.45);part(g,rbox(.62,.75,.14,.06),toon(PINK),s,.85,.72);
      part(g,cyl(.16,.16,.05,18,'z'),toon(INK),s,.95,-.1);part(g,box(.05,.3,.05),toon(DMETAL),s,.8,-.12,false);}
    solid(game,2.1,1.9,.6,rx,.95,rz-.55);solid(game,2.1,.9,1.1,rx,.45,rz+.3);}
  // Air hockey between the bench and the right-wall row: a long table with a rail, two mallets and a puck.
  {const ax=8.8,az=-3.6,g=group(r,ax,0,az);part(g,rbox(2.3,.6,1.25,.06),toon(GRAPE),0,.3,0);part(g,rbox(2.4,.1,1.35,.04),toon(CREAM),0,.65,0);
    part(g,box(2.2,.02,1.15),toon('#e9f4ff'),0,.71,0);part(g,box(.02,.005,1.1),toon(PINK),0,.722,0,false);
    for(const s of [-1,1]){part(g,cyl(.09,.09,.06,16),toon(s<0?PINK:MINT),s*.85,.75,0);part(g,box(.05,.03,.36),toon(INK),s*1.11,.72,0,false);}
    part(g,cyl(.05,.05,.015,14),toon(INK),.2,.73,.15);for(const lx of [-1,1])for(const lz of [-1,1])part(g,box(.08,.3,.08),toon(PLUM),lx*1.05,.08,lz*.52,false);
    solid(game,2.4,.76,1.35,ax,.38,az);}
  // Skee-ball pair against the right edge: ramps rise to the ring targets under a lit hood.
  for(const sz of [6.15,7.35]){const sx=W-2.4,g=group(r,sx,0,sz);part(g,rbox(2.9,.55,1,.06),toon('#ffe08a'),0,.28,0);
    const ramp=part(g,box(2.5,.04,.7),toon('#d7a56d'),-.1,.7,0);ramp.rotation.z=.14;
    for(const s of [-1,1])part(g,box(2.7,.22,.06),toon(PLUM),-.1,.72,s*.42,false);
    const hood=group(g,1.25,0,0);part(hood,rbox(.5,2.2,1.05,.06),toon(PINK),0,1.1,0);for(let k=0;k<3;k++)part(hood,cyl(.13-k*.03,.13-k*.03,.03,18,'x'),toon([CREAM,MINT,LEMON][k]),-.27,.95+k*.32,0);
    const mq=new T.Mesh(new T.PlaneGeometry(.95,.24),flat(marqueeTex('SKEE',true,sz>7?1:0)));mq.position.set(-.27,2.0,0);mq.rotation.y=-Math.PI/2;hood.add(mq);
    solid(game,2.9,.9,1,sx,.45,sz);solid(game,.5,2.2,1.05,sx+1.25,1.1,sz);}
  // Storeroom: a second rack of stock along the left wall and a spare cabinet under a dust sheet.
  {const g=group(r,-W+.45,0,5.6,Math.PI/2);for(const y of [.5,1.2,1.9])part(g,box(2.4,.06,.6),toon('#a8734a'),0,y,0);for(const sx of [-1.15,1.15])part(g,box(.07,2,.6),toon(DMETAL),sx,1,0);
    for(let n=0;n<9;n++){const y=[.5,1.2,1.9][n%3],bx=-.8+Math.floor(n/3)*.8;part(g,rbox(.5,.22,.4,.04),toon(['#d7a56d','#b9875a','#c98f5a'][(n+Math.floor(n/3))%3]),bx,y+.14,0);part(g,box(.2,.08,.01),toon('#fffaf0'),bx,y+.14,.205,false);}
    solid(game,.6,2,2.4,-W+.45,1,5.6);
    const sheet=group(r,-10.4,0,D-.75);part(sheet,rbox(1.05,2.15,.9,.18),toon('#efe6f2'),0,1.08,0);part(sheet,rbox(1.15,.12,1,.06),toon('#dcd0e2'),0,.06,0);solid(game,1.05,2.15,.9,-10.4,1.08,D-.75);}
  // ---- Lights: warm over the bench, candy colours around the hall. No hanging lamps over the bench.
  // Three room lights (the bench LED is the fourth, and the only one that changes); the lilac
  // corner and the storeroom get painted light pools instead of lamps.
  pointLamp(game.root,0,2.7,-1.8,{color:'#fff1e0',intensity:5,distance:5.5});lampPool(game.root,0,-2.3,2.8,.2);
  const pink=pointLamp(game.root,-6,2.4,-D+3,{color:'#ff9fd0',intensity:4,distance:9.5});pointLamp(game.root,7,2.4,-4.6,{color:'#9ff0ff',intensity:4,distance:9.5});
  lampPool(game.root,8,3.9,2.6,.16,'#c7b6ff');lampPool(game.root,-10.6,6.4,2.8,.18,'#ffe0b0');lampPool(game.root,12.6,6.75,2.2,.14,'#9ff0d2');lampPool(game.root,-12.6,-D+1.6,1.8,.14,'#ffd1e3');
  for(const [x,z,c] of [[-W+2.4,-2,'rgba(255,224,138,1)'],[W-2.4,1.2,'rgba(159,240,210,1)']] as const)glow(game.root,c,3,.1).position.set(x,1.6,z);
  for(const c of cabs)freeze(c.group,o=>c.live.includes(o));
  return {prizes,
    light(k:number,title?:string){const m=lit[k];if(!m||m.done)return;m.done=true;(m.face.material as T.MeshBasicMaterial).map=marqueeTex(title??m.title,true,k);(m.face.material as T.MeshBasicMaterial).needsUpdate=true;
      m.screen.material=hot(['#4a3a78','#2f5a6e','#5a2f58'][k%3],1.3);glow(game.root,'rgba(255,216,77,1)',1.8,.35).position.copy(m.at);game.burst(m.at,'#ffd84d',16,'confetti');},
    lightUp(){glow(game.root,'rgba(255,126,182,1)',6.5,.22).position.set(0,2.6,-D+1);pink.intensity=8;},
  };
}
