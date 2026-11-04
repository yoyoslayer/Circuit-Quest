import {launch} from '../cap.mjs';
const P='verify-lobby-models-';
const g=await launch('lobby',{fullfx:true});
console.log('AUDIT',JSON.stringify(await g.audit(.02)));
await g.advance(1);
let s=await g.snap();console.log('SNAP',JSON.stringify({props:s.props,dc:s.drawCalls,fps:s.fps,hub:s.hub}));
await g.survey();s=await g.snap();console.log('survey dc',s.drawCalls);await g.survey();
// Pip behind the reception board, default camera
await g.walk(-3,-1.8,.3);await g.walk(0,-1.8,.3);await g.advance(1);s=await g.snap();console.log('behindboard',JSON.stringify(s.player));
await g.shot(P+'01-pip-behind-board-default');
await g.walk(0,-1.36,.2);await g.advance(.6);s=await g.snap();console.log('underboard',JSON.stringify(s.player));
await g.zoom(-2000);await g.orbit(200,0);await g.shot(P+'02-pip-under-board-side');await g.orbit(-200,0);await g.zoom(1400);
// Lunch door: Pip walks along the wall from the hinge side
await g.walk(-4.6,-8.6,.3);await g.advance(.2);
await g.walk(-2.9,-8.6,.2);await g.advance(.05);await g.shot(P+'03-lunch-leaf-cross');
await g.walk(-2.32,-8.9,.2);await g.advance(1.5);
await g.orbit(0,-300);await g.zoom(-2000);await g.shot(P+'04-lunch-leaf-topdown');
await g.orbit(-262,0);await g.shot(P+'05-lunch-leaf-side');await g.orbit(262,0);await g.orbit(0,300);await g.zoom(1400);
// side wall blade seen from -z side
await g.walk(-12.5,-3.2,.3);await g.advance(1);await g.orbit(524,0);await g.shot(P+'06-blade-from-minus-z');
await g.zoom(-2000);await g.shot(P+'07-blade-from-minus-z-close');
console.log('ERR',JSON.stringify(await g.close()));
