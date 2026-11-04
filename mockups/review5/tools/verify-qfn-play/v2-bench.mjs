import {launch} from '../cap.mjs';
const txt=g=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText?.replace(/\n+/g,' | '),prompt:[...document.querySelectorAll('.prompt-pill')].filter(e=>!e.hidden).map(e=>e.innerText.replace(/\n/g,' ')).join(' / '),toast:[...document.querySelectorAll('.station-toast')].filter(e=>!e.hidden).map(e=>e.innerText).join(' / ')}));
const g=await launch('qfn',{fullfx:true});const P=g.page;
const st=async()=>(await g.snap()).station;
await g.advance(.3);await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE',.2);await g.walk(0,-.5,.4);await g.key('KeyE');await g.advance(1.5);await P.waitForTimeout(1200);
let s=await st();const c=s.cells;console.log('start prompt',JSON.stringify(await txt(g)),'problems',JSON.stringify(s.report.problems),'place',JSON.stringify(s.design.place));
await g.shot('verify-qfn-play-10-bench-start');
const mv=async(k,steps=4)=>{const [x,y]=c[k];await P.mouse.move(x,y,{steps});await g.advance(.03);};
// pad drag on C1
const cp=s.design.place.C1.at;console.log('C1 at',cp);
const padKey=`${cp[0]+1},${cp[1]}`;await mv(padKey);console.log('hover pad body?',(await st()).hoverBody);
await P.mouse.down();for(const k of [`${cp[0]},${cp[1]}`,`${cp[0]-1},${cp[1]}`,`${cp[0]-2},${cp[1]}`])await mv(k);
await P.mouse.up();await g.advance(.1);s=await st();console.log('after pad drag C1',JSON.stringify(s.design.place.C1),'traces',s.design.traces.length,JSON.stringify(await txt(g)));
if(s.design.traces.length)await g.act('undo');
// body drag with ratsnest check
s=await st();const b=s.bodies;await P.mouse.move(...b.C1,{steps:3});await g.advance(.05);
await P.mouse.down();for(const k of ['7,6','5,6','3,5'])await mv(k);s=await st();console.log('mid-drag',JSON.stringify(s.drag),JSON.stringify(await txt(g)));await g.shot('verify-qfn-play-11-mid-drag');
await P.mouse.up();await g.advance(.1);s=await st();console.log('after body drag',JSON.stringify(s.design.place.C1));
// ship scrambled
await g.act('ship');await g.advance(.3);s=await g.snap();console.log('sent back',s.station.mistakes,'rings',s.station.rings,'alarmed',s.alarmed,JSON.stringify(s.station.report.problems),JSON.stringify(await txt(g)));await g.shot('verify-qfn-play-12-sent-back');
await g.act('undo');
// solve board 1 & 2 with the reference
const ref=await P.evaluate(async()=>{const m=await import('/src/stations/qfn/logic.ts');return {B:m.BOARDS.map(b=>({id:b.id,parts:b.parts.map(p=>({id:p.id,kind:p.kind,locked:p.locked}))})),R:m.REFERENCE};});
async function play(ix){const bb=ref.B[ix],rf=ref.R[bb.id];
  for(const [id,pl] of Object.entries(rf.place)){const p=bb.parts.find(q=>q.id===id);if(p.locked||p.kind==='qfn')continue;await g.act('move',{part:id,at:pl.at,rot:pl.rot});}
  for(const t of rf.traces.filter(t=>t.layer===1))await g.act('trace',{cells:t.cells,layer:1});
  for(const v of rf.vias)await g.act('via',v.at);
  const l2=rf.traces.filter(t=>t.layer===2);if(l2.length){await g.act('layer',2);for(const t of l2)await g.act('trace',{cells:t.cells,layer:2});}}
await play(0);await g.advance(.2);await g.shot('verify-qfn-play-13-b1-routed');
await g.act('check');await g.advance(.4);await g.crop('verify-qfn-play-14-crop-loop',{x:440,y:250,width:300,height:200});
await g.act('ship');await g.advance(.3);console.log('after ship1',JSON.stringify(await txt(g)));await g.shot('verify-qfn-play-15-after-ship1');
await play(1);await g.act('ship');await g.advance(.3);s=await st();console.log('board3 start thermal',JSON.stringify(s.report.thermal),'nets',JSON.stringify(s.report.nets));await g.shot('verify-qfn-play-16-b3-start');
await g.crop('verify-qfn-play-17-crop-chip',{x:600,y:250,width:240,height:180});
await g.key('Escape',.3);await g.advance(6);console.log('stood +6s',JSON.stringify(await txt(g)));
console.log('errors',await g.close());
