import {launch} from '../cap.mjs';
const txt=g=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText?.replace(/\n+/g,' | '),dots:[...document.querySelectorAll('.objective .dots b')].map(b=>b.className||'-').join(','),prompt:[...document.querySelectorAll('.prompt-pill')].filter(e=>!e.hidden).map(e=>e.innerText.replace(/\n/g,' ')).join(' / '),toast:[...document.querySelectorAll('.station-toast')].filter(e=>!e.hidden).map(e=>e.innerText).join(' / '),panel:document.querySelector('.station-panel:not([hidden])')?.innerText?.replace(/\n+/g,' | ')}));
const g=await launch('qfn',{fullfx:true});
const L=async l=>{const s=await g.snap();const c=s.items.find(i=>i.id==='parts');console.log(l,JSON.stringify({t:+s.time.toFixed(1),p:[+s.player.x.toFixed(2),+s.player.z.toFixed(2)],held:s.held,crate:[+c.pos.x.toFixed(2),+c.pos.y.toFixed(2),+c.pos.z.toFixed(2)],ready:s.station.partsReady,alarmed:s.alarmed,dmg:s.damage,cost:s.cost,dc:s.drawCalls,rope:s.rope.maxLength,atBench:s.atBench}),JSON.stringify(await txt(g)));return s;};
await g.advance(.5);await L('start');await g.shot('verify-qfn-play-01-start');
await g.survey();await L('survey');await g.key('Tab',.8);
// step 2 latch: sit at bench before crate
await g.walk(0,-.5,.4);await g.key('KeyE',.5);await L('bench-no-crate');await g.shot('verify-qfn-play-02-bench-no-crate');
await g.key('KeyE',.5);await L('stood');
// fetch crate, throw from (-2.8,-.5) toward +x
await g.walk(-8.8,2.95,.5);await g.key('KeyE');await L('grabbed');
await g.walk(-3.5,-.5,.5);await g.walk(-2.8,-.5,.3);await L('aim');
await g.key('KeyQ',.1);await g.advance(3);let s=await L('thrown+3s');await g.shot('verify-qfn-play-03-thrown');
await g.advance(3);s=await L('thrown+6s');
// regrab and E-drop facing away
const c=s.items.find(i=>i.id==='parts').pos;
await g.walk(c.x+.9,c.z,.4);await g.key('KeyE');await L('regrab');
await g.walk(-2.4,1.6,.3);await g.walk(-2.4,.3,.25);await L('facing-away');await g.shot('verify-qfn-play-04-facing-away');
await g.key('KeyE',.3);await g.advance(1);s=await L('E-dropped');
// proper delivery
const c2=s.items.find(i=>i.id==='parts').pos;
if(!s.station.partsReady){await g.walk(c2.x,c2.z+.9,.4);await g.key('KeyE');await g.walk(1.3,-.6,.3);await g.key('KeyE',.5);s=await L('proper-drop');}
await g.walk(0,-.5,.4);await L('at-stand');await g.shot('verify-qfn-play-05-at-stand');
await g.key('KeyE',.5);await g.act('rotate','U1');await L('sat+rotateU1');
await g.key('Escape',.5);await L('stood-up');await g.shot('verify-qfn-play-06-stood-toast');
console.log('errors',await g.close());
