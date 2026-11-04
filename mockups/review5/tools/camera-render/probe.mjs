// What fills the frame at lunch yaw -.9 zoom 12 near the storeroom? Ray from screen points.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const g=await launch('lunch',{fullfx:true});await hook(g);await g.advance(.5);await g.walk(-10,-1.5);
await g.page.evaluate(()=>{const G=window.__game;G.yaw=-.9;G.pitch=-.3;G.zoom=12;});await g.advance(.1);await g.page.waitForTimeout(2200);
const r=await g.page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');const G=window.__game,c=G.view.camera;const out={cam:c.position.toArray().map(v=>+v.toFixed(2)),pip:G.player.translation(),walls:G.shellWalls.map(w=>+w.group.scale.y.toFixed(2))};
  const rc=new T.Raycaster();out.hits=[];for(const [x,y] of [[0,-.2],[-.5,-.5],[.5,-.3],[0,.3]]){rc.setFromCamera(new T.Vector2(x,y),c);const h=rc.intersectObjects(G.view.scene.children,true).filter(h=>h.object.visible)[0];if(h){const m=Array.isArray(h.object.material)?h.object.material[0]:h.object.material;const bb=new T.Box3().setFromObject(h.object);out.hits.push({pt:[x,y],d:+h.distance.toFixed(2),p:h.point.toArray().map(v=>+v.toFixed(2)),col:m.color?.getHexString(),type:h.object.type,inDecor:(()=>{let q=h.object;while(q){if(q===G.decorRoot)return true;q=q.parent;}return false;})(),bbMin:bb.min.toArray().map(v=>+v.toFixed(2)),bbMax:bb.max.toArray().map(v=>+v.toFixed(2))});}}
  return out;});
console.log(JSON.stringify(r,null,1));console.log(await g.close());
