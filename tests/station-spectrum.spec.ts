import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot,route} from './navigation';

// Long walks across the hall: the machine may be busy with other builds.
test.describe.configure({timeout:300000});
// Presses the same buttons a player clicks at the dispatch desk (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
const E=async(page:Page)=>{await page.keyboard.press('KeyE');await wait(page,.2);};
const station=async(page:Page)=>(await snapshot(page)).station;
// Walking routes around the desk and through the doorways (plan coordinates, metres).
const DESK_FRONT:[number,number][]=[[-6.3,3.6]];
async function toDesk(page:Page,via:[number,number][]){await route(page,via);await walk(page,-3.5,3.55,.4);await E(page);expect((await snapshot(page)).atBench).toBe(true);}
async function podToStore(page:Page){
  await walk(page,-6.4,6.4,.6);await E(page);expect((await snapshot(page)).held).toBe('pod');
  await route(page,[[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await E(page);
  expect((await station(page)).podPad).toBe('store');
}

test('spectrum delivery: radio through brick, near IR through the hatch by mirror, thermal IR past smoke and mesh',async({page})=>{
  const errors=await open(page,'spectrum');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Carry the receiver pod');
  // 1 · Brick: light stops at the wall; the 3 m radio wave passes it.
  await podToStore(page);
  await toDesk(page,[[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],...DESK_FRONT]);
  await expect(page.locator('.station-panel')).toContainText('Through the brick wall');
  let s=await station(page);expect(s.band).toBe('vis');expect(s.reading.blocked).toBe('brick');
  await steps(page,[['band','radio'],['detector','dipole']]);
  s=await station(page);expect(s.reading.margin).toBeGreaterThanOrEqual(10);
  await steps(page,[['send']]);
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
  // With the hatch shut the metal shutter stops the beam; radio can't use the hatch at all.
  await steps(page,[['band','nir'],['detector','nirdiode']]);
  s=await station(page);expect(s.reading.blocked).toBe('metal');
  await steps(page,[['hatch']]);
  s=await station(page);expect(s.reading.blocked).toBeNull();expect(s.reading.spots).toEqual(['A']);expect(s.reading.margin).toBeGreaterThanOrEqual(10);
  await steps(page,[['send']]);
  // 3 · The quiet room: mesh stops radio and microwave, smoke eats visible light; thermal IR gets through both.
  await E(page);
  await route(page,[[-.2,4.2],[.4,.2],[1,-1.8],[9,-1.8],[10.2,-2.6],[10.2,-4.4]]);await walk(page,8.1,-5.35,.3);await E(page);expect((await snapshot(page)).held).toBe('pod');
  await route(page,[[10.2,-4.4],[10.2,-1.4],[10.2,1],[10.2,2.8],[9.4,3.9]]);await E(page);
  expect((await station(page)).podPad).toBe('quiet');
  await toDesk(page,[[10.2,2.8],[10.2,.6],[4.5,-.6],[-.2,4.2]]);
  await steps(page,[['band','micro'],['detector','patch'],['power',100]]);
  s=await station(page);expect(s.reading.blocked).toBe('mesh');
  await steps(page,[['band','thermal'],['detector','thermopile'],['power',1],['send']]);
  await wait(page,.2);s=await snapshot(page);
  expect(s.station.delivered.map((d:{tier:number})=>d.tier)).toEqual([3,3,3]);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);expect(s.damage).toBe(0);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('spectrum delivery: sends that fail are explained, and fixing the band and detector recovers',async({page})=>{
  const errors=await open(page,'spectrum');await wait(page,.1);
  // At the desk before the pod is out: SEND does nothing and says why (not a mistake).
  await toDesk(page,DESK_FRONT);
  expect((await act(page,'send')).ok).toBe(false);
  await expect(page.locator('.station-toast')).toContainText('pod');expect((await station(page)).mistakes).toBe(0);
  await E(page);await route(page,[[-6.3,4.6]]);await podToStore(page);
  await toDesk(page,[[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],...DESK_FRONT]);
  // Visible light at the brick wall: a failed send with the reason.
  await steps(page,[['power',100],['send']]);
  let s=await station(page);expect(s.mistakes).toBe(1);expect(s.job).toBe(0);
  await expect(page.locator('.station-toast')).toContainText('Brick');
  // The right band with the wrong head: the photodiode can't hear radio.
  await steps(page,[['band','radio'],['send']]);
  s=await station(page);expect(s.mistakes).toBe(2);
  await expect(page.locator('.station-toast')).toContainText('only responds');
  // Fitting the dipole fixes it; 100 mW is reliable but more than needed (not elegant).
  await steps(page,[['detector','dipole'],['send']]);
  s=await station(page);expect(s.job).toBe(1);expect(s.delivered[0].tier).toBe(2);
  await expect(page.locator('.station-toast')).toContainText('Leaner');
  // Stepping back from the desk returns the keys to walking.
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
  expect(errors).toEqual([]);
});
