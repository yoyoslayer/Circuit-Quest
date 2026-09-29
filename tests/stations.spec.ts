import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';

// Presses the same buttons a player clicks at the bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${a??''}`).toBe(true);}
async function toCounter(page:Page){
  await walk(page,-7,4,.6);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('blanks');
  await walk(page,1.2,-1.4,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  expect((await snapshot(page)).station.blanksReady).toBe(true);
  await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
}

test('via counter: a full shift of five orders, each built the lean reliable way',async({page})=>{
  const errors=await open(page,'vias');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Bring the crate of board blanks');
  await toCounter(page);
  await expect(page.locator('.station-panel')).toContainText('L1→L4 through via');
  // 1 · through via: press, drill the whole stack, plate, a pad with a comfortable ring.
  await steps(page,[['layer',1],['layer',4],['press'],['bit','mech-0.30'],['drill'],['plate'],['pad',.6],['test'],['serve']]);
  // 2 · buried via: drill and plate the core before the press; tented because it sits under a heatsink.
  await steps(page,[['layer',2],['layer',3],['bit','mech-0.30'],['drill'],['plate'],['press'],['pad',.6],['finish','tented'],['serve']]);
  // 3 · microvia: laser into the pressed board, fine-pitch 0.30 mm pad.
  await steps(page,[['layer',1],['layer',2],['press'],['bit','laser-0.10'],['drill'],['plate'],['pad',.3],['serve']]);
  // 4 · via in a QFN thermal pad: filled and capped.
  await steps(page,[['layer',1],['layer',4],['press'],['bit','mech-0.30'],['drill'],['plate'],['pad',.6],['finish','filled-capped'],['serve']]);
  // 5 · a row of six stitching vias under a shield.
  await steps(page,[['layer',1],['layer',4],['press'],['bit','mech-0.30'],['drill'],['plate'],['pad',.6],['finish','tented'],['count',1],['count',1],['count',1],['count',1],['count',1],['serve']]);
  await wait(page,.1);const s=await snapshot(page);
  expect(s.station.served.map((v:{tier:number})=>v.tier)).toEqual([3,3,3,3,3]);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('via counter: a buried via drilled after pressing is sent back, and scrapping starts over',async({page})=>{
  await open(page,'vias');await wait(page,.1);await toCounter(page);
  await steps(page,[['layer',1],['layer',4],['press'],['drill'],['plate'],['pad',.6],['serve']]);
  await steps(page,[['layer',2],['layer',3],['press'],['drill'],['plate'],['pad',.6],['finish','tented'],['serve']]);
  let s=await snapshot(page);expect(s.station.mistakes).toBe(1);expect(s.station.order).toBe(1);
  await expect(page.locator('.station-toast')).toContainText('before lamination');
  await steps(page,[['scrap'],['layer',2],['layer',3],['drill'],['plate'],['press'],['pad',.6],['finish','tented'],['serve']]);
  s=await snapshot(page);expect(s.station.order).toBe(2);expect(s.station.served[1].tier).toBe(3);
  // Stepping back from the bench returns the keys to walking.
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
});
