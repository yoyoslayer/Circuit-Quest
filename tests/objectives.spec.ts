import {test,expect} from '@playwright/test';
import {open,walk,route,wait} from './navigation';
test('objective card and key prompts guide the playground',async({page})=>{
  await open(page,'playground');await wait(page,.1);
  const card=page.locator('.objective'),prompt=page.locator('.prompt-pill');
  await expect(card).toContainText('Light the lamp');await expect(card.locator('li.now')).toContainText('Pick up');
  await expect(prompt).toContainText('Pick up the plug');
  await page.keyboard.press('KeyF');await wait(page,.1);await expect(card.locator('li.now')).toContainText('Drag the cable');
  await route(page,[[-5,-1],[-4,-4],[5.8,-5.5]]);await wait(page,.1);await expect(prompt).toContainText('Plug in');
  await page.keyboard.press('KeyF');await wait(page,.1);await expect(card.locator('li.now')).toContainText('Switch the lamp on');
  await walk(page,6.6,-5.9,.4);await wait(page,.1);await expect(prompt).toContainText('Switch it on');
});
test('Big Meeting shows the power-strip step and the bonus goals',async({page})=>{
  await open(page,'meeting');await wait(page,.1);
  const card=page.locator('.objective');await expect(card.locator('li.now')).toContainText('power strip');await expect(card.locator('.bonus li')).toHaveCount(3);
  await walk(page,-8.6,-3.9,.4);await wait(page,.1);await expect(page.locator('.prompt-pill')).toContainText('Grab the power strip');
});
