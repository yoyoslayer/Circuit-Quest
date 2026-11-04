import {launch} from '../cap.mjs';
const P='recheck-list-';const log=(...a)=>console.log(...a);
const g=await launch('meeting',{fullfx:true});
try{
await g.advance(.5);
let r=await g.walk(-11.2,-4.6,.4);r=await g.walk(-11.3,-7.6,.4);
await g.zoom(-1500);await g.orbit(0,-200);await g.shot(P+'04e-meeting-closet-pitchdown-o0');
await g.orbit(-500,0);await g.shot(P+'04f-meeting-closet-pitchdown-o-500');
await g.orbit(-250,0);await g.advance(.1);await g.shot(P+'04g-meeting-closet-pitchdown-o-750');
await g.orbit(750,200);await g.zoom(1500);
r=await g.walk(-8,-1.4,.5);r=await g.walk(-8.6,-3.9,.4);await g.key('KeyE');let s=await g.snap();log('held',s.held);
r=await g.walk(-8,-1.4,.5);r=await g.walk(6,-1.2,.5);r=await g.walk(9.95,-1.85,.12);s=r.state;
const d=Math.hypot(s.player.x-12.3,s.player.z+2.25);log('pip dist to target',d.toFixed(3),s.player);
await g.shot(P+'08a-strip-before-drop-2p4m');
await g.key('KeyE',.3);s=await g.snap();log('stripPlaced',s.stripPlaced,'held',s.held,JSON.stringify(s.items.find(i=>i.id==='strip')));
await g.shot(P+'08b-strip-after-drop-2p4m');
}catch(e){log('ERR',e.message);}
log('errors',JSON.stringify(await g.close()));
