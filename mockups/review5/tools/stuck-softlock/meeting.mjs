import {launch,item,d2,face,grab,retrieve,fmt} from './lib.mjs';
const K='stuck-softlock';const g=await launch('meeting',{fullfx:true});const L=(...a)=>console.log(...a);
try{
await g.advance(.5);let s=await g.snap();const home=item(s,'strip').pos;L('strip home',fmt(home));
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');s=await g.snap();L('held',s.held);
let p;
for(let k=0;k<4;k++){
  const zz=[-1.4,-1.0,-1.8,-0.6][k];await g.walk(-13.5,zz+1.8,.25,15);await g.walk(-13.5,zz,.15,10);s=await g.snap();L('pip',fmt(s.player));
  await g.key('Space',.36);await g.key('KeyQ',.02);await g.advance(.25);await g.shot(`${K}-09-meeting-strip-jumpthrow-${k}`);await g.advance(1.5);s=await g.snap();p=item(s,'strip').pos;L('throw',k,'->',fmt(p),'held',s.held);
  if(p.x<-11.9&&p.z<-5.5)break;
  const r=await retrieve(g,'strip');L('re-grab',JSON.stringify(r));if(!r.ok)break;}
await g.advance(10);s=await g.snap();p=item(s,'strip').pos;L('after10',fmt(p),'fromHome',d2(p,home).toFixed(2),'held',s.held);
await g.shot(`${K}-10-meeting-strip-in-closet-after10s`);
await g.zoom(-1500);await g.shot(`${K}-11-meeting-strip-in-closet-close`);await g.zoom(1500);
let best=99;for(const [x,z] of [[-11.45,-6],[-11.45,-7.5],[-11.45,-9.5],[-12.5,-5.05],[-14,-5.05],[-15.8,-5.05]]){await g.walk(x,z,.3,15);s=await g.snap();const d=d2(s.player,p);best=Math.min(best,d);await g.key('KeyE');s=await g.snap();L('at',x,z,'pip',fmt(s.player),'d',d.toFixed(2),'held',s.held);if(s.held==='strip')break;if(s.held)await g.key('KeyE');}
L('closest',best.toFixed(2));
await g.advance(20);s=await g.snap();L('after 30 s',fmt(item(s,'strip').pos),'stripPlaced',s.stripPlaced);
await g.survey();await g.shot(`${K}-12-meeting-strip-lost-survey`);
}catch(e){L('ERR',e.message);}
L('errors',JSON.stringify(await g.close()));
