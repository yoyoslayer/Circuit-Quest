import {test,expect} from '@playwright/test';
test('loads a rendered playable scene without runtime errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.waitForTimeout(1000);
  await page.screenshot({path:'artifacts/smoke.png'});
  expect(errors).toEqual([]);
});
test('player can pick up the plug, move, jump, and release it',async({page})=>{
  await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();
  const snapshot=()=>page.evaluate(()=>(window as any).__circuitCrew.snapshot());
  await page.keyboard.press('KeyF');expect((await snapshot()).holdingPlug).toBe(true);
  const start=await snapshot();await page.keyboard.down('KeyD');await page.waitForTimeout(700);await page.keyboard.up('KeyD');
  const moved=await snapshot();expect(moved.player.x).toBeGreaterThan(start.player.x+1);
  await page.keyboard.press('Space');await page.waitForTimeout(180);expect((await snapshot()).player.y).toBeGreaterThan(moved.player.y+.2);
  await page.keyboard.press('KeyQ');expect((await snapshot()).holdingPlug).toBe(false);
  await page.screenshot({path:'artifacts/playground.png'});
});
test('office contains over 300 physics props and renders without errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?level=meeting');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await page.waitForTimeout(1500);
  const state=await page.evaluate(()=>(window as any).__circuitCrew.snapshot());
  expect(state.props).toBeGreaterThanOrEqual(300);expect(errors).toEqual([]);
  await page.screenshot({path:'artifacts/meeting.png'});
});
