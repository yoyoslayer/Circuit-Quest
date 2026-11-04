import {launch} from '../cap.mjs';
const P='recheck-list-';const log=(...a)=>console.log(...a);
let g=await launch('playground',{fullfx:true});
try{
await g.advance(.5);await g.shot(P+'14a-playground-start-spool');
await g.crop(P+'14b-crop-spool-gamecam',{x:300,y:250,width:500,height:400});
await g.key('KeyF');await g.walk(-5,-1);await g.advance(.2);await g.shot(P+'14c-spool-paying-out');
await g.key('KeyQ');
let s=await g.snap();log('pins',JSON.stringify(s.items.filter(i=>i.id.startsWith('pin')).map(i=>[+i.pos.x.toFixed(2),+i.pos.y.toFixed(2),+i.pos.z.toFixed(2)])),'pinsDown',s.pinsDown);
await g.walk(3.6,3.6,.4);await g.shot(P+'14d-pins-gamecam');await g.zoom(-1500);await g.shot(P+'14e-pins-z9');await g.zoom(1500);
// bookshelf near the lamp wall
await g.walk(4.6,-5.6,.4);await g.zoom(-1500);await g.shot(P+'01c-bookshelf-playground-z9');await g.orbit(300,0);await g.shot(P+'01d-bookshelf-playground-z9-orbit');
}catch(e){log('ERR',e.message);}
log('errors',JSON.stringify(await g.close()));
// L5: win, press Jobs on the result card, then F5
g=await launch('playground');await g.advance(.3);await g.key('KeyF');for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);await g.key('KeyF',.3);await g.walk(6.6,-5.9,.4);await g.key('KeyE');await g.advance(4);
await g.page.waitForTimeout(3000);await g.shot(P+'11e-result-card');
const jobs=g.page.locator('.screen[data-screen="result"] [data-ui="jobs-reload"]');log('jobs btn',await jobs.count(),await jobs.first().isVisible().catch(()=>false));
try{await jobs.first().click({timeout:5000});await g.page.waitForURL(/level=lobby/);await g.page.waitForSelector('body[data-ready="true"]');await g.page.waitForTimeout(800);log('after Jobs',g.page.url(),await g.page.evaluate(()=>document.body.dataset.screen));await g.shot(P+'12a-lobby-after-jobs-button');
  await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');await g.page.waitForTimeout(1200);log('after F5',g.page.url(),await g.page.evaluate(()=>document.body.dataset.screen));await g.shot(P+'12b-lobby-after-f5');}catch(e){log('L5 ERR',e.message);}
log('errors',JSON.stringify(await g.close()));
