import {launch} from '../cap.mjs';
const P='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
const log=(...a)=>console.log(...a);
const pill=async()=>g.page.evaluate(()=>{const p=document.querySelector('.prompt-pill');return p?(p.hidden?'[hidden]':p.innerText.replace(/\n/g,' ')):'none';});
const st=async(tag)=>{const s=await g.snap();log(tag,'pill=',await pill(),'aim=',JSON.stringify(s.station.aim),'reading=',JSON.stringify(s.station.reading),'hatch',s.station.hatchOpen,'band',s.station.band);return s;};
const W=async(x,z,r=.5)=>{const res=await g.walk(x,z,r);if(!res.arrived)log('STUCK',x,z,JSON.stringify(res.state.player));return res;};
const route=async(pts)=>{for(const [x,z] of pts)await W(x,z);};
const E=()=>g.key('KeyE',.2);
await g.advance(.5);
await W(-6.4,6.4,.6);await E();await route([[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await E();
await route([[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);await W(-3.5,3.55,.4);await E();await g.advance(1.2);
await g.act('band','radio');await g.act('send');await g.advance(.3);await E();
await route([[-6.3,3.6],[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await W(-9.3,-5.4,.5);await E();
await route([[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-4.6],[8.4,-5.6]]);await E();
await route([[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await W(-.9,-4.55,.3);await E();await route([[-.9,-1.6],[2.6,-.2]]);await E();
await route([[1.5,1.2],[.6,4.2]]);await W(-3.5,3.55,.4);await E();await g.advance(1.2);
// Real UI: click the NEAR IR key on the bench
const m=g.page.mouse;
const click=async(x,y,tag)=>{await m.move(x,y);await g.advance(.05);await m.down();await g.advance(.05);await m.up();await g.advance(.2);return st(tag);};
await click(367,575,'click NEAR IR key');
await g.shot(`${P}-70-real-nir-key`);
// Try 1: click directly ON mirror A on the map (777,517)
await click(777,517,'click on mirror A');await g.shot(`${P}-71-click-on-mirror-A`);
// Try 2: press on empty map near tower, drag to mirror A, release
await m.move(740,600);await g.advance(.05);await m.down();for(let k=1;k<=10;k++){await m.move(740+(785-740)*k/10,600+(512-600)*k/10);await g.advance(.03);}
await st('dragging tx onto A');await g.shot(`${P}-72-drag-tower-onto-A`);await m.up();await g.advance(.2);await st('released');
// Try 3: drag mirror A toward the lab pad
await m.move(777,517);await g.advance(.05);await m.down();for(let k=1;k<=10;k++){await m.move(777+(827-777)*k/10,517+(427-517)*k/10);await g.advance(.03);}
await st('dragging mirror to lab');await g.shot(`${P}-73-drag-mirror-to-lab`);await m.up();await g.advance(.2);await st('released mirror');
// Click LAB HATCH rocker (1010,600)
await click(1010,600,'click hatch rocker');await g.shot(`${P}-74-after-hatch-click`);
// keyboard arrows aiming
await g.key('ArrowLeft',.1);await g.key('ArrowLeft',.1);await st('arrow left x2');
await g.key('ArrowRight',.1);await g.key('ArrowRight',.1);await st('arrow right x2');
// hover over map: prompt
await m.move(650,500);await g.advance(.1);await st('hover map');
// Escape mid-drag
await m.move(740,600);await m.down();await m.move(760,560);await g.advance(.05);await g.key('Escape',.2);await m.up();await g.advance(.2);const s=await st('esc mid drag');log('atBench',s.atBench,'paused',s.paused);
log('ERR',JSON.stringify(await g.close()));
