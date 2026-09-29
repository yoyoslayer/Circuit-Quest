// Prints page errors, console errors and failed requests while a level loads: node tools/debug/err.mjs [level].
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});const p=await b.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | ')));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log(m.type(),m.text().slice(0,300))});
p.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url().slice(0,150))});
await p.goto('http://127.0.0.1:4173/?level='+(process.argv[2]??'meeting'));await p.waitForTimeout(8000);console.log('ready',await p.evaluate(()=>document.body.dataset.ready+' '+document.body.dataset.error));await b.close();
