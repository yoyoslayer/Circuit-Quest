// For each station: a start shot, then plug the bench lead in along its route, a survey shot with the
// cable seated, and the rope state. Usage: node plug.mjs [level…]  (BASE=http://localhost:4214)
import {launch} from '../cap.mjs';
const levels=process.argv.slice(2).length?process.argv.slice(2):['arcade','arcade-rush','garage','qfn','observatory','spectrum'];
for(const lv of levels){
  const g=await launch(lv,{fullfx:false});await g.advance(.5);
  await g.shot(`fix-stationcable-${lv}-start`);
  const lead=await g.page.evaluate(()=>window.__game.level.stationCable);
  const [px,pz]=lead.route[0];
  // Ways round the desk from the door, where the straight walk to the plug is blocked.
  const approach={spectrum:[[-6.3,4.2],[-6.4,1.5]]}[lv]??[];for(const [x,z] of approach)await g.walk(x,z,.5);
  let r=await g.walk(px,pz,.6);await g.key('KeyF');let s=await g.snap();
  console.log(lv,'at plug',r.arrived,'holding',s.holdingPlug);
  for(const [x,z] of lead.route.slice(1)){r=await g.walk(x,z,.45);s=r.state;console.log('  ->',x,z,r.arrived,'strain',s.rope.strain.toFixed(2),'bends',s.rope.bends.length);}
  await g.shot(`fix-stationcable-${lv}-carry`);
  await g.key('KeyF',.3);s=await g.snap();
  console.log('  seated',s.connected,'live',s.benchLive,'len',s.rope.length.toFixed(2),'/',s.rope.maxLength,'bends',JSON.stringify(s.rope.bends.map(b=>[+b.x.toFixed(2),+b.z.toFixed(2)])));
  await g.survey();await g.shot(`fix-stationcable-${lv}-survey`);
  console.log('  errors',JSON.stringify(await g.close()));
}
