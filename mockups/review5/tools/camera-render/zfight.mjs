// Settled far/grazing views: two frames 0.1 s apart (no sim step) -> diff map for shimmer / z-fighting; also norim and phone survey.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const S='mockups/review5/shots/';
for(const [level,tag,yaw] of [['meeting','me',.9],['arcade','ar',-.7],['lunch','lu',.5],['garage','ga',2.6]]){
  const g=await launch(level,{fullfx:true});await hook(g);await g.advance(.3);
  await g.page.evaluate(([y])=>{const G=window.__game;G.yaw=y;G.pitch=-.3;G.zoom=38;},[yaw]);await g.advance(.1);await g.page.waitForTimeout(3000);
  await g.page.screenshot({path:`${S}camera-render-${tag}-60-far-a.png`});await g.page.waitForTimeout(100);await g.page.screenshot({path:`${S}camera-render-${tag}-60-far-b.png`});
  // survey after orbiting: Tab at a rotated yaw
  await g.survey();await g.page.waitForTimeout(1500);await g.shot(`camera-render-${tag}-61-survey-rotated`);
  console.log(await g.close());
}
for(const level of ['meeting','lunch','playground','garage']){const g=await launch(level,{fullfx:true,width:390,height:844});await g.advance(.3);await g.survey();await g.shot(`camera-render-${level}-62-survey-phone`);await g.key('Tab',.1);await g.page.waitForTimeout(1500);await g.shot(`camera-render-${level}-63-start-phone`);console.log(await g.close());}
for(const q of ['','norim']){const g=await launch('garage',{fullfx:true,query:q});await g.advance(.5);await g.zoom(-1500,.3);await g.page.waitForTimeout(2000);await g.shot(`camera-render-garage-64-zoom9${q?'-norim':'-rim'}`);console.log(await g.close());}
