// Wall T-junction flicker, tray over the gap, storeroom lit (capcart/coolbox close-ups), docked cart cord, dc without fullfx.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const P='lunch-models';
const lo=await launch('lunch',{fullfx:false});await lo.advance(1);let s=await lo.snap();console.log('dc lowfx',s.drawCalls,'fps',s.fps);await lo.survey();s=await lo.snap();console.log('dc lowfx survey',s.drawCalls);await lo.close();
const g=await launch('lunch',{fullfx:true});
await hook(g);
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__g.player.setTranslation({x,y:.8,z},true);},[x,z]);
await g.advance(.5);await g.zoom(-2000);
// T-junction of store-front / kitchen-front / store-divider-2 at (-7.75, 0.15)
await tp(-7.0,1.6);await g.advance(.4);await g.orbit(130,0);
await g.shot(`${P}-80-wall-junction`);await g.advance(.1);await g.shot(`${P}-81-wall-junction-b`);
// Light the storeroom: plug the thick cable into the kitchen post (state set for inspection)
await g.page.evaluate(()=>{const L=window.__g.lunch;const c=L.cables.find(c=>c.id==='thick');c.ports[1]='kitchen';});
await g.advance(1.2);console.log('lit',(await g.snap()).lunch.lit);
await tp(-10.6,-5.8);await g.advance(.6);await g.shot(`${P}-82-store-lit`);
await g.orbit(262,0);await g.shot(`${P}-83-capcart-close`);
await g.orbit(262,0);await g.shot(`${P}-84-capcart-coolbox-back`);
await g.orbit(-524,0);
// Dock the cart by the winch (moved for inspection) and look at the cart's lead
await g.page.evaluate(()=>{const p=window.__g.props.find(p=>p.spec.id==='capacitor');p.body.setTranslation({x:11.2,y:.7,z:-4.6},true);});
await tp(10.4,-3.2);await g.advance(1);console.log('docked',(await g.snap()).lunch.capDocked);await g.shot(`${P}-85-cap-docked`);
await g.orbit(262,0);await g.shot(`${P}-86-cap-docked-orbit`);await g.orbit(-262,0);
// Tray on its way across the lift room (state set for inspection)
await g.page.evaluate(()=>{const G=window.__g,L=G.lunch,t=G.props.find(p=>p.spec.id==='tray');t.mesh.visible=true;t.body.setEnabled(true);L.job.tray='conveyor';L.job.transport=.8;t.body.setBodyType(1,true);});
await tp(9.4,-3.6);await g.advance(.3);await g.shot(`${P}-87-tray-over-gap`);
await g.orbit(262,-80);await g.shot(`${P}-88-tray-over-gap-side`);
console.log('errors',JSON.stringify(await g.close()));
