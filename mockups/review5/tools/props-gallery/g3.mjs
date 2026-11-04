// props-gallery pass 3: per level prop census (kind, colour, id), overlap audit, resting heights after settle.
import {launch} from '../cap.mjs';
import {writeFileSync} from 'node:fs';
import {grab} from './hook.mjs';
const levels=['lobby','playground','meeting','lunch','arcade','garage','qfn','observatory','spectrum'];
const out={};
for(const l of levels){
  const g=await launch(l,{fullfx:false});await g.advance(2);
  console.log('grab',await grab(g));const census=await g.page.evaluate(()=>window.__g.props.map(p=>{const t=p.body.translation();return {kind:p.spec.kind,color:p.spec.color??null,id:p.spec.id??null,x:+t.x.toFixed(2),y:+t.y.toFixed(3),z:+t.z.toFixed(2),visible:p.mesh.visible};}));
  const audit=await g.audit(.02);const s=await g.snap();
  out[l]={n:census.length,drawCalls:s.drawCalls,census,audit};
  console.log(l,census.length,'audit',JSON.stringify(audit).slice(0,300));
  const errs=await g.close();if(errs.length)console.log('ERR',l,errs.slice(0,3));
}
writeFileSync('mockups/review5/tools/props-gallery/census.json',JSON.stringify(out,null,1));
