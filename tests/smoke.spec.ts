import {test,expect} from '@playwright/test';
test('loads a rendered playable scene without runtime errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.waitForTimeout(1000);
  await page.screenshot({path:'artifacts/smoke.png'});
  expect(errors).toEqual([]);
});
test('player can pick up the plug, move, jump, and release it',async({page})=>{
  // Simulated time (?manual) so the checks don't depend on how fast this machine renders.
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();
  const snapshot=()=>page.evaluate(()=>(window as any).__circuitCrew.snapshot());
  const advance=(s:number,keys:string[]=[])=>page.evaluate(([s,k])=>(window as any).__circuitCrew.drive.advance(s,k),[s,keys] as const);
  await page.keyboard.press('KeyF');expect((await snapshot()).holdingPlug).toBe(true);
  const start=await snapshot();const moved=await advance(.7,['KeyD']);expect(moved.player.x).toBeGreaterThan(start.player.x+1);
  await page.keyboard.press('Space');const up=await advance(.18);expect(up.player.y).toBeGreaterThan(moved.player.y+.2);
  await page.keyboard.press('KeyQ');expect((await snapshot()).holdingPlug).toBe(false);
  await page.screenshot({path:'artifacts/playground.png'});
});
test('office contains over 300 physics props and renders without errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?level=meeting&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await page.waitForTimeout(1500);
  const state=await page.evaluate(()=>(window as any).__circuitCrew.snapshot());
  expect(state.props).toBeGreaterThanOrEqual(300);expect(errors).toEqual([]);
  await page.screenshot({path:'artifacts/meeting.png'});
});
test('Lunch Rush boots with two supplies, four cables and a warming fridge',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?level=lunch&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();await page.waitForTimeout(2000);
  const state=await page.evaluate(()=>(window as any).__circuitCrew.snapshot());expect(state.lunch.sources).toHaveLength(2);expect(state.lunch.cables).toHaveLength(4);expect(state.lunch.loads).toHaveLength(6);expect(errors).toEqual([]);await page.screenshot({path:'artifacts/lunch.png'});
});
