import {test,expect} from '@playwright/test';
import {open,walk,route,wait,snapshot} from './navigation';
test('objective card and key prompts guide the playground',async({page})=>{
  await open(page,'playground');await wait(page,.1);
  const card=page.locator('.objective'),prompt=page.locator('.prompt-pill');
  await expect(card.locator('.cur')).toContainText('Pick up');await expect(card.locator('.dots b')).toHaveCount(3);
  await expect(prompt).toContainText('Pick up the plug');
  await page.keyboard.press('KeyF');await wait(page,.1);await expect(card.locator('.cur')).toContainText('Drag the cable');
  await route(page,[[-5,-1],[-4,-4],[5.8,-5.5]]);await wait(page,.1);await expect(prompt).toContainText('Plug in');
  await page.keyboard.press('KeyF');await wait(page,.1);await expect(card.locator('.cur')).toContainText('Switch the lamp on');
  await walk(page,6.6,-5.9,.4);await wait(page,.1);await expect(prompt).toContainText('Switch it on');
});
test('Big Meeting shows the power-strip step and three bonus stars',async({page})=>{
  await open(page,'meeting');await wait(page,.1);
  const card=page.locator('.objective');await expect(card.locator('.cur')).toContainText('power strip');await expect(card.locator('.stars i')).toHaveCount(3);
  await walk(page,-8.6,-3.9,.4);await wait(page,.1);await expect(page.locator('.prompt-pill')).toContainText('Grab the power strip');
});
test('Big Meeting: the urn cannot be unplugged before the strip is at the door',async({page})=>{
  await open(page,'meeting');await wait(page,.1);
  // Its cord lies on the floor until the strip arrives: no prompt to pull it, and E pulls nothing.
  await walk(page,-8.6,-3.9,.4);await route(page,[[-8,-1.4],[6,-1.2],[11.2,-1.4],[12.3,-1.2],[14.3,-.9]],.4);await wait(page,.1);
  await expect(page.locator('.prompt-pill')).not.toContainText('Unplug');await page.keyboard.press('KeyE');await wait(page,.2);
  const s=await snapshot(page);expect(s.stripPlaced).toBe(false);expect(s.strip.unplugged).toBe(0);expect(s.strip.appliances.every((a:{plugged:boolean})=>a.plugged)).toBe(true);
});
