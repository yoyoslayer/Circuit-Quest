import {launch} from '../cap.mjs';import {hook} from '../observatory-models/hook.mjs';
const g=await launch('observatory',{fullfx:true});await hook(g);await g.advance(.3);
const r=await g.page.evaluate(()=>{const s=window.__scene,out={torus43:0,shade:0,bookshelfBoard:0};const cols={};
  s.traverse(o=>{const p=o.geometry?.parameters||{};const n=o.isInstancedMesh?o.count:o.isMesh?1:0;if(!n)return;
    if(o.geometry.type==='TorusGeometry'&&Math.abs(p.radius-.43)<1e-3&&Math.abs(p.tube-.018)<1e-3){out.torus43+=n;}
    if(o.geometry.type==='CylinderGeometry'&&Math.abs(p.radiusTop-.18)<1e-3&&Math.abs(p.radiusBottom-.32)<1e-3&&Math.abs(p.height-.34)<1e-3){out.shade+=n;}
    if(o.geometry.type==='SphereGeometry'&&Math.abs(p.radius-.45)<1e-3&&p.widthSegments===16){const c='#'+o.material.color.getHexString();cols[c]=(cols[c]||0)+n;}});
  out.beanbagBodyColors=cols;return out;});
console.log(JSON.stringify(r));
await g.close();
