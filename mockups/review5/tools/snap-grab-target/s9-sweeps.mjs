import {launch} from '../cap.mjs';import {hook,sweep,summarize} from './h.mjs';import {occl} from './occl.mjs';
const L=(...a)=>console.log(...a.map(x=>typeof x==='string'?x:JSON.stringify(x)));
const bad=(name)=>(z,k,v)=>v.some(x=>x.name===name&&(x.blocked||!x.inFrame));
const which=process.argv[2];
if(which==='m'){const g=await launch('meeting',{fullfx:true});await hook(g);await g.advance(.5);
 const rows=await sweep(g,[[-8.6,.3,-3.2,'strip'],[-8.6,2.1,-3.2,'marker'],[-10,1.2,-5.8,'pip']],'m-spawn',bad('pip'));L('MEETING spawn step1\n'+summarize(rows));
 await g.page.evaluate(()=>{window.__game.zoom=9;window.__game.yaw=.14+Math.PI;});await g.advance(.5);await g.page.waitForTimeout(1200);L('occl y180',await occl(g));
 await g.walk(-9,-6,.4);const r2=await sweep(g,[[-10.7,.4,-7.1,'plug'],[-10.7,2.1,-7.1,'marker']],'m-closet',bad('plug'));L('MEETING step2 from (-9,-6)\n'+summarize(r2));L(await g.close());}
if(which==='p'){const g=await launch('playground',{fullfx:true});await hook(g);await g.advance(.5);
 await g.key('KeyF');for(const [x,z] of [[-5,-1],[-4,-4],[3.5,-5.2]])await g.walk(x,z);
 const r=await sweep(g,[[7,.5,-6,'socket'],[7,2.1,-6,'marker']],'p-sock',bad('socket'));L('PG step2 from (3.5,-5.2)\n'+summarize(r));L(await g.close());}
if(which==='s'){const g=await launch('spectrum',{fullfx:true});await hook(g);await g.advance(.5);
 await g.walk(-6.4,6.4,.6);await g.key('KeyE');for(const [x,z] of [[-10.1,3],[-10.1,-2.2],[-10.1,-4.4]])await g.walk(x,z);
 const r=await sweep(g,[[-8.2,.15,-5.8,'pad'],[-8.2,2.1,-5.8,'marker']],'s-pad',bad('pad'));L('SPECTRUM pad from door\n'+summarize(r));L(await g.close());}
if(which==='g'){const g=await launch('garage',{fullfx:true});await hook(g);await g.advance(.5);
 await g.walk(6.4,-4.2,.5);await g.key('KeyE');await g.walk(3.4,-4,.3);
 const r2=await sweep(g,[[.7,.7,-4.45,'stand'],[.7,2.1,-4.45,'marker']],'g-stand',bad('stand'));L('GARAGE stand while carrying\n'+summarize(r2));L(await g.close());}
