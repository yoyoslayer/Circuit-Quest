// Full-effects screenshots (AO, bloom, grade) of levels at the walk camera: node tools/debug/look.mjs [levels...]
// Dev server on 4173 (or BASE=...). Output: artifacts/look-<level><TAG>.png; Q=norim adds query flags.
import {chromium} from '@playwright/test';
const base=process.env.BASE??'http://127.0.0.1:4173',levels=process.argv.slice(2).length?process.argv.slice(2):['meeting','arcade'];
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
for(const level of levels){const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(`${base}/?level=${level}&manual&fullfx${process.env.Q?`&${process.env.Q}`:""}`);await p.waitForSelector('body[data-ready="true"]',{timeout:120000});await p.getByRole('button',{name:'Start playing'}).click();
  await p.evaluate(()=>window.__circuitCrew.drive.advance(1.5));await p.screenshot({path:`/home/user/Circuit-Quest/artifacts/look-${level}${process.env.TAG??""}.png`,timeout:240000});await p.close();console.log(level);}
await b.close();
