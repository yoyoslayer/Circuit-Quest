// Lit storeroom (lit() forced for inspection): capcart/coolbox/lamp close-ups; tray crossing the lift-room gap.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const P='lunch-models';
const g=await launch('lunch',{fullfx:true});
await hook(g);
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__g.player.setTranslation({x,y:.8,z},true);},[x,z]);
await g.advance(.5);await g.zoom(-2000);
await g.page.evaluate(()=>{window.__g.lunch.lit=()=>true;});
await tp(-10.6,-5.6);await g.advance(.6);await g.shot(`${P}-90-store-lit`);
await g.orbit(262,0);await g.shot(`${P}-91-capcart-close`);
await g.orbit(262,0);await g.shot(`${P}-92-store-lit-orbit180`);
await g.orbit(-524,0);await g.zoom(1500);await g.shot(`${P}-93-store-lit-wide`);await g.zoom(-1500);
// Tray mid-transport, kinematic like the runtime makes it
await g.page.evaluate(()=>{const G=window.__g,L=G.lunch,t=G.props.find(p=>p.spec.id==='tray');t.mesh.visible=true;t.body.setEnabled(true);t.body.setBodyType(2,true);L.job.tray='conveyor';L.job.transport=.78;});
await tp(9.0,-3.4);await g.advance(.1);await g.shot(`${P}-94-tray-over-gap`);
await g.orbit(200,-60);await g.shot(`${P}-95-tray-over-gap-side`);
console.log('tray',JSON.stringify((await g.snap()).items.find(i=>i.id==='tray')));
console.log('errors',JSON.stringify(await g.close()));
