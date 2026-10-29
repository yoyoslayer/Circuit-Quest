// Screenshots the prop gallery: node tools/debug/gallery.mjs [query] (dev server on 4173).
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:4173/tools/gallery/index.html?${process.argv[2]??''}`);await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
await p.waitForTimeout(1500);await p.screenshot({path:`artifacts/gallery${process.argv[3]??''}.png`,timeout:180000});console.log(errs.join('\n')||'ok');await b.close();
