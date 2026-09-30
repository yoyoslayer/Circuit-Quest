// Measures real frame rate on the host GPU (not SwiftShader). Needs `npm run dev -- --port 4173`.
import {chromium} from '@playwright/test';
const levels=process.argv.slice(2).length?process.argv.slice(2):['playground','meeting','lunch'];
const base=process.env.BASE_URL??'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:process.env.HEADED?false:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11','--disable-frame-rate-limit','--disable-gpu-vsync']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
// THROTTLE=4 approximates a mid-range laptop CPU.
if(process.env.THROTTLE){const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.THROTTLE)});}
page.on('console',m=>{if(m.type()==='error')console.log('console:',m.text());});
for(const level of levels){
  await page.goto(`${base}/?level=${level}${process.env.Q??""}`);await page.waitForSelector('body[data-ready="true"]');
  await page.getByRole('button',{name:'Start playing'}).click();await page.waitForTimeout(2500);
  const r=await page.evaluate(()=>new Promise(res=>{const times=[];let last=performance.now();const t0=last;const tick=n=>{times.push(n-last);last=n;if(n-t0<4000)requestAnimationFrame(tick);else{times.sort((a,b)=>a-b);const s=window.__circuitCrew.snapshot();res({fps:+(1000/(times.reduce((a,b)=>a+b,0)/times.length)).toFixed(1),p95ms:times[Math.floor(times.length*.95)],drawCalls:s.drawCalls,props:s.props,ms:Object.fromEntries(Object.entries(s.profile).map(([k,v])=>[k,+v.toFixed(2)]))});}};requestAnimationFrame(tick);}));
  const gpu=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown';});
  console.log(level,JSON.stringify(r),gpu);
}
await browser.close();
