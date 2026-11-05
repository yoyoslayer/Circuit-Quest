import * as T from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {INK,METAL,DMETAL,CHAIRC,toon,rbox,box,cyl,sphere,ico,part,group,reel,wheels,handle,glyph,decal,cachedTexture,lit,cached,stripes} from '../render/kit';
import {hot} from '../render/actors';
import {screen,keyboardTex,SCREENS,type ScreenKind} from '../render/textures';
export type PropKind='box'|'desk'|'chair'|'monitor'|'mug'|'paper'|'plant'|'cabinet'|'sofa'|'bin'|'reel'|'coupler'|'coffee'|'cart'|'glass'|'printer'|'whiteboard'|'bookshelf'|'vending'|'cooler'|'pingpong'|'bridge'|'mop'|'tray'|'lamp'|'dolly'|'supply'|'capcart'|'coolbox'|'splitter'|'plug'|'wedge'|'beanbag'|'cone'|'strip'|'pin'|'stool';
/** variant picks a dressing (desk clutter, monitor screen); desks add 10 when the chair is on -z. */
export interface PropSpec {kind:PropKind;x:number;z:number;y?:number;color?:string;rotation?:number;id?:string;variant?:number}
/** One piece of a prop's physics shape, in the prop's local frame (centred on the origin).
 *  box: half extents; cyl/cone: half height and radius (y axis unless `axis`); rcyl: a cylinder
 *  with rounded rims (`round` m). With no `collider` the prop is one box of `size`. */
export type ColliderPart={shape:'box';half:[number,number,number];at?:[number,number,number]}
  |{shape:'cyl'|'cone';hh:number;r:number;at?:[number,number,number];axis?:'x'|'z'}
  |{shape:'rcyl';hh:number;r:number;round:number;at?:[number,number,number]};
