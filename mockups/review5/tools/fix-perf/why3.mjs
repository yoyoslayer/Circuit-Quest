import {launch} from '../cap.mjs';
const g=await launch(process.argv[2]??'arcade',{fullfx:false});
console.log(JSON.stringify(await g.page.evaluate(async()=>{const G=window.__game,S=G.station;const kit=await import('/src/render/kit.ts');const {keep}=kit.liveKeep(S,[G]);
  const root=S.root??S.top;const names=new Map();for(const k of Object.keys(S)){const v=S[k];if(v?.isObject3D)names.set(v,k);else if(Array.isArray(v))v.forEach((x,i)=>{if(x?.isObject3D)names.set(x,k+'['+i+']');if(x?.obj?.isObject3D)names.set(x.obj,k+'['+i+'].obj:'+x.act);});else if(v instanceof Map)for(const [a,x] of v){if(x?.isObject3D)names.set(x,k+'.'+a);}}
  const out={};root.traverse(o=>{if(!o.isMesh||o.name==='frozen')return;let top;for(let q=o;q&&q!==root;q=q.parent)if(keep(q))top=q;const k=top?(names.get(top)??('?'+top.type+(top.name||''))):'none';out[k]=(out[k]||0)+1;});
  return Object.entries(out).sort((a,b)=>b[1]-a[1]).slice(0,15);})));
await g.close();
