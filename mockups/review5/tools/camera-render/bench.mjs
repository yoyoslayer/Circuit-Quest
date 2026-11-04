// Bench camera framing per station (fixed view), orbit/wheel at the bench, phone portrait bench.
import {launch} from '../cap.mjs';
import {hook,camInfo} from './hook.mjs';
const st=[['arcade','ar',0,-1.55],['arcade-rush','rr',0,-1.55],['garage','ga',0,-1.55],['qfn','qf',0,-.5],['observatory','ob',0,-1.55],['spectrum','sp',-3.5,3.55]];
for(const [w,h,suf] of [[1440,900,''],[390,844,'-phone']])for(const [level,tag,x,z] of st){
  const g=await launch(level,{fullfx:true,width:w,height:h});await hook(g);await g.advance(.3);
  const r=await g.walk(x,z+.6,.4,30);await g.walk(x,z,.35,10);await g.key('KeyE',.3);
  const s=await g.snap();
  const near=await g.page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');const G=window.__game,c=G.view.camera;const rc=new T.Raycaster();const dir=new T.Vector3();c.getWorldDirection(dir);
    // anything within 0.6 m of the camera (near-plane clipping risk) among visible meshes
    const meshes=[];G.view.scene.traverse(o=>{if(o.isMesh&&o.visible)meshes.push(o);});let close=[];for(const m of meshes){const bb=new T.Box3().setFromObject(m);if(bb.isEmpty())continue;const d=bb.distanceToPoint(c.position);if(d<.6)close.push({d:+d.toFixed(2),h:+(bb.max.y-bb.min.y).toFixed(2),y:+bb.max.y.toFixed(2)});}
    return {atBench:G.atBench,cam:[+c.position.x.toFixed(2),+c.position.y.toFixed(2),+c.position.z.toFixed(2)],close:close.slice(0,6)};});
  await g.page.waitForTimeout(1200);
  await g.shot(`camera-render-${tag}-30-bench${suf}`);
  if(!suf){await g.orbit(300,-150,.4);await g.zoom(-800,.4);await g.page.waitForTimeout(1500);const after=await camInfo(g);await g.shot(`camera-render-${tag}-31-bench-orbit-try`);console.log(level,'after orbit/wheel',JSON.stringify(after.cam));
    await g.key('Escape',.3);await g.page.waitForTimeout(1500);await g.shot(`camera-render-${tag}-32-bench-standup`);console.log(level,'esc ->',JSON.stringify((await g.snap()).atBench),JSON.stringify((await g.snap()).paused));}
  console.log(level,suf,'atBench',s.atBench,'draw',s.drawCalls,JSON.stringify(near));
  console.log(await g.close());
}
