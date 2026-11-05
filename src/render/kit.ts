// Typed port of reference/render_kit/lib.js. Geometry is cached by shape so every
// copy of a prop shares buffers and can be drawn as one instanced mesh.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {INK,toon,type ToonOptions} from './toon';
export {INK,toon};
export const METAL='#9aa3b2',DMETAL='#6b7385',WOOD='#b98552',TRIM='#a8734a';
export const CHAIRC=['#e5484d','#3f7fd6','#6cc58a','#ffc94d','#b392f0','#f08a4b'];
export const BLOBC=['#b392f0','#6cc58a','#5b9cf0','#f08a4b','#f78fd0','#ffc94d','#8fd3c8'];

const geometries=new Map<string,T.BufferGeometry>();
export function cached<G extends T.BufferGeometry>(key:string,make:()=>G):G{let g=geometries.get(key) as G|undefined;if(!g){g=make();geometries.set(key,g);}return g;}
/** Rounded-corner slab with softly bevelled top and bottom edges (higher-poly look). */
export function rbox(w:number,h:number,d:number,r=.08):T.BufferGeometry{
  return cached(`rbox:${w}:${h}:${d}:${r}`,()=>{
    const bevel=Math.min(.02,h*.2,w*.15,d*.15),iw=w-bevel*2,id=d-bevel*2,s=new T.Shape(),x=-iw/2,y=-id/2;r=Math.max(.001,Math.min(r,iw/2,id/2));
    s.moveTo(x+r,y);s.lineTo(x+iw-r,y);s.quadraticCurveTo(x+iw,y,x+iw,y+r);s.lineTo(x+iw,y+id-r);
    s.quadraticCurveTo(x+iw,y+id,x+iw-r,y+id);s.lineTo(x+r,y+id);s.quadraticCurveTo(x,y+id,x,y+id-r);
    s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const g=new T.ExtrudeGeometry(s,{depth:Math.max(.001,h-bevel*2),bevelEnabled:bevel>.002,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:10});
    g.rotateX(-Math.PI/2);g.translate(0,-h/2+bevel,0);g.computeVertexNormals();return g;
  });
}
/** Boxes get a small rounded edge (RoundedBoxGeometry) unless they are paper-thin. */
export const box=(w:number,h:number,d:number)=>cached(`box:${w}:${h}:${d}`,()=>{const m=Math.min(w,h,d);return m<.03?new T.BoxGeometry(w,h,d):new RoundedBoxGeometry(w,h,d,2,Math.min(.025,m*.2));});
// Round shapes use at least twice the segments they ask for (smoother silhouettes under outlines).
export const cyl=(rt:number,rb:number,h:number,seg=16,axis:'y'|'x'|'z'='y')=>cached(`cyl:${rt}:${rb}:${h}:${seg}:${axis}`,()=>{const g=new T.CylinderGeometry(rt,rb,h,Math.max(24,seg*2));if(axis==='x')g.rotateZ(Math.PI/2);if(axis==='z')g.rotateX(Math.PI/2);return g;});
export const sphere=(r:number,w=14,h=10)=>cached(`sph:${r}:${w}:${h}`,()=>new T.SphereGeometry(r,Math.max(24,w*2),Math.max(16,h*2)));
export const ico=(r:number)=>cached(`ico:${r}`,()=>new T.IcosahedronGeometry(r,2));
export const capsule=(r:number,l:number)=>cached(`cap:${r}:${l}`,()=>new T.CapsuleGeometry(r,l,10,28));

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
/** Floor tiles with grout lines; `n` tiles per texture edge. */
export function tiles(a:string,b:string,grout='rgba(40,40,60,0.18)',n=4){return canvasTex(256,256,c=>{const s=256/n;for(let j=0;j<n;j++)for(let i=0;i<n;i++){c.fillStyle=(i+j)%2?a:b;c.fillRect(i*s,j*s,s,s);c.fillStyle='rgba(255,255,255,0.06)';c.fillRect(i*s+4,j*s+4,s*.4,3);}c.fillStyle=grout;for(let k=0;k<=n;k++){c.fillRect(k*s-1,0,2,256);c.fillRect(0,k*s-1,256,2);}});}
/** Diagonal hazard stripes. */
export function stripes(a='#ffc629',b='#2b2d42'){return canvasTex(128,128,c=>{c.fillStyle=a;c.fillRect(0,0,128,128);c.fillStyle=b;for(let x=-128;x<256;x+=48){c.beginPath();c.moveTo(x,128);c.lineTo(x+24,128);c.lineTo(x+152,0);c.lineTo(x+128,0);c.fill();}});}
/** Window view: warm-to-cool sky with three parallax skyline layers. */
export function skyView(seed=0){return canvasTex(256,160,c=>{const g=c.createLinearGradient(0,0,0,160);g.addColorStop(0,'#bfe3ff');g.addColorStop(1,'#ffe6c2');c.fillStyle=g;c.fillRect(0,0,256,160);
  ['#9fb6d6','#7d9cc4','#5a77a0'].forEach((col,layer)=>{c.fillStyle=col;const mod=(a:number,n:number)=>((a%n)+n)%n;let x=-mod(seed*37+layer*23,40),k=0;while(x<256){const w=18+mod(k*7+layer*13+seed,5)*8,h=30+layer*18+mod(k*3+seed*11+layer,6)*9;c.fillRect(x,160-h,w,h);x+=w+2+layer*2;k++;}});
  c.fillStyle='rgba(255,255,255,0.35)';c.fillRect(20,18,90,6);c.fillRect(140,30,70,5);});}
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
const sharedUnlit=new Map<string,T.MeshBasicMaterial>();
/** Shared unlit material for static decor that never changes colour. */
export const paint=(color:string)=>{let m=sharedUnlit.get(color);if(!m){m=unlit(color);sharedUnlit.set(color,m);}return m;};
/** Plain opaque toon (and unlit basic) materials that differ only in colour merge into one
 *  vertex-coloured material (colour baked per vertex in linear space, so the shading is identical). */
