// playground-play E: occlusion sweeps behind pillar/bookshelf, pause card, restart timing, phone.
import {launch} from '../cap.mjs';
import {hud,brief} from './lib.mjs';
const K='playground-play';
const mode=process.argv[2]??'all';
if(mode==='all'||mode==='occ'){
  const g=await launch('playground',{fullfx:true});await g.advance(.3);await g.key('KeyF',.1);
  // behind pillar-b (2.5..3.9, 2..3.4) as seen from the default camera (+z side)
  await g.walk(-1.5,6.3);await g.walk(3.2,1.3,.3);console.log('behind pillar',JSON.stringify(brief(await g.snap())));
  await g.shot(`${K}-40-behind-pillar`);
  await g.zoom(-1500);await g.shot(`${K}-41-behind-pillar-close`);await g.zoom(600);
  // behind the bookshelf at (4.47,1.07) seen from +z: stand at (4.4,0.3)
  await g.walk(4.4,.35,.3);console.log('behind shelf',JSON.stringify(brief(await g.snap())));await g.shot(`${K}-42-behind-shelf`);
  for(const [i,dx] of [[0,260],[1,260],[2,260]]){await g.orbit(dx,0,.5);await g.shot(`${K}-4${3+i}-behind-shelf-orbit${i}`);}
  console.log('errors',JSON.stringify(await g.close()));
}
if(mode==='all'||mode==='pause'){
  const g=await launch('playground',{fullfx:true});await g.advance(.3);
  await g.page.keyboard.press('Escape');await g.page.waitForTimeout(300);await g.shot(`${K}-46-pause`);
  console.log('pause text',JSON.stringify(await g.page.evaluate(()=>document.querySelector('.pause-screen')?.innerText)));
  await g.page.keyboard.press('Escape');await g.advance(.2);
  // restart: R reloads; time until play resumes
  const t0=Date.now();await g.page.keyboard.press('KeyR');await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000});
  await g.page.waitForFunction(()=>document.body.dataset.screen==='play',null,{timeout:60000});console.log('restart ms',Date.now()-t0);
  await g.shot(`${K}-47-after-restart`);
  console.log('errors',JSON.stringify(await g.close()));
}
if(mode==='all'||mode==='phone'){
  const g=await launch('playground',{fullfx:true,width:390,height:844});await g.advance(.5);
  await g.shot(`${K}-48-phone-start`);await g.survey();await g.shot(`${K}-49-phone-survey`);await g.survey();
  await g.key('KeyF',.1);await g.walk(-4,-4);await g.shot(`${K}-50-phone-drag`);
  console.log('hud',JSON.stringify(await hud(g)));
  console.log('errors',JSON.stringify(await g.close()));
}
