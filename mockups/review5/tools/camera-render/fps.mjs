// Real (non-manual) runs: fps and draw calls after 6 s of play at default quality (fresh profile -> quality 0) and forced quality 2.
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
for(const level of ['playground','meeting','lunch','arcade','garage','observatory']){
  for(const q of [null,'2']){
  const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
  if(q)await p.addInitScript(v=>{try{localStorage.setItem('circuit-crew-quality',v)}catch{}},q);
  await p.goto(`http://127.0.0.1:4173/?level=${level}`);await p.waitForSelector('body[data-ready="true"]');
  const s=p.getByRole('button',{name:'Start playing'});if(await s.count())await s.click();
  await p.waitForTimeout(6000);
  const r=await p.evaluate(()=>{const s=window.__circuitCrew.snapshot();return {fps:Math.round(s.fps),draw:s.drawCalls,prof:s.profile};});
  console.log(level.padEnd(12),'stored',q??'none',JSON.stringify(r));await ctx.close();}
}
await b.close();
