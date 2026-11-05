// Plays each room's chaos bonus with real walking (the moves station-cable.spec uses), with shots.
// node chaos.mjs arcade|sling|garage|observatory|qfn|spectrum   (BASE=http://localhost:4214)
import {launch} from '../cap.mjs';
const which=process.argv[2];
const walkTry=(g,x,z,r=.5,limit=8)=>g.ev('return drive.walkTo(a[0],a[1],a[2],a[3])',x,z,r,limit);
const st=async g=>(await g.snap()).station;
const props=g=>g.page.evaluate(()=>window.__game.props.map(p=>{const t=p.body.translation();return [t.x,t.z];}));
if(which==='arcade'){
  const g=await launch('arcade',{fullfx:false});await g.advance(.3);
  for(const [x,z] of [[1.2,-1.3],[2.9,-1.6],[3.0,-4.6],[3.0,-5.45]])console.log('walk',x,z,(await g.walk(x,z,.5)).arrived);
  await g.key('KeyE');let s=await g.snap();console.log('held',s.held);
  console.log((await g.walk(4.2,-6.75,.3)).arrived);console.log((await g.walk(3.6,-6.75,.12)).arrived);
  await g.shot('fix-stationcable-chaos-arcade-aim');
  await g.key('KeyQ',2.5);console.log('prizesDown',(await st(g)).prizesDown);await g.shot('fix-stationcable-chaos-arcade-pyramid');
  await g.close();
}
if(which==='sling'){
  const g=await launch('arcade',{fullfx:false});await g.advance(.3);
  await g.walk(1.2,-1.3,.5);await g.walk(2.55,-.65,.6);await g.key('KeyF');
  await g.walk(-3.5,5,.5);let s=await g.ev('return drive.advance(a[0],a[1])',2.5,['KeyA','KeyS','ShiftLeft']);
  const before=await props(g);console.log('strain',s.rope.strain,'player',JSON.stringify(s.player));
  await g.shot('fix-stationcable-chaos-sling-taut');
  await g.key('KeyQ',.05);s=await g.snap();console.log('fastest',s.fastestProp,'holding',s.holdingPlug);await g.advance(1.5);
  const after=await props(g);const moved=after.map((p,i)=>Math.hypot(p[0]-before[i][0],p[1]-before[i][1]));console.log('max moved',Math.max(...moved).toFixed(2),'count>1m',moved.filter(m=>m>1).length);
  await g.shot('fix-stationcable-chaos-sling-after');await g.close();
}
if(which==='garage'){
  const g=await launch('garage',{fullfx:false});await g.advance(.3);
  console.log((await g.walk(-4.5,1.9,.5)).arrived);const r=await walkTry(g,-8.2,.4,.5,6);console.log('through',r.arrived);await g.advance(1.5);
  console.log('bowled',(await st(g)).parcelsBowled);await g.shot('fix-stationcable-chaos-garage');await g.close();
}
if(which==='observatory'){
  const g=await launch('observatory',{fullfx:false});await g.advance(.3);
  await g.walk(-3.7,-.1,.6);await g.key('KeyE');console.log('held',(await g.snap()).held);
  await g.walk(-6,3.5,.6);console.log((await walkTry(g,-6.3,6.4,.3,8)).arrived);
  await g.key('KeyQ',2);const s=await st(g);console.log('cartWall',s.cartWall,'dist',s.cartDistance,'moved',s.cartMoved);await g.shot('fix-stationcable-chaos-observatory');await g.close();
}
if(which==='qfn'){
  const g=await launch('qfn',{fullfx:false});await g.advance(.3);
  await g.walk(-8.8,2.95,.5);await g.key('KeyE');console.log('held',(await g.snap()).held);
  console.log((await g.walk(-3.7,1.15,.4)).arrived);await g.key('KeyQ',3);const s=await st(g);console.log('tossed',s.tossed,'partsReady',s.partsReady);
  await g.shot('fix-stationcable-chaos-qfn');await g.close();
}
if(which==='spectrum'){
  const g=await launch('spectrum',{fullfx:false});await g.advance(.3);
  for(const [x,z] of [[-6.3,3.6],[-6.4,1.2],[0,-1.4],[4.2,.6]])console.log('walk',x,z,(await g.walk(x,z,.5)).arrived);
  await g.walk(4.6,1,.9);await g.key('KeyE');console.log('held',(await g.snap()).held);
  console.log((await g.walk(2.1,1.5,.3)).arrived);console.log((await g.walk(2.1,2.9,.12)).arrived);console.log(JSON.stringify((await g.snap()).player));
  await g.key('KeyQ',2.5);const s=await st(g);console.log('toasterDown',s.toasterDown);await g.shot('fix-stationcable-chaos-spectrum');await g.close();
}
