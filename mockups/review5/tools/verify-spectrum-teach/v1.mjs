import {launch} from '../cap.mjs';
const P='verify-spectrum-teach-';
const g=await launch('spectrum',{fullfx:true});
const log=(...a)=>console.log(...a);
const st=async()=>(await g.snap()).station;
const route=async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)log('STUCK',x,z);}};
const txt=async(sel)=>g.page.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.hidden?'(hidden)':e.innerText.replace(/\n+/g,' / ')).join(' | '),sel);
await g.advance(1);
// The chart on the side wall (x=-11, z~4.6).
await g.walk(-8.6,4.0,.5);await g.zoom(-1500);await g.advance(.4);await g.shot(P+'01-chart-default');
await g.orbit(-300,0);await g.shot(P+'02-chart-orbit-a');
await g.orbit(600,0);await g.shot(P+'03-chart-orbit-b');
await g.zoom(1500);
// Pod onto the store pad, then the desk.
await g.walk(-6.4,6.4,.6);await g.key('KeyE',.2);
await route([[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await g.key('KeyE',.2);log('podPad',(await st()).podPad);
await route([[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);await g.walk(-3.5,3.55,.4);await g.key('KeyE',.2);await g.advance(1);
for(const [i,b] of ['vis','radio','micro','thermal','nir'].entries()){await g.act('band',b);await g.advance(.3);
  log(b,'PANEL:',await txt('.station-panel'),'\n PROMPT:',await txt('.prompt'),'\n READ:',JSON.stringify((await st()).reading),'mistakes',(await st()).mistakes,'spent',(await st()).spent);
  await g.shot(P+`1${i}-desk-cycle-${b}`);}
log('errors',await g.close());
