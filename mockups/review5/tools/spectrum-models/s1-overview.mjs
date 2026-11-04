import {launch} from '../cap.mjs';
const K='spectrum-models';
const g=await launch('spectrum',{fullfx:true});
const audit2=await g.audit(.02), audit4=await g.audit(.04);
console.log('AUDIT .02',JSON.stringify(audit2));console.log('AUDIT .04 count',audit4.length);
await g.advance(1);
let s=await g.snap();console.log('start',JSON.stringify({props:s.props,fps:s.fps,dc:s.drawCalls,player:s.player,items:s.items}));
await g.shot(`${K}-01-start`);
await g.survey();s=await g.snap();console.log('survey dc',s.drawCalls);await g.shot(`${K}-02-survey`);
await g.survey();
for(const [i,dx] of [[3,350],[4,350],[5,350],[6,350]]){await g.orbit(dx,0);await g.shot(`${K}-0${i}-orbit${(i-2)*90}`);}
// a lower pitch orbit
await g.orbit(0,-200);await g.shot(`${K}-07-orbit-low`);
// survey from a rotated yaw
await g.orbit(700,150);await g.survey();await g.shot(`${K}-08-survey-rot180`);
// count lights, material types
const info=await g.page.evaluate(()=>{const gm=window.__circuitCrew;return null;});
console.log('errors',JSON.stringify(await g.close()));
