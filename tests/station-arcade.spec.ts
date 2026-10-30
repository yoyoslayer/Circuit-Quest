import {test,expect,type Page} from '@playwright/test';
import {open,walk,route,wait,snapshot} from './navigation';

// Each cabinet is play-tested for three simulated seconds, and the machine is busy: give the specs room.
test.describe.configure({timeout:300000});
// Presses the same buttons a player clicks at the bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
const station=async(page:Page)=>(await snapshot(page)).station;
/** Stand blocks in the chain: one list of block values per position. */
const place=(...positions:number[][])=>positions.flatMap((p,k)=>p.flatMap(v=>[['pick',v],['slot',k]] as [string,unknown][]));
async function toBench(page:Page){
  await route(page,[[-5.5,6.6],[-7.2,5.8]]);await walk(page,-8.3,4.4,.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('blocks');
  await route(page,[[-7.2,5.8],[-5.5,6.4]]);await walk(page,1.2,-1.3,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  expect((await station(page)).trayReady).toBe(true);
  await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
}

test('arcade: five cabinets fixed in the ★ zone, after one fuse trip and one popped block',async({page})=>{
  const errors=await open(page,'arcade');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Carry the tray of resistor blocks');
  // Nothing works at the bench before the blocks arrive.
  expect((await act(page,'pick',220)).ok).toBe(false);
  await toBench(page);
  await expect(page.locator('.station-panel')).toContainText('PINBALL');
  // 1 · Pinball: the block across the LED limits nothing, so the PTC fuse trips and glows.
  await steps(page,[['power']]);await wait(page,.5);
  let s=await station(page);expect(s.tripped).toBe(true);expect(s.trips).toBe(1);expect(s.mistakes).toBe(1);
  await expect(page.locator('.station-toast')).toContainText('limits nothing');
  // Take it out and stand a 220 Ω block in the chain. The fuse cools and conducts again by itself.
  await steps(page,[['slot','across'],...place([220])]);await wait(page,2.6);
  s=await station(page);expect(s.tripped).toBe(false);expect(s.live).toBe(true);
  await wait(page,3.2);s=await station(page);expect(s.soakDone).toBe(true);expect(s.verdict.tier).toBe(3);
  expect(s.reading.iLoad*1000).toBeCloseTo(13.6,1);
  await steps(page,[['signoff']]);
  // 2 · Rhythm pad: blue on 3.3 V is backwards, and no single block passes enough: two 47 Ω side by side.
  s=await station(page);expect(s.setup.reversed).toBe(true);expect(s.setup.chain[0]).toEqual([47]);
  await steps(page,[['flip'],...place([47]),['power']]);await wait(page,3.4);
  s=await station(page);expect(s.setup.chain[0]).toEqual([47,47]);expect(s.reading.rChain).toBeCloseTo(23.5,6);expect(s.verdict.tier).toBe(3);
  await steps(page,[['signoff']]);
  // 3 · Claw: the 220 Ω block on 12 V turns 0.44 W into heat. It pops off and the bench cuts out.
  await steps(page,[['power']]);await wait(page,2.4);
  s=await station(page);expect(s.setup.chain[0]).toEqual([]);expect(s.powered).toBe(false);expect(s.mistakes).toBe(3);expect(s.spent).toBe(4);
  await expect(page.locator('.station-toast')).toContainText('P = I²R');
  // Two 470 Ω in a row share the voltage and the heat.
  await steps(page,[...place([470],[470]),['power']]);await wait(page,3.4);
  s=await station(page);expect(s.verdict.tier).toBe(3);expect(s.reading.blocks).toHaveLength(2);expect(s.reading.rHeat).toBeLessThan(.6);
  await steps(page,[['signoff']]);
  // 4 · Handheld: the same chain keeps it in the ★ zone, and the battery lasts about 67 h.
  await steps(page,[['slot',0],...place([470],[470]),['power']]);await wait(page,3.4);
  s=await station(page);expect(Math.round(s.reading.lifeH)).toBe(67);expect(s.verdict.tier).toBe(3);
  await expect(page.locator('.station-panel')).toContainText('Battery life');await steps(page,[['signoff']]);
  // 5 · Coin hopper: 940 Ω gives the base 4.6 mA (the motor needs 2 mA, the pin allows 20).
  await steps(page,[...place([470],[470]),['power']]);await wait(page,3.4);
  s=await station(page);expect(s.reading.iLoad*1000).toBeCloseTo(4.57,2);await steps(page,[['signoff']]);
  await wait(page,.5);s=await snapshot(page);
  expect(s.station.served.map((v:{tier:number})=>v.tier)).toEqual([3,3,3,3,3]);
  expect(s.won).toBe(true);expect(s.station.trips).toBe(1);expect(s.station.spent).toBe(10);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('arcade: an LED over its rating never passes; a reliable chain can be tuned into the ★ zone',async({page})=>{
  await open(page,'arcade');await wait(page,.1);await toBench(page);
  // 100 Ω alone: 30 mA is over the LED's 20 mA. It flickers white-hot and the play test never starts.
  await steps(page,[['slot','across'],...place([100]),['power']]);await wait(page,2);
  let s=await station(page);expect(s.powered).toBe(true);expect(s.soak).toBe(0);expect(s.mistakes).toBe(1);
  await expect(page.locator('.station-toast')).toContainText('over the LED');
  // A second 100 Ω in the next position: 200 Ω, 15 mA. In the band but above the ★ zone.
  await steps(page,place([],[100]));await wait(page,3.4);
  s=await station(page);expect(s.verdict.tier).toBe(2);expect(s.verdict.notes[0]).toContain('★');expect(s.served).toEqual([]);
  // Swap both for one 220 Ω block: the bench stays live, the play test starts over and passes in the ★ zone.
  await steps(page,[['slot',1],['slot',0],...place([220])]);s=await station(page);expect(s.soakDone).toBe(false);expect(s.powered).toBe(true);
  await wait(page,3.4);s=await station(page);expect(s.verdict.tier).toBe(3);
  await steps(page,[['signoff']]);s=await station(page);expect(s.index).toBe(1);expect(s.served[0]).toEqual({job:'bumper',tier:3,cost:1});
  // Signing off needs a fresh play test, and a position holds two blocks at most.
  expect((await act(page,'signoff')).ok).toBe(false);
  await steps(page,place([47]));expect((await act(page,'pick',47)).ok).toBe(true);expect((await act(page,'slot',0)).ok).toBe(false);
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
});
