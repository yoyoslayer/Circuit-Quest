import {launch} from '../cap.mjs';
const P='verify-playground-teach';
const g=await launch('playground',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText?.replace(/\n/g,' | '),prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace(/\n/g,' ')}));
const log=async(k)=>{const s=await g.snap();console.log(k,JSON.stringify({t:+s.time.toFixed(2),won:s.won,hp:s.holdingPlug,el:s.electrical,sw:s.switchedOn,strain:+s.rope.strain.toFixed(3),dc:s.drawCalls,fps:s.fps,p:[+s.player.x.toFixed(2),+s.player.z.toFixed(2)]}),JSON.stringify(await txt()));return s;};
// clutter inventory: everything resting on the floor at t=0
const au=await g.audit(-0.03);const kinds={};for(const f of au){for(const n of [f.a,f.b]){const k=n.split(' @')[0];if(/^(reel|splitter|coupler|plug)/.test(k)){kinds[n]=1;}}}
console.log('jobish props',Object.keys(kinds));
await g.advance(1);await log('start');
// ---- Run A: switch first, no plug
await g.walk(6.6,-5.9,.4);await log('at-lamp-no-plug');await g.zoom(-1500);await g.shot(`${P}-01-lamp-noplug-prompt`);
await g.key('KeyE',.3);await log('after-E-noplug');await g.shot(`${P}-02-lamp-noplug-afterE`);
await g.zoom(1500);
await g.walk(-7.3,4.7,.5);await log('back-at-reel');
await g.key('KeyF');await log('picked');
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);await log('at-socket');
await g.key('KeyF',.02);await log('plugged-switch-already-on');await g.shot(`${P}-03-switch-first-plug-frame`);
console.log('errors',await g.close());
