import {launch} from '../cap.mjs';
import {writeFileSync} from 'node:fs';
const P='arcade-models';
const g=await launch('arcade',{fullfx:true});
const audit=await g.audit(.02);
await g.advance(1);
const s0=await g.snap();
await g.shot(`${P}-01-start`);
// grab scene via three prototype patch
const info=await g.page.evaluate(async()=>{
  const urls=performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/deps\/three\.js|three\.module/.test(n));
  return urls;
});
console.log('three urls',info);
let scn=null;
if(info.length){
  scn=await g.page.evaluate(async(u)=>{
    const T=await import(u);
    const orig=T.WebGLRenderer.prototype.render;
    T.WebGLRenderer.prototype.render=function(s,c){if(s&&s.isScene&&s.children.length>3&&!window.__scene){window.__scene=s;window.__cam=c;}return orig.call(this,s,c);};
    return true;
  },info[0]);
  await g.advance(.05);
  const r=await g.page.evaluate(()=>{const s=window.__scene;if(!s)return null;const mats={},lights=[];let meshes=0,sprites=0;const glows=[];
    s.traverse(o=>{if(o.isLight&&o.type==='PointLight')lights.push({x:+o.getWorldPosition(o.position.clone()).x.toFixed(2),i:o.intensity,d:o.distance,col:o.color.getHexString()});
      if(o.isSprite){sprites++;glows.push({op:+o.material.opacity.toFixed(2),sc:+o.scale.x.toFixed(2)});}
      if(o.isMesh){meshes++;const m=Array.isArray(o.material)?o.material:[o.material];for(const x of m)mats[x.type]=(mats[x.type]||0)+1;}});
    return {mats,lights,meshes,sprites,glows};});
  console.log(JSON.stringify(r));
  writeFileSync('mockups/review5/tools/arcade-models/scene.json',JSON.stringify(r,null,1));
}
console.log('audit',JSON.stringify(audit));
console.log('props',s0.props,'fps',s0.fps,'dc',s0.drawCalls,'player',JSON.stringify(s0.player));
await g.survey();
const s1=await g.snap();console.log('survey dc',s1.drawCalls);
await g.shot(`${P}-02-survey`);
await g.survey();
for(const [i,dx] of [[3,400],[4,400],[5,400],[6,400]]){await g.orbit(dx,0);await g.shot(`${P}-0${i}-orbit${(i-2)*90}`);}
await g.orbit(0,200);await g.shot(`${P}-07-orbit-low`);
const errs=await g.close();console.log('errors',JSON.stringify(errs));
