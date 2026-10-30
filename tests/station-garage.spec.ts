import {test,expect,type Page} from '@playwright/test';
import {open,walk,route,wait,snapshot} from './navigation';

test.describe.configure({timeout:300000});
// Presses the same buttons a player clicks at the garage bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${a??''}`).toBe(true);}
const station=async(page:Page)=>(await snapshot(page)).station;
/** Carry the robot from its charging pad onto the test stand behind the bench, then sit at the bench. */
async function setUp(page:Page){
  await walk(page,6.4,-4.2,.5);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('robot');
  await route(page,[[3.4,-4],[2.5,-4.4]]);await page.keyboard.press('KeyE');await wait(page,.3);
  expect((await station(page)).onStand).toBe(true);
  await route(page,[[2.9,-4],[2.9,-1.1]]);await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
}

test('robot garage: catch the kick, clamp it, stop fast, star-ground the controller, then the delivery run',async({page})=>{
  const errors=await open(page,'garage');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Carry the delivery robot');
  // Nothing to test until the robot is on the stand.
  expect((await act(page,'pulse')).ok).toBe(false);
  await setUp(page);
  await expect(page.locator('.station-panel')).toContainText('Resets on shutdown');
  // 1 · With nothing fitted, the kick arcs across the switch and the controller reboots.
  await steps(page,[['pulse']]);await wait(page,1);
  let s=await station(page);expect(s.capture.fault).toBe('stop');expect(s.capture.spike).toBeGreaterThan(60);
  await expect(page.locator('.station-toast')).toContainText('controller reset');
  await steps(page,[['pick','diode'],['slot','fly'],['pulse']]);
  s=await station(page);expect(s.capture.fault).toBeNull();expect(s.capture.spike).toBeLessThan(14);
  await steps(page,[['test']]);s=await station(page);expect(s.logged[0].tier).toBe(3);
  // 2 · The stop line: the plain diode empties the coil too slowly; one TVS across the switch is quick and lean.
  await expect(page.locator('.station-panel')).toContainText('Stop at the line');
  await steps(page,[['pulse']]);expect((await station(page)).capture.fault).toBe('slow');
  await steps(page,[['pick','diode'],['pick','diode'],['pick','tvs'],['slot','switch'],['pulse']]);
  s=await station(page);expect(s.capture.fault).toBeNull();expect(s.capture.offTime).toBeLessThan(1e-3);
  await steps(page,[['test']]);s=await station(page);expect(s.logged[1].tier).toBe(3);
  // 3 · Heavy cargo: the start surge through the shared ground browns the controller out; a star ground fixes it.
  await steps(page,[['pulse']]);s=await station(page);expect(s.capture.fault).toBe('start');expect(s.scope).toBe('start');
  await steps(page,[['ground'],['pulse']]);expect((await station(page)).capture.dip).toBeLessThan(.35);
  await steps(page,[['test']]);s=await station(page);
  expect(s.logged.map((l:{tier:number})=>l.tier)).toEqual([3,3,3]);expect(s.driving).toBe(true);expect((await snapshot(page)).atBench).toBe(false);
  // The payoff: the robot drives its route to the dock.
  await wait(page,12);s=await snapshot(page);
  expect(s.station.delivered).toBe(true);expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);
  const bot=s.items.find((i:{id:string})=>i.id==='robot');expect(bot.pos.x).toBeLessThan(-7);expect(bot.pos.z).toBeLessThan(-5);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('robot garage: a backwards diode trips the self-resetting fuse, a backwards clamp gives no path, and both are recoverable',async({page})=>{
  const errors=await open(page,'garage');await wait(page,.1);await setUp(page);
  // A diode fitted backwards is a dead short while the motor runs: the fuse trips.
  await steps(page,[['pick','diode'],['slot','fly'],['flip','fly'],['pulse']]);
  let s=await station(page);expect(s.fuse).toBe(false);expect(s.mistakes).toBe(1);
  await expect(page.locator('.station-toast')).toContainText('fuse tripped');
  await expect(page.locator('.station-toast')).not.toContainText('band');
  expect((await act(page,'pulse')).ok).toBe(false);
  // Flip it back; the PTC fuse cools and conducts again by itself, and the diode clamps the kick.
  await steps(page,[['flip','fly']]);await wait(page,2.6);
  s=await station(page);expect(s.fuse).toBe(true);
  await steps(page,[['pulse'],['test']]);s=await station(page);expect(s.logged[0].tier).toBe(3);
  // Job 2: testing the plain diode fails the stop line (a mistake, with the reason).
  await steps(page,[['test']]);s=await station(page);expect(s.mistakes).toBe(2);expect(s.job).toBe(1);
  await expect(page.locator('.station-toast')).toContainText('stop-line brake');
  // The zener clamp fitted backwards: its diode never conducts, so the kick has no path again.
  await steps(page,[['pick','clamp'],['slot','fly'],['flip','fly'],['pulse']]);s=await station(page);expect(s.capture.fault).toBe('stop');expect(s.fuse).toBe(true);
  // The right way round it clamps at about 37 V and empties the coil fast: one part, elegant.
  await steps(page,[['flip','fly'],['pulse']]);s=await station(page);expect(s.capture.fault).toBeNull();expect(s.capture.spike).toBeGreaterThan(30);
  await steps(page,[['test']]);s=await station(page);expect(s.job).toBe(2);expect(s.logged[1].tier).toBe(3);
  // Job 3: a bulk capacitor at the controller rides through part of the start sag, but not enough.
  await steps(page,[['pick','cap'],['slot','ctrl'],['pulse']]);s=await station(page);expect(s.capture.fault).toBe('start');expect(s.capture.dip).toBeLessThan(.9);
  await expect(page.locator('.station-toast')).toContainText('browned out');
  // Stepping back from the bench returns the keys to walking.
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
  expect(errors).toEqual([]);
});
