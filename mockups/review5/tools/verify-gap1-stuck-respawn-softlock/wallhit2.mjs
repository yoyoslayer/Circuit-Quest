import {launch,item,fmt} from '../stuck-softlock/lib.mjs';
const K='verify-gap1-stuck-respawn-softlock';const g=await launch('meeting',{fullfx:true});const L=(...a)=>console.log(...a);
try{await g.advance(.5);let s;
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');
await g.walk(-13.5,-1.2,.25,15);await g.walk(-13.5,-4.4,.15,10);s=await g.snap();L('pip',fmt(s.player),s.held);
await g.key('KeyQ',.0);let shot=false;
for(let i=0;i<24;i++){await g.advance(.05);s=await g.snap();const p=item(s,'strip').pos;L(i,fmt(p));if(!shot&&p.z<-4.9&&p.y>1.4&&i>0){await g.shot(`${K}-06-meeting-strip-stopped-above-wall`);shot=true;}}
}catch(e){L('ERR',e.stack);}
L('errors',JSON.stringify(await g.close()));
