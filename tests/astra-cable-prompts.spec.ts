import {test,expect,type Page} from '@playwright/test';
import {walk,route,wait,snapshot} from './navigation';

test.describe.configure({timeout:300000});
async function start(page:Page,level:string){await page.goto(`/?level=${level}&manual&lowfx`);await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();}
async function target(page:Page,name:RegExp){await wait(page,.1);await expect(page.locator('.objective .cur')).toContainText(name);await expect(page.locator('.prompt-pill')).toContainText(name);}

test('Meeting clean route keeps the strip and cable targets clear through the overload recovery',async({page})=>{
 await start(page,'meeting');await walk(page,-8.6,-3.9,.4);await target(page,/power strip/i);await page.keyboard.press('KeyE');await target(page,/power strip/i);
 await route(page,[[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await page.keyboard.press('KeyE');await wait(page,.2);expect((await snapshot(page)).stripPlaced).toBe(true);
 // Use both physical extension parts, keeping the coffee machine alone.
 await route(page,[[6,-1.2],[-8,-1.4],[-9,-6],[-9,5.3],[-3.65,5.3]],.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('coupler');
 await route(page,[[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);await page.keyboard.press('KeyE');
 await route(page,[[-9,-6],[-9,5.3],[-3,5.3]],.3);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('extension');
 await route(page,[[-9,5.3],[-9,-6.8],[-10.7,-6.8]],.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).rope.maxLength).toBe(37.2);
 await page.keyboard.press('KeyF');await route(page,[[6.6,-7],[6.6,-1.4],[11.4,-1.4]]);await target(page,/power strip/i);await page.keyboard.press('KeyF');
 await route(page,[[12.3,-1.2],[12.3,-3.2]],.4);await target(page,/projector/i);await page.keyboard.press('KeyE');await wait(page,3);expect((await snapshot(page)).strip.tripped).toBe(true);
 await route(page,[[12.3,-1.2],[14.3,-.9]],.4);await page.keyboard.press('KeyE');await wait(page,.2);await walk(page,12.3,-1.45,.3);
 await expect(page.locator('.prompt-pill')).toContainText('Reset the strip');await page.keyboard.press('KeyE');await wait(page,2);expect((await snapshot(page)).won).toBe(true);await expect(page.locator('body')).toHaveAttribute('data-complete','true');
});

test('Lunch clean route names the fridge, kitchen feed, tray and conveyor at their interactions',async({page})=>{
 await start(page,'lunch');await expect(page.locator('.objective .cur')).toContainText('fridge');
 // Doorstop and mop prepare a safe cable path; the fridge remains the urgent goal.
 await walk(page,-3,7,.4);await page.keyboard.press('KeyE');await expect(page.locator('.prompt-pill')).toContainText('doorstop');await walk(page,0,1.4);await page.keyboard.press('KeyE');await wait(page,.5);
 await walk(page,2,8,.4);await page.keyboard.press('KeyE');await walk(page,.3,2,.45);await wait(page,4);await walk(page,2,2);await page.keyboard.press('KeyE');
 await walk(page,-10.8,2,.4);await page.keyboard.press('KeyF');await route(page,[[.3,2.4],[.3,-1.3]]);await walk(page,-3.8,-1.7,.4);await target(page,/fridge/i);await page.keyboard.press('KeyF');await wait(page,.4);
 await route(page,[[.3,-1.3],[.3,2.4],[-10,7.5]],.3);await page.keyboard.press('KeyF');await route(page,[[1,3],[.2,-1.2],[-3.5,-3]],.45);await target(page,/kitchen|feed post/i);await page.keyboard.press('KeyF');await wait(page,.5);
 await expect(page.locator('.objective .cur')).toContainText('oven');await wait(page,Math.max(0,21-(await snapshot(page)).lunch.job.bake));
 await walk(page,-2.4,-5.9);await target(page,/tray/i);await page.keyboard.press('KeyE');await target(page,/tray/i);await walk(page,.2,-5.8);await page.keyboard.press('KeyE');await wait(page,.2);
 await walk(page,-6.5,-4.8);await page.keyboard.press('KeyE');await walk(page,-5.7,-3.3);await page.keyboard.press('KeyE');await route(page,[[-8.8,-5],[-11.2,-6.8]]);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('capacitor');
 await route(page,[[-8.8,-5],[-5,-5],[.3,-1.3],[.3,2.4],[10,1],[11.3,-4.4]]);await page.keyboard.press('KeyE');await wait(page,.1);expect((await snapshot(page)).lunch.capDocked).toBe(true);
 for(const [bx,drop] of [[7,[-1.4,1.8]],[9,[1.5,.9]],[11,[3.6,.9]]] as const){await route(page,[[(await snapshot(page)).player.x,2.4],[10,2.4],[bx,7.3]],.4);await page.keyboard.press('KeyE');await walk(page,drop[0],drop[1],.4);await page.keyboard.press('KeyE');}
 await route(page,[[3.6,2.4],[10,2.4],[-9.8,3.5]]);await page.keyboard.press('KeyF');await route(page,[[.3,2.4],[.3,-1.3],[4.7,-4.8]]);await target(page,/conveyor/i);await page.keyboard.press('KeyF');await page.keyboard.press('KeyE');await wait(page,1.3);
 await walk(page,-3.8,-1.7,.4);await page.keyboard.press('KeyF');const cap=(await snapshot(page)).items.find((i:any)=>i.id==='capacitor').pos;
 await route(page,[[.3,-1.3],[.3,2.4],[10,1],[cap.x-.9,cap.z]]);await page.keyboard.press('KeyF');await walk(page,11.8,-4.4,.45);await wait(page,7);await target(page,/lift/i);await page.keyboard.press('KeyE');await wait(page,16);
 expect((await snapshot(page)).won,JSON.stringify(await snapshot(page))).toBe(true);await expect(page.locator('body')).toHaveAttribute('data-complete','true');
});
