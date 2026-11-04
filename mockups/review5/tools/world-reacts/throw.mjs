// world-reacts: walk to the coworker nearest spawn, grab the nearest light prop, throw it toward them (Q), log alarm.
import {launch} from './wrcap.mjs';
const level=process.argv[2]??'playground', standoff=+(process.argv[3]??6), tag=process.argv[4]??'a', N=process.argv[5]??'01';
const g=await launch(level,{fullfx:true});
const log=(...a)=>console.log(level,...a);
await g.advance(.5);
const s0=await g.snap();const P0=s0.player;const all=await g.npcs();const sorted=all.map(n=>({...n,d:Math.hypot(n.x-P0.x,n.z-P0.z)})).sort((a,b)=>a.d-b.d);const info={p:{x:P0.x,z:P0.z},npcs:sorted.slice(0,4),count:all.length};
log('spawn',JSON.stringify(info.p),'npcs',info.count,'nearest',JSON.stringify(info.npcs[0]));
const NI=+(process.argv[6]??-1);const t=NI>=0?all[NI]:info.npcs[0];log('target npc',JSON.stringify(t));const dx=t.x-info.p.x,dz=t.z-info.p.z,dl=Math.hypot(dx,dz)||1;
// stand point: standoff metres before the npc on the spawn->npc line (or at spawn if closer)
let sx=dl>standoff?t.x-dx/dl*standoff:info.p.x, sz=dl>standoff?t.z-dz/dl*standoff:info.p.z;if(process.argv[7]){sx=+process.argv[7];sz=+process.argv[8];}
let w=await g.walk(sx,sz,.6,20);log('walk to stand',w.arrived,JSON.stringify(w.state.player),'t',w.state.time.toFixed(1));
// nearest light prop to pip
const P1=(await g.snap()).player;const pr=(await g.props()).filter(q=>q.en&&!q.id&&!['desk','shelf','sofa','cabinet','vending','table','bookshelf','pallet'].includes(q.k)).map(q=>({...q,pos:{x:q.x,z:q.z},d:Math.hypot(q.x-P1.x,q.z-P1.z)})).sort((a,b)=>a.d-b.d).slice(0,5);
log('nearest props',JSON.stringify(pr.map(q=>[q.k,q.d.toFixed(2)])));
let s;for(const q of pr){await g.walk(q.pos.x,q.pos.z,.9,10);await g.key('KeyE',.2);s=await g.snap();if(s.held&&!(s.held||'').includes('-'))break;if(s.held)await g.key('KeyE',.2);}
await g.walk(sx,sz,.5,10);s=await g.snap();log('held',s.held,'prompt',await g.page.evaluate(()=>document.querySelector('#prompt,.prompt,[data-prompt]')?.textContent));

// face the npc: step 0.5m toward it
const p2=s.player;const ex=t.x-p2.x,ez=t.z-p2.z,el=Math.hypot(ex,ez);
await g.walk(p2.x+ex/el*.7,p2.z+ez/el*.7,.25,3);
const heldKind=(await g.snap()).held;const before=await g.props();
await g.shot(`world-reacts-${N}-${level}-${tag}-aim`);
const d0=await g.snap();log('before throw dmg',d0.damage,'alarmed',d0.alarmed,'time',d0.time.toFixed(1));
await g.key('KeyQ',0);
let hit=null;for(let i=0;i<40;i++){await g.advance(.05);const now=await g.props();const nd=now.find((q,j)=>q.dmg&&!before[j].dmg);if(nd){hit={k:nd.k,pos:{x:nd.x,y:nd.y,z:nd.z},alarmed:(await g.snap()).alarmed,i};break;}}
const land=hit?hit.pos:{x:NaN,z:NaN};
log('impact',JSON.stringify(hit),'rest',JSON.stringify(land),'dist impact->npc',hit?Math.hypot(hit.pos.x-t.x,hit.pos.z-t.z).toFixed(2):Math.hypot(land.x-t.x,land.z-t.z).toFixed(2));
await g.advance(.45);s=await g.snap();log('+0.5 alarmed',s.alarmed,'damage',s.damage,'cost',s.cost,'fastest',s.fastestProp.toFixed(2));
const bub=(await g.npcs()).filter(n=>n.bubble);
log('bubbles on screen',JSON.stringify(bub));
await g.shot(`world-reacts-${N}-${level}-${tag}-react`);
await g.advance(3);s=await g.snap();log('+3.5 alarmed',s.alarmed);
await g.shot(`world-reacts-${N}-${level}-${tag}-calm`);
log('errors',JSON.stringify(await g.close()));
