// Review 5 capture helper (Windows, host GPU). Needs the dev server: npx.cmd vite --port 4173
// Usage from a script in this folder:
//   import {launch} from './cap.mjs';
//   const g=await launch('arcade',{fullfx:true});  // opens ?level=arcade&manual(&fullfx), presses Start
//   await g.advance(1); await g.shot('arcade-start');            // -> mockups/review5/shots/arcade-start.png
//   await g.walk(x,z); await g.key('KeyE'); await g.act('slot',0);
//   await g.orbit(200,0); await g.zoom(-400); await g.survey();   // camera: right-drag, wheel, Tab
//   const s=await g.snap();                                       // window.__circuitCrew.snapshot()
//   await g.close();
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
// Full-size PNGs go to shots-full/ (not committed); tools/shrink.ps1 makes the shots/*.jpg copies.
export const SHOTS=resolve(here,'..','shots-full');mkdirSync(SHOTS,{recursive:true});
const BASE=process.env.BASE??'http://127.0.0.1:4173';
const ARGS=process.env.SWIFT?['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11'];
export async function launch(level,{fullfx=true,query='',width=1440,height=900,start=true}={}){
  const browser=await chromium.launch({args:ARGS});
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const q=[level&&level!=='lobby'?`level=${level}`:'', 'manual', fullfx?'fullfx':'', query].filter(Boolean).join('&');
  await page.goto(`${BASE}/?${q}`);await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
  if(start){const b=page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();}
  const ev=(f,...a)=>page.evaluate(([f,a])=>new Function('drive','game','a',f)(window.__circuitCrew.drive,window.__circuitCrew,a),[f,a]);
  const canvas=page.locator('canvas').first();
  const g={browser,page,errors,ev,
    advance:(s=.5,keys=[])=>ev('return drive.advance(a[0],a[1])',s,keys),
    walk:(x,z,r=.5,limit=40)=>ev('return drive.walkTo(a[0],a[1],a[2],a[3])',x,z,r,limit),
    act:(name,arg)=>ev('return drive.act(a[0],a[1])',name,arg),
    audit:(min=.04)=>ev('return drive.audit(a[0])',min),
    snap:()=>page.evaluate(()=>window.__circuitCrew.snapshot()),
    key:async(code,settle=.1)=>{await page.keyboard.press(code);if(settle)await ev('return drive.advance(a[0])',settle);},
    survey:async()=>{await page.keyboard.press('Tab');await ev('return drive.advance(1.2)');},
    // Right-drag orbit: dx turns, dy tilts (pitch clamps). Then lets the camera settle.
    orbit:async(dx,dy=0,settle=.8)=>{const bb=await canvas.boundingBox();const cx=bb.x+bb.width/2,cy=bb.y+bb.height/2;
      await page.mouse.move(cx,cy);await page.mouse.down({button:'right'});await page.mouse.move(cx+dx,cy+dy,{steps:8});await page.mouse.up({button:'right'});await ev('return drive.advance(a[0])',settle);},
    // Wheel zoom: negative = closer (zoom distance clamps 9..38).
    zoom:async(dy,settle=.8)=>{const bb=await canvas.boundingBox();await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await page.mouse.wheel(0,dy);await ev('return drive.advance(a[0])',settle);},
    click:async(x,y)=>{await page.mouse.click(x,y);await ev('return drive.advance(.1)');},
    // Waits ~0.9 s of real time first so CSS transitions (screen blur fades) finish.
    shot:async(name,opts={})=>{const path=resolve(SHOTS,`${name}.png`);await page.waitForTimeout(900);await page.screenshot({path,timeout:240000,...opts});return path;},
    crop:async(name,clip)=>{const path=resolve(SHOTS,`${name}.png`);await page.screenshot({path,clip,timeout:240000});return path;},
    close:async()=>{await browser.close();return errors;},
  };
  return g;
}
