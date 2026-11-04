import {launch} from '../cap.mjs';
const K='verify-progression';
{const g=await launch('lobby',{fullfx:true});
await g.advance(1);let s=await g.snap();console.log('lobby drawCalls',s.drawCalls,'fps',s.fps);
await g.walk(7.5,5.5,.5);await g.key('KeyE',.3);
console.log('picker visible',await g.page.locator('.workshop-picker').isVisible().catch(()=>false));
const p0=(await g.snap()).player;
await g.page.keyboard.down('KeyW');await g.advance(.8);await g.page.keyboard.up('KeyW');await g.advance(.1);
const p1=(await g.snap()).player;console.log('player before',JSON.stringify(p0),'after W',JSON.stringify(p1));
await g.shot(`${K}-08-workshop-picker-after-W`);
console.log('pill visible behind picker',await g.page.locator('.prompt-pill').isVisible().catch(()=>false));
console.log('errors',JSON.stringify(await g.close()));}
{const g=await launch('meeting',{fullfx:true});
const R=async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('stuck',x,z);}};
await g.advance(.3);
let s=await g.snap();const it=n=>s.items.find(i=>i.id===n);console.log('start ext',JSON.stringify(it('extension')?.pos),'cart',JSON.stringify(it('mail-cart')?.pos));
await R([[-8.6,-3.9]],.4);await g.key('KeyE');
await R([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE',.2);
await R([[6,-1.2],[-8,-1.4]]);await R([[-9,-6],[-9,5.3],[-3.65,5.3]],.3);await g.key('KeyE');console.log('held c',(await g.snap()).held);
s=await g.snap();console.log('after coupler ext',JSON.stringify(it('extension')?.pos),'cart',JSON.stringify(it('mail-cart')?.pos));
await R([[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);await g.key('KeyE');
await R([[-9,-6],[-9,5.3],[-3,5.3]],.3);
s=await g.snap();console.log('at cart ext',JSON.stringify(it('extension')?.pos),'cart',JSON.stringify(it('mail-cart')?.pos),'player',JSON.stringify(s.player));
console.log('prompt',await g.page.locator('.prompt-pill').innerText().catch(()=>''));
await g.zoom(-800);await g.shot(`${K}-09-meeting-at-cart`);
await g.key('KeyE');console.log('held e',(await g.snap()).held);
console.log('errors',JSON.stringify(await g.close()));}
