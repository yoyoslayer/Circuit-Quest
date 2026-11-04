import {launch} from '../cap.mjs';
import {grabScene} from './scene.mjs';
import {writeFileSync} from 'node:fs';
const g=await launch('arcade',{fullfx:true});
console.log('scene',await grabScene(g));
const r=await g.page.evaluate(()=>{const T=window.__T,s=window.__scene;const mats={},lights=[],glows=[],types={},noOutline=[],std=[];let meshes=0;
  const v=new T.Vector3();
  s.traverse(o=>{if(o.isPointLight){o.getWorldPosition(v);lights.push({x:+v.x.toFixed(2),y:+v.y.toFixed(2),z:+v.z.toFixed(2),i:o.intensity,d:o.distance,col:o.color.getHexString(),vis:o.visible});}
    if(o.isSprite){o.getWorldPosition(v);glows.push({x:+v.x.toFixed(1),y:+v.y.toFixed(1),z:+v.z.toFixed(1),op:+o.material.opacity.toFixed(2),sc:+o.scale.x.toFixed(2)});}
    if(o.isMesh||o.isInstancedMesh){meshes++;const m=Array.isArray(o.material)?o.material:[o.material];for(const x of m){mats[x.type]=(mats[x.type]||0)+1;if(/Standard|Phong|Lambert|Physical/.test(x.type))std.push(o.name||o.parent?.name||'');}}});
  return {mats,lights,meshes,glows,std:std.slice(0,20),info:null};});
console.log(JSON.stringify(r,null,0));
writeFileSync('mockups/review5/tools/arcade-models/scene.json',JSON.stringify(r,null,1));
console.log(await g.close());
