import {launch} from '../world-reacts/wrcap.mjs';
const m=process.argv[2];const P='verify-gap6-world-reacts-';const log=(...a)=>console.log(m,...a);
if(m==='pg'){const g=await launch('playground');await g.advance(.5);
  const s0=await g.snap();const npcs=await g.npcs();log('npcs',JSON.stringify(npcs.slice(0,6)),'player',JSON.stringify(s0.player));
  const t=npcs.map(n=>({...n,d:Math.hypot(n.x-s0.player.x,n.z-s0.player.z)})).sort((a,b)=>a.d-b.d)[0];log('target',JSON.stringify(t));
  const bins=(await g.props()).filter(q=>q.en&&!q.id&&q.k==='bin').map(q=>({...q,d:Math.hypot(q.x-s0.player.x,q.z-s0.player.z)})).sort((a,b)=>a.d-b.d);
  let s;for(const b of bins.slice(0,5)){log('bin',b.x.toFixed(1),b.z.toFixed(1));await g.walk(b.x,b.z,.55,10);await g.key('KeyE',.2);s=await g.snap();if(s.held==='bin')break;if(s.held)await g.key('KeyE',.2);}log('held',s.held,'fast while holding (still)',s.fastestProp.toFixed(2));
  // walk with it, sample fastestProp
  const w=await g.walk(t.x+ (s.player.x-t.x)*.0+0.0, t.z+4,.6,6);s=await g.snap();log('after carry walk fast',s.fastestProp.toFixed(2));
  const p=s.player;const ex=t.x-p.x,ez=t.z-p.z,el=Math.hypot(ex,ez);await g.walk(p.x+ex/el*.6,p.z+ez/el*.6,.25,3);
  await g.shot(P+'01-pg-bin-aim');
  await g.key('KeyQ',0);const tl=[];for(let i=0;i<30;i++){s=await g.advance(.1);tl.push([+(i*.1+.1).toFixed(1),s.alarmed,s.damage,s.cost,+s.fastestProp.toFixed(1)]);if(i===6)await g.shot(P+'02-pg-bin-react');if(i===12)await g.shot(P+'03-pg-bin-1p3s');}
  log('timeline [t,alarmed,dmg,cost,fast]',JSON.stringify(tl));
  log('bonus star dom',await g.page.evaluate(()=>document.body.innerText.slice(0,300)));
  log('errors',JSON.stringify(await g.close()));}
if(m==='pgcable'){const g=await launch('playground');await g.advance(.3);
  await g.key('KeyF',.1);await g.walk(-6.6,-1,.4);let w=await g.walk(-6.3,-5.6,.4,8);let s=await g.snap();log('bends',s.rope.bends.length,'strain',s.rope.strain.toFixed(2),'alarmed',s.alarmed,JSON.stringify(s.player));
  await g.zoom(-700);await g.orbit(300,0);await g.shot(P+'04-pg-cable-through-blob');
  // slingshot
  await g.walk(9,3.7);s=await g.advance(2.5,['KeyW','ShiftLeft']);log('taut',s.rope.strain.toFixed(2));
  await g.key('KeyQ',0);const tl=[];for(let i=0;i<35;i++){s=await g.advance(.1);tl.push([+(i*.1+.1).toFixed(1),s.alarmed,s.damage,+s.fastestProp.toFixed(1)]);}
  log('sling timeline',JSON.stringify(tl));
  log('errors',JSON.stringify(await g.close()));}
if(m==='meet'){const g=await launch('meeting');await g.advance(.3);
  await g.walk(7,-1.5,.5);await g.walk(6.6,-5.4,.4);await g.walk(7.2,-5.6,.2,3);
  let gl=(await g.props()).filter(q=>q.k==='glass');log('glass before',JSON.stringify(gl.map(q=>[q.id,+q.x.toFixed(2),+q.z.toFixed(2)])));
  let s=await g.advance(1.2,['KeyD','ShiftLeft']);gl=(await g.props()).filter(q=>q.k==='glass');log('after sprint',JSON.stringify(gl.map(q=>[q.id,q.en,q.dmg,+q.x.toFixed(2)])),'dmg',s.damage,'alarmed',s.alarmed,JSON.stringify(s.player));
  await g.shot(P+'05-meet-glass-sprint');
  s=await g.advance(1.5,['KeyD','ShiftLeft']);gl=(await g.props()).filter(q=>q.k==='glass');log('after more sprint',JSON.stringify(gl.map(q=>[q.id,q.en,+q.x.toFixed(2)])),JSON.stringify(s.player),'dmg',s.damage);
  await g.shot(P+'06-meet-glass-sprint2');
  log('errors',JSON.stringify(await g.close()));}
if(m==='meetstrip'){const g=await launch('meeting');await g.advance(.3);
  const st=(await g.snap()).items.find(i=>i.id==='strip');log('strip',JSON.stringify(st.pos));
  await g.walk(st.pos.x,st.pos.z,1.0,15);await g.key('KeyE',.2);let s=await g.snap();log('held',s.held,'fast idle',s.fastestProp.toFixed(2));
  const rows=[];for(let i=0;i<6;i++){s=await g.advance(.3,['KeyD']);rows.push(+s.fastestProp.toFixed(2));}log('fast while carrying',JSON.stringify(rows));
  await g.key('KeyE',.3);const rows2=[];for(let i=0;i<4;i++){s=await g.advance(.3,['KeyD']);rows2.push(+s.fastestProp.toFixed(2));}log('fast after drop walking',JSON.stringify(rows2));
  log('errors',JSON.stringify(await g.close()));}
if(m==='lunch'){const g=await launch('lunch');await g.advance(.5);let s=await g.snap();log('spawn',JSON.stringify(s.player));
  const boxes=(await g.props()).filter(q=>q.en&&!q.id&&q.k==='box').map(q=>({...q,d:Math.hypot(q.x-s.player.x,q.z-s.player.z)})).sort((a,b)=>a.d-b.d).slice(0,2);log('boxes',JSON.stringify(boxes.map(q=>[q.x.toFixed(1),q.z.toFixed(1),q.d.toFixed(1)])));
  const b=boxes[0];await g.walk(b.x,b.z,.9,8);s=await g.snap();log('at',JSON.stringify(s.player),'prompt',await g.page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&/Grab|Pick up|Put/.test(e.textContent)).map(e=>e.textContent).slice(0,3)));
  await g.shot(P+'07-lunch-box-prompt');
  await g.key('KeyE',.2);s=await g.snap();log('after E held',s.held,'lunch.held',JSON.stringify(s.lunch?.held),'holdingPlug',s.holdingPlug);
  await g.shot(P+'08-lunch-after-E');
  log('errors',JSON.stringify(await g.close()));}
