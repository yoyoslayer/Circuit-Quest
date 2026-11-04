// props-gallery pass 2: close-ups of suspect prefabs, silhouette sheet at game-camera distance, Pip height.
import {chromium} from '@playwright/test';
import {resolve} from 'node:path';
import {SHOTS} from '../cap.mjs';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});const errs=[];
const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(e.message));
const shot=async n=>{await p.waitForTimeout(300);await p.screenshot({path:resolve(SHOTS,`props-gallery-${n}.png`)});};
await p.goto('http://127.0.0.1:4173/mockups/review5/tools/props-gallery/viewer2.html');await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
const pip=await p.evaluate(()=>{const r=V.show([],{});const box=new V.T.Box3().setFromObject(V.root);return {min:box.min.toArray(),max:box.max.toArray()};});console.log('pip bbox',JSON.stringify(pip));
const close=async(name,kinds,o,cam)=>{const r=await p.evaluate(([k,o])=>V.show(k,o),[kinds,o]);await p.evaluate(([c])=>{V.cam(...c);V.draw();},[cam]);await shot(name);return r;};
// sofa floating / no cushions (low side angle)
await close('30-sofa-low',['sofa','chair','beanbag'],{pip:true,yaw:-.3},[0,.4,0,6.5,0,.05]);
// beanbag variants vs blob
await close('31-beanbag-vs-blob',['beanbag','beanbag'],{blob:true,yaw:.6,color:'#b392f0'},[0,.5,0,4.5,0,.35]);
await close('32-beanbag-top',['beanbag'],{blob:true,pip:false,yaw:0,color:'#e5484d'},[0,.3,0,3.2,.0,1.2]);
// coffee machine / printer / cooler / vending close
await close('33-appliances',['coffee','printer','cooler','vending'],{pip:true,yaw:-.25},[0,.9,0,7.5,0,.2]);
// handhelds: plug vs coupler vs splitter vs strip vs mug vs paper, close
await close('34-handhelds',['plug','coupler','splitter','strip','mug','paper','reel'],{pip:true,yaw:-.6},[0,.35,0,4.2,0,.45]);
await close('35-handhelds-colliders',['plug','coupler','splitter','strip','mug','reel'],{pip:false,yaw:-.6,colliders:true},[0,.2,0,3.2,0,.5]);
// wedge & bridge edges
await close('36-wedge-bridge',['wedge','bridge','tray'],{pip:true,yaw:-.9},[0,.3,0,4,0,.35]);
// cone & strip colour
await close('37-cone-strip-colour',['cone','strip','splitter','reel','mug','beanbag'],{pip:false,yaw:-.4},[0,.3,0,4.8,0,.5]);
// carts handles vs colliders
await close('38-carts-colliders',['cart','coolbox','dolly'],{pip:true,yaw:-1.2,colliders:true},[0,.6,0,6,0,.3]);
// tipped round props (collider corner rest)
await close('39-round-colliders',['plant','cone','bin','beanbag','lamp','mop'],{pip:false,yaw:0,colliders:true},[0,.6,0,6,0,.15]);
// pingpong / whiteboard / glass / bookshelf
await close('40-big-furniture',['pingpong','whiteboard','glass','bookshelf'],{pip:true,yaw:-.3},[0,.9,0,10,0,.35]);
// desk variants
for(let v=0;v<5;v++)await close(`41-desk-v${v}`,['desk','chair'],{pip:false,yaw:0,variant:v},[0,.9,0,3.6,.0,.7]);
// silhouette sheet at game-camera distance (zoom ~30, FOV 30, pitch ~.9)
const all=['box','desk','chair','monitor','mug','paper','plant','cabinet','sofa','bin','reel','coupler','coffee','cart','printer','whiteboard','bookshelf','vending','cooler','pingpong','bridge','mop','tray','lamp','dolly','supply','capcart','coolbox','splitter','plug','wedge','beanbag','cone','strip'];
for(const [i,set] of [[0,all.slice(0,12)],[1,all.slice(12,23)],[2,all.slice(23)]]){
  const r=await p.evaluate(([k])=>V.show(k,{blob:true,yaw:-.5,labels:true}),[set]);await p.evaluate(([w])=>{V.cam(0,0,0,30,0,.85);V.draw();},[r.width]);await shot(`5${i}-gamecam-row${i}`);
  await p.evaluate(([k])=>V.show(k,{blob:true,yaw:-.5,silhouette:true,labels:false}),[set]);await p.evaluate(()=>{V.cam(0,0,0,30,0,.85);V.draw();});await shot(`5${i}-gamecam-row${i}-silhouette`);
}
console.log(JSON.stringify(errs));await b.close();
