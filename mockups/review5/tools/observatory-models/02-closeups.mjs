import {launch} from '../cap.mjs';
const P='observatory-models-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
await g.advance(.5);await g.zoom(-2000);
const at=async(x,z,name,views)=>{const r=await g.walk(x,z,.5,40);const s=await g.snap();log(name,'arrived',r?.arrived,JSON.stringify(s.player));
  for(const [dx,dy,suffix] of views){if(dx||dy)await g.orbit(dx,dy);await g.shot(P+name+suffix);}};
// Reading corner near spawn: beanbags + lamp
await at(-6.6,4.4,'10-reading-corner',[[0,0,''],[350,0,'-o90'],[-700,0,'-o-90']]);await g.orbit(350,0);
await at(-8.4,5.6,'11-crates-lamp',[[0,0,''],[-350,0,'-o-90']]);await g.orbit(350,0);
await at(-5.2,-2.4,'12-dome',[[0,0,''],[250,0,'-o70'],[-500,0,'-o-70'],[250,-250,'-high']]);await g.orbit(0,250);
await at(-2.4,-1.2,'13-rack-motor',[[0,0,''],[350,0,'-o90'],[-700,0,'-o-90'],[350,-250,'-high']]);await g.orbit(0,250);
log('errors',JSON.stringify(await g.close()));
