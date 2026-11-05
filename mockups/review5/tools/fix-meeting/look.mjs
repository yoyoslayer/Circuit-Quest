// Fix-meeting shots: strip hub, load board, trip dwell, tripped state, win screen, reticle, projector.
// BASE=http://localhost:4201 node mockups/review5/tools/fix-meeting/look.mjs [part]
import {launch} from '../cap.mjs';
const part=process.argv[2]??'all',P='fix-meeting-',log=(...a)=>console.log(...a);
const cam=(g,yaw,pitch,zoom)=>g.page.evaluate(([y,p,z])=>{const q=window.__game;q.yaw=y;q.pitch=p;q.zoom=z;},[yaw,pitch,zoom]);
const route=async(g,pts,r=.5)=>{for(const [x,z] of pts){const s=await g.walk(x,z,r);if(!s.arrived)log('stuck',x,z,JSON.stringify(s.state.player));}};
async function toPlugged(g){
  await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await route(g,[[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE');
  await route(g,[[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');
  await route(g,[[-9,-6],[-9,5.3],[-3.3,5.5]],.3);await g.key('KeyF');await g.key('KeyF');
  await route(g,[[-1,3],[-1,-1.5],[6,-1.2],[11.4,-1.4]]);await g.key('KeyF',.3);
}
if(part==='all'||part==='strip'){
  const g=await launch('meeting');await g.advance(.3);
  await g.walk(12.3,-0.6,.4);await cam(g,.14,.5,9);await g.advance(1);await g.shot(P+'01-before-strip');
  await toPlugged(g);await g.walk(11.2,-.5,.3);await cam(g,-.35,.5,9);await g.advance(1.2);await g.shot(P+'02-plugged-hub');
  log('plugged',JSON.stringify((await g.snap()).strip));
  await cam(g,.14,.3,9);await g.advance(.5);await g.shot(P+'03-plugged-gamecam');
  await g.walk(12.3,-3.2,.4);await g.key('KeyE',1);await g.walk(11.2,-.5,.3);await cam(g,-.35,.5,9);await g.advance(.05);await g.shot(P+'04-dwell');
  log('dwell',JSON.stringify((await g.snap()).strip));
  await g.advance(2);await g.shot(P+'05-tripped');log('tripped',JSON.stringify((await g.snap()).strip));
  await g.walk(14.3,-.9,.4);await g.key('KeyE',.4);await g.walk(11.2,-.5,.3);await cam(g,-.35,.5,9);await g.advance(.5);await g.shot(P+'06-urn-unplugged-tripped');
  log('unplugged',JSON.stringify((await g.snap()).strip));
  await g.walk(12.3,-1.45,.3);await g.key('KeyE',.2);await g.advance(3);await g.shot(P+'07-win');
  await g.advance(3);await g.shot(P+'08-win-later');log('won',(await g.snap()).won);
  log('errors',JSON.stringify(await g.close()));
}
if(part==='all'||part==='projector'){
  const g=await launch('meeting');await g.advance(.3);
  await g.walk(12.6,-3.4,.4);await cam(g,.3,.35,9);await g.advance(1);await g.shot(P+'09-projector-off');
  await g.walk(12.3,-3.2,.4);await g.key('KeyE',.3);await g.walk(12.6,-3.4,.4);await cam(g,.3,.35,9);await g.advance(.5);await g.shot(P+'10-projector-on-unpowered');
  await cam(g,3.14,.25,12);await g.advance(1);await g.shot(P+'11-backwall');
  log('errors',JSON.stringify(await g.close()));
}
if(part==='all'||part==='reticle'){
  const g=await launch('meeting');await g.advance(.3);
  await g.walk(-8.6,-3.6,.4);await cam(g,.6,.4,9);await g.advance(.6);await g.shot(P+'12-reticle-strip');
  await g.walk(-12.1,4.6,.3);await cam(g,-.6,.4,9);await g.advance(.6);await g.shot(P+'13-reticle-coffee');
  await g.walk(-11.3,-6.2,.4);await cam(g,.8,.35,9);await g.advance(.6);await g.shot(P+'14-closet-extinguisher');
  log('errors',JSON.stringify(await g.close()));
}
if(part==='all'||part==='corner'){
  // R5-012 recheck: closet corner at zoom 9, 8 yaws at default and low pitch.
  const g=await launch('meeting');await g.advance(.3);await g.walk(-11.3,-7.4,.4);await g.zoom(-1500);
  for(const [tag,dy] of [['def',0],['low',-200]]){if(dy)await g.orbit(0,dy);
    for(let i=0;i<8;i++){await g.orbit(-180,0,.6);await g.page.screenshot({path:`mockups/review5/shots-full/${P}corner-${tag}-${i}.png`,scale:'css'});}}
  log('errors',JSON.stringify(await g.close()));
}
if(part==='all'||part==='tower'){
  const g=await launch('meeting');await g.advance(.3);
  await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await route(g,[[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE');
  await route(g,[[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');await route(g,[[-8,-5],[-1,-1.5],[6,-1.2]]);
  await cam(g,.14,.45,14);await g.advance(.5);await g.shot(P+'15-tower');
  await g.advance(2,['KeyD','ShiftLeft']);log('strain',(await g.snap()).rope.strain);await g.key('KeyQ',.05);await g.advance(1.5);await g.shot(P+'16-tower-after-q');
  const s=await g.snap();log('tower',s.strip.towerDown,'damage',s.damage);
  log('errors',JSON.stringify(await g.close()));
}
