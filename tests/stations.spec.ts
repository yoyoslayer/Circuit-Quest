import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';
import {CELLS,cellFor} from '../src/stations/vias/workflow';
// Whole-shift playthroughs press dozens of buttons under software rendering.
test.describe.configure({timeout:300000});

// Presses the same buttons a player clicks at the bench (drive.act).
const act=async(page:Page,name:string,arg?:unknown)=>{
  const s=await snapshot(page),cell=cellFor(name);
  if(s.station.cell!==cell||!s.atBench){
    if(s.atBench)await page.keyboard.press('Escape');
    if(cell==='verify'||s.station.cell==='verify')await walk(page,0,1.5,.3);
    await walk(page,CELLS[cell].at.x,CELLS[cell].at.z,.3);
    await page.keyboard.press('KeyE');expect((await snapshot(page)).station.cell).toBe(cell);
  }
  return page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
};
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${a??''}`).toBe(true);}
async function toCounter(page:Page){
  await walk(page,CELLS.inspect.at.x,CELLS.inspect.at.z,.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
}

test('via counter: a full shift of five orders, each built the lean reliable way',async({page})=>{
  const errors=await open(page,'vias');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Inspect the customer');
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

import {cheapest,kindOf,type Order} from '../src/stations/vias/logic';
/** Builds an order the way the solver's cheapest reliable build says, pressing real buttons. */
function recipe(o:Order):[string,unknown?][]{
  const b=cheapest(o)!.build,out:[string,unknown?][]=[['layer',o.from],['layer',o.to],['bit',b.drill]];
  if(kindOf(o.from,o.to)==='buried')out.push(['drill'],['plate'],['press']);else out.push(['press'],['drill'],['plate']);
  out.push(['pad',b.pad]);if(b.finish&&b.finish!=='open')out.push(['finish',b.finish]);for(let k=1;k<b.count;k++)out.push(['count',1]);out.push(['serve']);return out;
}
test('via rush: a timed queue of generated orders; impatient customers leave; the whistle ends the shift',async({page})=>{
  const errors=await open(page,'vias-rush');await wait(page,.1);await toCounter(page);
  for(let i=0;i<4;i++){const o=(await snapshot(page)).station.current as Order;await steps(page,recipe(o));}
  let s=await snapshot(page);expect(s.station.served.length).toBe(4);expect(s.station.served.every((v:{tier:number})=>v.tier===3)).toBe(true);
  // Let the next customer run out of patience, then run the clock out.
  await wait(page,52);s=await snapshot(page);expect(s.station.misses).toBeGreaterThan(0);
  await wait(page,180);s=await snapshot(page);expect(s.won).toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  expect(errors).toEqual([]);
});
