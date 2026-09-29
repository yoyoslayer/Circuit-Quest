// Signal Observatory set dressing: a night-blue dome with a starfield over a brass telescope,
// the receiver rack and its mast beside the signal bench, and a gallery of spectrum exhibits
// (radio → gamma) along the back wall with a plain safety note. Warm wood where Pip works.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,flat,DMETAL,INK} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pointLamp,lampPool,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';
import {C_LIGHT} from './logic';

const BRASS='#d6a24e',CREAM='#fbf3e2',VIOLET='#8b7be8',NIGHT='#1f2a52';
/** Where the receiver's cable leaves the rack (the motor's noise is measured from here). */
export const RX={x:-3.25,z:-2.45};

const starfield=(seed:number,w=1024,h=512,band=true)=>canvasTex(w,h,c=>{
  const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0d1333');g.addColorStop(.6,'#1c2a5e');g.addColorStop(1,'#34407a');c.fillStyle=g;c.fillRect(0,0,w,h);
  const r=TX.rng(seed);
  if(band){c.save();c.translate(w/2,h*.55);c.rotate(-.35);const mw=c.createLinearGradient(0,-h*.18,0,h*.18);mw.addColorStop(0,'rgba(180,170,255,0)');mw.addColorStop(.5,'rgba(200,190,255,.22)');mw.addColorStop(1,'rgba(180,170,255,0)');c.fillStyle=mw;c.fillRect(-w,-h*.18,w*2,h*.36);c.restore();}
  for(let k=0;k<700;k++){const x=r()*w,y=r()*h,s=r()<.06?2.4:r()<.3?1.4:.8;c.fillStyle=['#ffffff','#fff3c8','#cfe0ff','#ffd6e8'][Math.floor(r()*4)];c.globalAlpha=.5+r()*.5;c.beginPath();c.arc(x,y,s,0,7);c.fill();}
  c.globalAlpha=1;c.strokeStyle='rgba(255,214,107,.55)';c.lineWidth=2;
  // A couple of constellations with their lines, for the star-chart look.
  for(const pts of [[[.18,.2],[.24,.28],[.3,.25],[.36,.33],[.42,.3]],[[.66,.18],[.7,.3],[.78,.26],[.74,.14],[.66,.18]],[[.52,.62],[.58,.7],[.64,.66]]]){
    c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x*w,y*h):c.moveTo(x*w,y*h));c.stroke();for(const [x,y] of pts){c.fillStyle='#fff3c8';c.beginPath();c.arc(x*w,y*h,4,0,7);c.fill();}}
});

