// world-reacts: slingshot into groups (playground, lunch) and glass break (meeting); log alarm and take shots.
import {launch} from './wrcap.mjs';
const which=process.argv[2];
const log=(...a)=>console.log(which,...a);
const npcsNear=async(g)=>{const s=await g.snap();return (await g.npcs()).map(n=>({...n,d:+Math.hypot(n.x-s.player.x,n.z-s.player.z).toFixed(1)}));};
if(which==='playground'){const g=await launch('playground');await g.advance(.3);
  await g.key('KeyF',.1);await g.walk(9,3.7);let s=await g.snap();log('at 9,3.7 strain',s.rope.strain.toFixed(2),'alarmed',s.alarmed);
  await g.shot('world-reacts-10-playground-sling-taut0');
  s=await g.advance(2.5,['KeyW','ShiftLeft']);log('taut strain',s.rope.strain.toFixed(2),'alarmed',s.alarmed,'t',s.time.toFixed(1),JSON.stringify((await npcsNear(g)).map(n=>[n.d,n.alarm])));
  await g.shot('world-reacts-11-playground-sling-taut');
  await g.key('KeyQ',0);s=await g.advance(.5);log('+0.5 after Q alarmed',s.alarmed,'fast',s.fastestProp.toFixed(1),'dmg',s.damage,'pins',s.pinsDown,JSON.stringify((await npcsNear(g)).map(n=>[n.d,n.alarm])));
  await g.shot('world-reacts-12-playground-sling-react');
  s=await g.advance(3);log('+3.5 alarmed',s.alarmed,'pins',s.pinsDown,'dmg',s.damage);await g.shot('world-reacts-13-playground-sling-calm');
  log('errors',JSON.stringify(await g.close()));}
if(which==='lunch'){const g=await launch('lunch');await g.advance(.3);
  await g.walk(-10.8,2,.4);await g.key('KeyF',.1);let s=await g.snap();log('held',JSON.stringify(s.lunch?.held));
  for(const [x,z] of [[-7,4],[-4,6.5],[-2,8]]){const w=await g.walk(x,z,.5,8);s=w.state;log('walk',x,z,w.arrived,'strain',JSON.stringify(s.lunch?.cables?.map?.(c=>c.strain)??s.rope.strain),'alarmed',s.alarmed);}
  s=await g.advance(2,['KeyD','ShiftLeft']);log('sprint alarmed',s.alarmed,JSON.stringify(s.lunch?.cables?.map?.(c=>[c.id,c.strain&&+c.strain.toFixed(2)])),JSON.stringify(s.player));
  await g.shot('world-reacts-14-lunch-sling-taut');
  await g.key('KeyQ',0);s=await g.advance(.5);log('+0.5 after Q alarmed',s.alarmed,'fast',s.fastestProp.toFixed(1),'dmg',s.damage,JSON.stringify((await npcsNear(g)).filter(n=>n.d<6).map(n=>[n.i,n.d,n.alarm])));
  await g.shot('world-reacts-15-lunch-sling-react');
  s=await g.advance(3);log('+3.5 alarmed',s.alarmed);
  log('errors',JSON.stringify(await g.close()));}
if(which==='meeting'){const g=await launch('meeting');await g.advance(.3);
  // grab the stapler-ish clutter near the boardroom glass and throw it at the pane at (9.3,-6.1)
  await g.walk(7,-1.5,.5);const P=(await g.snap()).player;
  const pr=(await g.props()).filter(q=>q.en&&!q.id&&['bin','plant','box','mug','chair','paper','cone'].includes(q.k)).map(q=>({...q,d:Math.hypot(q.x-P.x,q.z-P.z)})).sort((a,b)=>a.d-b.d).slice(0,4);log('props',JSON.stringify(pr.map(q=>[q.k,q.d.toFixed(1)])));
  for(const q of pr){await g.walk(q.x,q.z,.9,8);await g.key('KeyE',.2);if((await g.snap()).held)break;}
  log('held',(await g.snap()).held);
  await g.walk(6.6,-5.4,.4);await g.walk(7.2,-5.6,.2,3);// face +x towards pane at 9.3,-6.1
  const glass0=(await g.props()).filter(q=>q.k==='glass');log('glass',JSON.stringify(glass0.map(q=>[q.id,q.en])));
  await g.shot('world-reacts-16-meeting-glass-aim');
  await g.key('KeyQ',0);let s;for(let i=0;i<12;i++){s=await g.advance(.1);const gl=(await g.props()).filter(q=>q.k==='glass');if(gl.some(q=>!q.en))break;}
  const gl=(await g.props()).filter(q=>q.k==='glass');log('after throw glass',JSON.stringify(gl.map(q=>[q.id,q.en,q.dmg])),'alarmed',s.alarmed,'dmg',s.damage);
  await g.shot('world-reacts-17-meeting-glass-react');
  // second try: sprint into the pane
  if(gl.every(q=>q.en)){s=await g.advance(1.2,['KeyD','ShiftLeft']);const gl2=(await g.props()).filter(q=>q.k==='glass');log('sprint into glass',JSON.stringify(gl2.map(q=>[q.id,q.en,q.dmg,+q.x.toFixed(2)])),'alarmed',s.alarmed,'dmg',s.damage);await g.shot('world-reacts-18-meeting-glass-sprint');}
  s=await g.advance(3);log('+3 alarmed',s.alarmed);await g.shot('world-reacts-19-meeting-glass-calm');
  log('errors',JSON.stringify(await g.close()));}
