import {test,expect} from '@playwright/test';
import {route,walk,wait,snapshot} from './navigation';
test.describe.configure({timeout:180000});
async function start(page:import('@playwright/test').Page,practice=false){await page.goto('/?level=playground&manual&lowfx'+(practice?'&practice':''));await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.1);}
async function finish(page:import('@playwright/test').Page){await route(page,[[-5,-1],[-4,-4],[5.8,-5.5]]);await page.keyboard.press('KeyF');await wait(page,.1);await walk(page,6.6,-5.9,.4);await page.keyboard.press('KeyE');await wait(page,1.6);await expect(page.locator('.result-screen')).toBeVisible();await page.waitForTimeout(2600);}
test('task card advances immediately, safety stars remain provisional, and clean play earns three As',async({page})=>{
 await start(page);const card=page.locator('.objective .cur'),prompt=page.locator('.prompt-pill');
 await expect(card).toContainText('plug');await expect(prompt).toContainText('plug');await expect(page.locator('.objective .stars .ok')).toHaveCount(0);
 await page.keyboard.press('KeyF');await wait(page,.1);await expect(card).toContainText('Drag the cable');
 await route(page,[[-5,-1],[-4,-4],[5.8,-5.5]]);await page.keyboard.press('KeyF');await wait(page,.1);await expect(card).toContainText('Switch the lamp');
 await walk(page,6.6,-5.9,.4);await expect(prompt).toContainText('lamp');await page.keyboard.press('KeyE');await wait(page,1.6);
 await expect(page.locator('.result-screen')).toBeVisible();await page.waitForTimeout(2600);expect((await snapshot(page)).won).toBe(true);
 await expect(page.locator('.result .rows .medal span')).toHaveText(['A','A','A']);await expect(page.getByRole('button',{name:'Return to HQ'})).toBeVisible();await page.screenshot({path:'artifacts/astra-clean-result.png'});
});
test('practice completion is ungraded and never writes a job record',async({page})=>{
 await start(page,true);await page.keyboard.press('KeyF');await finish(page);
 await expect(page.locator('.practice-complete')).toContainText('Practice complete');await expect(page.locator('.result .medal')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('circuit-crew:best:v1'))).toBeNull();await page.screenshot({path:'artifacts/astra-practice-result.png'});
});
