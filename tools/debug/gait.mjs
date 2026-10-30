// Frames of Pip walking then running, zoomed in: node tools/debug/gait.mjs (dev server on 4173).
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:900,height:700}});
await p.goto('http://127.0.0.1:4173/?level=playground&lowfx');await p.waitForSelector('body[data-ready="true"]');
await p.getByRole('button',{name:'Start playing'}).click();await p.waitForTimeout(2500);
await p.mouse.move(450,350);for(let i=0;i<12;i++){await p.mouse.wheel(0,-300);await p.waitForTimeout(60);}
await p.keyboard.down('KeyD');await p.waitForTimeout(1500);
for(let i=0;i<6;i++){await p.screenshot({path:`artifacts/gait-walk-${i}.png`,clip:{x:200,y:120,width:500,height:460}});await p.waitForTimeout(110);}
await p.keyboard.down('ShiftLeft');await p.waitForTimeout(1500);
for(let i=0;i<6;i++){await p.screenshot({path:`artifacts/gait-run-${i}.png`,clip:{x:200,y:120,width:500,height:460}});await p.waitForTimeout(110);}
await b.close();
