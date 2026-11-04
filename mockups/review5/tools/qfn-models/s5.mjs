import {open,P} from './common.mjs';
const g=await open();
await g.advance(.5);
const L=await g.page.evaluate(async()=>{const M=await import('/src/stations/qfn/logic.ts');return {BOARDS:M.BOARDS.map(b=>({id:b.id,parts:b.parts.map(p=>({id:p.id,kind:p.kind,locked:p.locked}))})),REF:M.REFERENCE};});
await g.walk(-8.8,2.95,.5);await g.key('KeyE',.3);
// carry geometry
const c=await g.snap();const it=c.items.find(i=>i.id==='parts');console.log('carry player',JSON.stringify(c.player),'crate',JSON.stringify(it.pos));
await g.walk(1.3,-.6,.5);await g.key('KeyE',.4);await g.walk(0,-.5,.4);await g.key('KeyE',.2);await g.advance(1.5);
const ok=async(n,a)=>{const r=await g.act(n,a);if(!r.ok)console.log('FAIL',n,JSON.stringify(a));};
async function play(ix,shotMid){const b=L.BOARDS[ix],ref=L.REF[b.id];
  for(const [id,pl] of Object.entries(ref.place)){const p=b.parts.find(q=>q.id===id);if(p.locked||p.kind==='qfn')continue;await ok('move',{part:id,at:pl.at,rot:pl.rot});}
  if(shotMid){await g.advance(.3);await g.shot(`${P}-${shotMid}`);}
  for(const t of ref.traces.filter(t=>t.layer===1))await ok('trace',{cells:t.cells,layer:1});
  for(const v of ref.vias)await ok('via',v.at);
  const l2=ref.traces.filter(t=>t.layer===2);if(l2.length){await ok('layer',2);for(const t of l2)await ok('trace',{cells:t.cells,layer:2});}}
await play(0,'40-board1-placed');
await g.advance(.2);await g.shot(`${P}-41-board1-routed`);
await ok('check');await g.advance(.6);await g.shot(`${P}-42-board1-check`);
await ok('ship');await g.advance(.6);await g.shot(`${P}-43-board1-shipped-board2-drop`);
await g.advance(1);await g.shot(`${P}-44-board2-start`);
await play(1);await ok('check');await g.advance(.5);await g.shot(`${P}-45-board2-check-loops`);
await ok('ship');await g.advance(1.5);await g.shot(`${P}-46-board3-start`);
// board 3: place, route L1 only, no vias -> hot chip
{const b=L.BOARDS[2],ref=L.REF[b.id];for(const [id,pl] of Object.entries(ref.place)){const p=b.parts.find(q=>q.id===id);if(p.locked||p.kind==='qfn')continue;await ok('move',{part:id,at:pl.at,rot:pl.rot});}
 for(const t of ref.traces.filter(t=>t.layer===1))await ok('trace',{cells:t.cells,layer:1});}
await g.advance(1);await g.shot(`${P}-47-board3-hot-chip`);
await ok('layer',2);await g.advance(.4);await g.shot(`${P}-48-board3-layer2-xray`);
await ok('layer',1);
{const ref=L.REF[L.BOARDS[2].id];for(const v of ref.vias)await ok('via',v.at);await ok('layer',2);for(const t of ref.traces.filter(t=>t.layer===2))await ok('trace',{cells:t.cells,layer:2});}
await ok('check');await g.advance(.5);await g.shot(`${P}-49-board3-check`);
await ok('ship');await g.advance(.3);await g.shot(`${P}-50-win-0s`);
await g.advance(1.5);await g.shot(`${P}-51-win-push`);
await g.advance(3);await g.shot(`${P}-52-win-result`);
const s=await g.snap();console.log('won',s.won,JSON.stringify(s.station.shipped));
console.log('errors',JSON.stringify(await g.close()));
