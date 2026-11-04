export async function toBench(g,log=()=>{}){
  for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z,.5);
  await g.walk(-8.3,4.4,.3);await g.key('KeyE');
  for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.5);
  await g.walk(1.2,-1.3,.5);await g.key('KeyE',.3);
  await g.walk(0,-1.55,.4);await g.key('KeyE',.5);
  const s=await g.snap();log('toBench',s.atBench,s.station.trayReady,s.time.toFixed(1));return s;
}
export const txt=g=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText?.replace(/\n+/g,' | '),prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace(/\n/g,' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText}));
