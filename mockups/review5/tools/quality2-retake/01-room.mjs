// node 01-room.mjs <room> <NN>: start, survey, win push-in at quality 2, each with a quality-0 twin of the same frame.
import {launch2,q} from './cap2.mjs';
const [room,nn0]=process.argv.slice(2);let nn=+nn0;const K='quality2-retake';
const g=await launch2(room,{fullfx:true},'2');const log=(...a)=>console.log(room,...a);
const setQ=async v=>{await g.page.evaluate(v=>window.__game.view.setQuality(v),v);await g.advance(.02);};
const pair=async(state,settle=0)=>{const n=String(nn++).padStart(2,'0');await setQ(2);if(settle)await g.page.waitForTimeout(settle);
  await g.page.waitForTimeout(1500);const st=await q(g);await g.shot(`${K}-${n}-${room}-${state}`);
  await setQ(0);await g.shot(`${K}-${n}-${room}-${state}-q0`);const s0=await q(g);await setQ(2);log(n,state,'q2',JSON.stringify(st),'q0 draw',s0.draw);};
await g.advance(1);await pair('start');
await g.survey();await pair('survey');await g.survey();
const win=async()=>{await g.page.evaluate(()=>window.__game.win());await g.advance(.05);};
if(room==='playground'){await g.key('KeyF',.1);for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z,.5);await g.key('KeyF',.3);await g.walk(6.6,-5.9,.4);await g.key('KeyE',.1);log('won',(await g.snap()).won);await g.advance(.6);}
else if(room!=='lobby')await win();
if(room!=='lobby'){await pair('win-push',400);log('won',(await g.snap()).won);}
log('errors',JSON.stringify(await g.close()));
