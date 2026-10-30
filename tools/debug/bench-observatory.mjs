// Screenshot of the observatory bench with the HUD (dev server on 4173).
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://127.0.0.1:4173/?level=observatory&manual');await p.waitForSelector('body[data-ready="true"]');await p.getByRole('button',{name:'Start playing'}).click();
const d=(f,...a)=>p.evaluate(([f,a])=>new Function('drive','a',f)(window.__circuitCrew.drive,a),[f,a]);
await d('return drive.walkTo(-3.7,-.1,.6)');await p.keyboard.press('KeyE');await d('return drive.walkTo(-6,3.5,.6)');await p.keyboard.press('KeyE');await d('return drive.advance(.3)');
await d('return drive.walkTo(0,-1.55,.4)');await p.keyboard.press('KeyE');await d('return drive.advance(1.2)');
await p.screenshot({path:'/home/user/Circuit-Quest/artifacts/ui-bench.png',timeout:180000});await b.close();
