// The Archive set dressing: a warm library in walnut, ochre and olive under cream walls. Tall
// bookcases line the back wall behind the datasheet desk, the stock counters sit to the right,
// the test rig to the left, a reading area with green banker's lamps up front, and the post desk
// by the entrance where the work orders arrive.
import * as T from 'three';
import type {Game} from '../../game';
import type {RoomKit} from '../types';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,cachedTexture,DMETAL,INK} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import * as TX from '../../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../../levels/dressing';
import {solid} from '../../levels/decor';

export const WALNUT='#7a4b2c',WALNUT_DARK='#5a3520',OCHRE='#d9a441',OLIVE='#8a9a4a',BRASS='#d6aa4e',LAMP_GREEN='#2f8a5a',CREAM='#f6ecd6';
const SPINES=['#8a9a4a','#d9a441','#a44a3f','#3f6b5a','#c7774a','#e8d6a8','#5b6b8f','#b98552','#6f7a3a','#e5b85c'];
/** A shelf row of book spines as one texture (hundreds of books without hundreds of meshes). */
function spinesTexture(seed:number){
  return cachedTexture(`spines${seed}`,()=>canvasTex(512,128,c=>{const r=TX.rng(seed);c.fillStyle='#3a2416';c.fillRect(0,0,512,128);let x=4;
    while(x<506){const w=10+Math.floor(r()*16),h=78+Math.floor(r()*44),col=SPINES[Math.floor(r()*SPINES.length)];
      if(r()<.08){x+=w*.6;continue;}
      c.fillStyle=col;c.fillRect(x,128-h,w-2,h);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x+2,128-h+8,w-6,4);c.fillRect(x+2,128-18,w-6,3);
      c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x+w-4,128-h,2,h);x+=w;}
  }));
}
/** A tall walnut bookcase: frame, shelves and a spine texture per row. Local +z faces the room. */
export function bookcase(parent:T.Object3D,x:number,z:number,w:number,ry=0,h=2.5,seed=1){
  const g=group(parent,x,0,z,ry),d=.42,rows=4;
  part(g,box(w,h,.06),toon(WALNUT_DARK),0,h/2,-d/2+.03);
  for(const s of [-1,1])part(g,box(.07,h,d),toon(WALNUT),s*(w/2-.035),h/2,0);
  part(g,box(w+.08,.08,d+.06),toon(WALNUT),0,h+.02,.01);part(g,box(w,.12,d),toon(WALNUT_DARK),0,.06,0);
  for(let k=0;k<rows;k++){const y=.12+k*(h-.14)/rows;part(g,box(w-.1,.035,d),toon(WALNUT),0,y,0);
    const m=new T.Mesh(new T.PlaneGeometry(w-.16,(h-.14)/rows*.78),toon('#ffffff',{map:spinesTexture(seed*7+k)}));m.position.set(0,y+.02+(h-.14)/rows*.39,-.02);m.userData.noAO=true;(m.material as T.Material).userData.outlineParameters={visible:false};g.add(m);}
  return g;
}
/** Green banker's lamp: brass base and stem, a half-cylinder green glass shade. */
export function bankersLamp(parent:T.Object3D,x:number,y:number,z:number,ry=0,light=true){
  const g=group(parent,x,y,z,ry);
  part(g,rbox(.3,.04,.18,.02),toon(BRASS),0,.02,0);part(g,cyl(.015,.015,.26,8),toon(BRASS),.1,.17,0);
  const shade=part(g,new T.CylinderGeometry(.1,.1,.42,20,1,true,0,Math.PI).rotateZ(Math.PI/2),glossyToon(LAMP_GREEN,{spec:.9,size:.95}),0,.33,0);(shade.material as T.Material).side=T.DoubleSide;
  const bulb=part(g,cyl(.03,.03,.3,10,'x'),hot('#fff0c8',2.4),0,.3,0,false);bulb.userData.noAO=true;
  if(light){pointLamp(g,0,.22,.1,{color:'#ffe2a8',intensity:1.6,distance:2.6});}
  return g;
}
/** A flat sign plate: short words, auto-fitted. */
export function signTexture(text:string,bg=CREAM,fg=INK,w=512,h=128){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(6,6,w-12,h-12,h*.22);c.fill();c.lineWidth=8;c.strokeStyle=fg;c.stroke();
    let size=Math.round(h*.46);const font=(n:number)=>`700 ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;c.font=font(size);while(size>10&&c.measureText(text).width>w-44){size--;c.font=font(size);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+3);});
}
export function plate(parent:T.Object3D,text:string,x:number,y:number,z:number,w=1,ry=0,bg?:string,fg?:string,tilt=0){
  const m=new T.MeshBasicMaterial({map:signTexture(text,bg,fg),transparent:true});m.userData.outlineParameters={visible:false};
  const p=part(parent,new T.PlaneGeometry(w,w/4),m,x,y,z,false);p.rotation.set(tilt,ry,0);p.userData.noAO=true;return p;
}

export function dressArchive(game:Game,kit:RoomKit){
  const l=game.level,r=game.decorRoot,W=l.width/2,D=l.depth/2;
  // Warm walnut planks everywhere; an olive runner through the stacks and a big reading rug.
  kit.floor(-W,W,-D,D,TX.woodPlanks('#c4905a'),3.2);
  rug(r,-5.2,-3.3,8.6,1.2,'#6f7a3a','#d9c48a');
  rug(r,0,3.2,8.4,4.6,'#a44a3f','#e8c98a');
  kit.floor(3.8,8.8,-7,1.2,TX.carpetTiles('#b59a6a'),2.4,.006);
  kit.backWindows(x=>x<4,.12);
  // Back wall: bookcases behind the desk and the rig, with a rolling ladder.
  for(const [x,w,s] of [[-9.2,2.8,1],[-6.3,2.8,2],[-3.4,2.8,3],[-.5,2.8,4],[2.3,2.4,5]] as const){bookcase(r,x,-7.62,w,0,2.5,s);}
  solid(game,13.8,2.6,.5,-3.6,1.3,-7.62);
  const ladder=group(r,-4.6,0,-7.1);for(const s of [-1,1]){const rail=part(ladder,box(.05,2.7,.05),toon(WALNUT),s*.22,1.3,0);rail.rotation.x=-.16;}
  for(let k=0;k<7;k++){const rung=part(ladder,box(.46,.035,.04),toon(BRASS),0,.25+k*.36,.05-k*.057);rung.rotation.x=-.16;}
  part(r,box(12.8,.04,.04),toon(BRASS),-3.6,2.62,-7.3);
  // Side wall: more stacks and a map of the building.
  for(const [lz,s] of [[-3.3,6],[3.7,8]] as const)bookcase(kit.side,lz,.24,2.8,0,2.5,s);
  solid(game,.5,2.6,2.8,-10.62,1.3,3.3);solid(game,.5,2.6,2.8,-10.62,1.3,-3.7);
  wallArt(kit.side,'mountain',.2,1.9,.16,0,.9);
  wallArt(kit.back,'graph',6.8,1.95,.18,0,.8);
  // A globe on a walnut stand beside the desk: a detective's desk needs one.
  const globe=group(r,.9,0,-6.3);part(globe,cyl(.18,.24,.06,16),toon(WALNUT),0,.03,0);part(globe,cyl(.03,.03,.7,8),toon(WALNUT),0,.4,0);
  part(globe,sphere(.28,18,14),toon('#6fa8a0'),0,.98,0);const ring=part(globe,new T.TorusGeometry(.32,.015,6,32),toon(BRASS),0,.98,0);ring.rotation.set(.4,0,.2);
  for(const [a,b,s] of [[.4,.2,.12],[-.8,1.2,.1],[1.9,-.4,.09]] as const)part(globe,sphere(s,10,8),toon('#c9b56a'),Math.cos(a)*.21,.98+b*.1,Math.sin(a)*.21);
  solid(game,.5,1.3,.5,.9,.65,-6.3);
  // Stock counters (A, B, C) to the right; the boxes on them are props.
  for(const [z,name] of [[-6.2,'A · RESISTORS'],[-3.2,'B · MOTOR DRIVERS'],[-.2,'C · CONTROLLERS']] as const){
    const g=group(r,6.25,0,z);part(g,rbox(3.8,.36,.66,.05),toon(WALNUT),0,.18,0);part(g,box(3.9,.05,.72),toon('#9c6a40'),0,.385,0);part(g,box(3.84,.06,.02),toon(OCHRE),0,.31,.335);
    plate(g,name,-1.35,.17,.34,.84,0,CREAM,WALNUT_DARK);solid(game,3.8,.41,.66,6.25,.205,z);
    // A standing sign at the aisle end names the counter's bins from across the room.
    const post=group(r,4.05,0,z+.1);part(post,cyl(.14,.18,.05,14),toon(WALNUT_DARK),0,.025,0);part(post,cyl(.025,.025,1.3,8),toon(BRASS),0,.66,0);
    part(post,rbox(.62,.4,.05,.03),toon(WALNUT_DARK),0,1.42,0);plate(post,name.split(' · ')[0],0,1.42,.03,.56,0,name[0]==='A'?OCHRE:name[0]==='B'?OLIVE:'#c7774a','#fffaf0');
    plate(post,name.split(' · ')[1],0,1.12,.02,.62,0,CREAM,WALNUT_DARK);solid(game,.2,1.7,.2,4.05,.85,z+.1);}
  // The post desk by the door: work orders arrive by pneumatic tube.
  const post=group(r,-8.6,0,3.2);part(post,rbox(1.6,.78,.7,.05),toon(WALNUT),0,.39,0);part(post,box(1.7,.05,.78),toon('#9c6a40'),0,.8,0);
  part(post,cyl(.09,.09,2.2,14),glossyToon(BRASS,{spec:.9,size:.96}),.62,1.9,-.2);part(post,cyl(.14,.14,.16,14),toon(BRASS),.62,.9,-.2);part(post,cyl(.12,.12,.04,14),toon(INK),.62,.99,-.2);
  plate(post,'POST',-.2,.55,.36,.6,0,OCHRE,WALNUT_DARK);solid(game,1.6,.8,.7,-8.6,.4,3.2);
  // Reading area: two long tables with banker's lamps under a pair of pendants (away from the desk view).
  for(const [x,z] of [[-2.2,3.2],[2.2,3.2]] as const){const t=group(r,x,0,z);part(t,rbox(2.6,.08,1.1,.04),toon(WALNUT),0,.76,0);for(const [sx,sz] of [[-1.15,-.45],[1.15,-.45],[-1.15,.45],[1.15,.45]])part(t,box(.08,.72,.08),toon(WALNUT_DARK),sx,.36,sz);
    bankersLamp(t,-.5,.8,-.2,0,true);bankersLamp(t,.7,.8,.25,Math.PI,false);
    for(const [bx,bz,ry,col] of [[.2,-.15,.3,'#a44a3f'],[-1,.25,-.2,OLIVE],[.9,-.3,1.2,OCHRE]] as const){const b=part(t,box(.3,.06,.22),toon(col),bx,.83,bz);b.rotation.y=ry;}
    solid(game,2.6,.8,1.1,x,.4,z);}
  pendant(game.root,-2.2,4.4,{y:2.6,color:OLIVE,light:false});pendant(game.root,2.2,4.4,{y:2.6,color:OLIVE,light:false});
  lampPool(game.root,0,3.2,3.2,.16);
  // Warm light over the desk and the rig (point lights only: nothing hangs over the tabletop).
  pointLamp(game.root,-2,2.4,-4.8,{color:'#ffe2b0',intensity:4,distance:5});lampPool(game.root,-2,-5.3,1.8,.18);
  pointLamp(game.root,-7.2,2.3,-3.6,{color:'#fff1d6',intensity:3.5,distance:5});
  pointLamp(game.root,6.3,2.4,-3.2,{color:'#ffe9c2',intensity:4,distance:7});
  glow(game.root,'rgba(255,214,150,1)',3,.08).position.set(6.3,1.6,-3.2);
  // Olive "QUIET PLEASE" style plaque above the stacks: a sign, not a tutorial.
  plate(kit.back,'THE ARCHIVE',-3.6,2.8,.3,1.8,0,OLIVE,CREAM);
  return {};
}
