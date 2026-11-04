// props-gallery pass 4: in-game close-ups of prefabs (meeting). Pip is teleported in the page (runtime only).
import {launch} from '../cap.mjs';
import {grab} from './hook.mjs';
const lvl=process.argv[2]??'meeting';
const spots=JSON.parse(process.argv[3]??'[]');
const g=await launch(lvl,{fullfx:true});await g.advance(1);await grab(g);
const tp=(x,z)=>g.page.evaluate(([x,z])=>{const p=window.__g.player;p.setTranslation({x,y:p.translation().y+.05,z},true);},[x,z]);
let n=0;const pre=process.argv[4]??'60';
await g.shot(`props-gallery-${pre}-${lvl}-start`);
for(const s of spots){
  await tp(s.x,s.z);await g.advance(.6);
  if(s.zoom)await g.zoom(s.zoom);if(s.orbit)await g.orbit(s.orbit,s.tilt??0);
  await g.shot(`props-gallery-${pre}${String.fromCharCode(97+n++)}-${lvl}-${s.name}`);
  if(s.zoom)await g.zoom(-s.zoom);if(s.orbit)await g.orbit(-s.orbit,-(s.tilt??0));
}
console.log(JSON.stringify(await g.close()));
