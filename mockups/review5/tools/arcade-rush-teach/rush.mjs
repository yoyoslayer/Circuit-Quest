import {launch} from '../cap.mjs';
const K='arcade-rush-teach';
const g=await launch('arcade-rush',{fullfx:true});
const hud=()=>g.page.evaluate(()=>{const t=q=>{const e=document.querySelector(q);return e&&!e.hidden?e.textContent.replace(/\s+/g,' ').trim():null;};
  return {card:t('.objective'),prompt:t('.prompt-pill'),toast:t('.station-toast'),panel:t('.station-panel'),clock:t('[data-tally="time"]')||t('#clock')};});
const st=async()=>{const s=(await g.snap());const t=s.time;const x=s.station;return JSON.stringify({t:+t.toFixed(1),i:x.index,job:x.job,setup:x.setup,pw:x.powered,live:x.live,tr:x.tripped,soak:x.soak,done:x.soakDone,v:x.verdict,mis:x.mistakes,trips:x.trips,spent:x.spent,iL:x.reading&&+(x.reading.iLoad*1000).toFixed(2),fix:x.fix});};
const log=async(tag)=>console.log(tag,await st(),JSON.stringify(await hud()));
const A=async(list)=>{for(const [n,a] of list){const r=await g.act(n,a);if(!r?.ok)console.log('ACT FAIL',n,a);}};
const place=(...ps)=>ps.flatMap((p,k)=>p.flatMap(v=>[['pick',v],['slot',k]]));
const clear=async()=>{const s=(await g.snap()).station;const l=[];if(s.setup.across)l.push(['slot','across']);s.setup.chain.forEach((p,i)=>p.forEach(()=>l.push(['slot',i])));if(s.setup.reversed)l.push(['flip']);await A(l);};
const fixIt=async()=>{const s=(await g.snap()).station;await clear();await A(s.fix.flatMap((p,i)=>p.flatMap(v=>[['pick',v],['slot',i]])));};
const route=async(pts,r=.6)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK',x,z);}};
await g.advance(1);await g.shot(`${K}-01-start`);await log('start');
await g.survey();await g.shot(`${K}-02-survey`);await g.page.keyboard.press('Tab');await g.advance(1);
await route([[-5.5,6.6],[-7.2,5.8]]);await g.walk(-8.3,4.4,.3);await g.key('KeyE');await log('grab');
await route([[-7.2,5.8],[-5.5,6.4]]);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);
await g.walk(0,-1.55,.4);await g.key('KeyE',1);await log('bench');await g.shot(`${K}-03-bench-job0-start`);
// job0: White 9V, "Too bright, block smells warm" (47) -> actually trips. Player powers on to look.
await A([['power']]);await g.advance(.3);await g.shot(`${K}-04-job0-hot-story-but-trips`);await log('job0 power .3');
await g.advance(2.9);await log('job0 after 3.2 s');
await A([['power']]);await fixIt();await A([['power']]);await g.advance(1.0);await g.shot(`${K}-05-job0-playtest`);await g.advance(1.3);await log('job0 fixed');await g.shot(`${K}-06-job0-passed`);
await A([['signoff']]);await g.advance(.5);await g.shot(`${K}-07-job1-dim-start`);
// job1 dim (7.1 mA): power as found
await A([['power']]);await g.advance(1.2);await g.shot(`${K}-08-job1-dim-7mA`);await log('job1 dim');
await g.advance(2);await log('job1 dim after 3.2');await g.shot(`${K}-09-job1-dim-tier1-passed`);
await A([['power']]);await fixIt();await A([['power']]);await g.advance(2.3);await log('job1 fixed');await A([['signoff']]);await g.advance(.3);
// job2,3 empty: fix
for(const k of [2,3]){await fixIt();await A([['power']]);await g.advance(2.3);await log(`job${k}`);await A([['signoff']]);await g.advance(.3);}
// job4 Red 5 V, 47 => LED pops
await log('job4 start');await A([['power']]);await g.advance(.4);await log('job4 .4');await g.advance(.25);await g.shot(`${K}-10-job4-led-pops`);await log('job4 .65');
await g.advance(.6);await g.shot(`${K}-11-job4-after-pop`);await log('job4 1.25');
await fixIt();await A([['power']]);await g.advance(2.3);await log('job4 fixed');await A([['signoff']]);await g.advance(.3);
await fixIt();await A([['power']]);await g.advance(2.3);await log('job5');await A([['signoff']]);await g.advance(.3);
// job6 across: power as found
await A([['power']]);await g.advance(.4);await g.shot(`${K}-12-job6-across-trip`);await log('job6 across');
await A([['power']]);await fixIt();await A([['power']]);await g.advance(2.3);await log('job6 fixed');await A([['signoff']]);await g.advance(.3);
await fixIt();await A([['power']]);await g.advance(2.3);await log('job7');await A([['signoff']]);await g.advance(.3);
// job8 backwards: power as found, then just flip
await A([['power']]);await g.advance(.8);await g.shot(`${K}-13-job8-backwards-dark`);await log('job8 dark');
await A([['flip']]);await g.advance(2.3);await g.shot(`${K}-14-job8-flip-only-star`);await log('job8 flipped');await A([['signoff']]);await g.advance(.3);
// job9 brute force: random chains with power on, count mistakes
await A([['power']]);await g.advance(.2);
for(const c of [[[100]],[[470]],[[220]],[[47]],[[220],[47]]]){await clear();await A(place(...c));await g.advance(.8);await log(`job9 try ${JSON.stringify(c)}`);}
await g.advance(2.5);await log('job9 after brute');await A([['signoff']]);await g.advance(.3);
await log('before clock out');
for(let i=0;i<30&&!(await g.snap()).won;i++)await g.advance(10);
await g.advance(2.5);await g.shot(`${K}-15-result`);const s=await g.snap();console.log('won',s.won,'damage',s.damage,'cost',s.cost,'time',s.time);
console.log(await g.page.evaluate(()=>document.querySelector('.result')?.textContent?.replace(/\s+/g,' ')));
console.log('errors',await g.close());
