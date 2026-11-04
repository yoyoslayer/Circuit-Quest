import {launch} from '../cap.mjs';
const P='observatory-models-';
const g=await launch('observatory',{fullfx:true});
await g.advance(.5);await g.zoom(-2000);await g.walk(1.0,-6.6,.5);
await g.orbit(350,-250);await g.shot(P+'65-lowback-zoom9');
await g.zoom(800);await g.shot(P+'65b-lowback-zoom20');
await g.orbit(0,120);await g.shot(P+'65c-lowback-zoom20-higher');
console.log(JSON.stringify(await g.close()));
