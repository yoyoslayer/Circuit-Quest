import {start} from '../arcade-rush-teach/common.mjs';
const K='verify-arcade-rush-teach';
const {g,log,A,power,fixIt,finish,toBench,hud}=await start();
await g.advance(.2);await log('t0');await g.shot(`${K}-01-start-clock`);
await toBench();await log('at bench');
// job0 as found: white 9V with 47 -> power on
await power(true);await g.advance(.3);await log('job0 power .3');
await g.advance(2.9);await log('job0 after 3.2 s powered');
// fix while powered: does fuse keep us waiting?
await fixIt();await g.advance(.1);await log('job0 fixed while tripped');await g.shot(`${K}-02-job0-fixed-still-cooling`);
await finish();await log('job0 signed');
// job1 dim 12V red 7 mA: as found, mouse over pad D
await g.page.mouse.move(742,478);await g.advance(.1);
await power(true);for(let i=0;i<12;i++){await g.advance(.25);}
await log('job1 as found soak');await g.shot(`${K}-03-job1-soakdone-hover-D`);
await g.page.mouse.move(1300,700);await g.advance(.1);await log('job1 mouse moved away');
await A([['signoff']]);await g.advance(.2);await log('job1 signed as found');
// orbit at bench to look for the cabinet/kid
await g.orbit(-400,0,1);await g.shot(`${K}-04-bench-orbit-left`);
await g.zoom(600,1);await g.shot(`${K}-05-bench-zoom-out`);
console.log('errors',await g.close());
