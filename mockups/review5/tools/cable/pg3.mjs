import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
for(const mode of ['idle','held']){
const g=await launch('playground',{fullfx:true});
await g.advance(.5);await g.key('KeyF');
let r=await g.walk(9,3.7);
let s=await g.advance(2.5,['KeyW','ShiftLeft']);log(mode,'taut',s.rope.strain.toFixed(3));
const items0=s.items.filter(i=>i.id?.startsWith('pin'));
if(mode==='idle'){for(const t of [.1,.2,.4,1]){s=await g.advance(t===.1?.1:t-.1>0?.1:.1);}
  s=await g.advance(.3);log('after standing .7s strain',s.rope.strain.toFixed(4),'energy-ish',((s.rope.length-19)**2*60).toFixed(2));
  log('prompt',await g.page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&/slingshot|Drop the plug/.test(e.textContent)).map(e=>e.textContent).join('|')));}
await g.page.keyboard.press('KeyQ');
s=await g.advance(1/60);log(mode,'fastest right after',s.fastestProp.toFixed(2));
if(mode==='held'){await g.shot('cable-26-pg-sling-held-0s');}
s=await g.advance(.2);log(mode,'fastest .2',s.fastestProp.toFixed(2),'alarmed',s.alarmed);
if(mode==='held'){await g.shot('cable-27-pg-sling-held-0.2s');}
s=await g.advance(1.5);const items1=s.items.filter(i=>i.id?.startsWith('pin'));
log(mode,'pins down',s.pinsDown,'damage',s.damage,'pin moves',items1.map((p,i)=>Math.hypot(p.pos.x-items0[i].pos.x,p.pos.z-items0[i].pos.z).toFixed(2)).join(','));
if(mode==='held'){await g.shot('cable-28-pg-sling-held-after');}
log(await g.close());}
