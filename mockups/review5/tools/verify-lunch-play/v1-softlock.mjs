import {launch} from '../cap.mjs';
const P='verify-lunch-play-';
const g=await launch('lunch',{fullfx:true});
const item=async(id)=>(await g.snap()).items.find(i=>i.id===id);
const pl=async()=>{const s=await g.snap();return `(${s.player.x.toFixed(2)},${s.player.y.toFixed(2)},${s.player.z.toFixed(2)})`;};
await g.walk(-3,7,.4);await g.key('KeyE');console.log('held',(await g.snap()).held);
await g.walk(.2,-1,.4);await g.walk(3,-5.6,.4);console.log('at',await pl());
await g.advance(.2,['KeyW']);await g.key('KeyQ',.05);await g.advance(3);
let w=await item('wedge');console.log('wedge after throw',JSON.stringify(w.pos));
await g.shot(P+'01-wedge-thrown');
let r=await g.walk(w.pos.x,w.pos.z,.6,8);console.log('walk to wedge arrived',r.arrived,await pl());
await g.advance(10);w=await item('wedge');console.log('wedge after 10s',JSON.stringify(w.pos));
// Try jumping onto the conveyor from the front, near its west end
await g.walk(0.3,-6.0,.3,8);console.log('front of belt',await pl());
// face north and jump
await g.advance(.15,['KeyW']);
await g.page.keyboard.press('Space');let s=await g.advance(.7,['KeyW']);console.log('after jump+W',await pl());
s=await g.advance(.5,['KeyW']);console.log('after more W',await pl());
await g.shot(P+'02-jump-onto-belt');
console.log('prompt',await g.page.evaluate(()=>document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.textContent));
await g.key('KeyE');console.log('held after E',(await g.snap()).held);
r=await g.walk(w.pos.x,w.pos.z,.6,8);console.log('walk to wedge (from belt/behind) arrived',r.arrived,await pl());
await g.key('KeyE');console.log('held after E2',(await g.snap()).held);
await g.shot(P+'03-behind-belt');
// Try to get back out with wedge: walk south, jump
await g.advance(.15,['KeyS']);await g.page.keyboard.press('Space');await g.advance(.7,['KeyS']);await g.advance(.6,['KeyS']);console.log('after jump back',await pl(),'held',(await g.snap()).held);
console.log('errors',await g.close());
