import {start,K} from './common.mjs';
const {g,log}=await start();
await log('start');
for(let i=0;i<19&&!(await g.snap()).won;i++)await g.advance(10);
await g.advance(2.5);await g.shot(`${K}-40-result-zero-cabinets`);const s=await g.snap();console.log('won',s.won,'damage',s.damage,'cost',s.cost);
console.log(await g.page.evaluate(()=>document.querySelector('.result')?.textContent?.replace(/\s+/g,' ')));
console.log('errors',await g.close());
