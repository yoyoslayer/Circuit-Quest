// Scripted camera shots of a level using the ?manual drive API, with full effects.
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const d=(fn,...a)=>p.evaluate(([f,a])=>{const drive=window.__circuitCrew.drive;return new Function('drive','a',f)(drive,a);},[fn,a]);
// Manual mode for control, but ask for full effects.
await p.goto(`http://127.0.0.1:4173/?level=${process.argv[2]??'meeting'}&manual&fullfx`);await p.waitForSelector('body[data-ready="true"]');await p.getByRole('button',{name:'Start playing'}).click();
await p.keyboard.press('KeyF');await d("drive.walkTo(-8,-5);drive.walkTo(-1,-1.5);drive.walkTo(4,-1.4);drive.advance(.8,['KeyD','ShiftLeft']);");
for(let i=0;i<8;i++)await p.mouse.wheel(0,-300);await d("drive.advance(1.2)");await p.screenshot({path:'artifacts/scene-meeting-cable.png'});
console.log(errs.join('\n')||'ok');await b.close();
