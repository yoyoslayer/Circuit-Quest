import {test,expect,type Page} from '@playwright/test';
import {open,walk,route,snapshot,wait} from './navigation';
// The cable floors walk long routes with 300+ physics props; under software rendering a route takes
// close to a minute, so give each test room.
test.describe.configure({timeout:180000});
// Each test exercises one rule from docs/LEVEL_02_LUNCH_RUSH.md through real play.
const lunch=async(page:Page)=>(await snapshot(page)).lunch;
const cable=async(page:Page,id:string)=>(await lunch(page)).cables.find((c:any)=>c.id===id);
const source=async(page:Page,id:string)=>(await lunch(page)).sources.find((s:any)=>s.id===id);
const load=async(page:Page,id:string)=>(await lunch(page)).loads.find((l:any)=>l.id===id);
const prompt=(page:Page)=>page.locator('.prompt-pill');
async function wedgeDoor(page:Page){await walk(page,-3,7,.4);await page.keyboard.press('KeyE');await walk(page,0,1.4);await page.keyboard.press('KeyE');await wait(page,.5);expect((await lunch(page)).doorWedged).toBe(true);}
async function mopPuddle(page:Page){await walk(page,2,8,.4);await page.keyboard.press('KeyE');await walk(page,.3,2,.45);await wait(page,4);await walk(page,2,2);await page.keyboard.press('KeyE');expect((await lunch(page)).water).toBeLessThan(.1);}
async function takeThick(page:Page){await walk(page,-10,7.5,.3);await page.keyboard.press('KeyF');expect((await lunch(page)).held.id).toBe('thick');}
async function feedKitchen(page:Page){await route(page,[[1,3],[.2,-1.2],[-3.5,-3]],.45);await page.keyboard.press('KeyF');await wait(page,.4);}

