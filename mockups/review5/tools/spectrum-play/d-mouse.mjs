import {launch} from '../cap.mjs';
import {ui,route,job1,job2setup,mapPx} from './common.mjs';
const K='spectrum-play';
const g=await launch('spectrum',{fullfx:true});const p=g.page;
await g.advance(.5);await job1(g);await job2setup(g);
let s=await g.snap();console.log('at desk job2',s.time.toFixed(1),s.atBench,JSON.stringify(s.station.mirrors),s.station.podPad);
await g.key('Digit4',.2);
// Aim the tower: press near the tower, drag out past mark A.
const TX={x:-.4,z:2.3},A={x:3.564,z:.012},LAB={x:7,z:-6};
const beyond={x:TX.x+1.5*(A.x-TX.x),z:TX.z+1.5*(A.z-TX.z)};
let [x0,y0]=mapPx(TX.x+.6*(A.x-TX.x)*.3,TX.z+.6*(A.z-TX.z)*.3),[x1,y1]=mapPx(beyond.x,beyond.z);
await p.mouse.move(x0,y0);await p.mouse.down();await g.advance(.05);await p.mouse.move(x1,y1,{steps:6});await g.advance(.05);
console.log('drag prompt',JSON.stringify(await ui(g)));await g.shot(`${K}-32-bench-dragging-tower`);
await p.mouse.up();await g.advance(.2);
s=await g.snap();console.log('tower aimed',JSON.stringify(s.station.aim),JSON.stringify(s.station.reading),JSON.stringify(await ui(g)));
await g.shot(`${K}-33-bench-tower-on-mirror`);
// Turn the mirror toward the lab pad
[x0,y0]=mapPx(A.x,A.z);[x1,y1]=mapPx(LAB.x,LAB.z);
await p.mouse.move(x0,y0);await p.mouse.down();await g.advance(.05);await p.mouse.move(x1,y1,{steps:8});await g.advance(.05);await p.mouse.up();await g.advance(.2);
s=await g.snap();console.log('mirror turned',JSON.stringify(s.station.aim),JSON.stringify(s.station.reading),JSON.stringify(await ui(g)));
await g.shot(`${K}-34-bench-mirror-to-lab-shut`);
await g.key('KeyH',.3);s=await g.snap();console.log('hatch',JSON.stringify(s.station.reading),JSON.stringify(await ui(g)));
await g.shot(`${K}-35-bench-hatch-open`);
// nudge to see sensitivity
for(const k of ['ArrowRight']){await g.key(k,.1);}
s=await g.snap();console.log('nudge+2deg',JSON.stringify(s.station.reading));
await g.key('ArrowLeft',.1);s=await g.snap();console.log('back',JSON.stringify(s.station.reading));
await g.key('Enter',.3);s=await g.snap();console.log('sent2',JSON.stringify(s.station.delivered),JSON.stringify(await ui(g)));
await g.shot(`${K}-36-bench-job2-delivered`);
// stand and watch the pulse? already hidden. Stand up quickly and shot
await g.key('KeyE',.4);await g.shot(`${K}-37-stood-after-job2`);
console.log('t',(await g.snap()).time.toFixed(1));
// Job 3: fetch pod from lab to quiet
const t=(await g.snap()).time;
await route(g,[[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.4]]);await g.walk(8.1,-5.35,.3);await g.key('KeyE');
await route(g,[[10.2,-4.4],[10.2,-1.4],[10.2,1],[10.2,2.8],[9.4,3.9]]);
await g.shot(`${K}-38-quiet-room-entering`);
await g.key('KeyE');s=await g.snap();console.log('quiet pad',s.station.podPad,(s.time-t).toFixed(1));
await g.advance(.3);await g.shot(`${K}-39-pod-on-quiet-pad`);
await route(g,[[10.2,2.8],[10.2,.6],[4.5,-.6],[-.2,4.2]]);await g.walk(-3.5,3.55,.4);await g.key('KeyE');await g.advance(1);
s=await g.snap();console.log('desk3',(s.time-t).toFixed(1),JSON.stringify(s.station.reading),s.station.band);
await g.shot(`${K}-40-bench-job3-start`);
await g.key('Digit5',.2);s=await g.snap();console.log('vis',JSON.stringify(s.station.reading),JSON.stringify(await ui(g)));
await g.shot(`${K}-41-bench-job3-visible-smoke`);
await g.key('Digit2',.2);s=await g.snap();console.log('micro',JSON.stringify(s.station.reading),JSON.stringify(await ui(g)));
await g.shot(`${K}-42-bench-job3-micro-mesh`);
await g.key('Digit3',.2);s=await g.snap();console.log('thermal',JSON.stringify(s.station.reading),s.station.power,JSON.stringify(await ui(g)));
await g.shot(`${K}-43-bench-job3-thermal`);
await g.key('Enter',.2);s=await g.snap();console.log('won',s.won,s.time.toFixed(1),s.damage,s.cost,JSON.stringify(s.station.delivered));
await g.advance(.4);await g.shot(`${K}-44-win-0p4`);
await g.advance(1.6);await p.waitForTimeout(1500);await g.shot(`${K}-45-result`);
console.log('result',await p.evaluate(()=>document.querySelector('.result, [class*=result]')?.innerText));
console.log('errors',JSON.stringify(await g.close()));
