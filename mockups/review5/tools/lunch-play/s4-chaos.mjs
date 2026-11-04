import {launch} from '../cap.mjs';
const P='lunch-play-x';
const g=await launch('lunch',{fullfx:true});
const ui=()=>g.page.evaluate(()=>({prompt:document.querySelector('.prompt-pill')?.hidden?'':document.querySelector('.prompt-pill')?.innerText.replace('\n',' ')}));
const pos=async()=>Object.fromEntries((await g.snap()).items.map(i=>[i.id,i.pos]));
// 1. thin-3 is loose at both ends: does dragging it strain against a fixed phantom anchor?
await g.walk(-11,7,.4);await g.key('KeyF');let s=await g.snap();console.log('held',s.lunch.held);
for(const [x,z] of [[-5,7],[0,6],[6,6],[12,6],[14,3]]){await g.walk(x,z,.5);s=await g.snap();const c=s.lunch.cables.find(c=>c.id===s.lunch.held?.id);console.log('loose drag',x,z,'strain',c?.strain.toFixed(2),'end0',JSON.stringify(c?.ends[0]),'prompt',(await ui()).prompt);}
await g.shot(P+'01-loose-cable-drag');
await g.key('KeyQ');await g.advance(.5);
// 2. thin-2 from cart A: sprint along corridor east past its 30 m
await g.walk(-10,3.5,.5);await g.key('KeyF');s=await g.snap();console.log('held2',s.lunch.held);
const before=await pos();
for(const x of [0,6,10,14]){const r=await g.walk(x,3.8,.5,8);s=await g.snap();const c=s.lunch.cables.find(c=>c.id==='thin-2');console.log('drag x',x,'arr',r.arrived,'p',s.player.x.toFixed(1),'strain',c.strain.toFixed(2),'prompt',(await ui()).prompt);}
await g.zoom(-600);await g.shot(P+'02-overstretch');
// push further with sprint keys
s=await g.advance(1.5,['KeyD','ShiftLeft']);let c=s.lunch.cables.find(c=>c.id==='thin-2');console.log('sprint strain',c.strain.toFixed(2),'player',s.player.x.toFixed(1),(await ui()).prompt);
await g.shot(P+'03-max-strain');
await g.key('KeyQ',.05);await g.shot(P+'04-slingshot-release');await g.advance(1.5);s=await g.snap();
const after=await pos();let moved=0,far=0;for(const k in before){const a=before[k],b=after[k];const d=Math.hypot(a.x-b.x,a.z-b.z);if(d>.3)moved++;if(d>1)far++;}
console.log('slingshot moved>0.3',moved,'>1m',far,'alarmed',s.alarmed,'dmg',s.damage,'fastest',s.fastestProp);
await g.zoom(600);await g.shot(P+'05-after-slingshot');
// 3. throw a crate at the lunch crowd (-3.8,9)
await g.walk(-3,7,.4);await g.key('KeyE');s=await g.snap();console.log('held',s.held,(await ui()).prompt);
await g.walk(-1.5,8.8,.5);
// face west toward crowd: step toward them briefly
await g.advance(.15,['KeyA']);await g.key('KeyQ',.05);await g.advance(.4);s=await g.snap();console.log('after throw alarmed',s.alarmed,'dmg',s.damage,'fastest',s.fastestProp.toFixed(1));await g.shot(P+'06-throw-at-crowd');
await g.advance(.6);s=await g.snap();console.log('alarm +1s',s.alarmed);
console.log('errors',await g.close());
