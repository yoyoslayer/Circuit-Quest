// Close-up screenshots of Pip in each pose (idle, walk, run, jump, plug) into artifacts/rig-*.png.
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});const p=await b.newPage({viewport:{width:1100,height:700},deviceScaleFactor:2});
await p.goto('http://127.0.0.1:4173/?level=playground&fullfx');await p.waitForSelector('body[data-ready="true"]');await p.getByRole('button',{name:'Start playing'}).click();
await p.mouse.move(550,350);for(let i=0;i<20;i++){await p.mouse.wheel(0,-400);await p.waitForTimeout(30);}await p.waitForTimeout(1200);
const shot=async(n)=>p.screenshot({path:`artifacts/rig-${n}.png`,clip:{x:250,y:80,width:600,height:520}});
await p.keyboard.down('KeyD');await p.waitForTimeout(500);await shot('walk1');await p.waitForTimeout(170);await shot('walk2');
await p.keyboard.down('ShiftLeft');await p.waitForTimeout(500);await shot('run');await p.keyboard.up('ShiftLeft');await p.keyboard.up('KeyD');
await p.keyboard.press('Space');await p.waitForTimeout(160);await shot('jump');await p.waitForTimeout(1500);
await p.keyboard.press('KeyF');await p.keyboard.down('KeyS');await p.waitForTimeout(600);await shot('plug');await p.keyboard.up('KeyS');
await b.close();
