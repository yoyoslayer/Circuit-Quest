import {test,expect} from '@playwright/test';
import {open,walk,route,snapshot,wait} from './navigation';
type Page=import('@playwright/test').Page;
const complete=async(page:Page)=>{await wait(page,.3);await expect(page.locator('body')).toHaveAttribute('data-complete','true');};
// Big Meeting prep: carry the power strip from the printer stand to the boardroom door first.
async function placeStrip(page:Page){await walk(page,-8.6,-3.9,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('strip');
  await route(page,[[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await page.keyboard.press('KeyE');await wait(page,.2);expect((await snapshot(page)).stripPlaced).toBe(true);}
const backToReel=(page:Page)=>route(page,[[6,-1.2],[-8,-1.4],[-10,-6.2]]);
// After plugging in, step into the boardroom and switch the projector on.
async function switchProjector(page:Page){await route(page,[[12.3,-1.2],[12.3,-3.2]],.4);await page.keyboard.press('KeyE');}
test('playground cable physically reaches socket and lights lamp',async({page})=>{
  const errors=await open(page,'playground');await page.keyboard.press('KeyF');
  await route(page,[[-5,-1],[-4,-4],[5.8,-5.5]]);
  await page.keyboard.press('KeyF');await wait(page,.3);expect((await snapshot(page)).won).toBe(false);
  // Powered but still off: flip the lamp's switch.
  await walk(page,6.6,-5.9,.4);await page.keyboard.press('KeyE');await complete(page);expect((await snapshot(page)).electrical).toBe('on');expect(errors).toEqual([]);
  await page.screenshot({path:'artifacts/playground-complete.png'});
});
test('meeting single reel only reaches when overstretched at a sprint',async({page})=>{
  await open(page,'meeting');await placeStrip(page);await backToReel(page);await page.keyboard.press('KeyF');expect((await snapshot(page)).holdingPlug).toBe(true);
  await route(page,[[-8,-5],[-1,-1.5],[6,-1.2]]);
  // Walking, the reel's spring stops Pip well short of the boardroom door...
  await page.evaluate(()=>(window as any).__circuitCrew.drive.advance(2,['KeyD']));let s=await snapshot(page);
  expect(Math.hypot(s.player.x-12.3,s.player.z+2.25)).toBeGreaterThan(2.3);
  // ...but sprinting stretches it past its length (dragging props along) far enough to plug in.
  await page.evaluate(()=>(window as any).__circuitCrew.drive.advance(1.5,['KeyD','ShiftLeft']));s=await snapshot(page);expect(s.rope.strain).toBeGreaterThan(1);
  await page.keyboard.press('KeyF');await switchProjector(page);await complete(page);await page.screenshot({path:'artifacts/meeting-complete.png'});
});
test('meeting clean route joins a second reel using a coupler',async({page})=>{
  await open(page,'meeting');await placeStrip(page);await route(page,[[6,-1.2],[-8,-1.4]]);
  await route(page,[[-9,-6],[-9,5.3],[-3.65,5.3]],.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('coupler');
  await route(page,[[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);await page.keyboard.press('KeyE');
  await route(page,[[-9,-6],[-9,5.3],[-3,5.3]],.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('extension');
  await route(page,[[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).rope.maxLength).toBe(37.2);
  await page.keyboard.press('KeyF');await route(page,[[7.8,-7],[8,-1.4],[11.4,-1.4]]);await page.keyboard.press('KeyF');await switchProjector(page);await complete(page);
});
test('meeting coffee extension can be reused to power the projector',async({page})=>{
  await open(page,'meeting');await placeStrip(page);
  await route(page,[[6,-1.2],[-8,-1.4],[-10,3.5]]);await walk(page,-12,4.5,.4);await page.keyboard.press('KeyE');
  const s=await snapshot(page);expect(s.holdingPlug,JSON.stringify(s)).toBe(true);expect(s.rope.maxLength).toBe(30);
  await route(page,[[-9,5.3],[6.9,5.3],[8,-1.3],[11.4,-1.4]]);await page.keyboard.press('KeyF');await switchProjector(page);await complete(page);
});
test('a taut cable slingshots boxes when let go',async({page})=>{
  // Stretch the reel past its length so it lies across the front row of boxes, then let go.
  await open(page,'playground');await page.keyboard.press('KeyF');await walk(page,9,3.7);
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
test('holding the plug, F at the mail cart attaches coupler then second reel',async({page})=>{
  await open(page,'meeting');await placeStrip(page);await backToReel(page);await page.keyboard.press('KeyF');
  await route(page,[[-9,-6],[-9,5.3],[-3.3,5.5]],.3);
  await page.keyboard.press('KeyF');let s=await snapshot(page);expect(s.holdingPlug).toBe(true);expect(s.items.find((i:any)=>i.id==='coupler').visible).toBe(false);expect(s.rope.maxLength).toBe(23.2);
  await page.keyboard.press('KeyF');s=await snapshot(page);expect(s.holdingPlug).toBe(true);expect(s.rope.maxLength).toBe(37.2);
  // Return through the aisle between pods, rather than threading the cable
  // through a desk/chair island now that furniture has separate colliders.
  await route(page,[[-3.5,3.6],[-3.5,-1.4],[6,-1.2],[11.4,-1.4]]);await page.keyboard.press('KeyF');await switchProjector(page);await complete(page);
});
