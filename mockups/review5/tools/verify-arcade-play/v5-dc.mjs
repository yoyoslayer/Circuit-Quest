import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
for(const lvl of ['arcade','lunch']){const g=await launch(lvl,{fullfx:true});await g.advance(.5);let s=await g.snap();log(lvl,'start dc',s.drawCalls);
await g.survey();s=await g.snap();log(lvl,'survey dc',s.drawCalls);log('errors',JSON.stringify(await g.close()));}
