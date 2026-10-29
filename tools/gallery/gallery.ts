// Dev page: every prop model in a grid under the game's toon renderer (npx vite, then /tools/gallery/).
// ?only=desk,chair narrows it; ?cols=6 sets the grid width.
import * as T from 'three';
import {createRenderer} from '../../src/render/toon';
import {makeProp,prefabs,type PropKind} from '../../src/props/prefabs';
const q=new URLSearchParams(location.search);
const kinds=(q.get('only')?.split(',')??Object.keys(prefabs)) as PropKind[];
const cols=Number(q.get('cols')??7),gap=3.2;
const view=createRenderer(document.getElementById('c') as HTMLCanvasElement);
view.mood('meeting');
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshToonMaterial({color:'#e9dfcc'}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;view.scene.add(floor);
const rows=Math.ceil(kinds.length/cols),spots:{kind:string;at:T.Vector3}[]=[];
kinds.forEach((k,i)=>{const m=makeProp(k,undefined,i%5);const x=(i%cols-(cols-1)/2)*gap,z=(Math.floor(i/cols)-(rows-1)/2)*gap;
  m.position.set(x,prefabs[k].size[1]/2+.001,z);m.rotation.y=-.5;view.scene.add(m);spots.push({kind:k,at:new T.Vector3(x,0,z+prefabs[k].size[2]/2+.4)});});
const cam=view.camera,span=Math.max(cols,rows*1.6)*gap;cam.position.set(0,span*.75,span*.95);cam.lookAt(0,0,0);
view.sun.position.set(-11,21,13);
const draw=()=>{view.render();for(const s of spots){const v=s.at.clone().project(cam);let el=document.getElementById(`l-${s.kind}`);if(!el){el=document.createElement('div');el.className='l';el.id=`l-${s.kind}`;el.textContent=s.kind;document.body.appendChild(el);}
  el.style.left=`${(v.x*.5+.5)*innerWidth}px`;el.style.top=`${(-v.y*.5+.5)*innerHeight}px`;}document.body.dataset.ready='true';};
requestAnimationFrame(()=>requestAnimationFrame(draw));addEventListener('resize',draw);
