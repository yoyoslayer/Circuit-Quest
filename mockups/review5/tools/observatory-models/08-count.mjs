import {launch} from '../cap.mjs';import {hook} from './hook.mjs';
const g=await launch('observatory',{fullfx:true});await hook(g);await g.advance(.2);
const r=await g.page.evaluate(()=>{const s=window.__scene,out={};s.traverse(o=>{if(o.isInstancedMesh){const p=o.geometry.parameters||{};const k=o.geometry.type+JSON.stringify(p).slice(0,80);out[k]=(out[k]||0)+o.count;}});
  return Object.entries(out).sort((a,b)=>b[1]-a[1]).slice(0,40);});
console.log(r.map(x=>x[1]+'  '+x[0]).join('\n'));
const m=await g.page.evaluate(()=>{const s=window.__scene;let n=0,mats={};s.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){n++;}});return n;});console.log('plain meshes',m);
console.log(JSON.stringify(await g.close()));
