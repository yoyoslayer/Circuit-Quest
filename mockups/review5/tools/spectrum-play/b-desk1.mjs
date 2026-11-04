import {launch} from '../cap.mjs';
const K='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
const ui=async()=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,pill:(()=>{const p=document.querySelector('.prompt-pill');return p&&!p.hidden?p.innerText.replace(/\n/g,' '):null})(),toast:(()=>{const t=document.querySelector('.station-toast');return t&&!t.hidden?t.innerText:null})(),panel:document.querySelector('.station-panel')?.innerText}));
const route=async(pts,r=.5)=>{for(const [x,z] of pts){const w=await g.walk(x,z,r);if(!w.arrived)console.log('STUCK',x,z,JSON.stringify(w.state.player));}};
await g.advance(.5);
const t0=(await g.snap()).time;
await g.walk(-6.4,6.4,.6);await g.key('KeyE');
await route([[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await g.key('KeyE');
let s=await g.snap();console.log('placed',s.station.podPad,(s.time-t0).toFixed(1));
const t1=s.time;
await route([[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);await g.walk(-3.5,3.55,.4);
s=await g.snap();console.log('walk to desk',(s.time-t1).toFixed(1));
console.log('beforeE',JSON.stringify(await ui()));
await g.shot(`${K}-11-at-desk-front`);
await g.key('KeyE');await g.advance(1.2);
s=await g.snap();console.log('atBench',s.atBench);
console.log('bench',JSON.stringify(await ui()));
await g.shot(`${K}-12-bench-view-vis`);
// count words on screen
console.log('words',await g.page.evaluate(()=>document.querySelector('[data-layer="hud"]').innerText.split(/\s+/).filter(Boolean).length));
// press Send with visible (wrong move) via the real Enter key
await g.key('Enter',.3);console.log('send vis',JSON.stringify(await ui()),JSON.stringify((await g.snap()).station.mistakes));
await g.shot(`${K}-13-bench-send-vis-fail`);
await g.advance(.6);
// press 1 for radio
await g.key('Digit1',.3);console.log('radio',JSON.stringify(await ui()));
await g.shot(`${K}-14-bench-radio`);
s=await g.snap();console.log('reading',JSON.stringify(s.station.reading),s.station.power);
await g.key('Enter',.3);s=await g.snap();console.log('send radio',JSON.stringify(await ui()),JSON.stringify(s.station.delivered));
await g.shot(`${K}-15-bench-radio-delivered`);
await g.advance(1);
console.log('after',JSON.stringify(await ui()));
await g.shot(`${K}-16-bench-after-job1`);
// Stand up and look at the room
await g.key('KeyE',.8);console.log('stood',JSON.stringify(await ui()));
await g.shot(`${K}-17-stood-after-job1`);
console.log('time',(await g.snap()).time.toFixed(1));
console.log('errors',JSON.stringify(await g.close()));
