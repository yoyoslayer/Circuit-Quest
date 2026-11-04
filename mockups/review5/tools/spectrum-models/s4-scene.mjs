// Scene inspection via the three.js devtools hook (read-only).
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const query=process.argv[2]??'';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const p=await b.newPage({viewport:{width:1440,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.__scenes=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>{const d=e.detail;if(d&&d.isScene)window.__scenes.push(d);});});
await p.goto(`http://127.0.0.1:4173/?level=spectrum&manual&fullfx${query}`);await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
await p.getByRole('button',{name:'Start playing'}).click();
await p.evaluate(()=>window.__circuitCrew.drive.advance(.5));
const out=await p.evaluate(()=>{
  const scene=window.__scenes.find(s=>s.children.length>3)??window.__scenes[0];
  const r=v=>Math.round(v*100)/100;const mats={},lights=[],inst=[],std=[],glossy=[];let meshes=0,noOutline=0;
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{
    if(o.isLight)lights.push({type:o.type,pos:o.getWorldPosition(new o.position.constructor()).toArray().map(r),intensity:o.intensity,distance:o.distance});
    if(o.isMesh||o.isSprite){meshes++;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){mats[m.type]=(mats[m.type]??0)+1;if(m.type==='MeshStandardMaterial'||m.type==='MeshPhongMaterial'||m.type==='MeshPhysicalMaterial')std.push({name:o.name,pos:o.getWorldPosition(new o.position.constructor()).toArray().map(r)});}}
    if(o.isInstancedMesh){o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox,sz=[bb.max.x-bb.min.x,bb.max.y-bb.min.y,bb.max.z-bb.min.z].map(r);const ps=[];const M=new o.matrix.constructor();const v=new o.position.constructor();
      for(let i=0;i<o.count;i++){o.getMatrixAt(i,M);v.setFromMatrixPosition(M);ps.push([r(v.x),r(v.y),r(v.z)]);}
      inst.push({count:o.count,size:sz,color:o.material.color?.getHexString(),type:o.material.type,geo:o.geometry.type,ps});}
  });
  return {meshes,mats,lights,std,inst};
});
writeFileSync('mockups/review5/tools/spectrum-models/scene.json',JSON.stringify(out,null,1));
console.log('meshes',out.meshes,'mats',JSON.stringify(out.mats));console.log('lights',JSON.stringify(out.lights));console.log('std',JSON.stringify(out.std).slice(0,500));
console.log('instanced batches',out.inst.length);
console.log('errors',JSON.stringify(errors));await b.close();
