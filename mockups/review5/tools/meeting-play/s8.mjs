import {launch} from '../cap.mjs';import {hud,placeStrip,route} from './common.mjs';
const K='meeting-play';const log=(...a)=>console.log(...a);
let g=await launch('meeting',{fullfx:true});await g.advance(.3);
await placeStrip(g);
await g.walk(11.5,-.6,.3);await g.zoom(-1500);await g.orbit(-300,-100);await g.shot(`${K}-75-strip-gauge-side`);
await g.orbit(-300,0);await g.shot(`${K}-76-gauge-back`);
await g.orbit(600,100);
await g.walk(14.5,-.6,.3);await g.zoom(-1500);await g.shot(`${K}-77-kettle-heater-close`);
// crop the gauge at default zoom
await g.zoom(1500);await g.page.evaluate(()=>{});await g.walk(11,-1,.4);await g.key('KeyC',.8);
await g.shot(`${K}-78-door-default-cam`);
// coupler on the cart close-up vs plug
await route(g,[[6,-1.2],[-3,3.6]],.4);await g.zoom(-1500);await g.shot(`${K}-79-mailcart-coupler-close`);
await g.orbit(500,0);await g.shot(`${K}-80-mailcart-coupler-other-side`);
console.log('errors',JSON.stringify(await g.close()));
