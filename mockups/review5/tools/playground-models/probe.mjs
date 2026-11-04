// Lists visible standalone (non-instanced, non-frozen) meshes on game.root with world positions, to identify stray floor rings.
import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true,start:false});
await g.page.addInitScript(()=>{window.__seen=[];const t=new EventTarget();t.addEventListener('observe',e=>window.__seen.push(e.detail));window.__THREE_DEVTOOLS__=t;});
await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});
const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
await g.advance(1);
const out=await g.page.evaluate(()=>{const sc=window.__seen.filter(o=>o&&o.isScene).sort((a,b)=>{let na=0,nb=0;a.traverse(()=>na++);b.traverse(()=>nb++);return nb-na;})[0];
  const res=[];sc.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;let v=true,p=o;while(p){if(!p.visible)v=false;p=p.parent;}if(!v)return;o.geometry.computeBoundingSphere();const r=o.geometry.boundingSphere.radius*o.getWorldScale(o.position.clone()).x;
    const w=o.getWorldPosition(o.position.clone());if(r<.6)res.push([o.geometry.type,+r.toFixed(2),...w.toArray().map(v=>+v.toFixed(2)),o.material.type,o.material.color?.getHexString(),o.material.opacity]);});return res;});
for(const r of out)console.log(JSON.stringify(r));
console.log('errors',JSON.stringify(await g.close()));
