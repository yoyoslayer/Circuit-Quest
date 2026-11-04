import {launch} from '../cap.mjs';
import {grabScene} from './scene.mjs';
const g=await launch('arcade',{fullfx:true});
await grabScene(g);
const r=await g.page.evaluate(()=>{const s=window.__scene,root=s.children.find(c=>c.children.length>100),out=[];
  const count=o=>{let n=0,inst=0;o.traverse(c=>{if(c.isInstancedMesh)inst++;else if(c.isMesh&&c.visible)n++;});return [n,inst];};
  for(const c of root.children){const [n,i]=count(c);out.push({t:c.type[0],m:n,i,p:[+c.position.x.toFixed(1),+c.position.y.toFixed(1),+c.position.z.toFixed(1)]});}
  const inst=[];root.traverse(c=>{if(c.isInstancedMesh)inst.push(c.count);});
  return {groups:out.filter(o=>o.m>2).sort((a,b)=>b.m-a.m),loose:out.filter(o=>o.m<=2).length,instCounts:inst.slice(0,30),instTotal:inst.length};});
console.log(JSON.stringify(r));
console.log(await g.close());
