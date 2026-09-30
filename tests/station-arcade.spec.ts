import {test,expect,type Page} from '@playwright/test';
import {open,walk,route,wait,snapshot} from './navigation';

// The soak runs ten simulated seconds per cabinet, and the machine is busy: give the specs room.
test.describe.configure({timeout:300000});
// Presses the same buttons a player clicks at the bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
const station=async(page:Page)=>(await snapshot(page)).station;
/** Fit a block in the series slot (taking out whatever is there), power up and run the ten-second soak. */
async function fit(page:Page,r:number,rating:number,{remove=true,flip=false}={}){
  const list:[string,unknown?][]=[];if(remove)list.push(['slot','series']);if(flip)list.push(['flip']);
  await steps(page,[...list,['rating',rating],['pick',r],['slot','series'],['power']]);await wait(page,10.4);
}
async function toBench(page:Page){
  await route(page,[[-5.5,6.6],[-7.2,5.8]]);await walk(page,-7.9,4.4,.15);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('blocks');
  await route(page,[[-7.2,5.8],[-5.5,6.4]]);await walk(page,1.2,-1.3,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  expect((await station(page)).trayReady).toBe(true);
  await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
}

test('arcade: five cabinets fixed with the elegant resistor, after one funny fuse trip',async({page})=>{
  const errors=await open(page,'arcade');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Carry the tray of resistor blocks');
  // Nothing works at the bench before the blocks arrive.
  expect((await act(page,'pick',220)).ok).toBe(false);
  await toBench(page);
  await expect(page.locator('.station-panel')).toContainText('PINBALL');
  // 1 · Pinball: the resistor across the LED limits nothing, so the fuse trips. Reset, move the limiter into series.
  await steps(page,[['power']]);await wait(page,.5);
  let s=await station(page);expect(s.tripped).toBe(true);expect(s.mistakes).toBe(1);
  await expect(page.locator('.station-toast')).toContainText('limits nothing');
  expect((await act(page,'power')).ok).toBe(false);
  await steps(page,[['reset'],['slot','parallel']]);await fit(page,220,.125,{remove:false});
  s=await station(page);expect(s.soakDone).toBe(true);expect(s.verdict.tier).toBe(3);
  expect(s.reading.iLoad*1000).toBeCloseTo(13.6,1);
  await steps(page,[['signoff']]);
  // 2 · Rhythm pad: blue on 3.3 V is dark because the LED is backwards; 22 Ω leaves 13 mA.
  expect((await station(page)).setup.reversed).toBe(true);
  await fit(page,22,.125,{flip:true});await steps(page,[['signoff']]);
  // 3 · Claw: 820 Ω on 12 V burns 120 mW, so it needs the ¼ W block for margin.
  await fit(page,820,.25);s=await station(page);expect(s.reading.pR).toBeGreaterThan(.1);await steps(page,[['signoff']]);
  // 4 · Handheld: 1.2 kΩ is the dimmest in band and the battery lasts about 86 h.
  await fit(page,1200,.125);s=await station(page);expect(Math.round(s.reading.lifeH)).toBe(86);
  await expect(page.locator('.station-panel')).toContainText('Battery life');await steps(page,[['signoff']]);
  // 5 · Coin hopper: a 1 kΩ base resistor gives 4.3 mA (the motor needs 2 mA, the pin allows 20).
  await fit(page,1000,.125,{remove:false});s=await station(page);expect(s.reading.iLoad*1000).toBeCloseTo(4.3,1);await steps(page,[['signoff']]);
  await wait(page,.5);s=await snapshot(page);
  expect(s.station.served.map((v:{tier:number})=>v.tier)).toEqual([3,3,3,3,3]);
  expect(s.won).toBe(true);expect(s.station.trips).toBe(1);expect(s.station.spent).toBe(6);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('arcade: an LED over its rating is cut off and explained; a reliable fit can be tuned to elegant',async({page})=>{
  await open(page,'arcade');await wait(page,.1);await toBench(page);
  // Take the stray resistor out from across the LED, then try 100 Ω: 30 mA is over the LED's 20 mA.
  await steps(page,[['slot','parallel'],['pick',100],['slot','series'],['power']]);await wait(page,3);
  let s=await station(page);expect(s.powered).toBe(false);expect(s.mistakes).toBe(1);expect(s.tripped).toBe(false);
  await expect(page.locator('.station-toast')).toContainText('over the LED');
  // 150 Ω works reliably (20 mA, in band) but 220 Ω wastes less: the soak says so, and nothing is signed off yet.
  await fit(page,150,.125);s=await station(page);expect(s.verdict.tier).toBe(2);expect(s.verdict.notes[0]).toContain('220');
  expect(s.served).toEqual([]);
  // Keep tuning: swapping the block powers down and restarts the soak.
  await fit(page,220,.125);s=await station(page);expect(s.verdict.tier).toBe(3);
  await steps(page,[['signoff']]);s=await station(page);expect(s.index).toBe(1);expect(s.served[0]).toEqual({job:'bumper',tier:3,cost:1});
  // Signing off needs a fresh ten-second run.
  expect((await act(page,'signoff')).ok).toBe(false);
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
});
