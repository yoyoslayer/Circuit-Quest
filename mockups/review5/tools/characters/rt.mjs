// Real-time (no ?manual) launcher, so the rig animates from true motion between frames.
import {chromium} from '@playwright/test';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const SHOTS=resolve(dirname(fileURLToPath(import.meta.url)),'..','..','shots');
export async function rt(level,{query='',width=1440,height=900}={}){
  const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
  const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const q=[level&&level!=='lobby'?`level=${level}`:'','fullfx',query].filter(Boolean).join('&');
  await page.goto(`http://127.0.0.1:4173/?${q}`);await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
  const b=page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
  const canvas=page.locator('canvas').first();const bb=await canvas.boundingBox();
  return {page,errors,snap:()=>page.evaluate(()=>window.__circuitCrew.snapshot()),
    wait:ms=>page.waitForTimeout(ms),
    zoom:async dy=>{await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await page.mouse.wheel(0,dy);await page.waitForTimeout(700);},
    orbit:async(dx,dy=0)=>{const cx=bb.x+bb.width/2,cy=bb.y+bb.height/2;await page.mouse.move(cx,cy);await page.mouse.down({button:'right'});await page.mouse.move(cx+dx,cy+dy,{steps:8});await page.mouse.up({button:'right'});await page.waitForTimeout(500);},
    shot:(n,clip)=>page.screenshot({path:resolve(SHOTS,`${n}.png`),clip}),
    close:async()=>{await browser.close();return errors;}};
}
