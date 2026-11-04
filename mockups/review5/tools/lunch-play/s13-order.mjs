import {launch} from '../cap.mjs';
const P='lunch-play-o';
const g=await launch('lunch',{fullfx:true});
const W=async(x,z,r=.5)=>{const r2=await g.walk(x,z,r);if(!r2.arrived)console.log('STUCK',x,z,JSON.stringify(r2.state.player));};
const R=async(pts,r=.5)=>{for(const [x,z] of pts)await W(x,z,r);};
const st=async(tag)=>{const s=await g.snap();const l=s.lunch;console.log(tag,JSON.stringify({t:+s.time.toFixed(1),src:l.sources.map(x=>x.id+(x.tripped?'T':'')),loads:l.loads.filter(x=>['lift','conveyor'].includes(x.id)).map(x=>x.id+':'+x.state+(x.enabled?'+':'-')).join(','),ev:l.events.slice(-3).map(e=>e.kind+':'+e.id),tray:l.job.tray,temp:l.job.temperature.toFixed(2),prompt:await g.page.evaluate(()=>document.querySelector('.prompt-pill')?.hidden?'':document.querySelector('.prompt-pill')?.innerText.replace('\n',' '))}));return s;};
await W(-3,7,.4);await g.key('KeyE');await W(0,1.4);await g.key('KeyE');await g.advance(.5);
await W(2,8,.4);await g.key('KeyE');await W(.3,2,.45);await g.advance(4);await W(2,2);await g.key('KeyE');
await W(-10,7.5,.3);await g.key('KeyF');await R([[1,3],[.2,-1.2],[-3.5,-3]],.45);await g.key('KeyF');await g.advance(.5);
// shelf + cap while baking
await W(-6.5,-4.8);await g.key('KeyE');await W(-5.7,-3.3);await g.key('KeyE');
await R([[-8.8,-5],[-11.2,-6.8]]);await g.key('KeyE');
await R([[-8.8,-5],[-5,-5]]);let s=await g.snap();if(s.lunch.job.tray==='baked'||s.lunch.job.bake>=19){}
await R([[-1.5,-2],[.3,-1.3],[.3,2.4],[10,1],[11.3,-4.4]]);await g.key('KeyE');await g.advance(.1);await st('cap placed');
await R([[10,1],[1,-0.5],[-1,-2.5],[-2.4,-5.9]]);s=await st('at tray');await g.key('KeyE');await W(.2,-5.8);await g.key('KeyE');await g.advance(.2);await st('tray on belt');
for(const [bx,drop] of [[7,[-1.4,1.8]],[9,[1.5,.9]]]){await R([[.3,-1.3],[.3,2.4],[bx,7.3]],.4);await g.key('KeyE');await W(drop[0],drop[1],.4);await g.key('KeyE');}
// lift FIRST: thin-1 from A to the cart
await W(-10.8,2,.4);await g.key('KeyF');s=await g.snap();const cap=s.items.find(i=>i.id==='capacitor').pos;
await R([[.3,2.4],[10,1],[cap.x-.9,cap.z]]);await g.key('KeyF');await st('cap fed');
await W(11.8,-4.4,.45);await g.key('KeyE');await g.advance(1.5);await st('lift on first');
await R([[10,1],[-9.8,3.5]]);await g.key('KeyF');await R([[.3,2.4],[.3,-1.3],[4.7,-4.8]]);await g.key('KeyF');await g.key('KeyE');await g.advance(.3);await st('conveyor on second');
await g.shot(P+'04-conveyor-second');
await g.advance(2);await st('+2');
await R([[.3,-1.3],[.3,2.4],[-12,4]]);await st('at A');await g.shot(P+'05-cart-a');await g.key('KeyE');await g.advance(.5);await st('after reset');await g.advance(2);await st('after reset +2');
await g.shot(P+'06-after-reset');
console.log('errors',await g.close());
