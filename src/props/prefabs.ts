import * as T from 'three';
import {INK,METAL,DMETAL,CHAIRC,toon,rbox,box,cyl,sphere,ico,part,group,reel,wheels,handle,glyph,decal,cachedTexture,lit,cached} from '../render/kit';
import {screen,keyboardTex,SCREENS,type ScreenKind} from '../render/textures';
export type PropKind='box'|'desk'|'chair'|'monitor'|'mug'|'paper'|'plant'|'cabinet'|'sofa'|'bin'|'reel'|'coupler'|'coffee'|'cart'|'glass'|'printer'|'whiteboard'|'bookshelf'|'vending'|'cooler'|'pingpong'|'bridge'|'mop'|'tray'|'lamp'|'dolly'|'supply'|'capcart'|'coolbox'|'splitter'|'plug'|'wedge'|'beanbag'|'cone'|'strip';
/** variant picks a dressing (desk clutter, monitor screen); desks add 10 when the chair is on -z. */
export interface PropSpec {kind:PropKind;x:number;z:number;y?:number;color?:string;rotation?:number;id?:string;variant?:number}
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
  beanbag:{size:[.9,.6,.9],mass:4,cost:20,color:'#ffc94d'},cone:{size:[.5,.62,.5],mass:1,cost:3,color:'#ff8a3d'},strip:{size:[.9,.14,.26],mass:1.2,cost:8,color:'#ff8a3d'}
};
const templates=new Map<string,T.Group>();
/** Returns a copy of the prop's model; copies share geometry and materials so they batch. */
export function makeProp(kind:PropKind,color?:string,variant=0):T.Group{
  const key=`${kind}|${color??''}|${variant}`;let template=templates.get(key);
  if(!template){template=build(kind,color??prefabs[kind].color,variant);templates.set(key,template);}
  return template.clone();
}
const scribble=()=>cachedTexture('scribble',()=>glyph(c=>{c.strokeStyle='#3f7fd6';c.lineWidth=10;c.beginPath();c.moveTo(20,200);c.lineTo(80,120);c.lineTo(140,160);c.lineTo(230,40);c.stroke();c.strokeStyle='#e5484d';c.beginPath();c.arc(70,60,30,0,7);c.stroke();}));
const screenMaterials=new Map<string,T.MeshBasicMaterial>();
function screenMaterial(kind:ScreenKind){let m=screenMaterials.get(kind);if(!m){m=new T.MeshBasicMaterial({map:screen(kind)});m.color.setScalar(1.05);m.userData.outlineParameters={visible:false};screenMaterials.set(kind,m);}return m;}
/** Per-desk dressing (mockups/look/room.js deskClutter): keyboard, mouse, a personal item and a
 *  cable tail, on whichever side the chair is (variant >= 10 means the chair is on -z). */
