import {launch} from '../cap.mjs';import {hook,ui,sweep,summarize,approach,K} from './h.mjs';
const L=(...a)=>console.log(...a.map(x=>typeof x==='string'?x:JSON.stringify(x)));
const g=await launch('lunch',{fullfx:true});await hook(g);await g.advance(.5);
const st=async()=>{const s=await g.snap();const u=await ui(g);const c=s.items.find(i=>i.id==='capacitor').pos;return {prompt:u.prompt,pip:u.pip,cap:[+c.x.toFixed(2),+c.z.toFixed(2)],capToWinch:+Math.hypot(c.x-12,c.z+4.8).toFixed(2),pipToWinch:+Math.hypot(s.player.x-12,s.player.z+4.8).toFixed(2),docked:s.lunch.capDocked,held:s.held};};
await g.walk(-3,7,.4);await g.key('KeyE');await g.walk(0,1.4);await g.key('KeyE',.5);
await g.walk(2,8,.4);await g.key('KeyE');await g.walk(.3,2,.45);await g.advance(4);await g.walk(2,2);await g.key('KeyE');
await g.walk(-10,7.5,.3);await g.key('KeyF');for(const [x,z] of [[1,3],[.2,-1.2],[-3.5,-3]])await g.walk(x,z,.45);await g.key('KeyF',.5);
L('kitchen fed',(await g.snap()).lunch.cables.find(c=>c.id==='thick').ports);
// DR-13 sweep for step 4 (oven at -2.5,-7.2) from the post
const s4=await sweep(g,[[-2.5,.8,-7.2,'oven'],[-2.5,2.1,-7.2,'marker']],'lu-oven',(z,k,v)=>v.some(x=>x.name==='oven'&&x.blocked)&&k%2===0);L('SWEEP oven from post\n'+summarize(s4));
await g.walk(-6.5,-4.8);await g.key('KeyE');L('held',(await g.snap()).held);await g.walk(-5.7,-3.3);await g.key('KeyE');
for(const [x,z] of [[-8.8,-5],[-11.2,-6.8]])await g.walk(x,z);L('at cap',await st());await g.key('KeyE');L('grab cap',await st());
for(const [x,z] of [[-8.8,-5],[-5,-5],[.3,-1.3],[.3,2.4],[10,1],[10.6,-1.6]])await g.walk(x,z);
L('3m',await st());await g.zoom(-500);await g.shot(`${K}-50-lu-cap-3m`);
await g.walk(11,-2.6,.15);L('~2.2',await st());await g.shot(`${K}-51-lu-cap-2m`);
await g.key('KeyE',.5);L('dropped',await st());await g.shot(`${K}-52-lu-cap-dropped`);
L('errors',await g.close());
