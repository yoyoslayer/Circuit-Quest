import {launch} from '../cap.mjs';
const P='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
const log=(...a)=>console.log(...a);
const pill=async()=>g.page.evaluate(()=>{const p=document.querySelector('.prompt-pill');return p?(p.hidden?'[hidden]':p.innerText.replace(/\n/g,' ')):'none';});
const toast=async()=>g.page.evaluate(()=>{const p=document.querySelector('.station-toast');return p&&!p.hidden?p.innerText:'-';});
const card=async()=>g.page.evaluate(()=>document.querySelector('.objective .cur')?.innerText);
const pod=async()=>{const s=await g.snap();return s.items.find(i=>i.id==='pod').pos;};
const st=async(tag)=>{const s=await g.snap();const p=await pod();log(tag,'t=',s.time.toFixed(1),'held=',s.held,'pill=',await pill(),'toast=',await toast(),'card=',await card(),'dmg=',s.damage,'alarmed=',s.alarmed,'fastest=',(s.fastestProp||0).toFixed(1),'podPad=',s.station.podPad,'mistakes=',s.station.mistakes,'reading=',JSON.stringify(s.station.reading),'pod=',p.x.toFixed(2),p.y.toFixed(2),p.z.toFixed(2));return s;};
const W=async(x,z,r=.5)=>{const res=await g.walk(x,z,r);if(!res.arrived)log('STUCK',x,z,JSON.stringify(res.state.player));return res;};
await g.advance(.5);
// A. Pod to the WRONG pad (lab) first
await W(-6.4,6.4,.6);await g.key('KeyE',.2);
for(const [x,z] of [[-6.3,3.6],[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.6],[8.4,-5.6]])await W(x,z);
await g.key('KeyE',.2);await st('pod on lab pad for job1');
for(const [x,z] of [[10.2,-4.4],[10.2,-1.8],[4.5,-.6],[-.2,4.2]])await W(x,z);await W(-3.5,3.55,.4);await g.key('KeyE',.2);await g.advance(1);
await st('desk with pod on wrong pad');await g.shot(`${P}-60-bench-pod-wrong-pad`);
await g.act('band','radio');await g.advance(.2);await st('radio wrong pad');
const r=await g.act('send');await g.advance(.3);log('send result',JSON.stringify(r));await st('send wrong pad');await g.shot(`${P}-61-bench-send-wrong-pad`);
// B. Visible-light failure at bench with pod on correct pad: go fix pad
await g.key('KeyE',.3);
for(const [x,z] of [[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.4]])await W(x,z);await W(8.1,-5.35,.3);await g.key('KeyE',.2);
for(const [x,z] of [[10.2,-4.4],[10.2,-1.4],[0,-1.4],[-10.1,-1.4],[-10.1,-4.4],[-9.3,-5.5]])await W(x,z);await g.key('KeyE',.2);await st('pod on store');
for(const [x,z] of [[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]])await W(x,z);await W(-3.5,3.55,.4);await g.key('KeyE',.2);await g.advance(1);
await g.act('band','vis');await g.act('power',100);await g.advance(.2);
await g.act('send');await g.advance(.15);await g.shot(`${P}-62-bench-fail-send-0.15s`);await st('fail send');await g.advance(1);await g.shot(`${P}-63-bench-fail-send-1.2s`);
// Stand up immediately after a failed send to see if the world shows anything
await g.act('send');await g.key('Escape',.1);await st('esc after send');await g.advance(.2);await g.shot(`${P}-64-standup-after-fail`);
const s2=await g.snap();log('paused?',s2.paused,'atBench',s2.atBench);
if(s2.paused){await g.key('Escape',.3);}
await g.advance(.5);await st('after esc');
// C. Knock props: sprint through the front-row clutter
const before=(await g.snap()).damage;
for(const [x,z] of [[-9.5,6.8],[-2.4,7.2],[3,6.6],[-3.2,6.9],[-8.7,7.1]])await W(x,z,.6);
await g.advance(.5);let s=await st('after sprinting into clutter');log('damage delta',s.damage-before);
// D. Throw a box at the toast coworker (3.8,5.7)
await W(.8,5.4,.5);await g.key('KeyE',.2);s=await st('grab near tea');
await W(1.6,5.6,.3);await g.key('KeyQ',.05);await g.advance(.5);s=await st('threw at coworker');await g.shot(`${P}-65-throw-at-coworker`);
log('ERR',JSON.stringify(await g.close()));
