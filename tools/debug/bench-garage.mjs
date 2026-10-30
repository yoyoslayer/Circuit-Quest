// Screenshots of the garage bench: the kick arcing with nothing fitted, then the diode's slow fade.
// Dev server on 4173 (or BASE=...). Usage: node tools/debug/bench-garage.mjs [out-prefix]
import {chromium} from '@playwright/test';
const base=process.env.BASE??'http://127.0.0.1:4173',out=process.argv[2]??'/home/user/Circuit-Quest/artifacts/garage';
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto(`${base}/?level=garage&manual`);await p.waitForSelector('body[data-ready="true"]');await p.getByRole('button',{name:'Start playing'}).click();
const d=(f,...a)=>p.evaluate(([f,a])=>new Function('drive','a',f)(window.__circuitCrew.drive,a),[f,a]);
const act=(n,a)=>d('return drive.act(a[0],a[1])',n,a);
await d('return drive.walkTo(6.4,-4.2,.5)');await p.keyboard.press('KeyE');
for(const [x,z] of [[3.4,-4],[2.5,-4.4]])await d('return drive.walkTo(a[0],a[1],.5)',x,z);await p.keyboard.press('KeyE');await d('return drive.advance(.3)');
for(const [x,z] of [[2.9,-4],[2.9,-1.1],[0,-1.55]])await d('return drive.walkTo(a[0],a[1],.4)',x,z);await p.keyboard.press('KeyE');await d('return drive.advance(.5)');
await act('pulse');await d('return drive.advance(.85)');
await p.screenshot({path:`${out}-arc.png`,timeout:180000});
await act('pick','diode');await act('slot','fly');await d('return drive.advance(2)');await act('pulse');await d('return drive.advance(1.3)');
await p.screenshot({path:`${out}-fade.png`,timeout:180000});
console.log(JSON.stringify((await d('return window.__circuitCrew.snapshot()')).station?.capture));
await b.close();
