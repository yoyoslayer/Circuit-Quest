// Prop count and layout audit for levels (dev server on 4173): node tools/debug/audit.mjs [levels...]
import {chromium} from '@playwright/test';
const levels=process.argv.slice(2);const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
for(const l of levels){const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(`http://127.0.0.1:4173/?level=${l}&manual`);await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
  const r=await p.evaluate(()=>({props:window.__circuitCrew.snapshot().props,audit:window.__circuitCrew.drive.audit()}));console.log(l,'props',r.props,'overlaps',JSON.stringify(r.audit).slice(0,600),errs.join(' '));await p.close();}
await b.close();
