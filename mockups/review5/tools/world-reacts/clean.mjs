// world-reacts: replay each room's clean spec route in ~1 m steps and log the first "funny/physical" moment vs the 30 s rule.
import {launch} from './wrcap.mjs';
const level=process.argv[2];
const g=await launch(level);await g.advance(.2);
const T=[];let first=null;
const sample=async(label)=>{const s=await g.snap();const n=await g.npcs();const row={t:+s.time.toFixed(1),label,fast:+s.fastestProp.toFixed(1),alarmed:s.alarmed,dmg:s.damage,near:n.filter(q=>Math.hypot(q.x-s.player.x,q.z-s.player.z)<2).length};T.push(row);
  if(!first&&(row.fast>5||row.alarmed>0))first=row;return s;};
const walk=async(x,z,r=.5)=>{for(let k=0;k<40;k++){const p=(await g.snap()).player;const d=Math.hypot(x-p.x,z-p.z);if(d<r)break;const st=Math.min(1.2,d);const w=await g.walk(p.x+(x-p.x)/d*st,p.z+(z-p.z)/d*st,Math.min(r,.4),4);await sample(`->${x},${z}`);if(!w.arrived&&Math.hypot(w.state.player.x-p.x,w.state.player.z-p.z)<.05){await g.walk(x,z,r);break;}}await sample(`@${x},${z}`);};
const route=async(pts,r=.5)=>{for(const [x,z] of pts)await walk(x,z,r);};
const key=async(k,l)=>{await g.key(k,.1);await sample(l??k);};
const ev={};
if(level==='playground'){await key('KeyF','grab plug');await route([[-5,-1],[-4,-4],[5.8,-5.5]]);await key('KeyF','PLUG (spark flash)');ev.plug=T.at(-1).t;await walk(6.6,-5.9,.4);await key('KeyE','switch');await g.advance(.4);await sample('won');}
if(level==='meeting'){await walk(-8.6,-3.9,.4);await key('KeyE','grab strip');await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await key('KeyE','place strip (ring)');ev.strip=T.at(-1).t;
  await route([[6,-1.2],[-8,-1.4]]);await route([[-9,-6],[-9,5.3],[-3.65,5.3]],.3);await key('KeyE','coupler');await route([[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);await key('KeyE','attach coupler');
  await route([[-9,-6],[-9,5.3],[-3,5.3]],.3);await key('KeyE','extension');await route([[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);await key('KeyE','attach ext (confetti)');ev.ext=T.at(-1).t;
  await key('KeyF','plug');await route([[7.8,-7],[8,-1.4],[11.4,-1.4]]);await key('KeyF','PLUG (spark)');ev.plug=T.at(-1).t;await route([[12.3,-1.2],[12.3,-3.2]],.4);await key('KeyE','projector -> TRIP spark');ev.trip=T.at(-1).t;await g.shot('world-reacts-20-meeting-clean-trip');}
if(level==='lunch'){await walk(-3,7,.4);await key('KeyE','wedge');await walk(0,1.4);await key('KeyE','wedge door');await g.advance(.5);await walk(2,8,.4);await key('KeyE','mop');await walk(.3,2,.45);await g.advance(4);await sample('mopped');await walk(2,2);await key('KeyE','drop mop');
  await walk(-10,7.5,.3);await key('KeyF','thick');await route([[1,3],[.2,-1.2],[-3.5,-3]],.45);await key('KeyF','PLUG kitchen (spark)');ev.plug=T.at(-1).t;await g.shot('world-reacts-21-lunch-clean-plug');}
if(level==='lobby'){await walk(-5.2,-8.6,.6);await sample('at door 00');}
console.log(level,'events',JSON.stringify(ev),'FIRST fast/alarm',JSON.stringify(first));
console.log(T.filter((r,i)=>i%3===0||r.fast>3||r.alarmed||/[A-Z]/.test(r.label)).map(r=>`${r.t}s ${r.label} fast=${r.fast} al=${r.alarmed} dmg=${r.dmg} nearNpc=${r.near}`).join('\n'));
console.log('max fast before 30s',Math.max(...T.filter(r=>r.t<30).map(r=>r.fast)),'nearNpc moments',T.filter(r=>r.near).length);
console.log('errors',JSON.stringify(await g.close()));
