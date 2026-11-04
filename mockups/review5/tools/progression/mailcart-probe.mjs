import {launch} from '../cap.mjs';
const g=await launch('meeting',{fullfx:true});
await g.advance(.1);
for(const [x,z] of [[-9,-6],[-9,5.3],[-3.65,5.3]]){await g.walk(x,z,.3);}
await g.key('KeyE');console.log('held at coupler',(await g.snap()).held);
for(const [x,z] of [[-9,5.3],[-9,-6.8],[-10.7,-6.8]])await g.walk(x,z,.4);
await g.key('KeyE');
for(const [x,z] of [[-9,-6],[-9,5.3],[-3,5.3]])await g.walk(x,z,.3);
await g.advance(.1);console.log('prompt at cart',await g.page.locator('.prompt-pill').innerText().catch(()=>''));
const s=await g.snap();const ext=s.items.find(i=>i.id==='extension'),cart=s.items.find(i=>i.id==='mail-cart');
console.log('player',JSON.stringify(s.player),'ext',JSON.stringify(ext?.pos),'cart',JSON.stringify(cart?.pos));
await g.zoom(-800);await g.shot('progression-43-meeting-mailcart-grab-choice');
console.log('errors',JSON.stringify(await g.close()));
