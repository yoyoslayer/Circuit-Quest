import {start,K} from './common.mjs';
const mode=process.argv[2]||'idle';
const {g,log,power,fixIt,finish,toBench,A}=await start();
if(mode==='good'){await toBench();for(let i=0;i<9;i++){await power(false);await fixIt();await power(true);await finish();}await log('served9');
  await A([['pick',220],['slot',0]]);
  for(let i=0;i<60;i++){const s=await g.snap();if(s.time>=176)break;await g.advance(1);}
  await g.shot(`${K}-41-clock-4s-left-midjob`);await log('4 s left');
  await g.advance(3.5);await log('after clock');await g.shot(`${K}-42-clock-out-at-bench`);}
for(let i=0;i<40&&!(await g.snap()).won;i++)await g.advance(5);
await g.advance(1);await g.page.waitForTimeout(4500);await g.shot(`${K}-${mode==='good'?'44-result-9-cabinets':'43-result-zero-cabinets'}`);
const s=await g.snap();console.log(mode,'won',s.won,'damage',s.damage,'cost',s.cost,'time',s.time);
console.log(await g.page.evaluate(()=>document.querySelector('.result')?.innerText?.replace(/\s+/g,' ')));
console.log('errors',await g.close());
