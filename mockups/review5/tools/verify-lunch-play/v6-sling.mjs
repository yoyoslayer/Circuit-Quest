import {launch} from '../cap.mjs';
const P='verify-lunch-play-';
const g=await launch('lunch',{fullfx:true});
const st=async(tag)=>{const s=await g.snap();const c=s.lunch.cables.find(c=>c.id==='thin-2');console.log(tag,'pip',s.player.x.toFixed(2),s.player.z.toFixed(2),'strain',c.strain.toFixed(3),'held',s.lunch.held?.id,'pts',s.lunch.cablePoints['thin-2'].length);return s;};
await g.key('KeyF');await st('grab');
for(const [x,z] of [[0,1.5],[0,-1.5],[-0.3,-2.6],[3,-2.6],[7.3,-1.2],[9.2,-1],[10.5,-3],[14,-6],[15.6,-9.4]]){await g.walk(x,z,.4,12);await st('at '+x+','+z);}
const before=(await g.snap()).items.map(i=>({id:i.id,...i.pos}));
let s;for(let i=0;i<4;i++){s=await g.advance(.5,['KeyD','KeyW','ShiftLeft']);await st('sprint '+i);}
await g.shot(P+'20-overstretch-routed');
const pos0=(await g.snap()).props;
await g.page.keyboard.press('KeyQ');s=await g.advance(.15);console.log('after Q fastest',s.fastestProp.toFixed(2),'alarmed',s.alarmed,'shake?');
await g.shot(P+'21-routed-release');
s=await g.advance(1.5);const moved=s.items.map(i=>{const b=before.find(q=>q.id===i.id);return [i.id,Math.hypot(i.pos.x-b.x,i.pos.z-b.z)];}).filter(v=>v[1]>.3);console.log('id items moved>0.3',JSON.stringify(moved),'alarmed',s.alarmed,'dmg',s.damage);
console.log('errors',await g.close());
