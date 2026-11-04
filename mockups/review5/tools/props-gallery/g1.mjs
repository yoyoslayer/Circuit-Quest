// props-gallery pass 1: official gallery + measurements + per-prop lineups with Pip for scale.
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {SHOTS} from '../cap.mjs';
const ARGS=['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11'];
const b=await chromium.launch({args:ARGS});const errs=[];
const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
const shot=async n=>{await p.waitForTimeout(400);await p.screenshot({path:resolve(SHOTS,`props-gallery-${n}.png`)});};
await p.goto('http://127.0.0.1:4173/tools/gallery/index.html?cols=7');await p.waitForSelector('body[data-ready="true"]',{timeout:120000});await p.waitForTimeout(1500);await shot('01-official-gallery');
await p.goto('http://127.0.0.1:4173/mockups/review5/tools/props-gallery/viewer.html');await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
const m=await p.evaluate(()=>V.measure());writeFileSync(resolve(SHOTS,'..','tools','props-gallery','measure.json'),JSON.stringify(m,null,1));
const groups={
  a:['box','desk','chair','monitor','mug','paper','plant'],
  b:['cabinet','sofa','bin','reel','coupler','plug','splitter'],
  c:['coffee','cart','printer','whiteboard','bookshelf','vending'],
  d:['cooler','pingpong','bridge','mop','tray','lamp'],
  e:['dolly','supply','capcart','coolbox','wedge','beanbag','cone','strip'],
};
let n=10;
for(const [g,kinds] of Object.entries(groups)){
  const r=await p.evaluate(k=>V.show(k,{blob:true}),kinds);
  const cx=0,dist=Math.max(7,r.width*1.25);
  await p.evaluate(([d])=>{V.cam(0,.8,0,d,0,.25);V.draw();},[dist]);await shot(`${n++}-row-${g}-front`);
  await p.evaluate(([d])=>{V.cam(0,.8,0,d,Math.PI,.25);V.draw();},[dist]);await shot(`${n++}-row-${g}-back`);
  await p.evaluate(k=>V.show(k,{blob:true,colliders:true}),kinds);
  await p.evaluate(([d])=>{V.cam(0,.8,0,d,.35,.35);V.draw();},[dist]);await shot(`${n++}-row-${g}-colliders`);
}
console.log(JSON.stringify(errs));await b.close();
