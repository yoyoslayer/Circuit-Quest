import {launch} from '../cap.mjs';
const g=await launch('qfn',{fullfx:true});
const P='verify-qfn-teach-';const log=(...a)=>console.log(...a);
// Pure logic checks in the page (Vite serves the TS module).
const L=await g.page.evaluate(async()=>{const m=await import("/src/stations/qfn/logic.ts");return {out:{},REF:m.REFERENCE};});
log(JSON.stringify(L.out,null,1));
async function toBench(){await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE');await g.advance(.3);await g.walk(0,-.5,.4);await g.key('KeyE');await g.advance(1.5);}
await g.advance(.3);await toBench();
// Board 1: reference placement, only C1-U1 copper (J1 not wired): CHECK -> beads?
for(const [id,pl] of Object.entries(L.REF.sensor.place)){if(id==='U1')continue;await g.act('move',{part:id,at:pl.at,rot:pl.rot});}
await g.act('trace',{cells:[[4,3],[3,3],[2,3],[2,4]],layer:1});await g.act('trace',{cells:[[4,4],[3,4]],layer:1});
await g.act('check');await g.advance(.15);await g.shot(P+'04-b1-isolated-cap-check-0.15s');
await g.advance(.35);await g.shot(P+'05-b1-isolated-cap-check-0.5s');
const s=(await g.snap()).station;log('iso',JSON.stringify({tier:s.report.tier,loops:s.report.loops.map(l=>l.loop),nets:s.report.nets}));
await g.crop(P+'06-b1-isolated-panel',{x:1120,y:90,width:310,height:300});
await g.advance(1.0);await g.shot(P+'07-b1-isolated-cap-check-1.5s');log('errors',JSON.stringify(await g.close()));
