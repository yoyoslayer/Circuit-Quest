import {launch} from './wrcap.mjs';
const g=await launch('lunch');await g.advance(.5);
const P=(await g.snap()).player;
const pr=(await g.props()).map(q=>({...q,d:Math.hypot(q.x-P.x,q.z-P.z)})).sort((a,b)=>a.d-b.d).slice(0,8);
console.log(JSON.stringify(pr.map(q=>[q.k,q.id,q.x.toFixed(1),q.y.toFixed(2),q.z.toFixed(1),q.d.toFixed(1)])));
for(const q of pr.filter(q=>!q.id).slice(0,4)){const w=await g.walk(q.x,q.z,1.0,8);await g.key('KeyE',.2);const s=await g.snap();console.log(q.k,'arrived',w.arrived,'held',s.held,JSON.stringify(s.player));if(s.held)break;}
console.log(await g.page.evaluate(()=>[...document.querySelectorAll('div,span')].filter(e=>/Grab|Put|Pick/.test(e.textContent)&&e.children.length<3).map(e=>e.textContent).slice(0,3)));
console.log(JSON.stringify(await g.close()));
