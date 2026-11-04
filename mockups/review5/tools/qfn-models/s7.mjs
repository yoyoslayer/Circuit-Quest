import {open,P} from './common.mjs';
const g=await open();
await g.advance(.5);
await g.walk(-8.8,2.95,.5);await g.key('KeyE',.3);
await g.walk(-2.0,0.4,.5);await g.advance(.3);await g.shot(`${P}-84-gamecam-carry-approach`);
await g.walk(1.3,-.6,.5);await g.key('KeyE',.4);await g.advance(1);await g.shot(`${P}-85-gamecam-crate-delivered`);
await g.survey();await g.shot(`${P}-86-survey-crate-delivered`);
console.log('errors',JSON.stringify(await g.close()));
