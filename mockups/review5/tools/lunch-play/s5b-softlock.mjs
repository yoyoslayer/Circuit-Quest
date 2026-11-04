import {launch} from '../cap.mjs';
const P='lunch-play-s';
const g=await launch('lunch',{fullfx:true});
const item=async(id)=>(await g.snap()).items.find(i=>i.id===id);
await g.walk(-3,7,.4);await g.key('KeyE');
await g.walk(.2,-1,.4);await g.walk(3,-5.6,.4);
await g.advance(.2,['KeyW']);await g.key('KeyQ',.05);await g.advance(3);
let w=await item('wedge');console.log('wedge',JSON.stringify(w.pos));
for(const [x,z] of [[-.9,-6.4],[-.95,-7.6],[-.95,-8.5],[7.9,-6.4],[7.9,-7.7]]){const r=await g.walk(x,z,.3,8);console.log('try',x,z,'arrived',r.arrived,JSON.stringify({x:+r.state.player.x.toFixed(2),z:+r.state.player.z.toFixed(2)}));}
await g.walk(-.9,-6.6,.3,8);await g.key('KeyE');console.log('held',(await g.snap()).held,'prompt',await g.page.evaluate(()=>document.querySelector('.prompt-pill')?.innerText));
await g.zoom(-700);await g.orbit(-300,-60);await g.shot(P+'03-west-gap');
// Now carry on: how does the door step behave? Try thick to the post without the wedge but with mop
await g.zoom(700);
console.log('wedge after',JSON.stringify((await item('wedge')).pos),'t',(await g.snap()).time.toFixed(1));
console.log('errors',await g.close());
