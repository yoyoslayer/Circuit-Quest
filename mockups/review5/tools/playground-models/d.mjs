// The clean solve and the slingshot, with close-ups of the cable, the plug in hand, the spool, the lamp lit and the win.
import {launch} from '../cap.mjs';
const K='playground-models';let n=40;const nn=()=>String(n++).padStart(2,'0');
const g=await launch('playground',{fullfx:true});
await g.advance(.5);await g.key('KeyF',.3);
await g.zoom(-2000);await g.shot(`${K}-${nn()}-hold-plug-close`);
await g.orbit(600,0);await g.shot(`${K}-${nn()}-hold-plug-close-side`);await g.orbit(-600,0);await g.zoom(2000);
await g.walk(-5,-1);let s=await g.snap();console.log('leg1',JSON.stringify(s.rope));await g.shot(`${K}-${nn()}-drag-mid`);
await g.walk(-4,-4);await g.walk(5.8,-5.5);s=await g.snap();console.log('leg3',JSON.stringify(s.rope));await g.shot(`${K}-${nn()}-drag-at-socket`);
await g.zoom(-2000);await g.shot(`${K}-${nn()}-drag-at-socket-close`);
await g.key('KeyF',.4);s=await g.snap();console.log('plugged',s.connected,s.electrical,JSON.stringify(s.rope));await g.shot(`${K}-${nn()}-plugged-close`);
await g.zoom(2000);
await g.walk(6.6,-5.9,.4);await g.key('KeyE',.1);await g.advance(.3);await g.shot(`${K}-${nn()}-switched`);
await g.advance(1.5);s=await g.snap();console.log('won',s.won,s.time);await g.shot(`${K}-${nn()}-win-pushin`);
await g.advance(2);await g.shot(`${K}-${nn()}-win-card`);
console.log('errors',JSON.stringify(await g.close()));
// slingshot
const h=await launch('playground',{fullfx:true});await h.advance(.5);await h.key('KeyF',.3);await h.walk(9,3.7);
await h.advance(2.0,['KeyW','ShiftLeft']);s=await h.snap();console.log('taut',JSON.stringify(s.rope));await h.shot(`${K}-${nn()}-overstretch`);
await h.zoom(-1200);await h.shot(`${K}-${nn()}-overstretch-close`);await h.zoom(1200);
await h.key('KeyQ',.05);await h.advance(.25);await h.shot(`${K}-${nn()}-fling`);await h.advance(1.5);s=await h.snap();console.log('after',s.fastestProp,s.pinsDown,s.damage);await h.shot(`${K}-${nn()}-after-fling`);
await h.walk(-6.5,4.2);await h.shot(`${K}-${nn()}-spool-after`);
console.log('errors',JSON.stringify(await h.close()));
