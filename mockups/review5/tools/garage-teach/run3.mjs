import {launch} from '../cap.mjs';
const K='garage-teach';
const g=await launch('garage',{fullfx:true});
await g.advance(.3);
await g.walk(6.4,-4.2,.5);await g.key('KeyE');await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE');await g.advance(.3);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE');await g.advance(.6);
// naive "press keys in tray order" player
for(const [n,a] of [['pick','diode'],['slot','fly'],['pulse'],['test']])await g.act(n,a);await g.advance(2);
// job2 – one experimental flipped diode (short) costs a mistake
await g.act('flip','fly');await g.act('pulse');await g.advance(2.7);await g.act('flip','fly');
for(const [n,a] of [['pick','clamp'],['slot','fly'],['pulse'],['test']])await g.act(n,a);await g.advance(2);
for(const [n,a] of [['ground'],['pulse'],['test']])await g.act(n,a);
await g.advance(14);await g.page.waitForTimeout(3500);await g.shot(`${K}-48-result-card`);
const s=await g.snap();console.log('won',s.won,'mist',s.station.mistakes,'spent',s.station.spent);
console.log(await g.page.evaluate(()=>document.querySelector('.result-screen')?.innerText));
await g.orbit(600,0,1);await g.shot(`${K}-49-win-orbit`);
console.log('errors',JSON.stringify(await g.close()));
