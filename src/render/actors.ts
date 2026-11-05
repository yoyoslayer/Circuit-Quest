// Characters and the star cable (ported from mockups/look/actors.js): coworker blobs with
// personality, glossy toon plastic, and the cable as a thick hose with a strain gradient.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {toon,toonRamp,INK} from './toon';

/** Toon plus a hard, stepped view-space highlight: glossy plastic that still reads as toon. */
const glossy=new Map<string,T.MeshToonMaterial>();
export function glossyToon(color:string,{vertexColors=false,spec=.9,size=.965}={}){
  const key=`${color}|${vertexColors}|${spec}|${size}`;let m=glossy.get(key);if(m)return m;
  m=new T.MeshToonMaterial({color,gradientMap:toonRamp,vertexColors});
  m.onBeforeCompile=s=>{s.uniforms.specK={value:spec};s.uniforms.specEdge={value:size};
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float specK; uniform float specEdge;').replace('#include <opaque_fragment>',`
      { vec3 L = normalize(vec3(-.35,.75,.55)); vec3 V = normalize(vViewPosition); vec3 H = normalize(L + V);
        float s = smoothstep(specEdge, specEdge + .012, dot(normalize(normal), H));
        outgoingLight = mix(outgoingLight, vec3(1.,.98,.93) * max(1., length(outgoingLight)), s * specK); }
      #include <opaque_fragment>`);};
  m.customProgramCacheKey=()=>'glossyToon'+spec+size;glossy.set(key,m);return m;
}
/** HDR unlit colour for bloom (colour * k survives the 1.3 bloom threshold). */
export function hot(color:string,k=3){const m=new T.MeshBasicMaterial({color});m.color.multiplyScalar(k);m.userData.outlineParameters={visible:false};return m;}

// ------------------------------------------------------------------ coworker blobs
export type Mood='calm'|'alarm'|'sleepy'|'happy';
export type Accessory='tuft'|'headphones'|'glasses'|'tie'|'mug'|'bun'|'cap'|'sprout';
const shadeHex=(hex:string,l:number)=>{const c=new T.Color(hex);c.offsetHSL(0,0,l);return '#'+c.getHexString();};
/** Builds a blob's parts, then bakes them into one vertex-coloured mesh (one draw call). */
function buildBlob(color:string,mood:Mood,acc:Accessory[]):T.BufferGeometry{
  const parts:{g:T.BufferGeometry;c:string;m:T.Matrix4;head:boolean}[]=[];
  const add=(g:T.BufferGeometry,c:string,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{parts.push({g,c,head:y>.64,m:new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz))});};
  const dark=shadeHex(color,-.12),alarm=mood==='alarm';
  add(new T.CapsuleGeometry(.33,.35,12,36),color,0,.55,0,0,0,0,1,1,.96);
  for(const s of [-1,1]){
    add(new T.SphereGeometry(alarm?.105:.088,24,16),'#ffffff',s*.105,.8,.285);
    add(new T.SphereGeometry(alarm?.03:.045,16,12),INK,s*.105,.8,.365);
    add(new T.SphereGeometry(.015,6,4),'#ffffff',s*.105+.02,.82,.405);
    if(mood==='sleepy')add(new T.SphereGeometry(.094,14,8,0,Math.PI*2,0,Math.PI/2),color,s*.105,.8,.29,.35,0,0,1.06,1.06,1.06);
    add(new T.SphereGeometry(.05,10,6),'#ff9fb4',s*.2,.68,.265,0,0,0,1,.6,.35);
    add(new T.CapsuleGeometry(.07,.14,6,16),color,s*.35,.44,.02,0,0,s*(alarm?-2.3:.35));
  }
  if(mood==='happy'||mood==='calm'){const k=mood==='happy'?1:.7;add(new T.TorusGeometry(.055,.014,6,14,Math.PI),INK,0,.7,.318,0,0,Math.PI,k,mood==='happy'?1:.6,1);}
  if(alarm)add(new T.TorusGeometry(.035,.014,6,14),INK,0,.67,.325,0,0,0,1,1.3,1);
  for(const a of acc){
    if(a==='tuft')for(const [x,z,r] of [[0,0,0],[-.07,.03,.5],[.07,.02,-.5]])add(new T.ConeGeometry(.06,.2,8),dark,x,1.1,z,0,0,r);
    if(a==='bun')add(new T.SphereGeometry(.13,12,10),dark,0,1.1,-.08);
    if(a==='sprout'){add(new T.CylinderGeometry(.012,.012,.16,6),'#4caf50',0,1.13,0);add(new T.SphereGeometry(.07,10,6),'#6cc58a',.06,1.22,0,0,0,-.4,1.3,.45,.8);}
    if(a==='headphones'){add(new T.TorusGeometry(.35,.035,8,24,Math.PI),'#3a3d55',0,.8,0);for(const s of [-1,1])add(new T.CylinderGeometry(.1,.1,.08,16),'#e5484d',s*.35,.8,0,0,0,Math.PI/2);}
    if(a==='glasses'){for(const s of [-1,1])add(new T.TorusGeometry(.1,.016,6,18),INK,s*.105,.8,.37);add(new T.BoxGeometry(.06,.016,.016),INK,0,.81,.38);}
    if(a==='tie'){add(new T.BoxGeometry(.08,.22,.03),'#e5484d',0,.44,.325,-.15);add(new T.BoxGeometry(.1,.06,.04),'#c53a3f',0,.57,.318);}
    if(a==='cap'){add(new T.SphereGeometry(.34,16,8,0,Math.PI*2,0,Math.PI/2),'#3f7fd6',0,.93,0,0,0,0,1,.7,1);add(new T.CylinderGeometry(.2,.2,.03,16),'#3f7fd6',0,.95,.28,0,0,0,1,1,.7);}
    if(a==='mug'){add(new T.CylinderGeometry(.075,.065,.16,12),'#fffaf0',.34,.55,.2);add(new T.TorusGeometry(.04,.012,6,10),'#fffaf0',.42,.55,.2,0,Math.PI/2);add(new T.CylinderGeometry(.062,.062,.01,12),'#6b4a2e',.34,.63,.2);}
  }
  const headRanges:[number,number][]=[];let offset=0;
  const baked=parts.map(({g,c,m,head})=>{const n=(g.index?g.toNonIndexed():g).applyMatrix4(m);for(const k of Object.keys(n.attributes))if(!['position','normal','uv'].includes(k))n.deleteAttribute(k);
    const count=n.attributes.position.count;if(head){const last=headRanges.at(-1);if(last&&last[0]+last[1]===offset)last[1]+=count;else headRanges.push([offset,count]);}offset+=count;
    const col=new T.Color(c),a=new Float32Array(n.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=col.r;a[i+1]=col.g;a[i+2]=col.b;}n.setAttribute('color',new T.BufferAttribute(a,3));return n;});
  const result=mergeGeometries(baked,false)!;result.userData.headRanges=headRanges;return result;
}
// One lightweight visual clock. Geometry is posed before the renderer uploads it, so toon,
// outlines and the following pass all see the same face. No extra mesh/draw call is required.
let actorFrame=0,actorTime=0,actorClock=false;
function startActorClock(){if(actorClock||typeof requestAnimationFrame!=='function')return;actorClock=true;
  const tick=(time:number)=>{actorFrame++;actorTime=time/1000;requestAnimationFrame(tick);};requestAnimationFrame(tick);}
