import {launch} from '../cap.mjs';import {txt,toBench} from './common.mjs';
const P='arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true,width:390,height:844});await g.advance(.5);
await g.shot(P+'60-phone-start');log('start',JSON.stringify(await txt(g)));
await g.survey();await g.shot(P+'61-phone-survey');await g.survey();
await toBench(g,log);await g.shot(P+'62-phone-bench');
await g.key('KeyP',.4);await g.shot(P+'63-phone-bench-trip');log('bench',JSON.stringify(await txt(g)));
log('errors',JSON.stringify(await g.close()));