test('a thin cable feeding oven and both lamps overheats and scorches',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);await mopPuddle(page);
  await walk(page,-10.8,2,.4);await page.keyboard.press('KeyF');expect((await lunch(page)).held.id).toBe('thin-1');
  await feedKitchen(page);expect((await cable(page,'thin-1')).ports).toContain('kitchen');
  await wait(page,2);expect((await cable(page,'thin-1')).heat).toBeGreaterThan(.4);
  await wait(page,6);const c=await cable(page,'thin-1');expect(c.dead).toBe(true);expect(c.cause).toBe('scorch');
  expect((await lunch(page)).events.some((e:any)=>e.kind==='scorch'&&e.id==='thin-1')).toBe(true);expect((await load(page,'oven')).state).not.toBe('on');
  // The cause is named once, then the repair prompt says what kind of repair it is.
  expect((await lunch(page)).told).toContain('overheat');
  await wait(page,4);await expect(prompt(page)).toContainText('scorched');
});
test('the swinging door cuts a cable left through it unless wedged, and a splice waits for the wedge',async({page})=>{
  // Unwedged, the door swings shut behind Pip once they head for the feed post.
  await open(page,'lunch');await mopPuddle(page);await takeThick(page);await feedKitchen(page);await wait(page,1);
  let c=await cable(page,'thick');expect(c.dead).toBe(true);expect(c.cause).toBe('cut');expect((await load(page,'oven')).state).not.toBe('on');
  // Splicing it while it still runs through the shut door would only get it cut again: refused, no charge.
  const cost=(await snapshot(page)).cost;await walk(page,-3.5,-3,.45);await wait(page,3.5);await expect(prompt(page)).toContainText('Wedge the door first');
  await page.keyboard.press('KeyF');expect((await cable(page,'thick')).dead).toBe(true);expect((await snapshot(page)).cost).toBe(cost);
  await route(page,[[.2,-1.2],[.3,2.4]]);await wedgeDoor(page);await route(page,[[.2,-1.2],[-3.5,-3]],.45);await expect(prompt(page)).toContainText('Splice the cut cable');
  await page.keyboard.press('KeyF');c=await cable(page,'thick');expect(c.dead).toBe(false);expect((await snapshot(page)).cost).toBe(cost+15);
});
test('insulated cable lying in the leak is fine; water at a bare plug trips the cart until reset',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);await takeThick(page);await feedKitchen(page);
  // The thick cable runs through the puddles with both plugs dry: no fault.
  expect((await source(page,'b')).tripped).toBe(false);expect((await load(page,'oven')).state).toBe('on');expect((await lunch(page)).water).toBeGreaterThan(.9);
  // Supply A's thin lead dropped with its bare plug in the puddle by the door leaks to earth: cart A cuts out.
  await route(page,[[.2,-1.2],[.3,2.4]]);await walk(page,-10.8,2,.4);await page.keyboard.press('KeyF');expect((await lunch(page)).held.id).toBe('thin-1');
  await walk(page,.4,2.1,.3);await page.keyboard.press('KeyF');await wait(page,.4);
  expect((await source(page,'a')).tripped).toBe(true);expect((await lunch(page)).events.some((e:any)=>e.kind==='short'&&e.id==='a')).toBe(true);
  // Mopping dries the leak; the reset button on the cart restores power.
  await mopPuddle(page);await route(page,[[-9,4.5],[-12,4.4]],.45);await page.keyboard.press('KeyE');await wait(page,.4);
  expect((await source(page,'a')).tripped).toBe(false);
});
test('the fridge socket sits in the leak: plugging it in before mopping trips the cart',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);
  await walk(page,-10.8,2,.4);await page.keyboard.press('KeyF');
  await route(page,[[.3,2.4],[.3,-1.3]]);await walk(page,-3.8,-1.7,.4);await page.keyboard.press('KeyF');await wait(page,.4);
  expect((await cable(page,'thin-1')).ports).toContain('fridge');expect((await source(page,'a')).tripped).toBe(true);expect((await lunch(page)).told).toContain('leak');
});
test('the lift start-up kick trips a cart without the capacitor at the winch',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);await mopPuddle(page);
  await walk(page,-10.8,2,.4);await page.keyboard.press('KeyF');expect((await lunch(page)).held.id).toBe('thin-1');
  await route(page,[[.3,2.4],[10,1],[11.8,-4.4]]);await page.keyboard.press('KeyF');await page.keyboard.press('KeyE');await wait(page,.5);
  expect((await source(page,'a')).tripped).toBe(true);expect((await load(page,'lift')).state).not.toBe('on');
  // Only now, after the failure, does the capacitor badge appear, and the surge is pinned on the lift.
  const s=await lunch(page);expect(s.capHint).toBe(true);expect(s.surgeHint).toBe('lift');expect(s.liftRan).toBe(false);
  // The motor dropped out with the cart: after a reset it stays off until it is switched on again.
  expect((await load(page,'lift')).enabled).toBe(false);
});
test('walking back from the lift room past the wedged door never stalls, and the doorstop stays put',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);await mopPuddle(page);await takeThick(page);await feedKitchen(page);
  expect((await cable(page,'thick')).dead).toBe(false);
  await route(page,[[.2,-1.2],[.3,2.4],[10,1],[1,-.5],[-1,-2.5]],.5);
  // Right by the doorstop, E doesn't pull it out from under the live cable.
  await walk(page,.4,-.9,.4);await page.keyboard.press('KeyE');await wait(page,.3);
  const s=await snapshot(page);expect(s.held).not.toBe('wedge');expect(s.lunch.doorWedged).toBe(true);expect(s.lunch.cables.find((c:any)=>c.id==='thick').dead).toBe(false);
});
test('the storeroom stays dark: nothing inside can be grabbed until a lamp is lit',async({page})=>{
  await open(page,'lunch');
  await route(page,[[.2,2],[.2,-1.2]]);await walk(page,-6.5,-4.8);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('shelf');await walk(page,-5.7,-3.3);await page.keyboard.press('KeyE');
  await route(page,[[-8.8,-5],[-11.2,-6.8]]);await page.keyboard.press('KeyE');
  const s=await snapshot(page);expect(s.lunch.lit).toBe(false);expect(s.held).toBeUndefined();
});
test('cleaner bots snag a live cable lying across their line',async({page})=>{
  // Supply A along the corridor to the winch crosses the bots' loop twice; no bridges.
  await open(page,'lunch');await walk(page,-10.8,2,.4);await page.keyboard.press('KeyF');
  await route(page,[[.3,2.4],[10,1],[11.8,-4.4]]);await page.keyboard.press('KeyF');expect((await cable(page,'thin-1')).ports).toEqual(['a','lift']);
  let snagged=false;for(let i=0;i<70&&!snagged;i++){await wait(page,1);snagged=!(await cable(page,'thin-1')).ports.includes('lift');}
  expect(snagged).toBe(true);expect((await cable(page,'thin-1')).nicked).toBe(true);
});
test('emptying the fridge into the cooler box is a valid alternative',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);await mopPuddle(page);await takeThick(page);await feedKitchen(page);
  await walk(page,-6.5,-4.8);await page.keyboard.press('KeyE');await walk(page,-5.7,-3.3);await page.keyboard.press('KeyE');
  await route(page,[[-8.8,-5],[-10,-7.2]],.45);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('cooler-box');
  await route(page,[[-8.8,-5],[-6.5,-3.8],[-4.4,-3.6],[-4.4,-1.8]],.5);await wait(page,.2);expect((await lunch(page)).job.cooled).toBe(true);
  const before=(await lunch(page)).job.temperature;await wait(page,10);expect((await lunch(page)).job.temperature).toBeLessThan(before);
});
test('an unpowered fridge eventually spoils lunch and offers a retry',async({page})=>{
  // Looking round the power room costs nothing: the fridge only warms once the kitchen door opens.
  await open(page,'lunch');await wait(page,30);expect((await lunch(page)).job.temperature).toBeCloseTo(.28);
  await walk(page,0,1.4);await wait(page,165);
  expect((await lunch(page)).job.failed).toBe(true);await expect(page.locator('body')).toHaveAttribute('data-failed','true',{timeout:15000});
  await expect(page.getByRole('button',{name:'Retry Lunch Rush'})).toBeVisible();
});
