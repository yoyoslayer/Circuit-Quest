import {launch} from '../cap.mjs';import {hud,placeStrip,route} from './common.mjs';
const K='meeting-play';const log=(...a)=>console.log(...a);
const g=await launch('meeting',{fullfx:true});await g.advance(.3);
let s=await placeStrip(g);log('strip placed t',s.time.toFixed(1));
// New player: go to the mail cart, grab the REEL first (the obvious thing), carry it to the closet plug.
await route(g,[[6,-1.2],[-8,-1.4],[-9,5.3],[-3,5.3]],.3);
log('at cart',JSON.stringify(await hud(g)));await g.shot(`${K}-29-mailcart`);
await g.zoom(-1500);await g.shot(`${K}-30-mailcart-close`);await g.zoom(1000);
await g.key('KeyE');s=await g.snap();log('held',s.held,JSON.stringify(await hud(g)));
await route(g,[[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);s=await g.snap();log('at plug with reel t',s.time.toFixed(1),JSON.stringify(await hud(g)));
await g.shot(`${K}-31-reel-at-plug`);
await g.key('KeyE',.5);s=await g.snap();log('after E reel',JSON.stringify({held:s.held,max:s.rope.maxLength,hint:s.couplerHint}),JSON.stringify(await hud(g)));
await g.shot(`${K}-32-reel-dropped-nothing`);
// Now take the plug and walk it to the cart: wrong order buzz? coupler chosen first?
await g.key('KeyF');s=await g.snap();log('holding plug',s.holdingPlug,JSON.stringify(await hud(g)));
// reel lies by the plug; F near it
await g.key('KeyF',.3);s=await g.snap();log('F near reel',JSON.stringify({hp:s.holdingPlug,max:s.rope.maxLength}),JSON.stringify(await hud(g)));
await g.shot(`${K}-33-plug-near-reel-wrong-order`);
await g.advance(.6);await g.shot(`${K}-34-coupler-badge`);
log('t',(await g.snap()).time.toFixed(1));
// go fetch the coupler with plug in hand
await route(g,[[-9,-6],[-9,5.3],[-3.65,5.3]],.3);s=await g.snap();log('plug at cart',JSON.stringify(await hud(g)),'strain',s.rope.strain.toFixed(2));
await g.shot(`${K}-35-plug-at-coupler`);
await g.key('KeyF',.3);s=await g.snap();log('coupled',JSON.stringify({hp:s.holdingPlug,max:s.rope.maxLength}),JSON.stringify(await hud(g)));
// Now back for the reel (it lies at the closet) with plug still in hand
await route(g,[[-9,5.3],[-9,-5.5]],.4);s=await g.snap();log('back near reel',JSON.stringify(await hud(g)));
const reel=s.items.find(i=>i.id==='extension');log('reel pos',JSON.stringify(reel.pos));
await g.walk(reel.pos.x,reel.pos.z,.8);log(JSON.stringify(await hud(g)));
await g.key('KeyF',.3);s=await g.snap();log('extended',s.rope.maxLength,'t',s.time.toFixed(1),JSON.stringify(await hud(g)));
await g.shot(`${K}-36-extended`);
await route(g,[[-9,-6],[7.8,-7],[8,-1.4],[11.4,-1.4]]);s=await g.snap();log('at door strain',s.rope.strain.toFixed(2),'len',s.rope.length.toFixed(1),'bends',s.rope.bends.length,JSON.stringify(await hud(g)));
await g.shot(`${K}-37-clean-route-at-door`);
await g.survey();await g.shot(`${K}-38-clean-route-survey`);await g.survey();
await g.key('KeyF',.3);s=await g.snap();log('plugged',s.electrical,'t',s.time.toFixed(1));
// trip-loop test: switch on, then reset WITHOUT unplugging
await route(g,[[12.3,-1.2],[12.3,-3.2]],.4);await g.key('KeyE',.3);s=await g.snap();log('trip1',JSON.stringify(s.strip));
await g.key('KeyE',.3);s=await g.snap();log('reset no unplug',JSON.stringify(s.strip),s.won,JSON.stringify(await hud(g)));
await g.shot(`${K}-39-reset-retrips`);
await g.key('KeyE',.3);s=await g.snap();log('reset again',JSON.stringify(s.strip),s.won);
await g.key('KeyE',.3);s=await g.snap();log('reset again',JSON.stringify(s.strip),s.won,'dmg',s.damage);
// turn the projector off and on? walk away: does the card hint?
log('card',JSON.stringify(await hud(g)));
await route(g,[[12.3,-1.2],[15,-.9]],.4);log('near heater',JSON.stringify(await hud(g)));
await g.key('KeyE',.3);await g.walk(12.4,-1.15,.4);await g.key('KeyE',.3);s=await g.snap();log('final',s.won,'t',s.time.toFixed(1),JSON.stringify(s.strip),'dmg',s.damage,'cost',s.cost);
await g.page.waitForTimeout(4000);await g.shot(`${K}-40-clean-result`);
console.log('errors',JSON.stringify(await g.close()));
