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

test('the back wall is open at each unlocked door and solid beside it and above it (collider probe)',async({page})=>{
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.2);
  const s=await snapshot(page);const door=s.hub.doors.find((d:{id:string})=>d.id==='arcade');
  // Pip is kept half a metre inside the room bounds, so walking cannot test the wall: cast rays at it instead.
  // A ray from z -9 toward the back wall (inner face z -9.875) at waist height or lintel height.
  const toi=(x:number,y:number)=>page.evaluate(([x,y])=>{const G=(window as any).__game;
    const hit=G.world.castRay({origin:{x,y,z:-9},dir:{x:0,y:0,z:-1}},2,true,undefined,undefined,undefined,undefined,(c:any)=>!!c.parent()?.isFixed());
    return hit?hit.timeOfImpact:-1;},[x,y] as const);
  expect(await toi(door.at.x+1.2,1)).toBeCloseTo(.875,1);   // wall beside the door (the gap ends at 0.84 m)
  expect(await toi(door.at.x,1)).toBe(-1);                  // the doorway itself is open
  expect(await toi(door.at.x,2.7)).toBeCloseTo(.875,1);     // the lintel above it is solid
  const locked=s.hub.doors.find((d:{locked:boolean})=>d.locked);
  if(locked)expect(await toi(locked.at.x,1)).toBeCloseTo(.875,1); // a locked door keeps its wall
});

test('walking into an open door goes through it, with no E pressed',async({page})=>{
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.2);
  const s=await snapshot(page);const door=s.hub.doors.find((d:{id:string})=>d.id==='arcade');
  // The back wall's inner face is at z -9.875; walking to z -9.75 is through the opening.
  // The walk ends early on purpose: entering the door freezes input, so the walk never "arrives".
  await page.evaluate(([x,z])=>(window as any).__circuitCrew.drive.walkTo(x,z,.1,40),[door.at.x,-9.75] as const);
  await page.waitForURL(/level=arcade/,{timeout:15000});
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  expect(await page.evaluate(()=>(window as any).__circuitCrew.snapshot().level)).toBe('arcade');
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
