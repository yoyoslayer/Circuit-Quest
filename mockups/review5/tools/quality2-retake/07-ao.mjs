// AO-only contribution: quality 2 vs quality 1 (same frame) at zoom 9 and at the game camera; draws for each.
import {launch2,q} from './cap2.mjs';
for(const level of ['garage','meeting']){const g=await launch2(level,{fullfx:true},'2');await g.advance(1);
 for(const [tag,z] of [['gamecam',0],['zoom9',-1500]]){if(z)await g.zoom(z);
  for(const v of [2,1]){await g.page.evaluate(v=>{window.__game.view.setQuality(v);window.__game.render(0);},v);await g.page.waitForTimeout(800);await g.shot(`quality2-retake-70-${level}-${tag}-ao-q${v}`);console.log(level,tag,v,(await q(g)).draw);}}
 await g.close();}
