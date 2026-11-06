import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot,route} from './navigation';
import {plugBench} from './station-lead';
import {watchMonitorText,monitorText} from './monitor-text';

// Long walks across the hall: the machine may be busy with other builds.
test.describe.configure({timeout:300000});
// Presses the same buttons a player clicks at the dispatch desk (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
const E=async(page:Page)=>{await page.keyboard.press('KeyE');await wait(page,.2);};
const station=async(page:Page)=>(await snapshot(page)).station;
// Walking routes around the desk and through the doorways (plan coordinates, metres).
const DESK_FRONT:[number,number][]=[[-6.3,3.6]];
/** From the storeroom: plug the desk's mains lead in at the left wall (R5-079), then on to the desk. */
const FROM_STORE:[number,number][]=[[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2]];
async function plugFromStore(page:Page){await plugBench(page,FROM_STORE,[[-8.6,1.5],[-6.4,1.45]]);}
async function toDesk(page:Page,via:[number,number][]){await route(page,via);await walk(page,-3.5,3.55,.4);await E(page);expect((await snapshot(page)).atBench).toBe(true);}
const pill=(page:Page)=>page.locator('.prompt-pill');
async function podToStore(page:Page){
  await walk(page,-6.4,6.4,.6);await E(page);expect((await snapshot(page)).held).toBe('pod');
  await route(page,[[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await E(page);
  expect((await station(page)).podPad).toBe('store');
  // The pod is placed: the pill doesn't offer to pick it straight back up.
  await wait(page,.1);expect(await pill(page).textContent()??'').not.toContain('Pick up');
}
/** After a delivery the desk holds on it for a beat before the next job comes up. */
const landed=(page:Page)=>wait(page,1.8);

test('spectrum delivery: radio through brick, near IR through the hatch by mirror, thermal IR past smoke and mesh',async({page})=>{
  await watchMonitorText(page);const errors=await open(page,'spectrum');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Carry the receiver pod');
  // 1 · Brick: light stops at the wall; the 3 m radio wave passes it.
  await podToStore(page);await plugFromStore(page);
  await toDesk(page,DESK_FRONT);
  await expect(page.locator('.station-panel')).toContainText('Through the brick wall');
  let s=await station(page);expect(s.band).toBe('vis');expect(s.reading.blocked).toBe('brick');
  // Light stops at the brick: the pill points at the band keys.
  await wait(page,.1);await expect(pill(page)).toContainText('Another band');
  // The pod fits the matching detector head by itself.
  await steps(page,[['band','radio']]);
  s=await station(page);expect(s.detector).toBe('dipole');expect(s.reading.margin).toBeGreaterThanOrEqual(10);
  // Commit, then reveal: the LINK monitor owns path and measured margin, not the HTML panel.
  await wait(page,.1);expect(s.revealed).toBe(false);await expect(page.locator('.station-panel .build')).not.toContainText(/\d dB/);expect(s.reading.blocked).toBeNull();expect(s.reading.missed).toBe(false);expect(await monitorText(page,'LINK')).toContain('PATH REACHES THE POD');
  await steps(page,[['send']]);
  // The delivery holds on screen for a beat (the job doesn't flip within a frame), then the next comes up.
  await wait(page,.3);s=await station(page);expect(s.job).toBe(0);expect(s.holding).toBe(true);expect(s.revealed).toBe(true);
  expect(s.reading.margin).toBeGreaterThanOrEqual(10);expect(await monitorText(page,'LINK')).toMatch(/\d[.]\d dB/);await expect(page.locator('.station-panel .build')).not.toContainText('dB');
  await landed(page);s=await station(page);expect(s.job).toBe(1);expect(s.holding).toBe(false);
  // 2 · The lab: the pod goes in through the lab door, a mirror stands on mark A, the hatch opens.
  await E(page);
  await route(page,[...DESK_FRONT,[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await walk(page,-9.3,-5.4,.5);await E(page);expect((await snapshot(page)).held).toBe('pod');
  await route(page,[[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-4.6],[8.4,-5.6]]);await E(page);
  expect((await station(page)).podPad).toBe('lab');
  await route(page,[[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await walk(page,-.9,-4.55,.3);await E(page);expect((await snapshot(page)).held).toBe('mirror2');
  await route(page,[[-.9,-1.6],[2.6,-.2]]);await E(page);
  expect((await station(page)).mirrors).toEqual(['A']);
  await toDesk(page,[[1.5,1.2],[.6,4.2]]);
  await expect(page.locator('.station-panel')).toContainText('Into the shuttered lab');
  // The tower points at the lab pad: straight into the metal shutter.
  await steps(page,[['band','nir']]);
  s=await station(page);expect(s.reading.blocked).toBe('metal');
  // A real click on the mirror on the map points the tower at it (it doesn't turn the board). The
  // board still faces the tower, so the beam comes straight back: a miss.
  const before=(await station(page)).aim.mirrors.A;
  await page.mouse.click(...((await station(page)).map.A as [number,number]));await wait(page,.1);
  s=await station(page);expect(s.reading.spots).toEqual(['A']);expect(s.reading.missed).toBe(true);expect(s.aim.mirrors.A).toBeCloseTo(before,6);
  expect(await monitorText(page,'LINK')).toContain('MISSES THE POD');await expect(page.locator('.station-panel .build')).not.toContainText('Path');
  // Now the beam reaches the mirror, a drag from it toward the lab pad turns the board: the beam lands on the shut hatch.
  const m=(await station(page)).map as Record<string,[number,number]>;
  await page.mouse.move(...m.A);await page.mouse.down();for(let k=1;k<=6;k++)await page.mouse.move(m.A[0]+(m.lab[0]-m.A[0])*k/6,m.A[1]+(m.lab[1]-m.A[1])*k/6);await page.mouse.up();await wait(page,.1);
  s=await station(page);
  // (If the drag landed a little off, the same turn by the desk's action finishes the aim.)
  if(s.reading.blocked!=='metal')await steps(page,[['aim',{what:'A',to:'lab'}]]);
  s=await station(page);expect(s.reading.blocked).toBe('metal');
  await page.mouse.move(5,5);await wait(page,.1);await expect(pill(page)).toContainText('Lab hatch');
  await steps(page,[['hatch']]);
  s=await station(page);expect(s.reading.blocked).toBeNull();expect(s.reading.missed).toBe(false);expect(s.reading.spots).toEqual(['A']);expect(s.reading.margin).toBeGreaterThanOrEqual(10);
  await steps(page,[['send']]);await landed(page);
  // 3 · The quiet room: mesh stops radio and microwave, smoke eats visible light; thermal IR gets through both.
  await E(page);
  await route(page,[[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.4]]);await walk(page,8.1,-5.35,.3);await E(page);expect((await snapshot(page)).held).toBe('pod');
  await route(page,[[10.2,-4.4],[10.2,-1.4],[10.2,1],[10.2,2.8],[9.4,3.9]]);await E(page);
  expect((await station(page)).podPad).toBe('quiet');
  await toDesk(page,[[10.2,2.8],[10.2,.6],[4.5,-.6],[-.2,4.2]]);
  await steps(page,[['band','micro'],['power',100]]);
  s=await station(page);expect(s.reading.blocked).toBe('mesh');
  // The tower re-aimed at the new pad; thermal IR crosses the smoke and the mesh.
  await steps(page,[['band','thermal'],['power',1],['send']]);
  await wait(page,.2);s=await snapshot(page);
  expect(s.station.delivered.map((d:{tier:number})=>d.tier)).toEqual([3,3,3]);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);expect(s.damage).toBe(0);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  // Two of three: the tidy run skips the room's chaos bonus (earned in station-cable.spec).
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('spectrum delivery: sends that fail are explained, and a better choice recovers',async({page})=>{
  const errors=await open(page,'spectrum');await wait(page,.1);
  // At the desk before the pod is out: SEND does nothing and says why (not a mistake).
  await toDesk(page,DESK_FRONT);
  expect((await act(page,'send')).ok).toBe(false);
  await expect(page.locator('.station-toast')).toContainText('pod');expect((await station(page)).mistakes).toBe(0);
  await E(page);await route(page,[[-6.3,4.6]]);await podToStore(page);
  // The pod is out, but the desk is dead until its lead is plugged in: SEND refuses, no mistake.
  await toDesk(page,[[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],...DESK_FRONT]);
  expect((await act(page,'send')).ok).toBe(false);await expect(page.locator('.station-toast')).toContainText('No power');expect((await station(page)).mistakes).toBe(0);
  await E(page);await route(page,[[-6.3,3.6]]);await plugBench(page,[[-6.4,1.2]],[[-8.6,1.5],[-6.4,1.45]]);
  await toDesk(page,DESK_FRONT);
  // Visible light at the brick wall: a failed send with the reason.
  await steps(page,[['power',100],['send']]);
  let s=await station(page);expect(s.mistakes).toBe(1);expect(s.job).toBe(0);
  await expect(page.locator('.station-toast')).toContainText('Brick');
  await expect(page.locator('.station-toast')).not.toContainText('Radio');
  // The send filled in what visible light does at brick on the wall chart, and showed its numbers.
  expect(s.revealed).toBe(true);
  // Cycling the bands without sending shows no numbers: brute force reads nothing off the meter.
  for(const b of ['micro','thermal','nir','radio'])await steps(page,[['band',b]]);
  await wait(page,.1);s=await station(page);expect(s.revealed).toBe(false);expect(s.spent).toBe(4);expect(s.mistakes).toBe(1);
  await expect(page.locator('.station-panel .build')).not.toContainText(/\d dB/);
  // Radio gets through; 100 mW is reliable but more than needed (not elegant), and the note says so without naming the answer.
  await steps(page,[['send']]);
  s=await station(page);expect(s.delivered[0].tier).toBe(2);await landed(page);s=await station(page);expect(s.job).toBe(1);
  await expect(page.locator('.station-toast')).toContainText('more power');
  // Stepping back from the desk returns the keys to walking.
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
  expect(errors).toEqual([]);
});
