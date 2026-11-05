// Fix-models prop sheets: node mockups/review5/tools/fix-models/gal.mjs '[["name","only=a,b&yaw=-.5", w, h], ...]'
// Uses the review gallery page (props-gallery/gal.html) on BASE (default http://localhost:4206).
// Writes mockups/review5/shots/fix-models-<name>.jpg
import {chromium} from '@playwright/test';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),SHOTS=resolve(here,'..','..','shots');
const BASE=process.env.BASE??'http://localhost:4206';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const jobs=JSON.parse(process.argv[2]);const errs=[];
for(const [name,query,w=1200,h=760] of jobs){
  const p=await b.newPage({viewport:{width:w,height:h}});
  p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(name+': '+m.text());});
  await p.goto(`${BASE}/mockups/review5/tools/props-gallery/gal.html?${query}`);
  try{await p.waitForSelector('body[data-ready="true"]',{timeout:60000});}catch(e){console.log(errs.join('\n'));throw e;}
  await p.waitForTimeout(800);
  await p.screenshot({path:resolve(SHOTS,`fix-models-${name}.jpg`),type:'jpeg',quality:80});await p.close();}
console.log(errs.join('\n')||'ok');await b.close();
