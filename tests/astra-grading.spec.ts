import {test,expect} from '@playwright/test';
import {open,wait} from './navigation';
test('R5-078: an idle Rush shift records D, never A',async({page})=>{
 test.setTimeout(120000);await open(page,'arcade-rush');await wait(page,201);// the shift clock starts after 20 s when the tray is never fetched (R5-220)
 await expect(page.locator('.result-screen')).toBeVisible({timeout:15000});
 await expect(page.locator('.result-screen')).toHaveAttribute('aria-label','Job done, grade D');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('circuit-crew:best:v1')??'{}'));
 expect(stored['arcade-rush'].grade).toBe('D');
 await expect(page.locator('.result-served')).toContainText(/Cabinets fixed:\s*0/);
});
