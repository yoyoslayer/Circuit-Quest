import {launch} from '../cap.mjs';
const g=await launch('meeting',{fullfx:true});
await g.advance(1);
await g.shot('characters-40-meeting-gamecam-start');
await g.walk(-8.6,-1.2,.4);
await g.zoom(-1500);
await g.shot('characters-41-meeting-seated-zoom9');
await g.orbit(260,0);await g.shot('characters-42-meeting-seated-zoom9-o90');
await g.orbit(260,0);await g.shot('characters-43-meeting-seated-zoom9-o180');
await g.orbit(260,0);await g.shot('characters-44-meeting-seated-zoom9-o270');
await g.orbit(260,0);
// low orbit, eye level
await g.orbit(0,-250);await g.shot('characters-45-meeting-seated-low');
await g.orbit(0,250);
console.log(await g.close());
