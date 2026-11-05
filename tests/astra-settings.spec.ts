import {test,expect} from '@playwright/test';
import {route,walk,wait} from './navigation';
test('pause explains dash, survey, stand-up and camera; mute remains clear after reload',async({page})=>{
 await page.goto('/?level=playground&manual&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();await page.keyboard.press('Escape');
 const pause=page.locator('.pause-screen');for(const word of ['Shift','Tab','Stand up','Right drag','Wheel'])await expect(pause).toContainText(word);
 const sound=pause.locator('[data-ui="sound"]');await sound.click();await expect(sound).toHaveAttribute('aria-pressed','true');await expect(sound).toContainText('Muted');await expect(sound).toHaveCSS('background-color','rgb(250, 243, 227)');
 await page.waitForTimeout(400);await page.screenshot({path:'artifacts/astra-pause-controls.png',timeout:120000});await page.reload();await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();await page.keyboard.press('Escape');await expect(page.locator('.pause-screen [data-p="sound"]')).toHaveText('Muted');
});
test('reduced motion keeps completion audio without the card shake',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?level=playground&manual&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();
 await page.evaluate(()=>{const g=(window as any).__game;(window as any).__resultThuds=[];g.audio.thud=(n:number)=>(window as any).__resultThuds.push(n);});
 await page.keyboard.press('KeyF');await route(page,[[-5,-1],[-4,-4],[5.8,-5.5]]);await page.keyboard.press('KeyF');await walk(page,6.6,-5.9,.4);await page.keyboard.press('KeyE');await wait(page,1.6);await expect(page.locator('.result-screen')).toBeVisible();await expect.poll(()=>page.evaluate(()=>(window as any).__resultThuds.includes(9))).toBe(true);await expect(page.locator('.result')).not.toHaveClass(/thud/);
});
test('HQ gives a verb and Jobs arrows stay outside the visible tag lane',async({page})=>{
 await page.goto('/?level=lobby&manual&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.1);await expect(page.locator('.objective .cur')).toContainText('Every door is a job');await wait(page,4.1);await expect(page.locator('.objective .cur')).toContainText('Enter');
 await page.goto('/?level=lobby&manual&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Choose a job'}).click();
 expect(await page.evaluate(()=>{const lane=document.querySelector('.rowwrap')!.getBoundingClientRect();return [...document.querySelectorAll('.jobs-screen .arrow')].every(el=>{const r=el.getBoundingClientRect();return r.right<=lane.left||r.left>=lane.right;});})).toBe(true);await page.waitForTimeout(1200);await page.screenshot({path:'artifacts/astra-jobs-lane.png',timeout:120000});
});
