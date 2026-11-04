import {launch} from '../cap.mjs';import {txt,toBench} from './common.mjs';
const P='arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true});await g.advance(.5);
await toBench(g,log);
async function solve(){const s=await g.snap(),x=s.station;const list=[];if(x.setup.across)list.push(['slot','across']);
  x.setup.chain.forEach((p,i)=>p.forEach(()=>list.push(['slot',i])));if(x.setup.reversed)list.push(['flip']);
  x.fix.forEach((p,i)=>p.forEach(v=>list.push(['pick',v],['slot',i])));for(const [n,a] of list)await g.act(n,a);await g.act('power');await g.advance(2.2);}
await solve();
await g.act('signoff');await g.advance(.1);await g.shot(P+'70-signoff-+0.1');await g.advance(.4);await g.shot(P+'71-signoff-+0.5');
for(let k=0;k<11;k++){await solve();await g.act('signoff');await g.advance(.2);}
let s=await g.snap();log('served',s.station.served.length,'t',s.time.toFixed(1));
const glows=await g.page.evaluate(()=>{let n=0,op=0;window.__circuitCrew.root?.traverse?.(o=>{if(o.isSprite){n++;op+=o.material.opacity;}});return {n,op};}).catch(e=>String(e));log('sprites',JSON.stringify(glows));
await g.key('Escape',.3);await g.walk(0,1.5,.5);await g.zoom(-900);await g.orbit(0,0);await g.shot(P+'72-backwall-after-12');
await g.walk(0,-1.55,.4);await g.key('KeyE',.4);await g.key('Space',.25);await g.shot(P+'73-space-jump-at-bench');
log('errors',JSON.stringify(await g.close()));
