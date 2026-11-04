import {launch} from '../cap.mjs';
const g=await launch('qfn',{fullfx:true,width:390,height:844});
await g.advance(.3);await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE',.2);await g.walk(0,-.5,.4);await g.key('KeyE');await g.advance(1.5);await g.page.waitForTimeout(1200);
const s=(await g.snap()).station;const xs=Object.values(s.cells).map(c=>c[0]);console.log('partsReady',s.partsReady,'board px x',Math.min(...xs),Math.max(...xs),'cell px',((Math.max(...xs)-Math.min(...xs))/12).toFixed(1));
await g.shot('verify-qfn-play-20-phone-bench');
// tap the prompt pill and see whether anything happens; also try tapping where SHIP would be (right edge)
const pill=await g.page.evaluate(()=>{const p=[...document.querySelectorAll('.prompt-pill')].find(e=>!e.hidden);if(!p)return null;const r=p.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,p.innerText];});console.log('pill',pill);
console.log('panel visible text',await g.page.evaluate(()=>document.querySelector('.station-panel:not([hidden])')?.innerText));
console.log('errors',await g.close());
