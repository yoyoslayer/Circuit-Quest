// Screenshots levels at each camera lens: node tools/debug/lens.mjs [level...] (dev server on 4173).
import {chromium} from '@playwright/test';
const levels=process.argv.slice(2).length?process.argv.slice(2):['lobby','meeting','arcade'];
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
for(const level of levels)for(const fov of (process.env.FOVS??"32,42,54").split(",").map(Number)){
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.addInitScript(f=>localStorage.setItem('circuit-crew-fov',String(f)),fov);
  await p.goto(`http://127.0.0.1:4173/${level==='lobby'?'?':`?level=${level}`}`);await p.waitForSelector('body[data-ready="true"]');
  await p.getByRole('button',{name:'Start playing'}).click();
  await p.waitForTimeout(6000);
  await p.screenshot({path:`artifacts/lens-${level}-${fov}.png`,timeout:180000});await p.close();
}
await b.close();
