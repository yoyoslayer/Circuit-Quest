// R5-085: throw the job item at the bench (Q) instead of setting it down, in Arcade Rush and QFN.
// BASE=http://127.0.0.1:4173 node mockups/review5/tools/fix-r2/throw.mjs   (ONLY=rush or ONLY=qfn for one)
import {launch} from '../cap.mjs';
const runs=[['arcade-rush','blocks','trayReady'],['qfn','parts','partsReady']].filter(r=>!process.env.ONLY||r[0].includes(process.env.ONLY));
for(const [level,id,ready] of runs){
  const g=await launch(level,{fullfx:false});await g.advance(1);
  if(level==='arcade-rush'){
    // The tray is in the storeroom (station-arcade-rush.spec route).
    for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z);await g.walk(-8.3,4.4,.3);await g.key('KeyE',.3);
    for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z);
  }else{
    const item=await g.page.evaluate(id=>{const p=window.__game.props.find(q=>q.spec.id===id).body.translation();return {x:p.x,z:p.z};},id);
    await g.walk(item.x+.7,item.z,.2);await g.key('KeyE',.3);
  }
  // Face the bench from about 2.3 m away and throw.
  const bench=await g.page.evaluate(()=>{const s=window.__game.station,t=s.table??s.stand;return {x:t.x,z:t.z};});
  const pl=(await g.snap()).player,dx=pl.x-bench.x,dz=pl.z-bench.z,d=Math.hypot(dx,dz)||1;
  await g.walk(bench.x+dx/d*2.6,bench.z+dz/d*2.6,.3);await g.walk(bench.x+dx/d*2.3,bench.z+dz/d*2.3,.2);
  const before=await g.snap();await g.key('KeyQ',3);const s=await g.snap();
  console.log(level,'held before',before.held,'ready',s.station?.[ready],'damage',s.damage,'cost',s.cost,'beats',s.beats.slice(-4).map(b=>b.kind).join(','));
  await g.shot(`fix-r2-throw-${level}`);await g.close();
}
