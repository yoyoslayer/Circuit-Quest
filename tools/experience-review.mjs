// Evidence for the spatial redesign. Run Vite on 4174, then node tools/experience-review.mjs.
// Records actual walk frames, portals, each Via work area, and a grounded mop.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='artifacts/experience-review',base=process.env.BASE_URL??'http://127.0.0.1:4174';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=d3d11','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});
const report=[],frames=[];
async function room(id){const page=await context.newPage();page.on('pageerror',e=>report.push({id,error:e.message}));await page.goto(`${base}/?level=${id}&manual&fullfx`);await page.waitForSelector('body[data-ready=true]');await page.getByRole('button',{name:'Start playing'}).click();await advance(page,.3);await page.waitForTimeout(400);return page;}
const advance=(p,s,keys=[])=>p.evaluate(([s,keys])=>window.__circuitCrew.drive.advance(s,keys),[s,keys]);
async function walk(p,x,z,r=.3){const result=await p.evaluate(([x,z,r])=>window.__circuitCrew.drive.walkTo(x,z,r),[x,z,r]);if(!result.arrived)throw Error(`Blocked on review path to ${x},${z}`);}
const act=(p,n,a)=>p.evaluate(([n,a])=>window.__circuitCrew.drive.act(n,a),[n,a]);
async function shot(p,name){await p.waitForTimeout(180);await p.screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:88});report.push({name,state:await p.evaluate(()=>window.__circuitCrew.snapshot())});}
async function work(p,x,z){if((await p.evaluate(()=>window.__circuitCrew.snapshot())).atBench)await p.keyboard.press('Escape');await walk(p,x,z);await p.keyboard.press('KeyE');await advance(p,.1);}
try{
  let p=await room('lobby');await shot(p,'hub-play');await p.keyboard.press('Tab');await shot(p,'hub-survey');await p.keyboard.press('Tab');
  await walk(p,-12,7);await walk(p,-15.9,-9,1.4);await advance(p,.25);await shot(p,'portal');await p.close();
  p=await room('playground');await walk(p,-7,.7);await walk(p,-6,.7);
  await p.addStyleTag({content:'#hud{display:none!important}'});await p.mouse.wheel(0,-250);await p.waitForTimeout(800);
  for(let i=0;i<42;i++){await advance(p,.035,['KeyD']);await p.waitForTimeout(35);if(i%6===0)frames.push(await p.screenshot({type:'jpeg',quality:82}));}
  await p.close();
  p=await room('vias');await shot(p,'workshop-play');await p.keyboard.press('Tab');await shot(p,'workshop-survey');await p.keyboard.press('Tab');
  await work(p,0,-.85);await act(p,'layer',1);await act(p,'layer',4);await shot(p,'inspection');
  await work(p,-2.65,-.3);await act(p,'press');await advance(p,.25);await shot(p,'press');
  await work(p,-2.65,4.8);await act(p,'bit','mech-0.30');await act(p,'drill');await advance(p,.25);await shot(p,'drill');
  await work(p,2.65,4.8);await act(p,'plate');await advance(p,.3);await shot(p,'plating');
  await work(p,0,-.85);await act(p,'pad',.6);await shot(p,'copper-section');
  // Geometry stress preview, not a completed customer order: all eight pads
  // must remain distinct, then restore the one-via lamp sample before testing.
  for(let i=0;i<7;i++)await act(p,'count',1);
  await shot(p,'eight-via-preview');
  for(let i=0;i<7;i++)await act(p,'count',-1);
  await p.keyboard.press('Escape');await walk(p,0,1.5);await work(p,5,-.85);await act(p,'test');await shot(p,'hardware-test');await p.close();
  p=await room('lunch');await walk(p,2,8,.4);await p.keyboard.press('KeyE');await walk(p,.3,2,.4);
  await p.mouse.move(800,450);await p.mouse.down({button:'right'});await p.mouse.move(1050,450,{steps:15});await p.mouse.up({button:'right'});
  await advance(p,.5,['Space']);await shot(p,'mopping');await p.close();
  // Static contact sheet of successive real rendered walk frames, not invented poses.
  const sheet=await context.newPage();await sheet.setViewportSize({width:1440,height:510});
  await sheet.setContent(`<body style="margin:0;background:#243842;display:grid;grid-template-columns:repeat(4,360px);grid-auto-rows:255px;align-content:start">${frames.map((b,i)=>`<div><img src="data:image/jpeg;base64,${b.toString('base64')}" style="width:360px;height:225px;display:block"><p style="color:white;margin:5px;font:16px system-ui">Frame ${i*6}</p></div>`).join('')}</body>`);
  await sheet.screenshot({path:`${out}/walk-sequence.jpg`,type:'jpeg',quality:90});await sheet.close();
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await context.close();await browser.close();}
if(report.some(r=>r.error))process.exitCode=1;
