import {launch} from '../cap.mjs';
const P='meeting-models';
const g=await launch('meeting',{fullfx:true});
const au=await g.audit(.02);console.log('audit',JSON.stringify(au));
await g.advance(1.5);
const s=await g.snap();console.log('snap',JSON.stringify({player:s.player,props:s.props,dc:s.drawCalls,fps:s.fps,items:s.items}));
await g.shot(`${P}-01-start`);
await g.survey();await g.shot(`${P}-02-survey`);
await g.key('Tab',.1);await g.advance(1.2);
for(const [i,dx] of [[3,350],[4,350],[5,350],[6,350]]){await g.orbit(dx,0);await g.shot(`${P}-0${i}-orbit${i-2}`);}
await g.zoom(-2000);await g.shot(`${P}-07-zoomin-spawn`);
await g.orbit(700,0);await g.shot(`${P}-08-zoomin-spawn-back`);
await g.orbit(0,-200);await g.shot(`${P}-09-zoomin-low`);
console.log('errors',JSON.stringify(await g.close()));