const bakedMaterials=new Map<string,T.Material>();
const onlyDefines=(m:T.Material,allowed:string[])=>Object.keys(m.defines??{}).every(k=>allowed.includes(k));
function colourOnly(m:T.Material):m is T.MeshToonMaterial|T.MeshBasicMaterial{
  const t=m as T.MeshToonMaterial&T.MeshBasicMaterial;
  const common=!t.map&&!t.alphaMap&&!t.vertexColors&&!t.transparent&&t.opacity===1&&t.visible&&!t.wireframe&&!t.alphaTest&&!t.clippingPlanes&&t.blending===T.NormalBlending;
  if(!common)return false;
  if(t.type==='MeshToonMaterial')return t.emissive.getHex()===0&&t.gradientMap===toon('#ffffff').gradientMap&&onlyDefines(t,['TOON'])&&t.onBeforeCompile===toon('#ffffff').onBeforeCompile&&!t.lightMap&&!t.aoMap&&!t.normalMap&&!t.bumpMap;
  if(t.type==='MeshBasicMaterial')return onlyDefines(t,[])&&!t.lightMap&&!t.aoMap&&!t.envMap&&!t.specularMap;
  return false;
}
function bakedFor(m:T.MeshToonMaterial|T.MeshBasicMaterial){
  const outline=m.userData.outlineParameters?.visible!==false,rim=!m.userData.noRim,key=`${m.type}|${m.side}|${outline}|${rim}|${m.toneMapped}|${m.fog}|${m.depthWrite}|${m.depthTest}|${m.polygonOffset}|${m.polygonOffsetFactor}|${m.polygonOffsetUnits}`;
  let b=bakedMaterials.get(key);
  if(!b){b=m.type==='MeshToonMaterial'?toon('#ffffff').clone():new T.MeshBasicMaterial();b.vertexColors=true;b.side=m.side;b.toneMapped=m.toneMapped;b.depthWrite=m.depthWrite;b.depthTest=m.depthTest;
    b.polygonOffset=m.polygonOffset;b.polygonOffsetFactor=m.polygonOffsetFactor;b.polygonOffsetUnits=m.polygonOffsetUnits;if(m.type==='MeshBasicMaterial')(b as T.MeshBasicMaterial).fog=m.fog;
    if(!outline)b.userData.outlineParameters={visible:false};if(!rim)b.userData.noRim=true;bakedMaterials.set(key,b);}
  return b;
}
/** Merges every static mesh under `group` into one mesh per material (and shadow flags); plain
 *  toon colours share one vertex-coloured material. Level decor is hundreds of small parts; merged
 *  it costs a handful of draw calls (R5-026). Left alone, with their whole subtree: anything hidden,
 *  anything with userData.live (animated, toggled or swapped later), anything `keep` returns true
 *  for, instanced/skinned meshes, multi-material and already vertex-coloured meshes, and
 *  userData.noAO meshes (the merged mesh would lose the flag). A mesh is only merged when all its
 *  children are, so nothing kept loses its parent. */
