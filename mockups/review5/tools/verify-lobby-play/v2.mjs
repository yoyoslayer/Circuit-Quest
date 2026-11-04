import {launch} from '../cap.mjs';
const g=await launch('lobby',{fullfx:true});
await g.page.evaluate(async()=>{const m=await import('/src/game.ts');const o=m.Game.prototype.snapshot;m.Game.prototype.snapshot=function(){window.__G=this;return o.call(this);};window.__circuitCrew.snapshot();});
const prompt=async()=>{const v=await g.page.locator('.prompt-pill').isVisible();return v?await g.page.locator('.prompt-pill').innerText():'(none)';};
const ret=()=>g.page.evaluate(()=>{const r=window.__G.reticle;return r.visible?[+r.position.x.toFixed(2),+r.position.z.toFixed(2)]:null;});
await g.advance(.5);
await g.walk(8.0,5.2,.25);await g.advance(.4);let p=(await g.snap()).player;console.log('near beanbag W',p.x.toFixed(2),p.z.toFixed(2),'prompt',await prompt(),'reticle',await ret());
await g.shot('verify-lobby-play-07-beanbag-workshop');
await g.walk(7.5,5.5,.3);await g.advance(.3);p=(await g.snap()).player;console.log('at arch',p.x.toFixed(2),p.z.toFixed(2),'prompt',await prompt(),'reticle',await ret());
await g.key('KeyE',.3);console.log('picker vis',await g.page.locator('.workshop-picker').isVisible(),'objective vis',await g.page.locator('.objective').isVisible(),'prompt vis',await g.page.locator('.prompt-pill').isVisible());
const a=(await g.snap()).player;await g.advance(1,['KeyS']);const b=(await g.snap()).player;console.log('picker open S moved',Math.hypot(b.x-a.x,b.z-a.z).toFixed(2),'picker still vis',await g.page.locator('.workshop-picker').isVisible());
await g.page.keyboard.press('Tab');await g.advance(1);console.log('survey w/ picker',await g.page.evaluate(()=>window.__G.survey));await g.shot('verify-lobby-play-08-picker-walked-tab');
await g.page.keyboard.press('Escape');await g.advance(.3);await g.page.keyboard.press('Tab');await g.advance(.3);
// Reception board from behind
await g.walk(0,-4.5,.4);await g.orbit(524,-100);await g.zoom(-600);await g.shot('verify-lobby-play-09-board-behind');await g.zoom(600);await g.orbit(-524,100);
// Pause in hub
await g.page.keyboard.press('Escape');await g.advance(.3);console.log('pause text',(await g.page.locator('.pause-screen').innerText()).replace(/\s+/g,' ').slice(0,400));
console.log('errors',await g.close());
// Phone survey: count doors in frustum
const h=await launch('lobby',{fullfx:true,width:390,height:844});
await h.page.evaluate(async()=>{const m=await import('/src/game.ts');const o=m.Game.prototype.snapshot;m.Game.prototype.snapshot=function(){window.__G=this;return o.call(this);};window.__circuitCrew.snapshot();});
const vis=()=>h.page.evaluate(()=>{const G=window.__G,cam=G.view.camera;return G.hub.doors.map(d=>{const v={x:d.at.x,y:1.5,z:d.at.z,isVector3:true};const P=G.player.translation();const w=cam.position.clone().set(d.at.x,1.5,d.at.z).project(cam);return `${d.level.id}:${Math.abs(w.x)<=1&&Math.abs(w.y)<=1?'IN':'out'}`;}).join(' ');});
await h.advance(.5);console.log('phone start',await vis());await h.survey();console.log('phone survey',await vis());await h.shot('verify-lobby-play-10-phone-survey');
console.log('errors',await h.close());
