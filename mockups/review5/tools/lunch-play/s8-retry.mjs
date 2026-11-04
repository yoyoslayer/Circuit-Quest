import {launch} from '../cap.mjs';
const g=await launch('lunch',{fullfx:false});
await g.advance(121);await g.page.waitForSelector('body[data-failed="true"]',{timeout:15000});
// R first: does it navigate within 5 s?
let nav=false;g.page.once('framenavigated',()=>{nav=true;});
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(5000);console.log('R navigated?',nav);
// mouse click on Retry
const t0=Date.now();
await Promise.all([g.page.waitForNavigation({timeout:30000}),g.page.getByRole('button',{name:'Retry Lunch Rush'}).click()]);
await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000});const ready=Date.now()-t0;
let run=0;for(let i=0;i<200;i++){const r=await g.page.evaluate(()=>window.__circuitCrew?.snapshot().running);if(r){run=Date.now()-t0;break;}await g.page.waitForTimeout(50);}
console.log('click retry -> ready ms',ready,'running ms',run,'screen',await g.page.evaluate(()=>document.body.dataset.screen));
console.log('errors',await g.close());
