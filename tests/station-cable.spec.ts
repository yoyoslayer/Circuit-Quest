import {test,expect,type Page} from '@playwright/test';
import {open,walk,route,wait,snapshot} from './navigation';
import {plugBench,lead} from './station-lead';

// R5-079: every station room has a real cable act (the bench's mains lead) and a physical or chaos
// bonus that reads the room's physics. These play each one the way a player would.
test.describe.configure({timeout:300000});
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
const station=async(page:Page)=>(await snapshot(page)).station;
/** Walks toward a point and doesn't mind stopping short (pushing through a stack, up to a wall). */
const shove=(page:Page,x:number,z:number,limit=6)=>page.evaluate(([x,z,l])=>(window as any).__circuitCrew.drive.walkTo(x,z,.3,l),[x,z,limit] as const);
/** The station's bonus at `i`, read live. */
const bonus=(page:Page,i:number)=>page.evaluate(k=>{const b=(window as any).__game.station.job.bonuses[k];return {text:b.text as string,ok:b.ok() as boolean};},i);

test('station rooms: every bench has a drawn mains lead and starts dead',async({page})=>{
  for(const level of ['arcade','arcade-rush','garage','qfn','observatory','spectrum']){
    await open(page,level);await wait(page,.2);
    const s=await snapshot(page);
    expect(s.rope.maxLength,level).toBeGreaterThanOrEqual(8);expect(s.rope.maxLength,level).toBeLessThanOrEqual(14);
    expect(s.benchLive,level).toBe(false);expect(s.connected,level).toBe(false);
    // The cable, its plug, the reel and the socket ring are all in the room.
    const drawn=await page.evaluate(()=>{const g=(window as any).__game;return g.ropeMesh.visible&&g.ropeMesh.geometry.attributes.position.count>0&&g.plug.visible&&g.target.visible;});
    expect(drawn,level).toBe(true);
    await expect(page.locator('.objective'),level).toBeVisible();
  }
});

