import {launch} from '../cap.mjs';
const P='verify-spectrum-play-';
const log=(k,v)=>console.log(k,JSON.stringify(v));
const g=await launch('spectrum',{fullfx:true,width:390,height:844});
await g.advance(.5);
await g.shot(P+'30-phone-start');
log('panel rect',await g.page.evaluate(()=>{const r=document.querySelector('.station-panel')?.getBoundingClientRect();return r&&[r.x,r.y,r.width,r.height];}));
log('stick/actions',await g.page.evaluate(()=>[...document.querySelectorAll('.stick,.hud .actions')].map(e=>[e.className,getComputedStyle(e).display])));
await g.survey();await g.shot(P+'31-phone-survey');await g.survey();
await g.walk(-6.3,3.6,.5);await g.walk(-3.5,3.55,.4);await g.key('KeyE');await g.advance(.5);
log('atBench',(await g.snap()).atBench);
await g.shot(P+'32-phone-bench');
// Tap scan: tap on the right edge where SEND should be, check if anything acts
log('html buttons at bench',await g.page.evaluate(()=>[...document.querySelectorAll('button,[role=button]')].filter(b=>b.offsetParent).map(b=>b.innerText||b.getAttribute('aria-label'))));
// try every pixel column on right edge for a 'pointer' cursor (hover over clickables)
const hits=[];for(let x=200;x<390;x+=6)for(let y=330;y<560;y+=6){await g.page.mouse.move(x,y);const c=await g.page.evaluate(()=>document.body.style.cursor);if(c==='pointer')hits.push([x,y]);}
const xs=hits.map(h=>h[0]);log('clickable max x',Math.max(...xs));
// tap far right clickables and see what changed
const before=(await g.snap()).station;
for(const [x,y] of hits.filter(h=>h[0]>=Math.max(...xs)-6)){await g.page.mouse.click(x,y);}
await g.advance(.1);const after=(await g.snap()).station;log('after right-edge taps',{power:[before.power,after.power],hatch:[before.hatchOpen,after.hatchOpen],mistakes:after.mistakes});
console.log('errors',await g.close());
