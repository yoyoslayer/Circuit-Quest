import {launch,item,d2,retrieve,fmt} from '../stuck-softlock/lib.mjs';
const K='p0check-gap1-stuck-respawn-softlock';const g=await launch('meeting',{fullfx:true});const L=(...a)=>console.log(...a);
try{
await g.advance(.5);let s=await g.snap();const home=item(s,'strip').pos;L('home',fmt(home));
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');s=await g.snap();L('held',s.held);
let p;
for(const zz of [-1.25,-1.4,-1.0,-1.8]){await g.walk(-13.5,zz+1.8,.25,15);await g.walk(-13.5,zz,.15,10);s=await g.snap();L('pip',fmt(s.player),'held',s.held);
  if(s.held!=='strip'){const r=await retrieve(g,'strip');L('regrab',JSON.stringify(r));continue;}
  await g.walk(-13.5,zz+1.8,.25,15);await g.walk(-13.5,zz,.15,10);
  await g.key('Space',.36);await g.key('KeyQ',.02);await g.advance(1.8);s=await g.snap();p=item(s,'strip').pos;L('throw',zz,'->',fmt(p));
  if(p.x<-11.9&&p.z<-5.5)break;const r=await retrieve(g,'strip');L('regrab',JSON.stringify(r));if(!r.ok)break;}
await g.advance(10);s=await g.snap();p=item(s,'strip').pos;L('after10',fmt(p));
await g.shot(`${K}-01-meeting-strip-after10`);
for(const [x,z] of [[-11.45,-7.5],[-11.45,-8.5],[-14,-5.05],[-13,-5.05]]){await g.walk(x,z,.3,15);s=await g.snap();L('at',fmt(s.player),'d',d2(s.player,p).toFixed(2),'prompt',JSON.stringify(s.prompt??''));await g.key('KeyE');s=await g.snap();L(' held',s.held);if(s.held==='strip')break;if(s.held)await g.key('KeyE');}
await g.shot(`${K}-02-meeting-pip-at-closet-wall`);
// try hop: jump repeatedly into wall
await g.walk(-12.5,-5.0,.2,10);for(let i=0;i<3;i++){await g.page.keyboard.down('KeyW');await g.key('Space',.5);await g.page.keyboard.up('KeyW');}
s=await g.snap();L('after hop attempts pip',fmt(s.player));
await g.advance(20);s=await g.snap();L('after30',fmt(item(s,'strip').pos),'stripPlaced',s.stripPlaced,'keys',Object.keys(s).join(','));
await g.survey();await g.shot(`${K}-03-meeting-survey`);
}catch(e){L('ERR',e.stack);}
L('errors',JSON.stringify(await g.close()));
