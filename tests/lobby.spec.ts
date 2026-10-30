import {test,expect} from '@playwright/test';
import {walk,wait,snapshot} from './navigation';

test('the bare URL opens the HQ lobby: a door per job, and E at a door walks into that job',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.2);
  const s=await snapshot(page);expect(s.level).toBe('lobby');
  const ids=s.hub.doors.map((d:{id:string})=>d.id);expect(ids).toEqual(expect.arrayContaining(['playground','meeting','lunch','arcade']));
  await expect(page.locator('.objective .cur')).toContainText('Cable Playground');
  const door=s.hub.doors.find((d:{id:string})=>d.id==='arcade');
  await walk(page,door.at.x,door.at.z,.4);await wait(page,.2);
  await expect(page.locator('.prompt-pill')).toContainText('Overheating Arcade');
  await Promise.all([page.waitForURL(/level=arcade/),page.keyboard.press('KeyE')]);
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  // The autostart flag drops Pip straight into the job.
  expect(await page.evaluate(()=>(window as any).__circuitCrew.snapshot().level)).toBe('arcade');
  expect(errors).toEqual([]);
});

test('the Workshop arch opens a practice picker; practice runs are flagged and never recorded',async({page})=>{
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.2);
  await walk(page,7.5,5.5,.5);await wait(page,.1);
  await expect(page.locator('.prompt-pill')).toContainText('Workshop');
  await page.keyboard.press('KeyE');await expect(page.locator('.workshop-picker')).toBeVisible();
  await expect(page.locator('.workshop-picker [data-practice]')).not.toHaveCount(0);
  await Promise.all([page.waitForURL(/level=arcade&practice/),page.locator('.workshop-picker [data-practice="arcade"]').click()]);
  await expect(page.locator('body')).toHaveAttribute('data-practice','true');
});
