import {launch} from '../cap.mjs';
const levels=(process.argv[2]??'lobby,playground,meeting,lunch,arcade,arcade-rush,garage,qfn,observatory,spectrum').split(',');
const out={};
for(const lv of levels){
  const t0=Date.now();let g;
  try{g=await launch(lv,{fullfx:true});}catch(e){out[lv]={launchError:String(e)};continue;}
  const ready=Date.now()-t0;
  await g.advance(1);
  const s0=await g.snap();
  await g.survey();await g.key('Tab');
  // 20 s scripted walk: W, D, S, A with sprint, plus E/F/Q/Space presses
  for(const k of ['KeyW','KeyD','KeyS','KeyA']){await g.advance(4,[k,'ShiftLeft']);await g.key('KeyE');await g.key('KeyQ');await g.key('Space');await g.key('KeyF');}
  await g.advance(2,['KeyW']);
  const s1=await g.snap();
  const audit=await g.audit(.02).catch(e=>'audit err '+e);
  const errs=await g.close();
  out[lv]={readyMs:ready,time:s1.time,player:s1.player,fps:s1.fps,drawCalls0:s0.drawCalls,drawCalls1:s1.drawCalls,auditCount:Array.isArray(audit)?audit.length:(audit?.overlaps?.length??audit),errors:errs};
  console.log(lv,JSON.stringify(out[lv]));
}
