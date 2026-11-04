import {launch} from '../cap.mjs';import {toBench} from './common.mjs';
const g=await launch('arcade',{fullfx:true});await g.advance(.3);
const w=()=>g.page.evaluate(()=>{const vis=e=>e&&!e.hidden&&e.offsetParent!==null;const parts={};for(const s of ['.objective .cur','.station-panel','.station-toast','.prompt-pill','.bench-chip']){const e=document.querySelector(s);parts[s]=vis(e)?e.innerText.split(/\s+/).filter(x=>/[A-Za-z0-9]/.test(x)).length:0;}return parts;});
console.log('start',JSON.stringify(await w()));
await toBench(g);await g.act('power');await g.advance(.4);console.log('bench trip',JSON.stringify(await w()));
await g.close();
