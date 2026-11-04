// Teaching run: the intended solve with the failure states the latch job is meant to teach.
import {launch} from '../cap.mjs';
const K='observatory-teach';
const g=await launch('observatory',{fullfx:true});
const log=(...a)=>console.log(...a);
const st=async()=>(await g.snap()).station;
const txt=async(sel)=>(await g.page.locator(sel).innerText().catch(()=>'-')).replace(/\n/g,' | ');
const board={x:420,y:480,width:560,height:180};
await g.advance(.5);
await g.walk(-3.7,-.1,.6);await g.key('KeyE',.3);await g.walk(-6,3.5,.6);await g.key('KeyE',.4);
await g.walk(0,-1.55,.4);await g.key('KeyE',1.2);
await g.act('pick','C');await g.advance(.2);await g.shot(`${K}-20-holding-cap`);log('prompt held',await txt('.prompt-pill'));
await g.act('slot','shunt');await g.advance(.4);let s=await st();log('100n',s.reading.snr);await g.shot(`${K}-21-shunt-100n`);
await g.crop(`${K}-21b-crop-tag-100n`,{x:520,y:440,width:420,height:220});
for(let k=0;k<7;k++)await g.key('ArrowRight',.05);await g.advance(.4);s=await st();log('1.5u',s.reading.snr,s.shunt);
await g.shot(`${K}-22-shunt-1u5`);await g.crop(`${K}-22b-crop-scope-1u5`,{x:540,y:170,width:420,height:240});
await g.act('route');await g.advance(.4);s=await st();log('rr',s.reading.snr);log('toast',await txt('.station-toast'));await g.shot(`${K}-23-rerouted`);
await g.act('log');await g.advance(.3);s=await st();log('j1',JSON.stringify(s.logged));log('toast',await txt('.station-toast'));
// job 2 — series capacitor: latch drops out
await g.act('pick','C');await g.act('slot','series');await g.act('value',{slot:'series',value:1e-6});await g.advance(.5);s=await st();log('j2 seriesC latch',s.reading.latch,s.reading.latchOk,'snr',s.reading.snr);
await g.shot(`${K}-24-job2-series-C-live`);log('panel',await txt('.station-panel'));
await g.act('log');await g.advance(.3);log('toast',await txt('.station-toast'));await g.shot(`${K}-25-job2-series-C-fail`);
await g.act('scope','step');await g.advance(1.5);await g.shot(`${K}-26-step-series-C`);log('toast',await txt('.station-toast'));
// series R
await g.act('pick','R');await g.act('slot','series');await g.advance(1.5);s=await st();log('seriesR latch',s.reading.latch,'snr',s.reading.snr);await g.shot(`${K}-27-step-series-R`);
await g.act('scope','signal');
// series L 1 mH (default) with 1.5u shunt
await g.act('pick','L');await g.act('slot','series');await g.advance(.5);s=await st();log('1mH',s.series,s.reading.snr);await g.shot(`${K}-28-job2-L1m-C1u5`);
await g.crop(`${K}-28b-crop-scope-L1m`,{x:540,y:170,width:420,height:240});
await g.act('scope','step');await g.advance(1.5);await g.shot(`${K}-29-step-L1m`);log('toast step',await txt('.station-toast'));
await g.act('value',{slot:'series',value:.01});await g.act('value',{slot:'shunt',value:1e-6});await g.act('scope','step');await g.advance(1.5);s=await st();log('10m/1u',s.reading.snr,s.reading.latch);
await g.shot(`${K}-30-step-L10m-C1u`);
await g.act('scope','signal');await g.advance(.5);await g.shot(`${K}-31-job2-L10m-C1u-signal`);
await g.crop(`${K}-31b-crop-board-tags`,board);
log('panel',await txt('.station-panel'));
await g.act('log');await g.advance(.15);await g.shot(`${K}-32-job3-gust-0s`);await g.advance(.6);await g.shot(`${K}-33-job3-gust-after`);
await g.crop(`${K}-33b-crop-antenna-flat`,{x:150,y:330,width:420,height:300});
s=await st();log('j3',JSON.stringify(s.logged),s.vertical);
await g.act('rod','r75');await g.advance(.4);await g.crop(`${K}-34-crop-r75-flat`,{x:150,y:300,width:420,height:330});
await g.act('orient');await g.advance(.4);s=await st();log('r75 up',s.reading.antenna,s.reading.snr);await g.shot(`${K}-35-job3-r75-upright`);
await g.act('log');await g.advance(1.2);s=await g.snap();log('won',s.won,JSON.stringify(s.station.logged),'mistakes',s.station.mistakes);
await g.shot(`${K}-36-win-tier3`);
await g.advance(4);await g.shot(`${K}-37-result-tier3`);log('result',await txt('.result'));
await g.close().then(e=>log('errors',JSON.stringify(e)));
