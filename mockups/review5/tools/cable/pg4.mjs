import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('playground',{fullfx:true});
await g.advance(.5);await g.key('KeyF');
for(const [x,z] of [[0,1],[4.6,1],[4.7,6]]){const r=await g.walk(x,z,.5,8);log('->',x,z,r.arrived,r.state.player.x.toFixed(2),r.state.player.z.toFixed(2),'strain',r.state.rope.strain.toFixed(3),JSON.stringify(r.state.rope.bends.map(b=>[+b.x.toFixed(2),+b.z.toFixed(2)])),'pins',r.state.pinsDown);}
await g.shot('cable-30-pg-pins-wrap-approach');
const pins0=(await g.snap()).items.filter(i=>i.id?.startsWith('pin'));
let s=await g.advance(1.2,['KeyS','ShiftLeft']);log('sprint S',s.player.x.toFixed(2),s.player.z.toFixed(2),'strain',s.rope.strain.toFixed(3),'pins',s.pinsDown,JSON.stringify(s.rope.bends.map(b=>[+b.x.toFixed(2),+b.z.toFixed(2)])));
await g.shot('cable-31-pg-pins-taut');
await g.page.keyboard.press('KeyQ');s=await g.advance(.15);await g.shot('cable-32-pg-pins-release-0.15s');
s=await g.advance(1.5);log('after',s.pinsDown,'damage',s.damage,s.items.filter(i=>i.id?.startsWith('pin')).map((p,i)=>Math.hypot(p.pos.x-pins0[i].pos.x,p.pos.z-pins0[i].pos.z).toFixed(2)).join(','));
await g.shot('cable-33-pg-pins-after');
log(await g.close());
