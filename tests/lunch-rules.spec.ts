import {test,expect,type Page} from '@playwright/test';
import {open,walk,route,snapshot,wait} from './navigation';
// Each test exercises one rule from docs/LEVEL_02_LUNCH_RUSH.md through real play.
const lunch=async(page:Page)=>(await snapshot(page)).lunch;
const cable=async(page:Page,id:string)=>(await lunch(page)).cables.find((c:any)=>c.id===id);
const source=async(page:Page,id:string)=>(await lunch(page)).sources.find((s:any)=>s.id===id);
const load=async(page:Page,id:string)=>(await lunch(page)).loads.find((l:any)=>l.id===id);
async function wedgeDoor(page:Page){await walk(page,-3,7,.4);await page.keyboard.press('KeyE');await walk(page,0,1.4);await page.keyboard.press('KeyE');await wait(page,.5);expect((await lunch(page)).doorWedged).toBe(true);}
async function mopPuddle(page:Page){await walk(page,2,8,.4);await page.keyboard.press('KeyE');await walk(page,.3,2,.45);await wait(page,4,['Space']);await walk(page,2,2);await page.keyboard.press('KeyE');expect((await lunch(page)).water).toBeLessThan(.1);}
async function takeThick(page:Page){await walk(page,-10,7.5,.3);await page.keyboard.press('KeyF');expect((await lunch(page)).held.id).toBe('thick');}
async function feedKitchen(page:Page){await route(page,[[1,3],[.2,-3.8],[-3.5,-3]],.45);await page.keyboard.press('KeyF');await wait(page,.4);}

test('a thin cable feeding oven and both lamps overheats and scorches',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);await mopPuddle(page);
  await walk(page,-10.8,2,.4);await page.keyboard.press('KeyF');expect((await lunch(page)).held.id).toBe('thin-1');
  await feedKitchen(page);expect((await cable(page,'thin-1')).ports).toContain('kitchen');
  await wait(page,2);expect((await cable(page,'thin-1')).heat).toBeGreaterThan(.4);
  await wait(page,6);const c=await cable(page,'thin-1');expect(c.dead).toBe(true);
  expect((await lunch(page)).events.some((e:any)=>e.kind==='scorch'&&e.id==='thin-1')).toBe(true);expect((await load(page,'oven')).state).not.toBe('on');
});
test('the swinging door cuts a cable left through it unless wedged',async({page})=>{
  // Unwedged, the door swings shut behind Pip once they head for the feed post.
  await open(page,'lunch');await mopPuddle(page);await takeThick(page);await feedKitchen(page);await wait(page,1);
  expect((await cable(page,'thick')).dead).toBe(true);expect((await load(page,'oven')).state).not.toBe('on');
  const cost=(await snapshot(page)).cost;await walk(page,-3.5,-3,.45);await page.keyboard.press('KeyF');expect((await cable(page,'thick')).dead).toBe(false);expect((await snapshot(page)).cost).toBe(cost+15);
});
test('a live cable through the leak shorts and trips the supply until reset',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);await takeThick(page);await feedKitchen(page);
  expect((await source(page,'b')).tripped).toBe(true);expect((await lunch(page)).events.some((e:any)=>e.kind==='short')).toBe(true);
  // Mopping dries the leak; the reset button on the cart restores power.
  await route(page,[[.2,-1.2],[.3,2]]);await mopPuddle(page);await route(page,[[-9,6],[-12,6]],.45);await page.keyboard.press('KeyE');await wait(page,.4);
  expect((await source(page,'b')).tripped).toBe(false);expect((await load(page,'oven')).state).toBe('on');
});
test('a cable bridge over the leak keeps the feed dry without mopping',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);
  for(const [x,z] of [[-1.3,.9],[.3,1.9]] as const){await walk(page,x===-1.3?7:9,8,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toMatch(/bridge/);await walk(page,x,z+.6,.4);await page.keyboard.press('KeyE');}
  await takeThick(page);await feedKitchen(page);expect((await source(page,'b')).tripped).toBe(false);expect((await load(page,'oven')).state).toBe('on');
});
test('the lift start-up kick trips a cart without the capacitor at the winch',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);await mopPuddle(page);
  await walk(page,-9.8,3.5,.5);await page.keyboard.press('KeyF');expect((await lunch(page)).held.id).toBe('thin-2');
  await route(page,[[.3,2.4],[10,1],[11.8,-4.4]]);await page.keyboard.press('KeyF');await page.keyboard.press('KeyE');await wait(page,.5);
  expect((await source(page,'a')).tripped).toBe(true);expect((await load(page,'lift')).state).not.toBe('on');
});
test('the storeroom stays dark: nothing inside can be grabbed until a lamp is lit',async({page})=>{
  await open(page,'lunch');
  await route(page,[[.2,2],[.2,-1.2]]);await walk(page,-6.5,-4.8);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('shelf');await walk(page,-5.7,-3.3);await page.keyboard.press('KeyE');
  await route(page,[[-8.8,-5],[-11.2,-6.8]]);await page.keyboard.press('KeyE');
  const s=await snapshot(page);expect(s.lunch.lit).toBe(false);expect(s.held).toBeUndefined();
});
test('cleaner bots snag a live cable lying across their line',async({page})=>{
  // Supply A along the corridor to the winch crosses the bots' loop twice; no bridges.
  await open(page,'lunch');await walk(page,-9.8,3.5,.5);await page.keyboard.press('KeyF');
  await route(page,[[.3,2.4],[10,1],[11.8,-4.4]]);await page.keyboard.press('KeyF');expect((await cable(page,'thin-2')).ports).toEqual(['a','lift']);
  let snagged=false;for(let i=0;i<70&&!snagged;i++){await wait(page,1);snagged=!(await cable(page,'thin-2')).ports.includes('lift');}
  expect(snagged).toBe(true);
});
test('emptying the fridge into the cooler box is a valid alternative',async({page})=>{
  await open(page,'lunch');await wedgeDoor(page);await mopPuddle(page);await takeThick(page);await feedKitchen(page);
  await walk(page,-6.5,-4.8);await page.keyboard.press('KeyE');await walk(page,-6.5,-6.5);await page.keyboard.press('KeyE');
  await route(page,[[-8.8,-5],[-10,-7.2]],.45);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('cooler-box');
  // Pass behind the moved shelf, then approach the fridge from its open side.
  // Delivery automatically releases the cooler before this stopping point.
  await route(page,[[-8.8,-5],[-6.5,-3.8],[-4.4,-3.6],[-4.4,-2.7]],.5);
  expect((await lunch(page)).job.cooled).toBe(true);
  const before=(await lunch(page)).job.temperature;await wait(page,10);expect((await lunch(page)).job.temperature).toBeLessThan(before);
});
test('an unpowered fridge eventually spoils lunch and offers a retry',async({page})=>{
  await open(page,'lunch');await wait(page,125);
  expect((await lunch(page)).job.failed).toBe(true);await expect(page.locator('body')).toHaveAttribute('data-failed','true',{timeout:15000});
  await expect(page.getByRole('button',{name:'Retry Lunch Rush'})).toBeVisible();
});
