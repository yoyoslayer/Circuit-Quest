// g.audit(min) on every level at load (DR-70): node mockups/review5/tools/fix-models/audit.mjs [min]
// BASE=http://localhost:4206 (fix-models dev server).
import {launch} from '../cap.mjs';
const min=Number(process.argv[2]??.02);
for(const level of ['playground','meeting','lunch','lobby','qfn','observatory','arcade','arcade-rush','garage','spectrum']){
  const g=await launch(level,{start:false,fullfx:false});
  const found=await g.ev('return drive.audit(a[0])',min);
  console.log(level,found.length,JSON.stringify(found.slice(0,8)),g.errors.filter(e=>!/Fredoka|403/.test(e)).slice(0,3).join(' | '));
  await g.close();
}
