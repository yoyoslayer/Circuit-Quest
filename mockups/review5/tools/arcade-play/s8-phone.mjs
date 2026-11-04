import {launch} from '../cap.mjs';import {toBench,txt} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true,width:390,height:844});await g.advance(1);
await g.shot(P+'80-phone-start');await g.survey();await g.shot(P+'81-phone-survey');await g.survey();
await toBench(g,log);await g.advance(.5);await g.shot(P+'82-phone-bench');
await g.act('power');await g.advance(.4);await g.shot(P+'83-phone-bench-trip');
const r=await g.page.evaluate(()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)];};return {panel:q('.station-panel'),card:q('.objective'),toast:q('.station-toast'),prompt:q('.prompt-pill'),chip:q('.bench-chip')};});
log('rects',JSON.stringify(r));
log('errors',JSON.stringify(await g.close()));
