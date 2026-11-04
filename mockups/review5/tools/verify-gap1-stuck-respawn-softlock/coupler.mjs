import {launch,item,d2,retrieve,fmt} from '../stuck-softlock/lib.mjs';
const K='verify-gap1-stuck-respawn-softlock';const g=await launch('meeting',{fullfx:true});const L=(...a)=>console.log(...a);
const route=async(pts,r=.4)=>{for(const [x,z] of pts){await g.walk(x,z,r,20);}};
try{await g.advance(.5);let s;
await route([[-9,-1],[-9,5.3],[-3.65,5.3]],.3);await g.key('KeyE');s=await g.snap();L('held',s.held);
for(const zz of [-1.25,-1.4,-1.0]){await route([[-9,5.3],[-9,-1]]);await g.walk(-13.5,zz+1.8,.25,15);await g.walk(-13.5,zz,.15,10);await g.key('Space',.36);await g.key('KeyQ',.02);await g.advance(2);s=await g.snap();const p=item(s,'coupler').pos;L('throw',zz,fmt(p));if(p.x<-11.9&&p.z<-5.5)break;const r=await retrieve(g,'coupler');L(JSON.stringify(r));if(!r.ok)break;}
await g.advance(10);s=await g.snap();L('coupler after10',fmt(item(s,'coupler').pos),'ext',fmt(item(s,'extension').pos),'cart',fmt(item(s,'mail-cart').pos));
await g.shot(`${K}-04-meeting-coupler-in-closet`);
// Can the job still be finished another way? coffee reel route
}catch(e){L('ERR',e.stack);}
L('errors',JSON.stringify(await g.close()));
