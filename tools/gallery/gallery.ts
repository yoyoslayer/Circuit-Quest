// Dev page: every prop model in a grid under the game's toon renderer (npx vite, then /tools/gallery/).
// ?only=desk,chair narrows it; ?cols=6 sets the grid width; ?yaw=2.64 turns the props (back views);
// ?box=1 draws each collider part as a wireframe; ?dist= ?pitch= move the camera.
// The grid is sorted by height, tallest in the back row, so small props are never hidden.
import * as T from 'three';
import {createRenderer} from '../../src/render/toon';
import {makeProp,prefabs,type PropKind} from '../../src/props/prefabs';
const q=new URLSearchParams(location.search);
const kinds=((q.get('only')?.split(',')??Object.keys(prefabs)) as PropKind[]).sort((a,b)=>q.has('only')?0:prefabs[b].size[1]-prefabs[a].size[1]);
const cols=Number(q.get('cols')??7),gap=3.2,yaw=Number(q.get('yaw')??-.5);
const view=createRenderer(document.getElementById('c') as HTMLCanvasElement);
view.mood('meeting');
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshToonMaterial({color:'#e9dfcc'}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;view.scene.add(floor);
const rows=Math.ceil(kinds.length/cols),spots:{kind:string;at:T.Vector3}[]=[];
const wire=new T.LineBasicMaterial({color:'#e040fb',depthTest:false});
kinds.forEach((k,i)=>{const m=makeProp(k,undefined,i%5);const x=(i%cols-(cols-1)/2)*gap,z=(Math.floor(i/cols)-(rows-1)/2)*gap;
  m.position.set(x,prefabs[k].size[1]/2+.001,z);m.rotation.y=yaw;view.scene.add(m);spots.push({kind:k,at:new T.Vector3(x,0,z+prefabs[k].size[2]/2+.4)});
  if(q.has('box')){const [w,h,d]=prefabs[k].size;for(const c of prefabs[k].collider??[{shape:'box' as const,half:[w/2,h/2,d/2] as [number,number,number]}]){
    const g=c.shape==='box'?new T.BoxGeometry(c.half[0]*2,c.half[1]*2,c.half[2]*2):c.shape==='cone'?new T.ConeGeometry(c.r,c.hh*2,16):new T.CylinderGeometry(c.r,c.r,c.hh*2,16);
    const e=new T.LineSegments(new T.EdgesGeometry(g),wire);e.renderOrder=5;if(c.at)e.position.set(...c.at);m.add(e);}}});
const cam=view.camera,span=Number(q.get('dist')??Math.max(cols,rows*1.6)*gap),pitch=Number(q.get('pitch')??.65);cam.position.set(0,span*Math.sin(pitch)+span*.1,span*Math.cos(pitch));cam.lookAt(0,0,0);
view.sun.position.set(-11,21,13);
const draw=()=>{view.render();for(const s of spots){const v=s.at.clone().project(cam);let el=document.getElementById(`l-${s.kind}`);if(!el){el=document.createElement('div');el.className='l';el.id=`l-${s.kind}`;el.textContent=s.kind;document.body.appendChild(el);}
  el.style.left=`${(v.x*.5+.5)*innerWidth}px`;el.style.top=`${(-v.y*.5+.5)*innerHeight}px`;}document.body.dataset.ready='true';};
requestAnimationFrame(()=>requestAnimationFrame(draw));addEventListener('resize',draw);
