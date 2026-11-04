import {launch} from '../cap.mjs';
import {ui,route} from './common.mjs';
const K='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
await g.advance(.5);
await g.walk(-6.4,6.4,.6);await g.key('KeyE');
// carry the pod to the gap between the desk end and the tower, drop it there
await route(g,[[-3,5],[-1,4.4]]);await g.walk(-1,3.9,.2);await g.advance(.4,['KeyW']);
let s=await g.snap();console.log('p',JSON.stringify(s.player),'pod',JSON.stringify(s.items[0].pos));
await g.key('KeyE');await g.advance(1);s=await g.snap();console.log('dropped pod',JSON.stringify(s.items[0].pos));
// push it in by walking into it
await g.advance(1.2,['KeyW']);await g.advance(.5);s=await g.snap();console.log('after push',JSON.stringify(s.items[0].pos),JSON.stringify(s.player));
await g.zoom(-1500);await g.shot(`${K}-66-pod-wedged-desk-tower`);await g.zoom(900);
// back off, then try to pick it up
await g.walk(-1,4.6,.3);console.log('prompt',JSON.stringify(await ui(g)));
await g.key('KeyE');s=await g.snap();console.log('held',s.held);
await route(g,[[-3,5.2],[-6.3,4.6]]);s=await g.snap();console.log('pod after carry',JSON.stringify(s.items[0].pos),'held',s.held);
// throw the pod onto the exhibits case top
await route(g,[[-6.4,1.2],[-2.6,-1.6],[-1.6,-6.2]]);await g.advance(.15,['KeyW']);await g.key('KeyQ',.05);await g.advance(2);
s=await g.snap();console.log('pod after case throw',JSON.stringify(s.items[0].pos),'damage',s.damage);
await g.advance(6);s=await g.snap();console.log('pod +6',JSON.stringify(s.items[0].pos));
await g.shot(`${K}-67-pod-thrown-at-exhibits`);
console.log('prompt',JSON.stringify(await ui(g)));
console.log('errors',JSON.stringify(await g.close()));
