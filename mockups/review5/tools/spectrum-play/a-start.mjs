import {launch} from '../cap.mjs';
const K='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({obj:document.querySelector('.objective')?.innerText,prompt:document.querySelector('.prompt, .key-prompt, [class*=prompt]')?.innerText,hud:document.querySelector('[data-layer="hud"]')?.innerText}));
await g.advance(1);
console.log('start',JSON.stringify(await txt()));
let s=await g.snap();console.log('snap0',JSON.stringify({p:s.player,props:s.props,items:s.items,fps:s.fps,dc:s.drawCalls,rope:s.rope}));
await g.shot(`${K}-01-start`);
console.log('audit',JSON.stringify(await g.audit(.02)).slice(0,1500));
await g.survey();await g.shot(`${K}-02-survey`);
s=await g.snap();console.log('surveydc',s.drawCalls,s.fps);
await g.survey();
// Orbits at default
await g.orbit(260,0);await g.shot(`${K}-03-orbit-a`);
await g.orbit(260,0);await g.shot(`${K}-04-orbit-b`);
await g.orbit(260,0);await g.shot(`${K}-05-orbit-c`);
await g.orbit(-780,0);
// Walk to the pod
let r=await g.walk(-6.4,6.4,.6);console.log('walk pod',r.arrived,JSON.stringify(r.state.time));
console.log('nearpod',JSON.stringify(await txt()));
await g.shot(`${K}-06-at-pod`);
await g.key('KeyE');s=await g.snap();console.log('held',s.held);
console.log('holdpod',JSON.stringify(await txt()));
await g.zoom(-1500);await g.shot(`${K}-07-holding-pod-close`);await g.zoom(1000);
for(const [x,z] of [[-10.1,3],[-10.1,-2.2]]){r=await g.walk(x,z);console.log('leg',x,z,r.arrived,r.state.time.toFixed(1));}
await g.shot(`${K}-08-carrying-to-store`);
for(const [x,z] of [[-10.1,-4.4],[-9.3,-5.5]]){r=await g.walk(x,z);console.log('leg',x,z,r.arrived,r.state.time.toFixed(1));}
console.log('instore',JSON.stringify(await txt()));
await g.shot(`${K}-09-in-store-holding`);
await g.key('KeyE');s=await g.snap();console.log('pad',s.station.podPad,s.time.toFixed(1));
await g.advance(.5);
console.log('placed',JSON.stringify(await txt()));
await g.shot(`${K}-10-pod-on-store-pad`);
console.log('errors',JSON.stringify(await g.close()));
