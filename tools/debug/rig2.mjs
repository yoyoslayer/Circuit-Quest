// Logs Pip's joint rotations in real time while walking (window.__circuitCrew.snapshot().pose).
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11']});const p=await b.newPage({viewport:{width:1100,height:700}});
await p.goto('http://127.0.0.1:4173/?level=playground');await p.waitForSelector('body[data-ready="true"]');await p.getByRole('button',{name:'Start playing'}).click();await p.waitForTimeout(800);
const pose=async(t)=>console.log(t,JSON.stringify((await p.evaluate(()=>window.__circuitCrew.snapshot())).pose));
await p.keyboard.down('KeyD');for(let i=0;i<5;i++){await p.waitForTimeout(90);await pose('walk');}await p.keyboard.up('KeyD');await p.waitForTimeout(800);
await p.keyboard.press('Space');for(let i=0;i<4;i++){await p.waitForTimeout(80);await pose('jump');}
await b.close();
