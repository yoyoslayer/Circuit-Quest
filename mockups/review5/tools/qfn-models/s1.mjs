import {launch} from '../cap.mjs';
import {grabScene} from '../arcade-models/scene.mjs';
import {writeFileSync} from 'node:fs';
const P='qfn-models';
const g=await launch('qfn',{fullfx:true});
const audit=await g.audit(.02);
console.log('audit',JSON.stringify(audit,null,0));
await g.advance(1);
const s0=await g.snap();
console.log('props',s0.props,'fps',s0.fps,'dc',s0.drawCalls,'player',JSON.stringify(s0.player));
await g.shot(`${P}-01-start`);
await grabScene(g);
const r=await g.page.evaluate(()=>{const T=window.__T,s=window.__scene;const mats={},lights=[],glows=[],std=[];let meshes=0;const v=new T.Vector3();
  s.traverse(o=>{if(o.isPointLight){o.getWorldPosition(v);lights.push({x:+v.x.toFixed(2),y:+v.y.toFixed(2),z:+v.z.toFixed(2),i:o.intensity,d:o.distance,vis:o.visible});}
    if(o.isSprite){o.getWorldPosition(v);glows.push({x:+v.x.toFixed(1),y:+v.y.toFixed(1),z:+v.z.toFixed(1),op:+o.material.opacity.toFixed(2),sc:+o.scale.x.toFixed(2)});}
    if(o.isMesh){meshes++;const m=Array.isArray(o.material)?o.material:[o.material];for(const x of m){mats[x.type]=(mats[x.type]||0)+1;if(/Standard|Phong|Lambert|Physical/.test(x.type)){o.getWorldPosition(v);std.push(`${x.type}@${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`);}}}});
  return {mats,lights,meshes,glows,std:std.slice(0,30)};});
console.log(JSON.stringify(r));
writeFileSync('mockups/review5/tools/qfn-models/scene.json',JSON.stringify({audit,r},null,1));
await g.survey();
const s1=await g.snap();console.log('survey dc',s1.drawCalls,'fps',s1.fps);
await g.shot(`${P}-02-survey`);
await g.survey();
for(const [i,dx] of [[3,400],[4,400],[5,400],[6,400]]){await g.orbit(dx,0);await g.shot(`${P}-0${i}-orbit${(i-2)*90}`);}
await g.orbit(0,200);await g.shot(`${P}-07-orbit-low`);
await g.orbit(0,-400);await g.shot(`${P}-08-orbit-high`);
console.log('errors',JSON.stringify(await g.close()));
