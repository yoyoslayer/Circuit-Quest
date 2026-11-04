import {launch} from '../cap.mjs';
const P='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
const log=(...a)=>console.log(...a);
const W=async(x,z,r=.5)=>{const res=await g.walk(x,z,r);if(!res.arrived)log('STUCK',x,z,JSON.stringify(res.state.player));return res;};
await g.advance(.5);
await W(-6.4,6.4,.6);await g.key('KeyE',.2);
for(const [x,z] of [[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-8.6,-5.4]])await W(x,z,.4);
await g.advance(1);
await g.shot(`${P}-80-in-store-default`);
await g.orbit(-350,0);await g.shot(`${P}-81-in-store-orbitL`);
await g.orbit(700,0);await g.shot(`${P}-82-in-store-orbitR`);
await g.orbit(-350,0);await g.zoom(-1500);await g.shot(`${P}-83-in-store-zoom9`);
await g.zoom(1500);await g.orbit(0,-200);await g.shot(`${P}-84-in-store-low`);
// pod wedge test: throw pod toward the back-left corner shelves
await g.orbit(0,200);
await g.key('KeyQ',.1);await g.advance(1);let s=await g.snap();log('pod after throw',JSON.stringify(s.items[0].pos));
await g.advance(6);s=await g.snap();log('pod after 6s',JSON.stringify(s.items[0].pos));await g.shot(`${P}-85-pod-thrown-in-store`);
// Restart with R
await g.key('KeyR',.5);await g.advance(1);s=await g.snap();log('after R',JSON.stringify({player:s.player,time:s.time,pod:s.items[0].pos,station:s.station.job,podPad:s.station.podPad}));
await g.shot(`${P}-86-after-restart`);
log('ERR',JSON.stringify(await g.close()));
