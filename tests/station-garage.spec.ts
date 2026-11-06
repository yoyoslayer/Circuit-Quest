import {test,expect,type Page} from '@playwright/test';
import {open,walk,route,wait,snapshot} from './navigation';
import {plugBench} from './station-lead';

test.describe.configure({timeout:300000});
// Presses the same buttons a player clicks at the garage bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${a??''}`).toBe(true);}
const station=async(page:Page)=>(await snapshot(page)).station;
/** Pick a part up, turn it in hand if it lies the other way round (the tray lays parts either way
 *  each job), and fit it: `flipped` false = band (or +) at the socket's left end. */
async function fit(page:Page,part:string,slot:string,flipped=false){
  await steps(page,[['pick',part]]);
  if((await station(page)).trayFlip[part]!==flipped)await steps(page,[['flip']]);
  await steps(page,[['slot',slot]]);
  expect((await station(page)).slots[slot]).toEqual({part,flipped});
}
/** Carry the robot from its charging pad onto the test stand behind the bench, then sit at the bench. */
async function setUp(page:Page){
  await walk(page,6.4,-4.2,.5);await expect(page.locator('.prompt-pill')).toContainText('robot');
  await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('robot');
  await route(page,[[3.4,-4],[2.5,-4.4]]);await page.keyboard.press('KeyE');await wait(page,.3);
  expect((await station(page)).onStand).toBe(true);
  await route(page,[[2.9,-4],[2.9,-1.1]]);
  // No PULSE on a dead bench: plug its mains lead in at the left wall (R5-079).
  await plugBench(page,[],[[-8.9,5.6],[-8.5,4],[-4.5,1.9]]);
  await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
}

