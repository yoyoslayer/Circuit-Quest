import {launch,item,d2,face,grab,retrieve,fmt} from './lib.mjs';
const K='stuck-softlock';const g=await launch('lunch',{fullfx:true});const L=(...a)=>console.log(...a);
const cab=s=>s.lunch.cables.find(c=>c.id==='thick');
try{
await g.advance(.5);let s=await g.snap();const home=item(s,'wedge').pos;L('wedge home',fmt(home));
await g.walk(-3,7,.4);await g.key('KeyE');s=await g.snap();L('held',s.held);
let p;
for(const zz of [4.3,4.8,3.8]){await g.walk(-11,zz-1.8,.25,15);await g.walk(-11,zz+1.8,.25,15);await g.walk(-11,zz,.15,10);
  await g.key('Space',.36);await g.key('KeyQ',.02);await g.advance(2);s=await g.snap();p=item(s,'wedge').pos;L('throw from z',zz,'->',fmt(p));
  if(p.x< -7.8&&p.z<0)break;const r=await retrieve(g,'wedge');L('re-grab',JSON.stringify(r));if(!r.ok)break;}
await g.advance(10);s=await g.snap();p=item(s,'wedge').pos;L('after10',fmt(p),'lit',s.lunch.lit);
await g.shot(`${K}-20-lunch-wedge-in-dark-store-after10s`);
// Go round through the kitchen door, move the shelf, and try to pick the wedge up in the dark.
await g.walk(0,2,.4);await g.walk(0,-1.2,.4);await g.walk(-6.5,-4.8,.4);await g.key('KeyE');s=await g.snap();L('shelf?',s.held);await g.walk(-5.7,-3.3,.4);await g.key('KeyE');
await g.walk(-8.8,-5,.4);const r1=await retrieve(g,'wedge');s=await g.snap();L('dark retrieve',JSON.stringify(r1),'lit',s.lunch.lit);
await g.shot(`${K}-21-lunch-wedge-dark-store-cannot-grab`);
// Power the kitchen without a wedge: does the door cut the thick cable, and can it be repaired?
await g.walk(-8.8,-5,.4);await g.walk(-5,-5,.4);await g.walk(.2,-1.2,.4);await g.walk(0,2,.4);await g.walk(2,8,.4);await g.key('KeyE');await g.walk(.3,2,.45);await g.advance(4);s=await g.snap();L('mop',s.held,'water',s.lunch.water.toFixed(2));await g.walk(2,2);await g.key('KeyE');await g.walk(-10,7.5,.3);s=await g.snap();L('pip at reel',fmt(s.player));await g.key('KeyF');s=await g.snap();L('thick held',JSON.stringify(s.lunch.held));
for(const [x,z] of [[1,3],[.2,-1.2],[-3.5,-3]])await g.walk(x,z,.45);await g.key('KeyF');await g.advance(1);s=await g.snap();
L('plugged: lit',s.lunch.lit,'thick',JSON.stringify(cab(s).ports),'dead',cab(s).dead,'door',JSON.stringify(s.lunch.door));
await g.advance(3);s=await g.snap();L('+3s lit',s.lunch.lit,'dead',cab(s).dead,'door',s.lunch.door.angle.toFixed(2));
await g.shot(`${K}-22-lunch-thick-cut-by-door-no-wedge`);
if(cab(s).dead){await g.key('KeyF');await g.advance(.5);s=await g.snap();L('repair at post: dead',cab(s).dead,'lit',s.lunch.lit,'src',JSON.stringify(s.lunch.sources),'cost',s.cost,'held',JSON.stringify(s.lunch.held));}
s=await g.snap();if(s.lunch.lit){await g.walk(-6,-5,.4);await g.walk(-8.8,-5,.4);await g.walk(-10.5,-3,.4);const r2=await retrieve(g,'wedge');s=await g.snap();L('lit retrieve',JSON.stringify(r2));await g.shot(`${K}-24-lunch-wedge-recovered-lit`);}
await g.shot(`${K}-23-lunch-after-repair`);
}catch(e){L('ERR',e.message);}
L('errors',JSON.stringify(await g.close()));
