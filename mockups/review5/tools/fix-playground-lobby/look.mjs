// Fix shots for the Playground and the HQ lobby. BASE=http://localhost:4202 node look.mjs [which...]
// which: lobby | lobbydoor | pgstart | pglamp | pgwin | pghint
import {launch} from '../cap.mjs';
const which=new Set(process.argv.slice(2));const all=which.size===0;const on=k=>all||which.has(k);
const hideHud=g=>g.page.addStyleTag({content:'#hud{display:none!important}'});
if(on('lobby')){
  const g=await launch('lobby');await g.advance(.5);await g.shot('fix-playground-lobby-lobby-start');
  await g.zoom(-1500);await g.walk(-13.9,-5.5,.4);await g.advance(.6);await g.shot('fix-playground-lobby-lobby-sidedoor');
  console.log('errors',g.errors);await g.close();
}
if(on('lobbydoor')){
  const g=await launch('lobby');await g.advance(.3);const s=await g.snap();
  for(const id of ['lunch','arcade-rush','qfn']){const d=s.hub.doors.find(d=>d.id===id);if(!d)continue;await g.walk(d.at.x,d.at.z,.4);await g.advance(.8);await g.shot(`fix-playground-lobby-door-${id}`);
    if(id==='arcade-rush'){await g.key('KeyE',.1);await g.shot('fix-playground-lobby-door-rush-rattle');}}
  await g.walk(7.5,5.6,.4);await g.advance(.5);await g.shot('fix-playground-lobby-workshop');
  await g.walk(0,4,.4);await g.zoom(-600);await g.advance(.5);await g.shot('fix-playground-lobby-board');
  console.log('audit',JSON.stringify(await g.audit(.02)));console.log('errors',g.errors);await g.close();
}
if(on('pgstart')){
  const g=await launch('playground');await g.advance(.5);await g.shot('fix-playground-lobby-pg-start');
  await g.zoom(-1500);await g.advance(.4);await g.shot('fix-playground-lobby-pg-reel-close');
  console.log('errors',g.errors);await g.close();
}
if(on('pglamp')){
  const g=await launch('playground');await g.advance(.3);await hideHud(g);
  await g.walk(6.4,-5.4,.4);await g.zoom(-1500);await g.advance(.4);await g.shot('fix-playground-lobby-pg-lamp-off');
  await g.key('KeyE',.2);await g.shot('fix-playground-lobby-pg-lamp-switch-on-noplug');console.log('sw',(await g.snap()).switchedOn);
  await g.key('KeyE',.2);
  console.log('errors',g.errors);await g.close();
}
if(on('pgwin')){
  const g=await launch('playground');await g.advance(.3);await g.key('KeyF');
  for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z,.5);
  await g.key('KeyF',.3);await g.zoom(-1200);await g.advance(.3);await g.shot('fix-playground-lobby-pg-plugged');
  await g.walk(6.6,-5.9,.4);await g.key('KeyE',.5);let s=await g.snap();console.log('after E +.5',s.won,s.electrical,s.lampLit);await g.shot('fix-playground-lobby-pg-lit-dwell');
  await g.key('KeyE',.2);s=await g.snap();console.log('E off',s.won,s.electrical,s.lampLit);await g.shot('fix-playground-lobby-pg-lit-off');
  await g.key('KeyE',1.4);s=await g.snap();console.log('E on +1.4',s.won,s.electrical);
  await g.orbit(700,0);await g.shot('fix-playground-lobby-pg-socket-back');
  console.log('audit',JSON.stringify(await g.audit(.02)));console.log('errors',g.errors);await g.close();
}
if(on('pghint')){
  const g=await launch('playground');await g.advance(48);await g.shot('fix-playground-lobby-pg-hint');
  await g.survey();await g.shot('fix-playground-lobby-pg-hint-survey');console.log('errors',g.errors);await g.close();
}
