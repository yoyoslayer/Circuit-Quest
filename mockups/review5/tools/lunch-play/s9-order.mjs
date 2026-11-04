import {launch} from '../cap.mjs';
const P='lunch-play-o';
const g=await launch('lunch',{fullfx:false});
let s=await g.snap();console.log('lowfx drawcalls',s.drawCalls);
const W=async(x,z,r=.5)=>{const r2=await g.walk(x,z,r);if(!r2.arrived)console.log('STUCK',x,z,JSON.stringify(r2.state.player));};
const R=async(pts,r=.5)=>{for(const [x,z] of pts)await W(x,z,r);};
const st=async(tag)=>{const s=await g.snap();const l=s.lunch;console.log(tag,JSON.stringify({t:+s.time.toFixed(1),src:l.sources.map(x=>x.id+(x.tripped?'T':'')),loads:l.loads.filter(x=>['lift','conveyor','fridge','oven'].includes(x.id)).map(x=>x.id+':'+x.state+(x.enabled?'+':'-')).join(','),ev:l.events.slice(-3).map(e=>e.kind+':'+e.id),capHint:l.capHint,tray:l.job.tray,prompt:await g.page.evaluate(()=>document.querySelector('.prompt-pill')?.hidden?'':document.querySelector('.prompt-pill')?.innerText.replace('\n',' ')),card:await g.page.evaluate(()=>document.querySelector('.objective .cur')?.innerText)}));return s;};
await W(-3,7,.4);await g.key('KeyE');await W(0,1.4);await g.key('KeyE');await g.advance(.5);
await W(2,8,.4);await g.key('KeyE');await W(.3,2,.45);await g.advance(4);await W(2,2);await g.key('KeyE');
await W(-10,7.5,.3);await g.key('KeyF');await R([[1,3],[.2,-1.2],[-3.5,-3]],.45);await g.key('KeyF');await g.advance(.5);
await R([[.3,-1.3],[.3,2.4]]);await W(-10.8,2,.4);await g.key('KeyF');await R([[.3,2.4],[.3,-1.3]]);await W(-3.8,-1.7,.4);await g.key('KeyF');
s=await g.snap();await g.advance(Math.max(0,21-s.lunch.job.bake));
await W(-2.4,-5.9);await g.key('KeyE');await W(.2,-5.8);await g.key('KeyE');await g.advance(.2);
await W(-6.5,-4.8);await g.key('KeyE');await W(-5.7,-3.3);await g.key('KeyE');
await R([[-8.8,-5],[-11.2,-6.8]]);await g.key('KeyE');
await R([[-8.8,-5],[-5,-5],[.3,-1.3],[.3,2.4],[10,1],[11.3,-4.4]]);await g.key('KeyE');await g.advance(.1);
for(const [bx,drop] of [[7,[-1.4,1.8]],[9,[1.5,.9]]]){await R([[10,1],[bx,7.3]],.4);await g.key('KeyE');await W(drop[0],drop[1],.4);await g.key('KeyE');}
// WRONG ORDER: lift first
await W(-3.8,-1.7,.4);await g.key('KeyF');s=await g.snap();const cap=s.items.find(i=>i.id==='capacitor').pos;
await R([[.3,-1.3],[.3,2.4],[10,1],[cap.x-.9,cap.z]]);await g.key('KeyF');await st('cap fed');
await W(11.8,-4.4,.45);await g.key('KeyE');await g.advance(1.5);await st('lift on (no conveyor)');
await R([[10,1],[-9.8,3.5]]);await g.key('KeyF');await R([[.3,2.4],[.3,-1.3],[4.7,-4.8]]);await g.key('KeyF');await g.key('KeyE');await g.advance(.6);await st('conveyor on after lift');
await g.shot(P+'01-conveyor-after-lift');
await g.advance(2);await st('+2');
// go reset A
await R([[.3,-1.3],[.3,2.4],[-12,4]]);await st('at A');await g.shot(P+'02-at-cart-a-tripped');await g.key('KeyE');await g.advance(1.5);await st('after reset');
await g.advance(3);await st('after reset +3');await g.shot(P+'03-after-reset');
await g.advance(20);s=await st('+20');console.log('won',s.won,'time',s.time.toFixed(1));
console.log('errors',await g.close());
