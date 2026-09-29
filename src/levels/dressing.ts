// Room dressing pieces (ported from mockups/look/room.js): windows with blinds and light shafts,
// wall art, lamp pools, pendants, desk lamps, rugs and soft contact shadows.
import * as T from 'three';
import {toon,box,cyl,sphere,part,group,glow} from '../render/kit';
import {INK} from '../render/toon';
import {glossyToon,hot} from '../render/actors';
import * as TX from '../render/textures';

const noOutline=<M extends T.Material>(m:M)=>{m.userData.outlineParameters={visible:false};return m;};
export function flatPlane(parent:T.Object3D,w:number,d:number,material:T.Material,x:number,y:number,z:number,ry=0){
  const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);const m=new T.Mesh(g,material);m.position.set(x,y,z);m.rotation.y=ry;m.receiveShadow=true;parent.add(m);return m;
}
/** Additive, unlit floor decal (light pools, window patches); never outlined or in AO. */
export function lightDecal(parent:T.Object3D,map:T.Texture,w:number,d:number,x:number,y:number,z:number,opacity=.25,color='#ffffff',ry=0){
  const m=flatPlane(parent,w,d,noOutline(new T.MeshBasicMaterial({map,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending})),x,y,z,ry);
  m.receiveShadow=false;m.userData.noAO=true;m.renderOrder=2;return m;
}
export function shadowDecal(parent:T.Object3D,w:number,d:number,x:number,y:number,z:number,opacity=.35){
  const m=flatPlane(parent,w,d,noOutline(new T.MeshBasicMaterial({map:TX.radial('shadow','rgba(20,18,40,1)','rgba(20,18,40,0)',.25),transparent:true,opacity,depthWrite:false})),x,y,z);
  m.userData.noAO=true;m.receiveShadow=false;return m;
}
export const lampPool=(parent:T.Object3D,x:number,z:number,r=1.6,opacity=.2,color='#ffcf8a')=>lightDecal(parent,TX.radial('pool','rgba(255,214,150,1)','rgba(255,200,130,0)',.2),r*2,r*2,x,.02,z,opacity,color);
export function rug(parent:T.Object3D,x:number,z:number,w:number,d:number,a='#d98c5f',b='#f2c98f',ry=0){
  const m=flatPlane(parent,w,d,toon('#ffffff',{map:TX.rugTex(a,b)}),x,.012,z,ry);return m;
}
/** A window on a wall's upper group (local +z points into the room): sky, frame, sill, blinds. */
export function windowUnit(upper:T.Object3D,x:number,y:number,z:number){
  const w=2.4,h=1.45,sky=new T.Mesh(new T.PlaneGeometry(w,h),noOutline(new T.MeshBasicMaterial({map:TX.skyWindow()})));sky.material.color.setScalar(1.12);sky.position.set(x,y,z);upper.add(sky);
  const frame=toon('#f7f1e4');for(const [bw,bh,dx,dy] of [[w+.16,.09,0,h/2],[w+.16,.09,0,-h/2],[.09,h,-w/2,0],[.09,h,w/2,0],[.06,h,0,0]] as const)part(upper,box(bw,bh,.08),frame,x+dx,y+dy,z+.04);
  part(upper,box(w+.4,.06,.22),toon('#e9dcc2'),x,y-h/2-.06,z+.1);
  for(let k=0;k<6;k++){const s=part(upper,box(w,.05,.03),toon('#f4efe4'),x,y+h/2-.1-k*.075,z+.03,false);s.rotation.x=.5;}
}
/** Warm light shaft from a back-wall window falling into the room (+z). */
export function windowShaft(parent:T.Object3D,x:number,z:number,{len=5.2,width=2.2,opacity=.16,skew=.9}={}){
  const m=noOutline(new T.MeshBasicMaterial({map:TX.shaft(),transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,color:'#ffd9a0'}));
  const geo=new T.BufferGeometry(),top=2.55,bot=.02,x0=x-width/2,x1=x+width/2;
  geo.setAttribute('position',new T.Float32BufferAttribute([x0,top,z,x1,top,z,x0+skew,bot,z+len,x1+skew,bot,z+len],3));geo.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,0,0,1,0],2));geo.setIndex([0,2,1,1,2,3]);
  const s=new T.Mesh(geo,m);s.userData.noAO=true;s.renderOrder=3;parent.add(s);
  lightDecal(parent,TX.radial('patch','rgba(255,228,180,1)','rgba(255,228,180,0)',.45),width*1.25,2.7,x+skew*.75,.015,z+len*.72,.2,'#ffe2b0');
  return s;
}
export type WallArt=TX.PosterKind|'cork';
export function wallArt(parent:T.Object3D,kind:WallArt,x:number,y:number,z:number,ry=0,s=1){
  const g=group(parent,x,y,z,ry);
  if(kind==='cork'){part(g,box(1.5*s,1*s,.05),toon('#8a5a2b'));const f=new T.Mesh(new T.PlaneGeometry(1.44*s,.94*s),toon('#ffffff',{map:TX.corkboard()}));f.position.z=.03;g.add(f);return g;}
  part(g,box(.72*s,.95*s,.04),toon(INK));const f=new T.Mesh(new T.PlaneGeometry(.64*s,.86*s),toon('#ffffff',{map:TX.poster(kind)}));f.position.z=.025;g.add(f);return g;
}
export function pointLamp(parent:T.Object3D,x:number,y:number,z:number,{color='#ffcf7a',intensity=6,distance=5.5}={}){const l=new T.PointLight(color,intensity,distance,1.6);l.position.set(x,y,z);parent.add(l);return l;}
/** Pendant lamp hanging from the (off-screen) ceiling. */
export function pendant(parent:T.Object3D,x:number,z:number,{y=2.55,color='#ffc94d',light=true,cord=.9}={}){
  const g=group(parent,x,0,z);
  part(g,cyl(.012,.012,cord,5),toon(INK),0,y+.25+cord/2,0,false);
  const shade=part(g,new T.CylinderGeometry(.14,.38,.32,20,1,true),glossyToon(color,{spec:.8,size:.95}),0,y+.16,0);(shade.material as T.Material).side=T.DoubleSide;
  part(g,cyl(.05,.06,.08,10),toon(INK),0,y+.35,0,false);
  const bulb=part(g,sphere(.1,12,8),hot('#ffe6b0',2.2),0,y+.02,0,false);bulb.userData.noAO=true;
  glow(g,'rgba(255,200,120,1)',1,.22).position.y=y-.05;
  if(light)pointLamp(g,0,y-.25,0,{intensity:4.5,distance:6});
  return g;
}
export function deskLamp(parent:T.Object3D,x:number,y:number,z:number,ry=0,color='#e5484d'){
  const g=group(parent,x,y,z,ry);
  part(g,cyl(.1,.12,.03,14),toon(INK),0,.015,0);
  part(g,cyl(.018,.018,.38,6),toon(color),0,.2,0).rotation.z=.35;
  part(g,cyl(.018,.018,.3,6),toon(color),.12,.42,0).rotation.z=-1;
  const sh=part(g,new T.ConeGeometry(.1,.16,14,1,true),glossyToon(color),.26,.46,0);sh.rotation.z=2.3;(sh.material as T.Material).side=T.DoubleSide;
  const bulb=part(g,sphere(.045,8,6),hot('#fff0c8',3),.29,.42,0,false);bulb.userData.noAO=true;
  return g;
}
