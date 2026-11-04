// Settled case: camera just outside the side wall near the front corner; centre-based stub test keeps the wall up.
import {launch} from '../cap.mjs';
import {hook,occl,camInfo} from './hook.mjs';
const cases=[['playground','pg',-8.6,5,[-.3,-.2,-.12]],['meeting','me',-15.2,6.5,[-.3,-.2]],['arcade','ar',-9.6,5.6,[-.3,-.2]]];
for(const [level,tag,x,z,yaws] of cases){
  const g=await launch(level,{fullfx:true});await hook(g);await g.advance(.5);
  const w=await g.walk(x,z,.4,20);
  let i=0;for(const yaw of yaws){
  await g.page.evaluate(([y])=>{const G=window.__game;G.yaw=y;G.pitch=-.3;G.zoom=9;},[yaw]);
  await g.advance(.1);await g.page.waitForTimeout(2500);
  const o=await occl(g);const walls=await g.page.evaluate(()=>window.__game.shellWalls.map(w=>+w.group.scale.y.toFixed(2)));
  console.log(level,yaw,'pip',JSON.stringify(o.pip),'cam',JSON.stringify(o.cam),'wallScales',walls,'chest',JSON.stringify(o.blocked.chest.map(h=>[h.bbTop,h.at])),'feet',JSON.stringify(o.blocked.feet.map(h=>[h.bbTop,h.at])));
  await g.shot(`camera-render-${tag}-11-side-wall-up-${i++}`);}
  console.log(await g.close());
}
