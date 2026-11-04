export const txt=g=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText?.replace(/\n+/g,' | '),prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace(/\n/g,' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText,panel:document.querySelector('.station-panel:not([hidden])')?.innerText?.replace(/\n+/g,' | '),tally:[...document.querySelectorAll('[class*=tally]')].map(e=>e.innerText.replace(/\n/g,' ')).join(' / ')}));
export async function toTray(g,log=()=>{}){
  const t0=(await g.snap()).time;
  for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z,.5);
  const r=await g.walk(-8.3,4.4,.3);log('at tray',r.arrived,(r.state.time-t0).toFixed(1));
}
export async function toBench(g,log=()=>{}){
  const t0=(await g.snap()).time;
  await toTray(g,log);await g.key('KeyE');
  for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.5);
  const r=await g.walk(1.2,-1.3,.5);log('carry to bench',r.arrived,r.state.time.toFixed(1));await g.key('KeyE',.3);
  await g.walk(0,-1.55,.4);await g.key('KeyE',.5);
  const s=await g.snap();log('toBench',s.atBench,s.station.trayReady,'t',s.time.toFixed(1),'leg',(s.time-t0).toFixed(1));return s;
}
// Solve the current rush cabinet with real keys like a player who knows the answer.
const PICK={47:'Digit1',100:'Digit2',220:'Digit3',470:'Digit4'},POS=['KeyA','KeyS','KeyD'];
export async function solveKeys(g,s,{dt=.15}={}){
  const st=s.station;const keys=[];
  if(st.setup.across)keys.push('KeyX');
  st.setup.chain.forEach((p,i)=>p.forEach(()=>keys.push(POS[i])));
  if(st.setup.reversed)keys.push('KeyF');
  st.fix.forEach((p,i)=>p.forEach(v=>keys.push(PICK[v],POS[i])));
  for(const k of keys)await g.key(k,dt);
  return keys;
}
