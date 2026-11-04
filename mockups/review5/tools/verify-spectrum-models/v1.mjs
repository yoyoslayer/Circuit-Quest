// verify-spectrum-models: reproduce tower rings, beam vs lab bookshelf, hatch sign, draw calls.
import {launch} from '../cap.mjs';
const K='verify-spectrum-models';
const g=await launch('spectrum',{fullfx:true});
const S=async(n,name)=>{await g.shot(`${K}-${n}-${name}`);console.log('shot',n,name);};
let yaw=.14;
const face=async(Y,dy=0)=>{let dx=(yaw-Y)/.006;yaw=Y;while(Math.abs(dx)>1e-3){const s=Math.max(-600,Math.min(600,dx));await g.orbit(s,0,.05);dx-=s;}if(dy)await g.orbit(0,dy,.05);await g.advance(.8);};
const look=async(px,pz,ox,oz,dy=0)=>{await face(Math.atan2(-(ox-px),-(oz-pz)),dy);};
const E=async()=>{await g.key('KeyE',.2);};
await g.advance(.5);
let s=await g.snap();console.log('start fps',s.fps,'dc',s.drawCalls,'props',s.props);
// tower close-up at zoom 9
await g.zoom(-2000);await g.walk(.9,2.3,.25);await face(.14);await S('01','tower-z9');
await g.crop(`${K}-02-tower-z9-crop`,{x:520,y:150,width:420,height:520});
await face(.14);await g.zoom(2000);
// mirror to A, then bench: NIR aimed via A into the lab, hatch open
await g.walk(-1,-1.8,.5);await g.walk(-.9,-4.55,.3);await E();console.log('held',(await g.snap()).held);
await g.walk(-.9,-1.6,.5);await g.walk(2.6,-.2,.5);await E();console.log('mirrors',JSON.stringify((await g.snap()).station?.mirrors));
await g.walk(1.5,1.2,.5);await g.walk(.6,4.2,.5);await g.walk(-3.5,3.55,.4);await E();
console.log('bench',(await g.snap()).atBench);
await g.act('band','nir');await g.act('aim',{what:'tx',to:'A'});await g.act('aim',{what:'A',to:'lab'});await g.act('hatch');await g.advance(.5);
await S('03','bench-nir-lab');
await E();await g.advance(.5);
// hall, close to hatch: sign vs raised door
await g.walk(1,-1.8,.5);await g.walk(5.4,-2.2,.4);await g.zoom(-2000);await look(5.4,-1.6,5.4,-3.2,60);await S('04','hatch-open-sign-z9');
await g.advance(.1);await S('05','hatch-open-sign-z9-b');
await g.zoom(2000);
// into the lab
await g.walk(9,-1.8,.5);await g.walk(10.2,-2.6,.5);await g.walk(10.2,-4.4,.5);await g.walk(8.6,-4.6,.4);
await g.zoom(-2000);await look(8.6,-4.6,5.8,-4.5);await S('06','lab-beam-vs-shelf-z9');
await g.zoom(2000);await S('07','lab-beam-gamecam');
s=await g.snap();console.log('lab fps',s.fps,'dc',s.drawCalls);
await g.survey();s=await g.snap();console.log('survey dc',s.drawCalls);await S('08','survey-mid');
console.log('errors',JSON.stringify(await g.close()));
