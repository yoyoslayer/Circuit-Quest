import {launch,item,fmt} from '../stuck-softlock/lib.mjs';
const K='p0check-gap1-stuck-respawn-softlock';const g=await launch('meeting',{fullfx:true});const L=(...a)=>console.log(...a);
try{await g.advance(.5);
for(const [x,z,key] of [[-12.5,-5.0,'KeyW'],[-12.5,-5.0,'KeyS'],[-11.4,-7.5,'KeyA'],[-11.4,-7.5,'KeyD']]){await g.walk(x,z,.2,10);let my=0,s;
 for(let i=0;i<6;i++){await g.page.keyboard.down(key);await g.key('Space',.25);s=await g.snap();my=Math.max(my,s.player.y);await g.advance(.3);await g.page.keyboard.up(key);s=await g.snap();my=Math.max(my,s.player.y);}
 L(x,z,key,'maxY',my.toFixed(2),'end',fmt(s.player),'inside',s.player.x<-11.9&&s.player.z<-5.5);}
await g.walk(-12.5,-5.0,.2,10);await g.page.keyboard.down('KeyW');await g.key('Space',.3);await g.page.keyboard.up('KeyW');await g.shot(`${K}-04-hop-at-closet-front`);
const s=await g.snap();L('perch',fmt(s.player));
}catch(e){L('ERR',e.stack);}L('errors',JSON.stringify(await g.close()));
