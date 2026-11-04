import {launch} from '../cap.mjs';
const g=await launch('lobby',{fullfx:true,start:false});
await g.page.evaluate(()=>localStorage.setItem('circuit-crew:best:v1',JSON.stringify({playground:{grade:'A',time:40,damage:0,cost:0},meeting:{grade:'B',time:200,damage:3,cost:60},lunch:{grade:'C',time:400,damage:12,cost:200},arcade:{grade:'A',time:300,damage:1,cost:100}})));
await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');await g.ev('return drive.advance(1)');
await g.shot('lobby-play-28-title-with-progress');
await g.page.getByRole('button',{name:'Start playing'}).click();await g.advance(.5);
await g.shot('lobby-play-29-start-4-done');
console.log('card',await g.page.locator('.objective').innerText());
console.log(JSON.stringify((await g.snap()).hub.doors));
await g.walk(-2.3,-8.0,.4);await g.advance(.5);await g.zoom(-1000);await g.shot('lobby-play-30-done-doors-close');
await g.zoom(1000);
await g.walk(6.96,-8.9,.4);await g.advance(.6);console.log('rush prompt',await g.page.locator('.prompt-pill').innerText());await g.shot('lobby-play-31-rush-unlocked');
// Jobs board from pause
await g.page.keyboard.press('Escape');await g.advance(.2);
await g.page.getByRole('button',{name:/Jobs/}).first().click().catch(e=>console.log('jobs click err',e.message));
await g.page.waitForTimeout(1500);console.log('url after Jobs',g.page.url());
await g.page.waitForSelector('body[data-ready="true"]');await g.page.waitForTimeout(800);await g.shot('lobby-play-32-after-jobs-button');
console.log('screen',await g.page.evaluate(()=>document.body.dataset.screen));
// title Jobs grid button
console.log(await g.close());
