// Visual review of every room, plus physics/rig diagnostics when available in manual mode.
// Start Vite, then: node tools/design-review.mjs before|after [level ...]
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const phase=process.argv[2]??'after',out=`artifacts/design-review/${phase}`;
const levels=process.argv.slice(3).length?process.argv.slice(3):['lobby','playground','meeting','lunch','vias','vias-rush','qfn','archive','waterworks','observatory','arcade','garage','clockwork','depot','spectrum'];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=d3d11','--enable-webgl','--ignore-gpu-blocklist']});
const report=[];
try{
  for(const level of levels){
    const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${process.env.BASE_URL??'http://127.0.0.1:4174'}/?level=${level}&manual&fullfx`);
    await page.waitForSelector('body[data-ready="true"]');
    await page.getByRole('button',{name:'Start playing'}).click();
    await page.waitForTimeout(400);
    const inspect=()=>page.evaluate(()=>window.__circuitCrew.drive.inspect?.()??window.__circuitCrew.snapshot());
    const advance=s=>page.evaluate(s=>window.__circuitCrew.drive.advance(s),s);
    const initial=await inspect();await advance(8);await page.waitForTimeout(400);
    await page.screenshot({path:join(out,`${level}-play.jpg`),type:'jpeg',quality:88});
    const settled=await inspect();
    await page.keyboard.press('Tab');await page.waitForTimeout(650);
    await page.screenshot({path:join(out,`${level}-survey.jpg`),type:'jpeg',quality:88});
    await page.keyboard.press('Tab');await page.mouse.move(900,600);await page.mouse.wheel(0,-1800);await page.waitForTimeout(700);
    await page.screenshot({path:join(out,`${level}-close.jpg`),type:'jpeg',quality:88});
    const close=await inspect();await advance(4);
    const later=await inspect();
    report.push({level,initial,settled,close,later,errors});
    console.log(JSON.stringify({level,errors,fastestProp:settled.fastestProp??settled.physics?.fastestLinear}));await page.close();
  }
}finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
if(report.some(r=>r.errors.length))process.exitCode=1;
