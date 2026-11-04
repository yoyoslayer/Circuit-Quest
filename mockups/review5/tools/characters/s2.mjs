import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});
await g.advance(1);
await g.shot('characters-11-playground-gamecam-start');
await g.zoom(-1500);
// pick the plug
await g.key('KeyF');await g.advance(.3);
console.log('hold',(await g.snap()).holdingPlug);
await g.shot('characters-12-holding-plug-idle-front');
await g.orbit(260,0);await g.shot('characters-13-holding-plug-idle-side');
await g.orbit(260,0);await g.shot('characters-14-holding-plug-idle-back');
await g.orbit(-520,0);
// walk out along the route, then overstretch
await g.walk(-5,-1);await g.walk(-4,-4);
await g.shot('characters-15-holding-plug-cable-behind');
await g.walk(9,3.7);
let s=await g.advance(2.5,['KeyW','ShiftLeft']);console.log('strain',s.rope.strain,s.player);
await g.shot('characters-16-overstretch-pull-pose');
await g.orbit(300,0);await g.shot('characters-17-overstretch-pull-pose-side');
await g.key('KeyQ',.05);await g.advance(.2);await g.shot('characters-18-after-slingshot-release');
console.log(await g.close());
