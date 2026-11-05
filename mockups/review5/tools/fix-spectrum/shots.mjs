// Spectrum fixes: walks the clean run and captures the fixed moments (fix-spectrum-*).
// Needs a dev server: npx.cmd vite --port 4195 --strictPort, then BASE=http://127.0.0.1:4195 node shots.mjs
import {launch} from '../cap.mjs';
const g=await launch('spectrum');
const log=(...a)=>console.log(...a);
const route=async pts=>{for(const [x,z] of pts){const r=await g.walk(x,z,.5);if(!r.arrived)throw new Error(`stuck to ${x},${z}`);}};
const E=()=>g.key('KeyE',.2);
const st=async()=>(await g.snap()).station;
const pill=()=>g.page.locator('.prompt-pill').textContent();
const toDesk=async via=>{await route(via);await g.walk(-3.5,3.55,.4);await E();};
const DESK_FRONT=[[-6.3,3.6]];
await g.advance(.5);await g.shot('fix-spectrum-00-start');
// 1 · pod to the storeroom: the door swings open for Pip, then the pill doesn't offer to pick the pod back up.
await g.walk(-6.4,6.4,.6);await E();
await route([[-10.1,3],[-10.1,-2.2]]);await g.advance(.3);await g.shot('fix-spectrum-01-store-door-open');
await route([[-10.1,-4.4],[-9.3,-5.5]]);await E();await g.advance(.2);log('placed pill:',await pill());await g.shot('fix-spectrum-02-pod-on-store-pad');
await toDesk([[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],...DESK_FRONT]);await g.advance(.5);
log('bench vis pill:',await pill(),'doors',JSON.stringify((await st()).doors));await g.shot('fix-spectrum-03-bench-vis-blocked');
await g.act('band','radio');await g.advance(.3);await g.shot('fix-spectrum-04-bench-radio-before-send');
await g.act('send');await g.advance(.3);await g.shot('fix-spectrum-05-send-hold-0.3s');
await g.advance(.5);await g.shot('fix-spectrum-06-send-hold-0.8s');
await g.advance(.7);await g.shot('fix-spectrum-07-send-hold-1.5s');
await g.advance(.5);log('after hold job',(await st()).job);await g.shot('fix-spectrum-08-next-job');
// 2 · the lab: pod in through the lab door, mirror on A.
await E();
await route([...DESK_FRONT,[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await g.walk(-9.3,-5.4,.5);await E();
await route([[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-3.6]]);await g.advance(.2);await g.shot('fix-spectrum-09-lab-door-open');
await route([[10.2,-4.6],[8.4,-5.6]]);await E();
await route([[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await g.walk(-.9,-4.55,.3);await E();
await route([[-.9,-1.6],[2.6,-.2]]);await E();await g.advance(.2);log('mirror placed pill:',await pill());await g.shot('fix-spectrum-10-mirror-on-A');
await toDesk([[1.5,1.2],[.6,4.2]]);await g.act('band','nir');await g.advance(.3);
let s=await st();const A=s.map.A,lab=s.map.lab;
await g.page.mouse.move(A[0],A[1]);await g.advance(.1);log('hover A pill:',await pill());
await g.click(A[0],A[1]);await g.advance(.3);s=await st();log('after click A',JSON.stringify(s.reading),JSON.stringify(s.aim));
await g.shot('fix-spectrum-11-click-A-tower-aims-missed');
await g.page.mouse.move(A[0],A[1]);await g.page.mouse.down();for(let k=1;k<=8;k++)await g.page.mouse.move(A[0]+(lab[0]-A[0])*k/8,A[1]+(lab[1]-A[1])*k/8);await g.page.mouse.up();await g.advance(.2);
s=await st();if(s.reading.blocked!=='metal')await g.act('aim',{what:'A',to:'lab'});
await g.page.mouse.move(5,5);await g.advance(.2);log('on shut hatch pill:',await pill(),JSON.stringify((await st()).reading));await g.shot('fix-spectrum-12-beam-on-shut-hatch');
await g.act('hatch');await g.act('send');await g.advance(.9);await g.shot('fix-spectrum-13-lab-delivered-waterfall');
await g.advance(1);
// The lab from the hall: the beam reaches the pad clear of clutter, the sun glare on the pod.
await E();await g.act('band','nir');
await route([[-.2,4.2],[.4,.2],[1,-1.8],[5.4,-2.2]]);await g.advance(.4);await g.shot('fix-spectrum-14-lab-from-hatch');
// 3 · the quiet room.
await route([[9,-1.8],[10.2,-2.6],[10.2,-4.4]]);await g.walk(8.1,-5.35,.3);await E();
await route([[10.2,-4.4],[10.2,-1.4],[10.2,1]]);await g.advance(.2);await g.shot('fix-spectrum-15-cage-door-open');
await route([[10.2,2.8],[9.4,3.9]]);await E();
await route([[10.2,2.8],[10.2,.6]]);await g.advance(1.2);log('cage door after leaving',JSON.stringify((await st()).doors));await g.shot('fix-spectrum-16-cage-door-shut');
await toDesk([[4.5,-.6],[-.2,4.2]]);
await g.act('band','vis');await g.act('power',10);await g.advance(.2);await g.shot('fix-spectrum-17-vis-smoke-before-send');
await g.act('send');await g.advance(.9);log('vis smoke',JSON.stringify((await st()).reading),'mistakes',(await st()).mistakes);await g.shot('fix-spectrum-18-vis-smoke-waterfall');
await g.act('band','thermal');await g.act('power',1);await g.act('send');await g.advance(2.5);await g.shot('fix-spectrum-19-win');
log('final',JSON.stringify((await g.snap()).station.delivered));
log('errors',JSON.stringify(await g.close()));
