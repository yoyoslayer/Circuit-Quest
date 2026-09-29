// Overheating Arcade set dressing: a neon-pastel arcade hall. Warm plum carpet with confetti,
// cream walls, candy cabinets along the back wall (the five broken ones sit dark with OUT OF
// ORDER marquees until Pip signs them off), a row of working cabinets on the right wall, a neon
// sign, an LED basics poster, and the storeroom (planks, shelves) where the resistor tray waits.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,flat,INK,DMETAL} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pointLamp,lampPool,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';
import {JOBS} from './logic';

const PLUM='#3b2346',CREAM='#fbf3e2',PINK='#ff7eb6',MINT='#6fe0c0',LEMON='#ffd84d',GRAPE='#9b7bf0',SKY='#7cc8ff';
const FONT=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
export interface ArcadeRoom {light(k:number):void;lightUp():void}

const confetti=()=>TX.tex('arcade-carpet',512,512,c=>{
  c.fillStyle='#4a2a55';c.fillRect(0,0,512,512);const r=TX.rng(11);
  c.fillStyle='rgba(255,255,255,.035)';for(let y=0;y<512;y+=64)for(let x=0;x<512;x+=64)if((x+y)%128===0)c.fillRect(x,y,64,64);
  const cols=['#ff7eb6','#6fe0c0','#ffd84d','#9b7bf0','#7cc8ff','#ff9a6b'];
  for(let k=0;k<150;k++){const x=r()*512,y=r()*512,col=cols[k%cols.length];c.fillStyle=col;c.strokeStyle=col;c.save();c.translate(x,y);c.rotate(r()*6.3);
    const kind=k%4;if(kind===0){c.fillRect(-9,-3,18,6);}else if(kind===1){c.beginPath();c.arc(0,0,5,0,7);c.fill();}
    else if(kind===2){c.lineWidth=4;c.beginPath();c.moveTo(-10,0);c.quadraticCurveTo(-5,-7,0,0);c.quadraticCurveTo(5,7,10,0);c.stroke();}
    else{c.beginPath();c.moveTo(0,-7);c.lineTo(6,5);c.lineTo(-6,5);c.closePath();c.fill();}c.restore();}
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
  return {group:c,face,screen:scr};
}

export function dressArcade(game:Game,kit:RoomKit):ArcadeRoom{
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  kit.floor(-W,W,-D,D,confetti(),3.2);
  // Storeroom in the front-left corner: warm planks behind two short walls.
  kit.floor(-W,-6.4,2.6,D,TX.woodPlanks('#d8ad72'),3.2,.004);
  kit.interiorWall({id:'store-a',minX:-W,maxX:-8.6,minZ:2.45,maxZ:2.75},undefined,undefined,1.35);
  kit.interiorWall({id:'store-b',minX:-6.55,maxX:-6.25,minZ:2.45,maxZ:5.4},undefined,undefined,1.35);
  kit.backWindows(x=>Math.abs(x)<9.8,.1);
  rug(r,0,-1.2,5.6,2.2,PINK,'#ffd1e3');rug(r,5.4,2.6,3.2,2.4,GRAPE,'#e3d9ff');
  // ---- The five broken cabinets along the back wall (dark until signed off).
  const lit:{face:T.Mesh;screen:T.Mesh;at:T.Vector3;title:string}[]=[];
  const spots:[number,number][]=[[-7.8,-6.9],[-5.2,-6.9],[4.6,-6.9],[7.2,-6.9],[9.7,-3.2]];
  JOBS.forEach((j,k)=>{const [x,z]=spots[k],ry=k===4?-Math.PI/2:0,cab=cabinet(game.root,x,z,ry,['#ff9fc8','#9ff0d2','#ffe08a','#c7b6ff','#ffb38a'][k],j.cabinet,false,k);
    cab.group.updateMatrixWorld(true);solid(game,1,2.2,.9,x,1.1,z,ry);lit.push({face:cab.face,screen:cab.screen,at:cab.group.localToWorld(new T.Vector3(0,2.1,.4)),title:j.cabinet});
    // Each broken cabinet has a tell: a pinball table, a dance pad, a claw box, a handheld, a hopper.
    const g=cab.group;
    if(j.id==='bumper'){const t=group(g,0,0,.95);part(t,rbox(.8,.14,1.1,.05),toon('#ff9fc8'),0,.85,0);part(t,box(.7,.02,1),toon('#2a1c33'),0,.93,0);for(const [bx,bz] of [[-.18,-.2],[.18,-.2],[0,.05]] as const)part(t,cyl(.07,.07,.08,14),toon(PINK),bx,.97,bz);for(const [lx,lz] of [[-.33,-.48],[.33,-.48],[-.33,.48],[.33,.48]] as const)part(t,box(.06,.8,.06),toon(PLUM),lx,.4,lz);solid(game,.8,1,1.1,x,.5,z+.95);}
    if(j.id==='rhythm'){const p=group(g,0,0,1);part(p,rbox(1.1,.08,.9,.04),toon(PLUM),0,.04,0);[[0,-.24,'#ff7eb6'],[-.28,0,'#6fe0c0'],[.28,0,'#ffd84d'],[0,.24,'#7cc8ff']].forEach(([ax,az,col])=>part(p,rbox(.24,.03,.22,.04),toon(col as string),ax as number,.09,az as number));}
    if(j.id==='claw'){const b=group(g,0,0,.8);part(b,rbox(.9,.9,.8,.05),toon('#ffe08a'),0,.45,0);const glass=toon('#dff4ff',{opacity:.35});part(b,box(.84,.8,.74),glass,0,1.3,0,false);for(let n=0;n<7;n++)part(b,sphere(.1,12,8),toon([PINK,MINT,GRAPE,SKY,LEMON][n%5]),-.28+(n%4)*.18,1.0+Math.floor(n/4)*.12,-.18+(n%3)*.16);part(b,cyl(.012,.012,.3,6),toon(DMETAL),.1,1.55,0);solid(game,.9,1.8,.8,x,.9,z+.8);}
    if(j.id==='handheld'){const h=group(g,0,1.3,.6);h.rotation.x=-.2;part(h,rbox(.6,.95,.12,.08),toon('#c7b6ff'),0,0,0);part(h,box(.44,.36,.02),toon('#2a1c33'),0,.18,.065);part(h,cyl(.05,.05,.03,14,'z'),toon(PINK),.15,-.25,.065);part(h,box(.14,.04,.03),toon(INK),-.15,-.25,.065);part(h,box(.04,.14,.03),toon(INK),-.15,-.25,.065);}
    if(j.id==='hopper'){const s=group(g,0,0,.9);part(s,rbox(1.2,.9,.5,.05),toon('#ffb38a'),0,.45,0);for(let n=0;n<5;n++)part(s,sphere(.11,12,8),toon([PINK,MINT,LEMON,GRAPE,SKY][n]),-.44+n*.22,1.0,0);for(let n=0;n<6;n++)part(s,cyl(.05,.05,.015,14),toon('#d9a441'),-.3+n*.12,.92,.2);solid(game,.5,1,1.2,x-.9,.5,z);}
  });
  // ---- Working cabinets along the right wall and the left of the hall (the "too many lamps").
  [[9.7,-.6],[9.7,1.2],[9.7,3]].forEach(([x,z],k)=>{cabinet(game.root,x,z,-Math.PI/2,['#9ff0d2','#ff9fc8','#c7b6ff'][k],['STAR BLASTER','KART DASH','BLOCK DROP'][k],true,k);solid(game,.9,2.2,1,x,1.1,z,-Math.PI/2);});
  [[-9.9,-3.4],[-9.9,-1.5],[-9.9,.4]].forEach(([x,z],k)=>{cabinet(game.root,x,z,Math.PI/2,['#ffe08a','#9ff0d2','#ff9fc8'][k],['SNAKE','SPACE ROCKS','PONG'][k],true,k+1);solid(game,.9,2.2,1,x,1.1,z,Math.PI/2);});
  // ---- Back wall: the neon sign between the cabinets, and the LED basics poster.
  const bw=kit.back;
  const neon=new T.Mesh(new T.PlaneGeometry(4.6,.9),flat(canvasTex(1024,200,c=>{c.clearRect(0,0,1024,200);c.textAlign='center';c.textBaseline='middle';let fs=96;c.font=FONT(fs);while(c.measureText('OVERHEATING ARCADE').width>940){fs--;c.font=FONT(fs);}
    c.shadowColor=PINK;c.shadowBlur=26;c.lineWidth=8;c.strokeStyle=PINK;c.strokeText('OVERHEATING ARCADE',512,104);c.shadowBlur=0;c.fillStyle='#fff0f7';c.fillText('OVERHEATING ARCADE',512,104);}),{toneMapped:false}));
  neon.position.set(0,2.45,.2);bw.add(neon);part(bw,rbox(4.9,1.05,.08,.1),toon(PLUM),0,2.45,.15);glow(game.root,'rgba(255,126,182,1)',5,.18).position.set(0,2.4,-D+.8);
  const poster=group(bw,1.9,1.35,.16);part(poster,box(.84,1.12,.04),toon(INK));const pf=new T.Mesh(new T.PlaneGeometry(.78,1.06),toon('#ffffff',{map:basicsPoster()}));pf.position.z=.025;poster.add(pf);
  wallArt(bw,'bolt',-1.9,1.5,.16,0,.9);
  // Change machine and a prize shelf behind the bench (low, so the bench view stays clear).
  const cm=group(r,-1.2,0,-7.4);part(cm,rbox(.8,1.5,.6,.06),toon(SKY),0,.75,0);part(cm,box(.5,.3,.02),toon('#2a1c33'),0,1.1,.31);part(cm,box(.3,.06,.02),toon(LEMON),0,.7,.31);solid(game,.8,1.5,.6,-1.2,.75,-7.4);
  const ps=group(r,1.4,0,-7.5);part(ps,rbox(2,.9,.45,.05),toon(CREAM),0,.45,0);for(let n=0;n<6;n++)part(ps,sphere(.13,12,8),toon([PINK,MINT,LEMON,GRAPE,SKY,'#ff9a6b'][n]),-.8+n*.32,1.02,0);solid(game,2,1,.45,1.4,.5,-7.5);
  // ---- Side wall: a ticket counter mural and posters.
  const side=kit.side;
  const tick=new T.Mesh(new T.PlaneGeometry(3.4,.6),flat(plaque('WIN TICKETS · FIX CABINETS',900,160,LEMON,PLUM,64)));tick.position.set(2.2,2.2,.16);side.add(tick);
  wallArt(side,'sun',-2.4,1.9,.16);wallArt(side,'cat',5.6,1.9,.16);
  // ---- Storeroom: shelves of resistor stock and a counter where the tray waits.
  const shelf=group(r,-9.6,0,7.2);for(const y of [.5,1.2,1.9])part(shelf,box(2.4,.06,.6),toon('#a8734a'),0,y,0);for(const sx of [-1.15,1.15])part(shelf,box(.07,2,.6),toon(DMETAL),sx,1,0);
  for(let n=0;n<9;n++){const y=[.5,1.2,1.9][n%3],bx=-.8+Math.floor(n/3)*.8;part(shelf,rbox(.5,.22,.4,.04),toon(['#ffa6c9','#9ff0d2','#c7b6ff'][n%3]),bx,y+.14,0);}
  solid(game,2.4,2,.6,-9.6,1,7.2);
  const counter=group(r,-9.2,0,4.3);part(counter,rbox(1.6,.84,.8,.05),toon('#e9c38e'),0,.42,0);part(counter,box(1.64,.04,.84),toon(PLUM),0,.85,0);solid(game,1.6,.86,.8,-9.2,.43,4.3);
  const store=part(r,new T.PlaneGeometry(1.5,.36),flat(plaque('STOREROOM',512,124,GRAPE,'#fffaf0',60)),-7.6,2.1,2.8,false);store.rotation.y=0;
  // ---- Lights: warm over the bench, candy colours around the hall. No hanging lamps over the bench.
  pointLamp(game.root,0,2.7,-1.8,{color:'#fff1e0',intensity:5,distance:5.5});lampPool(game.root,0,-2.3,2.8,.2);
  pointLamp(game.root,-6.4,2.4,-5.4,{color:'#ff9fd0',intensity:4,distance:6});pointLamp(game.root,6.2,2.4,-5.4,{color:'#9ff0ff',intensity:4,distance:6});
  pointLamp(game.root,8.4,2.2,1.2,{color:'#c7b6ff',intensity:3.5,distance:6});pointLamp(game.root,-8.6,2.4,5.4,{color:'#ffe0b0',intensity:3,distance:5});
  for(const [x,z,c] of [[-8.6,-2,'rgba(255,224,138,1)'],[8.6,1.2,'rgba(159,240,210,1)']] as const)glow(game.root,c,3,.1).position.set(x,1.6,z);
  return {
    light(k:number){const m=lit[k];if(!m)return;(m.face.material as T.MeshBasicMaterial).map=marqueeTex(m.title,true,k);(m.face.material as T.MeshBasicMaterial).needsUpdate=true;
      m.screen.material=hot(['#4a3a78','#2f5a6e','#5a2f58'][k%3],1.3);glow(game.root,'rgba(255,216,77,1)',1.8,.35).position.copy(m.at);game.burst(m.at,'#ffd84d',16,'confetti');},
    lightUp(){glow(game.root,'rgba(255,126,182,1)',8,.3).position.set(0,2.6,-D+1);pointLamp(game.root,0,2.4,-5.6,{color:'#ffb3d9',intensity:8,distance:9});},
  };
}
