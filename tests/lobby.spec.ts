import {test,expect,type Page} from '@playwright/test';
import {walk,wait,snapshot} from './navigation';

// The back wall's room edge, z = -depth/2; its inner face is 12.5 cm in from it (SHELL_THICK/2). Read
// from the level so the probes follow the room's size.
const backEdge=(page:Page)=>page.evaluate(()=>-(window as any).__game.level.depth/2 as number);

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
  // A ray from 1 m inside the back edge toward the wall (inner face 0.875 m away) at waist or lintel height.
  const z0=await backEdge(page)+1;
  const toi=(x:number,y:number)=>page.evaluate(([x,y,z])=>{const G=(window as any).__game;
    const hit=G.world.castRay({origin:{x,y,z},dir:{x:0,y:0,z:-1}},2,true,undefined,undefined,undefined,undefined,(c:any)=>!!c.parent()?.isFixed());
    return hit?hit.timeOfImpact:-1;},[x,y,z0] as const);
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
  // The back wall's inner face is 12.5 cm in from the edge; walking to 25 cm in is through the opening.
  // The walk ends early on purpose: entering the door freezes input, so the walk never "arrives".
  const back=await backEdge(page);
  await page.evaluate(([x,z])=>(window as any).__circuitCrew.drive.walkTo(x,z,.1,40),[door.at.x,back+.25] as const);
  await page.waitForURL(/level=arcade/,{timeout:15000});
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  expect(await page.evaluate(()=>(window as any).__circuitCrew.snapshot().level)).toBe('arcade');
});

test('sliding along the back wall past an open door stays in the lobby',async({page})=>{
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.2);
  const s=await snapshot(page),door=s.hub.doors.find((d:{id:string})=>d.id==='arcade');expect(door.locked).toBe(false);
  const back=await backEdge(page);
  // Set Pip down inside the Arcade door's walk-in strip (within 45 cm of the wall face, in front of the
  // gap), then steer him sideways along the wall across it: he stays in the lobby.
  await page.evaluate(([x,z])=>{const G=(window as any).__game,p=G.player.translation();G.player.setTranslation({x,y:p.y,z},true);},[door.at.x-.4,back+.5] as const);
  await page.evaluate(([x,z])=>(window as any).__circuitCrew.drive.walkTo(x,z,.1,3),[door.at.x+.4,back+.5] as const);
  const p=(await snapshot(page)).player;expect(Math.abs(p.x-door.at.x)).toBeLessThan(.5);expect(p.z).toBeLessThan(back+.57);
  // Entering a door marks the HUD with data-leaving and drops a veil before the job loads.
  const leaving=()=>page.evaluate(()=>document.querySelector<HTMLElement>('[data-leaving]')?.dataset.leaving??null);
  expect(await leaving()).toBeNull();expect((await snapshot(page)).level).toBe('lobby');
  // From the same spot, steering into the wall goes through.
  await page.evaluate(([x,z])=>(window as any).__circuitCrew.drive.walkTo(x,z,.1,3),[door.at.x,back+.25] as const);
  expect(await leaving()).toBe('arcade');
});

test('the Workshop arch opens a practice picker; practice runs are flagged and never recorded',async({page})=>{
  await page.goto('/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await wait(page,.2);
  // The arch moves with the walls (workshopSpot in src/levels/lobby.ts): walk to wherever it stands.
  const shop=await page.evaluate(()=>(window as any).__game.hub.workshopAt as {x:number;z:number});
  await walk(page,shop.x,shop.z,.5);await wait(page,.1);
  await expect(page.locator('.prompt-pill')).toContainText('Workshop');
  await page.keyboard.press('KeyE');await expect(page.locator('.workshop-picker')).toBeVisible();
  await expect(page.locator('.workshop-picker [data-practice]')).not.toHaveCount(0);
  await Promise.all([page.waitForURL(/level=arcade&practice/),page.locator('.workshop-picker [data-practice="arcade"]').click()]);
  await expect(page.locator('body')).toHaveAttribute('data-practice','true');
});
