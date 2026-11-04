import {launch} from '../cap.mjs';
const ui=(g)=>g.page.evaluate(()=>({prompt:document.querySelector('.prompt-pill')?.hidden?'':document.querySelector('.prompt-pill')?.innerText.replace('\n',' ')}));
const cab=(s)=>s.lunch.cables.map(c=>`${c.id}:${c.ports}:${c.ends.map(e=>e.x.toFixed(1)+','+e.z.toFixed(1)).join('/')}`).join(' ');
const g=await launch('lunch',{fullfx:false});
let s=await g.snap();console.log('supply-a',JSON.stringify(s.items.find(i=>i.id==='supply-a').pos),cab(s));
for(const [x,z] of [[-12,4],[-12.2,3.6],[-12,2.6],[-11.8,3.2]]){const r=await g.walk(x,z,.3,6);s=await g.snap();const a=s.items.find(i=>i.id==='supply-a').pos;console.log('try',x,z,'pip',s.player.x.toFixed(2),s.player.z.toFixed(2),'cartA',a.x.toFixed(2),a.z.toFixed(2),JSON.stringify(await ui(g)));
  if((await ui(g)).prompt){await g.key('KeyE');s=await g.snap();console.log(' after E lheld',s.lunch.held?.id,cab(s));
   // put it back with F
   await g.key('KeyF');s=await g.snap();console.log(' after F',s.lunch.held?.id,cab(s));
   // second E (the double-tap)
   await g.key('KeyE');s=await g.snap();console.log(' after E2',s.lunch.held?.id,cab(s));break;}}
console.log('errors',await g.close());
