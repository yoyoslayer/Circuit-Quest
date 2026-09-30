// Capture every prepared bench on desktop and phone using the real walking/interaction driver.
// Start Vite first; BASE_URL and REVIEW_OUT override the server and output directory.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const base=process.env.BASE_URL??'http://127.0.0.1:4173';
const out=process.env.REVIEW_OUT??'artifacts/bench-review';
const plans={
  vias:[[-7,4,.6],'E',[1.2,-1.4,.5],'E',[0,-1.55,.4],'E'],
  'vias-rush':[[-7,4,.6],'E',[1.2,-1.4,.5],'E',[0,-1.55,.4],'E'],
  qfn:[[-8.8,2.95,.5],'E',[1.3,-.6,.5],'E',[0,-.5,.4],'E'],
  archive:[[-8.75,4.05,.4],'E',[-2,-4.2,.5],'E',[-2,-4.35,.35],'E'],
  waterworks:[[-7.2,3.1,.6],'E',[1.4,-1.5,.5],'E',[0,-1.5,.4],'E'],
  observatory:[[-3.7,-.1,.6],'E',[-6,3.5,.6],'E',[0,-1.55,.4],'E'],
  arcade:[[-5.5,6.6],[-7.2,5.8],[-7.9,4.4,.5],'E',[-7.2,5.8],[-5.5,6.4],[1.2,-1.3,.5],'E',[0,-1.55,.4],'E'],
  garage:[[6.4,-4.2,.5],'E',[3.4,-4],[2.5,-4.4],'E',[2.9,-4],[2.9,-1.1],[0,-1.55,.4],'E'],
  clockwork:[[-7.4,5.1,.6],'E',[2.2,-1.3,.5],'E',[-8.6,3.4,.6],'E',[-2,-1.4,.5],'E',[0,-1.55,.4],'E'],
  depot:[[5.9,-2.1,.6],'E',[-3.8,-1.6,.6],'E',[9,-2.1,.6],'E',[2.9,-1.6,.6],'E',[0,-1.5,.4],'E'],
  spectrum:[[-6.3,3.6],[-3.5,3.55,.4],'E'],
};
await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11']});
const report=[];
try{
  for(const id of process.argv.slice(2).length?process.argv.slice(2):Object.keys(plans)){
    if(!plans[id])throw new Error(`Unknown station: ${id}`);
    const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const snap=()=>page.evaluate(()=>window.__circuitCrew.snapshot());
    const advance=seconds=>page.evaluate(s=>window.__circuitCrew.drive.advance(s),seconds);
    await page.goto(`${base}/?level=${id}&manual&fullfx`);
    await page.waitForSelector('body[data-ready="true"]');
    await page.getByRole('button',{name:'Start playing'}).click();await advance(.2);
    const room=await snap();
    const firstPrompt=await page.locator('.prompt-pill').textContent();
    await page.screenshot({path:join(out,`${id}-room.jpg`),type:'jpeg',quality:85});
    for(const step of plans[id]){
      if(step==='E'){await page.keyboard.press('KeyE');await advance(.3);}
      else{
        const result=await page.evaluate(([x,z,r=.5])=>window.__circuitCrew.drive.walkTo(x,z,r),step);
        if(!result.arrived)throw new Error(`${id}: stuck walking to ${step}: ${JSON.stringify(result.state.player)}`);
      }
    }
    if(!(await snap()).atBench)throw new Error(`${id}: did not sit at the bench`);
    await advance(1.2);await page.waitForTimeout(500);
    await page.screenshot({path:join(out,`${id}-desktop.jpg`),type:'jpeg',quality:90});
    const desktop=await snap();
    await page.setViewportSize({width:390,height:844});await advance(.2);await page.waitForTimeout(500);
    await page.screenshot({path:join(out,`${id}-phone.jpg`),type:'jpeg',quality:90});
    if(id==='archive'){
      await page.locator('.as-search input').fill('Brambleworth');
      await page.locator('.as-hit',{hasText:'RC series'}).click();
      await page.screenshot({path:join(out,'archive-phone-datasheet.jpg'),type:'jpeg',quality:90});
      await page.locator('.as-doc [data-clue="bw-rc/RC0603F472-mpn"]').click();
      await page.locator('.archive-order [data-slot="mpn"]').click();
      await page.screenshot({path:join(out,'archive-phone-order.jpg'),type:'jpeg',quality:90});
    }
    report.push({id,firstPrompt,roomCalls:room.drawCalls,benchCalls:desktop.drawCalls,errors});
    console.log(JSON.stringify(report.at(-1)));await page.close();
  }
}finally{
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();
}
if(report.some(r=>r.errors.length))process.exitCode=1;
