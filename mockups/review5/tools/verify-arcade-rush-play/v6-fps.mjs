import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://127.0.0.1:4173/?level=arcade-rush&fullfx');await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
const s=p.getByRole('button',{name:'Start playing'});if(await s.count())await s.click();
for(let i=0;i<4;i++){await p.waitForTimeout(2000);console.log(JSON.stringify(await p.evaluate(()=>{const s=window.__circuitCrew.snapshot();return {t:+s.time.toFixed(1),fps:s.fps,dc:s.drawCalls,profile:s.profile};})));}
await b.close();
