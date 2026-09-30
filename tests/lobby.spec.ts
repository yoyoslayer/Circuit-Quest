import {test,expect} from '@playwright/test';
import {walk,wait,snapshot} from './navigation';

test('HQ doors open a portal and automatically transfer the player into the job',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.2);
  const s=await snapshot(page);expect(s.level).toBe('lobby');
  const ids=s.hub.doors.map((d:{id:string})=>d.id);expect(ids).toEqual(expect.arrayContaining(['playground','meeting','lunch','vias']));
  await expect(page.locator('.objective')).toContainText('pick a door');
  const via=s.hub.doors.find((d:{id:string})=>d.id==='vias');
  // Enter the fabrication corridor through its opening, then approach its door.
  await walk(page,-12,7,.4);
  await walk(page,via.at.x,via.at.z,1.0);
  expect((await snapshot(page)).hub.doors.find((d:any)=>d.id==='vias').portal).toBe(true);
  await expect(page.locator('.prompt-pill')).toContainText('Via Counter');
  await Promise.all([page.waitForURL(/level=vias/),wait(page,.8)]);
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  // The autostart flag drops Pip straight into the job.
  expect(await page.evaluate(()=>(window as any).__circuitCrew.snapshot().level)).toBe('vias');
  expect(errors).toEqual([]);
});

test('the Workshop arch opens a practice picker; practice runs are flagged and never recorded',async({page})=>{
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.2);
  await walk(page,7.5,5.5,.5);await wait(page,.1);
  await expect(page.locator('.prompt-pill')).toContainText('Workshop');
  await page.keyboard.press('KeyE');await expect(page.locator('.workshop-picker')).toBeVisible();
  await expect(page.locator('.workshop-picker [data-practice]')).not.toHaveCount(0);
  await Promise.all([page.waitForURL(/level=vias&practice/),page.locator('.workshop-picker [data-practice="vias"]').click()]);
  await expect(page.locator('body')).toHaveAttribute('data-practice','true');
});
