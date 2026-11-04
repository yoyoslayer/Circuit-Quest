import {launch,W,R,brief,hudText,wedge,mop,takeThick,feedKitchen} from './lib.mjs';
const K='lunch-teach';const t0=Date.now();const which=process.argv[2]??'all';
if(which==='all'||which==='scorch'){
  const g=await launch('lunch',{fullfx:true});
  await wedge(g);await mop(g);
  await W(g,-10.8,2,.4);await g.key('KeyF');
  await R(g,[[1,3],[.2,-1.2],[-3.5,-3]],.45);await g.key('KeyF');await g.advance(.2);
  await brief(g,'thin-plugged');console.log('hud',await hudText(g));
  await g.shot(`${K}-10-thin-kitchen-just-plugged`);
  await g.advance(2);await brief(g,'thin+2s');await g.shot(`${K}-11-thin-kitchen-warm`);
  await g.advance(2.5);await brief(g,'thin+4.5s');await g.shot(`${K}-12-thin-kitchen-hot`);
  await g.advance(1.8);await brief(g,'thin+6.3');await g.shot(`${K}-13-thin-kitchen-scorched`);console.log('hud',await hudText(g));
  await W(g,-6,-1.5);await g.shot(`${K}-14-thin-scorched-wide`);
  console.log('errors',JSON.stringify(await g.close()));
}
if(which==='all'||which==='short'){
  const g=await launch('lunch',{fullfx:true});
  await wedge(g);await takeThick(g);
  await R(g,[[1,3],[.2,-1.2]],.45);await g.shot(`${K}-15-thick-through-puddle-carrying`);
  await W(g,-3.5,-3,.45);await g.key('KeyF');await g.advance(.15);await brief(g,'short');await g.shot(`${K}-16-short-tripped`);console.log('hud',await hudText(g));
  await g.advance(1.5);await g.shot(`${K}-17-short-after`);
  await R(g,[[.2,-1.2],[.3,2],[-9,6],[-12,6]],.45);await g.shot(`${K}-18-tripped-cart-close`);console.log('hud',await hudText(g));
  await g.key('KeyE');await g.advance(.3);await brief(g,'reset-while-wet');await g.shot(`${K}-19-reset-while-wet`);
  console.log('errors',JSON.stringify(await g.close()));
}
if(which==='all'||which==='kick'){
  const g=await launch('lunch',{fullfx:true});
  await wedge(g);await mop(g);
  await W(g,-9.8,3.5,.5);await g.key('KeyF');
  await R(g,[[.3,2.4],[10,1],[11.8,-4.4]]);await g.key('KeyF');await g.advance(.2);console.log('hud',await hudText(g));
  await g.shot(`${K}-20-lift-plugged-before-switch`);
  await g.key('KeyE',0);await g.advance(.05);await g.shot(`${K}-21-lift-kick-instant`);
  await g.advance(.5);await brief(g,'kick');await g.shot(`${K}-22-lift-kick-tripped`);console.log('hud',await hudText(g));
  await g.survey();await g.shot(`${K}-23-lift-kick-survey-badge`);await g.key('Tab',.8);
  console.log('errors',JSON.stringify(await g.close()));
}
console.log('ms',Date.now()-t0);
