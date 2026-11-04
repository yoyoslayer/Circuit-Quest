import {launch} from '../cap.mjs';
let g=await launch('lunch',{fullfx:true});
await g.walk(-3,6,.4);await g.zoom(-1500);await g.orbit(-250,0,1);await g.advance(.5);
await g.shot('verify-gap5-toon-pipeline-01-lunch-wedge-orbit-left');
await g.orbit(600,0,1);await g.shot('verify-gap5-toon-pipeline-02-lunch-wedge-orbit-right');
console.log(await g.close());
g=await launch('playground',{fullfx:true,query:'hardcel&norim'});
await g.zoom(-1500);await g.shot('verify-gap5-toon-pipeline-03-playground-hardcel-norim-start');
console.log(await g.close());
