import {launch} from '../cap.mjs';
import {ui,route} from './common.mjs';
const K='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
await g.advance(.5);
// Walk speed without sprint: hold D for 2 s
let s0=await g.snap();await g.advance(2,['KeyD']);let s1=await g.snap();console.log('walk speed m/s',(Math.hypot(s1.player.x-s0.player.x,s1.player.z-s0.player.z)/2).toFixed(2));
s0=s1;await g.advance(2,['KeyW','ShiftLeft']);s1=await g.snap();console.log('sprint speed m/s',(Math.hypot(s1.player.x-s0.player.x,s1.player.z-s0.player.z)/2).toFixed(2));
// DR-03: grab the pod and throw it (Q) toward the hall
await g.walk(-6.4,6.4,.6);await g.key('KeyE');let s=await g.snap();console.log('held',s.held,'t',s.time.toFixed(1));
// face +x: walk a bit east
await g.advance(.4,['KeyD']);
await g.key('KeyQ',.05);s=await g.snap();console.log('after throw fastest',s.fastestProp.toFixed(1),'alarmed',s.alarmed,'damage',s.damage,'cost',s.cost);
await g.advance(.25);await g.shot(`${K}-50-pod-thrown`);
await g.advance(1.5);s=await g.snap();console.log('pod settled',JSON.stringify(s.items.find(i=>i.id==='pod').pos),'damage',s.damage,'cost',s.cost,'alarmed',s.alarmed);
await g.shot(`${K}-51-pod-landed`);
// Throw a crate at the toast coworker (3.8,5.7) from near the tea counter
const pod=s.items.find(i=>i.id==='pod').pos;
await route(g,[[-1,6.2]]);await g.walk(-2.4,6.6,.6);
s=await g.snap();console.log('near',JSON.stringify(await ui(g)));
await g.key('KeyE');s=await g.snap();console.log('held2',s.held);
await route(g,[[1.6,6.4]]);await g.advance(.3,['KeyD']);
await g.key('KeyQ',.05);await g.advance(.5);s=await g.snap();console.log('crate thrown: alarmed',s.alarmed,'damage',s.damage,'cost',s.cost,'fastest',s.fastestProp.toFixed(1));
await g.shot(`${K}-52-crate-at-coworker`);
// Mirror: carry mirror1 to mark B (wrong) then check prompt, then pick it up again
await route(g,[[1,1],[-2.6,-1.8]]);await g.walk(-3.4,-4.6,.3);await g.key('KeyE');s=await g.snap();console.log('held3',s.held);
await g.shot(`${K}-53-carrying-mirror-big`);
await g.walk(-2.6,-2.4,.4);console.log('at B',JSON.stringify(await ui(g)));await g.key('KeyE');s=await g.snap();console.log('mirrors',JSON.stringify(s.station.mirrors));
// throw a mirror? pick it back and throw with Q
await g.key('KeyE');s=await g.snap();console.log('re-held',s.held,JSON.stringify(s.station.mirrors));
await g.advance(.3,['KeyS']);await g.key('KeyQ',.05);await g.advance(1.5);s=await g.snap();console.log('mirror thrown',JSON.stringify(s.items.find(i=>i.id==='mirror1').pos),'damage',s.damage);
await g.shot(`${K}-54-mirror-thrown`);
// Pod: throw it over the brick wall into the storeroom?
await g.walk(pod.x+.6,pod.z+.6,.9);await g.key('KeyE');s=await g.snap();console.log('pod held?',s.held);
await route(g,[[-7,-1.6],[-7.4,-2.6]]);
await g.advance(.2,['KeyW']);await g.key('KeyQ',.05);await g.advance(2);s=await g.snap();console.log('pod after over-wall throw',JSON.stringify(s.items.find(i=>i.id==='pod').pos),'pad',s.station.podPad,JSON.stringify(await ui(g)));
await g.shot(`${K}-55-pod-over-wall-throw`);
await g.advance(6);s=await g.snap();console.log('pod +6s',JSON.stringify(s.items.find(i=>i.id==='pod').pos));
console.log('final damage',s.damage,'cost',s.cost,'t',s.time.toFixed(1));
console.log('errors',JSON.stringify(await g.close()));
