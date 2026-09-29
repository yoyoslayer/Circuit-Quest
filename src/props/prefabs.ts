import * as T from 'three';
import {INK,METAL,DMETAL,CHAIRC,toon,rbox,box,cyl,sphere,ico,part,reel,wheels,handle,glyph,decal,cachedTexture,lit} from '../render/kit';
export type PropKind='box'|'desk'|'chair'|'monitor'|'mug'|'paper'|'plant'|'cabinet'|'sofa'|'bin'|'reel'|'coupler'|'coffee'|'cart'|'glass'|'printer'|'whiteboard'|'bookshelf'|'vending'|'cooler'|'pingpong'|'bridge'|'mop'|'tray'|'lamp'|'dolly'|'supply'|'capcart'|'coolbox'|'splitter'|'plug'|'wedge'|'beanbag';
export interface PropSpec {kind:PropKind;x:number;z:number;y?:number;color?:string;rotation?:number;id?:string}
export interface Prefab {size:[number,number,number];mass:number;cost:number;color:string}
// size is the physics box; models below are drawn to fit inside it, centred on the origin.
export const prefabs:Record<PropKind,Prefab>={
  box:{size:[.7,.6,.7],mass:2,cost:5,color:'#c98f5a'},desk:{size:[1.6,.95,.85],mass:15,cost:80,color:'#f1ebe0'},
  chair:{size:[.62,.95,.62],mass:3,cost:25,color:'#3f7fd6'},monitor:{size:[.63,.48,.17],mass:1.5,cost:130,color:INK},
  mug:{size:[.16,.2,.16],mass:.15,cost:5,color:'#ffc94d'},paper:{size:[.3,.03,.23],mass:.05,cost:1,color:'#fffaf0'},
  plant:{size:[.58,1.25,.58],mass:2,cost:15,color:'#4caf50'},cabinet:{size:[.7,1.6,.7],mass:22,cost:110,color:'#aab3c2'},
  sofa:{size:[2.6,1.1,1.0],mass:30,cost:180,color:'#e5484d'},bin:{size:[.38,.48,.38],mass:.5,cost:8,color:'#3a3d55'},
  reel:{size:[.7,.7,.55],mass:2,cost:15,color:'#ffc94d'},coupler:{size:[.36,.24,.24],mass:.4,cost:4,color:'#56d2c6'},
  coffee:{size:[.55,.65,.55],mass:5,cost:90,color:INK},cart:{size:[1.2,.65,.75],mass:8,cost:50,color:'#5f8fa8'},
  glass:{size:[.12,2.6,2.5],mass:7,cost:250,color:'#bfe6f5'},printer:{size:[.85,1.0,.75],mass:15,cost:200,color:'#dcdfe6'},
  whiteboard:{size:[1.7,1.7,.2],mass:9,cost:65,color:'#fbfbf6'},bookshelf:{size:[2,1.8,.45],mass:24,cost:90,color:'#c7ccd6'},
  vending:{size:[1,2,.8],mass:45,cost:300,color:'#e5484d'},cooler:{size:[.6,1.25,.6],mass:9,cost:75,color:'#f4efe6'},
  pingpong:{size:[2.6,.9,1.5],mass:18,cost:80,color:'#3f9a6a'},bridge:{size:[1.8,.2,1.0],mass:3,cost:10,color:'#ffc94d'},
  mop:{size:[.6,1.5,.6],mass:1,cost:5,color:'#3f7fd6'},tray:{size:[.8,.15,.5],mass:1,cost:10,color:'#e5484d'},
  lamp:{size:[.65,1.5,.65],mass:3,cost:20,color:'#f7ecd0'},dolly:{size:[1.2,1.3,.9],mass:30,cost:40,color:DMETAL},
  supply:{size:[1.7,1.3,1.1],mass:40,cost:120,color:'#f2b93b'},capcart:{size:[1.6,1.2,1.0],mass:20,cost:150,color:'#3f7fd6'},
  coolbox:{size:[1.0,.6,.65],mass:6,cost:30,color:'#e9f0f2'},splitter:{size:[.5,.24,.4],mass:.6,cost:6,color:'#ffc94d'},
  plug:{size:[.3,.22,.22],mass:.2,cost:0,color:INK},wedge:{size:[.8,.35,.5],mass:2,cost:5,color:'#ffc94d'},
  beanbag:{size:[.9,.6,.9],mass:4,cost:20,color:'#ffc94d'}
};
const templates=new Map<string,T.Group>();
/** Returns a copy of the prop's model; copies share geometry and materials so they batch. */
export function makeProp(kind:PropKind,color?:string):T.Group{
  const key=`${kind}|${color??''}`;let template=templates.get(key);
  if(!template){template=build(kind,color??prefabs[kind].color);templates.set(key,template);}
  return template.clone();
}
const scribble=()=>cachedTexture('scribble',()=>glyph(c=>{c.strokeStyle='#3f7fd6';c.lineWidth=10;c.beginPath();c.moveTo(20,200);c.lineTo(80,120);c.lineTo(140,160);c.lineTo(230,40);c.stroke();c.strokeStyle='#e5484d';c.beginPath();c.arc(70,60,30,0,7);c.stroke();}));
const books=['#e5484d','#3f7fd6','#6cc58a','#ffc94d','#b392f0','#8fd3c8'];
function build(kind:PropKind,c:string):T.Group{
  const g=new T.Group(),[w,h,d]=prefabs[kind].size,bottom=-h/2,m=toon(c);
  switch(kind){
    case 'box':part(g,rbox(w,h,d,.05),m);part(g,box(w*1.01,h*.12,d*1.01),toon(new T.Color(c).offsetHSL(0,0,-.1).getStyle()),0,h*.2);break;
    case 'desk':
      part(g,rbox(w,.07,d,.05),m,0,h/2-.035);for(const s of [-1,1])part(g,box(.06,h-.07,d*.85),toon(METAL),s*(w/2-.08),-.035);
      part(g,rbox(.3,.45,d*.72,.05),toon('#d9d2c3'),w*.28,bottom+.25);part(g,box(.5,.03,.16),toon('#dcdfe6'),0,h/2+.015,d*.12);break;
    case 'chair':
      part(g,rbox(.55,.1,.55,.1),m,0,bottom+.48);part(g,rbox(.55,.5,.1,.08),m,0,bottom+.78,-.24);
      part(g,cyl(.03,.03,.4,8),toon(INK),0,bottom+.26);
      for(let i=0;i<5;i++){const a=i/5*Math.PI*2;part(g,box(.32,.04,.05),toon(INK),Math.cos(a)*.15,bottom+.05,Math.sin(a)*.15).rotation.y=-a;}break;
    case 'monitor':
      part(g,box(w,h*.8,.05),toon(INK),0,.05,-.04);part(g,box(w*.88,h*.64,.01),toon(c===INK?'#5b9cf0':c),0,.05,-.01,false);
      part(g,box(.06,h*.35,.06),toon(INK),0,bottom+.1,-.05);part(g,box(.3,.03,.15),toon(INK),0,bottom+.015,-.03);break;
    case 'mug':part(g,cyl(w/2,w*.45,h,10),m);part(g,cyl(w*.36,w*.36,.012,10),toon('#6b4a2e'),0,h/2+.002);break;
    case 'paper':part(g,box(w,h,d),m,0,0,0,false);break;
    case 'plant':
      part(g,cyl(.26,.2,.42,14),toon('#e07a4f'),0,bottom+.21);
      for(const [x,y,z,r] of [[0,.25,0,.27],[.14,.08,.08,.21],[-.14,.12,-.05,.22],[.02,.45,.04,.18]])part(g,ico(r),m,x,y,z);break;
    case 'cabinet':part(g,rbox(w,h,d,.05),m);for(const y of [-.45,0,.45])part(g,box(.2,.04,.02),toon(INK),0,y,d/2+.01);break;
    case 'sofa':
      part(g,rbox(w,.45,d*.9,.15),m,0,bottom+.35);part(g,rbox(w,.6,.25,.1),toon(new T.Color(c).offsetHSL(0,0,-.06).getStyle()),0,bottom+.75,-d/2+.13);
      for(const s of [-1,1])part(g,rbox(.3,.55,d*.9,.1),toon(new T.Color(c).offsetHSL(0,0,-.06).getStyle()),s*(w/2-.15),bottom+.55);break;
    case 'bin':part(g,cyl(w/2,w*.4,h,12),m);break;
    case 'reel':reel(g,0,0,0,'#f4efe6',c,.8);break;
    case 'coupler':case 'plug':
      part(g,cyl(.11,.13,.3,14,'x'),m);for(const dz of [-.05,.05])part(g,cyl(.022,.022,.14,8,'x'),toon('#e0b25a'),.2,0,dz);break;
    case 'splitter':
      part(g,rbox(w,h,d,.06),m);part(g,cyl(.06,.06,.08,10,'x'),toon(INK),-w/2-.02);for(const dz of [-.12,0,.12])part(g,cyl(.045,.045,.08,10,'x'),toon(INK),w/2+.02,0,dz);break;
    case 'coffee':part(g,rbox(w,h,d,.06),m);part(g,box(.2,.1,.1),toon('#e5484d'),0,-.1,d/2);part(g,cyl(.06,.05,.1,10),toon('#fffaf0'),0,bottom+.08,.12);break;
    case 'cart':
      part(g,rbox(w,.08,d,.05),toon(METAL),0,bottom+.35);part(g,rbox(w,.28,d,.05),m,0,bottom+.56);wheels(g,w*.4,d*.4,.07,bottom+.07);
      for(let k=0;k<4;k++)part(g,box(.25,.16,.22),toon(['#c98f5a','#fffaf0','#d7a56d','#c98f5a'][k]),-w*.32+k*.22,h/2-.05,0);break;
    case 'glass':
      part(g,box(.06,h,d),toon(c,{opacity:.3}),0,0,0,false);part(g,box(.1,.08,d),toon(DMETAL),0,h/2-.04);part(g,box(.1,.1,d),toon(DMETAL),0,bottom+.05);break;
    case 'printer':part(g,rbox(w,h*.85,d,.08),m,0,-h*.075);part(g,box(w*.75,.08,d*.55),toon(INK),0,h/2-.1,.05);part(g,box(w*.6,.04,d*.45),toon('#fffaf0'),0,.02,d/2);break;
    case 'whiteboard':
      part(g,box(w*.94,1.0,.06),toon(c),0,h/2-.55);part(g,box(w,.06,.1),toon(METAL),0,h/2-1.06);
      for(const s of [-1,1]){part(g,box(.05,h,.05),toon(METAL),s*w*.47);part(g,box(.05,.05,d*2.5),toon(METAL),s*w*.47,bottom+.03);}
      decal(g,scribble(),w*.82,.88,0,h/2-.55,.04);break;
    case 'bookshelf':
      for(const [px,pz] of [[-1,-1],[1,-1],[-1,1],[1,1]])part(g,box(.07,h,.07),toon(METAL),px*(w/2-.04),0,pz*(d/2-.04));
      for(const y of [-.6,0,.6]){part(g,box(w,.06,d),toon(c),0,y);for(let k=0;k<7;k++)part(g,box(.14,.34,d*.7),toon(books[((k+Math.round(y*5))%books.length+books.length)%books.length]),-w/2+.25+k*.24,y+.2);}break;
    case 'vending':
      part(g,rbox(w,h,d,.08),m);part(g,box(w*.66,h*.62,.05),toon('#bfeaf5'),-w*.08,h*.12,d/2);
      for(let i=0;i<9;i++)part(g,box(.14,.14,.02),toon(CHAIRC[i%6]),-w*.3+(i%3)*.2,-.05+Math.floor(i/3)*.33,d/2+.03,false);break;
    case 'cooler':part(g,rbox(w*.85,h*.75,w*.85,.06),m,0,bottom+h*.375);part(g,cyl(.2,.2,h*.3,16),toon('#8fd0f0',{opacity:.8}),0,h/2-h*.15,0,false);break;
    case 'beanbag':part(g,sphere(.5,16,12),m).scale.set(.9,.6,.9);break;
    case 'pingpong':
      part(g,rbox(w,.06,d,.04),m,0,h/2-.03);part(g,box(.04,.16,d),toon('#f4efe6'),0,h/2+.08);
      for(const [lx,lz] of [[-1,-1],[1,-1],[-1,1],[1,1]])part(g,box(.06,h-.06,.06),toon(INK),lx*(w/2-.2),-.03,lz*(d/2-.2));break;
    case 'bridge':{
      const geo=kindGeometry('bridge',()=>{const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-.25,h);s.lineTo(.25,h);s.lineTo(w/2,0);s.closePath();const e=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});e.translate(0,-h/2,-d/2);return e;});
      part(g,geo,m);part(g,box(.48,.02,d),toon(INK),0,h/2+.01);break;}
    case 'mop':part(g,cyl(.3,.24,.46,18),m,0,bottom+.23);part(g,cyl(.25,.25,.04,18),toon('#7cc4ea'),0,bottom+.45,0,false);part(g,cyl(.03,.03,1.4,8),toon('#a8734a'),.18,.05).rotation.z=-.22;break;
    case 'tray':part(g,rbox(w,.05,d,.05),m,0,bottom+.03);for(const x of [-.22,.02,.26])part(g,sphere(.1,12,8),toon('#f2d08a'),x,bottom+.06,0).scale.y=.6;break;
    case 'lamp':
      part(g,cyl(.24,.3,.08,18),toon(INK),0,bottom+.04);part(g,cyl(.03,.03,1.1,8),toon('#a8734a'),0,bottom+.6);
      part(g,cyl(.18,.32,.34,18,'y'),toon(c),0,h/2-.25);break;
    case 'dolly':
      part(g,rbox(w,.1,d,.06),toon(DMETAL),0,bottom+.28);wheels(g,w*.38,d*.38,.12,bottom+.12);handle(g,-w/2,bottom+.3,bottom+1.3,d*.33);
      reel(g,.05,bottom+.85,0,INK,'#ffc94d',1.05);break;
    case 'supply':{
      part(g,rbox(w,.14,d,.08),toon(METAL),0,bottom+.36);wheels(g,w*.38,d*.38,.15,bottom+.15);
      part(g,rbox(w*.75,.8,d*.85,.14),m,.05,bottom+.83);handle(g,-w/2,bottom+.42,bottom+1.2,d*.38);
      decal(g,cachedTexture('bolt',()=>glyph(c=>{c.beginPath();c.moveTo(150,20);c.lineTo(70,140);c.lineTo(125,140);c.lineTo(100,236);c.lineTo(190,104);c.lineTo(134,104);c.closePath();c.fill();})),.36,.36,-.15,bottom+.85,d*.43+.01);
      part(g,cyl(.1,.1,.12,12),toon('#d63a3f'),w*.33,bottom+1.28,-d*.25);
      for(const dz of [-.2,.2])part(g,cyl(.09,.09,.12,12,'x'),toon(INK),w*.44,bottom+.9,dz);break;}
    case 'capcart':
      part(g,rbox(w,.14,d,.08),toon(METAL),0,bottom+.36);wheels(g,w*.38,d*.38,.15,bottom+.15);handle(g,-w/2,bottom+.42,bottom+1.2,d*.4);
      for(const [cx,cz] of [[-.4,-.22],[.1,-.22],[.1,.22],[-.4,.22]]){part(g,cyl(.22,.22,.72,20),m,cx,bottom+.8,cz);part(g,cyl(.22,.22,.06,20),toon('#c7ccd6'),cx,bottom+1.18,cz);}
      part(g,rbox(.36,.5,.85,.06),toon(INK),.55,bottom+.68);part(g,box(.05,.08,.5),lit('#57e38f','#3fdc7f'),.74,bottom+.8,0,false);break;
    case 'coolbox':part(g,rbox(w,h*.85,d,.1),m,0,-h*.075);part(g,rbox(w*1.04,h*.2,d*1.05,.1),toon('#3bb2c9'),0,h/2-.06);break;
    case 'wedge':{
      const geo=kindGeometry('wedge',()=>{const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.closePath();const e=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});e.translate(0,-h/2,-d/2);return e;});
      part(g,geo,m);break;}
  }
  return g;
}
const kindGeometries=new Map<string,T.BufferGeometry>();
function kindGeometry(key:string,make:()=>T.BufferGeometry){let g=kindGeometries.get(key);if(!g){g=make();kindGeometries.set(key,g);}return g;}
