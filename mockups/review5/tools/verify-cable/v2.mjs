import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
for(let run=0;run<2;run++){
const g=await launch('meeting',{fullfx:run===0});
try{
const route=async (pts,r=.5)=>{let s;for(const [x,z] of pts){const w=await g.walk(x,z,r,40);s=w.state;if(!w.arrived)log('STUCK',x,z);}return s;};
const pr=()=>g.page.evaluate(()=>document.querySelector('.prompt-pill')?.textContent);
const d=s=>Math.hypot(s.player.x-12.3,s.player.z+2.25).toFixed(3);
await g.advance(.5);
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE');await g.advance(.2);
await route([[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');
await route([[-8,-5],[-1,-1.5],[6,-1.2]]);
let s=await g.advance(2,['KeyD']);log(run,'walk limit dist',d(s),'strain',s.rope.strain.toFixed(3),'prompt',await pr());
if(run===0)await g.shot('verify-cable-05-mt-walk-limit');
s=await g.advance(1);log(run,'stood 1s dist',d(s),'strain',s.rope.strain.toFixed(4),'prompt',await pr());
if(run===0)await g.shot('verify-cable-06-mt-walk-limit-stood');
await g.page.keyboard.press('KeyF');s=await g.advance(.3);log(run,'after F holding',s.holdingPlug,'connected?',s.electrical);
}finally{log(await g.close());}}
