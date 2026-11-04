import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
for(const lv of ['lunch','meeting']){
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto(`http://127.0.0.1:4173/?level=${lv}`);await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
await p.getByRole('button',{name:'Start playing'}).click();await p.waitForTimeout(3000);
const r=await p.evaluate(()=>new Promise(res=>{const t=[];let last=performance.now();const t0=last;const tick=n=>{t.push(n-last);last=n;if(n-t0<4000)requestAnimationFrame(tick);else{t.sort((a,b)=>a-b);const s=window.__circuitCrew.snapshot();res({fps:+(1000/(t.reduce((a,b)=>a+b,0)/t.length)).toFixed(1),p95:t[Math.floor(t.length*.95)].toFixed(1),dc:s.drawCalls,props:s.props});}};requestAnimationFrame(tick);}));
console.log(lv,JSON.stringify(r));await p.close();}
await b.close();
