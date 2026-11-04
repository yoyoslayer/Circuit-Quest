// Review-5 props-gallery: one or more props, optional collider wireframes, Pip and a blob for scale.
// ?only=a,b &cols=n &yaw=rad &box=1 (collider wireframe) &pip=1 &blob=1 &color=#hex &dist=m &pitch=rad &norim
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createRenderer,toon} from '../../../../src/render/toon';
import {blobMesh} from '../../../../src/render/kit';
import {makeProp,prefabs,type PropKind} from '../../../../src/props/prefabs';
const q=new URLSearchParams(location.search);
const kinds=(q.get('only')?.split(',')??Object.keys(prefabs)) as PropKind[];
const cols=Number(q.get('cols')??7),gap=Number(q.get('gap')??3.2),yaw=Number(q.get('yaw')??-.5);
const view=createRenderer(document.getElementById('c') as HTMLCanvasElement);view.mood(q.get('mood')??'meeting');
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshToonMaterial({color:q.get('floor')??'#e9dfcc'}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;view.scene.add(floor);
const rows=Math.ceil(kinds.length/cols),spots:{kind:string;at:T.Vector3}[]=[];
const colors=q.get('color')?.split(',');
kinds.forEach((k,i)=>{const m=makeProp(k,colors?colors[i%colors.length]:undefined,Number(q.get('variant')??i%5));const x=(i%cols-(cols-1)/2)*gap,z=(Math.floor(i/cols)-(rows-1)/2)*gap;
  const y=prefabs[k].size[1]/2+.001;m.position.set(x,y,z);m.rotation.y=yaw;view.scene.add(m);
  if(q.has('box')){const [w,h,d]=prefabs[k].size;const e=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w,h,d)),new T.LineBasicMaterial({color:'#ff2bd6',depthTest:false}));e.renderOrder=9;e.position.copy(m.position);e.rotation.y=yaw;view.scene.add(e);}
  if(!q.has('nolabel'))spots.push({kind:k,at:new T.Vector3(x,0,z+prefabs[k].size[2]/2+.4)});});
let ready=0;const need=q.has('pip')?1:0;
if(q.has('blob')){const b=blobMesh('#5b9cf0');b.position.set(Number(q.get('bx')??-1.3),0,Number(q.get('bz')??0));view.scene.add(b);}
if(q.has('pip'))new GLTFLoader().load('/models/pip.glb',g=>{g.scene.traverse(o=>{if(o instanceof T.Mesh){const old=o.material as T.MeshStandardMaterial;o.material=toon('#'+old.color.getHexString());o.castShadow=true;}});
  g.scene.position.set(Number(q.get('px')??1.3),0,Number(q.get('pz')??0));g.scene.rotation.y=-.4;view.scene.add(g.scene);ready++;const bb=new T.Box3().setFromObject(g.scene);(window as any).pipBox=[bb.min.toArray(),bb.max.toArray()];draw();});
const cam=view.camera,span=Number(q.get('dist')??Math.max(cols,rows*1.6)*gap),pitch=Number(q.get('pitch')??.65);
const ty=Number(q.get('ty')??0);cam.position.set(0,ty+span*Math.sin(pitch),span*Math.cos(pitch));cam.lookAt(0,ty,0);
if(q.get('fov')){cam.fov=Number(q.get('fov'));cam.updateProjectionMatrix();}
view.sun.position.set(-11,21,13);
const draw=()=>{view.render();for(const s of spots){const v=s.at.clone().project(cam);let el=document.getElementById(`l-${s.kind}`);if(!el){el=document.createElement('div');el.className='l';el.id=`l-${s.kind}`;el.textContent=s.kind;document.body.appendChild(el);}
  el.style.left=`${(v.x*.5+.5)*innerWidth}px`;el.style.top=`${(-v.y*.5+.5)*innerHeight}px`;}if(ready>=need)document.body.dataset.ready='true';};
requestAnimationFrame(()=>requestAnimationFrame(draw));addEventListener('resize',draw);
