// Screenshots of the implemented UI for comparison with mockups/ui/*.png.
// Start a dev server first (npx vite --port 4188), then from the repo root:
// node mockups/ui/impl/shoot.mjs [base=http://127.0.0.1:4188] [only,comma,list]
// Uses the real GPU (d3d11 ANGLE); on other platforms drop --use-angle=d3d11.
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const base=process.argv[2]??'http://127.0.0.1:4188',only=process.argv[3]?.split(',');
const out='mockups/ui/impl';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const seed={playground:{grade:'A',time:42,damage:0,cost:0},meeting:{grade:'B',time:151,damage:14,cost:380}};
async function page(size=[1440,900],seeded=false){
  const ctx=await browser.newContext({viewport:{width:size[0],height:size[1]},deviceScaleFactor:1,hasTouch:size[0]<700,isMobile:size[0]<700});
  if(seeded)await ctx.addInitScript(s=>localStorage.setItem('circuit-crew:best:v1',s),JSON.stringify(seed));
  const p=await ctx.newPage();p.on('pageerror',e=>console.log('pageerror',e.message));p.on('console',m=>{if(m.type()==='error')console.log('console',m.text());});return p;
}
const ready=p=>p.waitForSelector('body[data-ready="true"]',{timeout:60000});
const drive=(p,fn,...a)=>p.evaluate(([f,a])=>(window.__circuitCrew.drive[f])(...a),[fn,a]);
const start=async p=>{await p.getByRole('button',{name:'Start playing'}).click();};
const shots={
  async title(){const p=await page([1440,900],true);await p.goto(base+'/?level=meeting&intro');await ready(p);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(2600);await p.screenshot({path:`${out}/title.png`});await p.context().close();},
  async 'title-phone'(){const p=await page([390,844]);await p.goto(base+'/');await ready(p);await p.waitForTimeout(2600);await p.screenshot({path:`${out}/title-phone.png`});await p.context().close();},
  async 'level-select'(){const p=await page([1440,900],true);await p.goto(base+'/?level=meeting');await ready(p);await p.waitForTimeout(1600);await p.screenshot({path:`${out}/level-select.png`});await p.context().close();},
  async 'level-select-phone'(){const p=await page([390,844],true);await p.goto(base+'/?level=meeting');await ready(p);await p.waitForTimeout(1600);await p.screenshot({path:`${out}/level-select-phone.png`});await p.context().close();},
  async 'hud-meeting'(){const p=await page();await p.goto(base+'/?level=meeting&manual');await ready(p);await start(p);
    await p.keyboard.press('KeyF');await drive(p,'walkTo',-8,-5,.5,40);await drive(p,'walkTo',-1,-1.5,.5,40);await drive(p,'walkTo',4,-1.3,.5,40);await drive(p,'advance',.6,['KeyD']);
    await p.waitForTimeout(500);await p.screenshot({path:`${out}/hud-meeting.png`});await p.context().close();},
  async 'hud-gamepad'(){const p=await page();
    // A resting stub pad: keycaps swap to face-button glyphs while any pad is connected.
    await p.addInitScript(()=>{const pad={id:'stub',index:0,connected:true,buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0})),axes:[0,0,0,0]};navigator.getGamepads=()=>[pad,null,null,null];});
    await p.goto(base+'/?level=meeting&manual');await ready(p);await start(p);await drive(p,'advance',3,[]);await p.waitForTimeout(700);
    await p.screenshot({path:`${out}/hud-gamepad.png`,clip:{x:420,y:740,width:600,height:160}});await p.context().close();},
  async 'hud-lunch'(){const p=await page();await p.goto(base+'/?level=lunch&manual');await ready(p);await start(p);
    await drive(p,'walkTo',-10,7.5,.3,40);await p.keyboard.press('KeyF');await drive(p,'walkTo',-6,4,.5,40);await drive(p,'advance',40,[]);
    await p.waitForTimeout(500);await p.screenshot({path:`${out}/hud-lunch.png`});await p.context().close();},
  async 'hud-phone'(){const p=await page([390,844]);await p.goto(base+'/?level=meeting&manual');await ready(p);await start(p);
    await p.keyboard.press('KeyF');await drive(p,'walkTo',-8,-5,.5,40);await drive(p,'walkTo',-3,-1.5,.5,40);await p.waitForTimeout(500);await p.screenshot({path:`${out}/hud-phone.png`});await p.context().close();},
  async 'hud-lunch-phone'(){const p=await page([390,844]);await p.goto(base+'/?level=lunch&manual');await ready(p);await start(p);await drive(p,'advance',20,[]);await p.waitForTimeout(500);await p.screenshot({path:`${out}/hud-lunch-phone.png`});await p.context().close();},
  async pause(){const p=await page();await p.goto(base+'/?level=lunch&manual');await ready(p);await start(p);await drive(p,'advance',51,[]);await p.keyboard.press('Escape');await p.waitForTimeout(800);await p.screenshot({path:`${out}/pause.png`});await p.context().close();},
  async result(){const p=await page();await p.goto(base+'/?level=meeting&manual');await ready(p);await start(p);
    await p.keyboard.press('KeyF');for(const [x,z] of [[-8,-5],[-1,-1.5],[6,-1.2]])await drive(p,'walkTo',x,z,.5,40);
    await drive(p,'advance',2,['KeyD']);await drive(p,'advance',1.5,['KeyD','ShiftLeft']);await p.keyboard.press('KeyF');await drive(p,'advance',.3,[]);
    await p.waitForSelector('body[data-complete="true"]');await p.waitForTimeout(2800);await p.screenshot({path:`${out}/result.png`});await p.context().close();},
  async 'result-phone'(){const p=await page([390,844]);await p.goto(base+'/?manual');await ready(p);await start(p);
    await p.keyboard.press('KeyF');for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await drive(p,'walkTo',x,z,.5,40);await p.keyboard.press('KeyF');await drive(p,'advance',.3,[]);
    await p.waitForSelector('body[data-complete="true"]');await p.waitForTimeout(2800);await p.screenshot({path:`${out}/result-phone.png`});await p.context().close();},
  async fail(){const p=await page();await p.goto(base+'/?level=lunch&manual');await ready(p);await start(p);await drive(p,'advance',125,[]);await p.waitForSelector('body[data-failed="true"]');await p.waitForTimeout(1800);await p.screenshot({path:`${out}/fail.png`});await p.context().close();},
};
for(const [name,fn] of Object.entries(shots)){if(only&&!only.includes(name))continue;const t=Date.now();try{await fn();console.log('shot',name,Date.now()-t,'ms');}catch(e){console.log('FAILED',name,e.message.split('\n')[0]);}}
await browser.close();
