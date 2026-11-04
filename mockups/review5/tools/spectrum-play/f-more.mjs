import {launch} from '../cap.mjs';
import {ui,route} from './common.mjs';
const K='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
await g.advance(.5);
// DR-04: carry a crate next to the toast coworker (3.8,5.7) and throw it at the counter.
let s=await g.snap();
await route(g,[[-1,6.4],[1.4,6.6]]);
const near=await g.page.evaluate(()=>window.__circuitCrew.snapshot().player);console.log('p',JSON.stringify(near),JSON.stringify(await ui(g)));
// take whatever is nearest; prefer the blue box at (-2.4,7.2) -> go there
await g.walk(-2.4,6.5,.4);console.log(JSON.stringify(await ui(g)));await g.key('KeyE');s=await g.snap();console.log('held',s.held);
await route(g,[[1.2,6.4],[2.6,6.4]]);await g.advance(.25,['KeyD']);await g.key('KeyQ',.05);
for(let i=0;i<5;i++){await g.advance(.1);s=await g.snap();console.log('t+',(i+1)/10,'alarmed',s.alarmed,'fastest',s.fastestProp.toFixed(1),'damage',s.damage);}
await g.shot(`${K}-56-crate-near-coworker-alarm`);
// Orbit sweep with Pip inside the storeroom (no pod), default zoom
await route(g,[[-1,6],[-6.3,3.6],[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-8.6,-5.4]]);
for(const [i,dx] of [[0,0],[1,350],[2,350],[3,350]]){if(dx)await g.orbit(dx,0);await g.shot(`${K}-6${i}-store-orbit-${i}`);}
await g.orbit(350,0);
// low pitch
await g.orbit(0,150);await g.shot(`${K}-64-store-low-orbit`);await g.orbit(0,-150);
console.log('errors',JSON.stringify(await g.close()));
