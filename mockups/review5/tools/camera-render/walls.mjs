// Targeted: camera outside a shell wall but wall not cut away (center-based stub test), at zoom 9.
import {launch} from '../cap.mjs';
import {hook,occl,camInfo} from './hook.mjs';
const cases=[['playground','pg',-7.72],['meeting','me',-9.29],['qfn','qf',-7.72],['observatory','ob',-8.51]];
for(const [level,tag,yaw] of cases){
  const g=await launch(level,{fullfx:true});await hook(g);await g.advance(1);
  await g.page.evaluate(([y])=>{const G=window.__game;G.yaw=y;G.pitch=-.3;G.zoom=9;},[yaw]);
  await g.advance(.2);await g.page.waitForTimeout(2500);
  const o=await occl(g);const walls=await g.page.evaluate(()=>window.__game.shellWalls.map(w=>+w.group.scale.y.toFixed(2)));
  console.log(level,JSON.stringify((await camInfo(g)).cam),'wallScales',walls,JSON.stringify(o.blocked.chest.map(h=>[h.bbTop,h.at])));
  await g.shot(`camera-render-${tag}-10-wall-not-cut-z9`);
  console.log(await g.close());
}