const actorFocus=new WeakMap<T.Object3D,{pip?:T.Object3D;nextSearch:number;frame:number;point:T.Vector3}>();
function focusFor(actor:T.Object3D){
  let root:T.Object3D=actor;while(root.parent)root=root.parent;
  let data=actorFocus.get(root);if(!data){data={nextSearch:0,frame:-1,point:new T.Vector3()};actorFocus.set(root,data);}
  if(!data.pip&&actorTime>=data.nextSearch){data.pip=root.getObjectByName('Pip');data.nextSearch=actorTime+1;}
  if(!data.pip)return undefined;
  if(data.frame!==actorFrame){data.pip.getWorldPosition(data.point);data.point.y+=1.3;data.frame=actorFrame;}
  return data.point;
}
/** The torso stays baked; eyes, cheeks, mouth and head accessories glance independently.
 * Only changed face ranges upload, quantised below a typical screen pixel. This preserves
 * the single-mesh batching benefit and works with OutlineEffect without custom shaders. */
export class CoworkerMesh extends T.Mesh<T.BufferGeometry,T.MeshToonMaterial>{
  readonly look=new T.Vector2();
  private basePosition:Float32Array;private baseNormal:Float32Array;private ranges:[number,number][];
  private poseYaw=Infinity;private posePitch=Infinity;private frame=-1;private lastTime=0;private parentY=0;
  constructor(base:T.BufferGeometry,material:T.MeshToonMaterial){
    super(base.clone(),material);this.basePosition=base.attributes.position.array as Float32Array;this.baseNormal=base.attributes.normal.array as Float32Array;
    this.ranges=base.userData.headRanges??[];
    (this.geometry.attributes.position as T.BufferAttribute).setUsage(T.DynamicDrawUsage);
    (this.geometry.attributes.normal as T.BufferAttribute).setUsage(T.DynamicDrawUsage);
    if(!base.boundingSphere)base.computeBoundingSphere();this.geometry.boundingSphere=base.boundingSphere!.clone();this.geometry.boundingSphere.radius+=.2;
    startActorClock();
  }
  updateLook(target:T.Vector3|undefined,time:number,dt:number){
    const elapsed=Math.max(0,Math.min(.1,dt)),k=1-Math.exp(-elapsed*9);
    let yaw=Math.sin(time*.55)*.08,pitch=Math.cos(time*.8)*.025;
    if(target){const local=this.worldToLocal(target.clone()),d=Math.hypot(local.x,local.z);if(d<8){yaw=T.MathUtils.clamp(Math.atan2(local.x,local.z),-.6,.6);pitch=T.MathUtils.clamp(-Math.atan2(local.y-.8,Math.max(.2,d))*.4,-.16,.16);}}
    const parentY=this.parent?.position.y??0,velocity=elapsed>0?(parentY-this.parentY)/elapsed:0;this.parentY=parentY;
    pitch+=T.MathUtils.clamp(velocity*.025,-.08,.08); // A little head lag on a startled hop or happy bounce.
    this.look.x+=(yaw-this.look.x)*k;this.look.y+=(pitch-this.look.y)*k;
    const a=Math.round(this.look.x*50)/50,b=Math.round(this.look.y*50)/50;if(a===this.poseYaw&&b===this.posePitch)return;
    this.poseYaw=a;this.posePitch=b;
    const cy=Math.cos(a),sy=Math.sin(a),cp=Math.cos(b),sp=Math.sin(b);
    const position=this.geometry.attributes.position as T.BufferAttribute,normal=this.geometry.attributes.normal as T.BufferAttribute;
    const out=position.array as Float32Array,norm=normal.array as Float32Array;position.clearUpdateRanges();normal.clearUpdateRanges();
    for(const [start,count] of this.ranges){for(let i=start*3,end=(start+count)*3;i<end;i+=3){
      const x=this.basePosition[i],y=this.basePosition[i+1]-.72,z=this.basePosition[i+2],py=cp*y-sp*z,pz=sp*y+cp*z;
      out[i]=cy*x+sy*pz;out[i+1]=py+.72;out[i+2]=-sy*x+cy*pz;
      const nx=this.baseNormal[i],ny=this.baseNormal[i+1],nz=this.baseNormal[i+2],npy=cp*ny-sp*nz,npz=sp*ny+cp*nz;
      norm[i]=cy*nx+sy*npz;norm[i+1]=npy;norm[i+2]=-sy*nx+cy*npz;
    }position.addUpdateRange(start*3,count*3);normal.addUpdateRange(start*3,count*3);}
    position.needsUpdate=true;normal.needsUpdate=true;
  }
  override updateMatrixWorld(force?:boolean){
    super.updateMatrixWorld(force);if(!this.visible||this.frame===actorFrame)return;
    const dt=this.frame<0?1/60:actorTime-this.lastTime;this.frame=actorFrame;this.lastTime=actorTime;
    this.updateLook(focusFor(this),actorTime,dt);
  }
}
const blobGeometries=new Map<string,T.BufferGeometry>();let blobMaterial:T.MeshToonMaterial|undefined;
export function blob(color:string,mood:Mood='calm',acc:Accessory[]=[]){
  const key=`${color}|${mood}|${acc.join(',')}`;let g=blobGeometries.get(key);if(!g){g=buildBlob(color,mood,acc);blobGeometries.set(key,g);}
  if(!blobMaterial){blobMaterial=toon('#ffffff').clone();blobMaterial.vertexColors=true;}
  const m=new CoworkerMesh(g,blobMaterial);m.castShadow=true;m.receiveShadow=true;return m;
}

