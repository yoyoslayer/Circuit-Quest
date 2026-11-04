import {launch} from '../cap.mjs';import {toBench} from '../arcade-rush-play/common.mjs';
const P='verify-arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true,width:390,height:844});await g.advance(.5);
await toBench(g,log);
await g.click(138,440);await g.click(12,470);await g.click(138,440);let s=await g.snap();log('chain',JSON.stringify(s.station.setup.chain),s.station.held);
await g.click(345,445);await g.advance(2.4);s=await g.snap();log('powered',s.station.powered,'soakDone',s.station.soakDone);
for(const [x,y] of [[387,495],[388,505],[386,485],[389,515]]){await g.click(x,y);s=await g.snap();log('tap',x,y,'served',s.station.served.length);if(s.station.served.length)break;}
await g.shot(P+'32-phone-soak-done');
log('errors',JSON.stringify(await g.close()));
