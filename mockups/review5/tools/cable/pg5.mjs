import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('playground',{fullfx:true});
await g.advance(.5);await g.key('KeyF');
const B=s=>JSON.stringify(s.rope.bends.map(b=>[+b.x.toFixed(2),+b.z.toFixed(2)]));
const path=[[-3.2,0.6],[0.4,0.4],[0.5,-3.2],[-3.2,-3.3]];
for(const [x,z] of path){const r=await g.walk(x,z,.4,8);log('->',x,z,r.state.player.x.toFixed(2),r.state.player.z.toFixed(2),'strain',r.state.rope.strain.toFixed(3),'len',r.state.rope.length.toFixed(2),B(r.state));}
await g.shot('cable-40-pg-wrap-pillar');
await g.zoom(-1500);await g.shot('cable-41-pg-wrap-pillar-close');
await g.orbit(-400,0);await g.shot('cable-42-pg-wrap-pillar-close-orbit');
await g.orbit(-400,120);await g.shot('cable-43-pg-wrap-pillar-close-orbit2');
await g.zoom(1500);await g.orbit(800,-120);
// unwrap: retrace
for(const [x,z] of [[0.5,-3.2],[0.4,0.4],[-3.2,0.6],[-6,3]]){const r=await g.walk(x,z,.4,8);log('<-',x,z,r.state.player.x.toFixed(2),r.state.player.z.toFixed(2),'strain',r.state.rope.strain.toFixed(3),'len',r.state.rope.length.toFixed(2),B(r.state));}
await g.shot('cable-44-pg-unwrapped');
// jump over cable test: stand next to cable midpoint and jump across
let s=await g.snap();log('pos',s.player);
await g.key('KeyF');s=await g.snap();log('dropped',s.holdingPlug);
await g.walk(-2,3,.4,8);await g.walk(-3.5,-1,.4,8);s=await g.snap();log('after walking across cable', B(s), s.rope.length.toFixed(2));
await g.zoom(-1500);await g.shot('cable-45-pg-cable-on-floor-close');
await g.orbit(300,150);await g.shot('cable-46-pg-cable-on-floor-low');
log(await g.close());
