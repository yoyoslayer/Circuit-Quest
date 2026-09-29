// Typed port of reference/render_kit/lib.js. Geometry is cached by shape so every
// copy of a prop shares buffers and can be drawn as one instanced mesh.
import * as T from 'three';
import {INK,toon,type ToonOptions} from './toon';
export {INK,toon};
export const METAL='#9aa3b2',DMETAL='#6b7385',WOOD='#b98552',TRIM='#a8734a';
export const CHAIRC=['#e5484d','#3f7fd6','#6cc58a','#ffc94d','#b392f0','#f08a4b'];
export const BLOBC=['#b392f0','#6cc58a','#5b9cf0','#f08a4b','#f78fd0','#ffc94d','#8fd3c8'];

const geometries=new Map<string,T.BufferGeometry>();
export function cached<G extends T.BufferGeometry>(key:string,make:()=>G):G{let g=geometries.get(key) as G|undefined;if(!g){g=make();geometries.set(key,g);}return g;}
export function rbox(w:number,h:number,d:number,r=.08):T.BufferGeometry{
  return cached(`rbox:${w}:${h}:${d}:${r}`,()=>{
    const s=new T.Shape(),x=-w/2,y=-d/2;r=Math.min(r,w/2,d/2);
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+d-r);
    s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);
    s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:5});
    g.rotateX(-Math.PI/2);g.translate(0,-h/2,0);g.computeVertexNormals();return g;
  });
}
export const box=(w:number,h:number,d:number)=>cached(`box:${w}:${h}:${d}`,()=>new T.BoxGeometry(w,h,d));
export const cyl=(rt:number,rb:number,h:number,seg=16,axis:'y'|'x'|'z'='y')=>cached(`cyl:${rt}:${rb}:${h}:${seg}:${axis}`,()=>{const g=new T.CylinderGeometry(rt,rb,h,seg);if(axis==='x')g.rotateZ(Math.PI/2);if(axis==='z')g.rotateX(Math.PI/2);return g;});
export const sphere=(r:number,w=14,h=10)=>cached(`sph:${r}:${w}:${h}`,()=>new T.SphereGeometry(r,w,h));
export const ico=(r:number)=>cached(`ico:${r}`,()=>new T.IcosahedronGeometry(r,1));
export const capsule=(r:number,l:number)=>cached(`cap:${r}:${l}`,()=>new T.CapsuleGeometry(r,l,6,16));

