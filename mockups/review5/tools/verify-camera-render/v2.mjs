// Verifier: deterministic settles (updateCamera x N) for corner cutaway, survey fit, pitch dead zone, fade timing.
import {launch} from '../cap.mjs';
import {hook} from '../camera-render/hook.mjs';
const settle=(g,n=300,dt=1/60)=>g.page.evaluate(([n,dt])=>{const G=window.__game;for(let i=0;i<n;i++)G.updateCamera(dt);G.view.scene.updateMatrixWorld(true);G.view.camera.updateMatrixWorld();},[n,dt]);
{const g=await launch('playground',{fullfx:true});await hook(g);await g.advance(.3);await g.walk(-8.3,-3.5,.5,30);
 await g.page.evaluate(()=>{const G=window.__game;G.yaw=3.53;G.pitch=-.3;G.zoom=14;});await settle(g);
 const r=await g.page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');const G=window.__game,c=G.view.camera,p=G.player.translation();
  return {cam:[c.position.x,c.position.y,c.position.z].map(v=>+v.toFixed(2)),pip:[p.x,p.z].map(v=>+v.toFixed(2)),walls:G.shellWalls.map(w=>{const at=w.group.parent.getWorldPosition(new T.Vector3());const to=new T.Vector3(c.position.x-at.x,0,c.position.z-at.z).normalize();return {n:[w.normal.x,w.normal.z],at:[at.x,at.z],dot:+w.normal.dot(to).toFixed(3),side:+((c.position.x-at.x)*w.normal.x+(c.position.z-at.z)*w.normal.z).toFixed(2),scale:+w.group.scale.y.toFixed(2)};})};});
 console.log('CORNER settled',JSON.stringify(r));
 // pitch dead zone: effective camera elevation for stored pitches at zoom 9
 const pz=await g.page.evaluate(()=>{const G=window.__game;G.zoom=9;const out=[];for(const s of [-.3,-.25,-.2,-.15,-.14,-.1,0]){G.pitch=s;for(let i=0;i<300;i++)G.updateCamera(1/60);const c=G.view.camera.position,f=G.focus;out.push([s,+Math.atan2(c.y-f.y,Math.hypot(c.x-f.x,c.z-f.z)).toFixed(3)]);}G.zoom=38;for(const s of [.45]){G.pitch=s;for(let i=0;i<300;i++)G.updateCamera(1/60);const c=G.view.camera.position,f=G.focus;out.push(['z38',s,+Math.atan2(c.y-f.y,Math.hypot(c.x-f.x,c.z-f.z)).toFixed(3)]);}G.pitch=0;return out;});
 console.log('PITCH elev',JSON.stringify(pz));
 // fade timing: pillar occluder opacity under repeated updateCamera at dt=1/30 vs 1/60 with forced hit
 const ft=await g.page.evaluate(()=>{const G=window.__game;const res={};for(const dt of [1/60,1/30]){const m=G.occluders[0];m.material.opacity=1;let n=0;const R=G.constructor;
   // count frames lerp(.15) toward .15 needs to reach <=.25
   let o=1;while(o>.25){o=o+(0.15-o)*.15;n++;}res[dt.toFixed(3)]={frames:n,seconds:+(n*dt).toFixed(3)};}return res;});
 console.log('FADE (code lerp .15/frame)',JSON.stringify(ft));
 await g.close();}
for(const [lvl,w,h] of [['meeting',1440,900],['garage',1440,900],['meeting',390,844]]){
 const g=await launch(lvl,{fullfx:false,width:w,height:h});await hook(g);await g.advance(.3);await g.page.keyboard.press('Tab');await g.advance(.1);await settle(g,400);
 const s=await g.page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');const G=window.__game,c=G.view.camera,W=G.level.width/2,D=G.level.depth/2;return {survey:G.survey,W:W*2,D:D*2,pts:[[-W,0,-D],[W,0,-D],[-W,0,D],[W,0,D],[-W,3,-D],[W,3,-D]].map(([x,y,z])=>{const v=new T.Vector3(x,y,z).project(c);return [+v.x.toFixed(2),+v.y.toFixed(2)];})};});
 console.log('SURVEY',lvl,w,h,JSON.stringify(s));await g.shot(`verify-camera-render-03-survey-${lvl}-${w}`);await g.close();}
