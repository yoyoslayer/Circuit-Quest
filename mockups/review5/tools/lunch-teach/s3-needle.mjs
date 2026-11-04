import {launch,W,R,brief,hudText,wedge,mop} from './lib.mjs';
const K='lunch-teach';
const g=await launch('lunch',{fullfx:true});
const n=()=>g.page.evaluate(()=>[...document.querySelectorAll('.gauge')].map(e=>({cart:e.dataset.cart,cls:e.className,style:e.querySelector('.needle').style.transform,comp:getComputedStyle(e.querySelector('.needle')).transform})));
await mop(g);
await W(g,-9.8,3.5,.5);await g.key('KeyF');
await R(g,[[.3,2.4],[10,1],[11.8,-4.4]]);await g.key('KeyF');await g.advance(.2);
await g.key('KeyE',0);await g.advance(.6);
console.log('tripped',JSON.stringify(await n()));
await g.page.waitForTimeout(800);console.log('tripped+800ms real',JSON.stringify(await n()));
await g.crop(`${K}-24-crop-hud-gauge-after-kick`,{x:20,y:750,width:290,height:140});
await brief(g,'tripped');
// reset with lift still switched on: what does the player see?
await R(g,[[10,1],[.3,2.4],[-10,3.5],[-12,3.5]]);console.log('hud',await hudText(g));await g.zoom(-1500);await g.shot(`${K}-25-cart-a-tripped-close`);
await g.key('KeyE');await g.advance(.3);await brief(g,'after reset (lift still on)');console.log('hud',await hudText(g));
await g.shot(`${K}-26-reset-retrips`);
console.log('errors',JSON.stringify(await g.close()));
