import {launch} from '../cap.mjs';
const g=await launch('meeting',{fullfx:true});
await g.advance(.5);
await g.shot('verify-characters-01-meeting-start-gamecam');
await g.walk(-8.5,-7,.4);await g.walk(-6.85,-7.05,.25);
await g.key('KeyE');await g.advance(.3);let s=await g.snap();console.log('held',s.held);
await g.walk(-9.5,-7.6,.4);await g.key('KeyE');await g.advance(.6);s=await g.snap();console.log('held after drop',s.held,s.player);
await g.zoom(-2000);
for(const [i,dx] of [[2,0],[3,250],[4,250],[5,250]]){ if(dx) await g.orbit(dx,0); await g.shot(`verify-characters-0${i}-meeting-after-chair-grab-o${i}`);}
await g.orbit(0,200);await g.shot('verify-characters-06-meeting-after-chair-low');
console.log(await g.close());
