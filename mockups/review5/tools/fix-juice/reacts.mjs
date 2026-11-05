// World reactions: glass breaks on a sprint (R5-090), a sprint past a coworker startles them (R5-089),
// the beats log and hitstop counter (R5-094/169), and the Lunch fail beat (R5-088/119).
// Usage: BASE=http://localhost:4203 node mockups/review5/tools/fix-juice/reacts.mjs
import {launch} from '../cap.mjs';
{ // Meeting: sprint into the middle glass pane.
  const g=await launch('meeting');await g.advance(.4);
  await g.page.evaluate(()=>{const p=window.__game.player;p.setTranslation({x:7.6,y:p.translation().y,z:-6.1},true);});await g.advance(.2);
  const before=await g.snap();
  const after=await g.advance(1.2,['ShiftLeft','KeyD']);
  const pane=after.items.find(i=>i.id==='glass-1');
  console.log('glass: visible',pane.visible,'damage',before.damage,'->',after.damage,'cost',after.cost,'hitstops',after.hitstops,'beats',JSON.stringify(after.beats.slice(-6)));
  await g.advance(.05);await g.shot('fix-juice-glass-break');
  // A walk (no sprint) past the other pane only bumps it.
  await g.page.evaluate(()=>{const p=window.__game.player;p.setTranslation({x:7.6,y:p.translation().y,z:-3.6},true);});await g.advance(.2);
  const walk=await g.advance(1.2,['KeyD']);console.log('walked into glass-2: visible',walk.items.find(i=>i.id==='glass-2').visible);
  console.log('errors',(await g.close()).filter(e=>!e.includes('403')));
}
{ // Playground: sprint past a coworker.
  const g=await launch('playground');await g.advance(.4);
  const npc=await g.page.evaluate(()=>{const n=window.__game.npcs.find(n=>!n.seated)??window.__game.npcs[0];return {x:n.group.position.x,z:n.group.position.z};});
  await g.page.evaluate(([n])=>{const p=window.__game.player;p.setTranslation({x:n.x-3,y:p.translation().y,z:n.z+1},true);},[npc]);await g.advance(.2);
  let alarmed=0;for(let i=0;i<10;i++){const s=await g.advance(.1,['ShiftLeft','KeyD']);alarmed=Math.max(alarmed,s.alarmed);}
  console.log('sprint past coworker at',JSON.stringify(npc),'max alarmed',alarmed);
  console.log('errors',(await g.close()).filter(e=>!e.includes('403')));
}
{ // Lunch: the fridge spoils.
  const g=await launch('lunch');await g.advance(.4);
  await g.page.evaluate(()=>{window.__game.lunch.job.temperature=.995;window.__game.lunch.job.warming=true;});
  const s=await g.advance(3);await g.page.waitForTimeout(2500);
  const s2=await g.snap();console.log('lunch fail: won',s2.won,'failAt',JSON.stringify(s2.failAt),'beats',JSON.stringify(s2.beats.slice(-4)),'hitstops',s2.hitstops);
  await g.shot('fix-juice-lunch-fail');
  console.log('errors',(await g.close()).filter(e=>!e.includes('403')));
}
