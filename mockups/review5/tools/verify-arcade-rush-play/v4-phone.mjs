import {launch} from '../cap.mjs';import {txt,toBench} from '../arcade-rush-play/common.mjs';
const P='verify-arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true,width:390,height:844});await g.advance(.5);
await toBench(g,log);await g.shot(P+'30-phone-bench');
let s=await g.snap();log('setup',JSON.stringify(s.station.setup));
// tap the A pad (approx) to lift the 47, then tap the visible bin sliver at left edge
await g.click(138,440);s=await g.snap();log('tap A pad',JSON.stringify(s.station.setup),s.station.held);
await g.click(12,470);s=await g.snap();log('tap left-edge bin sliver',s.station.held);
await g.click(12,425);s=await g.snap();log('tap left-edge upper sliver',s.station.held);
await g.click(385,450);s=await g.snap();log('tap right edge',JSON.stringify({pw:s.station.powered,held:s.station.held}));
log(JSON.stringify(await txt(g)));
await g.shot(P+'31-phone-bench-after-taps');
log('errors',JSON.stringify(await g.close()));