interface Band {name:string;lambda:number;example:string;color:string;safe:0|1|2}
// Wavelength of a typical example in each band (m); f = c/λ is printed from it.
const BANDS:Band[]=[
  {name:'RADIO',lambda:3,example:'FM radio',color:'#e5484d',safe:0},
  {name:'MICROWAVE',lambda:.125,example:'Wi-Fi, ovens',color:'#f08a4b',safe:1},
  {name:'INFRARED',lambda:1e-5,example:'body heat',color:'#e8b04a',safe:1},
  {name:'VISIBLE',lambda:5.5e-7,example:'your eyes',color:'#6cc58a',safe:0},
  {name:'ULTRAVIOLET',lambda:3e-7,example:'sunburn',color:'#8b7be8',safe:2},
  {name:'X-RAY',lambda:1e-9,example:'hospital scans',color:'#5b9cf0',safe:2},
  {name:'GAMMA',lambda:1e-12,example:'nuclear decay',color:'#3a3d55',safe:2},
];
const si=(v:number,unit:string)=>{const p:[number,string][]=[[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p']];
  for(const [k,s] of p)if(v>=k*.999)return `${+(v/k).toPrecision(2)} ${s}${unit}`;return `${v.toExponential(0)} ${unit}`;};
const SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';
const freqText=(hz:number)=>{if(hz<1e14)return si(hz,'Hz');const e=Math.floor(Math.log10(hz)+1e-9),m=+(hz/10**e).toFixed(1);return `${m}×10${String(e).split('').map(d=>SUP[+d]).join('')} Hz`;};
function bandPanel(b:Band,i:number){
  return canvasTex(256,360,c=>{
    c.fillStyle=CREAM;c.beginPath();c.roundRect(4,4,248,352,20);c.fill();c.lineWidth=6;c.strokeStyle=INK;c.stroke();
    c.fillStyle=b.color;c.beginPath();c.roundRect(14,14,228,56,14);c.fill();
    const font=(n:number,w=700)=>`${w} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
    c.fillStyle=b.safe===2&&i===6?'#fbf3e2':'#fffaf0';c.textAlign='center';let s=30;c.font=font(s);while(c.measureText(b.name).width>210){s--;c.font=font(s);}c.fillText(b.name,128,52);
    // The wave gets shorter band by band.
    c.strokeStyle=b.color;c.lineWidth=6;c.beginPath();const cycles=1+i*1.3;for(let x=24;x<=232;x+=2){const y=130+Math.sin((x-24)/208*cycles*Math.PI*2)*30;x>24?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
    c.fillStyle=INK;c.font=font(26);c.fillText(`λ ≈ ${si(b.lambda,'m')}`,128,200);c.font=font(22,600);c.fillStyle='#4a4e66';c.fillText(`f ≈ ${freqText(C_LIGHT/b.lambda)}`,128,232);c.fillText(b.example,128,264);
    const tag=[['#2f9a62','Non-ionising'],['#d9822b','Strong beams heat'],['#e5484d','Harmful: shield']][b.safe];
    c.fillStyle=tag[0];c.beginPath();c.roundRect(24,292,208,46,14);c.fill();c.fillStyle='#fffaf0';c.font=font(22);c.fillText(tag[1],128,323);
  });
}
function plaque(text:string,w:number,h:number,bg:string,fg=INK,size=40){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,22);c.fill();c.lineWidth=6;c.strokeStyle=fg;c.stroke();
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';let s=size;const f=(n:number)=>`700 ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;c.font=f(s);while(s>12&&c.measureText(text).width>w-40){s--;c.font=f(s);}c.fillText(text,w/2,h/2+2);});
}

export function dressObservatory(game:Game,kit:RoomKit){
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // Warm planks where Pip works; a night-blue tiled floor under the dome and the gallery.
  kit.floor(-W,W,-3.2,D,TX.woodPlanks('#dcb07a'),3.2);kit.floor(-W,W,-D,-3.2,TX.carpetTiles('#4b4f86'),2.4);
  rug(r,0,1.2,5.2,2.6,VIOLET,'#d9d0ff');rug(r,-6.4,3.6,3,2.2,'#d6a24e','#fbe7b8');
  // ---- The dome: a half-shell open to the room, painted inside with the night sky.
  const dx=-6.1,dz=-5.3,R=2.55;
  part(r,cyl(R+.25,R+.3,.14,40),toon('#c9b8f0'),dx,.07,dz);part(r,cyl(R+.05,R+.05,.02,40),toon(NIGHT),dx,.15,dz,false);solid(game,1.2,2,1.2,dx,1,dz);
  const skyMat=flat(starfield(7),{side:T.BackSide,transparent:false});
  const dome=new T.Mesh(new T.SphereGeometry(R,48,24,Math.PI,Math.PI,0,Math.PI/2),skyMat);dome.position.set(dx,.15,dz);dome.userData.noAO=true;game.root.add(dome);
  const shellOut=new T.Mesh(new T.SphereGeometry(R+.06,48,24,Math.PI,Math.PI,0,Math.PI/2),toon('#e9dcc0'));shellOut.material.side=T.FrontSide;shellOut.position.copy(dome.position);r.add(shellOut);
  part(r,new T.TorusGeometry(R+.03,.06,10,64,Math.PI),toon(BRASS),dx,.18,dz).rotation.set(Math.PI/2,0,Math.PI);
  // Telescope on its pier: cream pier, brass fork, a long tube aimed up through the slit.
  const scope=group(r,dx,.15,dz+.1);part(scope,cyl(.28,.36,1,20),toon(CREAM),0,.5,0);part(scope,cyl(.34,.34,.06,20),toon(BRASS),0,1.02,0);
  const fork=group(scope,0,1.05,0);for(const s of [-1,1])part(fork,box(.06,.55,.14),toon(BRASS),s*.3,.27,0);
  const tube=group(fork,0,.52,0);tube.rotation.x=-.75;part(tube,cyl(.2,.2,1.9,24),glossyToon('#f4efe6',{spec:.7,size:.97}),0,.3,0);part(tube,cyl(.23,.23,.12,24),toon(BRASS),0,1.22,0);part(tube,cyl(.21,.21,.08,24),toon(BRASS),0,-.6,0);
  part(tube,cyl(.05,.05,.35,12),toon(INK),.24,.4,0).rotation.z=.2;part(tube,cyl(.045,.045,.2,12,'z'),toon(BRASS),0,-.5,.2);
  glow(game.root,'rgba(160,150,255,1)',4,.1).position.set(dx,1.6,dz-1);pointLamp(game.root,dx,2.2,dz+.6,{color:'#b9b0ff',intensity:4,distance:5});
  // ---- The receiver rack and its rooftop mast, just left of the bench.
  const rack=group(r,RX.x-.3,0,RX.z-.2);part(rack,rbox(.9,1.5,.7,.06),toon(NIGHT),0,.75,0);part(rack,box(.92,.06,.72),toon(BRASS),0,1.52,0);
  for(let k=0;k<3;k++){part(rack,box(.74,.3,.02),toon('#2e3a6e'),0,.4+k*.38,.36,false);part(rack,cyl(.06,.06,.03,16,'z'),toon(CREAM),-.2,.4+k*.38,.375);
    for(let n=0;n<3;n++)part(game.root,sphere(.022,8,6),hot(['#8dffb0','#ffd66b','#7fd8ff'][(k+n)%3],1.8),RX.x-.3+.05+n*.1,.4+k*.38,RX.z-.2+.37,false);}
  part(rack,cyl(.04,.05,2.4,10),toon(DMETAL),.25,2.7,-.2);for(const [y,w] of [[3.2,.7],[3.5,.5],[3.75,.34]] as const)part(rack,cyl(.012,.012,w,6,'x'),toon('#dfe3ea'),.25,y,-.2);
  part(rack,sphere(.05,10,8),hot('#ff6b6b',2),.25,3.92,-.2);solid(game,.9,1.6,.7,RX.x-.3,.8,RX.z-.2);
  const plaq=part(r,new T.PlaneGeometry(.8,.2),flat(plaque('ROOF RECEIVER',512,128,'#ffd66b')),RX.x-.3,1.72,RX.z+.16,false);plaq.rotation.x=-.3;
  // ---- Spectrum gallery on the back wall: radio → gamma, one panel per band, with c = fλ.
  const x0=.4,step=1.28;
  BANDS.forEach((b,i)=>{const x=x0+i*step;part(kit.back,box(1.1,1.52,.05),toon(INK),x,1.9,.17);const f=new T.Mesh(new T.PlaneGeometry(1.02,1.44),flat(bandPanel(b,i)));f.position.set(x,1.9,.2);kit.back.add(f);
    part(kit.back,box(.3,.04,.12),toon(BRASS),x,2.74,.26);});
  const head=new T.Mesh(new T.PlaneGeometry(4.6,.42),flat(plaque('THE SPECTRUM: ONE WAVE, c = f × λ',1024,96,VIOLET,'#fffaf0')));head.position.set(x0+3*step,2.95,.2);kit.back.add(head);
  const warn=new T.Mesh(new T.PlaneGeometry(5.6,.34),flat(plaque('Not every band is safe: UV, X-rays and gamma rays damage living cells.',1400,84,'#ffe1dc','#7a1f22')));warn.position.set(x0+3*step,.9,.2);kit.back.add(warn);
  // A light rail over the gallery.
  part(r,box(9,.06,.1),toon(BRASS),x0+3*step,3.2,-D+.4);for(let i=0;i<7;i++)part(game.root,cyl(.05,.07,.1,10),hot('#fff1d6',1.6),x0+i*step,3.12,-D+.45,false);
  pointLamp(game.root,x0+1.5*step,2.6,-D+1.8,{color:'#fff1d6',intensity:4,distance:5.5});pointLamp(game.root,x0+5*step,2.6,-D+1.8,{color:'#fff1d6',intensity:4,distance:5.5});
  // Exhibit plinths in front of the gallery: a dish, a prism with its rainbow, a lead-lined box.
  const plinth=(x:number,z:number)=>{const g=group(r,x,0,z);part(g,rbox(.7,.9,.7,.06),toon(CREAM),0,.45,0);part(g,box(.74,.05,.74),toon(BRASS),0,.92,0);solid(game,.7,1,.7,x,.5,z);return g;};
  const dish=plinth(3.2,-6.3);const bowl=part(dish,new T.SphereGeometry(.34,24,12,0,Math.PI*2,0,Math.PI/2.6),toon('#dfe3ea'),0,1.3,0);bowl.rotation.x=Math.PI*.8;(bowl.material as T.Material).side=T.DoubleSide;part(dish,cyl(.03,.03,.36,8),toon(DMETAL),0,1.1,0);
  const prism=plinth(6.2,-6.3);const glass=part(prism,cyl(.2,.2,.3,3),toon('#cfefff',{opacity:.6}),0,1.1,0);glass.rotation.z=Math.PI/2;
  ['#e5484d','#f08a4b','#ffd66b','#6cc58a','#5b9cf0','#8b7be8'].forEach((c,k)=>{const b=part(prism,box(.4,.012,.035),toon(c),.35,1.1+k*.0,-.09+k*.036,false);b.rotation.y=-.35+k*.06;});
  const lead=plinth(9,-6.3);part(lead,rbox(.46,.36,.46,.05),toon('#6b7385'),0,1.13,0);part(lead,new T.PlaneGeometry(.3,.3),flat(plaque('☢',128,128,'#ffd66b',INK,80)),0,1.13,.235,false);
  // ---- Side wall: a big star chart mural and two posters.
  const mural=new T.Mesh(new T.PlaneGeometry(5.6,2.1),flat(starfield(21,1024,384,false)));mural.position.set(1.4,1.9,.16);kit.side.add(mural);part(kit.side,box(5.8,2.3,.04),toon(BRASS),1.4,1.9,.13);
  wallArt(kit.side,'sun',-3.4,1.9,.16);wallArt(kit.side,'mountain',5.6,1.9,.16);
  // Warm light over the bench (no hanging lamps in the bench camera's view).
  pointLamp(game.root,0,2.7,-1.6,{color:'#fff1d6',intensity:5,distance:5.5});lampPool(game.root,0,-2.2,2.6,.2);
  pointLamp(game.root,-4,2.4,3,{color:'#ffd9a8',intensity:3,distance:6});
  // When the last transmission is decoded, the dome's stars brighten.
  const lightUp=()=>{glow(game.root,'rgba(200,190,255,1)',6,.35).position.set(dx,1.8,dz-1.2);pointLamp(game.root,dx,1.8,dz,{color:'#c9c0ff',intensity:8,distance:8});};
  return {lightUp};
}
