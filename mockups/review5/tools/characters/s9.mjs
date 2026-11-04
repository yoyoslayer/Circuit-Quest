import {launch} from '../cap.mjs';
const g=await launch('lunch',{fullfx:true});
await g.advance(1);await g.shot('characters-70-lunch-gamecam-start');
// chef by the oven
await g.walk(-3,-3.5,.5);await g.zoom(-1500);await g.advance(.5);await g.shot('characters-71-lunch-chef-zoom9');
await g.orbit(350,0);await g.shot('characters-72-lunch-chef-orbit');
await g.orbit(-350,0);
// corridor crowd
await g.walk(.3,2.4);await g.walk(-3,7.6,.5);await g.advance(.6);await g.shot('characters-73-lunch-crowd-zoom9');
await g.orbit(500,0);await g.shot('characters-74-lunch-crowd-orbit');await g.orbit(-500,0);
// thick cable + dolly
await g.walk(-10,7.5,.3);await g.key('KeyF');let s=await g.snap();console.log('held',s.lunch?.held?.id);
await g.advance(.4);await g.shot('characters-75-lunch-thick-plug-hold');
await g.walk(-4,4.5,.5);await g.advance(.3);await g.shot('characters-76-lunch-thick-drag');
await g.orbit(450,0);await g.shot('characters-77-lunch-thick-drag-orbit');
console.log(await g.close());
