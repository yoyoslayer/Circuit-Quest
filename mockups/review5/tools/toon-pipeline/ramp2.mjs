// (b2) Test sphere + Pip in the playground (no portal cameras), seen across the sun terminator.
import {launch} from '../cap.mjs';
import {writeFileSync} from 'node:fs';
const variants=[['soft',''],['hardcel','hardcel'],['hardcel-norim','hardcel&norim']];
const meta={};let n=5;
for(const [name,q] of variants){
  const g=await launch('playground',{fullfx:true,query:q});
  await g.page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/deps\/three\.js/.test(n));const T=await import(url);window.__T=T;
    T.Object3D.prototype.onBeforeRender=function(r,s,c){if(s&&s.isScene){window.__scene=s;if(c&&c.isPerspectiveCamera&&r.getRenderTarget()!==null)window.__cam=c;}};});
  await g.advance(.2);await g.page.waitForTimeout(500);const sp=await g.snap();const px=sp.pip?.x??sp.player?.x??-7,pz=sp.pip?.z??sp.player?.z??5;
  await g.page.evaluate(async([px,pz])=>{const kit=await import('/src/render/kit.ts');const s=window.__scene;
    const m=kit.part(s,kit.sphere(.45,32,24),kit.toon('#f4efe6'),px+1.3,.8,pz+.4);m.name='testSphere';},[ -7,5]);
  await g.zoom(-1500);
  for(const [tag,dx] of [['front',0],['side',420]]){
    if(dx)await g.orbit(dx,0,1);await g.advance(.3);
    const proj=await g.page.evaluate(()=>{const T=window.__T,c=window.__cam,s=window.__scene;const W=innerWidth,H=innerHeight;
      const pr=v=>{const p=v.clone().project(c);return [(p.x+1)/2*W,(1-p.y)/2*H];};const sp=s.getObjectByName('testSphere');const ctr=sp.getWorldPosition(new T.Vector3());
      const right=new T.Vector3().setFromMatrixColumn(c.matrixWorld,0).multiplyScalar(.45);
      const sun=s.children.find(o=>o.isDirectionalLight&&o.castShadow);const L=sun.position.clone().sub(sun.target.position).normalize();
      return {c:pr(ctr),edge:pr(ctr.clone().add(right)),lit:pr(ctr.clone().add(L.clone().multiplyScalar(.45))),shade:pr(ctr.clone().sub(L.clone().multiplyScalar(.45)))};});
    const shot=`toon-pipeline-${String(n++).padStart(2,'0')}-playground-ramp-${name}-${tag}`;meta[shot]=proj;await g.shot(shot);console.log(shot,JSON.stringify(proj));
  }
  console.log(await g.close());
}
writeFileSync(new URL('./ramp2.json',import.meta.url),JSON.stringify(meta,null,1));
