import {launch} from '../cap.mjs';
import {ui,route,job1} from './common.mjs';
const K='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
await g.advance(.5);await job1(g);
let s=await g.snap();let t=s.time;console.log('job1 done',t.toFixed(1),JSON.stringify(s.station.delivered));
// fetch the pod back out of the storeroom
await route(g,[[-6.3,3.6],[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await g.walk(-9.3,-5.4,.5);
console.log('at store',JSON.stringify(await ui(g)));await g.key('KeyE');s=await g.snap();console.log('held',s.held,(s.time-t).toFixed(1));
t=s.time;
await route(g,[[-10.1,-4.2],[-10.1,-1.4],[0,-1.4]]);
await g.shot(`${K}-20-carry-pod-across-hall`);
await route(g,[[10.2,-1.4]]);
await g.shot(`${K}-21-at-lab-door`);
await route(g,[[10.2,-4.6],[8.4,-5.6]]);
console.log('in lab',JSON.stringify(await ui(g)));
await g.shot(`${K}-22-in-lab-holding`);
await g.key('KeyE');s=await g.snap();console.log('pad',s.station.podPad,'carry time',(s.time-t).toFixed(1));
await g.advance(.4);await g.shot(`${K}-23-pod-on-lab-pad`);
await g.zoom(-1500);await g.shot(`${K}-24-lab-close`);await g.zoom(900);
console.log('ui',JSON.stringify(await ui(g)));
t=(await g.snap()).time;
// mirror
await route(g,[[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await g.walk(-.9,-4.55,.3);
console.log('at mirror',JSON.stringify(await ui(g)));
await g.shot(`${K}-25-at-mirrors`);
await g.key('KeyE');s=await g.snap();console.log('held',s.held,(s.time-t).toFixed(1));
await g.zoom(-1500);await g.shot(`${K}-26-holding-mirror-close`);await g.zoom(900);
await route(g,[[-.9,-1.6],[2.6,-.2]]);
console.log('at A',JSON.stringify(await ui(g)));
await g.shot(`${K}-27-mirror-at-mark-A`);
await g.key('KeyE');s=await g.snap();console.log('mirrors',JSON.stringify(s.station.mirrors),(s.time-t).toFixed(1));
await g.advance(.3);
await g.shot(`${K}-28-mirror-stood-A`);
console.log('ui',JSON.stringify(await ui(g)));
t=(await g.snap()).time;
await route(g,[[1.5,1.2],[.6,4.2]]);await g.walk(-3.5,3.55,.4);
s=await g.snap();console.log('to desk',(s.time-t).toFixed(1));
await g.key('KeyE');await g.advance(1);
console.log('bench2',JSON.stringify(await ui(g)));
await g.shot(`${K}-29-bench-job2-start`);
// player: press 4 near IR
await g.key('Digit4',.3);console.log('nir',JSON.stringify(await ui(g)),JSON.stringify((await g.snap()).station.reading));
await g.shot(`${K}-30-bench-nir`);
// real mouse: click on the map where mark A is
const p=g.page;
// find screen positions: project the map's uv by raycast sweep
const pt=await p.evaluate(()=>{return null});
await p.mouse.move(777,523);await p.mouse.down();await g.advance(.1);await p.mouse.up();await g.advance(.2);
s=await g.snap();console.log('after click A',JSON.stringify(s.station.aim),JSON.stringify(s.station.reading),JSON.stringify(await ui(g)));
await g.shot(`${K}-31-bench-aimed-at-A-by-click`);
console.log('errors',JSON.stringify(await g.close()));
