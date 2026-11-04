import {launch} from '../cap.mjs';import {txt} from './common.mjs';
const P='arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true});await g.advance(.5);
// A player who never fetches the tray and never fixes anything.
for(let i=0;i<19;i++){await g.advance(10);}
let s=await g.snap();log('idle',s.time.toFixed(1),'won',s.won,'served',s.station.served.length,'dmg',s.damage,'cost',s.cost);
await g.page.waitForTimeout(4000);await g.shot(P+'40-idle-result');
log('result',await g.page.evaluate(()=>document.querySelector('.result-screen')?.innerText?.replace(/\n+/g,' | ')));
log('saved best',await g.page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>/circuit/i.test(k))))));
log('errors',JSON.stringify(await g.close()));
