import {launch} from '../cap.mjs';import {txt,log} from './common.mjs';
const g=await launch('qfn',{fullfx:true,width:390,height:844});
await g.advance(.5);await g.shot('qfn-play-60-phone-start');log(await txt(g));
await g.survey();await g.shot('qfn-play-61-phone-survey');await g.survey();
await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE',.2);await g.walk(0,-.5,.4);await g.key('KeyE');await g.advance(1.5);
await g.page.waitForTimeout(1200);await g.shot('qfn-play-62-phone-bench');log(await txt(g));
const s=(await g.snap()).station;const xs=Object.values(s.cells).map(c=>c[0]),ys=Object.values(s.cells).map(c=>c[1]);log('board px x',Math.min(...xs),Math.max(...xs),'y',Math.min(...ys),Math.max(...ys));
log('errors',await g.close());