test('robot garage: catch the kick, clamp it, brake fast, star-ground the controller, then the delivery run',async({page})=>{
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
  // Failing readings are red in the panel.
  await expect(page.locator('.station-panel li.bad')).toContainText('Stop spike');
  await fit(page,'diode','fly');await steps(page,[['pulse']]);
  s=await station(page);expect(s.capture.fault).toBeNull();expect(s.capture.spike).toBeLessThan(14);
  await steps(page,[['test']]);s=await station(page);expect(s.logged[0].tier).toBe(3);
  // The served beat keeps the passed diode drawn in its socket; a refused action ends the beat and
  // the drawing follows the bare board at once (R6 stations-a-2).
  expect(s.beat).toBe(true);expect(s.drawn).toEqual({diode:'fly'});
  expect((await act(page,'clear')).ok).toBe(false);s=await station(page);expect(s.beat).toBe(false);expect(s.drawn).toEqual({});
  // 2 · The parking brake: the board is bare again; a plain diode empties the brake coil too slowly.
  expect(s.slots).toEqual({});
  await expect(page.locator('.station-panel')).toContainText('Brake at the line');
  await fit(page,'diode','fly');await steps(page,[['pulse']]);expect((await station(page)).capture.fault).toBe('slow');
  // One TVS across the switch empties it fast: lean and quick.
  await steps(page,[['pick','diode'],['pick','diode']]);await fit(page,'tvs','switch');await steps(page,[['pulse']]);
  s=await station(page);expect(s.capture.fault).toBeNull();expect(s.capture.offTime).toBeLessThan(2e-3);
  await steps(page,[['test']]);s=await station(page);expect(s.logged[1].tier).toBe(3);
  // 3 · Heavy cargo, from a bare board: a path for the kick, then the start surge through the long shared ground.
  await fit(page,'diode','fly');await steps(page,[['pulse']]);s=await station(page);expect(s.capture.fault).toBe('start');expect(s.scope).toBe('start');
  await steps(page,[['ground'],['pulse']]);s=await station(page);expect(s.capture.dip).toBeLessThan(.35);
  // The proof is shown where the failure was: the scope stays on the START trace.
  expect(s.scope).toBe('start');
  // The last pass holds a beat while its five test cycles run (R5-087), then the robot sets off.
  // Job 3's long shared ground stays on show through the beat (R6 stations-a-6).
  await steps(page,[['test']]);s=await station(page);expect(s.driving).toBe(false);expect(s.gndLong).toBe(true);await wait(page,3.4);s=await station(page);
  expect(s.logged.map((l:{tier:number})=>l.tier)).toEqual([3,3,3]);expect(s.driving).toBe(true);expect((await snapshot(page)).atBench).toBe(false);
  await wait(page,.2);await expect(page.locator('.prompt-pill')).toContainText('Follow the robot');
  // The payoff: the robot drives its route to the dock.
  await wait(page,12);s=await snapshot(page);
  expect(s.station.delivered).toBe(true);expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);
  // It drives nose first: only the corners turn it off its travel direction, briefly (R6 stations-a-1).
  expect(s.station.driveSlip).toBeLessThan(1.2);
  const bot=s.items.find((i:{id:string})=>i.id==='robot');expect(bot.pos.x).toBeLessThan(-7);expect(bot.pos.z).toBeLessThan(-5);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  // Two of three: the tidy run skips the room's chaos bonus (earned in station-cable.spec).
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('robot garage: polarity and place are real choices, PULSE experiments are free of mistakes, and every fault is recoverable',async({page})=>{
  const errors=await open(page,'garage');await wait(page,.1);await setUp(page);
  // A diode fitted band-to-node across the motor is a dead short while the motor runs: the fuse trips.
  // At PULSE that costs a scrapped fuse's bench time, not a mistake.
  await fit(page,'diode','fly',true);await steps(page,[['pulse']]);
  let s=await station(page);expect(s.fuse).toBe(false);expect(s.mistakes).toBe(0);expect(s.spent).toBeCloseTo(.3,6);
  await expect(page.locator('.station-toast')).toContainText('fuse tripped');
  await expect(page.locator('.station-toast')).not.toContainText('band');
  expect((await act(page,'pulse')).ok).toBe(false);
  // While the fuse cools the prompt offers no key, and the panel counts down.
  await wait(page,.1);await expect(page.locator('.prompt-pill')).toContainText('Fuse cooling');await expect(page.locator('.prompt-pill kbd')).toHaveCount(0);
  const before=await page.locator('.station-panel').innerText();await wait(page,.6);expect(await page.locator('.station-panel').innerText()).not.toBe(before);
  // Flip it back; the PTC fuse cools and conducts again by itself, and the diode clamps the kick.
  await steps(page,[['flip','fly']]);await wait(page,2.6);
  s=await station(page);expect(s.fuse).toBe(true);
  await steps(page,[['pulse'],['test']]);s=await station(page);expect(s.logged[0].tier).toBe(3);
  // Job 2: testing the plain diode fails the brake (a mistake, with the reason), without the reset cue.
  await fit(page,'diode','fly');await steps(page,[['test']]);s=await station(page);expect(s.mistakes).toBe(1);expect(s.job).toBe(1);
  await expect(page.locator('.station-toast')).toContainText('grabbed late');
  await wait(page,.8);expect((await station(page)).resetFlash).toBe(0);
  // The zener clamp fitted backwards: it never conducts, so the kick has no path again.
  await fit(page,'clamp','fly',true);await steps(page,[['pulse']]);s=await station(page);expect(s.capture.fault).toBe('stop');expect(s.fuse).toBe(true);
  // The right way round it clamps at about 37 V and empties the coil fast: one part, elegant.
  await steps(page,[['flip','fly'],['pulse']]);s=await station(page);expect(s.capture.fault).toBeNull();expect(s.capture.spike).toBeGreaterThan(30);
  await steps(page,[['test']]);s=await station(page);expect(s.job).toBe(2);expect(s.logged[1].tier).toBe(3);
  // Job 3: a diode across the switch, band at the node, never conducts as the node rises: still no path.
  await fit(page,'diode','switch');await steps(page,[['pulse']]);expect((await station(page)).capture.fault).toBe('stop');
  // Turned round it conducts forwards: the motor never switches off and keeps running until the setup changes.
  await steps(page,[['flip','switch'],['pulse']]);await wait(page,1.4);s=await station(page);expect(s.capture.fault).toBe('stuck');expect(s.stuck).toBe(true);expect(s.motorOn).toBe(1);
  await steps(page,[['slot','switch']]);await wait(page,.1);expect((await station(page)).stuck).toBe(false);
  // A bulk capacitor at the controller barely dents the start sag of an 80 ms spin-up.
  await fit(page,'diode','fly');await fit(page,'cap','ctrl');await steps(page,[['pulse']]);s=await station(page);expect(s.capture.fault).toBe('start');expect(s.capture.dip).toBeLessThan(.9);
  await expect(page.locator('.station-toast')).toContainText('browned out');
  expect(s.mistakes).toBe(1);
  // The flip button beside a socket is there only while a polar part sits in it, and the pointer only
  // finds it then: over the bare board where a hidden one sits, nothing is hovered (R6 stations-a-5).
  await fit(page,'diode','fly');let on=false;
  for(let i=0;i<40&&!on;i++){await page.mouse.move(...((await station(page)).flipAt.fly as [number,number]));on=(await station(page)).hover?.act==='flip';if(!on)await page.waitForTimeout(250);}
  expect(on,'the visible flip button is under the pointer').toBe(true);
  await steps(page,[['slot','fly']]);await page.mouse.move(...((await station(page)).flipAt.fly as [number,number]),{steps:2});
  s=await station(page);expect(s.slots.fly).toBeUndefined();expect(s.hover?.act??null).not.toBe('flip');
  await expect(page.locator('.prompt-pill')).not.toContainText('Flip it round');
  // Stepping back from the bench returns the keys to walking.
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
  expect(errors).toEqual([]);
});

test('robot garage: the robot wired to the test stand stays there: E does not pick it up (R6 stations-a-3)',async({page})=>{
  const errors=await open(page,'garage');await wait(page,.1);
  await walk(page,6.4,-4.2,.5);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('robot');
  await route(page,[[3.4,-4],[2.5,-4.4]]);await page.keyboard.press('KeyE');await wait(page,.3);
  expect((await station(page)).onStand).toBe(true);
  // Behind the bench, in reach of the robot (1.65 m) but outside the bench's own radius.
  await walk(page,1.9,-4.2,.25);let s=await snapshot(page);
  expect(Math.hypot(s.player.x-.7,s.player.z+4.45)).toBeLessThan(1.6);
  await page.keyboard.press('KeyE');await wait(page,.2);s=await snapshot(page);
  expect(s.held).not.toBe('robot');expect(s.station.onStand).toBe(true);
  expect(errors).toEqual([]);
});
