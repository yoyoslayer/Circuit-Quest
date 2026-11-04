// node mockups/review5/tools/props-gallery/shoot.mjs name "query" [w h] ...  (pairs)
import {chromium} from '@playwright/test';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),SHOTS=resolve(here,'..','..','shots');
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const jobs=JSON.parse(process.argv[2]);const errs=[];
for(const [name,query,page0='gal',w=1440,h=900] of jobs){
  const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(name+': '+m.text());});
  const url=page0==='tool'?`http://127.0.0.1:4173/tools/gallery/index.html?${query}`:`http://127.0.0.1:4173/mockups/review5/tools/props-gallery/gal.html?${query}`;
  await p.goto(url);await p.waitForSelector('body[data-ready="true"]',{timeout:120000});await p.waitForTimeout(1200);
  await p.screenshot({path:resolve(SHOTS,`props-gallery-${name}.png`)});const pb=await p.evaluate(()=>window.pipBox);if(pb)console.log(name,'pip',JSON.stringify(pb));await p.close();}
console.log(errs.join('\n')||'ok');await b.close();
