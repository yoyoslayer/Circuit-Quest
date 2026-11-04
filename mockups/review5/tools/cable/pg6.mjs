import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('playground',{fullfx:true});
const B=s=>JSON.stringify(s.rope.bends.map(b=>[+b.x.toFixed(2),+b.z.toFixed(2)]));
await g.advance(.5);await g.key('KeyF');
// through crate row: go north of crates then south across them
for(const [x,z] of [[-5,3.2],[-2,3.4],[-1.6,6.6]]){const r=await g.walk(x,z,.4,8);log('->',x,z,r.state.player.x.toFixed(2),r.state.player.z.toFixed(2),r.state.rope.strain.toFixed(3),B(r.state));}
await g.shot('cable-50-pg-cable-vs-crates');
await g.zoom(-1500);await g.orbit(200,60);await g.shot('cable-51-pg-cable-vs-crates-close');
await g.orbit(-600,0);await g.shot('cable-52-pg-cable-vs-crates-close-b');
await g.zoom(1500);await g.orbit(400,-60);
// drop plug here, walk across cable and jump
await g.key('KeyF');
let r=await g.walk(-4.5,6.8,.4,8);
await g.zoom(-700);
await g.page.keyboard.down('KeyW');await g.page.keyboard.press('Space');await g.advance(.25,['KeyW']);await g.page.keyboard.up('KeyW');
let s=await g.snap();log('jump',s.player,s.pose?.airborne);await g.shot('cable-53-pg-jump-over-cable');
await g.advance(1.5);
// idle hint after 35s
s=await g.snap();log('time',s.time);await g.advance(Math.max(0,37-s.time));await g.zoom(700);await g.shot('cable-54-pg-idle-hint');
log(await g.close());
