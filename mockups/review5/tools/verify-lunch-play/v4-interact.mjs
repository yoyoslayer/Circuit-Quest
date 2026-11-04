import {launch} from '../cap.mjs';
const P='verify-lunch-play-';
const ui=(g)=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill')?.hidden?'':document.querySelector('.prompt-pill')?.innerText.replace('\n',' ')}));
const cab=(s)=>s.lunch.cables.map(c=>`${c.id}:${c.ports}:${c.dead?'DEAD':''}`).join(' ');
// ---- F8: E at an untripped cart
{const g=await launch('lunch',{fullfx:false});
 let s=await g.snap();console.log('F8 props',s.props,'start',JSON.stringify(await ui(g)));
 await g.walk(-12,4,.4);console.log('F8 at cart A',JSON.stringify(await ui(g)),cab(await g.snap()));
 await g.key('KeyE');s=await g.snap();console.log('F8 after E lheld',s.lunch.held?.id,cab(s),JSON.stringify(await ui(g)));
 await g.close();}
// ---- F7: E at the jammed doorstop after the kitchen feed
{const g=await launch('lunch',{fullfx:true});
 const W=async(x,z,r=.5)=>{const r2=await g.walk(x,z,r);if(!r2.arrived)console.log('STUCK',x,z,JSON.stringify(r2.state.player));};
 await W(-3,7,.4);await g.key('KeyE');await W(0,1.4);await g.key('KeyE');await g.advance(.5);
 await W(2,8,.4);await g.key('KeyE');await W(.3,2,.45);await g.advance(4);await W(2,2);await g.key('KeyE');
 await W(-10,7.5,.3);await g.key('KeyF');await W(1,3,.45);await W(.2,-1.2,.45);await W(-3.5,-3,.45);await g.key('KeyF');await g.advance(.5);
 let s=await g.snap();console.log('F7 fed',cab(s),'oven',s.lunch.loads.find(l=>l.id==='oven').state,'wedge',JSON.stringify(s.items.find(i=>i.id==='wedge').pos));
 await W(1.0,-0.6,.35);console.log('F7 near wedge',JSON.stringify(await ui(g)),JSON.stringify(s.player));
 await g.shot(P+'10-near-wedge-prompt');
 await g.key('KeyE');s=await g.snap();console.log('F7 after E held',s.held,'wedged',s.lunch.doorWedged);
 await W(-3,-4.5,.5);await g.advance(1.5);s=await g.snap();console.log('F7 walked off held',s.held,'wedged',s.lunch.doorWedged,cab(s),'oven',s.lunch.loads.find(l=>l.id==='oven').state,JSON.stringify(await ui(g)));
 await g.shot(P+'11-door-shut-cut');
 console.log('errors',await g.close());}
