// Verifier: which clutter kinds exist (cart/cabinet?), counts per instanced batch dims.
import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true,start:false});
await g.page.addInitScript(()=>{window.__seen=[];const t=new EventTarget();t.addEventListener('observe',e=>window.__seen.push(e.detail));window.__THREE_DEVTOOLS__=t;});
await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});
await g.advance(.2);
const r=await g.page.evaluate(()=>{const sc=window.__seen.filter(o=>o&&o.isScene).sort((a,b)=>{let na=0,nb=0;a.traverse(()=>na++);b.traverse(()=>nb++);return nb-na;})[0];
  const out=[];sc.traverse(o=>{if(!o.isInstancedMesh)return;o.geometry.computeBoundingBox();const s=o.geometry.boundingBox.getSize(o.position.clone());out.push([s.toArray().map(v=>+v.toFixed(2)).join('x'),o.material.color?.getHexString(),o.count]);});return out;});
const want={'cart tray 1.13x0.04x0.68':r.filter(x=>x[0].startsWith('1.13')),'cabinet body 0.7x1.6':r.filter(x=>x[0].startsWith('0.7x1.6')),'bookshelf post':r.filter(x=>x[0]==='0.07x1.8x0.07'),'beanbag':r.filter(x=>x[0].startsWith('0.9x0.43')),'plant pot':r.filter(x=>x[1]==='e07a4f'),'bin':r.filter(x=>x[1]==='3a3d55'),'paper':r.filter(x=>x[0]==='0.3x0.03x0.23')};
console.log(JSON.stringify(want));console.log('batches',r.length);
console.log('errors',JSON.stringify(await g.close()));
