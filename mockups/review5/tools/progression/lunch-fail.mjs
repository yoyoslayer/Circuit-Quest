import {launch} from '../cap.mjs';
const K='progression';
const g=await launch('lunch',{fullfx:true});
await g.advance(.3);await g.shot(`${K}-39-lunch-start`);
console.log('card',(await g.page.locator('.objective').innerText()).replace(/\n/g,' '),'| prompt',await g.page.locator('.prompt-pill').innerText().catch(()=>''));
for(let i=0;i<14;i++){await g.advance(10);const s=await g.snap();if(s.won)break;}
let s=await g.snap();console.log('won(fail)',s.won,'t',s.time.toFixed(1),'failed',s.lunch?.job?.failed);
await g.page.waitForSelector('body[data-failed="true"]',{timeout:20000}).catch(()=>console.log('no fail flag'));
await g.page.waitForTimeout(1200);await g.shot(`${K}-40-lunch-fail-card`);
console.log('fail text',(await g.page.locator('.fail-screen').innerText().catch(()=>'none')).replace(/\n/g,' | '));
await g.page.evaluate(()=>{window.__m=1;});
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(2000);
console.log('survived R on fail card (no reload)?',await g.page.evaluate(()=>window.__m===1).catch(()=>false));
await g.page.keyboard.press('Enter');await g.page.waitForTimeout(2500);
console.log('survived Enter?',await g.page.evaluate(()=>window.__m===1).catch(()=>false));
await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000}).catch(()=>{});
s=await g.snap().catch(()=>null);console.log('after enter running',s?.running,'time',s?.time,'screen',await g.page.evaluate(()=>document.body.dataset.screen));
console.log('errors',JSON.stringify(await g.close()));
