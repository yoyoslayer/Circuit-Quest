import {launch} from '../cap.mjs';
const g=await launch('meeting');await g.advance(1);
await g.page.keyboard.press('Escape');await g.advance(.2);
console.log(await g.page.evaluate(()=>[...document.querySelectorAll('[data-ui="lens"]')].map(e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return {r:[r.x,r.y,r.width,r.height],d:cs.display,v:cs.visibility,parent:e.parentElement.className,html:e.outerHTML.slice(0,200)}})));
console.log(await g.page.evaluate(()=>[...document.querySelectorAll('.pause .grid > *')].map(e=>e.getAttribute('data-ui')+':'+getComputedStyle(e).display)));
await g.shot('meta-settings-errors-20-pause-menu');
console.log(await g.close());
