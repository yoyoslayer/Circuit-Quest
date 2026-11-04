import {launch} from '../cap.mjs';
const P='spectrum-teach-';
const g=await launch('spectrum',{fullfx:true});
const log=(...a)=>console.log(...a);
const st=async()=>(await g.snap()).station;
const route=async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)log('STUCK',x,z);}};
const toDesk=async(via)=>{await route(via);await g.walk(-3.5,3.55,.4);await g.key('KeyE',.2);await g.advance(1);};
const txt=async(sel)=>g.page.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.hidden?'(hidden)':e.innerText.replace(/\n+/g,' / ')).join(' | '),sel);
const hud=async(tag)=>log(tag,'\n TOAST:',await txt('.station-toast'),'\n PROMPT:',await txt('.prompt'),'\n READING:',JSON.stringify((await st()).reading));
await g.advance(1);
// Job 1 with microwave at 10 mW: the minimum for that band, but the note says "more power than needed".
await g.walk(-6.4,6.4,.6);await g.key('KeyE',.2);
await route([[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await g.key('KeyE',.2);
await toDesk([[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);
await g.act('band','micro');await g.advance(.3);await hud('micro 1mW preview');await g.shot(P+'40-job1-micro-1mw-preview');
await g.act('power',10);await g.act('send');await g.advance(.3);await g.shot(P+'41-job1-micro-10mw-note');await hud('micro 10mW sent');
// Job 2: visible light via the mirror in the sunny lab.
await g.key('KeyE',.2);
await route([[-6.3,3.6],[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await g.walk(-9.3,-5.4,.5);await g.key('KeyE',.2);
await route([[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-4.6],[8.4,-5.6]]);await g.key('KeyE',.2);log('podPad',(await st()).podPad);
await g.zoom(-1500);await g.advance(.5);await g.shot(P+'42-lab-interior-sunny');await g.zoom(1500);
await route([[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await g.walk(-.9,-4.55,.3);await g.key('KeyE',.2);
await route([[-.9,-1.6],[2.6,-.2]]);await g.key('KeyE',.2);log('mirrors',(await st()).mirrors);
await toDesk([[1.5,1.2],[.6,4.2]]);
await g.act('band','vis');await g.act('power',1);await g.act('aim',{what:'tx',to:'A'});await g.act('aim',{what:'A',to:'lab'});await g.act('hatch');await g.advance(.3);
await g.shot(P+'43-job2-vis-preview');await hud('vis preview');
// A missed aim: tower a little off the mirror; see it in the hall.
await g.act('aim',{what:'tx',to:{x:3,z:-1.2}});await g.advance(.3);await g.shot(P+'44-job2-missed-desk');await hud('missed');
await g.key('KeyE',.2);await g.advance(1);await g.shot(P+'45-job2-missed-hall');
await toDesk([]);await g.act('aim',{what:'tx',to:'A'});await g.act('aim',{what:'A',to:'lab'});await g.advance(.2);
await g.act('send');await g.advance(.3);await g.shot(P+'46-job2-vis-received-tier1');await hud('vis sent');
// Job 3: near IR routed round the smoke by mirror A.
await g.key('KeyE',.2);
await route([[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.4]]);await g.walk(8.1,-5.35,.3);await g.key('KeyE',.2);
await route([[10.2,-4.4],[10.2,-1.4],[10.2,1],[10.2,2.8],[9.4,3.9]]);await g.key('KeyE',.2);log('podPad',(await st()).podPad);
await toDesk([[10.2,2.8],[10.2,.6],[4.5,-.6],[-.2,4.2]]);
await g.act('band','nir');await g.act('aim',{what:'tx',to:'A'});await g.act('aim',{what:'A',to:'quiet'});await g.advance(.3);
await g.shot(P+'47-job3-nir-mirror-round-smoke');await hud('nir via A');
await g.act('send');await g.advance(.3);await g.shot(P+'48-job3-nir-mirror-note');await hud('nir sent');
await g.advance(3);log('final',JSON.stringify(await st()));
log('errors',await g.close());
