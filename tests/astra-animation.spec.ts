import {test,expect} from '@playwright/test';
import {walk,wait,snapshot} from './navigation';
test('coworker faces track Pip in the full toon renderer without extra child meshes',async({page})=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/403|Fredoka/.test(m.text()))errors.push(m.text());});
  await page.goto('/?level=meeting&manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();await page.waitForFunction(()=>!!(window as any).__game?.rig);
  // Presentation fixture: change the look target, not the circuit or win state.
  await page.evaluate(()=>{const g=(window as any).__game,n=g.npcs.find((n:any)=>!n.seated)??g.npcs[0];(window as any).__astraActor=n;const p=n.group.position;g.player.setTranslation({x:p.x+2,y:.8,z:p.z+2},true);g.render(1/60);});
  await expect.poll(()=>page.evaluate(()=>Math.abs((window as any).__astraActor.calm.look.x)),{timeout:15000}).toBeGreaterThan(.05);
  expect(await page.evaluate(()=>{const n=(window as any).__astraActor;return n.calm.children.length;})).toBe(0);
  expect(await page.evaluate(()=>{const n=(window as any).__astraActor;return [...n.calm.look.toArray(),...n.calm.geometry.attributes.normal.array].every(Number.isFinite);})).toBe(true);
  expect(errors).toEqual([]);
});


test('a spoiled lunch reaches Pip’s quiet failure pose through real gameplay',async({page})=>{
  test.setTimeout(180000);
  await page.goto('/?level=lunch&manual&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();await page.waitForFunction(()=>!!(window as any).__game?.rig);
  // Opening the kitchen starts the fridge clock. Leave it unpowered; no outcome flags are injected.
  await walk(page,0,1.4,.5);await wait(page,.5);expect((await snapshot(page)).lunch.job.warming).toBe(true);
  await walk(page,.3,-1.3,.4);await walk(page,-3.8,-1.7,.5);await wait(page,161);
  expect((await snapshot(page)).lunch.job.failed).toBe(true);expect((await snapshot(page)).failAt).not.toBeNull();
  await expect.poll(()=>page.evaluate(()=>(window as any).__game.rig.torso.rotation.x)).toBeCloseTo(.12,1);
  // The first beat dips before settling; wait for the reaction rather than sampling mid-dip.
  await expect.poll(()=>page.evaluate(()=>(window as any).__game.rig.body.scale.y)).toBeCloseTo(.98,2);
  const pose=await page.evaluate(()=>{const r=(window as any).__game.rig;return {arms:r.arms.map((a:any)=>a.rotation.x),squash:r.body.scale.y};});
  expect(pose.arms.every((x:number)=>x>-.7&&x<-.15)).toBe(true);expect(pose.squash).toBeCloseTo(.98,1);
  await page.screenshot({path:'artifacts/astra-lunch-failure-pose.png'});
});
