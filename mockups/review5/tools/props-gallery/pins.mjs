import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});const P='props-gallery-6';
console.log(JSON.stringify((await g.walk(-5,3.6,.5)).arrived));
console.log(JSON.stringify((await g.walk(3.2,3.6,.5)).arrived));
await g.shot(P+'0-playground-pins-gamecam');
await g.zoom(-1500);await g.shot(P+'1-playground-pins-close');
console.log(await g.close());
