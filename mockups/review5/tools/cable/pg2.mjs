import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});
const log=(...a)=>console.log(...a);
await g.advance(.5);await g.key('KeyF');
// spec slingshot: walk to (9,3.7), sprint north
let r=await g.walk(9,3.7);log('at',r.state.player,r.state.rope.strain.toFixed(3),r.state.rope.bends);
await g.shot('cable-20-pg-sling-approach');
let s=await g.advance(2.5,['KeyW','ShiftLeft']);log('taut',s.rope.strain.toFixed(3),s.player,'pins',s.pinsDown);
await g.shot('cable-21-pg-sling-taut-red');
await g.zoom(-1500);await g.shot('cable-22-pg-sling-taut-red-close');await g.zoom(1500);
// prompt text
log('prompt',await g.page.evaluate(()=>document.body.innerText.split('\n').filter(t=>/slingshot|Drop|Q /.test(t)).join('|')));
const items0=(await g.snap()).items.filter(i=>i.id?.startsWith('pin'));
await g.page.keyboard.press('KeyQ');await g.advance(.05);await g.shot('cable-23-pg-sling-release-0s');
s=await g.advance(.25);log('after .3',s.fastestProp.toFixed(2),'pins',s.pinsDown);await g.shot('cable-24-pg-sling-release-0.3s');
s=await g.advance(1.5);log('after 1.8',s.pinsDown,s.damage);await g.shot('cable-25-pg-sling-after');
const items1=s.items.filter(i=>i.id?.startsWith('pin'));log('pin moves',items1.map((p,i)=>Math.hypot(p.pos.x-items0[i].pos.x,p.pos.z-items0[i].pos.z).toFixed(2)).join(','));
log('plug pos after',s.rope.length.toFixed(2),s.rope.bends);
log(await g.close());
