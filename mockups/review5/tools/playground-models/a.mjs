import {launch} from '../cap.mjs';
import {writeFileSync} from 'node:fs';
const K='playground-models';
const g=await launch('playground',{fullfx:true});
const au=await g.audit(.02);console.log('audit .02',JSON.stringify(au));
const all=await g.audit(-60);const props=all.filter(f=>f.a==='Pip spawn'||f.b==='Pip spawn').map(f=>f.a==='Pip spawn'?f.b:f.a).filter(n=>!n.startsWith('fixed'));
const near=(await g.audit(-.05)).filter(f=>f.a!=='Pip spawn'&&f.b!=='Pip spawn');
writeFileSync(new URL('./props.json',import.meta.url),JSON.stringify({props,near},null,1));
console.log('props',props.length);
await g.advance(1.5);
let s=await g.snap();console.log('snap',JSON.stringify({props:s.props,dc:s.drawCalls,fps:s.fps,player:s.player,rope:s.rope}));
await g.shot(`${K}-01-start`);
await g.survey();await g.shot(`${K}-02-survey`);s=await g.snap();console.log('survey dc',s.drawCalls);
await g.key('Tab',.1);await g.advance(1.2);
for(const [i,dx] of [[3,500],[4,500],[5,500],[6,500]]){await g.orbit(dx,0);await g.shot(`${K}-0${i}-orbit${i-2}`);}
console.log('errors',JSON.stringify(await g.close()));
