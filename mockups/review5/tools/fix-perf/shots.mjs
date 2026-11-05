// Same-camera shots for before/after: start camera at quality 2, plus a fixed close orbit.
// Usage: BASE=... node shots.mjs <tag> [levels...] -> shots-full/fix-perf-<level>-<tag>[-close].png
import {launch} from '../cap.mjs';
const [tag='after',...rest]=process.argv.slice(2);
for(const level of rest.length?rest:['meeting','lunch','arcade']){
  const g=await launch(level,{fullfx:true});await g.page.evaluate(()=>localStorage.setItem('circuit-crew-quality','2'));
  await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
  await g.advance(.6);await g.shot(`fix-perf-${level}-${tag}`);
  await g.page.evaluate(()=>{const G=window.__game;G.zoom=11;G.pitch=.2;});await g.advance(1);await g.shot(`fix-perf-${level}-${tag}-close`);
  const e=await g.close();if(e.length)console.log(level,e.slice(0,3));
}
