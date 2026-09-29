import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';

test.describe.configure({timeout:300000});
// Presses the same buttons a player clicks at the oven bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
/** One belt run: three trays in, bake, out (about 5.4 s of game time). */
const belt=(page:Page)=>wait(page,6.2);
async function fetchShelf(page:Page){
  await walk(page,-7.4,5.1,.6);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('shelf');
  await walk(page,2.2,-1.3,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  expect((await snapshot(page)).station.shelfReady).toBe(true);
}
async function fetchDough(page:Page){
  await walk(page,-8.6,3.4,.6);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('dough');
  await walk(page,-2,-1.4,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  expect((await snapshot(page)).station.doughReady).toBe(true);
}
async function toBench(page:Page){await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);}

test('clockwork kitchen: internal RC where it is enough, a crystal with the right divider, then a resonator routed clear',async({page})=>{
  const errors=await open(page,'clockwork');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Roll the clock-module shelf');
  await fetchShelf(page);await fetchDough(page);await toBench(page);
  await expect(page.locator('.station-panel')).toContainText('Egg timer');
  // 1 · no clock selected: the internal RC holds ±2 % over room temperature, and costs nothing.
  let s=(await snapshot(page)).station;expect(s.setup.source).toBeUndefined();expect(s.tickRatio).toBe(0);
  await steps(page,[['source','rc'],['run']]);
  expect((await act(page,'run')).ok).toBe(false);
  await belt(page);s=(await snapshot(page)).station;
  expect(s.results).toEqual([{job:'eggs',tier:3}]);expect(s.lastRun.trays).toEqual(['golden','golden','golden']);
  // 2 · the conveyor oven needs ±0.2 % at 70 °C: a 12 MHz crystal, and the divider turned to ÷12000.
  await expect(page.locator('.station-panel')).toContainText('Conveyor oven');
  await steps(page,[['source','xtal12']]);s=(await snapshot(page)).station;expect(s.tickRatio).toBeCloseTo(1.5,2);
  await steps(page,[['divider',1]]);s=(await snapshot(page)).station;expect(s.setup.divider).toBe(12000);expect(Math.abs(s.tickRatio-1)).toBeLessThan(1e-4);
  await steps(page,[['run']]);await belt(page);s=(await snapshot(page)).station;
  expect(s.results[1]).toEqual({job:'oven',tier:3});
  // 3 · the night shift's run replays on the internal RC: trays 1 and 2 fine, tray 3 burns as the board warms.
  expect(s.job).toBe(2);expect(s.belt.replay).toBe(true);expect(s.setup.source).toBe('rc');
  await belt(page);s=(await snapshot(page)).station;
  expect(s.lastRun).toEqual({job:'pastry',replay:true,trays:['golden','golden','burnt']});expect(s.mistakes).toBe(0);
  await expect(page.locator('.station-toast')).toContainText('tray 3 burnt');
  // A resonator holds ±1 % over 25–70 °C, once its clock line is routed clear of the running mixer.
  await steps(page,[['source','res8'],['route']]);s=(await snapshot(page)).station;expect(s.verdict.tier).toBe(3);
  await steps(page,[['run']]);await belt(page);await wait(page,.2);
  s=await snapshot(page);
  expect(s.station.results.map((r:{tier:number})=>r.tier)).toEqual([3,3,3]);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);expect(s.station.spent).toBe(5);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('clockwork kitchen: no clock, a wrong divider and a noisy clock line are explained, and each is recoverable',async({page})=>{
  const errors=await open(page,'clockwork');await wait(page,.1);await toBench(page);
  // Nothing runs without dough, and the modules are still in the storeroom.
  expect((await act(page,'run')).ok).toBe(false);await expect(page.locator('.station-toast')).toContainText('dough');
  expect((await act(page,'source','res8')).ok).toBe(false);await expect(page.locator('.station-toast')).toContainText('shelf');
  await page.keyboard.press('Escape');await fetchDough(page);await toBench(page);
  // Running with no clock selected: nothing ticks, the eggs come out raw.
  await steps(page,[['run']]);await belt(page);
  let s=(await snapshot(page)).station;expect(s.mistakes).toBe(1);expect(s.results).toEqual([]);expect(s.lastRun.trays).toEqual(['raw','raw','raw']);
  await expect(page.locator('.station-toast')).toContainText('No clock');
  // The internal RC on ÷16000 ticks at 500 Hz: every cook runs twice as long.
  await steps(page,[['source','rc'],['divider',1],['divider',1],['run']]);await belt(page);
  s=(await snapshot(page)).station;expect(s.mistakes).toBe(2);expect(s.lastRun.trays).toEqual(['burnt','burnt','burnt']);
  await expect(page.locator('.station-toast')).toContainText('÷8000');
  // Back to ÷8000: the eggs are fine.
  await steps(page,[['divider',-1],['divider',-1],['run']]);await belt(page);
  s=(await snapshot(page)).station;expect(s.results).toEqual([{job:'eggs',tier:3}]);
  // Now the shelf: a crystal on the egg timer would work, but the solver knows it isn't needed (checked in logic).
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
  await fetchShelf(page);await toBench(page);
  // Job 2 with the resonator: this unit bakes fine, but it is not guaranteed over temperature.
  await steps(page,[['source','res8'],['run']]);await belt(page);
  s=(await snapshot(page)).station;expect(s.results[1]).toEqual({job:'oven',tier:1});
  // Job 3 after the replay: the resonator's line past the running mixer picks up extra counts.
  await belt(page);await steps(page,[['source','res8'],['run']]);await belt(page);
  s=(await snapshot(page)).station;expect(s.mistakes).toBe(3);expect(s.lastRun.trays).toEqual(['raw','raw','raw']);
  await expect(page.locator('.station-toast')).toContainText('mixer');
  await steps(page,[['route'],['run']]);await belt(page);
  s=await snapshot(page);expect(s.station.results.map((r:{tier:number})=>r.tier)).toEqual([3,1,3]);expect(s.won).toBe(true);
  expect(errors).toEqual([]);
});