export function part(parent:T.Object3D,geometry:T.BufferGeometry,material:T.Material,x=0,y=0,z=0,shadow=true):T.Mesh{
  const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;
}
export function group(parent:T.Object3D,x=0,y=0,z=0,ry=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);return g;}
export function canvasTex(w:number,h:number,draw:(c:CanvasRenderingContext2D,w:number,h:number)=>void){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d')!,w,h);
  const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
export function repeat(t:T.Texture,x:number,y:number){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(x,y);return t;}
export function planks(base='#f2cf94',line='rgba(170,120,60,0.35)'){
  return canvasTex(512,512,c=>{c.fillStyle=base;c.fillRect(0,0,512,512);const rows=8,rh=512/rows;
    for(let r=0;r<rows;r++){const off=(r*389)%512,shade=.93+((r*7)%5)*.025;c.fillStyle=`rgba(255,255,255,${(shade-.95)*1.2})`;c.fillRect(0,r*rh,512,rh);
      c.fillStyle=line;c.fillRect(0,r*rh,512,3);for(let x=off%256;x<512;x+=256)c.fillRect(x,r*rh,3,rh);}});
}
export function checker(a:string,b:string,n=8){return canvasTex(256,256,c=>{const s=256/n;for(let j=0;j<n;j++)for(let i=0;i<n;i++){c.fillStyle=(i+j)%2?a:b;c.fillRect(i*s,j*s,s,s);}});}
export function carpet(base:string){return canvasTex(256,256,c=>{c.fillStyle=base;c.fillRect(0,0,256,256);c.fillStyle='rgba(255,255,255,0.05)';for(let y=0;y<256;y+=32)for(let x=0;x<256;x+=32)if((x+y)%64===0)c.fillRect(x,y,32,32);});}
export function concrete(base:string){return canvasTex(256,256,c=>{c.fillStyle=base;c.fillRect(0,0,256,256);c.fillStyle='rgba(0,0,0,0.06)';for(let i=0;i<60;i++)c.fillRect((i*173)%256,(i*97)%256,4,4);c.fillStyle='rgba(0,0,0,0.12)';c.fillRect(0,127,256,2);c.fillRect(127,0,2,256);});}
export function glyph(draw:(c:CanvasRenderingContext2D)=>void,bg?:string){return canvasTex(256,256,c=>{if(bg){c.fillStyle=bg;c.fillRect(0,0,256,256);}c.fillStyle=INK;c.strokeStyle=INK;c.lineWidth=16;c.lineCap=c.lineJoin='round';draw(c);});}
export const boltGlyph=(c:CanvasRenderingContext2D)=>{c.beginPath();c.moveTo(150,20);c.lineTo(70,140);c.lineTo(125,140);c.lineTo(100,236);c.lineTo(190,104);c.lineTo(134,104);c.closePath();c.fill();};
// Flat unlit sprite-like quads never get outlines.
export function flat(map:T.Texture,opts:T.MeshBasicMaterialParameters={}){const m=new T.MeshBasicMaterial({map,transparent:true,...opts});m.userData.outlineParameters={visible:false};return m;}
export function decal(parent:T.Object3D,map:T.Texture,w:number,h:number,x:number,y:number,z:number,ry=0,floor=false){
  const g=new T.PlaneGeometry(w,h);if(floor)g.rotateX(-Math.PI/2);const m=part(parent,g,flat(map),x,y,z,false);m.rotation.y=ry;return m;
}
const glowTextures=new Map<string,T.Texture>();
export function glow(parent:T.Object3D,color:string,size:number,opacity=.5){
  let map=glowTextures.get(color);
  if(!map){map=canvasTex(128,128,c=>{const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,color);g.addColorStop(.25,color);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,128,128);});glowTextures.set(color,map);}
  const s=new T.Sprite(new T.SpriteMaterial({map,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity,toneMapped:false}));s.scale.set(size,size,1);parent.add(s);return s;
}
export const unlit=(color:string,opts:T.MeshBasicMaterialParameters={})=>{const m=new T.MeshBasicMaterial({color,...opts});m.userData.outlineParameters={visible:false};return m;};
export const lit=(color:string,glowColor:string,ei=.9)=>toon(color,{emissive:glowColor,ei} as ToonOptions);
/** Live needle gauge drawn on a canvas; call set() when the value changes. */
export class Gauge{
  texture:T.CanvasTexture;private canvas=document.createElement('canvas');private value=-1;
  constructor(private zones:[number,number,string][]=[[0,.6,'#3bb273'],[.6,.82,'#ffc94d'],[.82,1,'#e5484d']]){this.canvas.width=256;this.canvas.height=160;this.texture=new T.CanvasTexture(this.canvas);this.texture.colorSpace=T.SRGBColorSpace;this.set(0);}
  set(v:number){v=Math.max(0,Math.min(1,v));if(Math.abs(v-this.value)<.004)return;this.value=v;const c=this.canvas.getContext('2d')!;
    c.clearRect(0,0,256,160);c.fillStyle='#fffaf0';c.beginPath();c.roundRect(4,4,248,152,22);c.fill();c.lineWidth=8;c.strokeStyle=INK;c.stroke();
    for(const [a,b,col] of this.zones){c.strokeStyle=col;c.lineWidth=24;c.beginPath();c.arc(128,140,96,Math.PI*(1+a),Math.PI*(1+b));c.stroke();}
    const a=Math.PI*(1+v);c.strokeStyle=INK;c.lineWidth=9;c.beginPath();c.moveTo(128,140);c.lineTo(128+Math.cos(a)*88,140+Math.sin(a)*88);c.stroke();
    c.fillStyle=INK;c.beginPath();c.arc(128,140,13,0,7);c.fill();this.texture.needsUpdate=true;}
  mount(parent:T.Object3D,x:number,y:number,z:number,s=1,ry=0){const g=group(parent,x,y,z,ry);part(g,box(.7*s,.46*s,.06),toon(INK),0,0,-.02);decal(g,this.texture,.64*s,.4*s,0,0,.02);return g;}
}
export function wheels(parent:T.Object3D,w:number,d:number,r=.15,y=r){for(const [x,z] of [[-w,-d],[w,-d],[-w,d],[w,d]])part(parent,cyl(r,r,.1,14,'z'),toon(INK),x,y,z);}
export function handle(parent:T.Object3D,x:number,y0:number,y1:number,d:number){
  const g=cached(`handle:${x}:${y0}:${y1}:${d}`,()=>new T.TubeGeometry(new T.CatmullRomCurve3([[x,y0,-d],[x-.1,y1,-d],[x-.1,y1,d],[x,y0,d]].map(p=>new T.Vector3(...p)),false,'catmullrom',.1),24,.04,8,false));
  part(parent,g,toon(INK));
}
export function reel(parent:T.Object3D,x:number,y:number,z:number,drum:string,flange:string,s=1){
  const g=group(parent,x,y,z);
  for(const side of [-1,1])part(g,cyl(.42*s,.42*s,.07*s,24,'z'),toon(flange),0,0,side*.24*s);
  part(g,cyl(.31*s,.31*s,.42*s,24,'z'),toon(drum));part(g,cyl(.08*s,.08*s,.56*s,12,'z'),toon('#c7ccd6'));return g;
}
/** Startled "!" bubble texture shared by coworker reactions. */
export const bangTexture=()=>cachedTexture('bang',()=>glyph(c=>{c.fillStyle='#fffaf0';c.beginPath();c.arc(128,128,110,0,7);c.fill();c.lineWidth=14;c.stroke();c.fillStyle='#e5484d';c.fillRect(112,50,32,100);c.beginPath();c.arc(128,190,18,0,7);c.fill();}));
const textures=new Map<string,T.Texture>();
export function cachedTexture(key:string,make:()=>T.Texture){let t=textures.get(key);if(!t){t=make();textures.set(key,t);}return t;}
