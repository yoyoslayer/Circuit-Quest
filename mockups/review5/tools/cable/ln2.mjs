import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('lunch',{fullfx:true});
try{
const route=async (pts,r=.5)=>{let s;for(const [x,z] of pts){const w=await g.walk(x,z,r,40);s=w.state;if(!w.arrived)log('STUCK',x,z,JSON.stringify(s.player));}return s;};
const C=(s,id)=>s.lunch.cables.find(c=>c.id===id);
await g.advance(.5);
// thin-2 from supply A, drag east through corridor into the lift room and past
await g.walk(-10,3.5,.4);await g.key('KeyF');let s=await g.snap();log('held',JSON.stringify(s.lunch.held));
s=await route([[-6,3],[2,3],[10,2.5]],.5);log('at 10,2.5',C(s,'thin-2').strain.toFixed(3));
await g.zoom(-1500);await g.shot('cable-130-ln-thin-corridor-close');await g.zoom(1500);
s=await route([[13,0],[13,-6]],.5);log('at 13,-6',C(s,'thin-2').strain.toFixed(3),JSON.stringify(s.player));
for(let i=0;i<6;i++){s=await g.advance(.4,['KeyS','ShiftLeft']);log('sprint',s.player.x.toFixed(2),s.player.z.toFixed(2),C(s,'thin-2').strain.toFixed(3));}
await g.shot('cable-131-ln-thin-taut');
const before=s.lunch.cablePoints['thin-2'];log('points',JSON.stringify(before));
await g.page.keyboard.press('KeyQ');s=await g.advance(1/60);log('Q fastest',s.fastestProp.toFixed(2));
await g.advance(.25);await g.shot('cable-132-ln-thin-release-0.25s');s=await g.advance(1);log('after fastest',s.fastestProp.toFixed(2),'damage',s.damage);
await g.shot('cable-133-ln-thin-release-after');
// thick cable + dolly through the kitchen door, default camera and orbit (DR-74)
await route([[10,2.5],[2,3],[-9,7.5]],.5);await g.walk(-10,7.5,.4);await g.key('KeyF');s=await g.snap();log('held',JSON.stringify(s.lunch.held));
await g.walk(-3,7,.4);await g.key('KeyE');await g.walk(0,1.4);await g.key('KeyE');await g.advance(.4);
s=await route([[1,2.6],[.2,-1.2]],.45);await g.shot('cable-134-ln-thick-through-door');
await g.orbit(600,0);await g.shot('cable-135-ln-thick-through-door-orbit');await g.orbit(-600,0);
s=await route([[-3.2,-2.8]],.45);await g.shot('cable-136-ln-thick-at-post-dolly');
}finally{log(await g.close());}
