import {launch} from '../cap.mjs';
const K='progression';
const g=await launch('garage',{fullfx:true});
const R=async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('stuck',x,z);}};
await g.advance(.3);
// chaos: wander and throw everything near the spawn
const spots=[[-3,3],[-5,2],[-2,5],[-6,4],[2,3]];
for(const [x,z] of spots){await g.walk(x,z,.8,6);for(let k=0;k<2;k++){await g.key('KeyE',.15);const h=(await g.snap()).held;if(h){await g.key('KeyQ',1.2);}}}
let s=await g.snap();console.log('after chaos dmg',s.damage,'cost',s.cost,'t',s.time.toFixed(1));
await g.shot(`${K}-37-garage-after-chaos`);
await R([[6.4,-4.2]]);await g.key('KeyE');console.log('held',(await g.snap()).held);
await R([[3.4,-4],[2.5,-4.4]]);await g.key('KeyE',.3);
await R([[2.9,-4],[2.9,-1.1]]);await R([[0,-1.55]],.4);await g.key('KeyE');
const steps=async l=>{for(const [n,a] of l){const r=await g.act(n,a);if(!r.ok)console.log('fail',n,a);}};
await steps([['pulse']]);await g.advance(1);
await steps([['pick','diode'],['slot','fly'],['pulse'],['test']]);
await steps([['pulse'],['pick','diode'],['pick','diode'],['pick','tvs'],['slot','switch'],['pulse'],['test']]);
await steps([['pulse'],['ground'],['pulse'],['test']]);
await g.advance(12);s=await g.snap();console.log('won',s.won,'time',s.time.toFixed(1),'dmg',s.damage,'cost',s.cost,'mist',s.station.mistakes);
await g.page.waitForSelector('body[data-complete="true"]',{timeout:15000}).catch(()=>console.log('no complete'));
await g.page.waitForTimeout(3500);await g.shot(`${K}-38-garage-result-after-chaos`);
console.log('result',(await g.page.locator('.result-screen').innerText().catch(()=>'none')).replace(/\n/g,' | '));
console.log('errors',JSON.stringify(await g.close()));
