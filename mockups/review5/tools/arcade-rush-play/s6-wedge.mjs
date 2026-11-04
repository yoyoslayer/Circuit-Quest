import {launch} from '../cap.mjs';import {txt,toTray} from './common.mjs';
const P='arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true});await g.advance(.5);
const tray=async()=>(await g.snap()).items.find(i=>i.id==='blocks');
await toTray(g,log);await g.key('KeyE',.2);
// Corner behind the counter: carry into the gap between counter and outer wall and drop it there.
let r=await g.walk(-10.5,3.15,.3,15);log('walk corner',r.arrived,JSON.stringify(r.state.player));
for(const k of ['KeyA','KeyW']){await g.advance(.4,[k]);}
await g.key('KeyQ',.1);await g.advance(2);let tr=await tray();log('tray in corner',JSON.stringify(tr.pos));
await g.walk(-8.6,5.4,.4,15);await g.zoom(-1200);await g.shot(P+'56-tray-corner');await g.zoom(1200);
r=await g.walk(tr.pos.x,tr.pos.z,.5,15);log('reach tray',r.arrived,JSON.stringify(r.state.player),JSON.stringify(await txt(g)));
await g.key('KeyE',.2);let s=await g.snap();log('regrab corner',s.held);
// Behind the shelf at z 7.2 (gap to back wall z=8)
r=await g.walk(-9.6,6.5,.3,15);log('at shelf',r.arrived,JSON.stringify(r.state.player));
await g.advance(.5,['KeyS']);s=await g.snap();log('pushed toward shelf',JSON.stringify(s.player));
await g.advance(.2,['KeyS','Space']);await g.key('KeyQ',.05);await g.advance(2.5);tr=await tray();log('tray shelf throw',JSON.stringify(tr.pos));
await g.shot(P+'57-tray-shelf-throw');
await g.advance(10);tr=await tray();log('tray +10s',JSON.stringify(tr.pos));
r=await g.walk(tr.pos.x,tr.pos.z,.5,12);log('reach after shelf',r.arrived,JSON.stringify(r.state.player),JSON.stringify(await txt(g)));
await g.zoom(-1200);await g.shot(P+'58-tray-after-shelf-10s');
log('errors',JSON.stringify(await g.close()));
