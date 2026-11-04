import {launch} from '../cap.mjs';
const P='lobby-models-';
const g=await launch('lobby',{fullfx:true});
const audit=await g.audit(.02);console.log('AUDIT',JSON.stringify(audit));
await g.advance(1);
let s=await g.snap();console.log('SNAP',JSON.stringify({props:s.props,player:s.player,hub:s.hub,fps:s.fps,dc:s.drawCalls}));
const info=await g.page.evaluate(()=>{const gm=window.__circuitCrew;const sc=gm.view?.scene??gm.game?.view?.scene;return !!sc;});console.log('scene?',info);
await g.shot(P+'01-start');
await g.survey();await g.shot(P+'02-survey');s=await g.snap();console.log('survey dc',s.drawCalls,s.fps);await g.survey();
await g.orbit(262,0);await g.shot(P+'03-orbit90');
await g.orbit(262,0);await g.shot(P+'04-orbit180');
await g.orbit(262,0);await g.shot(P+'05-orbit270');
await g.orbit(262,-60);await g.shot(P+'06-orbit360-low');
await g.orbit(0,60);
await g.zoom(2000);await g.shot(P+'07-zoom38');
await g.zoom(-2000);await g.shot(P+'08-zoom9-spawn');
// reception desk front
await g.walk(0,1.6,.3);await g.advance(.6);await g.shot(P+'09-desk-close');
// board from left
await g.walk(-2.6,0.4,.3);await g.advance(.6);await g.orbit(-120,0);await g.shot(P+'10-desk-left');
await g.orbit(120,0);
// behind desk (180 orbit) to check back of board
await g.walk(0,-2.4,.3);await g.advance(.6);await g.orbit(524,0);await g.shot(P+'11-board-back');await g.orbit(-524,0);
// closed doors on back wall
await g.walk(0,-5.6,.3);await g.advance(1.5);await g.shot(P+'12-backdoors-closed');
// open door
await g.walk(-2.32,-8.6,.3);await g.advance(1.5);await g.shot(P+'13-door-open');
await g.orbit(-150,0);await g.shot(P+'14-door-open-angle');await g.orbit(150,0);
// locked door (arcade rush)
await g.walk(6.96,-8.0,.3);await g.advance(1.2);await g.key('KeyE',.3);await g.shot(P+'15-door-locked');
// side wall doors
await g.walk(-11.5,-0.9,.3);await g.advance(1);await g.orbit(-238,0);await g.shot(P+'16-sidedoors');
await g.zoom(600);await g.shot(P+'17-sidedoors-mid');await g.zoom(-2000);
await g.walk(-13.6,-0.9,.3);await g.advance(1.5);await g.shot(P+'18-sidedoor-open');
await g.orbit(238,0);
console.log('ERR',JSON.stringify(await g.close()));
