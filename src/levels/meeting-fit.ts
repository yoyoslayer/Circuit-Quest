// Big Meeting's bigger shell (review 6 rooms pass, 33 x 20 -> 36 x 24 m). The shared room builder
// (src/levels/decor.ts meeting()) places the server racks, the projector screen, the coffee counter
// and the pod rugs at absolute coordinates that were laid out against the old walls. Rather than fork
// it, this refits that dressing once, after it is built and before freezeDecor merges it: each piece
// that hugged a wall moves out with the wall (meshes, lights, glows and their fixed colliders), the pod
// rugs follow the pods, the clock steps clear of a window that now lands on it, the projector beam is
// stretched to the screen's new place, and the new front pod gets a rug of its own.
import * as T from 'three';
import type {Game} from '../game';
import {toon} from '../render/kit';
import * as TX from '../render/textures';
import {PODS} from './meeting';

type Box2={minX:number;maxX:number;minZ:number;maxZ:number};
interface Move {at:Box2;by:[number,number];/** Also move flat floor planes (rugs); off where a floor spans the box. */planes?:boolean;/** Also move fixed colliders. */colliders?:boolean}
const near=(x:number,z:number,r=.06):Box2=>({minX:x-r,maxX:x+r,minZ:z-r,maxZ:z+r});
const inside=(b:Box2,x:number,z:number)=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ;
/** Pod centres before the pass: the rugs decor.ts lays under them are still there. */
const OLD_PODS:[number,number][]=[[-6,-4.5],[-1,-4.5],[4,-4.5],[-6,1.5],[-1,1.5],[4,1.5],[-6,7.6],[-.8,7.6]];
const MOVES:Move[]=[
  // Server closet: racks, LEDs, cable spaghetti, UPS, green glow and lamp into the new back-left corner.
  // The closet's east wall and its live outlet (x > -12.2) stay by the reel.
  {at:{minX:-17,maxX:-12.2,minZ:-11,maxZ:-5.9},by:[-1.5,-2],colliders:true},
  // Projector screen, its pull bar and top housing back onto the back wall.
  {at:{minX:9.5,maxX:15,minZ:-10.2,maxZ:-9.5},by:[0,-2]},
  // Coffee counter (cups, fruit bowl) back against the side wall.
  {at:{minX:-16.4,maxX:-15.2,minZ:2.8,maxZ:6.6},by:[-1.5,0],colliders:true},
  // Carton stacks by the front edge, out to the new front edge.
  {at:{minX:-9.4,maxX:-8.4,minZ:8.6,maxZ:9.6},by:[0,2],colliders:true},
  {at:{minX:7.3,maxX:8.4,minZ:8.7,maxZ:9.7},by:[0,2],colliders:true},
  // Pod rugs follow their pods.
  ...OLD_PODS.map(([x,z],i)=>({at:near(x,z),by:[PODS[i][0]-x,PODS[i][1]-z] as [number,number],planes:true})),
];
const center=new T.Vector3(),bounds=new T.Box3();
const flat=(o:T.Object3D)=>o instanceof T.Mesh&&o.geometry instanceof T.PlaneGeometry;
export function fitMeetingRoom(game:Game){
  const root=game.root,decor=game.decorRoot;root.updateMatrixWorld(true);
  const moved=new Set<T.Object3D>();
  const shift=(o:T.Object3D,[dx,dz]:[number,number])=>{o.position.x+=dx;o.position.z+=dz;moved.add(o);};
  for(const m of MOVES){
    // Decor meshes and groups, by the centre of what they draw (tubes are built in world space).
    for(const o of [...decor.children]){if(moved.has(o)||flat(o)!==!!m.planes)continue;bounds.setFromObject(o);if(bounds.isEmpty())continue;bounds.getCenter(center);if(inside(m.at,center.x,center.z))shift(o,m.by);}
    // Lights and glow sprites decor.ts hangs on root.
    for(const o of [...root.children])if(!moved.has(o)&&(o instanceof T.Light||o instanceof T.Sprite)&&inside(m.at,o.position.x,o.position.z))shift(o,m.by);
    // Their fixed colliders (props, even fixed ones like the glass, and coworkers are never touched).
    if(m.colliders){const own=new Set([...game.props.flatMap(p=>Array.from({length:p.body.numColliders()},(_,i)=>p.body.collider(i).handle)),...game.npcs.map(n=>n.collider?.handle)]);
      const bodies=new Set<unknown>();
      game.world.forEachCollider(c=>{const b=c.parent();if(!b||!b.isFixed()||own.has(c.handle)||bodies.has(b))return;const t=b.translation();if(!inside(m.at,t.x,t.z))return;bodies.add(b);b.setTranslation({x:t.x+m.by[0],y:t.y,z:t.z+m.by[1]},false);});}
  }
  game.world.propagateModifiedBodyPositionsToColliders();
  // The projector screen (on root so it can change) and its beam, stretched from the lens to the screen.
  if(game.screen)game.screen.position.z-=2;
  if(game.beam){const from=new T.Vector3(12,.97,-4.65),to=new T.Vector3(12.2,1.9,-11.75),len=from.distanceTo(to);
    game.beam.position.copy(from).lerp(to,.5);game.beam.scale.set(1,1,len/5.1);game.beam.lookAt(to);}
  // The win's screen light and its floor pool land in front of the moved screen.
  const lightUp=game.lightUp;if(lightUp)game.lightUp=()=>{const before=new Set(root.children);lightUp();for(const o of root.children)if(!before.has(o)&&o.position.z< -8)o.position.z-=2;};
  // The win shot's focus on the lit screen is in game.ts winFocus (z -10.6, the screen's new place).
  // A window now lands where the deadline clock hung: move it onto the pier between the windows at
  // x -6.2 and -3.0.
  const clock=game.clock?.face.parent;if(clock)clock.position.x=-4.6;
  // The new front pod's rug, matching decor.ts's pod islands.
  const [px,pz]=PODS[PODS.length-1],map=TX.carpetTiles('#6c7f99').clone();map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(4.1/2.4,3.5/2.4);map.needsUpdate=true;
  const rug=new T.Mesh(new T.PlaneGeometry(4.1,3.5),toon('#ffffff',{map}));rug.rotation.x=-Math.PI/2;rug.position.set(px,.008,pz);rug.receiveShadow=true;decor.add(rug);
}
