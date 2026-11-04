import {start} from './lib.mjs';
const g=await start();
const E=async()=>{await g.key('KeyE',.2);};
const st=async()=>(await g.snap()).station;
await g.advance(.3);
await g.walk(-6.4,6.4,.6);await E();
await g.route([[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await E();
await g.route([[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);await g.walk(-3.5,3.55,.4);await E();
await g.act('band','radio');await g.act('send');await E();
await g.route([[-6.3,3.6],[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await g.walk(-9.3,-5.4,.5);await E();
await g.route([[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-4.6],[8.4,-5.6]]);await E();
await g.route([[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await g.walk(-.9,-4.55,.3);await E();
await g.route([[-.9,-1.6],[2.6,-.2]]);await E();
await g.route([[1.5,1.2],[.6,4.2]]);await g.walk(-3.5,3.55,.4);await E();
await g.act('band','nir');await g.act('aim',{what:'tx',to:'A'});await g.act('aim',{what:'A',to:'lab'});await g.act('hatch');await E();
// inside the lab: beam vs bookshelf
await g.route([[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.4]]);await g.walk(8.6,-4.6,.4);
await g.zoom(-2000);await g.look(8.6,-4.6,5.8,-4.5);await g.S(70,'lab-beam-through-bookshelf');
await g.look(8.6,-4.6,5.8,-4.5,200);await g.S(71,'lab-beam-through-bookshelf-high');
await g.zoom(2000);await g.S(72,'lab-beam-gamecam');
// send delivery 2
await g.route([[10.2,-4.4],[10.2,-1.8],[1,-1.8],[.4,.2],[-.2,4.2]]);await g.walk(-3.5,3.55,.4);await E();await g.act('send');console.log('d2',JSON.stringify((await st()).delivered));
await E();
// delivery 3: pod to quiet room
await g.route([[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.4]]);await g.walk(8.1,-5.35,.3);await E();
await g.route([[10.2,-4.4],[10.2,-1.4],[10.2,1],[10.2,2.8],[9.4,3.9]]);await E();console.log('podPad',(await st()).podPad);
await g.route([[10.2,2.8],[10.2,.6],[4.5,-.6],[-.2,4.2]]);await g.walk(-3.5,3.55,.4);await E();
await g.act('band','vis');await g.advance(.3);await g.S(73,'bench-quiet-vis-smoke');
await g.act('band','micro');await g.act('power',100);await g.advance(.2);await E();await g.advance(.5);await g.S(74,'room-micro-broadcast');
await g.zoom(-2000);await g.walk(-1.2,4.6,.4);await g.look(-1.2,4.6,-.4,2.3);await g.S(75,'micro-rings-tower-close');await g.zoom(2000);
await g.walk(-3.5,3.55,.4);await E();
await g.act('band','thermal');await g.act('power',1);await E();await g.advance(.5);await g.S(76,'room-thermal-beam-smoke');
await g.walk(1.0,2.0,.4);await g.zoom(-2000);await g.look(1.0,2.0,2.4,3.4);await g.S(77,'thermal-beam-in-smoke-close');
await g.look(1.0,2.0,5.5,4.0);await g.S(78,'thermal-beam-mesh-close');await g.zoom(2000);
await g.route([[.6,4.2],[-.2,4.2]]);await g.walk(-3.5,3.55,.4);await E();await g.act('send');
for(const [i,t] of [[79,.1],[80,.5],[81,1.5],[82,3]]){await g.advance(t);await g.S(i,`win-${t}s`);}
const s=await g.snap();console.log('won',s.won,JSON.stringify(s.station.delivered),'time',s.time);
console.log('errors',JSON.stringify(await g.close()));
