import {launch} from '../cap.mjs';
const P='observatory-play-';const log=(...a)=>console.log(...a);
let g=await launch('observatory',{fullfx:true});
await g.advance(.5);
await g.crop(P+'72-crop-marker-start',{x:820,y:140,width:160,height:180});
// behind the receiver rack
let r=await g.walk(-3.6,-3.3,.3,10);log('behind rack',JSON.stringify(r.state.player));await g.shot(P+'73-pip-behind-rack');
await g.orbit(-500,0);await g.shot(P+'74-behind-rack-orbit');await g.orbit(500,0);
// inside dome / by the telescope
r=await g.walk(-5,-4.2,.3,10);log('dome',JSON.stringify(r.state.player));await g.shot(P+'75-pip-in-dome');
await g.orbit(900,0);await g.shot(P+'76-pip-dome-orbit-back');
await g.zoom(-1500);await g.shot(P+'77-pip-dome-orbit-back-zoom9');await g.zoom(1500);await g.orbit(-900,0);
// gallery behind plinths
r=await g.walk(6.2,-7.2,.3,10);log('gallery',JSON.stringify(r.state.player));await g.shot(P+'78-pip-gallery');
await g.orbit(0,150);await g.shot(P+'79-pip-gallery-low');
log('errors',JSON.stringify(await g.close()));
g=await launch('observatory',{fullfx:true,width:390,height:844});
await g.advance(.5);await g.shot(P+'80-phone-start');
await g.survey();await g.shot(P+'81-phone-survey');await g.survey();
await g.walk(0,-1.55,.4);await g.key('KeyE',.8);await g.shot(P+'82-phone-bench');
await g.act('pick','C');await g.act('slot','shunt');await g.advance(.3);await g.shot(P+'83-phone-bench-can');
log('errors',JSON.stringify(await g.close()));
