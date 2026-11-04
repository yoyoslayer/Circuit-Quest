import {launch,W,R,brief,wedge,takeThick} from './lib.mjs';
const K='lunch-teach';
const g=await launch('lunch',{fullfx:false});
const n=()=>g.page.evaluate(()=>[...document.querySelectorAll('.gauge')].map(e=>({cart:e.dataset.cart,cls:e.className,style:e.querySelector('.needle').style.transform,comp:getComputedStyle(e.querySelector('.needle')).transform})));
await wedge(g);await takeThick(g);await R(g,[[1,3],[.2,-1.2],[-3.5,-3]],.45);await g.key('KeyF');await g.advance(.5);
await g.page.waitForTimeout(900);console.log('short',JSON.stringify(await n()));
const s=await g.snap();console.log('draw', JSON.stringify(s.lunch.sources));
// in-world gauge values
console.log(await g.page.evaluate(()=>{const l=window.__circuitCrew.lunch;return l?[...l.supplyGauges.entries()].map(([k,v])=>k+':'+v.gauge.value):'no handle'}));
console.log('errors',JSON.stringify(await g.close()));
