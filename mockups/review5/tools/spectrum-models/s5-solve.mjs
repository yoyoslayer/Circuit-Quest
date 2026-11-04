import {start} from './lib.mjs';
const g=await start();
const E=async()=>{await g.key('KeyE',.2);};
const st=async()=>(await g.snap()).station;
await g.advance(.3);
// carry the pod
await g.walk(-6.4,6.4,.6);await E();console.log('held',(await g.snap()).held);
await g.advance(.5);await g.S(50,'carry-pod-gamecam');
await g.zoom(-2000);await g.face(.14);await g.S(51,'carry-pod-zoom9-back');
await g.face(.14+Math.PI*.6);await g.S(52,'carry-pod-zoom9-side');
await g.face(.14+Math.PI);await g.S(53,'carry-pod-zoom9-front');
await g.face(.14);await g.zoom(2000);
await g.route([[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await E();console.log('podPad',(await st()).podPad);
await g.advance(.5);await g.S(54,'pod-on-store-pad');
// to the desk
await g.route([[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);await g.walk(-3.5,3.55,.4);await E();
console.log('atBench',(await g.snap()).atBench);await g.advance(.5);await g.S(55,'bench-view-vis-blocked');
await g.act('power',100);await g.act('send');await g.advance(.3);await g.S(56,'bench-fail-send');
await g.act('band','radio');await g.advance(.3);await g.S(57,'bench-radio');
await g.act('power',1);await g.act('send');await g.advance(.2);await g.S(58,'bench-delivered-1');
// stand up and see the broadcast in the room (delivery 2 now selected; set radio to look)
await E();await g.advance(.5);await g.S(59,'room-after-delivery1');
// lab: pod in, mirror on A
await g.route([[-6.3,3.6],[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await g.walk(-9.3,-5.4,.5);await E();
await g.route([[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-4.6],[8.4,-5.6]]);await E();console.log('podPad',(await st()).podPad);
await g.route([[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await g.walk(-.9,-4.55,.3);await E();console.log('held',(await g.snap()).held);
await g.advance(.3);await g.S(60,'carry-mirror-gamecam');
await g.zoom(-2000);await g.face(.14+Math.PI*.5);await g.S(61,'carry-mirror-zoom9-side');await g.face(.14);await g.zoom(2000);
await g.route([[-.9,-1.6],[2.6,-.2]]);await E();console.log('mirrors',(await st()).mirrors);
await g.advance(.3);await g.S(62,'mirror-on-A');
await g.zoom(-2000);await g.S(63,'mirror-on-A-zoom9');await g.zoom(2000);
await g.route([[1.5,1.2],[.6,4.2]]);await g.walk(-3.5,3.55,.4);await E();
await g.act('band','nir');await g.act('aim',{what:'tx',to:'A'});await g.act('aim',{what:'A',to:'lab'});await g.act('hatch');await g.advance(.4);
console.log('reading',JSON.stringify((await st()).reading));await g.S(64,'bench-lab-aimed');
// stand up before sending to see the beam through hatch in the room
await E();await g.advance(.6);await g.S(65,'room-nir-beam-hatch');
await g.walk(4.0,-1.2,.5);await g.zoom(-2000);await g.face(.5);await g.S(66,'nir-beam-hatch-close');
await g.face(.5,200);await g.S(67,'nir-beam-hatch-high');
await g.zoom(2000);
await g.route([[1.5,1.2],[.6,4.2]]);await g.walk(-3.5,3.55,.4);await E();await g.act('send');await g.advance(.2);await g.S(68,'bench-delivered-2');
console.log('delivered',JSON.stringify((await st()).delivered));
console.log('errors',JSON.stringify(await g.close()));
