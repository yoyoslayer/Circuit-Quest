// (b) Luma across the terminator: lobby cooler + Pip helmet + an injected toon('#f4efe6') test sphere, zoom 9.
import {launch} from '../cap.mjs';
import {writeFileSync} from 'node:fs';
const variants=[['soft',''],['hardcel','hardcel'],['hardcel-norim','hardcel&norim'],['soft-norim','norim']];
const meta={};
for(const [name,q] of variants){
  const g=await launch('lobby',{fullfx:true,query:q});
  await g.page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/deps\/three\.js/.test(n));const T=await import(url);window.__T=T;
    T.Object3D.prototype.onBeforeRender=function(r,s,c){if(s&&s.isScene){window.__scene=s;if(c&&c.isPerspectiveCamera)window.__cam=c;}};});
  await g.walk(-3.1,6.9,.3);await g.advance(.3);
  await g.zoom(-1500);await g.advance(.5);
  const info=await g.page.evaluate(async()=>{const T=window.__T,kit=await import('/src/render/kit.ts');const s=window.__scene;
    const m=kit.part(s,kit.sphere(.42,32,24),kit.toon('#f4efe6'),-2.0,.75,7.6);m.name='testSphere';
    const clone=kit.toon('#f4efe6').clone();return {cloneHasRim:clone.onBeforeCompile===kit.toon('#f4efe6').onBeforeCompile,cloneKey:clone.customProgramCacheKey()};});
  await g.advance(.3);
  const proj=await g.page.evaluate(()=>{const T=window.__T,c=window.__cam,s=window.__scene;const W=innerWidth,H=innerHeight;
    const pr=v=>{const p=v.clone().project(c);return [(p.x+1)/2*W,(1-p.y)/2*H];};
    const sp=s.getObjectByName('testSphere');const ctr=new T.Vector3(-2,.75,7.6);
    const right=new T.Vector3().setFromMatrixColumn(c.matrixWorld,0).multiplyScalar(.42);
    const sun=s.children.find(o=>o.isDirectionalLight&&o.castShadow);const L=sun.position.clone().sub(sun.target.position).normalize();
    return {c:pr(ctr),edge:pr(ctr.clone().add(right)),lit:pr(ctr.clone().add(L.clone().multiplyScalar(.42))),shade:pr(ctr.clone().sub(L.clone().multiplyScalar(.42)))};});
  meta[name]={...info,...proj};
  await g.shot(`toon-pipeline-0${variants.findIndex(v=>v[0]===name)+1}-lobby-ramp-${name}`);
  console.log(name,JSON.stringify(meta[name]),await g.close());
}
writeFileSync(new URL('./ramp.json',import.meta.url),JSON.stringify(meta,null,1));
