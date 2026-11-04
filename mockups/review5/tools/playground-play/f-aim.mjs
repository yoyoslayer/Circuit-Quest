// playground-play F: can the slingshot hit the pins on purpose? throw a crate at them; cable/Pip close-ups; spool at default zoom.
import {launch} from '../cap.mjs';
import {hud,props,brief} from './lib.mjs';
const K='playground-play';
const log=async(g,tag)=>{const s=await g.snap();console.log(tag,JSON.stringify(brief(s)),JSON.stringify(await hud(g)));return s;};
const mode=process.argv[2]??'all';
if(mode==='all'||mode==='aim'){
  for(const [name,route,keys] of [['around',[[-1,6.6],[3.6,6.9],[8.8,7.2]],['KeyS','KeyD','ShiftLeft']],['behind',[[-1,6.6],[3.6,6.9],[6.6,6.9],[7,3.2],[8.8,3.2]],['KeyW','KeyD','ShiftLeft']]]){
    const g=await launch('playground',{fullfx:true});await g.advance(.3);await g.key('KeyF',.1);
    for(const [x,z] of route){const r=await g.walk(x,z,.5,12);if(!r.arrived)console.log('  stuck',x,z);}
    let s=await log(g,`aim-${name} at stand`);
    await g.advance(1.4,keys);s=await log(g,`aim-${name} stretched`);
    if(name==='around'){await g.shot(`${K}-51-aim-around-taut`);}
    await g.key('KeyQ',.05);await g.advance(2);await log(g,`aim-${name} after Q`);
    if(name==='around')await g.shot(`${K}-52-aim-around-after`);
    console.log('errors',JSON.stringify(await g.close()));
  }
}
if(mode==='all'||mode==='throw'){
  const g=await launch('playground',{fullfx:true});await g.advance(.3);
  // grab the crate at (-1.2,6.4), carry toward the pins and throw
  await g.walk(-1.2,7.1,.4);await log(g,'by crate');await g.key('KeyE',.2);await log(g,'grabbed');
  await g.walk(2.6,5.3,.3);await g.advance(.2,['KeyD']);await log(g,'aiming');await g.shot(`${K}-53-carry-crate`);
  await g.key('KeyQ',.05);await g.advance(1.5);await log(g,'thrown');await g.shot(`${K}-54-crate-thrown`);
  console.log('errors',JSON.stringify(await g.close()));
}
if(mode==='all'||mode==='close'){
  const g=await launch('playground',{fullfx:true});await g.advance(.3);
  await g.crop(`${K}-55-spool-start-crop`,{x:560,y:330,width:260,height:200});
  await g.key('KeyF',.1);await g.walk(-5,-1);await g.walk(-4,-4);
  await g.advance(.2);await g.shot(`${K}-56-mid-drag-default`);
  // close: front and side of Pip holding the plug
  await g.zoom(-1500);await g.shot(`${K}-57-hold-close-back`);
  await g.orbit(520,0);await g.shot(`${K}-58-hold-close-side`);await g.orbit(520,0);await g.shot(`${K}-59-hold-close-front`);
  console.log('errors',JSON.stringify(await g.close()));
}
