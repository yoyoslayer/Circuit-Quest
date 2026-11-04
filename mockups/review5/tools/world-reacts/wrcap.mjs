// Same as ../cap.mjs, plus an init script that captures the game's npcs[] and props[] arrays (read-only inspection).
import {chromium} from '@playwright/test';
import {resolve} from 'node:path';
import {SHOTS} from '../cap.mjs';
const BASE=process.env.BASE??'http://127.0.0.1:4173';
const ARGS=process.env.SWIFT?['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11'];
export async function launch(level,{fullfx=true,query='',width=1440,height=900}={}){
  const browser=await chromium.launch({args:ARGS});
  const page=await browser.newPage({viewport:{width,height}});
  await page.addInitScript(()=>{const wr=window.__wr={npcs:null,props:null};const push=Array.prototype.push;
    Array.prototype.push=function(...a){const o=a[0];if(o&&typeof o==='object'&&(!wr.npcs||!wr.props)){if('bubble' in o&&'startled' in o)wr.npcs=this;else if('spec' in o&&'collider' in o&&'mesh' in o)wr.props=this;}return push.apply(this,a);};});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const q=[level&&level!=='lobby'?`level=${level}`:'', 'manual', fullfx?'fullfx':'', query].filter(Boolean).join('&');
  await page.goto(`${BASE}/?${q}`);await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
  const b=page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
  const ev=(f,...a)=>page.evaluate(([f,a])=>new Function('drive','wr','a',f)(window.__circuitCrew.drive,window.__wr,a),[f,a]);
  const canvas=page.locator('canvas').first();
  const g={browser,page,errors,ev,
    advance:(s=.5,keys=[])=>ev('return drive.advance(a[0],a[1])',s,keys),
    walk:(x,z,r=.5,limit=40)=>ev('return drive.walkTo(a[0],a[1],a[2],a[3])',x,z,r,limit),
    snap:()=>page.evaluate(()=>window.__circuitCrew.snapshot()),
    key:async(code,settle=.1)=>{await page.keyboard.press(code);if(settle)await ev('return drive.advance(a[0])',settle);},
    down:(code)=>page.keyboard.down(code),up:(code)=>page.keyboard.up(code),
    survey:async()=>{await page.keyboard.press('Tab');await ev('return drive.advance(1.2)');},
    orbit:async(dx,dy=0,settle=.8)=>{const bb=await canvas.boundingBox();const cx=bb.x+bb.width/2,cy=bb.y+bb.height/2;
      await page.mouse.move(cx,cy);await page.mouse.down({button:'right'});await page.mouse.move(cx+dx,cy+dy,{steps:8});await page.mouse.up({button:'right'});await ev('return drive.advance(a[0])',settle);},
    zoom:async(dy,settle=.8)=>{const bb=await canvas.boundingBox();await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await page.mouse.wheel(0,dy);await ev('return drive.advance(a[0])',settle);},
    shot:async(name,opts={})=>{const path=resolve(SHOTS,`${name}.png`);await page.waitForTimeout(700);await page.screenshot({path,timeout:240000,...opts});return path;},
    crop:async(name,clip)=>{const path=resolve(SHOTS,`${name}.png`);await page.screenshot({path,clip,timeout:240000});return path;},
    npcs:()=>ev(`return wr.npcs.map((n,i)=>({i,x:+n.group.position.x.toFixed(2),z:+n.group.position.z.toFixed(2),alarm:+n.alarm.toFixed(2),bubble:n.bubble.visible}))`),
    props:()=>ev(`return wr.props.map((q,i)=>{const p=q.body.translation();return {i,k:q.spec.kind,id:q.spec.id,x:p.x,y:p.y,z:p.z,en:q.body.isEnabled(),dmg:q.damaged}})`),
    close:async()=>{await browser.close();return errors;},
  };
  return g;
}
