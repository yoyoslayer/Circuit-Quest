// Screenshots of the arcade bench (dev server on 4173, or BASE=http://127.0.0.1:4187 for the preview).
// Usage: node tools/debug/bench-arcade.mjs [out-prefix]
import {chromium} from '@playwright/test';
const base=process.env.BASE??'http://127.0.0.1:4173',out=process.argv[2]??'/home/user/Circuit-Quest/artifacts/arcade';
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto(`${base}/?level=arcade&manual`);await p.waitForSelector('body[data-ready="true"]');await p.getByRole('button',{name:'Start playing'}).click();
const d=(f,...a)=>p.evaluate(([f,a])=>new Function('drive','a',f)(window.__circuitCrew.drive,a),[f,a]);
const act=(n,a)=>d('return drive.act(a[0],a[1])',n,a);
for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])console.log(JSON.stringify((await d("return drive.walkTo(a[0],a[1],.6)",x,z)).arrived));
const w=await d('return drive.walkTo(-8.3,4.4,.3)');console.log(w.arrived,JSON.stringify(w.state.player));await p.keyboard.press('KeyE');console.log((await d('return window.__circuitCrew.snapshot()')).held);
for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await d('return drive.walkTo(a[0],a[1],.6)',x,z);
await d('return drive.walkTo(1.2,-1.3,.5)');await p.keyboard.press('KeyE');await d('return drive.advance(.3)');
await d('return drive.walkTo(0,-1.55,.4)');await p.keyboard.press('KeyE');await d('return drive.advance(1)');
await p.screenshot({path:`${out}-start.png`,timeout:180000});
for(const s of [['slot','across'],['pick',220],['slot',0],['pick',47],['slot',1],['pick',47],['slot',1],['power']])await act(...s);
await d('return drive.advance(2.2)');await act('pick',100);await d('return drive.advance(.2)');
await p.screenshot({path:`${out}-running.png`,timeout:180000});
console.log(JSON.stringify((await d('return window.__circuitCrew.snapshot()')).station?.verdict));
await b.close();
