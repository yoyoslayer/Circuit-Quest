import {launch} from '../cap.mjs';
const K='verify-arcade-teach';
const g=await launch('arcade',{fullfx:true});
const hud=()=>g.page.evaluate(()=>{const t=q=>{const e=document.querySelector(q);return e&&!e.hidden?e.textContent.replace(/\s+/g,' ').trim():null;};return {prompt:t('.prompt-pill'),toast:t('.station-toast')};});
const st=async()=>{const s=(await g.snap()).station;return JSON.stringify({i:s.index,setup:s.setup,pw:s.powered,done:s.soakDone,mis:s.mistakes,trips:s.trips,iL:s.reading&&+(s.reading.iLoad*1000).toFixed(2),hled:+s.heat.led.toFixed(2),hb:s.heat.blocks});};
const log=async(tag)=>console.log(tag,await st(),JSON.stringify(await hud()));
const A=async(list)=>{for(const [n,a] of list){const r=await g.act(n,a);if(!r?.ok)console.log('ACT FAIL',n,a);}};
const place=(...ps)=>ps.flatMap((p,k)=>p.flatMap(v=>[['pick',v],['slot',k]]));
const route=async(pts,r=.6)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK',x,z);}};
await route([[-5.5,6.6],[-7.2,5.8]]);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await route([[-7.2,5.8],[-5.5,6.4]]);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
await g.page.mouse.move(5,5);await g.advance(.1);
await g.crop(`${K}-15-crop-led-unlit-red`,{x:740,y:430,width:200,height:150});
// LED pop from cold: 47 on pinball
await A([['slot','across'],...place([47]),['power']]);
for(const t of [.3,.5]){await g.advance(t===.3?.3:.2);await log('47 cold '+t);}
await g.shot(`${K}-16-led47-cold-0_5s`);await g.advance(.15);await log('47 cold .65');
await g.advance(1.5);await A([['slot',0],...place([220]),['power']]);await g.advance(3.4);
// hover the LED with the mouse, then sign off by key and go on
await g.page.mouse.move(828,505);await g.advance(.1);await log('hover led, soak done');
await g.key('Enter',.3);await log('after enter');
await A([['flip'],...place([47]),['power']]);await g.advance(3.4);await log('rhythm done (mouse still on LED)');
await A([['signoff']]);await A([['power']]);await g.advance(2);await A([...place([470],[470]),['power']]);await g.advance(3.4);await A([['signoff']]);
await A([['slot',0],...place([470],[470]),['power']]);await g.advance(3.4);await A([['signoff']]);await g.advance(.3);
await log('hopper start, mouse unmoved');await g.shot(`${K}-17-hopper-stale-hover`);
await g.page.mouse.move(830,508);await g.advance(.1);await log('hopper after mouse move');
// hopper 47 left on: does the block pop?
await A([...place([47]),['power']]);await g.advance(2.6);await log('hopper 47 2.6s');
console.log('errors',await g.close());
