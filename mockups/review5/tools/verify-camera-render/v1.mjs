// Verifier: fresh-profile quality, playground corner cutaway, draw calls, pitch dead zone.
import {chromium} from '@playwright/test';
import {launch} from '../cap.mjs';
import {hook} from '../camera-render/hook.mjs';
// 1. Fresh profile, real player URL (no manual).
{const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
 const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
 await p.goto('http://127.0.0.1:4173/?level=garage');await p.waitForSelector('body[data-ready="true"]');
 await p.evaluate(async()=>{const m=await import('/src/game.ts');const P=m.Game.prototype;const o=P.render;P.render=function(dt){window.__game=this;return o.call(this,dt);};});
 await p.waitForTimeout(800);
 console.log('FRESH',await p.evaluate(()=>({stored:localStorage.getItem('circuit-crew-quality'),q:window.__game?.view.getQuality(),dpr:window.__game?.view.renderer.getPixelRatio(),dev:devicePixelRatio})));
 await b.close();}
// 2. Playground corner.
{const g=await launch('playground',{fullfx:true});await hook(g);await g.advance(.3);await g.walk(-8.3,-3.5,.5,30);
 console.log('CAPQ',await g.page.evaluate(()=>window.__game.view.getQuality()));
 await g.page.evaluate(()=>{const G=window.__game;G.yaw=3.53;G.pitch=-.3;G.zoom=14;});await g.advance(3);
 const r=await g.page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');const G=window.__game,c=G.view.camera,p=G.player.translation();G.view.scene.updateMatrixWorld(true);
  const walls=G.shellWalls.map(w=>{const at=w.group.parent.getWorldPosition(new T.Vector3());const to=new T.Vector3(c.position.x-at.x,0,c.position.z-at.z).normalize();const side=(c.position.x-at.x)*w.normal.x+(c.position.z-at.z)*w.normal.z;
   const m=[];w.group.traverse(o=>{if(o.isMesh)m.push(o);});let blocks=[];for(const y of [p.y-.6,p.y,p.y+.7]){const end=new T.Vector3(p.x,y,p.z),dir=end.clone().sub(c.position);const d=dir.length();const rc=new T.Raycaster(c.position.clone(),dir.normalize(),0,d);blocks.push(rc.intersectObjects(m,false).length>0);}
   return {normal:[w.normal.x,w.normal.z],dot:+w.normal.dot(to).toFixed(3),side:+side.toFixed(2),scale:+w.group.scale.y.toFixed(2),blocks};});
  return {cam:[c.position.x,c.position.y,c.position.z].map(v=>+v.toFixed(2)),pip:[p.x,p.y,p.z].map(v=>+v.toFixed(2)),W:G.level.width,D:G.level.depth,walls};});
 console.log('CORNER',JSON.stringify(r));await g.shot('verify-camera-render-01-pg-corner');
 // draw calls q0 vs q2
 await g.page.evaluate(()=>{const G=window.__game;G.action('camera');});await g.advance(2);
 const d0=(await g.snap()).drawCalls;await g.page.evaluate(()=>window.__game.view.setQuality(2));await g.advance(.3);const d2=(await g.snap()).drawCalls;console.log('DRAWS playground q0',d0,'q2',d2);
 // pitch dead zone at zoom 9
 await g.page.evaluate(()=>{const G=window.__game;G.zoom=9;G.pitch=0;});await g.advance(1.5);
 await g.orbit(0,-400,1.5);const a=await g.page.evaluate(()=>[window.__game.pitch,window.__game.view.camera.position.y]);
 await g.orbit(0,10,1.5);const b=await g.page.evaluate(()=>[window.__game.pitch,window.__game.view.camera.position.y]);
 await g.orbit(0,30,1.5);const c2=await g.page.evaluate(()=>[window.__game.pitch,window.__game.view.camera.position.y]);
 await g.orbit(0,20,1.5);const d=await g.page.evaluate(()=>[window.__game.pitch,window.__game.view.camera.position.y]);
 console.log('PITCH up400',a,'then +10',b,'then +30',c2,'then +20',d);
 console.log(await g.close());}
// 3. meeting draws
{const g=await launch('meeting',{fullfx:true});await hook(g);await g.advance(1);const d0=(await g.snap()).drawCalls;await g.page.evaluate(()=>window.__game.view.setQuality(2));await g.advance(.3);const d2=(await g.snap()).drawCalls;console.log('DRAWS meeting q0',d0,'q2',d2);
 await g.page.evaluate(()=>window.__game.view.setQuality(0));
 // survey projection at 1440x900
 await g.survey();await g.advance(1.5);
 const s=await g.page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');const G=window.__game,c=G.view.camera,W=G.level.width/2,D=G.level.depth/2;c.updateMatrixWorld();return [[-W,0,-D],[W,0,-D],[-W,0,D],[W,0,D],[-W,3,-D],[W,3,-D]].map(([x,y,z])=>{const v=new T.Vector3(x,y,z).project(c);return [+v.x.toFixed(2),+v.y.toFixed(2)];});});
 console.log('SURVEY meeting NDC',JSON.stringify(s));await g.shot('verify-camera-render-02-me-survey');
 console.log(await g.close());}
