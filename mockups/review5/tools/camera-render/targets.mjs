// Playground: settled flicker triple, pillar fade (mid + settled), clean win push-in frames.
import {launch} from '../cap.mjs';
import {hook,occl} from './hook.mjs';
const K='camera-render-pg';
const g=await launch('playground',{fullfx:true});await hook(g);await g.advance(.5);
// settled flicker: zoom 9, wait 3 s real time, 3 shots ~0.2 s apart (sim advanced .2 each)
await g.zoom(-1500,.3);await g.page.waitForTimeout(3000);
for(let k=0;k<3;k++){await g.advance(.2);await g.page.waitForTimeout(200);await g.page.screenshot({path:`mockups/review5/shots/${K}-40-flicker-settled-${k}.png`});}
// pillar fade: pillar ~(-1.3,-1.3); stand behind it from the default camera (+z side)
await g.zoom(1000,.3);await g.walk(-1.3,-3.1,.35,20);
await g.page.screenshot({path:`mockups/review5/shots/${K}-41-pillar-fade-t0.png`});
await g.page.waitForTimeout(90);await g.page.screenshot({path:`mockups/review5/shots/${K}-42-pillar-fade-t1.png`});
await g.page.waitForTimeout(1500);await g.shot(`${K}-43-pillar-faded`);
const op=await g.page.evaluate(()=>window.__game.occluders.map(m=>+m.material.opacity.toFixed(2)));console.log('occluder opacities',op,JSON.stringify((await occl(g)).blocked));
await g.zoom(-1500,.3);await g.page.waitForTimeout(2000);await g.shot(`${K}-44-pillar-faded-z9`);
console.log('z9',JSON.stringify((await occl(g)).blocked));
// head-only: pillar between camera and Pip's head but not chest+.4? walk so pillar edge covers part
await g.walk(-.4,-3.1,.3,10);await g.page.waitForTimeout(2000);await g.shot(`${K}-45-pillar-edge-z9`);
console.log('edge',JSON.stringify((await occl(g)).blocked),await g.page.evaluate(()=>window.__game.occluders.map(m=>+m.material.opacity.toFixed(2))));
// clean route + win
await g.zoom(1000,.3);
await g.walk(-7.3,4.3,.4,20);await g.key('KeyF');
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);
await g.key('KeyF',.3);await g.walk(6.6,-5.9,.4);await g.key('KeyE',.05);
console.log('won',(await g.snap()).won);
for(const [t,n] of [[300,'a'],[1500,'b'],[3500,'c']]){await g.page.waitForTimeout(t);await g.page.screenshot({path:`mockups/review5/shots/${K}-46-win-${n}.png`});}
console.log(await g.close());
