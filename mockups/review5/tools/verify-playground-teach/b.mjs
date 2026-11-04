import {launch} from '../cap.mjs';
const P='verify-playground-teach';
const g=await launch('playground',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace(/\n/g,' ')}));
const log=async(k)=>{const s=await g.snap();console.log(k,JSON.stringify({t:+s.time.toFixed(2),won:s.won,hp:s.holdingPlug,el:s.electrical,sw:s.switchedOn,strain:+s.rope.strain.toFixed(3),dc:s.drawCalls,p:[+s.player.x.toFixed(2),+s.player.z.toFixed(2)]}),JSON.stringify(await txt()));return s;};
await g.advance(.5);
// spare reel near the back wall?
for(const [x,z] of [[-4.4,-8.3],[-5.2,-8.4],[-3,-8.4]]){await g.walk(x,z,.4);await log(`probe ${x},${z}`);}
await g.zoom(-1200);await g.shot(`${P}-04-back-wall-spare`);await g.zoom(1200);
await g.walk(-7.3,4.7,.5);await g.key('KeyF');
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);
await log('at-socket');await g.shot(`${P}-05-at-socket-before-F`);
await g.key('KeyF',.3);await log('plugged');await g.shot(`${P}-06-plugged`);
// marker position check via projection: read marker world pos from three? use crop at zoom 9
await g.walk(5.2,-4.2,.4);await log('at 5.2,-4.2');
await g.zoom(-1500);await g.shot(`${P}-07-socket-standoff-prompt`);
// orbit around to see socket back
await g.orbit(700,0);await g.shot(`${P}-08-socket-orbit-a`);
await g.orbit(700,0);await g.shot(`${P}-09-socket-orbit-b`);
await g.orbit(-1400,0);
await g.walk(6.6,-5.9,.4);await log('at switch');
await g.page.addStyleTag({content:'#hud,.objective,.prompt-pill,.panel,.action-bar,.result-screen{visibility:hidden!important}'});
await g.page.keyboard.press('KeyE');await g.ev('return drive.advance(a[0])',.02);await log('after E');
await g.page.screenshot({path:`mockups/review5/shots/${P}-10-win-frame0-nohud.png`});
await g.page.waitForTimeout(2500);await g.shot(`${P}-11-win-pushin-nohud`);
console.log('errors',await g.close());
