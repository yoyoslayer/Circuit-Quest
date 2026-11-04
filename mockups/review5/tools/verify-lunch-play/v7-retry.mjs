import {launch} from '../cap.mjs';
const P='verify-lunch-play-';
{const g=await launch('meeting',{fullfx:false});console.log('meeting props',(await g.snap()).props);await g.close();}
const g=await launch('lunch',{fullfx:false});
let s=await g.advance(119.9);console.log('t',s.time.toFixed(1),'failed?',s.lunch.job.failed,'temp',s.lunch.job.temperature.toFixed(3));
s=await g.advance(1);console.log('t',s.time.toFixed(1),'failed',s.lunch.job.failed);
await g.page.waitForSelector('body[data-failed="true"]',{timeout:15000});await g.page.waitForTimeout(1500);
await g.shot(P+'30-fail-card');
let nav=false;g.page.on('framenavigated',f=>{if(f===g.page.mainFrame())nav=true;});
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(4000);console.log('R on fail card navigated?',nav,'screen',await g.page.evaluate(()=>document.body.dataset.screen));
await g.page.keyboard.press('Enter');await g.page.waitForTimeout(4000);console.log('Enter navigated?',nav);
console.log('errors',await g.close());
