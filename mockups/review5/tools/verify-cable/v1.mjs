import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const prompt=g=>g.page.evaluate(()=>document.querySelector('.prompt-pill')?.textContent);
const en=s=>(Math.max(0,s.rope.length-s.rope.maxLength)**2*60).toFixed(2);
const plug=g=>g.page.evaluate(()=>{const g=window.__circuitCrew;return null;});
for(const mode of ['stand0.3','walkW','sprintNow']){
  const g=await launch('playground',{fullfx:true});
  await g.advance(.5);await g.key('KeyF');
  await g.walk(9,3.7);
  let s=await g.advance(2.5,['KeyW','ShiftLeft']);log(mode,'sprint strain',s.rope.strain.toFixed(4),'E',en(s),'player',s.player.x.toFixed(2),s.player.z.toFixed(2));
  if(mode==='stand0.3'){for(const t of [.1,.2,.3,.6,1.0]){s=await g.advance(.1);} log(mode,'after stand strain',s.rope.strain.toFixed(4),'E',en(s),'prompt',await prompt(g));await g.shot('verify-cable-01-stand-limit-prompt');}
  if(mode==='walkW'){s=await g.advance(1.0,['KeyW']);log(mode,'walk strain',s.rope.strain.toFixed(4),'E',en(s),'prompt',await prompt(g));}
  if(mode==='sprintNow'){log(mode,'prompt',await prompt(g));await g.shot('verify-cable-02-sprint-taut');}
  const before=s.rope.length;
  await g.page.keyboard.press('KeyQ');
  s=await g.advance(1/60);log(mode,'Q fastest',s.fastestProp?.toFixed(2),'len',s.rope.length.toFixed(2),'from',before.toFixed(2));
  if(mode==='sprintNow')await g.shot('verify-cable-03-sling-0s');
  s=await g.advance(.15);log(mode,'+.15 fastest',s.fastestProp?.toFixed(2),'len',s.rope.length.toFixed(2));
  if(mode==='sprintNow')await g.shot('verify-cable-04-sling-0.15s');
  s=await g.advance(1);log(mode,'+1.15 len',s.rope.length.toFixed(2),'damage',s.damage);
  log(await g.close());
}
