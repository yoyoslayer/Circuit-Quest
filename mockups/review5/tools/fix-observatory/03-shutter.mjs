// Shutter open vs shut from the room camera, zoomed on the dome.
//   set BASE=http://localhost:4194 && node mockups/review5/tools/fix-observatory/03-shutter.mjs
import {launch} from '../cap.mjs';
const g=await launch('observatory');
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__game.player.setTranslation({x,y:1,z},true);},[x,z]);
await g.advance(.5);await tp(-6.1,.2);await g.advance(.8);await g.zoom(-500);
const clip={x:420,y:60,width:640,height:420};
await g.crop('fix-observatory-30-shutter-open',clip);
await g.act('pick','C');await g.act('slot','series');await g.advance(.3);await g.crop('fix-observatory-31-shutter-slam-0.3',clip);
await g.advance(1);await g.crop('fix-observatory-32-shutter-shut',clip);
await g.act('slot','series');await g.advance(1.5);await g.crop('fix-observatory-33-shutter-reopen',clip);
console.log('errors',await g.close());
