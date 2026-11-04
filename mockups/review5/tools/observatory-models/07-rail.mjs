import {launch} from '../cap.mjs';
const P='observatory-models-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
await g.advance(.5);await g.walk(3.6,-5.0,.5);await g.zoom(-300);
await g.orbit(520,0);await g.shot(P+'64-gallery-from-behind');
await g.orbit(-260,0);await g.shot(P+'64b-gallery-side');
await g.orbit(-520,0);await g.shot(P+'64c-gallery-other-side');
log('errors',JSON.stringify(await g.close()));
