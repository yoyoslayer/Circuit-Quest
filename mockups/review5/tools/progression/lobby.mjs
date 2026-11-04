import {launch} from '../cap.mjs';
const K='progression';
const g=await launch('lobby',{fullfx:true,start:false});
await g.shot(`${K}-01-title`);
const b=g.page.getByRole('button',{name:'Start playing'});await b.click();
await g.advance(1.5);
await g.shot(`${K}-02-lobby-start`);
const s=await g.snap();console.log('hub',JSON.stringify(s.hub),'props',s.props,'player',JSON.stringify(s.player),'fps',s.fps,'dc',s.drawCalls);
console.log('card',await g.page.locator('.objective').innerText().catch(()=>''),'| prompt',await g.page.locator('.prompt-pill').innerText().catch(()=>''));
await g.survey();await g.shot(`${K}-03-lobby-survey`);await g.survey();
// walk to playground door
const door=id=>s.hub.doors.find(d=>d.id===id);
let d=door('playground');await g.walk(d.at.x,d.at.z,.4);await g.advance(.6);await g.shot(`${K}-04-door-playground`);
console.log('prompt pg',await g.page.locator('.prompt-pill').innerText().catch(()=>''));
d=door('arcade-rush');await g.walk(d.at.x,d.at.z+1.5,.5);await g.walk(d.at.x,d.at.z,.4);await g.advance(.4);await g.shot(`${K}-05-door-rush-locked`);
console.log('prompt rush',await g.page.locator('.prompt-pill').innerText().catch(()=>''));
await g.key('KeyE',.3);await g.shot(`${K}-06-rush-locked-E`);
console.log('url after E on locked',g.page.url());
// side wall doors
d=door('qfn');await g.walk(d.at.x+2,d.at.z,.5);await g.walk(d.at.x,d.at.z,.4);await g.advance(.6);await g.shot(`${K}-07-door-side-qfn`);
console.log('prompt qfn',await g.page.locator('.prompt-pill').innerText().catch(()=>''));
// workshop
await g.walk(7.5,5.5,.5);await g.advance(.3);console.log('prompt ws',await g.page.locator('.prompt-pill').innerText().catch(()=>''));
await g.shot(`${K}-08-workshop-arch`);
await g.key('KeyE',.3);await g.shot(`${K}-09-workshop-picker`);
console.log('picker',await g.page.locator('.workshop-picker').innerText().catch(()=>''));
// keys while picker open
await g.key('KeyW',0);await g.advance(.5,['KeyW']);console.log('player after W w/ picker',JSON.stringify((await g.snap()).player));
await g.key('Escape',.3);console.log('paused after esc?',(await g.snap()).paused);
await g.shot(`${K}-10-after-esc`);
// localStorage
console.log('ls',await g.page.evaluate(()=>JSON.stringify(localStorage)));
console.log('errors',JSON.stringify(await g.close()));
