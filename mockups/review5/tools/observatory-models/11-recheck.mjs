import {launch} from '../cap.mjs';
const P='observatory-models-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
await g.advance(.5);
// Carry height of the motor cart vs Pip
await g.walk(-3.7,-.1,.6);await g.key('KeyE',.4);
let s=await g.snap();log('carry',JSON.stringify(s.items),JSON.stringify(s.player),s.held);
await g.shot(P+'70-carry-default-zoom');
await g.key('KeyE',.6);
// Pip behind the dome at the default camera, then orbit to the back
await g.walk(-3.0,-6.7,.4);let r=await g.walk(-5.4,-7.0,.3,20);log('dome',r.arrived,JSON.stringify(r.state.player));
await g.shot(P+'71-behind-dome-default');
await g.orbit(525,0);await g.shot(P+'72-behind-dome-orbit180');
await g.orbit(-262,0);await g.shot(P+'73-behind-dome-orbit90');
log('errors',JSON.stringify(await g.close()));
