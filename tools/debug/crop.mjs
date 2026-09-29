// 2x crop of a level region: node tools/debug/crop.mjs <level> <out.png> <x> <y> <w> <h> [extra query]. Needs the dev server on 4173.
import {chromium} from '@playwright/test';
const [level,out,x,y,w,h,extra]=process.argv.slice(2);
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
await p.goto(`http://127.0.0.1:4173/?level=${level}&manual&fullfx${extra??''}`);await p.waitForSelector('body[data-ready="true"]');await p.getByRole('button',{name:'Start playing'}).click();
await p.evaluate(()=>window.__circuitCrew.drive.advance(.3));await p.waitForTimeout(1800);
await p.screenshot({path:`artifacts/${out}.png`,clip:{x:+x,y:+y,width:+w,height:+h}});await b.close();
