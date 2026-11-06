import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';
import {plugBench} from './station-lead';
import {watchMonitorText,monitorText} from './monitor-text';

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
/** Plugs the bench's mains lead in at the back wall (R5-079), then sits at the bench. */
async function toBench(page:Page){await plugBench(page,[[-.5,-.9]],[[2.95,-3.8],[2.95,-1.5]]);await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);}

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
  // 2 · the last engineer left a 470 Ω resistor in series: the latch starves and the dome shutter is shut.
  await expect(page.locator('.station-panel')).toContainText('Keep the shutter latch powered');
  s=(await snapshot(page)).station;expect(s.series).toEqual({kind:'R',value:470});expect(s.reading.latchOk).toBe(false);expect(s.shutter).toBe(false);
  await expect(page.locator('.prompt-pill')).not.toContainText('Turn the knob');
  // The whine needs a steeper filter that keeps the DC path: a series coil. 1 mH with the 1.5 µF is too gentle (no ring, little cut at 4 kHz).
  await steps(page,[['pick','L'],['slot','series']]);
  s=(await snapshot(page)).station;expect(s.reading.snr).toBeLessThan(6);expect(s.reading.latchOk).toBe(true);expect(s.shutter).toBe(true);
  await steps(page,[['value',{slot:'series',value:.01}],['value',{slot:'shunt',value:1e-6}],['scope','step']]);
  s=(await snapshot(page)).station;expect(s.reading.latchOk).toBe(true);expect(s.reading.snr).toBeGreaterThanOrEqual(12);expect(s.scope).toBe('step');
  await steps(page,[['log']]);
  // 3 · 100 MHz: λ = c/f = 3 m, so the 75 cm quarter-wave whip. A gust has knocked the long whip flat, and the beacon is vertical.
  s=(await snapshot(page)).station;expect(s.vertical).toBe(false);expect(s.reading.antenna).toBeLessThan(.3);expect(s.scope).toBe('signal');expect(s.reading.snr).toBeGreaterThanOrEqual(-40);
  await expect(page.locator('.prompt-pill')).toContainText('whip');
  await steps(page,[['scope','signal'],['rod','r75']]);expect((await snapshot(page)).station.reading.antenna).toBeLessThan(.3);
  await expect(page.locator('.prompt-pill')).toContainText('Stand the whip up');
  await steps(page,[['orient'],['log']]);
  await wait(page,.1);s=await snapshot(page);
  expect(s.station.logged.map((l:{tier:number})=>l.tier)).toEqual([3,3,3]);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  // Two of three: the tidy run skips the room's chaos bonus (earned in station-cable.spec).
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(2);
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

test('signal observatory: the readout agrees with LOG, a thin decode is a near miss, and one capacitor does not finish job 2',async({page})=>{
  await watchMonitorText(page);const errors=await open(page,'observatory');await wait(page,.1);
  await moveCart(page);await toBench(page);
  // A huge shunt capacitor kills the noise and the message with it: the decoder line garbles and the scope loses its reliable decode.
  await steps(page,[['pick','C'],['slot','shunt'],['value',{slot:'shunt',value:6.8e-5}],['route']]);
  let s=(await snapshot(page)).station;expect(s.reading.level).toBeLessThan(.5);expect(s.decodedText).not.toBe('CQ CQ DE PIP');
  // A clean ratio can still be too quiet to decode: the level check above is essential.
  expect(await monitorText(page,'filter')).toMatch(/S\/N|no signal/);await expect(page.locator('.station-panel .build')).not.toContainText('Signal/noise');
  // 680 nF decodes, but without margin: a near miss, not a mistake, and the job stays open.
  await steps(page,[['value',{slot:'shunt',value:6.8e-7}],['log']]);
  s=(await snapshot(page)).station;expect(s.job).toBe(0);expect(s.mistakes).toBe(0);expect(s.nearMisses).toBe(1);
  await expect(page.locator('.station-toast')).toContainText('no margin');
  await steps(page,[['value',{slot:'shunt',value:1.5e-6}],['log']]);
  s=(await snapshot(page)).station;expect(s.job).toBe(1);expect(s.logged[0].tier).toBe(3);
  // Job 2: take out the old resistor (the shutter opens again) and try one capacitor alone: it can't finish the job.
  await steps(page,[['slot','series']]);s=(await snapshot(page)).station;expect(s.series).toBe(null);expect(s.shutter).toBe(true);
  await steps(page,[['value',{slot:'shunt',value:3.3e-6}],['log']]);
  s=(await snapshot(page)).station;expect(s.job).toBe(1);
  expect(errors).toEqual([]);
});
