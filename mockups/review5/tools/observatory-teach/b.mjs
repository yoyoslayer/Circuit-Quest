// Shortcut run: finishes the room without ever building an LC filter or meeting the latch rule.
import {launch} from '../cap.mjs';
const K='observatory-teach';
const g=await launch('observatory',{fullfx:true});
const log=(...a)=>console.log(...a);
const st=async()=>(await g.snap()).station;
const txt=async(sel)=>(await g.page.locator(sel).innerText().catch(()=>'-')).replace(/\n/g,' | ');
await g.advance(.5);
await g.walk(-3.7,-.1,.6);await g.key('KeyE',.3);await g.walk(-6,3.5,.6);await g.key('KeyE',.4);
await g.walk(0,-1.55,.4);await g.key('KeyE',1.2);
// job 1: reroute only, no can
await g.act('route');await g.advance(.3);let s=await st();log('j1 reroute only snr',s.reading.snr);
await g.shot(`${K}-10-job1-reroute-only`);log('prompt',await txt('.prompt-pill'));
await g.act('log');await g.advance(.3);s=await st();log('j1 logged',JSON.stringify(s.logged),'mistakes',s.mistakes);log('toast',await txt('.station-toast'));
await g.shot(`${K}-11-job1-tier1-no-filter`);
// job 2: one capacitor turned up
await g.act('pick','C');await g.act('slot','shunt');await g.act('value',{slot:'shunt',value:3.3e-6});await g.advance(.4);s=await st();log('j2 shunt 3.3u',s.reading.snr,s.reading.level,'latch',s.reading.latch);
await g.shot(`${K}-12-job2-single-cap-3u3`);log('prompt',await txt('.prompt-pill'));log('panel',await txt('.station-panel'));
await g.act('log');await g.advance(.3);s=await st();log('j2 logged',JSON.stringify(s.logged),'mistakes',s.mistakes);log('toast',await txt('.station-toast'));
await g.shot(`${K}-13-job2-tier1-logged-gust`);
// job 3
log('j3 vertical',s.vertical,'rod',s.rod);
await g.act('rod','r150');await g.advance(.3);s=await st();log('r150 antenna',s.reading.antenna);
await g.act('orient');await g.advance(.3);s=await st();log('r150 upright antenna',s.reading.antenna,'snr',s.reading.snr);
await g.shot(`${K}-14-job3-r150-upright`);
await g.act('log');await g.advance(.3);log('toast',await txt('.station-toast'));s=await st();log('mistakes',s.mistakes);
await g.shot(`${K}-15-job3-wrong-rod-fail`);
await g.act('rod','r75');await g.advance(.4);s=await st();log('r75 antenna',s.reading.antenna,'snr',s.reading.snr);
await g.shot(`${K}-16-job3-r75-upright`);
await g.act('log');await g.advance(.4);s=await g.snap();log('won',s.won,JSON.stringify(s.station.logged));
await g.advance(1.5);await g.shot(`${K}-17-win-push`);
await g.advance(4);await g.shot(`${K}-18-result-card`);
log('result',await txt('.result'));
await g.close().then(e=>log('errors',JSON.stringify(e)));
