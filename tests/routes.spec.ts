import {test,expect} from '@playwright/test';
import {open,walk,route,snapshot,wait} from './navigation';
const complete=async(page:import('@playwright/test').Page)=>{await wait(page,.3);await expect(page.locator('body')).toHaveAttribute('data-complete','true');};
test('playground cable physically reaches socket and lights lamp',async({page})=>{
  const errors=await open(page);await page.keyboard.press('KeyF');
  await route(page,[[-5,-1],[-4,-4],[5.8,-5.5]]);
  await page.keyboard.press('KeyF');await complete(page);expect((await snapshot(page)).electrical).toBe('on');expect(errors).toEqual([]);
  await page.screenshot({path:'artifacts/playground-complete.png'});
});
test('meeting single-reel chaos route powers projector through the office',async({page})=>{
  await open(page,'meeting');await page.keyboard.press('KeyF');expect((await snapshot(page)).holdingPlug).toBe(true);
  await route(page,[[-10,-7],[7.8,-7],[8,-1.4],[11.4,-1.4]]);await page.keyboard.press('KeyF');
  await complete(page);await page.screenshot({path:'artifacts/meeting-complete.png'});
});
test('meeting clean route joins a second reel using a coupler',async({page})=>{
  await open(page,'meeting');
  await route(page,[[-9,-6],[-9,5.3],[-3.65,5.3]],.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('coupler');
  await route(page,[[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);await page.keyboard.press('KeyE');
  await route(page,[[-9,-6],[-9,5.3],[-3,5.3]],.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('extension');
  await route(page,[[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).rope.maxLength).toBe(40);
  await page.keyboard.press('KeyF');await route(page,[[7.8,-7],[8,-1.4],[11.4,-1.4]]);await page.keyboard.press('KeyF');await complete(page);
});
test('meeting coffee extension can be reused to power the projector',async({page})=>{
  await open(page,'meeting');
  await route(page,[[-10,-5],[-10,3.5]]);await walk(page,-12,4.5,.4);await page.keyboard.press('KeyE');
  const s=await snapshot(page);expect(s.holdingPlug,JSON.stringify(s)).toBe(true);expect(s.rope.maxLength).toBe(30);
  await route(page,[[-9,5.3],[6.9,5.3],[8,-1.3],[11.4,-1.4]]);await page.keyboard.press('KeyF');await complete(page);
});
test('a taut cable slingshots boxes when let go',async({page})=>{
  // Stretch the reel past its length so it lies across the front row of boxes, then let go.
  await open(page);await page.keyboard.press('KeyF');await walk(page,9,3.7);
  await page.evaluate(()=>(window as any).__circuitCrew.drive.advance(2.5,['KeyW','ShiftLeft']));
  const taut=await snapshot(page);expect(taut.rope.strain).toBeGreaterThan(1.02);
  await page.keyboard.press('KeyQ');await wait(page,.05);const after=await snapshot(page);
  expect(after.holdingPlug).toBe(false);expect(after.fastestProp).toBeGreaterThan(2);
  await page.screenshot({path:'artifacts/playground-slingshot.png'});
});
test('borrowing the coffee extension makes the coffee corner groan',async({page})=>{
  await open(page,'meeting');await route(page,[[-10,-5],[-10,3.5]]);await walk(page,-12,4.5,.4);await page.keyboard.press('KeyE');
  expect((await snapshot(page)).holdingPlug).toBe(true);await wait(page,.1);expect((await snapshot(page)).alarmed).toBeGreaterThanOrEqual(2);
});
