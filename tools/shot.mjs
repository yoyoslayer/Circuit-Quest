// Screenshots each level on the host GPU: node tools/shot.mjs [level...] (needs dev server on 4173).
import {chromium} from '@playwright/test';
const levels=process.argv.slice(2).length?process.argv.slice(2):['playground','meeting','lunch'];
const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
for(const spec of levels){
  const [level,query='']=spec.split('?');
  await page.goto(`http://127.0.0.1:4173/?level=${level}${query?'&'+query:''}`);await page.waitForSelector('body[data-ready="true"]');
  if(!query.includes('intro')){await page.getByRole('button',{name:'Start playing'}).click();await page.waitForTimeout(1500);}
  await page.screenshot({path:`artifacts/shot-${level}${query?'-'+query.replace(/[^a-z0-9]/gi,''):''}.png`});
}
console.log(errors.length?errors.join('\n'):'no errors');await browser.close();
