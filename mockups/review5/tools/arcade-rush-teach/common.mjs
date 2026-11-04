import {launch} from '../cap.mjs';
export const K='arcade-rush-teach';
export async function start(opts={}){
  const g=await launch('arcade-rush',{fullfx:true,...opts});
  const hud=()=>g.page.evaluate(()=>{const t=q=>{const e=document.querySelector(q);return e&&!e.hidden?e.textContent.replace(/\s+/g,' ').trim():null;};
    return {prompt:t('.prompt-pill'),toast:t('.station-toast'),panel:t('.station-panel h4'),story:t('.station-panel header p'),rows:t('.station-panel ul')};});
  const st=async()=>{const s=(await g.snap());const x=s.station;return {t:+s.time.toFixed(1),i:x.index,setup:JSON.stringify(x.setup),pw:x.powered,live:x.live,tr:x.tripped,soak:x.soak,done:x.soakDone,v:x.verdict&&x.verdict.tier,mis:x.mistakes,trips:x.trips,spent:x.spent,served:x.served.length,iL:x.reading&&+(x.reading.iLoad*1000).toFixed(2),heat:+x.heat.led.toFixed(2),fix:JSON.stringify(x.fix)};};
  const log=async(tag)=>console.log(tag,JSON.stringify(await st()),JSON.stringify(await hud()));
  const A=async(list)=>{for(const [n,a] of list){const r=await g.act(n,a);if(!r?.ok)console.log('ACT FAIL',n,a);}};
  const place=(...ps)=>ps.flatMap((p,k)=>p.flatMap(v=>[['pick',v],['slot',k]]));
  const clear=async()=>{const s=(await g.snap()).station;const l=[];if(s.setup.across)l.push(['slot','across']);s.setup.chain.forEach((p,i)=>p.forEach(()=>l.push(['slot',i])));if(s.setup.reversed)l.push(['flip']);await A(l);};
  const power=async(on)=>{const s=(await g.snap()).station;if(s.powered!==on)await A([['power']]);};
  const fixIt=async()=>{const s=(await g.snap()).station;await clear();await A(s.fix.flatMap((p,i)=>p.flatMap(v=>[['pick',v],['slot',i]])));};
  const finish=async()=>{for(let i=0;i<40;i++){const s=(await g.snap()).station;if(s.soakDone)break;await g.advance(.25);}await A([['signoff']]);await g.advance(.2);};
  const toBench=async()=>{const route=async(pts,r=.6)=>{for(const [x,z] of pts)await g.walk(x,z,r);};
    await route([[-5.5,6.6],[-7.2,5.8]]);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
    await route([[-7.2,5.8],[-5.5,6.4]]);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);};
  return {g,hud,st,log,A,place,clear,power,fixIt,finish,toBench};
}
