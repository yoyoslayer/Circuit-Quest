import {launch} from '../cap.mjs';
const P='verify-gap3-recheck-list-';const log=(...a)=>console.log(...a);
const g=await launch('lunch',{fullfx:true});
const lift=s=>s.lunch.loads.find(l=>l.id==='lift');
try{
await g.advance(.3);
await g.walk(-3,7,.4);await g.key('KeyE');await g.walk(0,1.4);await g.key('KeyE');await g.advance(.5);
await g.walk(2,8,.4);await g.key('KeyE');await g.walk(.3,2,.45);await g.advance(4);await g.walk(2,2);await g.key('KeyE');
await g.walk(-10,7.5,.3);await g.key('KeyF');
for(const [x,z] of [[1,3],[.2,-1.2],[-3.5,-3]])await g.walk(x,z,.45);await g.key('KeyF');await g.advance(.5);
await g.walk(-6.5,-4.8);await g.key('KeyE');await g.walk(-5.7,-3.3);await g.key('KeyE');
await g.walk(-8.8,-5);await g.walk(-11.2,-6.8);await g.key('KeyE');
for(const [x,z] of [[-8.8,-5],[-5,-5],[.3,-1.3],[.3,2.4],[10,1],[11.3,-4.4]])await g.walk(x,z);
await g.key('KeyE',.1);let s=await g.snap();log('capDocked',s.lunch.capDocked);
log('w0',JSON.stringify((await g.walk(10,1,.4)).arrived));log('w1',JSON.stringify((await g.walk(.3,2.4)).arrived));log('w2',JSON.stringify((await g.walk(-10.8,2,.4)).arrived));s=await g.snap();log('pl',JSON.stringify(s.player),JSON.stringify(s.lunch.cables.map(c=>[c.id,c.ports,c.ends.map(e=>[+e.x.toFixed(1),+e.z.toFixed(1)])])));await g.key('KeyF');s=await g.snap();log('held cable',s.lunch.held?.id);
const cap=s.items.find(i=>i.id==='capacitor').pos;
for(const [x,z] of [[.3,2.4],[10,1],[cap.x-.9,cap.z]])await g.walk(x,z);
const id=(await g.snap()).lunch.held?.id;log('holding',id);
await g.shot(P+'20-lunch-direct-at-cart');
for(let k=0;k<6;k++){await g.key('KeyF',.3);s=await g.snap();const c=s.lunch.cables.find(c=>c.id===id);log('try',k,'t',s.time.toFixed(2),JSON.stringify(c.ports),'held',s.lunch.held?.id);if(c.ports.includes('cap'))break;await g.advance(2);}
let prev='';let shots=0;for(let i=0;i<60;i++){await g.advance(.25);s=await g.snap();const c=s.lunch.cables.find(c=>c.id===id);const k=JSON.stringify(c.ports);const b=JSON.stringify(s.lunch.bots);if(k!==prev||i%8===0)log('t',s.time.toFixed(2),k,'end1',c.ends[1].x.toFixed(1),c.ends[1].z.toFixed(1),b);
 if(k!==prev&&prev&&shots<1){shots++;await g.shot(P+'21-lunch-direct-snag-moment');await g.advance(.75);await g.shot(P+'22-lunch-direct-snag-plus1s');await g.zoom(1200);await g.shot(P+'23-lunch-direct-snag-zoomout');}
 prev=k;}
}catch(e){log('ERR',e.message);}
log('errors',JSON.stringify(await g.close()));
