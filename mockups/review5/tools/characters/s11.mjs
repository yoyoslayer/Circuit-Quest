import {launch,SHOTS} from '../cap.mjs';
import {resolve} from 'node:path';
const g=await launch('meeting',{fullfx:true});
const quick=n=>g.page.screenshot({path:resolve(SHOTS,n+'.png')});
await g.advance(.5);
await g.walk(-8.5,-7,.4);await g.walk(-6.85,-7.05,.25);
await g.key('KeyE');await g.advance(.3);console.log('held',(await g.snap()).held);
await g.walk(-3.2,-7.2,.4);await g.walk(-2.4,-6.6,.3);
await g.zoom(-700);
await g.key('KeyQ',0);
for(let i=0;i<6;i++){await g.advance(.12);const s=await g.snap();if(s.alarmed>0){console.log('alarmed at',i,s.alarmed);break;}}
await quick('characters-90-meeting-seated-alarm');
await g.advance(.2);await quick('characters-91-meeting-seated-alarm-b');
console.log((await g.snap()).alarmed);
// standing coworker overlap check: walk into coffee-corner blob
await g.walk(-12.4,5.2,.2);await g.advance(.3);await g.zoom(-1500);await g.shot('characters-92-pip-vs-standing-blob');
console.log(JSON.stringify((await g.snap()).player));
console.log(await g.close());
