// Lobby with four jobs done, returning from the Playground: BASE=http://localhost:4202 node done.mjs
import {chromium} from '@playwright/test';
import {resolve} from 'node:path';
import {SHOTS} from '../cap.mjs';
const BASE=process.env.BASE??'http://localhost:4202';
const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`${BASE}/?manual&fullfx`);
await page.evaluate(()=>{const b={grade:'A',time:30,damage:0,cost:0};localStorage.setItem('circuit-crew:best:v1',JSON.stringify({playground:b,meeting:{...b,grade:'B'},lunch:b,arcade:{...b,grade:'C'}}));sessionStorage.setItem('circuit-crew:from','playground');});
await page.goto(`${BASE}/?manual&fullfx`);await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
await page.getByRole('button',{name:'Start playing'}).click();
const adv=s=>page.evaluate(s=>window.__circuitCrew.drive.advance(s),s);
const shot=async n=>{await page.waitForTimeout(700);await page.screenshot({path:resolve(SHOTS,`${n}.png`)});};
await adv(.62);await shot('fix-playground-lobby-return-ignite');
console.log('player',JSON.stringify((await page.evaluate(()=>window.__circuitCrew.snapshot())).player));
await adv(1);await page.addStyleTag({content:'#hud{display:none!important}'});
// Back to the start view: reset camera to home by reloading without the from-key.
await page.goto(`${BASE}/?manual&fullfx`);await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
await page.getByRole('button',{name:'Start playing'}).click();await adv(.5);await page.addStyleTag({content:'#hud{display:none!important}'});await shot('fix-playground-lobby-done4-nohud');
console.log('errors',errors);await browser.close();
