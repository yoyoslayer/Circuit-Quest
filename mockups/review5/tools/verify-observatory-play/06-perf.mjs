// Real-time (no ?manual) fps and draw calls at the game camera and in the survey.
import {chromium} from '@playwright/test';
const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('http://127.0.0.1:4173/?level=observatory&fullfx');await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
const b=page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
const snap=()=>page.evaluate(()=>{const s=window.__circuitCrew.snapshot();return {fps:+s.fps.toFixed(1),dc:s.drawCalls,profile:s.profile};});
await page.waitForTimeout(5000);console.log('game cam',JSON.stringify(await snap()));
await page.waitForTimeout(3000);console.log('game cam 2',JSON.stringify(await snap()));
await page.keyboard.press('Tab');await page.waitForTimeout(5000);console.log('survey',JSON.stringify(await snap()));
await page.waitForTimeout(3000);console.log('survey 2',JSON.stringify(await snap()));
await browser.close();
