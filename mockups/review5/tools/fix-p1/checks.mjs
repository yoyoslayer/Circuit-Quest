// Checks for the review 5 batch-1/2 P1 fixes (R5-011, 004, 006, 007, 009, 014, 015, 016, 113).
// node mockups/review5/tools/fix-p1/checks.mjs [name...]   (dev server on 4173)
import {launch} from '../cap.mjs';
import {chromium} from '@playwright/test';
const only=process.argv.slice(2),want=n=>!only.length||only.includes(n),out={};
const item=async(g,id)=>(await g.snap()).items.find(i=>i.id===id)?.pos;
const r2=v=>v&&`(${v.x.toFixed(2)},${v.z.toFixed(2)})`;

if(want('lunch')){// R5-011: a doorstop lobbed into the dark storeroom comes back.
  const g=await launch('lunch');await g.advance(.3);const home=await item(g,'wedge');
  await g.walk(-3,7,.4);await g.key('KeyE');await g.walk(-11,2.5,.25);await g.walk(-11,6.1,.25);await g.walk(-11,4.3,.15);
  await g.page.keyboard.press('Space');await g.advance(.36);await g.page.keyboard.press('KeyQ');await g.advance(1.5);
  const landed=await item(g,'wedge');await g.advance(8);const after=await item(g,'wedge');
  out.lunch={home:r2(home),landed:r2(landed),after8s:r2(after),back:Math.hypot(after.x-home.x,after.z-home.z)<.5,lit:(await g.snap()).lunch?.lit,errors:await g.close()};}

if(want('restart')){// R5-004: a tap of R mid-run does nothing; holding it restarts.
  const g=await launch('meeting');await g.advance(.3);await g.walk(-8.6,-3.9,.4);await g.key('KeyE');
  let nav=false;g.page.on('framenavigated',f=>{if(f===g.page.mainFrame())nav=true;});
  await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(1200);const s=await g.snap();
  out.restartTap={navigated:nav,held:s.held,time:+s.time.toFixed(2)};
  const reload=g.page.waitForNavigation({timeout:4000}).then(()=>true).catch(()=>false);
  await g.page.keyboard.down('KeyR');await g.page.waitForTimeout(450);await g.page.screenshot({path:'mockups/review5/shots-full/fix-p1-restart-hold-ring.png'});
  await g.page.waitForTimeout(700);await g.page.keyboard.up('KeyR');
  out.restartHold={reloaded:await reload};await g.close();}

if(want('bench-keys')){// R5-004: R, Space, Tab at a bench do nothing; R5-006: P while tripped keeps power on.
  const g=await launch('arcade');await g.advance(.3);
  await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
  let nav=false;g.page.on('framenavigated',f=>{if(f===g.page.mainFrame())nav=true;});
  const p0=(await g.snap()).player;for(const k of ['KeyR','Space','Tab','KeyW','KeyQ'])await g.key(k,.2);await g.page.waitForTimeout(1000);
  const s1=await g.snap();out.benchKeys={navigated:nav,atBench:s1.atBench,dy:+(s1.player.y-p0.y).toFixed(2)};
  await g.act('power');await g.advance(.5);const tripped=(await g.snap()).station;
  const pill=()=>g.page.evaluate(()=>document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' '));
  const pillTripped=await pill();await g.key('KeyP',.2);const afterP=(await g.snap()).station;
  await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.advance(2.6);const live=(await g.snap()).station;
  await g.advance(1);const pillSoak=await pill();await g.shot('fix-p1-arcade-soak-pill');
  // A S D X with empty hands no longer take blocks out.
  for(const k of ['KeyA','KeyS','KeyD','KeyX'])await g.key(k,.1);const chain=(await g.snap()).station.setup.chain;
  out.arcadeP={tripped:tripped.tripped,pillTripped,poweredAfterP:afterP.powered,liveAfterCool:live.live,pillSoak,chainAfterWASD:JSON.stringify(chain),errors:await g.close()};}

if(want('garage')){// R5-014: WASD at the garage bench leaves fitted parts alone.
  const g=await launch('garage');await g.advance(.3);
  await g.walk(6.4,-4.2,.5);await g.key('KeyE');await g.walk(3.4,-4);await g.walk(2.5,-4.4);await g.key('KeyE',.3);await g.walk(2.9,-4);await g.walk(2.9,-1.1);await g.walk(0,-1.55,.4);await g.key('KeyE',1.2);
  await g.act('pick','diode');await g.act('slot','fly');const before=JSON.stringify((await g.snap()).station.slots);
  for(const k of ['KeyW','KeyA','KeyS','KeyD'])await g.key(k,.1);const s=await g.snap();
  out.garage={before,after:JSON.stringify(s.station.slots),atBench:s.atBench,errors:await g.close()};}

if(want('picker')){// R5-009 + R5-007-adjacent: the Workshop picker is a modal with keyboard focus.
  const g=await launch('lobby');await g.advance(.3);await g.walk(7.5,5.5,.5);await g.key('KeyE',.3);
  const p0=(await g.snap()).player;await g.advance(1,['KeyS']);await g.page.keyboard.press('Tab');await g.advance(.3);const s=await g.snap();
  const focus=await g.page.evaluate(()=>document.activeElement?.textContent?.trim());
  const hidden=await g.page.evaluate(()=>getComputedStyle(document.querySelector('.objective')).visibility);
  await g.shot('fix-p1-picker-modal');
  await g.page.keyboard.press('ArrowRight');const focus2=await g.page.evaluate(()=>document.activeElement?.textContent?.trim());
  const nav=g.page.waitForURL(/practice/,{timeout:5000}).then(()=>true).catch(()=>false);await g.page.keyboard.press('Enter');
  out.picker={moved:+Math.hypot(s.player.x-p0.x,s.player.z-p0.z).toFixed(2),survey:s.survey??null,focus,focus2,objective:hidden,enterNavigates:await nav,url:g.page.url()};await g.close();}

