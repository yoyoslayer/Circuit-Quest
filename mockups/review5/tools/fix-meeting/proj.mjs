// Projector close-ups in the off, on-unpowered and running states (R5-281/R5-356).
import {launch} from '../cap.mjs';
const P='fix-meeting-';
const cam=(g,yaw,pitch,zoom)=>g.page.evaluate(([y,p,z])=>{const q=window.__game;q.yaw=y;q.pitch=p;q.zoom=z;},[yaw,pitch,zoom]);
const g=await launch('meeting');await g.advance(.3);
await g.walk(13.1,-3.3,.3);await cam(g,.6,.7,9);await g.advance(1);await g.shot(P+'09-projector-off');
await g.walk(12.3,-3.3,.4);await g.key('KeyE',.3);await g.walk(13.1,-3.3,.3);await cam(g,.6,.7,9);await g.advance(.6);await g.shot(P+'10-projector-on-unpowered');
console.log(JSON.stringify(await g.close()));
