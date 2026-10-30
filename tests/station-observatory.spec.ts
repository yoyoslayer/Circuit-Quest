import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';

// The rooms carry 100+ physics props; under software rendering give each test room, like the other stations.
test.describe.configure({timeout:180000});

// Presses the same buttons a player clicks at the signal bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${a??''}`).toBe(true);}
async function moveCart(page:Page){
  await walk(page,-3.7,-.1,.6);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('motor');
  await walk(page,-6,3.5,.6);await page.keyboard.press('KeyE');await wait(page,.3);
  const s=(await snapshot(page)).station;expect(s.cartMoved).toBe(true);expect(s.cartDistance).toBeGreaterThanOrEqual(4);
}
async function toBench(page:Page){await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);}

test('signal observatory: move the motor, filter the line, keep the latch, tune the whip',async({page})=>{
  const errors=await open(page,'observatory');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Roll the noisy motor cart');
  // Noise is heavy while the motor sits by the receiver.
  expect((await snapshot(page)).station.reading.snr).toBeLessThan(0);
  await moveCart(page);await toBench(page);
  await expect(page.locator('.station-panel')).toContainText('Clean up the garbled message');
  // 1 · a capacitor can in shunt starts at 100 nF: its corner (about 35 kHz) is far above the 9 kHz noise.
  await steps(page,[['pick','C'],['slot','shunt']]);
  let s=(await snapshot(page)).station;expect(s.shunt).toEqual({kind:'C',value:1e-7});expect(s.reading.snr).toBeLessThan(12);
  // Turning the knob up to 1.5 µF brings the corner down below the noise; a cleaner cable route does the rest.
  for(let k=0;k<7;k++)await page.keyboard.press('ArrowRight');
  s=(await snapshot(page)).station;expect(s.shunt.value).toBeCloseTo(1.5e-6,12);
  await steps(page,[['route']]);s=(await snapshot(page)).station;expect(s.reading.snr).toBeGreaterThanOrEqual(12);
  await steps(page,[['log']]);
  // 2 · the dome motor's 4 kHz whine needs a steeper filter, and the 12 V latch must keep its DC: a series coil.
  await expect(page.locator('.station-panel')).toContainText('Keep the shutter latch powered');
  await steps(page,[['pick','L'],['slot','series']]);
  // At 1 mH the coil and capacitor ring near 4 kHz and make the whine louder; 10 mH and 1 µF settle well below it.
  s=(await snapshot(page)).station;expect(s.reading.snr).toBeLessThan(6);
  await steps(page,[['value',{slot:'series',value:.01}],['value',{slot:'shunt',value:1e-6}],['scope','step']]);
  s=(await snapshot(page)).station;expect(s.reading.latchOk).toBe(true);expect(s.reading.snr).toBeGreaterThanOrEqual(12);expect(s.scope).toBe('step');
  await steps(page,[['log']]);
  // 3 · 100 MHz: λ = c/f = 3 m, so the 75 cm quarter-wave whip. A gust has knocked the whip flat, and the beacon is vertical.
  s=(await snapshot(page)).station;expect(s.vertical).toBe(false);expect(s.reading.antenna).toBeLessThan(.3);
  await steps(page,[['scope','signal'],['rod','r75']]);expect((await snapshot(page)).station.reading.antenna).toBeLessThan(.3);
  await steps(page,[['orient'],['log']]);
  await wait(page,.1);s=await snapshot(page);
  expect(s.station.logged.map((l:{tier:number})=>l.tier)).toEqual([3,3,3]);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('signal observatory: a failed decode and a dropped latch are explained, and swapping the part recovers',async({page})=>{
  const errors=await open(page,'observatory');await wait(page,.1);await toBench(page);
  // Logging the plain cable with the motor still by the receiver fails, with the reason.
  await steps(page,[['log']]);
  let s=(await snapshot(page)).station;expect(s.mistakes).toBe(1);expect(s.job).toBe(0);
  await expect(page.locator('.station-toast')).toContainText('Signal/noise');
  // A slot needs a module first.
  expect((await act(page,'slot','series')).ok).toBe(false);
  // An LC low-pass decodes reliably, but cheaper parts can do it once the cart is moved.
  await steps(page,[['pick','L'],['slot','series'],['value',{slot:'series',value:.01}],['pick','C'],['slot','shunt'],['value',{slot:'shunt',value:1e-6}],['route'],['log']]);
  s=(await snapshot(page)).station;expect(s.logged[0].tier).toBe(2);
  await expect(page.locator('.station-toast')).toContainText('Cheaper parts');
  // Job 2: an RC low-pass (a resistor can in series) starves the latch.
  await steps(page,[['pick','R'],['slot','series'],['log']]);
  s=(await snapshot(page)).station;expect(s.mistakes).toBe(2);expect(s.job).toBe(1);expect(s.series).toEqual({kind:'R',value:470});
  await expect(page.locator('.station-toast')).toContainText('latch dropped out');
  // A coil back in series (turned up to 10 mH) fixes it.
  await steps(page,[['pick','L'],['slot','series'],['value',{slot:'series',value:.01}],['log']]);
  s=(await snapshot(page)).station;expect(s.job).toBe(2);expect(s.logged[1].tier).toBe(3);
  // Stepping back from the bench returns the keys to walking.
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
  expect(errors).toEqual([]);
});
