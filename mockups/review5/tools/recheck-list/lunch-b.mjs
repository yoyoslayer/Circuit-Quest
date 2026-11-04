import {launch} from '../cap.mjs';
const P='recheck-list-';const log=(...a)=>console.log(...a);
const g=await launch('lunch',{fullfx:true});
const lift=s=>s.lunch.loads.find(l=>l.id==='lift');
try{
await g.advance(.3);
await g.walk(-3,7,.4);await g.key('KeyE');await g.walk(0,1.4);await g.key('KeyE');await g.advance(.5);
await g.walk(2,8,.4);await g.key('KeyE');await g.walk(.3,2,.45);await g.advance(4);await g.walk(2,2);await g.key('KeyE');
await g.walk(-10,7.5,.3);await g.key('KeyF');
for(const [x,z] of [[1,3],[.2,-1.2],[-3.5,-3]])await g.walk(x,z,.45);await g.key('KeyF');await g.advance(.5);
let s=await g.snap();log('lit',s.lunch.lit,'cap',JSON.stringify(lift(s).capacitor));
await g.walk(-6.5,-4.8);await g.key('KeyE');log('held',(await g.snap()).held);await g.walk(-5.7,-3.3);await g.key('KeyE');
await g.walk(-8.8,-5);await g.walk(-11.2,-6.8);await g.key('KeyE');log('held',(await g.snap()).held);
for(const [x,z] of [[-8.8,-5],[-5,-5],[.3,-1.3],[.3,2.4],[10,1],[11.3,-4.4]])await g.walk(x,z);
await g.key('KeyE',.1);s=await g.snap();log('capDocked',s.lunch.capDocked,JSON.stringify(lift(s).capacitor));
await g.shot(P+'09a-lunch-cap-docked-gamecam');await g.zoom(-1500);await g.shot(P+'09b-lunch-cap-docked-z9');await g.orbit(-300,0);await g.shot(P+'09c-lunch-cap-docked-z9-orbit');await g.orbit(300,0);await g.zoom(1500);
for(const [bx,drop] of [[7,[-1.4,1.8]],[9,[1.5,.9]]]){await g.walk(10,1,.4);await g.walk(bx,7.3,.4);await g.key('KeyE');log('bridge',(await g.snap()).held);await g.walk(drop[0],drop[1],.4);await g.key('KeyE');}
await g.walk(.3,2.4);await g.walk(-10.8,2,.4);await g.key('KeyF');log('held cable',(await g.snap()).lunch.held?.id);
await g.walk(.3,2.4);await g.walk(.3,-1.3);await g.walk(-3.8,-1.7,.4);await g.key('KeyF',.3);log('fridge',JSON.stringify((await g.snap()).lunch.cables.find(c=>c.id==='thin-1').ports));
await g.walk(-3.8,-1.7,.4);await g.key('KeyF');
const cap=(await g.snap()).items.find(i=>i.id==='capacitor').pos;
for(const [x,z] of [[.3,-1.3],[.3,2.4],[10,1],[cap.x-.9,cap.z]])await g.walk(x,z);
await g.shot(P+'09f-lunch-thin-at-cart');await g.key('KeyF',.3);
s=await g.snap();log('thin-1 ports',JSON.stringify(s.lunch.cables.find(c=>c.id==='thin-1').ports));
await g.walk(11.8,-4.4,.45);await g.key('KeyE',.2);s=await g.snap();log('lift',JSON.stringify(lift(s)),'A',JSON.stringify(s.lunch.sources.find(x=>x.id==='a')));
await g.shot(P+'09d-lunch-cap-inline-lift-start');await g.zoom(-1500);await g.shot(P+'09e-lunch-cap-inline-z9');
for(let i=0;i<4;i++){await g.advance(1);s=await g.snap();log('t',s.time.toFixed(1),JSON.stringify(lift(s).capacitor),lift(s).state,'A tripped',s.lunch.sources.find(x=>x.id==='a').tripped);}
}catch(e){log('ERR',e.message);}
log('errors',JSON.stringify(await g.close()));
