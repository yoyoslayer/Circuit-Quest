import {launch} from '../cap.mjs';
const P='lunch-play-v';
const g=await launch('lunch',{fullfx:true});
const W=async(x,z,r=.5)=>{const r2=await g.walk(x,z,r);if(!r2.arrived)console.log('STUCK',x,z,JSON.stringify(r2.state.player));};
await W(.2,2,.5);await W(.2,-1.2,.5);await W(-6.3,-4.6,.5);
console.log('prompt',await g.page.evaluate(()=>document.querySelector('.prompt-pill')?.innerText));
await g.shot(P+'01-store-door-default');
await g.orbit(450,0);await g.shot(P+'02-store-door-yaw90');
await g.orbit(450,0);await g.shot(P+'03-store-door-yaw180');
await g.orbit(-900,0);await g.zoom(-1500);await g.shot(P+'04-store-door-zoom9');
await g.orbit(-450,60);await g.shot(P+'05-store-door-zoom9-yaw-90-low');
await g.orbit(450,-60);await g.zoom(1500);
// walk into storeroom by pushing the shelf? just try pushing through
await W(-3.8,-1.7,.4);await g.zoom(-1500);await g.orbit(900,60);await g.shot(P+'06-fridge-zoom9-back-low');await g.orbit(-900,-60);await g.zoom(1500);
await W(-2,-1,.5);await W(.2,-1.2,.5);await W(.3,2,.5);await W(10,1,.5);await W(11.8,-4.4,.5);
await g.shot(P+'07-lift-default');await g.orbit(-450,0);await g.shot(P+'08-lift-yaw-90');await g.zoom(-1500);await g.shot(P+'09-lift-zoom9-yaw-90');
console.log('errors',await g.close());
