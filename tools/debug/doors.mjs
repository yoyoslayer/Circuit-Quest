// Lobby doors: one frame from afar, then Pip walking up to the Big Meeting door (dev server on 4173).
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:4173/?manual');await p.waitForSelector('body[data-ready="true"]');await p.getByRole('button',{name:'Start playing'}).click();
const d=(f,...a)=>p.evaluate(([f,a])=>new Function('drive','a',f)(window.__circuitCrew.drive,a),[f,a]);
await d('return drive.advance(1)');await p.screenshot({path:'artifacts/doors-0.png',timeout:180000});
const s=await p.evaluate(()=>window.__circuitCrew.snapshot());const door=s.hub.doors.find(x=>x.id==='meeting');
await d('return drive.walkTo(a[0],a[1]+.6,.5)',door.at.x,door.at.z);await d('return drive.advance(.12)');await p.screenshot({path:'artifacts/doors-1.png',timeout:180000});
await d('return drive.walkTo(a[0]+1.7,a[1]+.5,.4)',door.at.x,door.at.z);await d('return drive.advance(.8)');await p.screenshot({path:'artifacts/doors-2.png',timeout:180000});
console.log(errs.join('\n')||'ok');await b.close();
