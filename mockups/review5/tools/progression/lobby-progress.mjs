import {launch} from '../cap.mjs';
const K='progression';
const g=await launch('lobby',{fullfx:true,start:false});
// Jobs board fresh (no progress)
await g.page.locator('[data-ui="jobs"]').click();await g.advance(.3);
await g.shot(`${K}-16-jobs-board-fresh`);
// select arcade-rush and check if it's playable
for(let i=0;i<4;i++)await g.page.keyboard.press('ArrowRight');
await g.advance(.2);await g.shot(`${K}-17-jobs-board-rush-selected`);
console.log('go label',await g.page.locator('[data-ui="go"]').getAttribute('aria-label'));
// seed progress
await g.page.evaluate(()=>{localStorage.setItem('circuit-crew:best:v1',JSON.stringify({playground:{grade:'A',time:9,damage:0,cost:0},meeting:{grade:'B',time:200,damage:12,cost:400},lunch:{grade:'A',time:400,damage:3,cost:100},arcade:{grade:'C',time:900,damage:5,cost:40}}));});
await g.page.goto('http://127.0.0.1:4173/?manual&fullfx');await g.page.waitForSelector('body[data-ready="true"]');
await g.shot(`${K}-18-title-with-progress`);
console.log('play btn',await g.page.locator('[data-ui="play"]').innerText(), await g.page.locator('[data-ui="play"]').getAttribute('title'));
await g.page.getByRole('button',{name:'Start playing'}).click();await g.advance(1.5);
await g.shot(`${K}-19-lobby-with-progress`);
const s=await g.snap();console.log(JSON.stringify(s.hub.doors.map(d=>[d.id,d.done,d.locked])));
console.log('card',await g.page.locator('.objective').innerText());
// close-up of done doors
await g.walk(-6.96,-7.5,.5);await g.advance(.5);await g.zoom(-600);await g.shot(`${K}-20-done-doors-close`);
await g.walk(6.96,-8.9,.4);await g.advance(.5);await g.shot(`${K}-21-rush-unlocked`);
console.log('prompt',await g.page.locator('.prompt-pill').innerText().catch(()=>''));
// pause menu bonuses in lobby
await g.page.keyboard.press('Escape');await g.advance(.3);await g.shot(`${K}-22-lobby-pause`);
console.log('pause text',await g.page.locator('.pause-screen').innerText());
await g.page.keyboard.press('Escape');await g.advance(.3);
// R in lobby
const before=(await g.snap()).player;await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(2500);
console.log('after R in lobby screen',await g.page.evaluate(()=>document.body.dataset.screen));
console.log('errors',JSON.stringify(await g.close()));
