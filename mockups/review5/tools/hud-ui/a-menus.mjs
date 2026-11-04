import {launch} from '../cap.mjs';
const [W,H,tag]=process.argv[2]==='phone'?[390,844,'p']:[1440,900,'d'];
const P=n=>`hud-ui-${tag}-${n}`;
// Title
let g=await launch('lobby',{start:false,width:W,height:H});
await g.ev('return drive.advance(1)');await g.shot(P('01-title'));
// Jobs board
await g.page.locator('[data-ui="jobs"]').click();await g.ev('return drive.advance(.5)');await g.shot(P('02-jobs'));
await g.page.keyboard.press('Escape');await g.ev('return drive.advance(.3)');
await g.page.getByRole('button',{name:'Start playing'}).click();await g.advance(1.5);
await g.shot(P('03-lobby-start'));
console.log('lobby start',JSON.stringify(await g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText,prompt:document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.innerText}))));
// Pause
await g.page.keyboard.press('Escape');await g.ev('return drive.advance(.3)');await g.shot(P('04-pause'));
await g.page.keyboard.press('Escape');await g.ev('return drive.advance(.3)');
console.log('after esc paused?',(await g.snap()).paused);
// Workshop
const w=await g.walk(7.5,6.4,.4);console.log('walk',w.arrived);
console.log('prompt',await g.page.evaluate(()=>document.querySelector('.prompt-pill')?.innerText));
await g.shot(P('05-workshop-prompt'));
await g.key('KeyE');await g.shot(P('06-workshop-picker'));
// keys while picker open
const before=(await g.snap()).player;await g.advance(1,['KeyW']);const after=(await g.snap()).player;
console.log('picker open: walked',JSON.stringify(before),JSON.stringify(after));
await g.page.keyboard.press('Escape');await g.ev('return drive.advance(.3)');
const s=await g.snap();console.log('after esc in picker: paused',s.paused,'picker hidden',await g.page.evaluate(()=>document.querySelector('.workshop-picker')?.hidden));
await g.shot(P('07-after-picker-esc'));
// Door prompt
await g.page.keyboard.press('Escape');await g.ev('return drive.advance(.3)');
console.log(JSON.stringify((await g.snap()).hub.doors.map(d=>[d.id,d.at])));
console.log('errors',await g.close());
