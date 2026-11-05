// Props still batch-hide (consume), grab and break; benches look the same frozen vs ?nofreeze;
// dust and steam shots. Usage: BASE=... node checks.mjs
import {launch} from '../cap.mjs';
{ const g=await launch('meeting',{fullfx:false});await g.advance(.3);
  const r=await g.page.evaluate(()=>{const G=window.__game;const p=G.props.find(q=>q.spec.kind==='chair');const before=G.batches.filter(b=>b.parts.some(x=>x.prop===p));
    G.consume(p);G.updateBatches();
    const zero=before.every(b=>{const i=b.parts.findIndex(x=>x.prop===p);const a=b.mesh.instanceMatrix.array;return [0,5,10].every(k=>a[i*16+k]===0);});
    const other=before.every(b=>{const i=b.parts.findIndex(x=>x.prop!==p);if(i<0)return true;const a=b.mesh.instanceMatrix.array;return a[i*16+15]===1&&(a[i*16]!==0||a[i*16+1]!==0);});
    return {batchesForChair:before.length,hiddenZero:zero,othersShown:other};});
  console.log('consume',JSON.stringify(r));
  // grab the nearest prop
  const near=await g.page.evaluate(()=>{const G=window.__game;const p=G.props.find(q=>q.spec.kind==='box'&&q.mesh.visible);const t=p.body.translation();return {x:t.x,z:t.z};});
  await g.walk(near.x+.9,near.z,.4);await g.key('KeyE',.3);const held=await g.page.evaluate(()=>!!window.__game.held);console.log('grabbed',held);
  await g.close(); }
for(const [level,q] of [['garage',''],['garage','nofreeze'],['observatory',''],['observatory','nofreeze'],['arcade',''],['arcade','nofreeze']]){
  const g=await launch(level,{fullfx:true,query:q});await g.page.evaluate(()=>localStorage.setItem('circuit-crew-quality','2'));await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
  await g.page.evaluate(()=>{const G=window.__game,t=G.station.table;G.player.setNextKinematicTranslation({x:G.station.stand.x,y:.91,z:G.station.stand.z});});await g.advance(.4);await g.key('KeyE',1.5);
  const s=await g.snap();console.log(level,q||'frozen','draws',s.drawCalls);await g.shot(`fix-perf-bench-${level}-${q||'frozen'}`);await g.close();}
