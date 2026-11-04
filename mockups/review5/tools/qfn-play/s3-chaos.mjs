import {launch} from '../cap.mjs';import {txt,log} from './common.mjs';
const g=await launch('qfn',{fullfx:true});
const S=async l=>{const s=await g.snap();const c=s.items.find(i=>i.id==='parts');log(l,{t:s.time.toFixed(1),p:[+s.player.x.toFixed(2),+s.player.z.toFixed(2)],held:s.held,crate:[+c.pos.x.toFixed(2),+c.pos.y.toFixed(2),+c.pos.z.toFixed(2)],ready:s.station.partsReady,alarmed:s.alarmed,fast:+s.fastestProp.toFixed(1),dmg:s.damage,cost:s.cost,rope:s.rope.maxLength},await txt(g));return s;};
await g.advance(.3);
// F with no cable in the room
await g.key('KeyF',.3);await S('F pressed at spawn');
// E at the bench with no crate
await g.walk(0,-.5,.4);await g.key('KeyE',.5);await S('bench no crate');await g.shot('qfn-play-40-bench-no-crate');
// click board before parts
const s0=await g.snap();
await g.page.mouse.click(720,400);await g.advance(.2);await S('clicked board no parts');
await g.key('KeyR',.2);await S('R at bench no parts');
await g.key('KeyE',.5);await S('left bench');
// fetch crate, throw it toward the bench from 4m
await g.walk(-8.8,2.95,.5);await g.key('KeyE');
await g.walk(-3.5,-.5,.5);await g.walk(-2.8,-.5,.3);await S('aim');
await g.key('KeyQ',.1);await g.advance(.4);await g.shot('qfn-play-41-crate-thrown-mid');await g.advance(2);let s=await S('after throw');await g.shot('qfn-play-42-crate-thrown-landed');
// is prompt telling player anything about where the crate went? pick it up again
const c=s.items.find(i=>i.id==='parts').pos;
await g.walk(c.x+.9,c.z,.4);await g.key('KeyE');await S('regrab');
// mismatch test: prompt 'Set the crate on the bench' while facing away
await g.walk(-2.4,1.6,.3);await g.walk(-2.4,.3,.25);s=await S('facing away near bench');await g.shot('qfn-play-43-prompt-facing-away');
await g.key('KeyE',.3);await g.advance(1);s=await S('E dropped facing away');await g.shot('qfn-play-44-drop-fail');
// knock things: sprint into the clutter in front of the bench (cabinet stack at .6,1.77)
await g.walk(-1,4,.4);
await g.advance(1.2,['KeyD','KeyW','ShiftLeft']);s=await S('sprint into clutter');await g.shot('qfn-play-45-sprint-clutter');
log('errors',await g.close());
