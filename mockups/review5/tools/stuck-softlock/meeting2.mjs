import {launch,item,d2,face,grab,retrieve,fmt} from './lib.mjs';
const K='stuck-softlock';const g=await launch('meeting',{fullfx:true});const L=(...a)=>console.log(...a);
const route=async(pts,r=.5)=>{for(const [x,z] of pts){const o=await g.walk(x,z,r);if(!o.arrived)L('  stalled toward',x,z,'at',fmt(o.state.player));}};
try{
await g.advance(.5);let s=await g.snap();const home=item(s,'strip').pos;
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');
await g.walk(-13.5,-1.66,.25,15);await g.walk(-13.5,-3.46,.15,10);await g.key('Space',.36);await g.key('KeyQ',.02);
await g.advance(1.2);s=await g.snap();L('landed',fmt(item(s,'strip').pos));await g.shot(`${K}-13-meeting-strip-on-racks`);
let t=0;for(;t<8;t+=.1){await g.advance(.1);s=await g.snap();if(d2(item(s,'strip').pos,home)<.2)break;}
L('respawned after',(1.2+t).toFixed(1),'s at',fmt(item(s,'strip').pos));
await g.advance(.05);await g.page.screenshot({path:`mockups/review5/shots/${K}-14-meeting-strip-respawn-puff.png`});
await g.advance(.25);await g.page.screenshot({path:`mockups/review5/shots/${K}-15-meeting-strip-respawn-puff-0.3s.png`});
// (c) place strip, then overstretch the server cable at a sprint and let go
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');s=await g.snap();L('held',s.held);
await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE');await g.advance(.2);s=await g.snap();L('stripPlaced',s.stripPlaced);
await route([[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');s=await g.snap();L('holdingPlug',s.holdingPlug);
await route([[-8,-5],[-1,-1.5]]);
s=await g.advance(4,['KeyD','ShiftLeft']);L('sprint: strain',s.rope.strain.toFixed(2),'len',s.rope.length.toFixed(1),'/',s.rope.maxLength,'pip',fmt(s.player),'fastest',s.fastestProp.toFixed(1));
await g.shot(`${K}-16-meeting-overstretch-sprint`);
await g.key('KeyQ',.05);await g.advance(2);s=await g.snap();L('after Q: holding',s.holdingPlug,'dmg',s.damage,'pip',fmt(s.player));
await g.shot(`${K}-17-meeting-after-slingshot`);
// can the plug be picked up again?
await g.key('KeyF');s=await g.snap();L('F again holding',s.holdingPlug);
if(!s.holdingPlug){for(const dx of [-1,-2,-3,-4]){await g.walk(s.player.x+dx,s.player.z,.4,8);await g.key('KeyF');s=await g.snap();if(s.holdingPlug)break;}L('re-grab plug',s.holdingPlug);}
if(s.holdingPlug){await g.key('KeyQ',.05);}
// finish by the coffee-reel route (spec 'sneaky')
await route([[-8,-1.4],[-10,3.5]]);await g.walk(-12,4.5,.4);await g.key('KeyE');s=await g.snap();L('coffee plug',s.holdingPlug);
await route([[-9,5.3],[6.9,5.3],[8,-1.3],[11.4,-1.4]]);await g.key('KeyF');
await route([[12.3,-1.2],[12.3,-3.2]],.4);await g.key('KeyE');await g.advance(.3);s=await g.snap();L('tripped',s.strip.tripped);
await route([[12.3,-1.2],[14.3,-.9]],.4);await g.key('KeyE');await g.advance(.2);await g.walk(12.4,-1.15,.4);await g.key('KeyE');await g.advance(.3);
s=await g.snap();L('won',s.won,'time',s.time.toFixed(0),'dmg',s.damage);await g.advance(2);await g.shot(`${K}-18-meeting-finished-after-chaos`);
}catch(e){L('ERR',e.message);}
L('errors',JSON.stringify(await g.close()));
