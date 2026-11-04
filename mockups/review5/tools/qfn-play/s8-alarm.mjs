import {launch} from '../cap.mjs';import {txt,log} from './common.mjs';
const g=await launch('qfn',{fullfx:true});
await g.advance(.2);await g.walk(-8.8,2.95,.5);await g.key('KeyE');
// coworker 'bun' at (-6.8,.6); stand at (-6.8,2.6) facing -z and throw
await g.walk(-6.8,4.2,.4);await g.walk(-6.8,2.7,.25);
await g.key('KeyQ',.1);await g.advance(.4);let s=await g.snap();log('alarm after throw',s.alarmed,s.fastestProp.toFixed(1),s.time.toFixed(1));await g.shot('qfn-play-90-throw-at-coworker');
await g.advance(1);s=await g.snap();log('later',s.alarmed);
// Tab while holding? pause menu text
await g.key('Escape',.3);log('pause',await g.page.evaluate(()=>document.querySelector('[data-layer] .pause, .pause-menu, dialog, .menu')?.innerText));await g.shot('qfn-play-91-pause');
log('errors',await g.close());
