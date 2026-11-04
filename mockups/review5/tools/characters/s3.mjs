import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});
await g.advance(.5);await g.zoom(-1500);
await g.walk(-5.2,3.2,.3);await g.walk(-4.9,4.4,.25);
await g.key('KeyE');await g.advance(.6);
let s=await g.snap();console.log('held',s.held,s.player);
await g.walk(-6,1,.4);await g.walk(-6,0,.3);await g.advance(.6);
s=await g.snap();const box=s.items;console.log('held2',s.held);
await g.shot('characters-20-carry-box-front');
await g.orbit(260,0);await g.shot('characters-21-carry-box-side');
await g.orbit(260,0);await g.shot('characters-22-carry-box-back');
await g.orbit(-520,0);
// jump with box
await g.key('Space',0);await g.advance(.18);console.log('air',(await g.snap()).pose);
await g.shot('characters-23-jump-carrying');
await g.advance(1);
// throw
await g.key('KeyQ',0);await g.advance(.12);await g.shot('characters-24-throw-release');
await g.advance(1);
// jump empty-handed
await g.key('Space',0);await g.advance(.2);console.log('air2',(await g.snap()).pose);await g.shot('characters-25-jump-empty-rising');
await g.advance(.25);await g.shot('characters-26-jump-empty-falling');
await g.advance(1);
// chair carry: nearest chair
s=await g.snap();
console.log(await g.close());
