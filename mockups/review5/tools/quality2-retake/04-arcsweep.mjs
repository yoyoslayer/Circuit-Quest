// Garage kickback arc timeline: board-crop every 0.1 s after PULSE, at quality 2 and quality 0 (same sim frame).
import {launch2} from './cap2.mjs';
const K='quality2-retake';const g=await launch2('garage',{fullfx:true},'2');
await g.advance(1);await g.walk(6.4,-4.2,.5);await g.key('KeyE',.4);await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE',.4);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE',.5);await g.advance(.5);
const clip={x:180,y:200,width:1100,height:460};
await g.act('pulse');
for(let i=1;i<=22;i++){await g.advance(.1);const t=(i/10).toFixed(1);
  for(const v of [2,0]){await g.page.evaluate(v=>{window.__game.view.setQuality(v);window.__game.render(0);},v);await g.page.waitForTimeout(120);await g.crop(`${K}-sweep-garage-arc-${t}-q${v}`,clip);}
  await g.page.evaluate(()=>window.__game.view.setQuality(2));}
console.log('errors',JSON.stringify(await g.close()));
