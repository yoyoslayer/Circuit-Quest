// QFN fix verification shots (R-qfn batch). Needs a dev server: npx.cmd vite --port 4193 --strictPort
// BASE=http://127.0.0.1:4193 node mockups/review5/tools/fix-qfn/shots.mjs
import {launch} from '../cap.mjs';
const run=(net,...pts)=>{const cells=[pts[0]];for(let i=1;i<pts.length;i++){let [x,y]=pts[i-1];const [x1,y1]=pts[i];while(x!==x1||y!==y1){if(x!==x1)x+=Math.sign(x1-x);else y+=Math.sign(y1-y);cells.push([x,y]);}}return {net,cells};};
const g=await launch('qfn');
const log=(k,v)=>console.log(k,JSON.stringify(v));
const st=async()=>(await g.snap()).station;
const act=async(n,a)=>{const r=await g.act(n,a);if(!r.ok)console.log('FAILED',n,JSON.stringify(a));return r;};
const trace=async(t,layer=1)=>act('trace',{cells:t.cells,layer});
await g.advance(.3);
await g.walk(-8.8,2.95);await g.key('KeyE');await g.walk(1.3,-.6);await g.key('KeyE',.3);await g.walk(0,-.5,.4);await g.key('KeyE',1.5);
let s=await st();log('board1 start prompt',(await g.snap()).prompt??null);
await g.shot('fix-qfn-01-board1-start');
// Placement prompt, then the mirrored header on an edge.
await act('move',{part:'J1',at:[3,8],rot:3});s=await st();log('mirrored on edge problems',s.report.problems);
await act('check');await g.advance(.3);await g.shot('fix-qfn-02-board1-mirrored-check');
await act('swap');s=await st();log('after swap flip',s.design.place.J1);await g.advance(.3);await g.shot('fix-qfn-03-board1-swapped');
for(const [id,at,rot] of [['C1',[2,4],0],['R1',[9,3],1]])await act('move',{part:id,at,rot});
for(const t of [run('VDD',[4,3],[2,3],[2,8]),run('GND',[4,4],[3,4],[3,8]),run('OUT',[8,3],[9,3]),run('SIG',[9,4],[9,7],[4,7],[4,8])])await trace(t);
await act('check');await g.advance(.5);await g.shot('fix-qfn-04-board1-check-led');
await act('ship');await g.advance(.6);s=await st();log('ship1 testing',s.testing);await g.shot('fix-qfn-05-board1-bringup');
await g.advance(2.2);
// Board 2 with C2 in the far corner: works, not reliable.
for(const [id,at,rot] of [['J1',[0,3],0],['C1',[2,3],1],['C2',[11,7],1],['R1',[7,0],1]])await act('move',{part:id,at,rot});
await g.advance(.3);await g.shot('fix-qfn-06-board2-placed');
for(const t of [run('VDD',[4,3],[0,3]),run('GND',[4,4],[0,4]),run('VDD',[3,3],[3,0],[9,0],[9,4],[8,4]),run('RST',[7,1],[7,2]),
  run('GND',[3,4],[3,7],[10,7],[10,8],[11,8]),run('GND',[8,5],[10,5],[10,7]),run('VDD',[9,4],[11,4],[11,7])])await trace(t);
s=await st();log('board2 far report',{tier:s.report.tier,loops:s.report.loops.map(l=>[l.cap,l.loop]),notes:s.report.notes});
await act('check');await g.advance(.3);await g.shot('fix-qfn-07-board2-farcap-check-0.3s');await g.advance(.7);await g.shot('fix-qfn-08-board2-farcap-check-1.0s');
await act('ship');await g.advance(.5);await g.shot('fix-qfn-09-board2-ship-bringup-0.5s');await g.advance(1);await g.shot('fix-qfn-10-board2-ship-bringup-1.5s');
await g.advance(1.2);
// Board 3: cold until powered, then warms.
s=await st();log('board3 start thermal',s.report.thermal);await g.shot('fix-qfn-11-board3-start-cold');
for(const [id,at,rot] of [['C1',[2,3],1],['R1',[9,3],3]])await act('move',{part:id,at,rot});
await trace(run('VIN',[4,3],[0,3]));await trace(run('GND',[4,4],[0,4]));s=await st();log('board3 powered thermal',s.report.thermal);
await g.advance(.2);await g.shot('fix-qfn-12-board3-powered-0.2s');await g.advance(1.3);await g.shot('fix-qfn-13-board3-powered-1.5s');
await act('arm');await g.advance(.3);await g.shot('fix-qfn-14-board3-via-armed-xray');await act('arm');
// The room: survey.
await g.key('Escape',.5);await g.survey();await g.shot('fix-qfn-15-survey');
console.log('errors',JSON.stringify(await g.close()));