if(want('result-r')){// R5-007: R on the result card restarts.
  const g=await launch('playground');await g.advance(.3);await g.key('KeyF');
  for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);await g.key('KeyF',.3);await g.walk(6.6,-5.9,.4);await g.key('KeyE',.3);
  await g.advance(.5);await g.page.waitForSelector('body[data-screen="result"]',{timeout:15000}).catch(()=>{});
  const screen=await g.page.evaluate(()=>document.body.dataset.screen);
  const nav=g.page.waitForNavigation({timeout:5000}).then(()=>true).catch(()=>false);await g.page.keyboard.press('KeyR');
  out.resultR={screen,won:(await g.snap().catch(()=>({}))).won,rRestarts:await nav};await g.close();}

if(want('pad')){// R5-015 / R5-113: a stubbed gamepad drives the arcade bench through the cursor.
  const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.addInitScript(()=>{const pad={id:'stub',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0,touched:false})),timestamp:0};
    window.__pad=pad;navigator.getGamepads=()=>[pad];});
  await page.goto('http://127.0.0.1:4173/?level=arcade&manual');await page.waitForSelector('body[data-ready="true"]');await page.getByRole('button',{name:'Start playing'}).click();
  const d=(f,...a)=>page.evaluate(([f,a])=>new Function('drive','a',f)(window.__circuitCrew.drive,a),[f,a]);
  for(const [x,z,r] of [[-5.5,6.6,.5],[-7.2,5.8,.5],[-8.3,4.4,.3]])await d('return drive.walkTo(a[0],a[1],a[2])',x,z,r);await page.keyboard.press('KeyE');await d('return drive.advance(.1)');
  for(const [x,z,r] of [[-7.2,5.8,.5],[-5.5,6.4,.5],[1.2,-1.3,.5]])await d('return drive.walkTo(a[0],a[1],a[2])',x,z,r);await page.keyboard.press('KeyE');await d('return drive.advance(.2)');
  await d('return drive.walkTo(0,-1.55,.4)');
  const press=async(i,ms=120)=>{await page.evaluate(i=>{window.__pad.buttons[i].pressed=true;},i);await page.waitForTimeout(ms);await page.evaluate(i=>{window.__pad.buttons[i].pressed=false;},i);await page.waitForTimeout(ms);};
  await press(2);await d('return drive.advance(1)');const at=(await page.evaluate(()=>window.__circuitCrew.snapshot())).atBench;
  // Sweep the cursor left across the bench; press A at each stop until a block is in hand.
  let held=null,stops=0;await page.evaluate(()=>{window.__pad.axes[0]=-1;});await page.waitForTimeout(700);await page.evaluate(()=>{window.__pad.axes[0]=0;});
  for(let k=0;k<40&&held==null;k++){await page.evaluate(()=>{window.__pad.axes[0]=.5;});await page.waitForTimeout(60);await page.evaluate(()=>{window.__pad.axes[0]=0;});await press(0,60);stops++;
    held=(await page.evaluate(()=>window.__circuitCrew.snapshot())).station.held??null;}
  await page.waitForTimeout(900);await page.screenshot({path:'mockups/review5/shots-full/fix-p1-pad-cursor.png'});
  const cursor=await page.evaluate(()=>{const c=document.querySelector('.pad-cursor');return c?{hidden:c.hidden,display:getComputedStyle(c).display}:null;});
  await press(1);const left=!(await page.evaluate(()=>window.__circuitCrew.snapshot())).atBench;
  const labels=await page.evaluate(()=>[...document.querySelectorAll('.actions .act')].map(b=>b.getAttribute('aria-label')+':'+b.textContent.trim()));
  out.pad={atBench:at,heldViaA:held,stops,cursor,bLeftBench:left,labels};await browser.close();}

if(want('touch')){// R5-016: one-finger drag orbits, pinch zooms, quick tap grabs; survey button.
  const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
  const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await ctx.newPage();
  await page.goto('http://127.0.0.1:4173/?level=meeting&manual&fullfx');await page.waitForSelector('body[data-ready="true"]');await page.getByRole('button',{name:'Start playing'}).tap();
  const adv=s=>page.evaluate(s=>window.__circuitCrew.drive.advance(s),s);await adv(1);await page.waitForTimeout(900);
  await page.screenshot({path:'mockups/review5/shots-full/fix-p1-touch-0-start.png'});
  const cdp=await ctx.newCDPSession(page);const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y],id)=>({x,y,id}))});
  await touch('touchStart',[[200,400]]);for(let i=1;i<=10;i++)await touch('touchMove',[[200+i*14,400]]);await touch('touchEnd',[]);await adv(.8);await page.waitForTimeout(900);
  await page.screenshot({path:'mockups/review5/shots-full/fix-p1-touch-1-orbit.png'});
  await touch('touchStart',[[150,420],[240,420]]);for(let i=1;i<=10;i++)await touch('touchMove',[[150-i*6,420],[240+i*6,420]]);await touch('touchEnd',[]);await adv(.8);await page.waitForTimeout(900);
  await page.screenshot({path:'mockups/review5/shots-full/fix-p1-touch-2-pinch.png'});
  await page.locator('[data-action="survey"]').tap();await adv(1.2);await page.waitForTimeout(900);
  await page.screenshot({path:'mockups/review5/shots-full/fix-p1-touch-3-survey.png'});
  out.touch={shots:'fix-p1-touch-0..3'};await browser.close();}

console.log(JSON.stringify(out,null,1));
