import {launch} from '../cap.mjs';
for(const level of process.argv.slice(2)){const g=await launch(level,{fullfx:false});
console.log(level,JSON.stringify(await g.page.evaluate(()=>{const G=window.__game;const r={cast:0,nocast:0,other:0,kinds:{}};for(const b of G.batches){const m=b.mesh;const f=b.parts[0].part.name==='frozen';if(f)r[m.castShadow&&b.parts[0].part.castShadow?'cast':'nocast']++;else r.other++;const k=b.parts[0].prop.spec.kind;r.kinds[k]=(r.kinds[k]||0)+1;}return r;})));await g.close();}
