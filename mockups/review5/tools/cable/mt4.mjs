import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('meeting',{fullfx:true});
try{
const route=async (pts,r=.5)=>{let s;for(const [x,z] of pts){const w=await g.walk(x,z,r,40);s=w.state;if(!w.arrived)log('STUCK',x,z);}return s;};
const card=()=>g.page.evaluate(()=>document.body.innerText.split('\n').filter(t=>/projector|server-room|Plug|slingshot|Drop/.test(t)).join(' | '));
await g.advance(.5);
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE');await g.advance(.2);
await route([[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');
await route([[-8,-5],[-1,-1.5],[6,-1.2]]);
let s=await g.advance(2,['KeyD']);log('spec walk limit',s.player.x.toFixed(2),s.player.z.toFixed(2),'strain',s.rope.strain.toFixed(3),'dist',Math.hypot(s.player.x-12.3,s.player.z+2.25).toFixed(2),await card());
s=await g.advance(1);log('stood 1s',s.player.x.toFixed(2),'strain',s.rope.strain.toFixed(3),'dist',Math.hypot(s.player.x-12.3,s.player.z+2.25).toFixed(2),await card());
await g.shot('cable-113-mt-walk-limit-standing');
await g.key('KeyF',.3);s=await g.snap();log('after F (no sprint): holding',s.holdingPlug,'len',s.rope.length.toFixed(2),'strain',s.rope.strain.toFixed(3),await card());
await g.zoom(-1500);await g.orbit(-300,30);await g.shot('cable-114-mt-glass-corner-close');
await g.orbit(500,0);await g.shot('cable-115-mt-glass-corner-close-b');
}finally{log(await g.close());}
