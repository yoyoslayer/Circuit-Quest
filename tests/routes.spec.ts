import {test,expect} from '@playwright/test';
import {open,walk,route,snapshot,wait} from './navigation';
type Page=import('@playwright/test').Page;
// The cable floors walk long routes with 300+ physics props; under software rendering a route takes
// close to a minute, so give each test room.
test.describe.configure({timeout:180000});
const complete=async(page:Page)=>{await wait(page,.3);await expect(page.locator('body')).toHaveAttribute('data-complete','true');};
// Big Meeting prep: carry the power strip from the printer stand to the boardroom door first.
async function placeStrip(page:Page){await walk(page,-8.6,-3.9,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('strip');
  await route(page,[[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await page.keyboard.press('KeyE');await wait(page,.2);expect((await snapshot(page)).stripPlaced).toBe(true);}
const backToReel=(page:Page)=>route(page,[[6,-1.2],[-8,-1.4],[-10,-6.2]]);
// After plugging in, step into the boardroom and switch the projector on. The urn and heater
// already load the strip by the door (4.5 A, pulses on the cable), so the projector tips it over:
// the strip hums past its line for about two seconds, then its thermal breaker trips and reads 0 A
// with the 5.5 A demand left as a ghost. Unplug one load (the boardroom groans) and reset the strip.
async function switchProjector(page:Page){
  await wait(page,.2);let s=await snapshot(page);expect(s.strip.draw).toBeCloseTo(4.5);expect(s.strip.pulses).toBe(true);
  // The lit urn and heater lamps keep one material each (a new one per frame grows OutlineEffect's cache).
  await wait(page,.2);expect((await snapshot(page)).strip.lamps).toEqual(s.strip.lamps);
  await route(page,[[12.3,-1.2],[12.3,-3.2]],.4);await page.keyboard.press('KeyE');
  await wait(page,.3);s=await snapshot(page);expect(s.strip.overloaded).toBe(true);expect(s.strip.tripped).toBe(false);expect(s.won).toBe(false);
  await wait(page,2.7);s=await snapshot(page);expect(s.strip.tripped).toBe(true);expect(s.won).toBe(false);expect(s.strip.draw).toBe(0);expect(s.strip.demand).toBeCloseTo(5.5);expect(s.strip.pulses).toBe(false);
  await expect(page.locator('.meeting-toast')).toContainText('cut out');
  // Tripped: the board lamp, the reset cap and the projector LED pulse on their own materials.
  await wait(page,.2);expect((await snapshot(page)).strip.lamps).toEqual(s.strip.lamps);
  await route(page,[[12.3,-1.2],[14.3,-.9]],.4);await page.keyboard.press('KeyE');await wait(page,.2);
  s=await snapshot(page);expect(s.strip.unplugged).toBe(1);expect(s.alarmed).toBeGreaterThanOrEqual(1);expect(s.strip.demand).toBeCloseTo(3);
  await walk(page,12.3,-1.45,.3);await expect(page.locator('.prompt-pill')).toContainText('Reset the strip');await page.keyboard.press('KeyE');await wait(page,.2);}
test('playground cable physically reaches socket and lights lamp',async({page})=>{
  const errors=await open(page,'playground');await page.keyboard.press('KeyF');
  await route(page,[[-5,-1],[-4,-4],[5.8,-5.5]]);
  await page.keyboard.press('KeyF');await wait(page,.3);expect((await snapshot(page)).won).toBe(false);
  // Powered but still off: flip the lamp's switch.
  // The lamp lights at once and burns a moment before the win, so the switch can be tried both ways.
  await walk(page,6.6,-5.9,.4);await page.keyboard.press('KeyE');await wait(page,.5);let s=await snapshot(page);expect(s.lampLit).toBe(true);expect(s.won).toBe(false);
  await page.keyboard.press('KeyE');await wait(page,.2);s=await snapshot(page);expect(s.electrical).toBe('off');expect(s.lampLit).toBe(false);expect(s.won).toBe(false);
  await page.keyboard.press('KeyE');await wait(page,1.3);await complete(page);expect((await snapshot(page)).electrical).toBe('on');expect(errors).toEqual([]);
  await page.screenshot({path:'artifacts/playground-complete.png'});
});
test('meeting single reel only reaches when overstretched at a sprint',async({page})=>{
  await open(page,'meeting');await placeStrip(page);await backToReel(page);await page.keyboard.press('KeyF');expect((await snapshot(page)).holdingPlug).toBe(true);
  await route(page,[[-8,-5],[-1,-1.5],[6,-1.2]]);
  // Walking, the reel's spring stops Pip well short of the boardroom door...
  await page.evaluate(()=>(window as any).__circuitCrew.drive.advance(2,['KeyD']));let s=await snapshot(page);
  // Seating needs Pip within 2.2 m of the socket (Game.canSeat: distance − .6 < 1.6). The margin is thin (R5-164, open).
  expect(Math.hypot(s.player.x-12.3,s.player.z+2.25)).toBeGreaterThan(2.2);
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
  await page.keyboard.press('KeyF');await route(page,[[6.6,-7],[6.6,-1.4],[11.4,-1.4]]);await page.keyboard.press('KeyF');await switchProjector(page);await complete(page);
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
test('meeting: reset while still overloaded re-trips after the dwell; prompts pick the nearest load',async({page})=>{
  await open(page,'meeting');await placeStrip(page);await backToReel(page);await page.keyboard.press('KeyF');
  await route(page,[[-9,-6],[-9,5.3],[-3.3,5.5]],.3);await page.keyboard.press('KeyF');await page.keyboard.press('KeyF');
  await route(page,[[-1,3],[-1,-1.5],[6,-1.2],[11.4,-1.4]]);await page.keyboard.press('KeyF');
  await route(page,[[12.3,-1.2],[12.3,-3.2]],.4);await page.keyboard.press('KeyE');await wait(page,3);expect((await snapshot(page)).strip.trips).toBe(1);
  // E at the switch is the switch, not a silent reset of the strip behind Pip.
  await expect(page.locator('.prompt-pill')).not.toContainText('Reset');
  await walk(page,12.3,-1.45,.3);await page.keyboard.press('KeyE');await wait(page,.3);let s=await snapshot(page);expect(s.strip.tripped).toBe(false);expect(s.strip.overloaded).toBe(true);
  await wait(page,3);s=await snapshot(page);expect(s.strip.trips).toBe(2);await expect(page.locator('.meeting-toast')).toContainText('Still too much');
  await walk(page,15.2,-1.15,.3);await expect(page.locator('.prompt-pill')).toContainText('heater');
  await walk(page,13.9,-1.15,.3);await expect(page.locator('.prompt-pill')).toContainText('urn');
});
test('meeting: borrowing the coffee reel unplugs the server cable from the strip',async({page})=>{
  await open(page,'meeting');await placeStrip(page);await backToReel(page);await page.keyboard.press('KeyF');
  await route(page,[[-9,-6],[-9,5.3],[-3.3,5.5]],.3);await page.keyboard.press('KeyF');await page.keyboard.press('KeyF');
  await route(page,[[-1,3],[-1,-1.5],[6,-1.2],[11.4,-1.4]]);await page.keyboard.press('KeyF');await wait(page,.2);expect((await snapshot(page)).strip.draw).toBeCloseTo(4.5);
  await route(page,[[6,-1.2],[-8,-1.4],[-10,3.5]]);await walk(page,-12,4.5,.4);await page.keyboard.press('KeyE');await wait(page,.1);
  const s=await snapshot(page);expect(s.holdingPlug).toBe(true);expect(s.strip.draw).toBe(0);
});
test('meeting slingshot topples the paper tower by the aisle end',async({page})=>{
  await open(page,'meeting');await placeStrip(page);await backToReel(page);await page.keyboard.press('KeyF');
  await route(page,[[-8,-5],[-1,-1.5],[6,-1.2]]);await wait(page,2,['KeyD','ShiftLeft']);expect((await snapshot(page)).rope.strain).toBeGreaterThan(1);
  await page.keyboard.press('KeyQ');await wait(page,1.5);expect((await snapshot(page)).strip.towerDown).toBe(true);
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
  await route(page,[[-1,3],[-1,-1.5],[6,-1.2],[11.4,-1.4]]);await page.keyboard.press('KeyF');await switchProjector(page);await complete(page);
});
