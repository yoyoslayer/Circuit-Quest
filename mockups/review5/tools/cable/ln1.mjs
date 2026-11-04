import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('lunch',{fullfx:true});
const route=async (pts,r=.5)=>{let s;for(const [x,z] of pts){const w=await g.walk(x,z,r,40);s=w.state;if(!w.arrived)log('STUCK',x,z,JSON.stringify(s.player));}return s;};
const C=(s,id)=>s.lunch.cables.find(c=>c.id===id);
await g.advance(1);await g.shot('cable-80-ln-start');
await g.walk(-3,7,.4);await g.key('KeyE');await g.walk(0,1.4);await g.key('KeyE');await g.advance(.5);
await g.walk(2,8,.4);await g.key('KeyE');await g.walk(.3,2,.45);await g.advance(4);await g.walk(2,2);await g.key('KeyE');
await g.walk(-10,7.5,.3);await g.zoom(-1200);await g.shot('cable-81-ln-power-room-close');await g.zoom(1200);
await g.key('KeyF');let s=await g.snap();log('held',s.lunch.held);
s=await route([[1,3]],.45);log('thick at 1,3',C(s,'thick').strain.toFixed(3));await g.shot('cable-82-ln-thick-drag');
await g.zoom(-1200);await g.shot('cable-83-ln-thick-drag-close');await g.orbit(500,0);await g.shot('cable-84-ln-thick-drag-close-orbit');await g.zoom(1200);await g.orbit(-500,0);
s=await route([[.2,-1.2],[-3.5,-3]],.45);log('thick at post',C(s,'thick').strain.toFixed(3));await g.key('KeyF');await g.advance(.5);
s=await g.snap();log('lit',s.lunch.lit,'oven',s.lunch.loads.find(l=>l.id==='oven').state);await g.shot('cable-85-ln-thick-plugged');
await g.zoom(-1200);await g.shot('cable-86-ln-thick-plugged-close');await g.zoom(1200);
// thin-1 from A
await route([[.3,-1.3],[.3,2.4]]);await g.walk(-10.8,2,.4);await g.key('KeyF');s=await g.snap();log('held',s.lunch.held);
s=await route([[.3,2.4]]);log('thin at .3,2.4',C(s,'thin-1').strain.toFixed(3));await g.shot('cable-87-ln-thin-drag');
await g.zoom(-1200);await g.shot('cable-88-ln-thin-drag-close');await g.zoom(1200);
// overstretch: sprint east along corridor
s=await route([[6,3]],.5);log('thin at 6,3',C(s,'thin-1').strain.toFixed(3),s.lunch.held);
for(let i=0;i<4;i++){s=await g.advance(.5,['KeyD','ShiftLeft']);log('sprint',s.player.x.toFixed(2),s.player.z.toFixed(2),'strain',C(s,'thin-1').strain.toFixed(3),'held',JSON.stringify(s.lunch.held));}
await g.shot('cable-89-ln-thin-overstretch');
const p0=s.items.map(i=>i.pos);
await g.page.keyboard.press('KeyQ');s=await g.advance(1/60);log('fastest after Q',s.fastestProp.toFixed(2),'held',s.lunch.held);
await g.shot('cable-90-ln-thin-release');s=await g.advance(1);log('fastest 1s',s.fastestProp.toFixed(2),'dmg',s.damage);
log(await g.close());
