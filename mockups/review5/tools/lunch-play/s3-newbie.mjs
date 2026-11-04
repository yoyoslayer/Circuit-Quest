import {launch} from '../cap.mjs';
const P='lunch-play-n';
const g=await launch('lunch',{fullfx:true});
const ui=()=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill')?.hidden?'':document.querySelector('.prompt-pill')?.innerText.replace('\n',' '),toast:document.querySelector('.toast')?.innerText}));
const st=async(tag)=>{const s=await g.snap();const l=s.lunch;console.log(tag,JSON.stringify({t:+s.time.toFixed(1),...(await ui()),lheld:l.held?.id,cables:l.cables.map(c=>`${c.id}:${c.ports}:${c.dead?'DEAD':''}:h${c.heat.toFixed(2)}:s${c.strain.toFixed(2)}`),src:l.sources.map(x=>x.id+(x.tripped?'T':'')),loads:l.loads.map(x=>x.id+':'+x.state).join(','),ev:l.events.slice(-4).map(e=>e.kind+':'+e.id),water:l.water.toFixed(2),door:l.doorWedged,dmg:s.damage,cost:s.cost,alarmed:s.alarmed}));return s;};
const W=async(x,z,r=.5)=>{const r2=await g.walk(x,z,r);if(!r2.arrived)console.log('STUCK',x,z,JSON.stringify(r2.state.player));};
// Newbie: the prompt at spawn says F pick up thin cable -> do it, follow marker to... kitchen post
await g.key('KeyF');await st('grabbed thin at spawn');
await W(1,3,.45);await st('corridor');
await W(.2,-1.2,.45);await st('through door');await g.shot(P+'01-thin-through-door');
await W(-3.5,-3,.45);await st('at post');await g.key('KeyF');await g.advance(.3);await st('plugged post');await g.shot(P+'02-thin-plugged-unmopped');
await g.advance(1.5);await st('+1.5');await g.shot(P+'03-after-1s');
await g.advance(4);await st('+5.5');await g.shot(P+'04-after-5s');
// Reset breaker? walk to cart A
await W(.3,-1.3);await W(.3,2.4);await W(-12,4,.5);await st('at cart A');await g.shot(P+'05-cart-a-tripped');await g.key('KeyE');await g.advance(.5);await st('after reset');
await g.advance(3);await st('after reset +3');
await g.shot(P+'06-after-reset');
console.log('errors',await g.close());
