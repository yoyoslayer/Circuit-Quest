import {launch} from '../cap.mjs';
const P='spectrum-teach-';
const g=await launch('spectrum',{fullfx:true});
const log=(...a)=>console.log(...a);
const st=async()=>(await g.snap()).station;
const route=async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)log('STUCK',x,z,JSON.stringify(res.state.player));}};
const toDesk=async(via)=>{await route(via);await g.walk(-3.5,3.55,.4);await g.key('KeyE',.2);await g.advance(1);};
const txt=async(sel)=>g.page.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.hidden?'(hidden)':e.innerText).join(' | '),sel);
const hud=async(tag)=>log(tag,'\n CARD:',await txt('.objective'),'\n PROMPT:',await txt('.prompt, [class*=prompt]'),'\n TOAST:',await txt('.station-toast'),'\n PANEL:',await txt('.station-panel'),'\n READING:',JSON.stringify((await st()).reading));
await g.advance(1);await g.shot(P+'01-start');await hud('start');
await g.survey();await g.shot(P+'02-survey');await g.key('Tab',.1);await g.advance(1);
// pod to store
await g.walk(-6.4,6.4,.6);await g.key('KeyE',.2);
await route([[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await g.key('KeyE',.2);log('podPad',(await st()).podPad);
await toDesk([[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);
await g.shot(P+'03-desk-job1-visible');await hud('desk job1');
await g.act('power',100);await g.act('send');await g.advance(.3);await g.shot(P+'04-job1-fail-visible-brick');await hud('fail vis');
await g.act('power',1);await g.act('band','radio');await g.advance(.3);await g.shot(P+'05-job1-radio-selected');await hud('radio sel');
await g.act('send');await g.advance(.3);await g.shot(P+'06-job1-radio-delivered');await hud('radio sent');
// stand up and look at the hall while radio is still selected? job index advanced; select radio, look at the lab
await g.key('KeyE',.2);await g.advance(.5);await g.shot(P+'07-hall-after-job1');await hud('hall after job1');
// pod to lab
await route([[-6.3,3.6],[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await g.walk(-9.3,-5.4,.5);await g.key('KeyE',.2);
await route([[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-4.6],[8.4,-5.6]]);await g.key('KeyE',.2);log('podPad',(await st()).podPad);
await g.shot(P+'08-pod-in-lab');
await route([[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await g.walk(-.9,-4.55,.3);await g.key('KeyE',.2);log('held',(await g.snap()).held);
await route([[-.9,-1.6],[2.6,-.2]]);await g.shot(P+'09-carry-mirror-near-A');await hud('mirror carry');await g.key('KeyE',.2);log('mirrors',(await st()).mirrors);
await g.advance(.5);await g.shot(P+'10-mirror-on-A');
await toDesk([[1.5,1.2],[.6,4.2]]);
await g.shot(P+'11-desk-job2-initial');await hud('job2 initial');
await g.act('band','nir');await g.advance(.3);await g.shot(P+'12-job2-nir-metal');await hud('job2 nir');
await g.act('aim',{what:'tx',to:'A'});await g.advance(.3);await g.shot(P+'13-job2-aim-A-bounce-back');await hud('job2 aimA');
await g.act('aim',{what:'A',to:'lab'});await g.advance(.3);await g.shot(P+'14-job2-mirror-to-lab-shutter');await hud('job2 mirror->lab');
await g.act('hatch');await g.advance(.5);await g.shot(P+'15-job2-hatch-open-clear');await hud('job2 hatch');
// stand up to see the beam in the hall
await g.key('KeyE',.2);await g.advance(.8);await g.shot(P+'16-hall-nir-beam');
await g.orbit(-350,0);await g.shot(P+'17-hall-nir-beam-orbit');await g.orbit(350,0);
await toDesk([]);
await g.act('send');await g.advance(.3);await g.shot(P+'18-job2-delivered');await hud('job2 sent');
// job3
await g.key('KeyE',.2);
await route([[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.4]]);await g.walk(8.1,-5.35,.3);await g.key('KeyE',.2);
await route([[10.2,-4.4],[10.2,-1.4],[10.2,1],[10.2,2.8],[9.4,3.9]]);await g.key('KeyE',.2);log('podPad',(await st()).podPad);
await g.shot(P+'19-pod-in-quiet');
await toDesk([[10.2,2.8],[10.2,.6],[4.5,-.6],[-.2,4.2]]);
await g.act('band','micro');await g.act('power',100);await g.advance(.3);await g.shot(P+'20-job3-micro-mesh');await hud('job3 micro');
await g.act('send');await g.advance(.3);await g.shot(P+'21-job3-micro-fail');await hud('job3 micro fail');
await g.act('band','vis');await g.act('power',1);await g.act('aim',{what:'tx',to:'quiet'});await g.advance(.3);await g.shot(P+'22-job3-vis-smoke');await hud('job3 vis');
await g.act('send');await g.advance(.3);await g.shot(P+'23-job3-vis-fail');await hud('job3 vis fail');
await g.act('band','thermal');await g.advance(.3);await g.shot(P+'24-job3-thermal');await hud('job3 thermal');
await g.act('send');await g.advance(2.5);await g.shot(P+'25-job3-win');await hud('win');
await g.advance(3);await g.shot(P+'26-result');log('snap',JSON.stringify({won:(await g.snap()).won,grade:(await g.snap()).grade,st:(await st())}));
log('errors',await g.close());
