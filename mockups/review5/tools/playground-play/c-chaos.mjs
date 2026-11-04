// playground-play C: chaos — the spec slingshot, overstretch colours, bowling the pins by hand and by throw.
import {launch} from '../cap.mjs';
import {hud,props,brief} from './lib.mjs';
const K='playground-play';
const log=async(g,tag)=>{const s=await g.snap();console.log(tag,JSON.stringify(brief(s)),JSON.stringify(await hud(g)));return s;};
{ // 1. the spec slingshot
  const g=await launch('playground',{fullfx:true});await g.advance(.3);
  const ps=await props(g);console.log('ALL',JSON.stringify(ps.map(p=>[p.kind,p.x,p.z,p.y,p.id??''])));
  await g.key('KeyF',.1);await g.walk(9,3.7);await log(g,'at 9,3.7');await g.shot(`${K}-20-sling-walked`);
  await g.advance(1.2,['KeyW','ShiftLeft']);await log(g,'sprint 1.2');await g.shot(`${K}-21-sling-taut`);
  await g.advance(1.3,['KeyW','ShiftLeft']);await log(g,'sprint 2.5');await g.shot(`${K}-22-sling-max`);
  await g.zoom(-1500,.05);await g.shot(`${K}-23-sling-max-close`);await g.zoom(1500,.05);
  await g.key('KeyQ',.05);await log(g,'after Q +.05');await g.shot(`${K}-24-sling-release`);
  await g.advance(1);await log(g,'after Q +1');await g.shot(`${K}-25-sling-after1s`);
  await g.advance(2);await log(g,'after Q +3');
  const after=await props(g);console.log('moved',JSON.stringify(after.filter((p,i)=>Math.hypot(p.x-ps[i].x,p.z-ps[i].z)>1).map(p=>[p.kind,p.id??'',p.x,p.z])));
  console.log('errors',JSON.stringify(await g.close()));
}
{ // 2. a new player's attempt to slingshot AT the pins: sprint from the reel straight toward them and let go
  const g=await launch('playground',{fullfx:true});await g.advance(.3);
  await g.key('KeyF',.1);
  // run east along z~5 toward the pins (reel at -8,4) until the cable bites
  await g.advance(3.5,['KeyD','ShiftLeft']);await log(g,'east sprint 3.5');await g.shot(`${K}-26-pins-run`);
  await g.key('KeyQ',.05);await g.advance(1.5);await log(g,'Q at pins run');await g.shot(`${K}-27-pins-run-release`);
  console.log('errors',JSON.stringify(await g.close()));
}
{ // 3. walk through the pins / throw a crate at them
  const g=await launch('playground',{fullfx:true});await g.advance(.3);
  await g.walk(3.6,5.3,.3);await log(g,'west of pins');
  await g.advance(1.2,['KeyD']);await g.advance(.6);await log(g,'walked through pins');await g.shot(`${K}-28-pins-walked-through`);
  console.log('errors',JSON.stringify(await g.close()));
}
