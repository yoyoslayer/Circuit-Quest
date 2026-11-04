import {launch} from '../cap.mjs';import {hook,ui,propsNear,sweep,summarize,approach,K} from './h.mjs';
const L=(...a)=>console.log(...a.map(x=>typeof x==='string'?x:JSON.stringify(x)));
const only=process.argv[2];
if(!only||only==='garage'){
const g=await launch('garage',{fullfx:true});await hook(g);await g.advance(.5);
L('G start',await ui(g));
const r0=(await g.snap()).items.find(i=>i.id==='robot').pos;L('robot',r0);
const sw=await sweep(g,[[r0.x,.5,r0.z,'robot'],[r0.x,2.1,r0.z,'marker']],'ga-s1',(z,k,v)=>v.some(x=>(x.blocked||!x.inFrame))&&k%2===0);L('SWEEP garage step1 from spawn\n'+summarize(sw));
await g.walk(6.4,-4.2,.5);L('near robot',await propsNear(g,r0.x,r0.z,2),await ui(g));
await g.key('KeyE');L('held',await ui(g));
await g.walk(3.4,-4,.3);L('3m',await ui(g));
await approach(g,.7,-4.45,2.9);L('2.9m',await ui(g));await g.zoom(-500);await g.shot(`${K}-30-ga-stand-2p9m`);
await approach(g,.7,-4.45,1.5);L('1.5m',await ui(g));await g.shot(`${K}-31-ga-stand-1p5m`);
// release outside zone: back to 3.0 then E
await approach(g,.7,-4.45,3.1);L('3.1m before E',await ui(g));await g.key('KeyE',.4);let s=await g.snap();L('after E at 3.1: onStand',s.station?.onStand,s.items.find(i=>i.id==='robot').pos,await ui(g));
await g.shot(`${K}-32-ga-drop-outside`);
await g.key('KeyE');await approach(g,.7,-4.45,1.8);await g.key('KeyE',.4);s=await g.snap();L('after E at 1.8: onStand',s.station?.onStand,await ui(g));await g.shot(`${K}-33-ga-on-stand`);
await g.zoom(1500);
L('errors',await g.close());}
if(!only||only==='spectrum'){
const g=await launch('spectrum',{fullfx:true});await hook(g);await g.advance(.5);
L('S start',await ui(g));const pod=(await g.snap()).items.find(i=>i.id==='pod').pos;L('pod',pod,await propsNear(g,pod.x,pod.z,2));
await g.walk(-6.4,6.4,.6);L('at pod',await ui(g));await g.key('KeyE');L('held',await ui(g));
for(const [x,z] of [[-10.1,3],[-10.1,-2.2],[-10.1,-4.4]])await g.walk(x,z);
L('pad 2m?',await ui(g));
const sw=await sweep(g,[[-8.2,.2,-5.8,'pad'],[-8.2,2.1,-5.8,'marker']],'sp-pad',(z,k,v)=>v.some(x=>(x.blocked||!x.inFrame))&&k%2===0);L('SWEEP store pad (Pip at -10.1,-4.4 holding pod)\n'+summarize(sw));
await approach(g,-8.2,-5.8,1.5);L('1.5m',await ui(g));await g.zoom(-600);await g.shot(`${K}-40-sp-pad-1p5m`);
await approach(g,-8.2,-5.8,.6);L('0.6m',await ui(g));await g.shot(`${K}-41-sp-pad-0p6m`);
await approach(g,-8.2,-5.8,1.2);await g.key('KeyE',.4);L('after E 1.2',(await g.snap()).station?.podPad,await ui(g));await g.shot(`${K}-42-sp-pad-parked`);
await g.zoom(1500);
// mirror
for(const [x,z] of [[-10.1,-2.2],[-10.1,-1.4],[0,-1.4],[-.9,-1.8]])await g.walk(x,z);
const m2=(await g.snap()).items.filter(i=>i.id.startsWith('mirror'));L('mirrors',m2);
await g.walk(-.9,-4.55,.3);L('at mirror2',await propsNear(g,-.9,-4.9,1.8),await ui(g));await g.key('KeyE');L('held',await ui(g));
await g.walk(-.9,-1.6,.3);await g.walk(1.6,-.6,.2);L('mark ~1.4',await ui(g));await g.zoom(-600);await g.shot(`${K}-43-sp-mark-near`);
await g.walk(2.3,-.3,.15);L('mark ~0.4',await ui(g));await g.shot(`${K}-44-sp-mark-0p6`);
await g.key('KeyE',.4);L('after E',(await g.snap()).station?.mirrors,await ui(g));await g.shot(`${K}-45-sp-mark-placed`);
L('errors',await g.close());}
