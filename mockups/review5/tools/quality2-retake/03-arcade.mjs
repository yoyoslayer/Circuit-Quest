// Arcade: claw heat (LED halo over the monitor) and back-wall light-up glow at quality 2 with q0 twins.
import {launch2,q} from './cap2.mjs';import {toBench} from '../arcade-play/common.mjs';
const K='quality2-retake';let nn=60;
const g=await launch2('arcade',{fullfx:true},'2');
const setQ=async v=>{await g.page.evaluate(v=>window.__game.view.setQuality(v),v);await g.page.evaluate(()=>window.__game.render(0));};
const pair=async(state)=>{const n=String(nn++).padStart(2,'0');await setQ(2);await g.page.waitForTimeout(600);await g.shot(`${K}-${n}-arcade-${state}`);await setQ(0);await g.shot(`${K}-${n}-arcade-${state}-q0`);await setQ(2);console.log(n,state,JSON.stringify(await q(g)));};
await g.advance(.5);await toBench(g,console.log);
await g.key('KeyP',.3);await pair('pinball-trip');await g.advance(1);
await g.key('KeyX',.1);await g.key('Digit3',.1);await g.key('KeyA',.1);await g.advance(2.6);await g.advance(3.3);await g.key('Enter',.3);await g.advance(1);
await g.key('KeyF',.1);await g.key('Digit1',.1);await g.key('KeyA',.1);await g.key('KeyP',.1);await g.advance(3.5);await g.key('Enter',.3);await g.advance(.5);
await g.key('KeyP',.1);await g.advance(1.2);await pair('claw-heating');
await g.advance(1.2);await pair('claw-popped');
await g.key('Digit4',.1);await g.key('KeyA',.1);await g.key('Digit4',.1);await g.key('KeyS',.1);await g.key('KeyP',.1);await g.advance(3.4);await g.key('Enter',.3);
// stand up and look at the lit back wall from the room camera
await g.key('Escape',.5);await g.advance(1);await pair('room-two-lit');
console.log('errors',JSON.stringify(await g.close()));
