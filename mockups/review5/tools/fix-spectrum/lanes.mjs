// R5-137: lists props whose centre lies within 0.6 m of a taught beam corridor (should print none
// except the pod and mirrors). BASE=http://localhost:4195 node lanes.mjs
import {launch} from '../cap.mjs';
const g=await launch('spectrum',{fullfx:false});await g.advance(.3);
const out=await g.page.evaluate(()=>{const G=window.__game,seg=(p,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a[0]-dx*t,p.z-a[1]-dz*t);};
  const lanes=[[[-.4,2.3],[3.564,.012]],[[3.564,.012],[5.4,-3.2]],[[5.4,-3.3],[7,-6]],[[-.4,2.3],[8.2,4.8]],[[-.4,2.3],[1,5.8]],[[1,5.8],[8.2,4.8]]];
  return G.props.filter(p=>!/^(pod|mirror)/.test(p.spec.id??'')).map(p=>({k:p.spec.kind,id:p.spec.id,at:p.body.translation()})).filter(p=>lanes.some(([a,b])=>seg(p.at,a,b)<.6)).map(p=>`${p.k} ${p.at.x.toFixed(2)},${p.at.z.toFixed(2)}`);});
console.log('props in beam corridors:',JSON.stringify(out));
await g.close();
