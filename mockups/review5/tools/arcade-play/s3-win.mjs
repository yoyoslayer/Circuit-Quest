import {launch} from '../cap.mjs';import {toBench,txt} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.5);
await toBench(g,log);
const A=async(n,a)=>{const r=await g.act(n,a);if(!r.ok)log('act fail',n,a);};
const place=async(...pos)=>{for(const [k,p] of pos.entries())for(const v of p){await A('pick',v);await A('slot',k);}};
// clean, no-mistake-ish run: remove across first, then power
await A('slot','across');await place([220]);await A('power');await g.advance(3.3);await A('signoff');
await A('flip');await place([47]);await A('power');await g.advance(3.3);await A('signoff');
await A('slot',0);await place([470],[470]);await A('power');await g.advance(3.3);await A('signoff');
await A('slot',0);await place([470],[470]);await A('power');await g.advance(3.3);await A('signoff');
// hopper: stand up during the playtest to see the kid from the room camera
await place([470],[470]);await A('power');await g.advance(.6);
await g.key('Escape',.6);await g.zoom(-600);await g.orbit(-250,0);await g.advance(.6);await g.shot(P+'40-kid-playtest-roomcam');
let s=await g.snap();log('soak while standing',s.station.soak,s.station.soakDone,'atBench',s.atBench);
await g.zoom(-800);await g.shot(P+'41-kid-zoom9');
await g.advance(2.5);s=await g.snap();log('soakdone',s.station.soakDone);
await g.shot(P+'42-kid-passed');
await g.orbit(250,0);await g.zoom(600);
await g.walk(0,-1.55,.4);await g.key('KeyE',.5);
log('before signoff',JSON.stringify(await txt(g)));
await g.key('Enter',.05);s=await g.snap();log('won',s.won,'t',s.time.toFixed(1),'dmg',s.damage,'cost',s.cost,JSON.stringify(s.station.served),'mis',s.station.mistakes);
await g.page.waitForTimeout(300);await g.shot(P+'43-win-0s');
for(let i=0;i<6;i++){await g.page.waitForTimeout(400);}
await g.shot(P+'44-win-2.5s');
await g.page.waitForTimeout(2500);await g.shot(P+'45-win-result');
log('result',await g.page.evaluate(()=>[...document.querySelectorAll('[class*=result]')].map(e=>e.className+': '+e.innerText.replace(/\n+/g,' | ')).slice(0,4).join('\n')));
log('errors',JSON.stringify(await g.close()));
