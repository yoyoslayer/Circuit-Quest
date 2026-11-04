import {launch,item,fmt} from '../stuck-softlock/lib.mjs';
const K='verify-gap1-stuck-respawn-softlock';const g=await launch('meeting',{fullfx:true});const L=(...a)=>console.log(...a);
try{await g.advance(.5);let s;
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');
await g.walk(-13.5,-1.2,.25,15);await g.walk(-13.5,-3.4,.15,10);s=await g.snap();L('pip',fmt(s.player),s.held);
await g.key('Space',.36);await g.key('KeyQ',.02);let shot=false;
for(let i=0;i<30;i++){await g.advance(.05);s=await g.snap();const p=item(s,'strip').pos;L(i,fmt(p));if(!shot&&p.z<-5.0&&p.y>1.4){await g.shot(`${K}-05-meeting-strip-at-wall-plane`);shot=true;}}
}catch(e){L('ERR',e.stack);}
L('errors',JSON.stringify(await g.close()));
