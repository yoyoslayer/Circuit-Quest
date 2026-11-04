import {launch} from '../cap.mjs';
const P='meta-settings-errors-';
const place=(...positions)=>positions.flatMap((p,k)=>p.flatMap(v=>[['pick',v],['slot',k]]));
const steps=async(g,l)=>{for(const [n,a] of l){const r=await g.act(n,a);if(!r.ok)console.log('FAIL',n,a,JSON.stringify(r).slice(0,200));}};
async function toBench(g){for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z,.6);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
  for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.6);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.3);await g.walk(0,-1.55,.4);await g.key('KeyE',1);}
async function solve(g){
  await steps(g,[['power']]);await g.advance(.5);await steps(g,[['slot','across'],...place([220])]);await g.advance(2.6);await g.advance(3.2);await steps(g,[['signoff']]);
  await steps(g,[['flip'],...place([47]),['power']]);await g.advance(3.4);await steps(g,[['signoff']]);
  await steps(g,[['power']]);await g.advance(2.4);await steps(g,[...place([470],[470]),['power']]);await g.advance(3.4);await steps(g,[['signoff']]);
  await steps(g,[['slot',0],...place([470],[470]),['power']]);await g.advance(3.4);await steps(g,[['signoff']]);
  await steps(g,[...place([470],[470]),['power']]);await g.advance(3.4);await steps(g,[['signoff']]);await g.advance(.5);
}
const ls=g=>g.page.evaluate(()=>({best:localStorage.getItem('circuit-crew:best:v1'),muted:localStorage.getItem('circuit-crew-muted'),fov:localStorage.getItem('circuit-crew-fov')}));
// --- practice arcade
let g=await launch('arcade',{query:'practice'});
await g.page.evaluate(()=>localStorage.removeItem('circuit-crew:best:v1'));
await g.advance(.5);await g.shot(P+'40-arcade-practice-start');
await toBench(g);await solve(g);await g.page.waitForTimeout(2600);
const s=await g.snap();console.log('practice won',s.won,'mistakes',s.station?.mistakes,'ls',await ls(g));
await g.shot(P+'41-arcade-practice-result');
const btns=await g.page.evaluate(()=>[...document.querySelectorAll('.result-screen button')].map(b=>b.getAttribute('aria-label')+'|'+b.dataset.ui));console.log(btns);
// click Next job
await g.page.locator('.result-screen [data-ui="nextjob"]').click();await g.page.waitForTimeout(2500);
console.log('after next job url',await g.page.evaluate(()=>location.search+' practice='+document.body.dataset.practice+' screen='+document.body.dataset.screen));
await g.shot(P+'42-after-practice-nextjob');
console.log('errors',await g.close());
// --- lobby: is arcade-rush still locked after practice arcade? 
g=await launch('lobby');await g.advance(.5);
console.log('lobby ls',await ls(g));
const ds=await g.snap();console.log('hub',JSON.stringify(ds.hub??ds.doors??Object.keys(ds)).slice(0,600));
console.log('errors',await g.close());
