import {start,K} from './common.mjs';
const {g,log,A,place,clear,power,fixIt,finish,toBench}=await start();
await toBench();await log('bench');
// job0 quick clean fix (no power first)
await fixIt();await power(true);await g.advance(.5);await log('job0 on');await finish();
// job1 dim as found: watch
await power(true);await g.advance(1.5);await g.shot(`${K}-20-job1-dim-7mA-as-found`);await log('job1 as found');
await g.zoom(-1500);await g.shot(`${K}-21-job1-dim-close`);await g.zoom(1500);
await finish();await log('job1 signed off as found (tier1 Works)');
await power(false);
// job2/3 empty
for(const k of [2,3]){await fixIt();await power(true);await finish();}
// job4 Red 5 V 47 → LED pop
await log('job4 start');await power(true);await g.advance(.3);await g.shot(`${K}-22-job4-overdriven-0_3s`);await log('job4 .3');
await g.advance(.35);await log('job4 .65');await g.shot(`${K}-23-job4-led-popped-toast`);
await g.advance(1.3);await log('job4 2.0');await g.shot(`${K}-24-job4-spare-in`);
await fixIt();await power(true);await finish();await log('job4 done');
await fixIt();await power(true);await finish();await log('job5 done');
// job6 across: power as found then remove across and keep power on: watch fuse cooling lock
await power(true);await g.advance(.4);await g.shot(`${K}-25-job6-across-trip`);await log('job6 trip');
await A([['slot','across']]);await A(place([100],[220]));await log('job6 fixed while cooling');await g.advance(1);await g.shot(`${K}-26-job6-fixed-but-fuse-cooling`);await log('job6 +1');
await finish();await log('job6 done');
await fixIt();await power(true);await finish();await log('job7 done');
// job8 backwards: power as found, flip
await power(true);await g.advance(1);await g.shot(`${K}-27-job8-backwards-dark`);await log('job8 dark');
await A([['flip']]);await g.advance(1);await log('job8 flipped');await finish();await g.shot(`${K}-28-job8-flip-only-elegant`);await log('job8 done');
// job9: White 5 V 8–16 mA: brute force with power on, hill climb
await power(true);
for(const c of [[[47]],[[100]],[[220]],[[470]],[[220],[47]],[[100],[100]]]){await clear();await A(place(...c));await g.advance(.7);await log(`job9 try ${JSON.stringify(c)}`);}
await g.shot(`${K}-29-job9-after-brute`);
await clear();await fixIt();await finish();await log('job9 done');
// job10 dim green 9V: do the tier-2 thing: 470+100
await power(false);await clear();await A(place([220],[100]));await power(true);await g.advance(.6);await log('job10 220+100');await finish();await log('job10 signed (tier?)');
// loop the rest until 8s left: fix cleanly
for(let i=0;i<30;i++){const s=await g.snap();if(s.time>165||s.won)break;await power(false);await fixIt();await power(true);await finish();}
await log('near end');
await power(false);await clear();await A(place([220]));await g.shot(`${K}-30-near-clock-out-midjob`);await log('midjob');
for(let i=0;i<30&&!(await g.snap()).won;i++)await g.advance(1);
await g.advance(2.5);await g.shot(`${K}-31-result-full-run`);const s=await g.snap();console.log('won',s.won,'damage',s.damage,'cost',s.cost,'served',s.station.served.map(x=>x.tier).join(''));
console.log(await g.page.evaluate(()=>document.querySelector('.result')?.textContent?.replace(/\s+/g,' ')));
console.log('errors',await g.close());
