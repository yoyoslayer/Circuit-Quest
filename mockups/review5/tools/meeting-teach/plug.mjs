import {launch} from '../cap.mjs';
const K='meeting-teach';
const g=await launch('meeting',{fullfx:true});
await g.walk(-10,-6.2,.4);await g.key('KeyF',.3);await g.zoom(-1500);await g.orbit(300,0);await g.shot(`${K}-30-plug-in-hand-close`);
await g.walk(-9,-6,.5);await g.walk(-9,5.3,.5);await g.walk(-3.3,5.5,.3);await g.zoom(-1500);await g.shot(`${K}-31-mailcart-coupler-reel-close`);
console.log(JSON.stringify((await g.snap()).rope));
console.log('errors',await g.close());
