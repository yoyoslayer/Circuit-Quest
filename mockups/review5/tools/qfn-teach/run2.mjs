import {launch} from '../cap.mjs';
const g=await launch('qfn',{fullfx:true});
const P='qfn-teach-';const log=(...a)=>console.log(...a);
const L=await g.page.evaluate(async()=>{const m=await import('/src/stations/qfn/logic.ts');return {REF:m.REFERENCE,BOARDS:m.BOARDS.map(b=>({id:b.id,parts:b.parts.map(p=>({id:p.id,locked:!!p.locked,kind:p.kind}))}))};});
const st=async()=>(await g.snap()).station;
const ok=r=>r&&(r===true||r.ok);
const toast=n=>g.crop(P+n,{x:300,y:740,width:840,height:110});
async function toBench(){await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE');await g.advance(.3);await g.walk(0,-.5,.4);await g.key('KeyE');await g.advance(1.5);}
async function place(ix,over={}){const b=L.BOARDS[ix],ref=L.REF[b.id];for(const [id,pl] of Object.entries({...ref.place,...over})){const p=b.parts.find(q=>q.id===id);if(p.locked||p.kind==='qfn')continue;const r=await g.act('move',{part:id,at:pl.at,rot:pl.rot});if(!ok(r))log('move fail',id);}}
const run=(...pts)=>{const cells=[pts[0]];for(let i=1;i<pts.length;i++){let [x,y]=pts[i-1];const [x1,y1]=pts[i];while(x!==x1||y!==y1){if(x!==x1)x+=Math.sign(x1-x);else y+=Math.sign(y1-y);cells.push([x,y]);}}return cells;};
async function tr(cells,layer=1){const r=await g.act('trace',{cells,layer});if(!ok(r))log('trace fail',JSON.stringify(cells[0]),(await st()).report?.problems?.[0]);}
await g.advance(.3);await toBench();
// Board 1, connector on the RIGHT edge instead of the reference's bottom edge.
await place(0,{J1:{at:[12,4],rot:2},R1:{at:[9,3],rot:0},C1:{at:[2,3],rot:1}});
for(const c of [run([8,3],[9,3]),run([10,3],[12,3]),run([4,3],[2,3]),run([4,4],[2,4]),run([2,3],[1,3],[1,8],[12,8],[12,5]),run([2,4],[2,7],[11,7],[11,4],[12,4])])await tr(c);
let s=await st();log('b1 right edge',JSON.stringify({tier:s.report.tier,cost:s.report.cost,problems:s.report.problems,notes:s.report.notes}));
await g.act('check');await g.advance(.4);await g.shot(P+'30-b1-connector-right-edge-reliable');
await g.act('ship');await g.advance(.5);await toast('31-b1-ship-tier2-toast');
// Board 2 reference
const r2=L.REF.mcu;await place(1);for(const t of r2.traces)await tr(t.cells);
// Board 2 variant: move C2 one cell further first, to see the "loop" number move
await g.act('check');await g.advance(.3);await g.act('ship');await g.advance(1.2);
// Board 3: everything but one thermal via.
const r3=L.REF.driver;await place(2);
for(const t of r3.traces.filter(t=>t.layer===1))await tr(t.cells);
const skip=v=>v.at[0]===6&&v.at[1]===5;
for(const v of r3.vias.filter(v=>!skip(v)))if(!ok(await g.act('via',v.at)))log('via fail',v.at);
await g.act('layer',2);for(const t of r3.traces.filter(t=>t.layer===2))await tr(t.cells,2);
await g.advance(.2);await g.shot(P+'32-b3-layer2-view');
await g.act('layer',1);
s=await st();log('b3 3 vias',JSON.stringify({tier:s.report.tier,thermal:s.report.thermal,notes:s.report.notes}));
await g.act('check');await g.advance(.4);await g.shot(P+'33-b3-three-vias-works');await toast('34-b3-three-vias-toast');
await g.act('via',[6,5]);await g.act('check');await g.advance(.4);await g.shot(P+'35-b3-four-vias-elegant');
await g.act('ship');await g.advance(.4);await g.shot(P+'36-b3-shipped');await g.advance(2.5);await g.shot(P+'37-win');await g.advance(3);await g.shot(P+'38-result');
s=await g.snap();log('won',s.won,JSON.stringify(s.station?.shipped),'mist',s.station?.mistakes,'spent',s.station?.spent,'cost',s.cost,'time',s.time);
log('errors',JSON.stringify(await g.close()));
