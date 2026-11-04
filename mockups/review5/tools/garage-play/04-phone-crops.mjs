import {launch} from '../cap.mjs';
const P='garage-play-';const log=(...a)=>console.log(...a);
let g=await launch('garage',{fullfx:true,width:390,height:844});
await g.advance(1);await g.shot(P+'70-phone-start');await g.survey();await g.shot(P+'71-phone-survey');await g.survey();
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.3);await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE',.4);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE',.6);
await g.act('pulse');await g.advance(2);await g.shot(P+'72-phone-bench-after-pulse');
log('phone errors',JSON.stringify(await g.close()));
g=await launch('garage',{fullfx:true});
await g.advance(.5);
// carry close-up from the side
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.4);await g.walk(4.6,-3.0,.3);await g.advance(.4);
await g.zoom(-1500);await g.orbit(-350,0);await g.shot(P+'73-carry-side-zoom9');
await g.orbit(700,0);await g.shot(P+'74-carry-other-side-zoom9');
await g.zoom(1500);await g.orbit(-350,0);
await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE',.4);
// occlusion: stand behind the bench, between bench and stand; orbit low
await g.walk(2.9,-4,.4);await g.walk(.7,-3.4,.3);await g.advance(.3);
await g.orbit(0,-150);await g.zoom(-800);await g.shot(P+'75-behind-bench-low');
await g.orbit(1000,0);await g.shot(P+'76-behind-bench-low-opposite');
await g.zoom(800);await g.orbit(-1000,150);
// back wall area behind tool chest: does the chest / boxes hide Pip?
await g.walk(-3.6,-5.6,.4);await g.orbit(0,-150);await g.zoom(-800);await g.shot(P+'77-near-chest-low');await g.zoom(800);await g.orbit(0,150);
// sit at bench and pulse: robot reboot crop
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE',.6);
await g.orbit(400,0,.3);await g.shot(P+'78-bench-orbit-attempt');
await g.act('pulse');await g.advance(.95);await g.crop(P+'79-crop-robot-reboot',{x:700,y:80,width:360,height:340});
await g.advance(.4);await g.crop(P+'80-crop-robot-reboot-b',{x:700,y:80,width:360,height:340});
await g.crop(P+'81-crop-panel-colours',{x:1125,y:95,width:300,height:260});
// stand up and pulse from room view: can you see the fun at the game camera?
await g.key('Escape',.5);await g.act('pulse');await g.advance(.95);await g.shot(P+'82-pulse-from-room-camera');
log('errors',JSON.stringify(await g.close()));
