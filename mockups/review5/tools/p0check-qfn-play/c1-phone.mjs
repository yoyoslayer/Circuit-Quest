// p0check: can a phone player (portrait and landscape) reach TURN/LAYER/VIA/CHECK/SHIP and ship board 1?
import {launch} from '../cap.mjs';
const [W,H,tag]=process.argv.slice(2);const w=+W||390,h=+H||844,name=tag||'portrait';
const g=await launch('qfn',{fullfx:true,width:w,height:h});
await g.advance(.3);await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE',.2);await g.walk(0,-.5,.4);await g.key('KeyE');await g.advance(1.5);await g.page.waitForTimeout(800);
const s0=(await g.snap()).station;const xs=Object.values(s0.cells).map(c=>c[0]),ys=Object.values(s0.cells).map(c=>c[1]);
console.log(name,'atBench',(await g.snap()).atBench,'cells x',Math.min(...xs).toFixed(0),Math.max(...xs).toFixed(0),'y',Math.min(...ys).toFixed(0),Math.max(...ys).toFixed(0));
// Scan the canvas with synthetic pointermoves; the station sets cursor:pointer over a clickable puck.
const hits=await g.page.evaluate(([w,h])=>{const c=document.querySelector('canvas');const out=[];for(let y=0;y<h;y+=6)for(let x=0;x<w;x+=6){c.dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:y,bubbles:true}));if(document.body.style.cursor==='pointer')out.push([x,y]);}return out;},[w,h]);
// cluster
const cl=[];for(const p of hits){let k=cl.find(c=>c.pts.some(q=>Math.abs(q[0]-p[0])<=6&&Math.abs(q[1]-p[1])<=6));if(!k){k={pts:[]};cl.push(k);}k.pts.push(p);}
const boxes=cl.map(c=>{const X=c.pts.map(p=>p[0]),Y=c.pts.map(p=>p[1]);return {x0:Math.min(...X),x1:Math.max(...X),y0:Math.min(...Y),y1:Math.max(...Y),cx:Math.round((Math.min(...X)+Math.max(...X))/2),cy:Math.round((Math.min(...Y)+Math.max(...Y))/2)};});
console.log(name,'clickable clusters',JSON.stringify(boxes));
await g.shot(`p0check-qfn-play-${name}-01-bench`);
// Solve board 1 by the reference (same as the spec), then try to SHIP with a real click.
await g.page.evaluate(async()=>{const L=await import('/src/stations/qfn/logic.ts');const b=L.BOARDS[0],ref=L.REFERENCE[b.id],d=window.__circuitCrew.drive;
  for(const [id,pl] of Object.entries(ref.place)){const p=b.parts.find(q=>q.id===id);if(p.locked||p.kind==='qfn')continue;d.act('move',{part:id,at:pl.at,rot:pl.rot});}
  for(const t of ref.traces.filter(t=>t.layer===1))d.act('trace',{cells:t.cells,layer:1});});
await g.advance(.3);
let s=(await g.snap()).station;console.log(name,'tier',s.report.tier,'board',s.board);
const pill=await g.page.evaluate(()=>{const p=[...document.querySelectorAll('.prompt-pill')].find(e=>!e.hidden);if(!p)return null;const r=p.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,text:p.innerText.replace(/\n/g,' ')};});
console.log(name,'pill',JSON.stringify(pill));
await g.shot(`p0check-qfn-play-${name}-02-solved-before-ship`);
if(pill){await g.page.mouse.click(pill.x,pill.y);await g.advance(.3);s=(await g.snap()).station;console.log(name,'after pill tap board',s.board,'shipped',s.shipped.length);}
// Try every clickable cluster with a real mouse click and see which one ships.
for(const b of boxes){const before=(await g.snap()).station;await g.page.mouse.click(b.cx,b.cy);await g.advance(.3);const after=(await g.snap()).station;
  console.log(name,'click',b.cx,b.cy,'-> board',after.board,'shipped',after.shipped.length,'layer',after.layer,'via',after.viaArmed,'checks',after.checks,'tier',after.report.tier);
  if(after.shipped.length>before.shipped.length){await g.shot(`p0check-qfn-play-${name}-03-shipped-by-tap`);break;}}
// Right edge sweep: any real tap along the SHIP row ship it?
console.log(name,'errors',JSON.stringify(await g.close()));
