// Draw-call breakdown: meshes outside the merged decor, by owner.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const g=await launch('lunch',{fullfx:true});
await hook(g);await g.advance(.5);
console.log(JSON.stringify(await g.page.evaluate(()=>{const G=window.__g,dr=G.decorRoot;let inDecor=0,inst=0,other=0,sprites=0,shell=0,occl=0;const vis=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  const shellGroups=new Set(G.shellWalls.map(s=>s.group.parent));
  G.view.scene.traverse(o=>{if(o.isSprite&&vis(o)){sprites++;return;}if(!o.isMesh||!vis(o))return;let d=false,s=false;for(let p=o;p;p=p.parent){if(p===dr)d=true;if(shellGroups.has(p))s=true;}
    if(o.isInstancedMesh)inst++;else if(d)inDecor++;else if(s)shell++;else other++;});
  return {inDecor,inst,shell,occluders:G.occluders.length,other,sprites,calls:G.view.renderer.info.render.calls};})));
console.log('errors',JSON.stringify(await g.close()));
