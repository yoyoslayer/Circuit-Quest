import {launch} from '../cap.mjs';
import {grab} from './helpers.mjs';
const g=await launch('arcade',{fullfx:true});
const kinds=await g.page.evaluate(()=>0);
await grab(g);
await g.advance(.5);
let s=await g.snap();console.log('dc start',s.drawCalls,'props',s.props);
await g.survey();s=await g.snap();console.log('dc survey',s.drawCalls);await g.survey();
const r=await g.page.evaluate(()=>{const sc=window.__scene;let meshes=0,inst=0,visMeshes=0;sc.traverse(o=>{if(o.isInstancedMesh)inst++;else if(o.isMesh){meshes++;let v=true,q=o;while(q){if(!q.visible){v=false;break;}q=q.parent;}if(v)visMeshes++;}});
  // find the bench top group: group at (-0.2,1,-2.45)
  let top=null;sc.traverse(o=>{if(!top&&o.isGroup&&Math.abs(o.position.x+.2)<.01&&Math.abs(o.position.y-1)<.01&&Math.abs(o.position.z+2.45)<.01)top=o;});
  let tm=0;top?.traverse(o=>{if(o.isMesh)tm++;});
  return {meshes,visMeshes,inst,topMeshes:tm};});
console.log(JSON.stringify(r));
console.log(await g.close());
