import {test,expect} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';
import {CELLS} from '../src/stations/vias/workflow';
test.setTimeout(120000);
test('the press needs a lever stroke, the drill needs a feed hold, and neither operates from inspection',async({page})=>{
  const errors=await open(page,'vias');
  await walk(page,0,-.85,.25);await page.keyboard.press('KeyE');
  const act=(n:string,a?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[n,a] as const);
  expect((await act('layer',1)).ok).toBe(true);expect((await act('layer',4)).ok).toBe(true);
  expect((await act('press')).ok).toBe(false);expect((await snapshot(page)).station.build.pressed).toBe(false);
  await page.keyboard.press('Escape');await walk(page,CELLS.press.at.x,CELLS.press.at.z,.2);await page.keyboard.press('KeyE');await wait(page,.1);
  let xy=(await snapshot(page)).station.tools.press;
  await page.mouse.move(...xy);await page.mouse.down();await page.mouse.up();
  expect((await snapshot(page)).station.build.pressed).toBe(false);
  xy=(await snapshot(page)).station.tools.press;
  await page.mouse.move(...xy);await page.mouse.down();await page.mouse.move(xy[0],xy[1]+100,{steps:10});await page.mouse.up();
  expect((await snapshot(page)).station.build.pressed).toBe(true);
  await page.keyboard.press('Escape');await walk(page,CELLS.drill.at.x,CELLS.drill.at.z,.2);await page.keyboard.press('KeyE');await wait(page,.1);
  xy=(await snapshot(page)).station.tools.drill;
  await page.mouse.move(...xy);await page.mouse.down();await wait(page,.2);await page.mouse.up();
  expect((await snapshot(page)).station.build.drill).toBeUndefined();
  await page.mouse.move(...xy);await page.mouse.down();await wait(page,.8);await page.mouse.up();
  expect((await snapshot(page)).station.build.drill).toBe('mech-0.30');expect(errors).toEqual([]);
});
test('holding the mop alone does not clean; scrubbing uses a grounded tool and a work pose',async({page})=>{
  const errors=await open(page,'lunch');await walk(page,2,8,.4);await page.keyboard.press('KeyE');
  await expect(page.getByRole('button',{name:'Scrub spill'})).toBeVisible();
  await walk(page,.3,2,.4);await wait(page,.6);
  expect((await snapshot(page)).lunch.water).toBe(1);
  await wait(page,.8,['Space']);const s=await snapshot(page);expect(s.lunch.water).toBeLessThan(.8);
  expect(s.items.find((p:any)=>p.id==='mop').pos.y).toBeLessThan(.85);expect(s.pose.grounded).toBe(true);
  expect(errors).toEqual([]);
});
test.describe('phone workshop',()=>{
  test.use({viewport:{width:390,height:844},hasTouch:true});
  test('a touch player can run the press and open the manufacturing explanation',async({page})=>{
    const errors=await open(page,'vias');await walk(page,CELLS.press.at.x,CELLS.press.at.z,.25);await page.keyboard.press('KeyE');
    await page.getByRole('button',{name:'Run press cycle'}).tap();
    expect((await snapshot(page)).station.build.pressed).toBe(true);
    await page.getByText('Why these choices?',{exact:true}).tap();
    await expect(page.locator('.via-panel')).toContainText('Lamination seals the stack');expect(errors).toEqual([]);
  });
});
