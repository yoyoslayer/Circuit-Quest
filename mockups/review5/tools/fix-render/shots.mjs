// Start-view shots per room at quality 2 for before/after comparison of the static merge.
// Usage: BASE=... node shots.mjs <tag> [levels...]  -> shots-full/fix-render-<level>-<tag>.png
import {launch} from '../cap.mjs';
const [tag='after',...rest]=process.argv.slice(2);
for(const level of rest.length?rest:['lobby','meeting','arcade','garage','observatory','lunch']){
  const g=await launch(level,{fullfx:true});await g.page.evaluate(()=>localStorage.setItem('circuit-crew-quality','2'));
  await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
  await g.advance(.6);await g.shot(`fix-render-${level}-${tag}`);await g.close();
}
