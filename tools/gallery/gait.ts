// Dev page: Pip's procedural rig on a treadmill, side-on. ?speed=4.2 (walk) or 6.8 (run); ?t=0.3 holds
// the pose at that time; ?strip=6 lays out N poses through one cycle side by side.
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createRenderer,toon} from '../../src/render/toon';
import {PipRig} from '../../src/render/pipRig';
const q=new URLSearchParams(location.search),speed=Number(q.get('speed')??4.2),strip=Number(q.get('strip')??0);
const view=createRenderer(document.getElementById('c') as HTMLCanvasElement);view.mood('meeting');
const floor=new T.Mesh(new T.PlaneGeometry(200,200),toon('#e9dfcc'));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;view.scene.add(floor);
for(let x=-20;x<=20;x+=.5){const m=new T.Mesh(new T.BoxGeometry(.02,.002,3),toon('#c9bba0'));m.position.set(x,.001,0);view.scene.add(m);}
const n=Math.max(1,strip),cam=view.camera;
new GLTFLoader().load('/models/pip.glb',g=>{
  const rigs:{rig:PipRig;root:T.Group}[]=[];
  const copies=Array.from({length:n},(_,i)=>i?g.scene.clone(true):g.scene);
  for(let i=0;i<n;i++){const scene=copies[i];scene.traverse(o=>{if(o instanceof T.Mesh){o.material=toon('#'+(o.material as T.MeshStandardMaterial).color.getHexString());o.castShadow=true;}});
    const root=new T.Group();root.add(scene);root.rotation.y=Math.PI/2;root.position.x=(i-(n-1)/2)*1.3;view.scene.add(root);rigs.push({rig:new PipRig(scene),root});}
  cam.position.set(0,1.1,n>1?9+n*.6:4.4);cam.lookAt(0,.75,0);view.sun.position.set(-6,12,10);
  // Run every rig the same time, offset by a fraction of a cycle each, so a strip shows the whole stride.
  const step=1/120,warm=3;
  rigs.forEach(({rig},i)=>{const t=warm+i*(Number(q.get('cycle')??.6)/n);for(let s=0;s<t/step;s++)rig.update({dt:step,time:s*step,speed,grounded:true,rising:false,airborne:0,turnRate:0,carrying:'none',holdingPlug:false,strain:0,won:false,waving:false});});
  view.render();document.body.dataset.ready='true';
});