export interface Prefab {size:[number,number,number];mass:number;cost:number;color:string;collider?:ColliderPart[]}
// size is the physics box; models below are drawn to fit inside it, centred on the origin.
// Round props get round colliders (DR-71) so they tip and roll like their models.
export const prefabs:Record<PropKind,Prefab>={
  box:{size:[.7,.6,.7],mass:2,cost:5,color:'#c98f5a'},desk:{size:[1.6,.95,.85],mass:15,cost:80,color:'#f1ebe0'},
  chair:{size:[.62,.95,.62],mass:3,cost:25,color:'#3f7fd6'},monitor:{size:[.63,.48,.17],mass:1.5,cost:130,color:INK},
  mug:{size:[.16,.2,.16],mass:.15,cost:5,color:'#f4efe6'},paper:{size:[.3,.03,.23],mass:.05,cost:1,color:'#fffaf0'},
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
  beanbag:{size:[.9,.6,.9],mass:4,cost:20,color:'#e07a4f'},cone:{size:[.5,.62,.5],mass:1,cost:3,color:'#ff8a3d'},strip:{size:[.9,.14,.26],mass:1.2,cost:8,color:'#ff8a3d'},
  // A bowling pin (Playground bonus): tall and narrow on a small foot, so it topples when struck.
  pin:{size:[.26,.7,.26],mass:1.5,cost:3,color:'#fffaf0'},
  // An arcade bar stool: round padded seat on a post, foot ring, weighted base.
  stool:{size:[.45,.75,.45],mass:2.5,cost:15,color:'#e5484d'}
};
// Round and hollow props: shapes that follow the model instead of its bounding box.
const C:Partial<Record<PropKind,ColliderPart[]>>={
  bin:[{shape:'cyl',hh:.24,r:.18}],mug:[{shape:'cyl',hh:.1,r:.07}],plant:[{shape:'cyl',hh:.625,r:.27}],
  cone:[{shape:'box',half:[.25,.025,.25],at:[0,-.285,0]},{shape:'cone',hh:.28,r:.22,at:[0,.03,0]}],
  pin:[{shape:'cyl',hh:.35,r:.1}],stool:[{shape:'cyl',hh:.375,r:.21}],
  beanbag:[{shape:'rcyl',hh:.25,r:.4,round:.05}],
  lamp:[{shape:'cyl',hh:.04,r:.3,at:[0,-.71,0]},{shape:'cyl',hh:.55,r:.05,at:[0,-.15,0]},{shape:'cyl',hh:.17,r:.32,at:[0,.5,0]}],
  // Monitor: the panel plus its stand, so papers and pens can sit beside the foot.
  monitor:[{shape:'box',half:[.315,.192,.03],at:[0,.05,-.04]},{shape:'box',half:[.15,.05,.075],at:[0,-.19,-.03]}]
};
for(const [k,c] of Object.entries(C))prefabs[k as PropKind].collider=c;
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
  // Variant 5 is a bare counter top (the coffee desk): no keyboard or mouse under an appliance.
  if(v!==5){part(c,box(.46,.025,.15),toon('#ffffff',{map:keyboardTex()}),-.05,top+.013,.2,false);part(c,rbox(.07,.03,.11,.03),toon('#e9e6dd'),.3,top+.015,.2,false);}
  if(v===0){part(c,cyl(.05,.045,.1,8),toon('#e07a4f'),-.55,top+.05,-.05);for(const [dx,dy] of [[0,.07],[.02,.12]])part(c,cyl(.018,.022,.1,6),toon('#6cc58a'),-.55+dx,top+dy+.02,-.05);}
  if(v===1){const f=part(c,box(.14,.18,.02),toon(['#3f7fd6','#e5484d','#b392f0'][variant%3]),-.6,top+.09,-.1);f.rotation.set(-.2,.4,0);}
  if(v===2){part(c,cyl(.04,.04,.1,10),toon('#3a3d55'),-.62,top+.05,0);for(let k=0;k<3;k++)part(c,cyl(.006,.006,.14,4),toon(['#e5484d','#3f7fd6','#6cc58a'][k]),-.62+(k-1)*.015,top+.12,0,false).rotation.z=(k-1)*.2;}
  if(v===3)for(let k=0;k<3;k++)part(c,box(.24,.03,.17),toon(['#fffaf0','#e9f0f2','#bfe3f5'][k]),-.5,top+.016+k*.03,.05,false).rotation.y=(k-1)*.2;
  if(v===4){const lamp=new T.Group();lamp.position.set(.62,top,-.18);lamp.rotation.y=-Math.PI/2-.5;c.add(lamp);const col=['#e5484d','#3f7fd6','#b392f0','#6cc58a'][variant%4];
    part(lamp,cyl(.1,.12,.03,14),toon(INK),0,.015,0);part(lamp,cyl(.018,.018,.38,6),toon(col),0,.2,0).rotation.z=.35;part(lamp,cyl(.018,.018,.3,6),toon(col),.12,.42,0).rotation.z=-1;
    const sh=part(lamp,new T.ConeGeometry(.1,.16,14,1,true),toon(col),.26,.46,0);sh.rotation.z=2.3;}
  const tail=new T.CatmullRomCurve3([[0,top+.02,-.25],[.1,top-.05,-.36],[.18,.05,-.4],[.3,-top+.03,-.3],[.55,-top+.03,-.15]].map(p=>new T.Vector3(...p)));part(c,cached(`deskTail${top}`,()=>new T.TubeGeometry(tail,20,.014,5)),toon(INK),0,0,0,false);
}
// Desaturated book spines (DR-51), none near job yellow (R5-101/339).
const books=['#c46a6a','#6f8fb8','#7fa58a','#c9a46a','#9a88b8','#86b5ae'];
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
      if(variant%3===1)for(let k=0;k<2;k++)part(g,box(.07,.07,.005),toon(['#9fd8c8','#f7a8c4'][k]),w*.36-k*.09,.2-k*.05,-.012,false).rotation.z=(k-.5)*.3;
      part(g,box(.06,h*.35,.06),toon(INK),0,bottom+.1,-.05);part(g,box(.3,.03,.15),toon(INK),0,bottom+.015,-.03);
      // Rear housing bump with an off-white logo dot, so the back reads from an orbit.
      part(g,rbox(w*.5,h*.4,.04,.03),toon('#3a3d55'),0,.06,-.083);part(g,cyl(.025,.025,.008,10,'z'),toon('#e9e6dd'),0,.1,-.104,false);break;
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
      // Finished back and sides (DR-63): panel seams at the drawer lines, an inventory sticker,
      // an ink kick plate, and a recessed side panel each side.
      const seam=toon(new T.Color(c).offsetHSL(0,0,-.14).getStyle()),inset=toon(new T.Color(c).offsetHSL(0,0,-.05).getStyle());
      for(let k=1;k<4;k++)part(g,box(w*.9,.015,.01),seam,0,h/2-.055-k*.37,-d/2-.004,false);
      part(g,box(.12,.08,.01),toon('#fffaf0'),w*.22,h/2-.2,-d/2-.006,false);part(g,box(w*.98,.06,.02),toon(INK),0,bottom+.03,-d/2+.005);
      for(const s of [-1,1])part(g,box(.008,h*.8,d*.7),inset,s*(w/2+.002),0,-d*.02,false);
      break;}
    case 'sofa':{
      // Sofa on a plinth and four feet: three seat cushions, three leaning back cushions, full-height
      // arms, and a seam across the back so the 2.6 m back face isn't one flat slab.
      const dark=toon(new T.Color(c).offsetHSL(0,0,-.06).getStyle()),deep=toon(new T.Color(c).offsetHSL(0,0,-.16).getStyle()),pad=toon(new T.Color(c).offsetHSL(0,0,.05).getStyle());
      for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]] as const)part(g,cyl(.035,.03,.08,10),toon(INK),x*(w/2-.2),bottom+.04,z*(d/2-.15));
      part(g,rbox(w*.96,.1,d*.86,.04),deep,0,bottom+.13);part(g,rbox(w-.5,.2,d*.82,.06),m,0,bottom+.28,.02);
      for(const x of [-.68,0,.68]){part(g,rbox(.66,.18,d*.62,.06),pad,x,bottom+.47,.1);part(g,rbox(.64,.38,.14,.06),pad,x,bottom+.76,-d/2+.32).rotation.x=-.12;}
      part(g,rbox(w,.92,.25,.1),dark,0,bottom+.64,-d/2+.13);
      for(const s of [-1,1])part(g,rbox(.3,.72,d*.9,.1),dark,s*(w/2-.15),bottom+.44);
      part(g,box(w*.94,.03,.01),deep,0,bottom+.64,-d/2-.002,false);part(g,box(w*.94,.03,.01),deep,0,bottom+.9,-d/2-.002,false);
      break;}
    case 'bin':
      part(g,cyl(w*.47,w*.38,h*.96,12),m,0,-h*.02);part(g,new T.TorusGeometry(w*.47,.016,8,24),toon(new T.Color(c).offsetHSL(0,0,.1).getStyle()),0,h/2-.02).rotation.x=Math.PI/2;
      part(g,cyl(w*.43,w*.43,.01,12),toon('#1d1f2b'),0,h/2-.04,0,false);
      for(const [x,z,r] of [[-.05,.03,.07],[.06,-.04,.06],[.01,.07,.05]] as const)part(g,ico(r),toon('#fffaf0'),x,h/2-.03,z);break;
    case 'reel':reel(g,0,0,0,'#f4efe6',c,.8);break;
    case 'plug':
      // The cable's male plug: an ink body with a job-yellow band and two brass prongs.
      part(g,cyl(.11,.13,.3,14,'x'),toon(INK));part(g,cyl(.135,.135,.06,14,'x'),toon('#ffc94d'),-.04);for(const dz of [-.05,.05])part(g,cyl(.022,.022,.14,8,'x'),toon('#e0b25a'),.2,0,dz);break;
    case 'coupler':
      // A female-to-male joiner: a yellow barrel with ink bands, a socket face (two slots) on one
      // end and prongs on the other, so it reads as the part that lets two cables meet.
      part(g,cyl(.12,.12,.34,14,'x'),m);for(const x of [-.1,.1])part(g,cyl(.125,.125,.025,14,'x'),toon(INK),x);
      part(g,cyl(.1,.1,.02,14,'x'),toon('#fff6e6'),-.18);for(const dz of [-.04,.04])part(g,box(.012,.05,.02),toon(INK),-.19,0,dz,false);
      for(const dz of [-.05,.05])part(g,cyl(.022,.022,.14,8,'x'),toon('#e0b25a'),.24,0,dz);break;
    case 'splitter':
      // Three-way splitter: one inlet, three outlets, a socket face on top and a power lamp.
      part(g,rbox(w,h,d,.06),m);part(g,cyl(.06,.06,.08,10,'x'),toon(INK),-w/2-.02);for(const dz of [-.12,0,.12])part(g,cyl(.045,.045,.08,10,'x'),toon(INK),w/2+.02,0,dz);
      part(g,rbox(w*.62,.02,d*.7,.04),toon('#fff4cc'),.03,h/2+.005);for(const dz of [-.1,0,.1])part(g,box(.05,.012,.02),toon(INK),.06,h/2+.017,dz,false);
      part(g,sphere(.025,8,6),toon('#57e38f',{emissive:'#3fdc7f',ei:.6}),-w*.3,h/2+.01,d*.28,false);break;
    case 'coffee':{
      // Espresso machine: a cream tower at the back with a water tank on top, an overhanging head
      // with an ink control panel, a spout, and a cup standing on the metal drip tray.
      const body=toon('#dcdfe6'),ink=toon(INK);
      part(g,rbox(w,h*.8,d*.45,.05),body,0,bottom+h*.4,-d*.275);
      part(g,rbox(w*.7,h*.2-.01,d*.32,.03),toon('#8fd0f0',{opacity:.7}),0,h/2-h*.1,-d*.3,false);part(g,box(w*.72,.02,d*.34),toon(DMETAL),0,h*.3+.005,-d*.3);
      part(g,rbox(w*.94,.14,d*.55,.05),body,0,h*.3-.07,d*.1);part(g,box(w*.8,.1,.012),ink,0,h*.3-.07,d*.375+.006,false);
      part(g,cyl(.035,.035,.02,12,'z'),toon('#e5484d'),-.12,h*.3-.07,d*.375+.014);part(g,sphere(.018,8,6),lit('#57e38f','#3fdc7f'),.12,h*.3-.07,d*.375+.014,false);
      part(g,cyl(.03,.02,.07,10),toon(METAL),0,h*.3-.175,d*.2);
      part(g,rbox(w*.8,.05,d*.5,.02),toon(METAL),0,bottom+.025,d*.2);for(const k of [-1,0,1])part(g,box(w*.6,.008,.012),ink,0,bottom+.052,d*.2+k*.06,false);
      part(g,cyl(.05,.045,.09,12),toon('#fffaf0'),0,bottom+.095,d*.2);part(g,cyl(.044,.044,.006,12),toon('#6b4a2e'),0,bottom+.137,d*.2,false);
      part(g,new T.TorusGeometry(.028,.009,6,12),toon('#fffaf0'),.06,bottom+.095,d*.2).rotation.y=Math.PI/2;
      // Back: a vent grille and a power cord stub, so the machine has a finished rear.
      for(let k=0;k<4;k++)part(g,box(w*.5,.015,.01),ink,0,bottom+.15+k*.05,-d/2-.002,false);
      break;}
    case 'cart':
      // Mail cart: a lipped tray on four posts over a bottom shelf of parcels, push bar at one end.
      wheels(g,w*.4,d*.38,.07,bottom+.07);part(g,rbox(w*.94,.04,d*.9,.03),toon(METAL),0,bottom+.2);
      for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]] as const)part(g,cyl(.022,.022,h-.16,8),toon(METAL),x*w*.43,bottom+.16+(h-.16)/2,z*d*.4);
      part(g,rbox(w,.05,d,.04),m,0,h/2-.06);for(const z of [-1,1])part(g,box(w,.09,.035),m,0,h/2-.02,z*(d/2-.018));for(const x of [-1,1])part(g,box(.035,.09,d),m,x*(w/2-.018),h/2-.02,0);
      for(const [x,z,ww,hh,col] of [[-.3,-.08,.3,.18,'#c98f5a'],[.05,.1,.26,.14,'#d7a56d'],[.34,-.05,.22,.2,'#fffaf0']] as const)part(g,rbox(ww,hh,.24,.03),toon(col),x,bottom+.22+hh/2,z);
      handle(g,-w/2+.1,h/2-.04,h/2+.25,d*.38);break;
    case 'glass':
      part(g,box(.06,h,d),toon(c,{opacity:.3}),0,0,0,false);part(g,box(.1,.08,d),toon(DMETAL),0,h/2-.04);part(g,box(.1,.1,d),toon(DMETAL),0,bottom+.05);break;
    case 'printer':{
      // Office copier: scanner lid, an output tray with printed sheets, a control panel with a
      // green lamp, a paper drawer with a pull, and a vented back with a power socket.
      const ink=toon(INK),seam=toon(new T.Color(c).offsetHSL(0,0,-.14).getStyle()),top=h*.35;
      part(g,rbox(w,h*.85,d,.08),m,0,-h*.075);part(g,rbox(w*.8,.06,d*.42,.03),ink,0,top+.03,-d*.22);
      const tray=part(g,rbox(w*.6,.03,d*.32,.015),toon('#c7ccd6'),-.06,top+.02,d*.2);tray.rotation.x=.1;
      for(let k=0;k<3;k++)part(g,box(w*.5,.008,d*.24),toon('#fffaf0'),-.06+k*.01,top+.04+k*.009,d*.2-k*.01,false).rotation.x=.1;
      part(g,rbox(.18,.04,.1,.02),ink,w*.33,top+.02,d*.32);part(g,sphere(.016,8,6),lit('#57e38f','#3fdc7f'),w*.36,top+.045,d*.34,false);
      part(g,box(w*.6,.03,d*.2),toon('#fffaf0'),0,.02,d/2-.04);
      part(g,box(w*.94,.012,.01),seam,0,-.12,d/2+.003,false);part(g,box(w*.94,.012,.01),seam,0,-.38,d/2+.003,false);part(g,box(.22,.03,.03),ink,0,-.25,d/2+.012);
      part(g,rbox(w*.5,.18,.02,.01),toon(DMETAL),0,0,-d/2-.008);for(let k=0;k<4;k++)part(g,box(w*.42,.012,.008),ink,0,-.06+k*.04,-d/2-.02,false);
      part(g,box(.07,.07,.012),ink,w*.3,-.3,-d/2-.006,false);
      break;}
    case 'whiteboard':
      part(g,box(w*.94,1.0,.06),toon(c),0,h/2-.55);part(g,box(w,.06,.1),toon(METAL),0,h/2-1.06);
      for(const s of [-1,1]){part(g,box(.05,h,.05),toon(METAL),s*w*.47);part(g,box(.05,.05,d*2.5),toon(METAL),s*w*.47,bottom+.03);}
      decal(g,scribble(),w*.82,.88,0,h/2-.55,.04);break;
    case 'bookshelf':
      for(const [px,pz] of [[-1,-1],[1,-1],[-1,1],[1,1]])part(g,box(.07,h,.07),toon(METAL),px*(w/2-.04),0,pz*(d/2-.04));
      for(const y of [-.6,0,.6]){part(g,box(w,.06,d),toon(c),0,y);for(let k=0;k<7;k++)part(g,box(.14,.34,d*.7),toon(books[((k+Math.round(y*5))%books.length+books.length)%books.length]),-w/2+.25+k*.24,y+.2);}break;
    case 'vending':{
      // Snack machine: a lit header band, a dark window with cans on three shelves behind glass,
      // a coin and button panel, a dispense flap, a kick plate, panelled sides and a vented back.
      const ink=toon(INK),light=toon(new T.Color(c).offsetHSL(0,0,.12).getStyle()),side=toon(new T.Color(c).offsetHSL(0,0,-.08).getStyle()),fz=d/2;
      part(g,rbox(w,h,d,.08),m);
      part(g,rbox(w*.9,.22,.05,.03),light,0,h/2-.18,fz+.01);decal(g,cachedTexture('vendHead',()=>glyph(c=>{for(const x of [56,128,200]){c.beginPath();c.roundRect(x-22,70,44,116,12);c.fill();}},'#fff4cc')),w*.5,.16,0,h/2-.18,fz+.037);
      const wx=-w*.1,wy=h*.08,ww=w*.62,wh=h*.55;part(g,box(ww,wh,.01),toon('#3a3d55'),wx,wy,fz+.004,false);
      for(let s=0;s<3;s++){const y=wy-wh/2+.14+s*wh/3.2;part(g,box(ww*.96,.02,.06),toon(METAL),wx,y-.075,fz+.03,false);
        for(let k=0;k<4;k++)part(g,cyl(.045,.045,.12,10),toon(CHAIRC[(s*4+k)%6]),wx-ww*.36+k*ww*.24,y,fz+.012,false);}
      part(g,box(ww+.04,wh+.04,.02),toon('#bfeaf5',{opacity:.45}),wx,wy,fz+.07,false);
      for(const [bw,bh,dx,dy] of [[ww+.08,.04,0,wh/2+.02],[ww+.08,.04,0,-wh/2-.02],[.04,wh,-ww/2-.02,0],[.04,wh,ww/2+.02,0]] as const)part(g,box(bw,bh,.05),ink,wx+dx,wy+dy,fz+.035);
      part(g,rbox(.18,.5,.04,.02),ink,w*.36,wy+.05,fz+.02);part(g,box(.06,.014,.012),toon(METAL),w*.36,wy+.22,fz+.045,false);
      for(let k=0;k<6;k++)part(g,box(.04,.04,.012),toon('#fff6e6'),w*.36-.035+(k%2)*.07,wy+.1-Math.floor(k/2)*.07,fz+.045,false);
      part(g,rbox(w*.5,.18,.04,.02),ink,-w*.1,-h/2+.3,fz+.02);part(g,box(w*.96,.1,.03),ink,0,-h/2+.05,fz+.005);
      for(const s of [-1,1]){part(g,box(.008,h*.8,d*.7),side,s*(w/2+.002),0,0,false);part(g,box(.01,.03,d*.72),ink,s*(w/2+.006),h/2-.3,0,false);}
      for(let k=0;k<6;k++)part(g,box(w*.5,.03,.01),ink,0,h/2-.35-k*.07,-fz-.004,false);
      for(const x of [-w*.33,w*.33])part(g,box(.012,h*.9,.01),side,x,0,-fz-.004,false);
      part(g,box(.08,.08,.012),ink,w*.3,-h/2+.25,-fz-.006,false);
      break;}
    case 'cooler':{
      // Water cooler: an inverted blue jug with ribs on a collar, hot and cold taps over a drip tray
      // in a darker niche, a paper-cup tube on the side and a vented back.
      const ink=toon(INK),top=bottom+h*.75,front=w*.425;
      part(g,rbox(w*.85,h*.75,w*.85,.06),m,0,bottom+h*.375);part(g,cyl(.12,.14,.05,16),toon('#dcdfe6'),0,top+.025);
      const jug=cached('coolerJug',()=>new T.LatheGeometry([[0,0],[.06,0],[.06,.05],[.16,.09],[.19,.13],[.19,.22],[.16,.26],[0,.27]].map(([r,y])=>new T.Vector2(r,y)),40));
      part(g,jug,toon('#8fd0f0',{opacity:.6}),0,top+.05,0,false);for(const y of [.14,.21])part(g,new T.TorusGeometry(.19,.008,6,32),toon('#6fb8de'),0,top+.05+y,0,false).rotation.x=Math.PI/2;
      part(g,box(.34,.24,.02),toon(new T.Color(c).offsetHSL(0,0,-.12).getStyle()),0,.09,front+.002,false);
      part(g,box(.05,.06,.06),toon('#e5484d'),-.08,.15,front+.03);part(g,box(.05,.06,.06),toon('#3f7fd6'),.08,.15,front+.03);
      part(g,box(.3,.03,.1),ink,0,-.02,front+.04);part(g,cyl(.04,.04,.2,12),toon('#fffaf0'),front+.03,.12,-.08);
      part(g,box(.3,.4,.01),ink,0,-.15,-front-.004,false);for(let k=0;k<5;k++)part(g,box(.26,.012,.012),toon(DMETAL),0,-.31+k*.08,-front-.01,false);
      break;}
    case 'beanbag':{
      // A slumped sack: a lathe pear whose top is pushed back and whose front is pressed down into a
      // sloping seat, with a dark dent where you sit, seams running up the back to a pinched tuft,
      // and a carry tab. Silhouette: tall back, low front (not a dome, bun or macaron).
      const dark=toon(new T.Color(c).offsetHSL(0,0,-.1).getStyle()),deep=toon(new T.Color(c).offsetHSL(0,0,-.13).getStyle());
      const profile:[number,number][]=[[0,0],[.38,0],[.44,.06],[.46,.16],[.42,.3],[.33,.43],[.2,.53],[.08,.58],[0,.59]];
      const slump=(v:T.Vector3)=>{const f=Math.max(0,v.z)/.46,t=v.y/.59;v.y-=.28*f*t*t;v.z-=.24*t*t;return v;};
      part(g,cached('beanbagSack',()=>{const l=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),48),pos=l.attributes.position,v=new T.Vector3();
        for(let i=0;i<pos.count;i++){slump(v.fromBufferAttribute(pos,i));pos.setXYZ(i,v.x,v.y,v.z);}l.computeVertexNormals();return l;}),m,0,bottom);
      const at=(y:number)=>{for(let i=1;i<profile.length;i++)if(y<=profile[i][1]){const [r0,y0]=profile[i-1],[r1,y1]=profile[i];return r0+(r1-r0)*(y-y0)/(y1-y0||1);}return 0;};
      const seat=slump(new T.Vector3(0,.42,at(.42)-.1));
      {const dent=part(g,sphere(.24,20,12),deep,0,bottom+seat.y,seat.z,false);dent.scale.set(1.05,.3,.95);dent.rotation.x=.55;}
      const tip=slump(new T.Vector3(0,.59,0));part(g,cyl(.03,.07,.08,10),dark,0,bottom+tip.y-.01,tip.z);
      const tab=slump(new T.Vector3(0,.42,-at(.42)));part(g,rbox(.12,.05,.03,.012),dark,0,bottom+tab.y,tab.z-.01).rotation.x=.5;
      for(const a of [1.7,3.14,4.58]){const pts:T.Vector3[]=[];for(let k=0;k<=12;k++){const y=.04+k*.045,r=at(y)+.006;pts.push(slump(new T.Vector3(Math.sin(a)*r,y,Math.cos(a)*r)));}
        part(g,cached(`beanSeam${a}`,()=>new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.009,5)),dark,0,bottom,0,false);}
      break;}
    case 'strip':{
      part(g,rbox(w,h,d,.05),m);for(let k=0;k<4;k++){part(g,rbox(.13,.02,.13,.03),toon('#fff6e6'),-.3+k*.19,h/2+.005,0,false);part(g,box(.02,.012,.05),toon(INK),-.33+k*.19,h/2+.02,0,false);part(g,box(.02,.012,.05),toon(INK),-.27+k*.19,h/2+.02,0,false);}
      // A rocker switch, and a small rating plate (bolt glyph) beside it.
      part(g,rbox(.07,.025,.05,.01),toon(INK),w/2-.06,h/2+.008,0,false);part(g,rbox(.06,.03,.045,.012),toon('#e5484d'),w/2-.06,h/2+.025,0).rotation.z=.2;
      decal(g,cachedTexture('boltCream',()=>glyph(c=>{c.fillStyle='#fffaf0';c.fillRect(0,0,256,256);c.fillStyle=INK;c.beginPath();c.moveTo(150,20);c.lineTo(70,140);c.lineTo(125,140);c.lineTo(100,236);c.lineTo(190,104);c.lineTo(134,104);c.closePath();c.fill();})),.06,.06,w/2-.06,0,d/2+.003);
      break;}
    case 'cone':part(g,box(.5,.05,.5),m,0,bottom+.025);part(g,cyl(.03,.22,.56,14),m,0,.03);part(g,cyl(.101,.135,.1,14),toon('#fff6e6'),0,.06);break;
    case 'pin':{
      // Bowling pin: a lathe profile (foot, belly, neck, head) with two red neck stripes.
      const profile:[number,number][]=[[0,0],[.075,0],[.095,.05],[.12,.18],[.118,.27],[.085,.39],[.05,.47],[.052,.52],[.068,.59],[.064,.655],[.035,.69],[0,.7]];
      part(g,cached('pinBody',()=>new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),32)),m,0,bottom);
      part(g,cyl(.072,.075,.03,16),toon('#e5484d'),0,bottom+.425);part(g,cyl(.055,.054,.022,16),toon('#e5484d'),0,bottom+.5);
      break;}
    case 'stool':{
      // Bar stool: padded round seat with piping, a chrome post, a foot ring and a weighted base.
      const chrome=toon(METAL),ink=toon(INK);
      part(g,cyl(.2,.2,.08,16),m,0,h/2-.04);part(g,new T.TorusGeometry(.2,.014,6,32),toon(new T.Color(c).offsetHSL(0,0,-.18).getStyle()),0,h/2-.075).rotation.x=Math.PI/2;
      part(g,cyl(.09,.11,.04,12),ink,0,h/2-.1);part(g,cyl(.03,.03,.62,10),chrome,0,bottom+.35);
      part(g,new T.TorusGeometry(.17,.014,6,32),chrome,0,bottom+.3).rotation.x=Math.PI/2;for(const a of [0,Math.PI/2])part(g,box(.34,.015,.015),chrome,0,bottom+.3,0).rotation.y=a;
      part(g,cyl(.2,.22,.04,16),ink,0,bottom+.02);
      break;}
    case 'pingpong':{
      // Green top with white edge and centre lines, a net on two posts, legs, two paddles and a ball.
      const white=toon('#fbf7ee');
      part(g,rbox(w,.06,d,.04),m,0,h/2-.03);part(g,box(.02,.15,d-.04),toon('#f4efe6'),0,h/2+.095);for(const s of [-1,1])part(g,cyl(.015,.015,.18,8),toon(INK),0,h/2+.09,s*(d/2-.02));
      for(const s of [-1,1]){part(g,box(w-.02,.005,.02),white,0,h/2+.003,s*(d/2-.02),false);part(g,box(.02,.005,d-.02),white,s*(w/2-.02),h/2+.003,0,false);}
      part(g,box(w-.04,.005,.012),white,0,h/2+.003,0,false);
      for(const [lx,lz] of [[-1,-1],[1,-1],[-1,1],[1,1]])part(g,box(.06,h-.06,.06),toon(INK),lx*(w/2-.2),-.03,lz*(d/2-.2));
      for(const [x,z,ry] of [[-.7,.35,.5],[.8,-.3,2.4]] as const){const p=group(g,x,h/2+.008,z,ry);part(p,cyl(.08,.08,.015,16),toon('#e5484d'),0,0,0);part(p,rbox(.03,.015,.1,.008),toon('#a8734a'),0,0,.12);}
      part(g,sphere(.02,8,6),toon('#fffaf0'),-.3,h/2+.02,-.2);
      break;}
    case 'bridge':{
      // Cable protector: bevelled ramps (smooth chamfers, flat faces) with grip ribs, a hazard-
      // striped crown, and three cable channels showing as dark arches at both ends.
      const geo=kindGeometry('bridge',()=>{const s=new T.Shape();s.moveTo(-w/2+.04,.02);s.lineTo(-.25+.01,h-.02);s.lineTo(.25-.01,h-.02);s.lineTo(w/2-.04,.02);s.closePath();return bevelled(s,d,h);});
      part(g,geo,m);decal(g,cachedTexture('hazard',()=>stripes()),.48,d*.96,0,h/2+.004,0,0,true);
      const slope=Math.atan2(h,w/2-.25),rib=toon(new T.Color(c).offsetHSL(0,0,-.15).getStyle());
      for(const s of [-1,1])for(let k=1;k<4;k++){const x=s*(.25+k*(w/2-.25)/4),y=bottom+h*(1-(Math.abs(x)-.25)/(w/2-.25));part(g,box(.03,.02,d*.9),rib,x,y+.008,0,false).rotation.z=-s*slope;}
      for(const z of [-1,1])for(const x of [-.35,0,.35])part(g,cyl(.05,.05,.012,12,'z'),toon(INK),x,bottom,z*(d/2+.002),false);
      break;}
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
    case 'lamp':{
      // Floor lamp: weighted base with a cord, a wooden pole, an open shade with an ink rim, a
      // warm bulb you see from below, and a pull-chain bead.
      part(g,cyl(.24,.3,.08,18),toon(INK),0,bottom+.04);part(g,cyl(.03,.03,1.1,8),toon('#a8734a'),0,bottom+.6);
      const shadeMat=cachedMaterial(`lampShade${c}`,()=>{const s=toon(c).clone();s.side=T.DoubleSide;return s;});
      part(g,cached('lampShade',()=>new T.CylinderGeometry(.18,.32,.34,48,1,true)),shadeMat,0,h/2-.25);
      part(g,new T.TorusGeometry(.32,.014,6,40),toon(INK),0,h/2-.42).rotation.x=Math.PI/2;part(g,new T.TorusGeometry(.18,.012,6,32),toon(INK),0,h/2-.08).rotation.x=Math.PI/2;
      const bulb=part(g,sphere(.07,12,8),hot('#ffe6b0',1.8),0,h/2-.33,0,false);bulb.userData.noAO=true;part(g,cyl(.035,.035,.06,10),toon(DMETAL),0,h/2-.26,0,false);
      part(g,cyl(.004,.004,.14,4),toon(DMETAL),.1,h/2-.43,0,false);part(g,sphere(.014,8,6),toon(INK),.1,h/2-.5,0,false);
      part(g,cached('lampCord',()=>new T.TubeGeometry(new T.CatmullRomCurve3([[0,bottom+.06,-.2],[0,bottom+.02,-.27],[.05,bottom+.012,-.31],[.16,bottom+.012,-.3]].map(p=>new T.Vector3(...p))),12,.012,5)),toon(INK),0,0,0,false);
      break;}
    case 'dolly':
      part(g,rbox(w,.1,d,.06),toon(DMETAL),0,bottom+.28);wheels(g,w*.38,d*.38,.12,bottom+.12);handle(g,-w/2+.1,bottom+.3,bottom+1.3,d*.33);
      reel(g,.05,bottom+.85,0,INK,'#ffc94d',1.05);break;
    case 'supply':{
      part(g,rbox(w,.14,d,.08),toon(METAL),0,bottom+.36);wheels(g,w*.38,d*.38,.15,bottom+.15);
      part(g,rbox(w*.75,.8,d*.85,.14),m,.05,bottom+.83);handle(g,-w/2+.1,bottom+.42,bottom+1.2,d*.38);
      decal(g,cachedTexture('bolt',()=>glyph(c=>{c.beginPath();c.moveTo(150,20);c.lineTo(70,140);c.lineTo(125,140);c.lineTo(100,236);c.lineTo(190,104);c.lineTo(134,104);c.closePath();c.fill();})),.36,.36,-.15,bottom+.85,d*.43+.01);
      part(g,cyl(.1,.1,.12,12),toon('#d63a3f'),w*.33,bottom+1.28,-d*.25);
      for(const dz of [-.2,.2])part(g,cyl(.09,.09,.12,12,'x'),toon(INK),w*.44,bottom+.9,dz);break;}
    case 'capcart':{
      // Four big electrolytic capacitors (sleeve stripe with minus marks, vent cross and +/- terminals
      // on each cap) beside a metal control box with a charge lamp and an inlet socket plate.
      const ink=toon(INK),white=toon('#fffaf0');
      part(g,rbox(w,.14,d,.08),toon(METAL),0,bottom+.36);wheels(g,w*.38,d*.38,.15,bottom+.15);handle(g,-w/2+.1,bottom+.42,bottom+1.2,d*.4);
      for(const [cx,cz] of [[-.4,-.22],[.1,-.22],[.1,.22],[-.4,.22]]){const out=Math.sign(cz),top=bottom+1.21;
        part(g,cyl(.22,.22,.72,20),m,cx,bottom+.8,cz);part(g,cyl(.22,.22,.06,20),toon('#c7ccd6'),cx,bottom+1.18,cz);
        part(g,box(.09,.6,.02),toon('#1f4f9a'),cx,bottom+.8,cz+out*.215);for(let k=0;k<3;k++)part(g,box(.05,.012,.01),white,cx,bottom+.62+k*.18,cz+out*.228,false);
        for(const a of [0,Math.PI/2])part(g,box(.3,.008,.025),ink,cx,top+.002,cz,false).rotation.y=a;
        part(g,cyl(.03,.03,.06,10),toon('#e5484d'),cx+.1,top+.03,cz);part(g,cyl(.03,.03,.06,10),ink,cx-.1,top+.03,cz);}
      part(g,rbox(.36,.7,.85,.06),toon(DMETAL),.55,bottom+.78);part(g,box(.01,.5,.66),ink,.735,bottom+.8,0,false);
      part(g,box(.012,.08,.4),lit('#57e38f','#3fdc7f'),.742,bottom+1.0,0,false);part(g,sphere(.035,10,8),lit('#57e38f','#3fdc7f'),.75,bottom+1.0,.27,false);
      part(g,rbox(.03,.26,.26,.04),toon('#f0ece2'),.75,bottom+.9-.2,0);part(g,cyl(.08,.08,.02,14,'x'),ink,.765,bottom+.7,0,false);
      break;}
    case 'coolbox':{
      const lid=toon('#3bb2c9');part(g,rbox(w,h*.8,d,.1),m,0,-h*.1);part(g,rbox(w*1.04,h*.2,d*1.05,.1),lid,0,h/2-.06);
      part(g,box(w*1.005,.04,d*1.005),lid,0,-h*.05);for(const s of [-1,1]){part(g,box(.06,.1,.14),toon(DMETAL),s*(w/2+.02),h*.12,0);part(g,box(.14,.08,.03),toon('#fffaf0'),s*w*.28,h*.18,d/2+.02);}
      part(g,new T.TorusGeometry(.1,.018,6,16,Math.PI),toon(DMETAL),0,h/2+.01,0).rotation.x=-Math.PI/2;break;}
    case 'wedge':{
      // Bevelled doorstop (lit chamfers, closed outline) with a hazard-striped back face.
      const geo=kindGeometry('wedge',()=>{const s=new T.Shape();s.moveTo(-w/2+.05,.02);s.lineTo(w/2-.02,.02);s.lineTo(w/2-.02,h-.02);s.lineTo(-w/2+.04,.045);s.closePath();return bevelled(s,d,h);});
      part(g,geo,m);decal(g,cachedTexture('hazard',()=>stripes()),d*.8,h*.62,w/2+.004,0,0,Math.PI/2);
      // Rubber grip ribs across the slope.
      for(let k=1;k<5;k++){const x=-w/2+k*w/5,y=bottom+h*(x+w/2)/w;part(g,box(.035,.03,d*.9),toon(new T.Color(c).offsetHSL(0,0,-.15).getStyle()),x,y+.012,0,false).rotation.z=Math.atan2(h,w);}
      break;}
  }
  return g;
}
/** Extrudes a profile (already inset by .02) with a 2 cm bevel, centred, depth d overall; bevel
 *  faces shade smoothly while the flat faces stay flat (creased normals). */
function bevelled(s:T.Shape,d:number,h:number){const e=new T.ExtrudeGeometry(s,{depth:d-.04,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:3,curveSegments:6});
  e.translate(0,-h/2,-(d-.04)/2);const n=toCreasedNormals(e,Math.PI/5);n.computeBoundingSphere();return n;}
const materials=new Map<string,T.Material>();
function cachedMaterial(key:string,make:()=>T.Material){let m=materials.get(key);if(!m){m=make();materials.set(key,m);}return m;}
const kindGeometries=new Map<string,T.BufferGeometry>();
function kindGeometry(key:string,make:()=>T.BufferGeometry){let g=kindGeometries.get(key);if(!g){g=make();kindGeometries.set(key,g);}return g;}
