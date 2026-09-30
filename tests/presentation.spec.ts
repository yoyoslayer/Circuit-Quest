import {test,expect} from '@playwright/test';
import {open,wait,snapshot} from './navigation';
test.setTimeout(120000);
test('Pip moves real boot meshes and the office furniture settles without spinning',async({page})=>{
  const errors=await open(page,'meeting');await wait(page,8);
  const inspect=()=>page.evaluate(()=>(window as any).__circuitCrew.drive.inspect());
  await expect.poll(async()=>(await inspect()).rig?.legs[0]).toContain('BootLSole');
  const before=await inspect();expect(before.physics.fastestAngular).toBeLessThan(.1);
  expect(before.walls).toHaveLength(4);expect(before.walls.every((w:{height:number})=>w.height>=3.5)).toBe(true);
  // Real-time frames during manual advances distinguish mesh animation from empty pivot rotation.
  const spreads:number[]=[];
  for(let i=0;i<12;i++){
    await wait(page,.03,['KeyD']);await page.waitForTimeout(20);
    const {boots}=(await inspect()).rig;
    spreads.push(Math.hypot(boots[0].x-boots[1].x,boots[0].z-boots[1].z));
  }
  // The legs pass through neutral twice per cycle: inspect the peak, not an
  // arbitrary last animation frame whose phase depends on rendering speed.
  expect(Math.max(...spreads)).toBeGreaterThan(.4);
  expect(errors).toEqual([]);
});
test('a coworker stands on the floor when their chair is carried away',async({page})=>{
  await open(page,'meeting');await wait(page,.5);
  await page.evaluate(()=>{
    const c=(window as any).__circuitCrew;
    return c.drive.walkTo(-6.85,-6.55,.4);
  });
  await page.keyboard.press('KeyE');
  expect((await snapshot(page)).held).toBe('chair');
  await wait(page,.1);
  const people=await page.evaluate(()=>(window as any).__circuitCrew.drive.inspect().npcs);
  expect(people.some((n:any)=>Math.abs(n.pos.x+6.85)<.2&&Math.abs(n.pos.z+5.98)<.2&&!n.seated&&n.baseY===0)).toBe(true);
});
