import {launch} from '../cap.mjs';import {toBench} from '../arcade-play/common.mjs';
const P='verify-arcade-play-';const log=(...a)=>console.log(...a);
async function run(w,h,tag){
  const g=await launch('arcade',{fullfx:true,width:w,height:h});await g.advance(.5);
  await toBench(g,log);await g.advance(.5);
  for(const s of [['slot','across'],['pick',220],['slot',0],['power']])await g.act(...s);await g.advance(3.4);
  let s=await g.snap();log(tag,'soakDone',s.station.soakDone,'powered',s.station.powered);
  await g.shot(P+tag+'-passed');
  // Hit test via elementFromPoint of HUD at candidate spots
  const hud=await g.page.evaluate(()=>[...document.querySelectorAll('.station-panel,.objective,.prompt-pill,.bench-chip,.station-toast')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {c:e.className,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),pe:getComputedStyle(e).pointerEvents};}));
  log(tag,'hud',JSON.stringify(hud));
  // careful taps on the right edge only, track power state
  let signed=false;
  const xs=w<500?[389,387,385,383,381,379,377]:[];
  for(const x of xs){for(const y of [470,480,490,500,510]){await g.click(x,y);s=await g.snap();
    if(!s.station.powered){log(tag,'tap',x,y,'turned power OFF');await g.act('power');await g.advance(3.4);}
    if(s.station.index>0){log(tag,'signed by tap at',x,y);signed=true;break;}}if(signed)break;}
  s=await g.snap();log(tag,'index after edge taps',s.station.index);
  log(tag,'errors',JSON.stringify(await g.close()));
}
await run(390,844,'phoneP');
await run(844,390,'phoneL');