function deskClutter(g:T.Group,top:number,variant:number){
  const c=new T.Group();c.rotation.y=variant>=10?Math.PI:0;g.add(c);const v=variant%10;
  part(c,box(.46,.025,.15),toon('#ffffff',{map:keyboardTex()}),-.05,top+.013,.2,false);part(c,rbox(.07,.03,.11,.03),toon('#e9e6dd'),.3,top+.015,.2,false);
  if(v===0){part(c,cyl(.05,.045,.1,8),toon('#e07a4f'),-.55,top+.05,-.05);for(const [dx,dy] of [[0,.07],[.02,.12]])part(c,cyl(.018,.022,.1,6),toon('#6cc58a'),-.55+dx,top+dy+.02,-.05);}
  if(v===1){const f=part(c,box(.14,.18,.02),toon(['#3f7fd6','#e5484d','#b392f0'][variant%3]),-.6,top+.09,-.1);f.rotation.set(-.2,.4,0);}
  if(v===2){part(c,cyl(.04,.04,.1,10),toon('#3a3d55'),-.62,top+.05,0);for(let k=0;k<3;k++)part(c,cyl(.006,.006,.14,4),toon(['#e5484d','#3f7fd6','#ffc94d'][k]),-.62+(k-1)*.015,top+.12,0,false).rotation.z=(k-1)*.2;}
  if(v===3)for(let k=0;k<3;k++)part(c,box(.24,.03,.17),toon(['#fffaf0','#e9f0f2','#ffe36e'][k]),-.5,top+.016+k*.03,.05,false).rotation.y=(k-1)*.2;
  if(v===4){const lamp=new T.Group();lamp.position.set(.62,top,-.18);lamp.rotation.y=-Math.PI/2-.5;c.add(lamp);const col=['#e5484d','#3f7fd6','#ffc94d','#6cc58a'][variant%4];
    part(lamp,cyl(.1,.12,.03,14),toon(INK),0,.015,0);part(lamp,cyl(.018,.018,.38,6),toon(col),0,.2,0).rotation.z=.35;part(lamp,cyl(.018,.018,.3,6),toon(col),.12,.42,0).rotation.z=-1;
    const sh=part(lamp,new T.ConeGeometry(.1,.16,14,1,true),toon(col),.26,.46,0);sh.rotation.z=2.3;}
  const tail=new T.CatmullRomCurve3([[0,top+.02,-.25],[.1,top-.05,-.36],[.18,.05,-.4],[.3,-top+.03,-.3],[.55,-top+.03,-.15]].map(p=>new T.Vector3(...p)));part(c,cached(`deskTail${top}`,()=>new T.TubeGeometry(tail,20,.014,5)),toon(INK),0,0,0,false);
}
const books=['#e5484d','#3f7fd6','#6cc58a','#ffc94d','#b392f0','#8fd3c8'];
function build(kind:PropKind,c:string,variant=0):T.Group{
  const g=new T.Group(),[w,h,d]=prefabs[kind].size,bottom=-h/2,m=toon(c);
  switch(kind){
    case 'box':{
      // A shipping carton: flap seam, a strip of parcel tape over the top and down both faces, a label.
      const dark=toon(new T.Color(c).offsetHSL(0,0,-.12).getStyle()),tape=toon('#e9d7a6');
      part(g,rbox(w,h,d,.04),m);part(g,box(w*.995,.012,.018),dark,0,h/2-.004,0);
      part(g,box(w*.2,.012,d*1.012),tape,0,h/2+.001,0);for(const s of [-1,1])part(g,box(w*.2,h*.32,.012),tape,0,h/2-h*.16,s*(d/2+.002));
      part(g,box(w*.36,h*.24,.01),toon('#fffaf0'),-w*.18,-h*.12,d/2+.004);for(const k of [0,1])part(g,box(w*.26,.012,.006),toon(INK),-w*.18,-h*.08-k*.05,d/2+.01,false);
      break;}
    case 'desk':
      part(g,rbox(w,.07,d,.05),m,0,h/2-.035);for(const s of [-1,1])part(g,box(.06,h-.07,d*.85),toon(METAL),s*(w/2-.08),-.035);
      part(g,rbox(.3,.45,d*.72,.05),toon('#d9d2c3'),w*.28,bottom+.25);deskClutter(g,h/2,variant);break;
    case 'chair':
    {
      // Task chair: padded seat and curved back on a stem, armrests, a gas lift and a five-star base on casters.
      const pad=toon(new T.Color(c).offsetHSL(0,0,.06).getStyle()),frame=toon(INK);
      part(g,rbox(.52,.06,.5,.06),frame,0,bottom+.43);part(g,rbox(.55,.09,.52,.12),m,0,bottom+.5);part(g,rbox(.42,.03,.4,.1),pad,0,bottom+.55,.02,false);
      part(g,box(.05,.28,.05),frame,0,bottom+.6,-.25);const back=part(g,rbox(.5,.46,.09,.1),m,0,bottom+.82,-.26);back.rotation.x=-.12;
      part(g,rbox(.38,.32,.02,.08),pad,0,bottom+.83,-.215,false).rotation.x=-.12;
      for(const s of [-1,1]){part(g,box(.04,.2,.04),frame,s*.27,bottom+.58,-.02);part(g,rbox(.07,.04,.26,.02),frame,s*.27,bottom+.69,.0);}
      part(g,cyl(.035,.035,.32,8),toon(METAL),0,bottom+.27);part(g,cyl(.05,.05,.1,8),frame,0,bottom+.16);
      for(let i=0;i<5;i++){const a=i/5*Math.PI*2;part(g,box(.3,.035,.05),frame,Math.cos(a)*.14,bottom+.08,Math.sin(a)*.14).rotation.y=-a;part(g,sphere(.035,8,6),frame,Math.cos(a)*.28,bottom+.035,Math.sin(a)*.28);}
      break;}
    case 'monitor':
      part(g,box(w,h*.8,.05),toon(INK),0,.05,-.04);part(g,new T.PlaneGeometry(w*.88,h*.64),screenMaterial(SCREENS[variant%SCREENS.length]),0,.05,-.013,false);
      if(variant%3===1)for(let k=0;k<2;k++)part(g,box(.07,.07,.005),toon(['#ffe36e','#f7a8c4'][k]),w*.36-k*.09,.2-k*.05,-.012,false).rotation.z=(k-.5)*.3;
      part(g,box(.06,h*.35,.06),toon(INK),0,bottom+.1,-.05);part(g,box(.3,.03,.15),toon(INK),0,bottom+.015,-.03);break;
    case 'mug':part(g,cyl(w*.42,w*.38,h,10),m,-w*.06);part(g,cyl(w*.33,w*.33,.012,10),toon('#6b4a2e'),-w*.06,h/2-.01);
      part(g,new T.TorusGeometry(h*.22,.012,8,16,Math.PI),m,w*.3,0,0).rotation.z=-Math.PI/2;break;
    case 'paper':part(g,box(w,h,d),m,0,0,0,false);break;
    case 'plant':
      part(g,cyl(.26,.2,.42,14),toon('#e07a4f'),0,bottom+.21);
      for(const [x,y,z,r] of [[0,.25,0,.27],[.14,.08,.08,.21],[-.14,.12,-.05,.22],[.02,.45,.04,.18]])part(g,ico(r),m,x,y,z);break;
    case 'cabinet':{
      // Four drawers, each a slightly proud front with a pull and a little label card.
      part(g,rbox(w,h,d*.96,.05),m,0,0,-d*.02);part(g,box(w*1.02,.04,d),toon(new T.Color(c).offsetHSL(0,0,-.08).getStyle()),0,h/2-.02);
      const front=toon(new T.Color(c).offsetHSL(0,0,.05).getStyle());
      for(let k=0;k<4;k++){const y=h/2-.24-k*.37;part(g,rbox(w*.88,.32,.03,.03),front,0,y,d/2-.01);part(g,box(.2,.035,.03),toon(INK),0,y+.05,d/2+.015);part(g,box(.13,.07,.01),toon('#fffaf0'),0,y-.07,d/2+.008);}
      break;}
    case 'sofa':
      part(g,rbox(w,.45,d*.9,.15),m,0,bottom+.35);part(g,rbox(w,.6,.25,.1),toon(new T.Color(c).offsetHSL(0,0,-.06).getStyle()),0,bottom+.75,-d/2+.13);
      for(const s of [-1,1])part(g,rbox(.3,.55,d*.9,.1),toon(new T.Color(c).offsetHSL(0,0,-.06).getStyle()),s*(w/2-.15),bottom+.55);break;
    case 'bin':
      part(g,cyl(w*.47,w*.38,h*.96,12),m,0,-h*.02);part(g,new T.TorusGeometry(w*.47,.016,8,24),toon(new T.Color(c).offsetHSL(0,0,.1).getStyle()),0,h/2-.02).rotation.x=Math.PI/2;
      part(g,cyl(w*.43,w*.43,.01,12),toon('#1d1f2b'),0,h/2-.04,0,false);
      for(const [x,z,r] of [[-.05,.03,.07],[.06,-.04,.06],[.01,.07,.05]] as const)part(g,ico(r),toon('#fffaf0'),x,h/2-.03,z);break;
    case 'reel':reel(g,0,0,0,'#f4efe6',c,.8);break;
    case 'coupler':case 'plug':
      part(g,cyl(.11,.13,.3,14,'x'),m);for(const dz of [-.05,.05])part(g,cyl(.022,.022,.14,8,'x'),toon('#e0b25a'),.2,0,dz);break;
    case 'splitter':
      // Three-way splitter: one inlet, three outlets, a socket face on top and a power lamp.
      part(g,rbox(w,h,d,.06),m);part(g,cyl(.06,.06,.08,10,'x'),toon(INK),-w/2-.02);for(const dz of [-.12,0,.12])part(g,cyl(.045,.045,.08,10,'x'),toon(INK),w/2+.02,0,dz);
      part(g,rbox(w*.62,.02,d*.7,.04),toon('#fff4cc'),.03,h/2+.005);for(const dz of [-.1,0,.1])part(g,box(.05,.012,.02),toon(INK),.06,h/2+.017,dz,false);
      part(g,sphere(.025,8,6),toon('#57e38f',{emissive:'#3fdc7f',ei:.6}),-w*.3,h/2+.01,d*.28,false);break;
    case 'coffee':part(g,rbox(w,h,d,.06),m);part(g,box(.2,.1,.1),toon('#e5484d'),0,-.1,d/2);part(g,cyl(.06,.05,.1,10),toon('#fffaf0'),0,bottom+.08,.12);break;
    case 'cart':
      // Mail cart: a lipped tray on four posts over a bottom shelf of parcels, push bar at one end.
      wheels(g,w*.4,d*.38,.07,bottom+.07);part(g,rbox(w*.94,.04,d*.9,.03),toon(METAL),0,bottom+.2);
      for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]] as const)part(g,cyl(.022,.022,h-.16,8),toon(METAL),x*w*.43,bottom+.16+(h-.16)/2,z*d*.4);
      part(g,rbox(w,.05,d,.04),m,0,h/2-.06);for(const z of [-1,1])part(g,box(w,.09,.035),m,0,h/2-.02,z*(d/2-.018));for(const x of [-1,1])part(g,box(.035,.09,d),m,x*(w/2-.018),h/2-.02,0);
      for(const [x,z,ww,hh,col] of [[-.3,-.08,.3,.18,'#c98f5a'],[.05,.1,.26,.14,'#d7a56d'],[.34,-.05,.22,.2,'#fffaf0']] as const)part(g,rbox(ww,hh,.24,.03),toon(col),x,bottom+.22+hh/2,z);
      handle(g,-w/2,h/2-.04,h/2+.25,d*.38);break;
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
    case 'beanbag':{
      // A slouched seat: a squashed base with a higher back lobe, a seam and a dimple where you sit.
      const dark=toon(new T.Color(c).offsetHSL(0,0,-.1).getStyle());
      part(g,sphere(.45,16,12),m,0,bottom+.21).scale.set(1,.48,1);
      part(g,sphere(.34,16,12),m,0,bottom+.36,-.16).scale.set(1.12,.72,.78);
      part(g,new T.TorusGeometry(.43,.018,8,32),dark,0,bottom+.2).rotation.x=Math.PI/2;
      part(g,sphere(.2,12,8),dark,0,bottom+.37,.08,false).scale.set(1,.18,1);
      break;}
    case 'strip':part(g,rbox(w,h,d,.05),m);for(let k=0;k<4;k++){part(g,rbox(.13,.02,.13,.03),toon('#fff6e6'),-.3+k*.19,h/2+.005,0,false);part(g,box(.02,.012,.05),toon(INK),-.33+k*.19,h/2+.02,0,false);part(g,box(.02,.012,.05),toon(INK),-.27+k*.19,h/2+.02,0,false);}part(g,cyl(.03,.03,.04,10),toon('#e5484d'),w/2-.06,h/2+.02,0);break;
    case 'cone':part(g,box(.5,.05,.5),m,0,bottom+.025);part(g,cyl(.03,.22,.56,14),m,0,.03);part(g,cyl(.12,.15,.1,14),toon('#fff6e6'),0,.06);break;
    case 'pingpong':
      part(g,rbox(w,.06,d,.04),m,0,h/2-.03);part(g,box(.04,.16,d),toon('#f4efe6'),0,h/2+.08);
      for(const [lx,lz] of [[-1,-1],[1,-1],[-1,1],[1,1]])part(g,box(.06,h-.06,.06),toon(INK),lx*(w/2-.2),-.03,lz*(d/2-.2));break;
    case 'bridge':{
      const geo=kindGeometry('bridge',()=>{const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-.25,h);s.lineTo(.25,h);s.lineTo(w/2,0);s.closePath();const e=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});e.translate(0,-h/2,-d/2);return e;});
      part(g,geo,m);part(g,box(.48,.02,d),toon(INK),0,h/2+.01);break;}
    case 'mop':{
      // Mop bucket on casters with a wringer, a bail handle, grey water and the mop stood in it.
      part(g,cyl(.27,.22,.42,18),m,0,bottom+.27);part(g,new T.TorusGeometry(.27,.02,8,24),toon(new T.Color(c).offsetHSL(0,0,.12).getStyle()),0,bottom+.48).rotation.x=Math.PI/2;
      part(g,cyl(.24,.24,.02,18),toon('#9fc7d6'),0,bottom+.43,0,false);
      for(const [x,z] of [[-.17,-.17],[.17,-.17],[-.17,.17],[.17,.17]] as const)part(g,sphere(.04,8,6),toon(INK),x,bottom+.04,z);
      part(g,rbox(.2,.16,.26,.03),toon('#ffc94d'),-.22,bottom+.56,0);
      part(g,new T.TorusGeometry(.27,.012,6,20,Math.PI),toon(DMETAL),0,bottom+.48).rotation.y=Math.PI/2;
      const mop=group(g,.08,bottom+.3,.02);mop.rotation.z=-.2;part(mop,cyl(.02,.02,1.3,8),toon('#a8734a'),0,.62,0);
      for(let k=0;k<7;k++){const a=k/7*Math.PI*2;part(mop,cyl(.022,.016,.2,6),toon('#f2ead8'),Math.cos(a)*.06,-.02,Math.sin(a)*.06).rotation.set(Math.sin(a)*.3,0,-Math.cos(a)*.3);}
      break;}
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
    case 'coolbox':{
      const lid=toon('#3bb2c9');part(g,rbox(w,h*.8,d,.1),m,0,-h*.1);part(g,rbox(w*1.04,h*.2,d*1.05,.1),lid,0,h/2-.06);
      part(g,box(w*1.005,.04,d*1.005),lid,0,-h*.05);for(const s of [-1,1]){part(g,box(.06,.1,.14),toon(DMETAL),s*(w/2+.02),h*.12,0);part(g,box(.14,.08,.03),toon('#fffaf0'),s*w*.28,h*.18,d/2+.02);}
      part(g,new T.TorusGeometry(.13,.02,6,16,Math.PI),toon(DMETAL),0,h/2+.04,0);break;}
    case 'wedge':{
      const geo=kindGeometry('wedge',()=>{const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.closePath();const e=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});e.translate(0,-h/2,-d/2);return e;});
      part(g,geo,m);
      // Rubber grip ribs across the slope.
      for(let k=1;k<5;k++){const x=-w/2+k*w/5,y=bottom+h*(x+w/2)/w;part(g,box(.035,.03,d*.9),toon(new T.Color(c).offsetHSL(0,0,-.15).getStyle()),x,y+.012,0,false).rotation.z=Math.atan2(h,w);}
      break;}
  }
  return g;
}
const kindGeometries=new Map<string,T.BufferGeometry>();
function kindGeometry(key:string,make:()=>T.BufferGeometry){let g=kindGeometries.get(key);if(!g){g=make();kindGeometries.set(key,g);}return g;}
