import {launch} from '../cap.mjs';import {txt,toBench,solveKeys} from './common.mjs';
const P='arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true});await g.advance(.5);
await toBench(g,log);
let n=0;
for(;;){
  let s=await g.snap();if(s.won||!s.station.job)break;
  const t0=s.time;const job=s.station.job,setup=JSON.stringify(s.station.setup),fix=JSON.stringify(s.station.fix);
  const t=await txt(g);
  if(n<3||n===6)await g.shot(P+`1${n}-cab${n}-start`);
  await g.advance(2); // think time a player needs to read the ask
  const keys=await solveKeys(g,s);
  await g.key('KeyP',.1);
  if(n===0){await g.advance(1);await g.shot(P+'20-cab0-playtest');log('mid',JSON.stringify(await txt(g)));}
  for(let i=0;i<40;i++){s=await g.snap();if(s.station.soakDone||s.won)break;await g.advance(.25);}
  if(s.won)break;
  if(n===0){await g.shot(P+'21-cab0-passed');log('passed',JSON.stringify(await txt(g)));}
  await g.key('Enter',.3);s=await g.snap();
  if(n===0){await g.shot(P+'22-cab0-signed');}
  log(`cab${n}`,job,'ask',t.panel?.split(' | ')[1],'start',setup,'fix',fix,'keys',keys.length,'took',(s.time-t0).toFixed(1),'served',s.station.served.length,'tier',s.station.served.at(-1)?.tier,'spent',s.station.spent,'mist',s.station.mistakes,'cost',s.cost,'t',s.time.toFixed(1));
  n++;
  if(n===7){await g.key('Escape',.3);await g.survey();await g.shot(P+'23-after7-survey');await g.survey();await g.zoom(-600);await g.orbit(0,0);await g.shot(P+'24-after7-backwall');await g.zoom(600);await g.walk(0,-1.55,.3);await g.key('KeyE',.5);}
}
let s=await g.snap();log('end',s.won,s.time.toFixed(1),'served',s.station.served.length,'dmg',s.damage,'cost',s.cost);
await g.advance(.3);await g.shot(P+'25-win-pushin');
await g.advance(2.5);await g.page.waitForTimeout(2500);await g.shot(P+'26-result');
log('result',await g.page.evaluate(()=>document.querySelector('.result-screen')?.innerText?.replace(/\n+/g,' | ')));
log('errors',JSON.stringify(await g.close()));
