import {launch,item,d2,fmt} from './lib.mjs';
const K='stuck-softlock';const g=await launch('playground',{fullfx:true});const L=(...a)=>console.log(...a);
try{
await g.advance(.5);await g.key('KeyF');await g.walk(9,3.7);let s=await g.advance(2.5,['KeyW','ShiftLeft']);L('taut strain',s.rope.strain.toFixed(2),'pip',fmt(s.player));
s=await g.advance(3,['KeyD','ShiftLeft']);L('more sprint strain',s.rope.strain.toFixed(2),'pip',fmt(s.player));
await g.shot(`${K}-30-playground-overstretch`);
await g.key('KeyQ',.05);await g.advance(3);s=await g.snap();L('after Q holding',s.holdingPlug,'dmg',s.damage,'pins',s.pinsDown);
await g.shot(`${K}-31-playground-after-slingshot`);
await g.key('KeyF');s=await g.snap();L('F at release spot',s.holdingPlug,'pip',fmt(s.player));
for(const [x,z] of [[8.6,2.5],[8,4.2],[-6,5],[-5,-1],[-4,-4],[5.8,-5.5]]){const o=await g.walk(x,z);if(!o.arrived)L('stall',x,z,fmt(o.state.player));}
s=await g.snap();L('at socket strain',s.rope.strain.toFixed(2),'len',s.rope.length.toFixed(1));await g.key('KeyF');await g.advance(.3);s=await g.snap();L('connected? held',s.holdingPlug);await g.walk(6.6,-5.9,.4);await g.key('KeyE');await g.advance(.5);s=await g.snap();L('won',s.won,'time',s.time.toFixed(0));
await g.advance(1.5);await g.shot(`${K}-32-playground-finished-after-chaos`);
}catch(e){L('ERR',e.message);}
L('errors',JSON.stringify(await g.close()));
