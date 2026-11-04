// playground-play G: cable vs crates close-up; overstretch at the socket; switch-first then plug.
import {launch} from '../cap.mjs';
import {hud,brief} from './lib.mjs';
const K='playground-play';
const log=async(g,tag)=>{const s=await g.snap();console.log(tag,JSON.stringify(brief(s)),JSON.stringify(await hud(g)));return s;};
{ const g=await launch('playground',{fullfx:true});await g.advance(.3);await g.key('KeyF',.1);
  for(const [x,z] of [[-1,6.6],[3.6,6.9],[8.3,7.3]])await g.walk(x,z,.5,12);
  await g.advance(.8,['KeyS','KeyD']);await log(g,'by crate stack');
  await g.zoom(-1500);await g.orbit(-260,0);await g.shot(`${K}-61-cable-through-crates`);
  console.log('errors',JSON.stringify(await g.close()));}
{ const g=await launch('playground',{fullfx:true});await g.advance(.3);await g.key('KeyF',.1);
  // the long way round the back: approach the socket at a sprint from the west along z=-7.6
  for(const [x,z] of [[-9.2,5.5],[-9.2,-7.6]])await g.walk(x,z,.5,12);
  await g.advance(3,['KeyD','ShiftLeft']);const s=await log(g,'sprint to socket long way');
  console.log('dist to socket',Math.hypot(s.player.x-7,s.player.z+6).toFixed(2));
  await g.key('KeyF',.1);await log(g,'F (prompt said?)');
  console.log('errors',JSON.stringify(await g.close()));}
{ const g=await launch('playground',{fullfx:true});await g.advance(.3);
  await g.walk(6.6,-5.4,.4);await g.key('KeyE',.1);await log(g,'switched on first');await g.key('KeyE',.1);await log(g,'E again');
  await g.key('KeyE',.1);await log(g,'E third');
  console.log('errors',JSON.stringify(await g.close()));}
