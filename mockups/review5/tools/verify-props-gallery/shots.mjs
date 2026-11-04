import {launch} from '../cap.mjs';
const P='verify-props-gallery-';
let g=await launch('meeting',{fullfx:true,query:'norim'});
await g.advance(.5);
console.log(JSON.stringify((await g.walk(-12.6,4.2,.5)).arrived));
await g.zoom(-1500);await g.orbit(-150,0);await g.shot(P+'01-meeting-coffee-zoom9-norim');
// luma of coffee body region: sample via page screenshot later
await g.zoom(1500);
console.log(JSON.stringify((await g.walk(-2.2,3.6,.5)).arrived));
await g.zoom(-1500);await g.shot(P+'02-meeting-mailcart-coupler-zoom9');
await g.orbit(300,0);await g.shot(P+'03-meeting-mailcart-coupler-o300');
// approach the reel only (far from coupler) holding plug? just read prompt
console.log(await g.close());
g=await launch('playground',{fullfx:true});
await g.advance(.5);
console.log(JSON.stringify((await g.walk(3.2,4.2,.5)).arrived));
await g.advance(.3);await g.shot(P+'04-playground-pins-gamecam');
await g.zoom(-1500);await g.shot(P+'05-playground-pins-zoom9');
console.log(await g.close());
