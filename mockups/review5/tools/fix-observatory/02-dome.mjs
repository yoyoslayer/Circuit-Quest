// Dome colliders, shutter open/shut from the room, the receiver cable on the floor, and the bench tags.
//   set BASE=http://localhost:4194 && node mockups/review5/tools/fix-observatory/02-dome.mjs
import {launch} from '../cap.mjs';
const g=await launch('observatory');
const pos=()=>g.page.evaluate(()=>{const p=window.__game.player.translation();return {x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)};});
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__game.player.setTranslation({x,y:1,z},true);},[x,z]);
await g.advance(.5);
// R5-021: from outside the back-right of the shell, walk at a point inside: the ring must stop Pip.
await tp(-3.2,-6.4);await g.advance(.5);console.log('start',await pos());
await g.walk(-5.2,-6.6,.3,6);console.log('after walk through shell (should stay outside r>2.4)',await pos());
await tp(-8.9,-6.0);await g.advance(.5);await g.walk(-6.8,-6.6,.3,6);console.log('left side walk',await pos());
// In through the open front: Pip steps up onto the platform.
await tp(-6.1,-1.8);await g.advance(.5);await g.walk(-6.6,-4.4,.3,8);console.log('on platform (y higher)',await pos());
await tp(-6.1,.2);await g.advance(.8);await g.zoom(-300);await g.shot('fix-observatory-20-dome-front-open');
// Shutter: a series capacitor starves the latch, live.
await g.act('pick','C');await g.act('slot','series');await g.advance(1.2);console.log('shutter',(await g.snap()).station.shutter);await g.shot('fix-observatory-21-dome-front-shut');
await g.act('slot','series');await g.advance(.2);
// The floor cable between the rack and the bench.
await tp(-2.0,.6);await g.advance(.8);await g.shot('fix-observatory-22-rack-bench-cable');
await g.act('route');await g.advance(.3);await g.shot('fix-observatory-23-rack-bench-cable-back');
console.log('errors',await g.close());
