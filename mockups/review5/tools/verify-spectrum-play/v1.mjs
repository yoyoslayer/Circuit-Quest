import {launch} from '../cap.mjs';
const P='verify-spectrum-play-';
const ui=g=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,pill:(()=>{const p=document.querySelector('.prompt-pill');return p&&!p.hidden?p.innerText.replace(/\n/g,' '):null})(),toast:(()=>{const t=document.querySelector('.station-toast');return t&&!t.hidden?t.innerText:null})(),words:(document.querySelector('[data-layer=hud]')?.innerText??'').split(/\s+/).filter(Boolean).length}));
const route=async(g,pts,r=.5)=>{for(const [x,z] of pts){const w=await g.walk(x,z,r);if(!w.arrived)console.log('STUCK',x,z,JSON.stringify(w.state.player));}};
const log=(k,v)=>console.log(k,JSON.stringify(v));
const g=await launch('spectrum',{fullfx:true});
await g.advance(.5);let s=await g.snap();log('start',{dc:s.drawCalls,props:s.props,rope:s.rope,fps:s.fps});
await g.shot(P+'01-start');
await g.survey();s=await g.snap();log('survey dc',s.drawCalls);await g.survey();
// pick pod
await g.walk(-6.4,6.4,.6);await g.key('KeyE');
await route(g,[[-10.1,3]]);log('carry mid-hall ui',await ui(g));
await g.shot(P+'02-carry-mid');
await route(g,[[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);
await g.shot(P+'03-in-store-holding');
await g.key('KeyE');s=await g.snap();log('podPad',s.station.podPad);log('after drop ui',await ui(g));
await g.shot(P+'04-pod-on-store-pad');
await g.zoom(-1500);await g.shot(P+'05-store-zoom9');await g.zoom(1500);
await route(g,[[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);await g.walk(-3.5,3.55,.4);await g.key('KeyE');await g.advance(.3);
log('bench ui',await ui(g));
await g.shot(P+'06-bench-vis');
log('bench words (before toast)',(await ui(g)).words);
await g.act('band','radio');log('after radio ui',await ui(g));
await g.shot(P+'07-bench-radio');
await g.act('send');await g.advance(.3);log('after send',await ui(g));s=await g.snap();log('station',{job:s.station.job,reading:s.station.reading});
await g.shot(P+'08-bench-after-send1');
await g.key('KeyE');
// job2
await route(g,[[-6.3,3.6],[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await g.walk(-9.3,-5.4,.5);await g.key('KeyE');
await route(g,[[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-4.6],[8.4,-5.6]]);
await g.shot(P+'09-in-lab-holding');
await g.key('KeyE');log('lab podPad',(await g.snap()).station.podPad);
await g.shot(P+'10-pod-on-lab-pad');
await route(g,[[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await g.walk(-.9,-4.55,.3);await g.key('KeyE');log('held',(await g.snap()).held);
await route(g,[[-.9,-1.6]]);log('carry mirror ui',await ui(g));
await route(g,[[2.6,-.2]]);await g.key('KeyE');log('mirror stood ui',await ui(g));log('mirrors',(await g.snap()).station.mirrors);
await g.shot(P+'11-mirror-stood-A');
await route(g,[[1.5,1.2],[.6,4.2]]);await g.walk(-3.5,3.55,.4);await g.key('KeyE');await g.advance(1);
await g.act('band','nir');log('nir ui',await ui(g));log('nir reading',(await g.snap()).station.reading);
await g.shot(P+'12-bench-nir-shutter');
// F4: hover scan for grab cursor over map
const pts=[];for(let x=520;x<=920;x+=8)for(let y=380;y<=660;y+=8){await g.page.mouse.move(x,y);const c=await g.page.evaluate(()=>document.body.style.cursor);if(c==='grab')pts.push([x,y]);}
log('grab px count',pts.length);
if(pts.length){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);log('grab bbox',[Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)]);
  const cx=Math.round((Math.min(...xs)+Math.max(...xs))/2),cy=Math.round((Math.min(...ys)+Math.max(...ys))/2);
  const before=(await g.snap()).station.aim;
  await g.page.mouse.click(cx+10,cy+6);await g.advance(.1);const after=(await g.snap()).station;log('click near A',{before,after:after.aim,spots:after.reading.spots,blocked:after.reading.blocked});
  await g.shot(P+'13-bench-click-on-A');
  // aim tx at A via act, then show TOO WEAK
  await g.act('aim',{what:'tx',to:'A'});s=await g.snap();log('tx->A reading',s.station.reading);log('ui',await ui(g));
  await g.shot(P+'14-bench-tx-on-A');
  await g.crop(P+'15-crop-link',{x:700,y:300,width:260,height:140});
}
await g.act('aim',{what:'A',to:'lab'});log('A->lab shut ui',await ui(g));
await g.act('hatch');await g.act('send');await g.advance(.3);log('after send2',await ui(g));
await g.key('KeyE');
// job3
await route(g,[[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.4]]);await g.walk(8.1,-5.35,.3);await g.key('KeyE');
await route(g,[[10.2,-4.4],[10.2,-1.4],[10.2,1],[10.2,2.8],[9.4,3.9]]);await g.key('KeyE');log('quiet',(await g.snap()).station.podPad);
await route(g,[[10.2,2.8],[10.2,.6],[4.5,-.6],[-.2,4.2]]);await g.walk(-3.5,3.55,.4);await g.key('KeyE');await g.advance(.5);
await g.act('band','thermal');await g.act('power',1);
s=await g.snap();log('pre-win time',s.time);
await g.act('send');
await g.page.waitForTimeout(400);await g.page.screenshot({path:'mockups/review5/shots/'+P+'16-win-0p4.png'});
await g.page.waitForTimeout(1400);await g.page.screenshot({path:'mockups/review5/shots/'+P+'17-win-1p8.png'});
s=await g.snap();log('won',{won:s.won,time:s.time,damage:s.damage,cost:s.cost});
await g.shot(P+'18-result');
console.log('errors',await g.close());
