// Power room + corridor close-ups at zoom 9.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const P='lunch-models';
const g=await launch('lunch',{fullfx:true});
console.log('audit.005',JSON.stringify(await g.audit(.005)));
await hook(g);
const yaw=()=>g.page.evaluate(()=>window.__g.yaw);
const W=async(x,z,r=.5)=>{const q=await g.walk(x,z,r);if(!q.arrived)console.log('STUCK',x,z,JSON.stringify(q.state.player));};
await g.advance(.5);
await g.zoom(-2000);
// Rack + crates, from spawn side
await W(-14.2,5,.4);await g.shot(`${P}-12-rack-close`);
await g.orbit(262,0);await g.shot(`${P}-13-rack-close-orbit90`);
await g.orbit(-524,0);await g.shot(`${P}-14-rack-close-orbit-90`);
// Supply carts and splitters
await W(-12,1.6,.4);await g.orbit(262,0);await g.shot(`${P}-15-cartA-splitters`);
await g.orbit(525,0);await g.shot(`${P}-16-cartA-back`);
await W(-11.5,7,.4);await g.shot(`${P}-17-cartB-dolly`);
await g.orbit(300,0);await g.shot(`${P}-18-cartB-dolly-orbit`);
// Corridor: vending, cooler, benches, blobs
await W(-5.5,7.6,.4);await g.shot(`${P}-19-vending-cooler`);
await g.orbit(525,0);await g.shot(`${P}-20-vending-back`);
await W(-3.2,7.8,.4);await g.orbit(-525,0);await g.shot(`${P}-21-benches`);
// Dining table + chairs + rug
await W(11.5,6.5,.4);await g.shot(`${P}-22-dining`);
await g.orbit(262,0);await g.shot(`${P}-23-dining-orbit`);
// Bridges and mop/wedge
await W(8,6.8,.4);await g.shot(`${P}-24-bridges`);
await W(1.2,6.5,.4);await g.shot(`${P}-25-mop`);
await W(-2.5,6,.4);await g.shot(`${P}-26-wedge`);
// Puddles, bots, lane paint, door
await W(.5,2.2,.4);await g.shot(`${P}-27-puddles-door`);
await g.orbit(262,-120);await g.shot(`${P}-28-puddles-low`);
console.log('yaw',await yaw());
console.log('errors',JSON.stringify(await g.close()));
