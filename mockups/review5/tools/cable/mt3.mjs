import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('meeting',{fullfx:true});
try{
const route=async (pts,r=.5)=>{let s;for(const [x,z] of pts){const w=await g.walk(x,z,r,40);s=w.state;if(!w.arrived)log('STUCK',x,z);}return s;};
const card=()=>g.page.evaluate(()=>document.body.innerText.split('\n').filter(t=>/projector|server-room|Plug|slingshot|Drop/.test(t)).join(' | '));
await g.advance(.5);
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE');await g.advance(.2);
await route([[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');
// pure WALK (no Shift) along the spec route
for(const [x,z] of [[-8,-5],[-1,-1.5],[6,-1.2]]){for(let i=0;i<40;i++){const s=await g.snap();const dx=x-s.player.x,dz=z-s.player.z;if(Math.hypot(dx,dz)<.6)break;
  const keys=[];if(dx>.3)keys.push('KeyD');if(dx<-.3)keys.push('KeyA');if(dz>.3)keys.push('KeyS');if(dz<-.3)keys.push('KeyW');await g.advance(.25,keys);}}
let s=await g.advance(2.5,['KeyD']);log('walk-only limit',s.player.x.toFixed(2),s.player.z.toFixed(2),'strain',s.rope.strain.toFixed(3),'dist to socket',Math.hypot(s.player.x-12.3,s.player.z+2.25).toFixed(2),await card());
await g.shot('cable-110-mt-walk-only-plug-prompt');
await g.key('KeyF',.3);s=await g.snap();log('after F: holding',s.holdingPlug,'len',s.rope.length.toFixed(2),'strain',s.rope.strain.toFixed(3),await card());
await g.shot('cable-111-mt-walk-only-plugged');
await g.zoom(-1500);await g.orbit(-350,40);await g.shot('cable-112-mt-glass-corner-clip');
}finally{log(await g.close());}
