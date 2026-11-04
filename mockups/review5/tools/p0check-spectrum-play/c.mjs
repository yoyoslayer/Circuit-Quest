import {chromium} from '@playwright/test';
import {resolve} from 'node:path';
const SH=resolve('mockups/review5/shots');const P='p0check-spectrum-play';
const [w,h,tag]=process.argv.slice(2).length?[+process.argv[2],+process.argv[3],process.argv[4]]:[844,390,'land'];
const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:1});
const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/?level=spectrum&manual&fullfx');await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
const sb=page.getByRole('button',{name:'Start playing'});if(await sb.count())await sb.tap();
const ev=(f,...a)=>page.evaluate(([f,a])=>new Function('drive','a',f)(window.__circuitCrew.drive,a),[f,a]);
const adv=s=>ev('return drive.advance(a[0])',s);const walk=(x,z,r=.5)=>ev('return drive.walkTo(a[0],a[1],a[2],40)',x,z,r);
const st=async()=>(await page.evaluate(()=>window.__circuitCrew.snapshot()));
const route=async pts=>{for(const [x,z] of pts)await walk(x,z);};
const E=async()=>{await page.keyboard.press('KeyE');await adv(.3);};
const shot=async n=>{await page.waitForTimeout(900);await page.screenshot({path:resolve(SH,`${P}-${n}.png`)});};
console.log('coarse',await page.evaluate(()=>matchMedia('(pointer:coarse)').matches),'stick display',await page.evaluate(()=>{const s=document.querySelector('.stick');return s&&getComputedStyle(s).display;}));
await adv(1);
// delivery 1: pod to the store (walking via drive)
await walk(-6.4,6.4,.6);await E();await route([[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await E();
console.log('podPad',(await st()).station.podPad);
await route([[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);await walk(-3.5,3.55,.4);await E();await adv(1.2);
console.log('atBench',(await st()).atBench);
await shot(`10-${tag}-bench-d1`);
await page.touchscreen.tap(191,251);await adv(.3);await page.touchscreen.tap(650,243);await adv(.5);
// cluster
// identify each cluster by tapping (skip any that looks like send until last)
const key=s=>JSON.stringify({b:s.band,p:s.power,hatch:s.hatchOpen,del:s.delivered?.length,m:s.mistakes});
const found={};
const s=(await st());console.log('after',key(s.station),'delivered',JSON.stringify(s.station.delivered));
await shot(`12-${tag}-radio-send-by-touch`);
console.log('errors',errors);await browser.close();