// ------------------------------------------------------------------ cable hose
export const STRAIN:[number,string][]=[[0,'#f5f1dc'],[.55,'#f5f1dc'],[.72,'#ffd451'],[.86,'#ff922f'],[1,'#f34e56']];
const strainColors=STRAIN.map(([t,c])=>[t,new T.Color(c)] as const),scratch=new T.Color();
export function strainAt(t:number,out=scratch){for(let i=1;i<strainColors.length;i++)if(t<=strainColors[i][0]){const [a,ca]=strainColors[i-1],[b,cb]=strainColors[i];return out.copy(ca).lerp(cb,(t-a)/(b-a||1));}return out.copy(strainColors[strainColors.length-1][1]);}
const BAND=new T.Color('#2f3147');
/** Tube along `points`; strain(u) maps 0 (reel) .. 1 (plug) to the strain ramp; `bands` stripes
 *  the thick cable; `tint` overrides the ramp (dead cables, gold when connected). */
export function hoseGeometry(points:T.Vector3[],{radius=.085,strain=(u:number)=>u*.4,bands=false,tint}:{radius?:number;strain?:(u:number)=>number;bands?:boolean;tint?:T.Color}={}){
  const curve=new T.CatmullRomCurve3(points,false,'centripetal'),length=curve.getLength(),segs=Math.max(24,Math.round(length*10)),radial=10;
  const geo=new T.TubeGeometry(curve,segs,radius,radial,false),col=new Float32Array(geo.attributes.position.count*3),c=new T.Color();
  for(let i=0;i<=segs;i++){if(tint)c.copy(tint);else strainAt(strain(i/segs),c);if(bands&&Math.floor(i/segs*length/.32)%2)c.lerp(BAND,tint?.7:1);
    for(let j=0;j<=radial;j++){const k=(i*(radial+1)+j)*3;col[k]=c.r;col[k+1]=c.g;col[k+2]=c.b;}}
  geo.setAttribute('color',new T.BufferAttribute(col,3));return {geo,curve,length};
}
export const hoseMaterial=()=>glossyToon('#ffffff',{vertexColors:true,spec:.75,size:.982});
/** Glowing current slugs that travel from supply to load along a powered cable. */
export class Pulses{
  group=new T.Group();private slugs:T.Mesh[]=[];private material=hot('#6fe9ff',2.5);
  constructor(parent:T.Object3D,count=4,radius=.1){parent.add(this.group);for(let i=0;i<count;i++){const m=new T.Mesh(new T.CapsuleGeometry(radius,.4,4,10),this.material);m.userData.noAO=true;m.castShadow=false;this.slugs.push(m);this.group.add(m);}this.group.visible=false;}
  update(curve:T.Curve<T.Vector3>|undefined,length:number,time:number,on:boolean,reverse=false){
    this.group.visible=on&&!!curve;if(!on||!curve)return;const up=new T.Vector3(0,1,0);
    this.slugs.forEach((m,i)=>{let u=((time*3/Math.max(length,1))+i/this.slugs.length)%1;if(reverse)u=1-u;const p=curve.getPointAt(u),t=curve.getTangentAt(u);m.position.copy(p);m.quaternion.setFromUnitVectors(up,t);});
  }
}
