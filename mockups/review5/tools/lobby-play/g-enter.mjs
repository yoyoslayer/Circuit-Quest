import {launch} from '../cap.mjs';
const g=await launch('lobby',{fullfx:true});await g.advance(.3);
await g.walk(-6.96,-8.9,.4);await g.advance(.4);
try{
const t0=Date.now();
await Promise.all([g.page.waitForURL(/level=meeting/),g.page.keyboard.press('KeyE')]);
await g.page.screenshot({path:'mockups/review5/shots/lobby-play-51-entering-meeting-loading.png'});
await g.page.waitForSelector('body[data-ready="true"]');const t1=Date.now();
console.log('E to ready ms',t1-t0,'url',g.page.url());
await g.page.waitForTimeout(1500);await g.page.screenshot({path:'mockups/review5/shots/lobby-play-52-meeting-after-door.png'});
await g.page.keyboard.press('Escape');await g.page.waitForTimeout(500);const t2=Date.now();
await Promise.all([g.page.waitForURL(/level=lobby/),g.page.getByRole('button',{name:/Jobs/}).first().click()]);
await g.page.waitForSelector('body[data-ready="true"]');console.log('back to lobby ms',Date.now()-t2,'screen',await g.page.evaluate(()=>document.body.dataset.screen));
await g.page.waitForTimeout(1500);await g.page.screenshot({path:'mockups/review5/shots/lobby-play-53-back-in-lobby.png'});
const s=await g.snap();console.log('player',JSON.stringify(s.player),'running',s.running);
}catch(e){console.log('ERR',e.message);}
console.log(await g.close());
