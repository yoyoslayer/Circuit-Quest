// Pip walking into the lift car footprint (car floor at 1.12 m, no collider) and through the stray socket box.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const P='lunch-models';
const g=await launch('lunch',{fullfx:true});
await hook(g);
const W=async(x,z,r=.3)=>{const q=await g.walk(x,z,r);console.log('walk',x,z,'->',JSON.stringify(q.state.player));return q;};
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__g.player.setTranslation({x,y:.8,z},true);},[x,z]);
await g.advance(.5);await g.zoom(-2000);
await tp(12,-3.4);await g.advance(.3);
await W(12,-6.0);await g.shot(`${P}-96-pip-in-socketbox`);
await W(12,-7.2);await g.shot(`${P}-97-pip-under-liftcar`);
await g.orbit(262,0);await g.shot(`${P}-98-pip-under-liftcar-side`);
console.log('errors',JSON.stringify(await g.close()));
