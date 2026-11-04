import {launch} from '../cap.mjs';
const g=await launch('qfn',{fullfx:true});
const P='verify-qfn-teach-';const log=(...a)=>console.log(...a);
// Pure logic checks in the page (Vite serves the TS module).
const L=await g.page.evaluate(async()=>{const m=await import('/src/stations/qfn/logic.ts');const out={};
  const B=id=>m.BOARDS.find(b=>b.id===id);
  const run=(...pts)=>{const cells=[pts[0]];for(let i=1;i<pts.length;i++){let [x,y]=pts[i-1];const [x1,y1]=pts[i];while(x!==x1||y!==y1){if(x!==x1)x+=Math.sign(x1-x);else y+=Math.sign(y1-y);cells.push([x,y]);}}return cells;};
  // F4: J1 on the right edge
  const b1=B('sensor');const d={place:{...structuredClone(b1.start),J1:{at:[12,4],rot:2},R1:{at:[9,3],rot:0},C1:{at:[2,3],rot:1}},traces:[[[8,3],[9,3]],[[10,3],[12,3]],[[4,3],[2,3]],[[4,4],[2,4]],[[2,3],[1,3],[1,8],[12,8],[12,5]],[[2,4],[2,7],[11,7],[11,4],[12,4]]].map(p=>({layer:1,net:'',cells:run(...p)})),vias:[]};
  // assign nets by strokeNet on start
  for(const t of d.traces){t.net=m.strokeNet(b1,{...d,traces:[]},1,t.cells[0]).net??m.strokeNet(b1,d,1,t.cells[0]).net;}
  const r=m.check(b1,d);out.f4={tier:r.tier,problems:r.problems,cost:r.cost};
  // F1: reference driver with all layer-2 traces removed: still 4 thermal vias count?
  const b3=B('driver'),ref=structuredClone(m.REFERENCE.driver);const noL2={...ref,traces:ref.traces.filter(t=>t.layer===1)};const r3=m.check(b3,noL2);
  out.f1={thermal:r3.thermal,tier:r3.tier,problems:r3.problems.slice(0,2)};
  // Which EP vias touch layer-2 copper other than themselves?
  out.f1l2=ref.vias.map(v=>({at:v.at,l2:ref.traces.some(t=>t.layer===2&&t.cells.some(c=>c[0]===v.at[0]&&c[1]===v.at[1]))}));
  // F2: blank board 3 temp
  out.f2=m.check(b3,m.blank(b3)).thermal;
  // F7 numbers
  const T=(P,n)=>25+P/(1/110+n/300);out.f7=[0,3,4].map(n=>+T(1.6,n).toFixed(1));
  // F0 bead speed: loop lengths sensor ref vs farcap
  const s=structuredClone(m.REFERENCE.sensor);s.place.C1={at:[2,7],rot:0};out.f0={ref:m.check(b1,m.REFERENCE.sensor).loops[0].loop,far:m.check(b1,s).loops[0].loop,farNote:m.check(b1,s).notes[0]};
  // F0/DR-29: only C1<->U1 copper, J1 unconnected: does a loop path exist?
  const iso={place:structuredClone(m.REFERENCE.sensor.place),traces:[{layer:1,net:'VDD',cells:run([4,3],[2,3])},{layer:1,net:'GND',cells:run([4,4],[3,4])}],vias:[]};
  const ri=m.check(b1,iso);out.iso={tier:ri.tier,loop:ri.loops[0].loop,path:ri.loops[0].path.length,nets:ri.nets.map(n=>n.net+':'+n.joined+'/'+n.pads)};
  return {out,REF:m.REFERENCE};});
log(JSON.stringify(L.out,null,1));
async function toBench(){await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE');await g.advance(.3);await g.walk(0,-.5,.4);await g.key('KeyE');await g.advance(1.5);}
await g.advance(.3);await toBench();
// Board 1: reference placement, only C1-U1 copper (J1 not wired): CHECK -> beads?
for(const [id,pl] of Object.entries(L.REF.sensor.place)){if(id==='U1')continue;await g.act('move',{part:id,at:pl.at,rot:pl.rot});}
await g.act('trace',{cells:[[4,3],[3,3],[2,3]],layer:1});await g.act('trace',{cells:[[4,4],[3,4]],layer:1});
await g.act('check');await g.advance(.15);await g.shot(P+'01-b1-isolated-cap-check-0.15s');
await g.advance(.35);await g.shot(P+'02-b1-isolated-cap-check-0.5s');
const s=(await g.snap()).station;log('iso',JSON.stringify({tier:s.report.tier,loops:s.report.loops.map(l=>l.loop),nets:s.report.nets}));
await g.crop(P+'03-panel',{x:1120,y:90,width:310,height:300});
log('errors',JSON.stringify(await g.close()));
