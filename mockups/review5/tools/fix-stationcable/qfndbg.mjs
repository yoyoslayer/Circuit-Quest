// Debug: board 1 reference route after a tossed crate (why a trace is refused).
import {launch} from '../cap.mjs';
const g=await launch('qfn',{fullfx:false});await g.advance(.2);
await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(-3.7,1.15,.4);await g.key('KeyQ',3);
await g.page.evaluate(()=>{window.__game.connected=true;});
await g.walk(0,-.5,.4);await g.key('KeyE',1.2);
const r=await g.page.evaluate(async()=>{const {BOARDS,REFERENCE}=await import('/src/stations/qfn/logic.ts');const G=window.__game,d=window.__circuitCrew.drive,b=BOARDS[0],ref=REFERENCE[b.id],out=[];
  const now=G.station.design.place;
  for(const [id,pl] of Object.entries(ref.place)){const p=b.parts.find(q=>q.id===id);if(p.locked||p.kind==='qfn'||(now[id].at+''===pl.at+''&&now[id].rot===pl.rot))continue;out.push(['move',id,d.act('move',{part:id,at:pl.at,rot:pl.rot}).ok]);}
  for(const t of ref.traces.filter(t=>t.layer===1)){const ok=d.act('trace',{cells:t.cells,layer:1}).ok;out.push(['trace',ok,ok?'':document.querySelector('.station-toast')?.textContent]);}
  return out;});
console.log(JSON.stringify(r,null,1));await g.close();
