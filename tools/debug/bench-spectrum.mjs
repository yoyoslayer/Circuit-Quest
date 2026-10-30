// Screenshot of the spectrum desk's hall map with a hand-aimed beam (dev server on 4173, or BASE=...).
import {chromium} from '@playwright/test';
const base=process.env.BASE??'http://127.0.0.1:4173',out=process.argv[2]??'/home/user/Circuit-Quest/artifacts/spectrum';
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto(`${base}/?level=spectrum&manual`);await p.waitForSelector('body[data-ready="true"]');await p.getByRole('button',{name:'Start playing'}).click();
const d=(f,...a)=>p.evaluate(([f,a])=>new Function('drive','a',f)(window.__circuitCrew.drive,a),[f,a]);
const act=(n,a)=>d('return drive.act(a[0],a[1])',n,a);
await d('return drive.walkTo(-6.3,3.6,.5)');await d('return drive.walkTo(-3.5,3.55,.4)');await p.keyboard.press('KeyE');await d('return drive.advance(1.2)');
await act('band','nir');await act('aim',{what:'tx',to:{x:4,z:-1}});await d('return drive.advance(.3)');
await p.screenshot({path:`${out}-desk.png`,timeout:180000});await b.close();
