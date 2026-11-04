import {launch} from '../cap.mjs';
const g=await launch('lobby',{fullfx:true});
// Grab the live Game instance by wrapping the prototype snapshot (the same Vite module instance).
await g.page.evaluate(async()=>{const m=await import('/src/game.ts');const o=m.Game.prototype.snapshot;m.Game.prototype.snapshot=function(){window.__G=this;return o.call(this);};window.__circuitCrew.snapshot();
  try{window.__T=await import('/node_modules/.vite/deps/three.js');}catch(e){try{window.__T=await import('/node_modules/three/build/three.module.js');}catch(e2){window.__T=null;}}});
const prompt=async()=>{const v=await g.page.locator('.prompt-pill').isVisible();return v?await g.page.locator('.prompt-pill').innerText():'(none)';};
const occl=()=>g.page.evaluate(()=>{const G=window.__G,T=window.__T,cam=G.view.camera,p=G.player.translation();
  let blocked=null;
  if(T){blocked=[];for(const dy of [-.7,.0,.6]){const end=new T.Vector3(p.x,p.y+dy,p.z),dir=end.clone().sub(cam.position).normalize(),ray=new T.Raycaster(cam.position.clone(),dir,0,cam.position.distanceTo(end));
    const hits=ray.intersectObjects(G.hub.doors.map(d=>d.leaf),true);blocked.push(hits.length>0);} }
  const m=G.root.children.find(o=>o.geometry&&o.geometry.type==='ConeGeometry');let marker=null;
  if(m&&m.visible){const a=m.position.clone(),b=m.position.clone();a.y+=.21;b.y-=.21;a.project(cam);b.project(cam);marker={x:+((a.x+1)/2*innerWidth).toFixed(0),top:+((1-a.y)/2*innerHeight).toFixed(0),hpx:+((a.y-b.y)/2*innerHeight).toFixed(1),pos:[+m.position.x.toFixed(2),+m.position.y.toFixed(2),+m.position.z.toFixed(2)],outline:m.material.userData.outlineParameters};}
  return {three:!!T,p:{x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)},blockedFeetChestHead:blocked,open:G.hub.doors.map(d=>+d.open.toFixed(2)),occluders:G.occluders.length,draw:G.view.renderer.info.render.calls,marker};});
await g.advance(.5);
console.log('start',JSON.stringify(await occl()));
await g.shot('verify-lobby-play-01-start');
await g.survey();console.log('survey',JSON.stringify(await occl()));await g.page.keyboard.press('Tab');await g.advance(1.2);
// Side door Fabrication (qfn): settle the door fully, then test rays.
await g.walk(-13.9,-5.5,.4);await g.advance(1.5);console.log('qfn prompt',await prompt(),JSON.stringify(await occl()));await g.shot('verify-lobby-play-02-qfn-door-settled');
// Back door Playground
await g.walk(-11.6,-8.9,.4);await g.advance(1.5);console.log('pg prompt',await prompt(),JSON.stringify(await occl()));await g.shot('verify-lobby-play-03-pg-door-settled');
// locked rush door jiggle
await g.walk(6.96,-8.9,.4);await g.advance(1.5);await g.page.keyboard.press('KeyE');const r0=await g.page.evaluate(()=>window.__G.hub.doors.find(d=>d.locked)?.leaf.rotation.y);
await g.advance(.05);const r1=await g.page.evaluate(()=>window.__G.hub.doors.find(d=>d.locked)?.leaf.rotation.y);console.log('locked leaf rot right after E',r0,'after .05s',r1,'prompt',await prompt());
await g.shot('verify-lobby-play-04-locked-after-E');
// Workshop + beanbag
await g.walk(8.6,5.0,.25);await g.advance(.4);const pp=(await g.snap()).player;console.log('at beanbag south side',pp.x.toFixed(2),pp.z.toFixed(2),'prompt',await prompt(),'reticle',await g.page.evaluate(()=>{const r=window.__G.reticle;return r.visible?[+r.position.x.toFixed(2),+r.position.z.toFixed(2)]:null;}));
await g.shot('verify-lobby-play-05-beanbag-side');
await g.key('KeyE',.3);console.log('after E held',(await g.snap()).held,'picker',await g.page.locator('.workshop-picker').isVisible());
const a=(await g.snap()).player;await g.advance(1,['KeyD']);const b=(await g.snap()).player;console.log('picker open D moved',Math.hypot(b.x-a.x,b.z-a.z).toFixed(2),'picker vis',await g.page.locator('.workshop-picker').isVisible(),'objective vis',await g.page.locator('.objective').isVisible());
await g.page.keyboard.press('Tab');await g.advance(1);console.log('survey w/ picker',await g.page.evaluate(()=>window.__G.survey));await g.shot('verify-lobby-play-06-picker-tab');
await g.page.keyboard.press('Escape');await g.advance(.3);
console.log('errors',await g.close());
