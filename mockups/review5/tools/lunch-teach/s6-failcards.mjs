import {launch,W,R,brief,hudText,wedge,mop,takeThick,feedKitchen} from './lib.mjs';
const K='lunch-teach';const t0=Date.now();
{
  const g=await launch('lunch',{fullfx:true});
  await g.advance(60);await brief(g,'t60');await W(g,-6,-1.2);await g.shot(`${K}-40-fridge-warming-60s`);
  await g.advance(40);await brief(g,'t100');await g.zoom(-800);await g.shot(`${K}-41-fridge-sadicon-100s`);await g.zoom(800);
  await g.advance(19.5);await brief(g,'t119.5');await g.advance(.8);await g.shot(`${K}-42-spoil-moment`);
  await g.advance(.6);await g.page.waitForTimeout(1500);await g.shot(`${K}-43-spoil-card`);
  console.log(await g.page.evaluate(()=>document.querySelector('.fail-screen')?.innerText));
  // retry timing
  const t1=Date.now();await g.page.keyboard.press('KeyR');await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000}).catch(()=>{});console.log('retry ms',Date.now()-t1);
  console.log('errors',JSON.stringify(await g.close()));
}
{
  const g=await launch('lunch',{fullfx:true});
  await wedge(g);await mop(g);await takeThick(g);await feedKitchen(g);
  await R(g,[[.3,-1.3],[.3,2.4]]);await W(g,-10.8,2,.4);await g.key('KeyF');
  await R(g,[[.3,2.4],[-.5,-1.3]]);await W(g,-3.8,-1.7,.4);await g.key('KeyF');await g.advance(.3);
  let s=await brief(g,'fed');await g.advance(Math.max(0,20.5-s.lunch.job.bake));await W(g,-2.4,-5.6);await g.shot(`${K}-44-tray-baked-ready`);console.log('hud',await hudText(g));
  await g.advance(62);await brief(g,'warning');await g.shot(`${K}-45-burn-warning`);console.log('hud',await hudText(g));
  await g.advance(28);await brief(g,'burn');await g.advance(.5);await g.shot(`${K}-46-burn-moment`);
  await g.advance(.8);await g.page.waitForTimeout(1500);await g.shot(`${K}-47-burn-card`);
  console.log('errors',JSON.stringify(await g.close()));
}
console.log('ms',Date.now()-t0);
