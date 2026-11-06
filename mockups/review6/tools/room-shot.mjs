// Screenshot each room at the default camera (and Tab survey). Usage: node room-shot.mjs <prefix> [levels...]
// Needs the dev server on 127.0.0.1:4173.
import {chromium} from '@playwright/test';
const prefix=process.argv[2]||'room';
const levels=process.argv.slice(3).length?process.argv.slice(3):['playground','meeting','lunch','arcade','arcade-rush','garage','qfn','observatory','spectrum','lobby'];
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const errs=[];
for(const id of levels){
  const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(id+': '+e.message));
  await p.goto(`http://127.0.0.1:4173/?level=${id}&manual&fullfx`);await p.waitForSelector('body[data-ready="true"]');
  await p.getByRole('button',{name:'Start playing'}).click();
  const d=(fn,...a)=>p.evaluate(([f,a])=>new Function('drive','a',f)(window.__circuitCrew.drive,a),[fn,a]);
  await d('return drive.advance(1)');await p.waitForTimeout(900);
  await p.screenshot({path:`mockups/review6/shots/${prefix}-${id}.png`});
  await p.close();
}
console.log(errs.length?errs.join('\n'):'no errors');await b.close();
