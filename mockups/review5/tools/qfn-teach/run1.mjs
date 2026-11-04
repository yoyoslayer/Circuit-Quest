import {launch} from '../cap.mjs';
const g=await launch('qfn',{fullfx:true});
const P='qfn-teach-';
const log=(...a)=>console.log(...a);
const L=await g.page.evaluate(async()=>{const m=await import('/src/stations/qfn/logic.ts');return {REF:m.REFERENCE,BOARDS:m.BOARDS.map(b=>({id:b.id,parts:b.parts.map(p=>({id:p.id,locked:!!p.locked,kind:p.kind}))}))};});
const st=async()=>(await g.snap()).station;
const panel=n=>g.crop(P+n,{x:1120,y:90,width:310,height:300});
const toast=n=>g.crop(P+n,{x:300,y:740,width:840,height:110});
async function toBench(){await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE');await g.advance(.3);await g.walk(0,-.5,.4);await g.key('KeyE');await g.advance(1.5);}
async function place(ix,over={}){const b=L.BOARDS[ix],ref=L.REF[b.id];for(const [id,pl] of Object.entries({...ref.place,...over})){const p=b.parts.find(q=>q.id===id);if(p.locked||p.kind==='qfn')continue;const r=await g.act('move',{part:id,at:pl.at,rot:pl.rot});if(!r?.ok&&r!==true)log('move',id,JSON.stringify(r));}}
async function trace(cells,layer=1){const r=await g.act('trace',{cells,layer});log('trace',JSON.stringify(cells[0]),'->',JSON.stringify(r));return r;}
await g.advance(.3);
await toBench();
await g.shot(P+'01-bench-board1-start');
// FAIL 1: ship the scrambled board.
log('ship scrambled',JSON.stringify(await g.act('ship')));await g.advance(.2);
await g.shot(P+'02-ship-scrambled-fail');await toast('03-ship-fail-toast');
log('state',JSON.stringify({m:(await st()).mistakes,rings:(await st()).rings}));
// Board 1 with C1 down by the connector: works, not reliable.
const ref1=L.REF.sensor;
await place(0,{C1:{at:[2,7],rot:0}});
for(const t of ref1.traces)await trace(t.cells,1);
let s=await st();log('b1 far cap',JSON.stringify({tier:s.report.tier,notes:s.report.notes,problems:s.report.problems,loops:s.report.loops.map(l=>l.loop)}));
await g.shot(P+'04-b1-farcap-routed');
await g.act('check');await g.advance(.5);await g.shot(P+'05-b1-farcap-check-beads');await toast('06-b1-farcap-toast');await panel('07-b1-farcap-panel');
await g.advance(.8);await g.shot(P+'08-b1-farcap-beads-later');
// Ship it at tier 1: what does the player see?
await g.act('ship');await g.advance(.3);await g.shot(P+'09-b1-ship-tier1');await toast('10-b1-ship-tier1-toast');
s=await st();log('shipped',JSON.stringify(s.shipped),'board',s.board);
// Board 2: C2 far in the corner (the unit test's variant), then fixed.
await g.advance(1);
await g.shot(P+'11-b2-start');
const ref2=L.REF.mcu;
await place(1);
for(const t of ref2.traces)await trace(t.cells,1);
await g.act('check');await g.advance(.4);await g.shot(P+'12-b2-ref-check');
await g.act('ship');await g.advance(1.2);
// Board 3: before anything is wired.
s=await st();log('b3 start',JSON.stringify({thermal:s.report.thermal,notes:s.report.notes}));
await g.shot(P+'13-b3-start-chip-hot-unpowered');
await g.crop(P+'14-b3-start-chip-crop',{x:560,y:230,width:340,height:260});
const ref3=L.REF.driver;
await place(2);
for(const t of ref3.traces.filter(t=>t.layer===1))await trace(t.cells,1);
// vias except the thermal ones
const isEP=v=>v.at[0]>=5&&v.at[0]<=7&&v.at[1]>=3&&v.at[1]<=5;
for(const v of ref3.vias.filter(v=>!isEP(v)))log('via',JSON.stringify(v.at),JSON.stringify(await g.act('via',v.at)));
await g.act('layer',2);for(const t of ref3.traces.filter(t=>t.layer===2))await trace(t.cells,2);
await g.act('layer',1);
s=await st();log('b3 no thermal vias',JSON.stringify({tier:s.report.tier,thermal:s.report.thermal,notes:s.report.notes,problems:s.report.problems}));
await g.act('check');await g.advance(.4);await g.shot(P+'15-b3-no-thermal-check');await toast('16-b3-no-thermal-toast');await panel('17-b3-no-thermal-panel');
// arm via: what the chip looks like while dropping vias
await g.act('arm');await g.advance(.2);await g.shot(P+'18-b3-via-armed-chip');await g.act('arm');
let n=0;for(const v of ref3.vias.filter(isEP)){await g.act('via',v.at);n++;s=await st();log('thermal vias',n,JSON.stringify(s.report.thermal));await g.advance(.2);await g.crop(P+`19-b3-vias-${n}`,{x:540,y:200,width:880,height:320});}
await g.act('check');await g.advance(.4);await g.shot(P+'20-b3-ref-check');
await g.act('ship');await g.advance(2.5);await g.shot(P+'21-win');
await g.advance(3);await g.shot(P+'22-result');
s=await g.snap();log('won',s.won,JSON.stringify(s.station?.shipped),'mist',s.station?.mistakes);
log('errors',JSON.stringify(await g.close()));
