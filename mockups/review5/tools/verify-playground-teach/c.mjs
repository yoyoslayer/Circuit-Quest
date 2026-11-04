import {launch} from '../cap.mjs';
const P='verify-playground-teach';
const g=await launch('playground',{fullfx:true});
await g.advance(37);let s=await g.snap();console.log('idle',s.time.toFixed(1),s.electrical,s.drawCalls,s.fps);
await g.shot(`${P}-12-idle-hint`);
await g.survey();s=await g.snap();console.log('survey dc',s.drawCalls);await g.shot(`${P}-13-idle-hint-survey`);await g.key('Tab',.1);await g.advance(1);
// idle while holding the plug, moved away: does the hint start at Pip?
await g.key('KeyF');await g.walk(-7,-6,.5);await g.advance(.5);await g.shot(`${P}-14-idle-hint-holding-elsewhere`);
console.log('errors',await g.close());
