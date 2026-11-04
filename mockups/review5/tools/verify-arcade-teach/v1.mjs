import {launch} from '../cap.mjs';
const K='verify-arcade-teach';
const g=await launch('arcade',{fullfx:true});
const hud=()=>g.page.evaluate(()=>{const t=q=>{const e=document.querySelector(q);return e&&!e.hidden?e.textContent.replace(/\s+/g,' ').trim():null;};return {prompt:t('.prompt-pill'),toast:t('.station-toast'),card:t('.objective')};});
const st=async()=>{const s=(await g.snap()).station;return JSON.stringify({i:s.index,setup:s.setup,pw:s.powered,live:s.live,tr:s.tripped,cool:s.cooling,soak:s.soak,done:s.soakDone,v:s.verdict,mis:s.mistakes,trips:s.trips,spent:s.spent,iL:s.reading&&+(s.reading.iLoad*1000).toFixed(2),hled:+s.heat.led.toFixed(2),hb:s.heat.blocks});};
const log=async(tag)=>console.log(tag,await st(),JSON.stringify(await hud()));
const A=async(list)=>{for(const [n,a] of list){const r=await g.act(n,a);if(!r?.ok)console.log('ACT FAIL',n,a);}};
const place=(...ps)=>ps.flatMap((p,k)=>p.flatMap(v=>[['pick',v],['slot',k]]));
const route=async(pts,r=.6)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK',x,z);}};
await route([[-5.5,6.6],[-7.2,5.8]]);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await route([[-7.2,5.8],[-5.5,6.4]]);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
// move mouse off clickables (top-left corner) so hover does not drive the prompt
await g.page.mouse.move(5,5);await g.advance(.1);
await g.shot(`${K}-01-bench-start`);await log('bench');
// F0/F2: power as found, sample PTC for 6 s
await A([['power']]);let tr='';for(let k=0;k<24;k++){await g.advance(.25);tr+=(await g.snap()).station.tripped?'T':'.';if(k===1)await g.shot(`${K}-02-pinball-tripped`);}
console.log('PTC trace 6s',tr);await log('pinball after 6s powered');
await A([['power']]);await g.advance(2.6);
// F1: human-timed swap: 470 live, then remove and re-place with gaps
await A([['slot','across'],...place([470]),['power']]);await g.advance(1);await log('470 live 1s');
await A([['slot',0]]);await g.advance(.25);await log('removed, empty chain .25s live');
await A([['pick',100]]);await g.advance(.25);await A([['slot',0]]);await g.advance(.3);await log('100 placed');
await g.advance(3);await log('waited for fuse');
// series-first trick: 100 -> 220 without emptying
await A([['pick',220],['slot',1]]);await g.advance(.2);await A([['slot',0]]);await g.advance(.4);await log('220 via trick');
await g.advance(1.2);await log('mid soak');await g.shot(`${K}-03-pinball-soak-benchview`);
await g.key('KeyP',.2);await log('pressed P mid soak');
await A([['power']]);await g.advance(3.4);await log('passed');await g.shot(`${K}-04-pinball-passed`);
// F5/F13/F9 LED pop with 47
await A([['slot',1],...place([47])]);await g.advance(.3);await log('47 .3');await g.shot(`${K}-05-led47-0_3s`);
await g.advance(.3);await log('47 .6');await g.shot(`${K}-06-led47-popped`);
await g.advance(1.5);
await A([['slot',0],...place([220]),['power']]);await g.advance(3.4);await A([['signoff']]);await g.advance(.5);
// rhythm: flip, 47 alone (tier 1 pass)
await A([['flip'],['power']]);await g.advance(3.4);await log('rhythm 47 alone');await g.shot(`${K}-07-rhythm-47-pass`);
await A(place([47]));await g.advance(3.4);await log('rhythm pair');await A([['signoff']]);await g.advance(.5);
// claw as found
await A([['power']]);await g.advance(.7);await log('claw .7');await g.advance(.7);await log('claw 1.4');await g.shot(`${K}-08-claw-1_4s`);
await g.advance(.4);await log('claw 1.8');await g.shot(`${K}-09-claw-1_8s`);
await A([...place([470]),['power']]);await g.advance(1.5);await log('claw single 470');
await A([...place([],[470])]);await g.advance(3.4);await A([['signoff']]);await g.advance(.5);
await A([['slot',0],...place([470],[470]),['power']]);await g.advance(3.4);await A([['signoff']]);await g.advance(.5);
// hopper
await g.shot(`${K}-10-hopper-start`);
await A([...place([470],[470],[470]),['power']]);await g.advance(3.4);await log('hopper 1410');await g.shot(`${K}-11-hopper-1410`);
await g.crop(`${K}-12-hopper-meter-crop`,{x:420,y:100,width:620,height:330});
await A([['power'],['slot',0],['slot',1],['slot',2],...place([47]),['power']]);await g.advance(1.2);await log('hopper 47');await g.shot(`${K}-13-hopper-47`);
// stand up to see the kid while in soak
await A([['power'],['slot',0],...place([470],[470]),['power']]);await g.advance(1);await g.key('Escape',.6);await g.shot(`${K}-14-stood-up-soak`);
console.log('errors',await g.close());
