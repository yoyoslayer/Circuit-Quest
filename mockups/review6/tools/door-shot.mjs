// Screenshot the HQ doorways: the lobby from the start view, then Pip at the arcade door.
// Usage: node mockups/review6/tools/door-shot.mjs <prefix>   (dev server on 127.0.0.1:4173)
import {chromium} from '@playwright/test';
const prefix=process.argv[2]||'door';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:4173/?manual&fullfx');await p.waitForSelector('body[data-ready="true"]');
await p.getByRole('button',{name:'Start playing'}).click();
const d=(fn,...a)=>p.evaluate(([f,a])=>new Function('drive','a',f)(window.__circuitCrew.drive,a),[fn,a]);
await d('return drive.advance(.5)');await p.waitForTimeout(900);
await p.screenshot({path:`mockups/review6/shots/${prefix}-lobby.png`});
const s=await p.evaluate(()=>window.__circuitCrew.snapshot());const door=s.hub.doors.find(x=>x.id==='arcade');
await d('return drive.walkTo(a[0],a[1],.4)',door.at.x,door.at.z);await d('return drive.advance(1.5)');await p.waitForTimeout(900);
await p.screenshot({path:`mockups/review6/shots/${prefix}-door.png`});
console.log(errs.length?errs.join('\n'):'no errors');await b.close();
