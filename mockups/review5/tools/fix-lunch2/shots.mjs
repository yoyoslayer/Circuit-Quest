// lunch2 shots: the storeroom dark and lit (R5-141), the oven burn warning (R5-088), the cap-cart
// inlet and the supply-cart gauge stems. Usage: BASE=http://localhost:4212 node shots.mjs <tag>
import {launch} from '../cap.mjs';
const tag=process.argv[2]??'after';
const g=await launch('lunch',{fullfx:true});await g.advance(.5);
const ev=f=>g.page.evaluate(f);
// Teleport Pip into the kitchen by the storeroom opening, camera looking west into the store.
const place=(x,z,yaw,pitch,zoom)=>g.page.evaluate(([x,z,yaw,pitch,zoom])=>{const G=window.__game;G.player.setTranslation({x,y:1,z},true);Object.assign(G,{yaw,pitch,zoom});},[x,z,yaw,pitch,zoom]);
await place(-6.6,-3.4,-Math.PI/2,.35,13);await g.advance(1.2);
await g.shot(`fix-lunch2-store-dark-${tag}`);await g.survey();await g.shot(`fix-lunch2-store-dark-survey-${tag}`);await g.survey();
await place(-10.4,-5.6,-Math.PI*.8,.3,9);await g.advance(1.2);await g.shot(`fix-lunch2-store-dark-close-${tag}`);
// Light the storeroom: feed the kitchen post straight from cart B and switch the storeroom lamp on.
await ev(()=>{const L=window.__game.lunch;L.circuit.leads.push({id:'shot-feed',from:'b',to:'kitchen',rating:10,closed:true,heat:0,dead:false});L.load('store-lamp').enabled=true;});
await g.advance(1.2);await g.shot(`fix-lunch2-store-lit-${tag}`);
// Cap cart close-up (its inlet on the control box, its cans).
await place(-10.4,-5.6,-Math.PI*.8,.3,9);await g.advance(1);await g.shot(`fix-lunch2-capcart-${tag}`);
// Supply carts with their gauges on stems.
await place(-11,4.8,-Math.PI*.15,.35,9);await g.advance(1);await g.shot(`fix-lunch2-supply-gauges-${tag}`);
// Burn warning: a baked tray left in a powered oven past BURN_WARNING.
await ev(()=>{const L=window.__game.lunch;L.job.bake=20;L.job.tray='baked';L.job.ovenWait=62;});
await place(-2.5,-4.6,0,.42,14);await g.advance(1.3);await g.shot(`fix-lunch2-burn-warning-${tag}`);
await g.advance(.25);await g.shot(`fix-lunch2-burn-warning-b-${tag}`);
console.log(JSON.stringify({errors:g.errors.slice(0,5),lit:(await g.snap()).lunch?.lit}));
await g.close();
