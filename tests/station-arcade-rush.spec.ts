import {test,expect,type Page} from '@playwright/test';
import {open,walk,route,wait,snapshot} from './navigation';

test.describe.configure({timeout:300000});
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
const station=async(page:Page)=>(await snapshot(page)).station;

test('arcade rush: generated cabinets, a shorter soak, a running count, and the clock ends the shift',async({page})=>{
  const errors=await open(page,'arcade-rush');await wait(page,.1);
  await route(page,[[-5.5,6.6],[-7.2,5.8]]);await walk(page,-7.9,4.4,.5);await page.keyboard.press('KeyE');
  await route(page,[[-7.2,5.8],[-5.5,6.4]]);await walk(page,1.2,-1.3,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  await walk(page,0,-1.55,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
  await expect(page.locator('.station-panel')).toContainText('RUSH');
  for(let k=0;k<2;k++){
    const s=await station(page);expect(s.rush).toBe(true);expect(s.fix).not.toBeNull();
    const clear:[string,unknown?][]=[];if(s.setup.parallel)clear.push(['slot','parallel']);if(s.setup.series)clear.push(['slot','series']);if(s.setup.reversed)clear.push(['flip']);
    await steps(page,[...clear,['rating',s.fix.rating],['pick',s.fix.r],['slot','series'],['power']]);await wait(page,4.4);
    await steps(page,[['signoff']]);
    const after=await station(page);expect(after.served.length).toBe(k+1);expect(after.served[k].tier).toBeGreaterThanOrEqual(2);
  }
  // The shift ends on the clock, not on a cabinet count.
  await page.keyboard.press('Escape');for(let i=0;i<20&&!(await snapshot(page)).won;i++)await wait(page,10);
  expect((await snapshot(page)).won).toBe(true);
  await expect(page.locator('.result-served')).toContainText('2');
  expect(errors).toEqual([]);
});
