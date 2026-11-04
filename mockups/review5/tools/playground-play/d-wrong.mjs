// playground-play D: aimed pin slingshots, and wrong moves a new player makes.
import {launch} from '../cap.mjs';
import {hud,props,brief} from './lib.mjs';
const K='playground-play';
const log=async(g,tag)=>{const s=await g.snap();console.log(tag,JSON.stringify(brief(s)),JSON.stringify(await hud(g)));return s;};
const mode=process.argv[2]??'all';
if(mode==='all'||mode==='pins'){ // aimed pin shots
  for(const [name,stand,keys,dur] of [['S',[9,3.7],['KeyS','ShiftLeft'],1.6],['SD',[8.6,6.6],['KeyS','KeyD','ShiftLeft'],1.6],['frontlane',[9,5.2],['KeyD','ShiftLeft'],1.5]]){
    const g=await launch('playground',{fullfx:true});await g.advance(.3);await g.key('KeyF',.1);
    const r=await g.walk(stand[0],stand[1]);await log(g,`pins-${name} at stand arrived=${r.arrived}`);
    await g.advance(dur,keys);const s=await log(g,`pins-${name} stretched`);
    if(name==='SD')await g.shot(`${K}-30-pinshot-aim`);
    await g.key('KeyQ',.05);await g.advance(2);await log(g,`pins-${name} after Q`);
    if(name==='SD')await g.shot(`${K}-31-pinshot-after`);
    console.log('errors',JSON.stringify(await g.close()));
  }
}
if(mode==='all'||mode==='lane'){ // follow the painted yellow line along the walls (what the decor comment says leads to the socket)
  const g=await launch('playground',{fullfx:true});await g.advance(.3);await g.key('KeyF',.1);
  for(const [x,z] of [[-9.2,5.5],[-9.2,-7.8],[7,-7.8]]){const r=await g.walk(x,z,.5,12);await log(g,`lane leg -> ${x},${z} arrived=${r.arrived}`);}
  await g.shot(`${K}-32-lane-follow-stuck`);
  console.log('errors',JSON.stringify(await g.close()));
}
if(mode==='all'||mode==='idle'){ // idle until the hint dots appear; also check the switch-first move
  const g=await launch('playground',{fullfx:true});await g.advance(.3);
  await g.advance(36);await log(g,'idle 36');await g.shot(`${K}-33-idle-hint`);
  await g.walk(6.6,-5.4,.4);await log(g,'at lamp without plug');await g.shot(`${K}-34-lamp-no-plug`);
  await g.zoom(-1500);await g.shot(`${K}-35-lamp-close`);await g.orbit(700,0);await g.shot(`${K}-36-lamp-close-back`);await g.orbit(-700,0);await g.zoom(600);
  await g.key('KeyE',.2);await log(g,'E at lamp without plug');
  // go to the decoy reel by the back wall
  await g.walk(-4.5,-7.9,.4);await log(g,'near decoy reel');await g.shot(`${K}-37-decoy-reel`);
  await g.key('KeyE',.2);await log(g,'E decoy reel');
  await g.walk(6.4,-5.4,.4);await log(g,'decoy reel at socket');await g.key('KeyF',.2);await log(g,'F with decoy reel at socket');await g.shot(`${K}-38-decoy-at-socket`);
  console.log('errors',JSON.stringify(await g.close()));
}
if(mode==='all'||mode==='unplug'){ // plug in, unplug, drop midway, pick up again; switch toggles
  const g=await launch('playground',{fullfx:true});await g.advance(.3);await g.key('KeyF',.1);
  await g.walk(-5,-1);await g.key('KeyF',.2);await log(g,'dropped midway');
  await g.walk(-1,4);await log(g,'walked away');await g.walk(-5,-1.6,.4);await log(g,'back at plug');await g.key('KeyF',.2);await log(g,'picked again');
  await g.walk(-4,-4);await g.walk(5.8,-5.5);await g.key('KeyF',.2);await log(g,'plugged');
  await g.key('KeyF',.2);await log(g,'F again (unplug?)');await g.shot(`${K}-39-unplugged-card`);
  console.log('errors',JSON.stringify(await g.close()));
}
