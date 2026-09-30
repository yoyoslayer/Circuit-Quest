// Characters and the star cable: formally dressed coworkers with
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

// ------------------------------------------------------------------ formally dressed coworkers
export type Mood='calm'|'alarm'|'sleepy'|'happy';
export type Accessory='tuft'|'headphones'|'glasses'|'tie'|'mug'|'bun'|'cap'|'sprout';
/** Baked formal worker, one vertex-coloured mesh per pose (one draw call). */
function buildWorker(color:string,mood:Mood,acc:Accessory[],seated:boolean):T.BufferGeometry{
  const parts:{g:T.BufferGeometry;c:string;m:T.Matrix4}[]=[];
  const add=(g:T.BufferGeometry,c:string,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{parts.push({g,c,m:new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz))});};
  const alarm=mood==='alarm',skin=['#e6bc9b','#d5a27e','#efc9aa'][acc.length%3],suit=['#293747','#42464e','#354352'][Math.round(new T.Color(color).r*10)%3];
  const hip=seated?.04:.74,chest=hip+.3,head=hip+.77;
  // A recognisable formal silhouette: jacket, white collar, tie, separate limbs,
  // trousers, shoes, ears, nose, and restrained dark hair. No mascot accessories.
  add(new T.BoxGeometry(.43,.5,.24),suit,0,chest,0);
  add(new T.BoxGeometry(.18,.36,.025),'#f2f0e9',0,chest+.02,.132);
  for(const side of [-1,1])add(new T.BoxGeometry(.07,.3,.035),suit,side*.11,chest+.08,.15,0,0,side*.28);
  add(new T.BoxGeometry(.045,.22,.022),color,0,chest+.02,.158);
  add(new T.BoxGeometry(.065,.06,.025),color,0,chest+.16,.159,0,0,Math.PI/4);
  add(new T.CylinderGeometry(.06,.065,.11,10),skin,0,hip+.59,0);
  add(new T.SphereGeometry(.18,18,12),skin,0,head,0,0,0,0,.88,1.08,.86);
  add(new T.SphereGeometry(.18,16,10,0,Math.PI*2,0,Math.PI*.52),'#25292e',0,head+.04,-.015,0,0,0,.94,.94,.93);
  add(new T.BoxGeometry(.18,.06,.06),'#25292e',-.045,head+.14,.11,0,0,-.12);
  add(new T.SphereGeometry(.025,8,6),skin,0,head-.02,.16);
  for(const side of [-1,1]){
    add(new T.SphereGeometry(.035,8,6),skin,side*.16,head-.01,0,0,0,0,.6,1,.8);
    add(new T.SphereGeometry(alarm?.023:.015,10,8),INK,side*.063,head+.035,.144,0,0,0,1,alarm?1.3:.8,.5);
    add(new T.BoxGeometry(.045,.008,.01),'#25292e',side*.064,head+.075,.142,0,0,side*(alarm?.2:0));
    if(acc.includes('glasses'))add(new T.TorusGeometry(.035,.006,5,14),INK,side*.064,head+.032,.158,0,0,0,1,.75,1);
    add(new T.CapsuleGeometry(.06,.3,5,12),suit,side*.27,chest-.03,.015,seated?-1.05:0,0,side*.06);
    add(new T.SphereGeometry(.062,10,8),skin,side*.27,chest-.24,seated?.2:.02);
    if(seated){
      add(new T.CapsuleGeometry(.075,.24,5,12),suit,side*.11,-.005,.15,Math.PI/2);
      add(new T.CapsuleGeometry(.068,.43,5,12),suit,side*.11,-.3,.34);
      add(new T.BoxGeometry(.15,.09,.27),INK,side*.11,-.55,.42);
    }else{
      add(new T.CapsuleGeometry(.075,.51,5,12),suit,side*.11,.39,0);
      add(new T.BoxGeometry(.15,.09,.28),INK,side*.11,.045,.07);
    }
  }
  add(new T.BoxGeometry(.055,.008,.008),INK,0,head-.075,.148);
  const baked=parts.map(({g,c,m})=>{const n=(g.index?g.toNonIndexed():g).applyMatrix4(m);for(const k of Object.keys(n.attributes))if(!['position','normal','uv'].includes(k))n.deleteAttribute(k);
    const col=new T.Color(c),a=new Float32Array(n.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=col.r;a[i+1]=col.g;a[i+2]=col.b;}n.setAttribute('color',new T.BufferAttribute(a,3));return n;});
  return mergeGeometries(baked,false)!;
}
const workerGeometries=new Map<string,T.BufferGeometry>();let workerMaterial:T.MeshToonMaterial|undefined;
export function worker(color:string,mood:Mood='calm',acc:Accessory[]=[],seated=false){
  const key=`${color}|${mood}|${acc.join(',')}|${seated}`;let g=workerGeometries.get(key);if(!g){g=buildWorker(color,mood,acc,seated);workerGeometries.set(key,g);}
  if(!workerMaterial){workerMaterial=toon('#ffffff').clone();workerMaterial.vertexColors=true;}
  const m=new T.Mesh(g,workerMaterial);m.castShadow=true;m.receiveShadow=true;return m;
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
