import {launch} from '../cap.mjs';
const K='arcade-teach';
const g=await launch('arcade',{fullfx:true});
const hud=()=>g.page.evaluate(()=>{const t=q=>{const e=document.querySelector(q);return e&&!e.hidden?e.textContent.replace(/\s+/g,' ').trim():null;};
  return {card:t('.objective'),prompt:t('.prompt-pill'),toast:t('.station-toast'),panel:t('.station-panel')};});
const st=async()=>{const s=(await g.snap()).station;return JSON.stringify({i:s.index,job:s.job,setup:s.setup,pw:s.powered,live:s.live,tr:s.tripped,cool:s.cooling,soak:s.soak,done:s.soakDone,v:s.verdict,mis:s.mistakes,trips:s.trips,spent:s.spent,iL:s.reading&&+(s.reading.iLoad*1000).toFixed(2),heat:s.heat});};
const log=async(tag)=>console.log(tag,await st(),JSON.stringify(await hud()));
const A=async(list)=>{for(const [n,a] of list){const r=await g.act(n,a);if(!r?.ok)console.log('ACT FAIL',n,a);}};
const place=(...ps)=>ps.flatMap((p,k)=>p.flatMap(v=>[['pick',v],['slot',k]]));
const route=async(pts,r=.6)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK',x,z);}};
await g.advance(1);await g.shot(`${K}-01-start`);await log('start');
await route([[-5.5,6.6],[-7.2,5.8]]);await g.walk(-8.3,4.4,.3);await g.key('KeyE');await log('grab');
await route([[-7.2,5.8],[-5.5,6.4]]);await g.walk(1.2,-1.3,.5);await g.shot(`${K}-02-tray-at-bench`);await g.key('KeyE',.2);
await g.walk(0,-1.55,.4);await g.key('KeyE',1);await g.shot(`${K}-03-bench-pinball-start`);await log('bench');
// 1 pinball: power as found
await A([['power']]);await g.advance(.3);await g.shot(`${K}-04-pinball-trip`);await log('trip .3');
await g.advance(1.2);await g.shot(`${K}-05-pinball-fuse-cooling`);await log('trip 1.5');
await g.advance(1.5);await log('after 3s still powered (PTC re-try?)');await g.advance(1.5);await log('after 4.5s');
await A([['slot','across'],...place([220])]);await g.advance(2.8);await log('220 after cool');await g.shot(`${K}-06-pinball-playtest`);
await g.advance(2);await log('pinball passed');await g.shot(`${K}-07-pinball-passed`);
await A([['signoff']]);await g.advance(.6);await g.shot(`${K}-08-rhythm-start`);await log('rhythm start');
// 2 rhythm: power as found (reversed)
await A([['power']]);await g.advance(1);await g.shot(`${K}-09-rhythm-dark-backwards`);await log('rhythm reversed');
await A([['flip']]);await g.advance(3.4);await g.shot(`${K}-10-rhythm-47-alone`);await log('rhythm 47 flipped');
await A(place([47]));await g.advance(3.4);await g.shot(`${K}-11-rhythm-parallel`);await log('rhythm 47||47');
await A([['signoff']]);await g.advance(.6);await log('claw start');
// 3 claw: power as found (220 on 12 V)
await A([['power']]);await g.advance(.8);await g.shot(`${K}-12-claw-hot-0_8s`);await log('claw .8');
await g.advance(.6);await g.shot(`${K}-13-claw-hot-1_4s`);await log('claw 1.4');
await g.advance(1);await g.shot(`${K}-14-claw-popped`);await log('claw popped');
await A([...place([470],[470]),['power']]);await g.advance(3.4);await log('claw fixed');await g.shot(`${K}-15-claw-fixed`);
await A([['signoff']]);await g.advance(.6);
// 4 handheld as found
await A([['power']]);await g.advance(1.5);await g.shot(`${K}-16-handheld-overdriven`);await log('handheld start');
await g.zoom(-1500);await g.shot(`${K}-17-handheld-overdriven-close`);await g.zoom(1500);
await A([['slot',0],...place([470],[470])]);await g.advance(3.4);await log('handheld fixed');await g.shot(`${K}-18-handheld-fixed`);
await A([['signoff']]);await g.advance(.6);
// 5 hopper: empty chain power
await A([['power']]);await g.advance(.5);await g.shot(`${K}-19-hopper-empty-trip`);await log('hopper empty');
await g.advance(2.6);await A(place([47]));await g.advance(1.5);await g.shot(`${K}-20-hopper-47-overpin`);await log('hopper 47');
await A([['slot',0],...place([470],[470],[470])]);await g.advance(3.4);await g.shot(`${K}-21-hopper-1410-underband`);await log('hopper 1410');
await A([['slot',2]]);await g.advance(3.4);await log('hopper 940');await A([['signoff']]);await g.advance(2.5);
await g.shot(`${K}-22-result`);await log('end');const s=await g.snap();console.log('won',s.won,'damage',s.damage,'cost',s.cost,'time',s.time);
console.log(await g.page.evaluate(()=>document.querySelector('.result')?.textContent?.replace(/\s+/g,' ')));
console.log('errors',await g.close());
