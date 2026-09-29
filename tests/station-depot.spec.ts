import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';
// Whole-shift playthroughs press dozens of buttons under software rendering.
test.describe.configure({timeout:300000});

// Presses the same buttons a player clicks at the bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
const station=async(page:Page)=>(await snapshot(page)).station;
async function toBench(page:Page){
  for(const [id,x,z,px,pz] of [['lampcart',5.9,-2.1,-3.8,-1.6],['motorcart',9,-2.1,2.9,-1.6]] as const){
    await walk(page,x,z,.6);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe(id);
    await walk(page,px,pz,.6);await page.keyboard.press('KeyE');await wait(page,.2);}
  expect((await station(page)).carts).toEqual({lamp:true,motor:true});
  await walk(page,0,-1.5,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
}

test('depot: three jobs dispatched elegantly, the last one proved with the plain meter',async({page})=>{
  const errors=await open(page,'depot');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Bring the lamp cart');
  // Nothing works at the bench before the device carts arrive.
  expect((await act(page,'probe','return')).ok).toBe(false);
  await toBench(page);
  await expect(page.locator('.station-panel')).toContainText('DEAD SOCKET');
  // 1 · Dead socket: 12 V across the gap, nothing flowing; a heavy return rail and E tuned so the lamp gets 12 V.
  await steps(page,[['probe','return']]);
  let s=await station(page);expect(s.meter.v).toBeCloseTo(12,1);expect(s.meter.i).toBe(0);expect(s.current).toBeCloseTo(0,3);
  await expect(page.locator('.station-panel')).toContainText('voltage, but nothing flowing');
  await steps(page,[['rail',['ret','heavy']],['set',12.4],['probe','bay1']]);
  s=await station(page);expect(s.devices[0].v).toBeCloseTo(12,0);expect(s.meter.i).toBeCloseTo(s.current,3);
  await steps(page,[['dispatch']]);await wait(page,1.6);
  // 2 · Two on the rails: heater out, motor in, heavy feed, tuned for the drop under load.
  await expect(page.locator('.station-panel')).toContainText('TWO ON THE RAILS');
  await steps(page,[['barrier',2],['barrier',3],['rail',['feed','heavy']],['set',13.2],['dispatch']]);await wait(page,1.6);
  // 3 · The short: the job opens with the surge and a tripped breaker.
  s=await station(page);expect(s.job).toBe('short');expect(s.tripped).toBe(true);
  await expect(page.locator('.station-panel')).toContainText('trip log');
  await steps(page,[['remove',2],['breaker'],['set',13.2]]);
  s=await station(page);expect(s.tripped).toBe(false);expect(s.devices.map((d:{v:number})=>Math.round(d.v))).toEqual([12,12]);
  // The final check has to be made in the plain meter view.
  expect((await act(page,'dispatch')).ok).toBe(false);await expect(page.locator('.station-toast')).toContainText('plain meter');
  await steps(page,[['view','meter'],['probe','bay1'],['probe','bay3']]);
  s=await station(page);expect(s.plain).toBe(true);expect(s.probed).toEqual(expect.arrayContaining(['bay1','bay3']));
  await steps(page,[['dispatch']]);await wait(page,.5);
  const snap=await snapshot(page);s=snap.station;
  expect(s.served.map((v:{tier:number})=>v.tier)).toEqual([3,3,3]);
  expect(snap.won).toBe(true);expect(s.mistakes).toBe(0);expect(s.spent).toBe(4);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('depot: a sagging lamp is sent back, a heater trips the breaker, a thin feed only works',async({page})=>{
  await open(page,'depot');await wait(page,.1);await toBench(page);
  // A thin return rail at 12 V: the lamp sags under its band, and the job is sent back with the reason.
  await steps(page,[['rail',['ret','thin']],['dispatch']]);
  let s=await station(page);expect(s.mistakes).toBe(1);expect(s.served).toEqual([]);
  await expect(page.locator('.station-toast')).toContainText('under its 11.5–12.5 V band');
  // Turning the source up fixes it (works reliably; the thin rail wastes power, so not elegant).
  await steps(page,[['set',12.8],['dispatch']]);await wait(page,1.6);
  s=await station(page);expect(s.served[0]).toEqual({job:'socket',tier:2});
  // Job 2: lifting the motor's barrier while the heater still runs trips the 4 A breaker.
  await steps(page,[['rail',['feed','heavy']],['set',13.2],['barrier',3]]);
  s=await station(page);expect(s.tripped).toBe(true);expect(s.racing).toBe(true);expect(s.mistakes).toBe(2);
  await expect(page.locator('.station-toast')).toContainText('trips');
  // Heater out, reset: back in business. A thin feed rail works but runs hot (tier 1).
  await steps(page,[['barrier',2],['breaker'],['rail',['feed','thin']],['set',14.3],['dispatch']]);await wait(page,.2);
  s=await station(page);expect(s.served[1]).toEqual({job:'pair',tier:1});expect(s.spent).toBe(1+1+2+1);
  await expect(page.locator('.station-toast')).toContainText('runs hot');
  // Stepping back from the bench returns the keys to walking.
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
});
