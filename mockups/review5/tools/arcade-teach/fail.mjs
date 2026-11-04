import {launch} from '../cap.mjs';
const K='arcade-teach';
const g=await launch('arcade',{fullfx:true});
const hud=()=>g.page.evaluate(()=>{const t=q=>{const e=document.querySelector(q);return e&&!e.hidden?e.textContent.replace(/\s+/g,' ').trim():null;};return {prompt:t('.prompt-pill'),toast:t('.station-toast')};});
const st=async()=>{const s=(await g.snap()).station;return JSON.stringify({i:s.index,setup:s.setup,pw:s.powered,live:s.live,tr:s.tripped,cool:s.cooling,soak:s.soak,done:s.soakDone,v:s.verdict,mis:s.mistakes,trips:s.trips,spent:s.spent,iL:s.reading&&+(s.reading.iLoad*1000).toFixed(2)});};
const log=async(tag)=>console.log(tag,await st(),JSON.stringify(await hud()));
const A=async(list)=>{for(const [n,a] of list){const r=await g.act(n,a);if(!r?.ok)console.log('ACT FAIL',n,a);}};
const place=(...ps)=>ps.flatMap((p,k)=>p.flatMap(v=>[['pick',v],['slot',k]]));
const route=async(pts,r=.6)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK',x,z);}};
await route([[-5.5,6.6],[-7.2,5.8]]);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await route([[-7.2,5.8],[-5.5,6.4]]);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
// 1) PTC with the fault left on: sample for 8 s
await A([['power']]);let cyc=[];for(let k=0;k<32;k++){await g.advance(.25);const s=(await g.snap()).station;cyc.push(s.tripped?'T':'.');}console.log('PTC 8s trace',cyc.join(''));await log('ptc after 8s');
await A([['power']]);// off
// 2) sweep while live: 470 -> 100 -> 220 quickly
await A([['slot','across'],...place([470]),['power']]);await g.advance(.3);await A([['slot',0],...place([100])]);await g.advance(.3);await log('sweep at 100 after .3s');
await A([['slot',0],...place([220])]);await g.advance(.3);await log('sweep at 220');
// 3) P during play test
await g.advance(1.2);await log('mid playtest');await g.key('KeyP',.2);await log('after pressing P (prompt said Play test)');
// 4) LED pop with 47 on 5 V
await A([['slot',0],...place([47]),['power']]);await g.advance(.4);await g.shot(`${K}-30-led-47-whitehot-0_4s`);await log('47 .4s');
await g.advance(.3);await g.shot(`${K}-31-led-popped`);await log('47 popped');await g.advance(1.3);await log('after spare');
// 5) fix pinball, stand up mid play test to see the kid from the game camera
await A([['slot',0],...place([220]),['power']]);await g.advance(1);await g.key('Escape',.6);await g.shot(`${K}-32-kid-playtest-gamecam`);await log('stood up');
await g.zoom(-1500);await g.walk(-1.6,-.6,.4);await g.advance(.5);await g.shot(`${K}-33-kid-playtest-close`);
await g.advance(3);await log('soak while standing');
await g.walk(0,-1.55,.4);await g.key('KeyE',.6);await log('back at bench');
// run jobs 1-4 quickly
const soak=async()=>{await g.advance(3.3);};
if(!(await g.snap()).station.soakDone)await soak();
await A([['signoff'],['flip'],...place([47],[]),['pick',47],['slot',0],['power']]);await soak();await A([['signoff']]);
await A([['slot',0],...place([470],[470]),['power']]);await soak();await A([['signoff']]);
await A([['slot',0],...place([470],[470]),['power']]);await soak();await A([['signoff']]);await log('at hopper');
// 6) hopper 47: over the pin rating
await A([...place([47]),['power']]);await g.advance(1.5);await g.shot(`${K}-34-hopper-47-overpin`);await log('hopper 47');
// 7) hopper 470x3: under band but motor FULL
await A([['slot',0],...place([470],[470],[470])]);await soak();await g.shot(`${K}-35-hopper-1410-passed-toodim`);await log('hopper 1410');
await g.crop(`${K}-36-crop-hopper-meter`,{x:500,y:140,width:400,height:200});
// 8) hopper 220 single: works but over band
await A([['slot',0],['slot',1],['slot',2],...place([220])]);await soak();await log('hopper 220');
console.log('errors',await g.close());
