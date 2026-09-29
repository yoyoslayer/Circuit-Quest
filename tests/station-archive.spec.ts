import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot,route} from './navigation';

test.describe.configure({timeout:150000});
// Presses the same buttons a player clicks at the desk (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
const cite=(slot:string,clue:string):[string,unknown]=>['cite',{slot,clue}];
// The careful reader's work orders: guaranteed or recommended values for the cheapest adequate part.
const ORDERS:Record<string,[string,unknown?][]>={
  led:[['open','bw-rc'],cite('mpn','bw-rc/RC0603F472-mpn'),cite('r','bw-rc/RC0603F472-r'),cite('tol','bw-rc/RC0603F472-tol'),cite('pkg','bw-rc/RC0603F472-pkg'),['request']],
  fan:[['open','hg-hdm'],cite('mpn','hg-hdm/HDM7-S8-mpn'),cite('vsup','hg-hdm/rec-vm7'),cite('iout','hg-hdm/ocp7-min'),['request']],
  freezer:[['open','qs-qx8'],cite('mpn','qs-qx8/QX8-S8I-mpn'),cite('vsup','qs-qx8/rec-vdd'),cite('temp','qs-qx8/rec-temp-i'),cite('pkg','qs-qx8/QX8-S8I-pkg'),['request']],
};
// Stock counters: rows A, B, C; Pip picks up from the aisle in front of each row.
const ROW_Z:Record<string,number>={A:-6.2,B:-3.2,C:-.2},binX=(bin:string)=>4.9+(Number(bin[1])-1)*.9;
async function toDesk(page:Page){await walk(page,-2,-4.35,.35);await page.keyboard.press('KeyE');expect((await wait(page,.1)).atBench).toBe(true);}
async function start(page:Page){
  await walk(page,-8.75,4.05,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('orders');
  await walk(page,-2,-4.2,.5);await page.keyboard.press('KeyE');await wait(page,.2);expect((await snapshot(page)).station.trayReady).toBe(true);
  await toDesk(page);
}
/** Stand up, fetch the box from its bin, carry it to the rig and set it in; returns after the test. */
async function install(page:Page,mpn:string,bin:string){
  await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(false);
  const z=ROW_Z[bin[0]]+.72,x=binX(bin);
  await route(page,[[3.8,z],[x,z]],.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe(`part:${mpn}`);
  await route(page,[[3.8,z],[-4,-3.3],[-7.4,-3.2]],.4);await page.keyboard.press('KeyE');
  let s=await snapshot(page);expect(s.station.rig?.mpn).toBe(mpn);
  s=await wait(page,4.4);expect(s.station.rig).toBeNull();return s;
}

test('archive: three work orders, each cited from guaranteed values and filled with the cheapest adequate part',async({page})=>{
  const errors=await open(page,'archive');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Bring the work-order tray');
  await start(page);
  await expect(page.locator('.archive-screen')).toBeVisible();
  await expect(page.locator('.archive-order')).toContainText('Status-LED resistor');
  // Order 1 through the real terminal: search, open the datasheet, bookmark a value, cite it by click.
  await page.locator('.as-search input').fill('Brambleworth');
  await expect(page.locator('.as-hit')).toHaveCount(2);
  await page.locator('.as-hit',{hasText:'RC series'}).click();
  await expect(page.locator('.as-doc h3')).toHaveText('RC series');
  await page.locator('.as-doc [data-clue="bw-rc/RC0603F472-mpn"]').click();
  await page.locator('.as-chips [data-chip="bw-rc/RC0603F472-mpn"]').click();
  await page.locator('.archive-order [data-slot="mpn"]').click();
  expect((await snapshot(page)).station.cites.mpn).toBe('bw-rc/RC0603F472-mpn');
  // Dragging a value straight from the datasheet onto a slot also cites it.
  await page.locator('.as-doc [data-clue="bw-rc/RC0603F472-r"]').dragTo(page.locator('.archive-order [data-slot="r"]'));
  expect((await snapshot(page)).station.cites.r).toBe('bw-rc/RC0603F472-r');
  await steps(page,ORDERS.led.slice(3));
  expect((await snapshot(page)).station.requested).toBe('RC0603F472');
  let s=await install(page,'RC0603F472','A1');expect(s.station.served[0]).toMatchObject({mpn:'RC0603F472',tier:3});
  for(const [id,mpn,bin] of [['fan','HDM7-S8','B3'],['freezer','QX8-S8I','C2']] as const){
    await toDesk(page);await steps(page,ORDERS[id]);s=await install(page,mpn,bin);}
  await wait(page,.1);s=await snapshot(page);
  expect(s.station.served.map((v:{tier:number})=>v.tier)).toEqual([3,3,3]);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('archive: the commercial-grade controller fails in the freezer; back to the datasheet, swap to the I grade',async({page})=>{
  const errors=await open(page,'archive');await wait(page,.1);await start(page);
  await steps(page,ORDERS.led);await install(page,'RC0603F472','A1');
  // A typical value goes in with a warning; the part still works, but the order is only "works".
  await toDesk(page);
  await steps(page,[['open','om-omd40'],cite('iout','om-omd40/ocp-typ')]);
  await expect(page.locator('.station-toast')).toContainText('not promised');
  await steps(page,ORDERS.fan.slice(0,3));await steps(page,[['request']]);
  let s=await install(page,'HDM7-S8','B3');expect(s.station.served[1]).toMatchObject({mpn:'HDM7-S8',tier:1});
  // The twist: QX8 looks right from the front page, but the C suffix is rated 0 to 70 °C.
  await toDesk(page);
  await steps(page,[['open','qs-qx8'],cite('mpn','qs-qx8/QX8-S8C-mpn'),cite('temp','qs-qx8/abs-temp'),['request']]);
  s=await install(page,'QX8-S8C','C1');
  expect(s.station.mistakes).toBe(1);expect(s.station.caseIdx).toBe(2);expect(s.station.served).toHaveLength(2);
  await expect(page.locator('.station-toast')).toContainText('ordering suffix');
  // The failed box went back to its bin, and a box nobody asked for is turned away without a mistake.
  const back=s.station.boxes.find((b:{mpn:string})=>b.mpn==='QX8-S8C');expect(back.visible).toBe(true);expect(Math.abs(back.pos.z-(-.2))).toBeLessThan(.3);
  await toDesk(page);await steps(page,[['uncite','temp'],...ORDERS.freezer.slice(1)]);
  s=await install(page,'QX8-S8I','C2');
  expect(s.station.served[2]).toMatchObject({mpn:'QX8-S8I',tier:2});expect(s.station.mistakes).toBe(1);
  expect(s.won).toBe(true);
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('archive: the rig refuses a box that is not on the work order',async({page})=>{
  await open(page,'archive');await wait(page,.1);await start(page);
  await steps(page,ORDERS.led);await page.keyboard.press('KeyE');
  await route(page,[[3.8,-5.48],[5.8,-5.48]],.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('part:RC0603J472');
  await route(page,[[3.8,-5.48],[-4,-3.3],[-7.4,-3.2]],.4);await page.keyboard.press('KeyE');
  const s=await snapshot(page);expect(s.station.rig).toBeNull();expect(s.station.mistakes).toBe(0);
  await expect(page.locator('.station-toast')).toContainText('RC0603F472');
});
