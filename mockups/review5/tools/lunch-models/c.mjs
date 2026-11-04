// Kitchen + lift room close-ups at zoom 9; supply cart tip check.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const P='lunch-models';
const g=await launch('lunch',{fullfx:true});
await hook(g);
const W=async(x,z,r=.5)=>{const q=await g.walk(x,z,r);if(!q.arrived)console.log('STUCK',x,z,JSON.stringify(q.state.player));};
const quat=id=>g.page.evaluate(id=>{const p=window.__g.props.find(p=>p.spec.id===id);const q=p.body.rotation(),t=p.body.translation();const up=2*(q.x*q.x+q.z*q.z);return {pos:t,tilt:+(Math.acos(Math.max(-1,Math.min(1,1-up)))*57.3).toFixed(1)};},id);
await g.advance(.5);
await W(-14.2,5,.4);await W(-12,1.6,.4);console.log('cartA after bump',JSON.stringify(await quat('supply-a')),'cartB',JSON.stringify(await quat('supply-b')));
await g.zoom(-2000);
// Through the corridor into the kitchen
await W(-1,2.5,.4);await W(0,-1.2,.4);await W(-2.6,-5.4,.4);await g.shot(`${P}-30-oven`);
await g.orbit(262,0);await g.shot(`${P}-31-oven-orbit90`);
await g.orbit(262,0);await g.shot(`${P}-32-oven-back`);
await g.orbit(-524,0);
await W(-5.4,-6.6,.4);await g.shot(`${P}-33-prep-table`);
await W(-4.2,-2.2,.4);await g.shot(`${P}-34-fridge-post`);
await g.orbit(262,0);await g.shot(`${P}-35-fridge-post-orbit`);
await g.orbit(262,0);await g.shot(`${P}-36-fridge-back`);
await g.orbit(-524,0);
await W(.3,-3.3,.4);await g.shot(`${P}-37-desks-mugs`);
await W(4.4,-4.2,.4);await g.shot(`${P}-38-conveyor-motor-lamp`);
await g.orbit(262,-100);await g.shot(`${P}-39-conveyor-low`);
await g.orbit(-262,100);
// Lift room
await W(9.6,-5.6,.4);await g.shot(`${P}-40-lift`);
await W(11.8,-3.6,.4);await g.shot(`${P}-41-winch`);
await g.orbit(262,0);await g.shot(`${P}-42-winch-orbit`);
await g.orbit(262,0);await g.shot(`${P}-43-lift-back`);
console.log('errors',JSON.stringify(await g.close()));
