import {launch} from '../cap.mjs';
const P='recheck-list-';const log=(...a)=>console.log(...a);
const g=await launch('meeting',{fullfx:true});
try{
await g.advance(.5);
// (1) bookshelf at (9,3) rot pi/2 : walk next to it, zoom 9
let r=await g.walk(8.5,4.6,.5);log('walk shelf',r.arrived,r.state.player);
await g.zoom(-1500);await g.shot(P+'01-bookshelf-meeting-z9');
await g.orbit(-350,0);await g.shot(P+'01b-bookshelf-meeting-z9-orbit');
await g.orbit(350,0);await g.zoom(1500);
// (6) window shafts at back wall
r=await g.walk(-3,-1.4,.5);r=await g.walk(-2,-8.6,.5);log('walk back',r.arrived,r.state.player);
await g.shot(P+'06-meeting-shaft-gamecam');await g.zoom(-1500);await g.shot(P+'06b-meeting-shaft-z9');await g.orbit(0,200);await g.shot(P+'06c-meeting-shaft-z9-low');
await g.orbit(0,-200);await g.zoom(1500);
// (4) QA5 closet walls at low orbit
r=await g.walk(-11.2,-4.6,.4);r=await g.walk(-11.3,-7.6,.4);log('walk closet',r.arrived,r.state.player);
await g.zoom(-1500);await g.orbit(0,200);await g.shot(P+'04-meeting-closet-low-o0');
for(const [i,dx] of [[1,-250],[2,-250],[3,-250]]){await g.orbit(dx,0);await g.advance(.3);await g.shot(P+`04${'bcd'[i-1]}-meeting-closet-low-o${i}`);}
await g.orbit(750,-200);await g.zoom(1500);
// (8) M10 strip snap at ~2.4 m
r=await g.walk(-8,-1.4,.5);r=await g.walk(-8.6,-3.9,.4);await g.key('KeyE');let s=await g.snap();log('held',s.held);
r=await g.walk(-8,-1.4,.5);r=await g.walk(6,-1.2,.5);r=await g.walk(10.0,-1.65,.3);s=r.state;
const d=Math.hypot(s.player.x-12.3,s.player.z+2.25);log('pip dist to target',d.toFixed(2),s.player);
await g.shot(P+'08a-strip-before-drop-2p4m');
await g.key('KeyE',.3);s=await g.snap();log('stripPlaced',s.stripPlaced,'held',s.held);
await g.shot(P+'08b-strip-after-drop-2p4m');
}catch(e){log('ERR',e.message);}
log('errors',JSON.stringify(await g.close()));
