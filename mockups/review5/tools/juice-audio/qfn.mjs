import {launch,now} from './hook.mjs';
const g=await launch('qfn');await g.advance(.3);await g.drain('start');
await g.walk(-8.8,2.95,.5);await g.page.keyboard.press('KeyE');await g.drain('grab crate');
await g.walk(1.3,-.6,.5);await g.page.keyboard.press('KeyE');await g.advance(.2);await g.drain('crate to bench');
await g.walk(0,-.5,.4);await g.page.keyboard.press('KeyE');await g.advance(1.2);await g.drain('sit + parts drop');
let r=await g.act('ship');console.log('ship scrambled ok',r.ok);await g.advance(.1);await now(g,'juice-audio-26-qfn-sendback-instant');await g.drain('SHIP scrambled: SEND BACK');
await g.advance(1);await g.shot('juice-audio-27-qfn-sendback-settled');
console.log('toast',await g.page.evaluate(()=>document.querySelector('.station-toast')?.textContent));
r=await g.act('check');await g.drain('CHECK on bad board');
// play reference boards via the dev server's module
const n=await g.page.evaluate(async()=>{const m=await import('/src/stations/qfn/logic.ts');window.__qfn=m;return m.BOARDS.length;});
for(let ix=0;ix<n;ix++){
  const acts=await g.page.evaluate(ix=>{const {BOARDS,REFERENCE}=window.__qfn;const b=BOARDS[ix],ref=REFERENCE[b.id];const out=[];
    for(const [id,pl] of Object.entries(ref.place)){const p=b.parts.find(q=>q.id===id);if(p.locked||p.kind==='qfn')continue;out.push(['move',{part:id,at:pl.at,rot:pl.rot}]);}
    for(const t of ref.traces.filter(t=>t.layer===1))out.push(['trace',{cells:t.cells,layer:1}]);for(const v of ref.vias)out.push(['via',v.at]);
    const l2=ref.traces.filter(t=>t.layer===2);if(l2.length){out.push(['layer',2]);for(const t of l2)out.push(['trace',{cells:t.cells,layer:2}]);}return out;},ix);
  for(const [a,b] of acts){const x=await g.act(a,b);if(!x.ok)console.log('fail',a);}
  await g.drain(`board ${ix+1} laid out (${acts.length} acts)`);
  await g.act('check');await g.drain(`board ${ix+1} CHECK`);
  await g.act('ship');if(ix===n-1)await now(g,'juice-audio-28-qfn-final-ship-instant');await g.page.waitForTimeout(800);await g.drain(`board ${ix+1} SHIP`);await g.advance(.6);
}
await g.advance(.3);console.log('won',(await g.snap()).won);await g.drain('win');await g.shot('juice-audio-29-qfn-win');await g.page.waitForTimeout(3000);await g.drain('result');
console.log('errors',await g.close());
