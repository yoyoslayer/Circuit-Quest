import {test,expect} from '@playwright/test';
import {walk,wait,snapshot} from './navigation';

test('the bare URL opens the HQ lobby: a door per job, and E at a door walks into that job',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.2);
  const s=await snapshot(page);expect(s.level).toBe('lobby');
  const ids=s.hub.doors.map((d:{id:string})=>d.id);expect(ids).toEqual(expect.arrayContaining(['playground','meeting','lunch','vias']));
  await expect(page.locator('.objective')).toContainText('pick a door');
  const via=s.hub.doors.find((d:{id:string})=>d.id==='vias');
  await walk(page,via.at.x,via.at.z,.4);await wait(page,.2);
  await expect(page.locator('.prompt-pill')).toContainText('Via Counter');
  await Promise.all([page.waitForURL(/level=vias/),page.keyboard.press('KeyE')]);
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  // The autostart flag drops Pip straight into the job.
  expect(await page.evaluate(()=>(window as any).__circuitCrew.snapshot().level)).toBe('vias');
  expect(errors).toEqual([]);
});
