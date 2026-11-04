// Lift room via corridor; storeroom (teleport for inspection); Pip helmet crops; lid edge.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const P='lunch-models';
const g=await launch('lunch',{fullfx:true});
await hook(g);
const W=async(x,z,r=.5)=>{const q=await g.walk(x,z,r);if(!q.arrived)console.log('STUCK',x,z,JSON.stringify(q.state.player));};
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__g.player.setTranslation({x,y:.8,z},true);},[x,z]);
await g.advance(.5);
// Pip crops at zoom 9 from spawn (front-ish), then side, back
await g.zoom(-2000);await g.orbit(525,0);
await g.crop(`${P}-50-pip-front`,{x:520,y:200,width:400,height:440});
await g.orbit(262,0);await g.crop(`${P}-51-pip-side`,{x:520,y:200,width:400,height:440});
await g.orbit(262,0);await g.crop(`${P}-52-pip-back`,{x:520,y:200,width:400,height:440});
await g.orbit(-1049,0);
// Lift room by the corridor
await W(-1,3,.5);await W(10,1,.5);await W(10.6,-3.4,.4);await g.shot(`${P}-53-lift-room`);
await g.orbit(262,0);await g.shot(`${P}-54-lift-orbit90`);
await g.orbit(262,0);await g.shot(`${P}-55-lift-orbit180`);
await g.orbit(0,-200);await g.shot(`${P}-56-lift-low`);
await g.orbit(0,200);await g.orbit(-524,0);
await W(12.4,-3.6,.4);await g.shot(`${P}-57-winch-close`);
await g.orbit(-262,0);await g.shot(`${P}-58-winch-side`);
await g.orbit(262,0);
// Storeroom: look in from the kitchen side of the blocked door, at zoom 9
await tp(-6.4,-4.8);await g.advance(.6);await g.shot(`${P}-59-store-from-kitchen`);
await g.orbit(-262,0);await g.shot(`${P}-60-store-from-kitchen-orbit`);
await g.orbit(262,0);
// Inside the storeroom (teleported in for model inspection only)
await tp(-10.8,-5.6);await g.advance(.6);await g.shot(`${P}-61-store-inside`);
await g.orbit(262,0);await g.shot(`${P}-62-store-inside-orbit90`);
await g.orbit(262,0);await g.shot(`${P}-63-store-inside-orbit180`);
await g.orbit(0,-200);await g.shot(`${P}-64-store-inside-low`);
await g.orbit(0,200);
await g.zoom(2000);await g.shot(`${P}-65-store-zoom38`);
await g.orbit(262,0);await g.shot(`${P}-66-store-zoom38-orbit`);
console.log('errors',JSON.stringify(await g.close()));
