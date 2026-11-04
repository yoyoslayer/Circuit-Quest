import {launch} from '../cap.mjs';import {txt,log} from './common.mjs';
const g=await launch('qfn',{fullfx:true});
await g.advance(.3);
await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE',.2);await g.walk(0,-.5,.4);
// standing at the bench stand: sweep orbits
for(let i=0;i<4;i++){await g.orbit(i?450:0,0);await g.shot(`qfn-play-7${i}-stand-orbit${i}`);}
await g.orbit(450,0);
// low orbit, close
await g.zoom(-1500);await g.orbit(0,-200);await g.shot('qfn-play-74-stand-close-low');
await g.zoom(1500);await g.orbit(0,200);
// wedge test: carry crate? (crate is now fixed on side table). Use a fresh run for wedge in s7.
log('errors',await g.close());
