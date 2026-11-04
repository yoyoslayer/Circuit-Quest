import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:4173/?level=arcade&fullfx');await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
await p.getByRole('button',{name:'Start playing'}).click();await p.waitForTimeout(5000);
let s=await p.evaluate(()=>window.__circuitCrew.snapshot());console.log('real-time start fps',s.fps.toFixed(1),'dc',s.drawCalls,'t',s.time.toFixed(1));
await p.keyboard.press('Tab');await p.waitForTimeout(3000);s=await p.evaluate(()=>window.__circuitCrew.snapshot());console.log('survey fps',s.fps.toFixed(1),'dc',s.drawCalls);
await p.keyboard.press('Tab');
// real-time keyboard play: hold D to walk; check how fast Pip walks without sprint
const t0=s.time;const x0=s.player.x;await p.keyboard.down('KeyA');await p.waitForTimeout(1500);await p.keyboard.up('KeyA');s=await p.evaluate(()=>window.__circuitCrew.snapshot());console.log('walk 1.5s dx',(s.player.x-x0).toFixed(2),'dt',(s.time-t0).toFixed(2));
console.log('errors',JSON.stringify(errs));await b.close();
