import {launch,item,d2,retrieve,fmt} from './lib.mjs';
const K='stuck-softlock';const g=await launch('meeting',{fullfx:true});const L=(...a)=>console.log(...a);
const route=async(pts,r=.4)=>{for(const [x,z] of pts){const o=await g.walk(x,z,r,20);if(!o.arrived)L('  stall',x,z,fmt(o.state.player));}};
try{
await g.advance(.5);let s;
for(const [id,grabAt] of [['coupler',[-3.65,5.3]],['extension',[-3,5.3]]]){
 await route([[-9,-1],[-9,5.3],grabAt],.3);await g.key('KeyE');s=await g.snap();L(id,'held',s.held);
 for(const zz of [-1.4,-1.0,-1.8]){await route([[-9,5.3],[-9,-1]]);await g.walk(-13.5,zz+1.8,.25,15);await g.walk(-13.5,zz,.15,10);await g.key('Space',.36);await g.key('KeyQ',.02);await g.advance(2);s=await g.snap();const p=item(s,id).pos;L(' throw',zz,'->',fmt(p));
   if(p.x<-11.9&&p.z<-5.5&&p.y<2)break;const r=await retrieve(g,id);if(!r.ok){L(' lost elsewhere',JSON.stringify(r));break;}}
 await g.advance(10);s=await g.snap();const p=item(s,id).pos;const r=await retrieve(g,id);L(id,'after10',fmt(p),'retrieve',JSON.stringify(r));
 await g.shot(`${K}-19-meeting-${id}-in-closet-after10s`);if(r.ok)await g.key('KeyE');
}
}catch(e){L('ERR',e.message);}
L('errors',JSON.stringify(await g.close()));
