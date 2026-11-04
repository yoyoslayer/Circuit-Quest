import {launch,W,R,wedge,mop,hudText} from '../lunch-teach/lib.mjs';
const K='verify-lunch-teach';const which=process.argv[2]??'all';
const L=async g=>(await g.snap()).lunch;
if(which==='all'||which==='scorch'){
  const g=await launch('lunch',{fullfx:true});
  await wedge(g);await mop(g);
  await W(g,-10.8,2,.4);await g.key('KeyF');
  await R(g,[[1,3],[.2,-1.2],[-3.5,-3]],.45);await g.key('KeyF');await g.advance(.3);
  console.log('plugged hud:',await hudText(g));
  await g.advance(7);let l=await L(g);console.log('after 7s oven',l.loads.find(x=>x.id==='oven').state,'dead',l.cables.filter(c=>c.dead).map(c=>c.id));
  console.log('scorched hud:',await hudText(g));await g.shot(`${K}-01-scorch-card`);
  console.log('errors',JSON.stringify(await g.close()));
}
if(which==='all'||which==='kick'){
  const g=await launch('lunch',{fullfx:true});
  await wedge(g);await mop(g);
  await W(g,-9.8,3.5,.5);await g.key('KeyF');
  await R(g,[[.3,2.4],[10,1],[11.8,-4.4]]);await g.key('KeyF');await g.advance(.2);
  await g.zoom(-1200);await g.key('KeyE',0);await g.advance(.05);await g.shot(`${K}-02-kick-winch-close-0.05s`);
  await g.advance(.4);await g.shot(`${K}-03-kick-winch-close-0.45s`);
  let l=await L(g);console.log('kick src',JSON.stringify(l.sources),'capHint',l.capHint,'lift',l.loads.find(x=>x.id==='lift').state,'lit',l.lit);
  await g.zoom(1200);await g.survey();await g.shot(`${K}-04-kick-survey-dark-store`);
  console.log('errors',JSON.stringify(await g.close()));
}
if(which==='all'||which==='fridge'){
  const g=await launch('lunch',{fullfx:false});
  for(let i=0;i<12;i++){await g.advance(10);}
  let s=await g.snap();console.log('t',s.time.toFixed(1),'temp',s.lunch.job.temperature.toFixed(3),'failed',s.lunch.job.failed);
  await g.advance(2);s=await g.snap();console.log('t',s.time.toFixed(1),'failed',s.lunch.job.failed);
  await g.advance(2);await g.shot(`${K}-05-idle-spoil`);
  console.log('errors',JSON.stringify(await g.close()));
}
