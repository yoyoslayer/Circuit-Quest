import {launch} from '../cap.mjs';import {txt,log} from './common.mjs';
const g=await launch('qfn',{fullfx:true});
const T=async l=>{const s=await g.snap();log(l,{t:s.time.toFixed(1),p:[s.player.x.toFixed(2),s.player.z.toFixed(2)],held:s.held,atBench:s.atBench},await txt(g));return s;};
await g.advance(.3);
let r=await g.walk(-8.8,2.95,.5);await T('at crate '+r.arrived);await g.shot('qfn-play-10-at-crate');
await g.key('KeyE');await T('grabbed');await g.shot('qfn-play-11-carry');
r=await g.walk(1.3,-.6,.5);await T('near bench '+r.arrived);await g.shot('qfn-play-12-carry-at-bench');
await g.key('KeyE',.2);let s=await T('dropped');log('partsReady',s.station.partsReady);await g.advance(.6);await g.shot('qfn-play-13-crate-landed');
r=await g.walk(0,-.5,.4);await T('stand '+r.arrived);
await g.key('KeyE');await g.advance(1.2);s=await T('bench');await g.shot('qfn-play-14-bench-board1');
// reference
const ref=await g.page.evaluate(async()=>{const m=await import('/src/stations/qfn/logic.ts');return {B:m.BOARDS.map(b=>({id:b.id,parts:b.parts.map(p=>({id:p.id,kind:p.kind,locked:p.locked}))})),R:m.REFERENCE};});
async function play(ix,shotMid){const b=ref.B[ix],rf=ref.R[b.id];
  for(const [id,pl] of Object.entries(rf.place)){const p=b.parts.find(q=>q.id===id);if(p.locked||p.kind==='qfn')continue;const a=await g.act('move',{part:id,at:pl.at,rot:pl.rot});if(!a.ok)log('move fail',id);}
  await g.advance(.3);if(shotMid)await g.shot(shotMid+'-placed');log('placed',await txt(g));
  for(const t of rf.traces.filter(t=>t.layer===1)){const a=await g.act('trace',{cells:t.cells,layer:1});if(!a.ok)log('trace fail');}
  for(const v of rf.vias){const a=await g.act('via',v.at);if(!a.ok)log('via fail',v.at);}
  const l2=rf.traces.filter(t=>t.layer===2);if(l2.length){await g.act('layer',2);for(const t of l2){const a=await g.act('trace',{cells:t.cells,layer:2});if(!a.ok)log('l2 fail');}}
}
for(let ix=0;ix<3;ix++){
  await play(ix,`qfn-play-${20+ix*5}-b${ix+1}`);await g.advance(.3);log('routed',await txt(g));await g.shot(`qfn-play-${21+ix*5}-b${ix+1}-routed`);
  await g.act('check');await g.advance(.5);log('checked',await txt(g));await g.shot(`qfn-play-${22+ix*5}-b${ix+1}-check`);
  await g.act('ship');await g.advance(.3);log('shipped',await txt(g));await g.shot(`qfn-play-${23+ix*5}-b${ix+1}-shipped`);
}
s=await g.snap();log('won',s.won,s.time,s.damage,s.cost,s.station.shipped,s.station.spent);
await g.page.waitForTimeout(500);await g.shot('qfn-play-36-win-pushin');
await g.page.waitForTimeout(4000);await g.shot('qfn-play-37-result');
log(await g.page.evaluate(()=>document.querySelector('.result, .result-card, [class*=result]')?.innerText));
log('errors',await g.close());
