// Review-5 props viewer (read-only use of src/): lays out prefabs in a row with Pip and a blob for
// scale, optional wireframe physics colliders, silhouette mode, and a free camera. Driven from
// Playwright through window.V.
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createRenderer,toon} from '../../../../src/render/toon';
import {makeProp,prefabs,type PropKind} from '../../../../src/props/prefabs';
import {blob} from '../../../../src/render/actors';
const view=createRenderer(document.getElementById('c') as HTMLCanvasElement);
view.mood(new URLSearchParams(location.search).get('mood')??'meeting');
const floor=new T.Mesh(new T.PlaneGeometry(400,400),toon('#c9bfae'));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;view.scene.add(floor);
const root=new T.Group();view.scene.add(root);
let pip:T.Object3D|undefined;
const pipReady=new Promise<void>(res=>new GLTFLoader().load('/models/pip.glb',g=>{g.scene.traverse(o=>{if(o instanceof T.Mesh){const old=o.material as T.MeshStandardMaterial;o.material=toon('#'+old.color.getHexString());o.castShadow=true;}});pip=g.scene;res();},undefined,()=>res()));
const labels:HTMLElement[]=[];let spots:{text:string;at:T.Vector3}[]=[];
function clear(){root.clear();for(const l of labels)l.remove();labels.length=0;spots=[];}
interface Opts{gap?:number;colliders?:boolean;silhouette?:boolean;pip?:boolean;blob?:boolean;yaw?:number;variant?:number;color?:string;labels?:boolean;tilt?:number}
function show(kinds:PropKind[],o:Opts={}){
  clear();const gap=o.gap??.6;let x=0;const items:{kind:string;x:number}[]=[];
  const add=(obj:T.Object3D,w:number,text:string)=>{obj.position.x=x+w/2;root.add(obj);spots.push({text,at:new T.Vector3(x+w/2,0,1.2)});items.push({kind:text,x:x+w/2});x+=w+gap;};
  if(o.pip!==false&&pip){const p=pip.clone();p.rotation.y=o.yaw??-.5;add(p,.8,'Pip');}
  if(o.blob){const b=blob('#5b9cf0','calm');b.rotation.y=o.yaw??-.5;add(b,.8,'blob');}
  for(const k of kinds){const s=prefabs[k].size,m=makeProp(k,o.color,o.variant??0),g=new T.Group();m.position.y=s[1]/2;m.rotation.y=o.yaw??-.5;
    if(o.tilt){m.rotation.z=o.tilt;}
    g.add(m);
    if(o.colliders){const c=new T.Mesh(new T.BoxGeometry(...s),new T.MeshBasicMaterial({color:'#ff2bd6',wireframe:true,depthTest:false,transparent:true,opacity:.9}));c.userData.outlineParameters={visible:false};c.position.y=s[1]/2;c.rotation.copy(m.rotation);c.renderOrder=5;g.add(c);}
    add(g,Math.hypot(s[0],s[2])*.9,k);}
  if(o.silhouette)root.traverse(ob=>{if(ob instanceof T.Mesh&&!(ob.material as T.MeshBasicMaterial).wireframe){const mm=new T.MeshBasicMaterial({color:'#2b2d42'});mm.userData.outlineParameters={visible:false};ob.material=mm;}});
  root.position.x=-x/2;
  if(o.labels!==false)for(const s of spots){const el=document.createElement('div');el.className='l';el.textContent=s.text;document.body.appendChild(el);labels.push(el);}
  return {width:x,items:items.map(i=>({...i,x:i.x-x/2}))};
}
function cam(tx:number,ty:number,tz:number,dist:number,yaw:number,pitch:number){
  view.camera.position.set(tx+Math.sin(yaw)*Math.cos(pitch)*dist,ty+Math.sin(pitch)*dist,tz+Math.cos(yaw)*Math.cos(pitch)*dist);view.camera.lookAt(tx,ty,tz);view.camera.updateMatrixWorld();
  view.sun.position.set(tx-11,21,tz+13);view.sun.target.position.set(tx,0,tz);view.sun.target.updateMatrixWorld();
}
function draw(){root.updateMatrixWorld(true);view.render();for(let i=0;i<labels.length;i++){const v=spots[i].at.clone();v.x+=root.position.x;v.project(view.camera);labels[i].style.left=`${(v.x*.5+.5)*innerWidth}px`;labels[i].style.top=`${(-v.y*.5+.5)*innerHeight}px`;}}
/** Visual bounds of each prefab model (local, unrotated) vs its physics box. */
function measure(){const out:Record<string,unknown>={};for(const k of Object.keys(prefabs) as PropKind[]){const m=makeProp(k);m.updateMatrixWorld(true);const b=new T.Box3().setFromObject(m),s=prefabs[k].size;
  const half=s.map(v=>v/2);out[k]={size:s,min:b.min.toArray().map(v=>+v.toFixed(3)),max:b.max.toArray().map(v=>+v.toFixed(3)),
    over:{x:+Math.max(b.max.x-half[0],-half[0]-b.min.x).toFixed(3),y:+Math.max(b.max.y-half[1],-half[1]-b.min.y).toFixed(3),z:+Math.max(b.max.z-half[2],-half[2]-b.min.z).toFixed(3)},
    gapBottom:+(b.min.y+half[1]).toFixed(3),fill:+(((b.max.x-b.min.x)*(b.max.y-b.min.y)*(b.max.z-b.min.z))/(s[0]*s[1]*s[2])).toFixed(2)};
  let meshes=0,tris=0;const mats=new Set<string>();m.traverse(o=>{if(o instanceof T.Mesh){meshes++;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;mats.add((o.material as T.Material).type);}});(out[k] as Record<string,unknown>).meshes=meshes;(out[k] as Record<string,unknown>).tris=Math.round(tris);(out[k] as Record<string,unknown>).mats=[...mats];}
  return out;}
(window as unknown as {V:unknown}).V={show,cam,draw,measure,pipReady,view,T,root};
pipReady.then(()=>{document.body.dataset.ready='true';});
