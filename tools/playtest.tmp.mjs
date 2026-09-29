import {chromium} from '@playwright/test';
import fs from 'fs';
const [,, level, stepsFile] = process.argv;
const OUT = 'C:/Users/yousi/AppData/Local/Temp/claude/C--Users-yousi-Documents-Codex-2026-09-28-files-mentioned-by-the-user-circuit-outputs-Circuit-Crew/bc20ef0c-adf0-4f9f-994f-c9fedb1ec797/scratchpad/playtest/';
const steps = JSON.parse(fs.readFileSync(stepsFile,'utf8'));
const browser = await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const page = await browser.newPage({viewport:{width:1440,height:900}});
page.on('console', m => { if (m.type()==='error' || m.type()==='warning') console.log('CONSOLE', m.type(), m.text().slice(0,200)); });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('http://127.0.0.1:4173/?level='+level);
await page.waitForTimeout(2500);
for (const s of steps) {
  if (s.shot) { await page.screenshot({path: OUT + s.shot + '.png'}); console.log('shot', s.shot); }
  else if (s.start) { await page.getByRole('button',{name:'Start playing'}).click(); await page.waitForTimeout(1500); }
  else if (s.hold) { for (const k of s.hold) await page.keyboard.down(k); await page.waitForTimeout(s.ms); for (const k of s.hold) await page.keyboard.up(k); }
  else if (s.press) { await page.keyboard.press(s.press); }
  else if (s.wait) { await page.waitForTimeout(s.wait); }
  else if (s.snap) { const r = await page.evaluate(()=>window.__circuitCrew?.snapshot()); console.log('SNAP', s.snap, JSON.stringify(r).slice(0, s.len||3000)); }
  else if (s.eval) { const r = await page.evaluate(s.eval); console.log('EVAL', JSON.stringify(r)?.slice(0,3000)); }
  else if (s.drag) { const [x1,y1,x2,y2] = s.drag; await page.mouse.move(x1,y1); await page.mouse.down({button:s.button||'right'}); await page.mouse.move(x2,y2,{steps:20}); await page.mouse.up({button:s.button||'right'}); }
  else if (s.wheel) { await page.mouse.move(720,450); await page.mouse.wheel(0,s.wheel); }
  else if (s.text) { console.log('TEXT', (await page.evaluate(()=>document.body.innerText)).slice(0,1500)); }
}
await browser.close();
