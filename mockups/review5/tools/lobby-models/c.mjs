import {launch} from '../cap.mjs';
const P='lobby-models-';
let g=await launch('lobby',{fullfx:true,start:false});await g.advance(.5);await g.shot(P+'34-title');await g.close();
g=await launch('lobby',{fullfx:true,query:'norim'});await g.advance(1);await g.shot(P+'35-norim-start');
await g.walk(7.2,6.4,.3);await g.advance(.5);await g.zoom(-2000);await g.shot(P+'36-norim-workshop-close');
// beanbag close: walk to left of it, orbit
await g.walk(9.8,6.6,.3);await g.advance(.5);await g.orbit(-180,0);await g.shot(P+'37-beanbag-orbit');await g.orbit(180,0);
// hide behind board at default camera
await g.walk(3,-2.1,.3);await g.walk(0.3,-2.1,.3);await g.advance(.8);await g.zoom(1400);await g.shot(P+'38-pip-behind-board');
let s=await g.snap();console.log('pip',JSON.stringify(s.player));
// orbit 90 to see blade signs edge-on from the front-right
await g.walk(-9,2,.3);await g.advance(.5);await g.zoom(-2000);await g.orbit(200,0);await g.shot(P+'39-blade-from-right');await g.orbit(-200,0);
await g.orbit(-450,0);await g.shot(P+'40-blade-from-back');await g.orbit(450,0);
console.log('ERR1',JSON.stringify(await g.close()));
g=await launch('lobby',{fullfx:true,width:390,height:844});await g.advance(1);await g.shot(P+'41-phone-start');await g.survey();await g.shot(P+'42-phone-survey');console.log('ERR2',JSON.stringify(await g.close()));
g=await launch('playground',{fullfx:true});await g.advance(1);s=await g.snap();console.log('playground dc',s.drawCalls,s.props);await g.close();
