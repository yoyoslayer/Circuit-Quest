import {test,expect,type Page} from '@playwright/test';
import {walk,route,wait,snapshot} from './navigation';
test.describe.configure({timeout:300000});
async function projector(page:Page){
  await route(page,[[12.3,-1.2],[12.3,-3.2]],.4);await page.keyboard.press('KeyE');await wait(page,3);
  expect((await snapshot(page)).strip.tripped).toBe(true);
  await route(page,[[12.3,-1.2],[14.3,-.9]],.4);await page.keyboard.press('KeyE');await wait(page,.2);
  await walk(page,12.3,-1.45,.3);await page.keyboard.press('KeyE');await wait(page,2);
}
test('single-reel chaos shortcut still finishes after stretching through the office',async({page})=>{
  await page.goto('/?level=meeting&manual&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();
  await walk(page,-8.6,-3.9,.4);await page.keyboard.press('KeyE');await route(page,[[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await page.keyboard.press('KeyE');await wait(page,.2);
  await route(page,[[6,-1.2],[-8,-1.4],[-10,-6.2]]);await page.keyboard.press('KeyF');await route(page,[[-8,-5],[-1,-1.5],[6,-1.2]]);
  await wait(page,2,['KeyD']);await wait(page,1.5,['KeyD','ShiftLeft']);expect((await snapshot(page)).rope.strain).toBeGreaterThan(1);
  await page.keyboard.press('KeyF');await wait(page,.1);expect((await snapshot(page)).strip.draw,JSON.stringify(await snapshot(page))).toBeGreaterThan(0);await projector(page);await expect(page.locator('body')).toHaveAttribute('data-complete','true');expect((await snapshot(page)).won).toBe(true);
  await page.waitForTimeout(2600);await page.screenshot({path:'artifacts/astra-chaos-result.png'});
});