test('arcade: a dead bench refuses power, the lead brings it to life, a yank cuts it (no mistake), and the prize pyramid goes over',async({page})=>{
  const errors=await open(page,'arcade');await wait(page,.1);
  await route(page,[[-5.5,6.6],[-7.2,5.8]]);await walk(page,-8.3,4.4,.3);await page.keyboard.press('KeyE');
  await route(page,[[-7.2,5.8],[-5.5,6.4]]);await walk(page,1.2,-1.3,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  expect((await station(page)).trayReady).toBe(true);
  // Dead: the lever does nothing, the reel's pilot blinks, and no mistake is counted.
  expect((await act(page,'power')).ok).toBe(false);await expect(page.locator('.station-toast')).toContainText('No power');
  let s=await station(page);expect(s.powered).toBe(false);expect(s.mistakes).toBe(0);
  await plugBench(page,[],[[2.9,-4],[2.9,-1.2]]);
  await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
  // Pinball, signed off on mains power.
  await steps(page,[['slot','across'],['pick',220],['slot',0],['power']]);await wait(page,4);
  s=await station(page);expect(s.soakDone).toBe(true);await steps(page,[['signoff']]);expect((await station(page)).served.length).toBe(1);
  // Power the next cabinet on, then go and pull the plug out of the wall: the bench drops dead.
  await steps(page,[['power']]);expect((await station(page)).powered).toBe(true);
  await page.keyboard.press('Escape');const l=await lead(page);await route(page,[[2.9,-1.2],[2.9,-4],l.route[l.route.length-1]]);
  await page.keyboard.press('KeyF');await wait(page,.2);s=await snapshot(page);
  expect(s.holdingPlug).toBe(true);expect(s.benchLive).toBe(false);expect(s.station.powered).toBe(false);expect(s.station.mistakes).toBe(0);
  await page.keyboard.press('KeyF');await wait(page,.2);expect((await snapshot(page)).connected).toBe(true);
  // The prize pyramid in front of the shelf: barge into it.
  expect((await bonus(page,0)).ok).toBe(false);
  // The pyramid stands at PYRAMID (src/stations/arcade/room.ts, z -8.75): come at it from 2 m south.
  await walk(page,1.4,-7.4,.4);await shove(page,1.4,-9.2);await wait(page,1.5);
  expect((await station(page)).prizesDown).toBeGreaterThanOrEqual(3);
  expect(await bonus(page,0)).toEqual({text:'Knock the prize pyramid over',ok:true});
  expect(errors).toEqual([]);
});

test('arcade: a taut bench lead let go slingshots props more than a metre',async({page})=>{
  await open(page,'arcade');await wait(page,.1);
  await walk(page,1.2,-1.3,.5);await walk(page,2.55,-.65,.6);await page.keyboard.press('KeyF');expect((await snapshot(page)).holdingPlug).toBe(true);
  // Sprint away from the reel across the hall until the lead is past its length.
  await walk(page,-3.5,5,.5);const taut=await wait(page,2.5,['KeyA','KeyS','ShiftLeft']);expect(taut.rope.strain).toBeGreaterThan(1.02);
  const at=()=>page.evaluate(()=>(window as any).__game.props.map((p:any)=>{const t=p.body.translation();return [t.x,t.z];}));
  const before=await at();await page.keyboard.press('KeyQ');await wait(page,1.5);const after=await at();
  const moved=after.map((p:number[],i:number)=>Math.hypot(p[0]-before[i][0],p[1]-before[i][1]));
  expect(Math.max(...moved)).toBeGreaterThan(1);
  const s=await snapshot(page);expect(s.holdingPlug).toBe(false);expect(s.beats.some((b:{kind:string})=>b.kind==='slingshot')).toBe(true);
  await page.screenshot({path:'artifacts/arcade-bench-lead-slingshot.png'});
});

test('robot garage: the bench lead powers PULSE, and the parcel stack is bowled off the robot\'s route',async({page})=>{
  const errors=await open(page,'garage');await wait(page,.1);
  await walk(page,6.4,-4.2,.5);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('robot');
  await route(page,[[3.4,-4],[2.5,-4.4]]);await page.keyboard.press('KeyE');await wait(page,.3);expect((await station(page)).onStand).toBe(true);
  // On the stand but unplugged: PULSE refuses, no mistake.
  expect((await act(page,'pulse')).ok).toBe(false);expect((await station(page)).mistakes).toBe(0);
  await route(page,[[2.9,-4],[2.9,-1.1]]);await plugBench(page,[],[[-8.9,5.6],[-8.5,4],[-4.5,1.9]]);
  // Barge through the parcel stack on the robot's painted route.
  expect((await station(page)).parcelsBowled).toBe(false);
  await shove(page,-8.2,.4);await wait(page,1.5);expect((await station(page)).parcelsBowled).toBe(true);
  expect((await bonus(page,0)).ok).toBe(true);
  await walk(page,-4.5,1.9,.5);await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
  // Job 1 on mains power: a flyback diode across the coil, PULSE, TEST.
  await steps(page,[['pick','diode']]);if((await station(page)).trayFlip.diode)await steps(page,[['flip']]);await steps(page,[['slot','fly'],['pulse']]);
  expect((await station(page)).capture.fault).toBeNull();await steps(page,[['test']]);expect((await station(page)).logged.length).toBe(1);
  expect(errors).toEqual([]);
});

test('QFN bench: a crate tossed onto the bench counts, and SHIP needs the bench lead (dead: refused, no mistake)',async({page})=>{
  const errors=await open(page,'qfn');await wait(page,.1);
  await walk(page,-12.8,2.95,.5);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('parts');
  // Lob it from four metres out: it lands, comes to rest, and the bench takes it.
  await walk(page,-8.8,2.95,.5);await walk(page,-3.7,1.15,.4);await page.keyboard.press('KeyQ');await wait(page,3);
  let s=await station(page);expect(s.partsReady).toBe(true);expect(s.tossed).toBe(true);expect((await bonus(page,0)).ok).toBe(true);
  // At the bench unplugged: SHIP's bring-up test has no power, so it refuses and nothing is counted.
  await walk(page,1.3,-.4,.5);await walk(page,0,-.5,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
  expect((await act(page,'ship')).ok).toBe(false);await expect(page.locator('.station-toast')).toContainText('No power');expect((await station(page)).mistakes).toBe(0);
  await page.keyboard.press('Escape');
  await plugBench(page,[[1.3,-.4]],[[9,-7.4],[9,-5.2],[8.6,-3.2],[6.2,-2.6],[3.3,0],[1.3,-.4]]);
  await walk(page,0,-.5,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
  // Live: SHIP now reaches the test (the scrambled board is sent back; the full three-board run is station-qfn.spec).
  expect((await act(page,'ship')).ok).toBe(true);s=await station(page);expect(s.mistakes).toBe(1);
  expect(errors).toEqual([]);
});

test('signal observatory: the motor cart rolled into the far wall, then a decode logged on mains power',async({page})=>{
  const errors=await open(page,'observatory');await wait(page,.1);
  await walk(page,-3.7,-.1,.6);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('motor');
  await walk(page,-6,3.5,.6);await shove(page,-6.3,8.4,8);await page.keyboard.press('KeyQ');await wait(page,2);
  let s=await station(page);expect(s.cartMoved).toBe(true);expect(s.cartWall).toBe(true);expect((await bonus(page,0)).ok).toBe(true);
  await plugBench(page,[[-.5,-.9]],[[2.95,-3.8],[2.95,-1.5]]);
  await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
  await steps(page,[['pick','C'],['slot','shunt'],['value',{slot:'shunt',value:1.5e-6}],['route']]);
  s=await station(page);expect(s.reading.snr).toBeGreaterThanOrEqual(12);
  await steps(page,[['log']]);expect((await station(page)).logged.length).toBe(1);
  expect(errors).toEqual([]);
});

test('spectrum delivery: the smoking toaster knocked off the counter stops smoking, and SEND needs the desk lead',async({page})=>{
  const errors=await open(page,'spectrum');await wait(page,.1);
  // A cone from the lab corridor, lobbed at the toaster from two metres.
  await route(page,[[-6.3,3.6],[-6.4,1.2],[0,-1.4],[4.2,.6]]);await walk(page,4.6,1,.9);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('cone');
  // Line up on the toaster: the last leg runs straight at it, so Pip faces it when he throws.
  await walk(page,2.15,1.5,.3);await walk(page,2.15,2.4,.08);await walk(page,2.15,2.9,.06);await page.keyboard.press('KeyQ');await wait(page,2.5);
  expect((await station(page)).toasterDown).toBe(true);expect((await bonus(page,0)).ok).toBe(true);
  // No toaster, no smoke: the cloud is gone from the rules, not just the picture.
  expect((await station(page)).smoke).toBe(0);
  // Pod to the storeroom, the desk lead plugged in at the left wall, then delivery 1 by radio.
  await route(page,[[-.2,4.2],[-3.5,3.55],[-6.3,3.6]]);await walk(page,-6.3,4.4,.3);await page.keyboard.press('KeyE');await wait(page,.2);expect((await snapshot(page)).held).toBe('pod');
  await route(page,[[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await page.keyboard.press('KeyE');await wait(page,.2);expect((await station(page)).podPad).toBe('store');
  await plugBench(page,[[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2]],[[-8.6,1.5],[-6.4,1.45],[-6.3,3.6]]);
  await walk(page,-3.5,3.55,.4);await page.keyboard.press('KeyE');await wait(page,.2);expect((await snapshot(page)).atBench).toBe(true);
  await steps(page,[['band','radio'],['send']]);await wait(page,2);expect((await station(page)).delivered.length).toBe(1);
  expect(errors).toEqual([]);
});
