import {test,expect} from '@playwright/test';
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
