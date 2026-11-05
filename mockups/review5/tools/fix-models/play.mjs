// Fix-models gameplay checks (pins, seated coworkers, carry pose, coworker capsules) with shots.
// BASE=http://localhost:4206 node mockups/review5/tools/fix-models/play.mjs [which]
import {launch} from '../cap.mjs';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const SH=resolve(dirname(fileURLToPath(import.meta.url)),'..','..','shots');
const jpg=(g,name)=>g.page.waitForTimeout(700).then(()=>g.page.screenshot({path:resolve(SH,`fix-models-${name}.jpg`),type:'jpeg',quality:78}));
const which=process.argv[2]??'all',want=k=>which==='all'||which===k;
const tilt=(q)=>1-2*(q.x*q.x+q.z*q.z);
if(want('pins')){
  // Walk straight through the pin triangle: no bonus. Then the slingshot route aimed at them.
  let g=await launch('playground',{fullfx:false});
  await g.walk(3.3,5.3,.2);await g.walk(6.6,5.3,.2);let s=await g.advance(2);
  const moved=await g.page.evaluate(()=>window.__game.props.filter(p=>p.spec.id?.startsWith('pin-')).map(p=>{const t=p.body.translation(),r=p.body.rotation();return +(1-2*(r.x*r.x+r.z*r.z)).toFixed(2);}));console.log('pin up after walk',moved.join(','));
  console.log('walk-through pinsDown',s.pinsDown,'player',s.player.x.toFixed(2),s.player.z.toFixed(2));
  await g.zoom(-600);await jpg(g,'pins-walked');await g.close();
  g=await launch('playground',{fullfx:false});await jpg(g,'pins-start');
  await g.key('KeyF');await g.walk(1,8.6,.4);await g.walk(8.5,6.2,.4);await g.ev('return drive.advance(2.5,["KeyW","ShiftLeft"])');
  s=await g.snap();console.log('strain',s.rope.strain.toFixed(2));await g.key('KeyQ',.05);s=await g.advance(3);console.log('slingshot pinsDown',s.pinsDown);
  await g.close();
}
if(want('chair')){
  // Grab the chair under a seated coworker and carry it away: the coworker drops to the floor.
  const g=await launch('meeting',{fullfx:false});let s=await g.snap();
  const near=s.npcs.filter(n=>n.seated).sort((a,b)=>Math.hypot(a.x+6.85,a.z+7.05)-Math.hypot(b.x+6.85,b.z+7.05))[0];
  console.log('seated',s.npcs.filter(n=>n.seated).length,'target',JSON.stringify(near));
  await g.zoom(-1400);await g.walk(near.x+.9,near.z,.3);await jpg(g,'seated-close');
  await g.walk(near.x+.55,near.z,.15);await g.key('KeyE',.2);s=await g.snap();console.log('held',s.held);
  await g.walk(near.x+3,near.z+1.5,.4);s=await g.advance(1);
  const after=s.npcs.find(n=>n.x===near.x&&n.z===near.z);s=await g.advance(1.5);console.log('after grab',JSON.stringify(after),'hovering',JSON.stringify(s.npcs.filter(n=>!n.seated&&n.y>.05)));
  await jpg(g,'seated-chair-taken');await g.close();
}
if(want('carry')){
  // Garage robot: pushed upright on its wheels. Arcade tray: level at the chest.
  let g=await launch('garage',{fullfx:false});let s=await g.snap();const bot=s.items.find(i=>i.id==='robot');
  await g.walk(bot.pos.x-1,bot.pos.z,.3);await g.key('KeyE',.2);await g.walk(bot.pos.x-4,bot.pos.z+2,.5);
  const q=await g.ev('const p=game.__p;return 0');
  const rot=await g.page.evaluate(()=>{const p=window.__game.props.find(p=>p.spec.id==='robot');const r=p.body.rotation(),t=p.body.translation();return {up:1-2*(r.x*r.x+r.z*r.z),y:t.y};});
  console.log('robot held',(await g.snap()).held,'up',rot.up.toFixed(3),'y',rot.y.toFixed(2));await g.zoom(-1400);await jpg(g,'carry-robot');await g.close();
  g=await launch('arcade',{fullfx:false});s=await g.snap();const tray=s.items.find(i=>i.id==='tray');
  if(tray){await g.walk(tray.pos.x+.8,tray.pos.z,.3);await g.key('KeyE',.2);await g.walk(tray.pos.x+3,tray.pos.z-1.5,.5);
    const t=await g.page.evaluate(()=>{const p=window.__game.props.find(p=>p.spec.id==='tray');const r=p.body.rotation(),t=p.body.translation(),pl=window.__game.player.translation();return {up:1-2*(r.x*r.x+r.z*r.z),y:t.y,dy:t.y-pl.y};});
    console.log('tray held',(await g.snap()).held,'up',t.up.toFixed(3),'y',t.y.toFixed(2));await g.zoom(-1400);await jpg(g,'carry-tray');await g.orbit(500,0);await jpg(g,'carry-tray-side');}
  await g.close();
}
if(want('npc')){
  // Walk into a standing coworker: Pip stops outside the capsule.
  const g=await launch('meeting',{fullfx:false});await g.walk(-12.7,4,.3);const r=await g.walk(-12.7,2.8,.05,4);
  const p=r.state.player;console.log('npc distance',Math.hypot(p.x+12.7,p.z-2.8).toFixed(2),'arrived',r.arrived);await g.zoom(-1400);await jpg(g,'npc-bump');await g.close();
}
