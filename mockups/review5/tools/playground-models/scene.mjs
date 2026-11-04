// Scene census via three's devtools hook: materials, lights, instanced prop batches and positions.
import {launch} from '../cap.mjs';
import {writeFileSync} from 'node:fs';
const g=await launch('playground',{fullfx:true,start:false});
await g.page.addInitScript(()=>{window.__seen=[];const t=new EventTarget();t.addEventListener('observe',e=>window.__seen.push(e.detail));window.__THREE_DEVTOOLS__=t;});
await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});
const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
await g.advance(1);
const out=await g.page.evaluate(()=>{
  const scenes=window.__seen.filter(o=>o&&o.isScene);const sc=scenes.sort((a,b)=>{let na=0,nb=0;a.traverse(()=>na++);b.traverse(()=>nb++);return nb-na;})[0];
  const mats={},lights=[],inst=[],outlineOff={},geoms={};let meshes=0,tris=0;
  sc.traverse(o=>{if(o.isLight)lights.push({type:o.type,pos:o.getWorldPosition(o.position.clone()).toArray().map(v=>+v.toFixed(2)),i:o.intensity});
    if(o.isMesh){meshes++;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){mats[m.type]=(mats[m.type]||0)+1;if(m.userData?.outlineParameters?.visible===false)outlineOff[m.type]=(outlineOff[m.type]||0)+1;}
      const gp=o.geometry.parameters?JSON.stringify(o.geometry.parameters).slice(0,80):o.geometry.type;
      if(o.isInstancedMesh){const pos=[];const m4=new o.matrixWorld.constructor();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m4);const e=m4.elements;pos.push([+e[12].toFixed(2),+e[13].toFixed(2),+e[14].toFixed(2)]);}
        inst.push({geo:o.geometry.type,params:gp,mat:ms[0].type,color:ms[0].color?.getHexString(),count:o.count,pos});}}});
  return {meshes,mats,outlineOff,lights,inst};
});
writeFileSync(new URL('./scene.json',import.meta.url),JSON.stringify(out,null,0));
console.log(JSON.stringify({meshes:out.meshes,mats:out.mats,outlineOff:out.outlineOff,lights:out.lights,batches:out.inst.length}));
console.log('errors',JSON.stringify(await g.close()));
