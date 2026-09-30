import {test,expect} from '@playwright/test';
import {open,walk,route,snapshot,wait} from './navigation';
const load=(s:any,id:string)=>s.lunch.loads.find((l:any)=>l.id===id);
const expectLoad=async(page:import('@playwright/test').Page,id:string,state:string)=>{const s=await snapshot(page);expect(load(s,id).state,JSON.stringify({player:s.player,held:s.held,lunch:{...s.lunch,events:undefined}})).toBe(state);};
test('intended Lunch Rush solution delivers the tray upstairs',async({page})=>{
  test.setTimeout(120000);const errors=await open(page,'lunch');
  // Wedge the door and mop the puddle.
  await walk(page,-3,7,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('wedge');
  await walk(page,0,1.4);await page.keyboard.press('KeyE');await wait(page,.5);expect((await snapshot(page)).lunch.doorWedged).toBe(true);
  await walk(page,2,8,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('mop');
  await walk(page,.3,2,.45);await wait(page,4,['Space']);expect((await snapshot(page)).lunch.water).toBeLessThan(.1);
  await walk(page,2,2);await page.keyboard.press('KeyE');
  // Thick reel from Supply B into the kitchen feed: oven + both lamps.
  await walk(page,-10,7.5,.3);await page.keyboard.press('KeyF');expect((await snapshot(page)).lunch.held.id).toBe('thick');
  await route(page,[[1,3],[.2,-3.8],[-3.5,-3]],.45);await page.keyboard.press('KeyF');
  await wait(page,.5);let s=await snapshot(page);expect(s.lunch.lit).toBe(true);expect(s.lunch.sources.find((x:any)=>x.id==='b').tripped).toBe(false);await expectLoad(page,'oven','on');
  await page.screenshot({path:'artifacts/lunch-powered.png'});
  // Supply A feeds the fridge while the oven bakes.
  await route(page,[[.3,-1.3],[.3,2.4]]);await walk(page,-10.8,2,.4);await page.keyboard.press('KeyF');expect((await snapshot(page)).lunch.held.id).toBe('thin-1');
  await route(page,[[.3,2.4],[.3,-1.3]]);await walk(page,-3.8,-1.7,.4);await page.keyboard.press('KeyF');await wait(page,.3);await expectLoad(page,'fridge','on');
  await wait(page,Math.max(0,21-(await snapshot(page)).lunch.job.bake));expect((await snapshot(page)).lunch.job.tray).toBe('baked');
  await walk(page,-2.4,-5.9);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('tray');await walk(page,.2,-5.8);await page.keyboard.press('KeyE');await wait(page,.2);expect((await snapshot(page)).lunch.job.tray).toBe('conveyor');
  // Move the shelf, retrieve the capacitor and park it at the winch.
  await walk(page,-6.5,-4.8);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('shelf');await walk(page,-5.7,-3.3);await page.keyboard.press('KeyE');
  await route(page,[[-8.8,-5],[-11.2,-6.8]]);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('capacitor');
  await route(page,[[-8.8,-5],[-5,-5],[.3,-1.3],[.3,2.4],[10,1],[11.3,-4.4]]);await page.keyboard.press('KeyE');await wait(page,.1);
  expect(load(await snapshot(page),'lift').capacitor.atLoad).toBe(true);
  // Two cable bridges where the lift feed will cross the bots' line.
  for(const [bx,drop] of [[7,[-1.4,1.8]],[9,[1.5,.9]]] as const){await route(page,[[10,1],[bx,7.3]],.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toMatch(/bridge/);await walk(page,drop[0],drop[1],.4);await page.keyboard.press('KeyE');}
  // Conveyor first, then move the fridge feed over to the lift.
  await route(page,[[10,1],[-9.8,3.5]]);await page.keyboard.press('KeyF');expect((await snapshot(page)).lunch.held.id).toBe('thin-2');
  await route(page,[[.3,2.4],[.3,-1.3],[4.7,-4.8]]);await page.keyboard.press('KeyF');await page.keyboard.press('KeyE');
  await wait(page,1.3);await expectLoad(page,'conveyor','on');
  await walk(page,-3.8,-1.7,.4);await page.keyboard.press('KeyF');expect((await snapshot(page)).lunch.held.id).toBe('thin-1');
  await route(page,[[.3,-1.3],[.3,2.4],[10,1],[11.8,-4.4]]);await page.keyboard.press('KeyF');await page.keyboard.press('KeyE');
  await wait(page,16);s=await snapshot(page);expect(s.lunch.job.done,JSON.stringify({bridges:s.items.filter((i:any)=>i.id.startsWith('bridge')),bots:s.lunch.bots,cables:s.lunch.cablePoints,events:s.lunch.events.slice(-6)})).toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true');expect(errors).toEqual([]);await page.screenshot({path:'artifacts/lunch-complete.png'});
});
