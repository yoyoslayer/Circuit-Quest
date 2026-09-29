import {test,expect} from '@playwright/test';
test('loads a rendered playable scene without runtime errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.waitForTimeout(1000);
  await page.screenshot({path:'artifacts/smoke.png'});
  expect(errors).toEqual([]);
});