export function freeze(group:T.Object3D,keep?:(o:T.Object3D)=>boolean){
  group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),buckets=new Map<string,{material:T.Material;cast:boolean;receive:boolean;order:number;geometries:T.BufferGeometry[]}>(),done:T.Mesh[]=[];
  const add=(o:T.Mesh)=>{const source=o.material as T.Material,baked=colourOnly(source);
    let g:T.BufferGeometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);
    g.morphAttributes={};g.clearGroups();
    if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.attributes.normal)g.computeVertexNormals();
    if(baked){const c=source.color,a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(a,3));}
    g=g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));const material=baked?bakedFor(source):source;
    const key=`${material.uuid}|${o.castShadow}|${o.receiveShadow}|${o.renderOrder}`;const b=buckets.get(key)??{material,cast:o.castShadow,receive:o.receiveShadow,order:o.renderOrder,geometries:[] as T.BufferGeometry[]};b.geometries.push(g);buckets.set(key,b);done.push(o);};
  // Post-order walk; returns whether o and everything under it was merged.
  const visit=(o:T.Object3D):boolean=>{
    if(o!==group&&(!o.visible||o.userData.live||keep?.(o)))return false;
    let all=true;for(const child of [...o.children])if(!visit(child))all=false;
    if(o===group)return all;
    if(o instanceof T.Mesh){const m=o.material;
      if(!all||o instanceof T.InstancedMesh||o instanceof T.SkinnedMesh||Array.isArray(m)||(m as T.Material).vertexColors||o.userData.noAO||(o.geometry.attributes.position as T.BufferAttribute|undefined)?.itemSize!==3)return false;
      add(o);return true;}
    // Plain groups count as merged once empty of anything kept; sprites, lights and the rest stay.
    return all&&(o.type==='Group'||o.type==='Object3D');
  };
  visit(group);
  for(const m of done)m.removeFromParent();
  const prune=(o:T.Object3D)=>{for(const child of [...o.children]){prune(child);if((child.type==='Group'||child.type==='Object3D')&&child.children.length===0&&!child.userData.live&&!keep?.(child))o.remove(child);}};prune(group);
  for(const b of buckets.values()){const merged=mergeGeometries(b.geometries,false);if(!merged)continue;const mesh=new T.Mesh(merged,b.material);mesh.castShadow=b.cast;mesh.receiveShadow=b.receive;mesh.renderOrder=b.order;mesh.name='frozen';group.add(mesh);b.geometries.forEach(g=>g.dispose());}
  return buckets.size;
}
/** One coworker blob (body, eye whites, pupils) as a single vertex-coloured mesh. */
const blobGeometries=new Map<string,T.BufferGeometry>();let blobMaterial:T.MeshToonMaterial|undefined;
export function blobMesh(color:string){
  let geometry=blobGeometries.get(color);
  if(!geometry){const parts:[T.BufferGeometry,string,number,number,number][]=[[new T.CapsuleGeometry(.33,.35,6,16),color,0,.55,0]];
    for(const x of [-.1,.1])parts.push([new T.SphereGeometry(.085,12,10),'#ffffff',x,.78,.29],[new T.SphereGeometry(.042,10,8),INK,x,.78,.36]);
    geometry=mergeGeometries(parts.map(([g,c,x,y,z])=>{const n=(g.index?g.toNonIndexed():g).translate(x,y,z),col=new T.Color(c),a=new Float32Array(n.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=col.r;a[i+1]=col.g;a[i+2]=col.b;}n.setAttribute('color',new T.BufferAttribute(a,3));return n;}),false)!;
    blobGeometries.set(color,geometry);}
  if(!blobMaterial){blobMaterial=toon('#ffffff').clone();blobMaterial.vertexColors=true;}
  const m=new T.Mesh(geometry,blobMaterial);m.castShadow=true;m.receiveShadow=true;return m;
}
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
