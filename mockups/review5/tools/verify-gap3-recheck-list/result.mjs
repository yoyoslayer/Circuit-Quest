import {launch} from '../cap.mjs';
const P='verify-gap3-recheck-list-';
const st=g=>g.page.evaluate(()=>({screen:document.body.dataset.screen,mark:!!window.__mark,focus:(document.activeElement?.getAttribute('data-ui')||document.activeElement?.tagName),list:[...document.querySelectorAll('.screen[data-screen="result"] button')].map(b=>b.getAttribute('data-ui')+':'+b.tabIndex+':'+(b.offsetParent!==null))}));
let g=await launch('playground');
try{await g.advance(.3);await g.key('KeyF');for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);await g.key('KeyF',.3);await g.walk(6.6,-5.9,.4);await g.key('KeyE');await g.advance(4);
console.log('won',(await g.snap()).won);await g.page.waitForTimeout(1500);await g.shot(P+'10-result-card');
await g.page.evaluate(()=>{window.__mark=1;});console.log('start',JSON.stringify(await st(g)));
for(let i=0;i<4;i++){await g.page.keyboard.press('Tab');await g.page.waitForTimeout(200);console.log('tab',i,JSON.stringify((await st(g)).focus));}
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(1500);console.log('afterR',JSON.stringify(await st(g)));
}catch(e){console.log('ERR',e.message);}
console.log('errors',JSON.stringify(await g.close()));
g=await launch('playground');
try{await g.advance(.5);await g.page.keyboard.press('Escape');await g.page.waitForTimeout(600);await g.page.evaluate(()=>{window.__mark=1;});console.log('pause',JSON.stringify(await st(g)));await g.shot(P+'11-pause-card');
await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(2500);console.log('pause afterR',JSON.stringify(await st(g)));}catch(e){console.log('ERR',e.message);}
console.log('errors',JSON.stringify(await g.close()));
