import {test,expect} from '@playwright/test';
import {open,snapshot,wait} from './navigation';
type Page=import('@playwright/test').Page;
// DR-15 / R5-166: a required item stranded out of reach, or knocked out of the room, comes back home.
test.describe.configure({timeout:120000});
const place=(page:Page,id:string,at:{x:number;y:number;z:number})=>page.evaluate(([id,at])=>{const p=(window as any).__game.props.find((q:any)=>q.spec.id===id);
  p.body.setTranslation(at,true);p.body.setLinvel({x:0,y:0,z:0},true);},[id,at] as const);
const home=(page:Page,id:string)=>page.evaluate(id=>{const p=(window as any).__game.props.find((q:any)=>q.spec.id===id),t=p.body.translation();return Math.hypot(t.x-p.home.x,t.z-p.home.z);},id);

test('a job item stranded in a space Pip cannot enter goes home after a few seconds',async({page})=>{
  await open(page,'meeting');
  // Drop the power strip on the floor of the sealed server closet (Level.sealed).
  const c=await page.evaluate(()=>{const s=(window as any).__game.level.sealed[0];return {x:(s.minX+s.maxX)/2,y:.3,z:(s.minZ+s.maxZ)/2};});
  await place(page,'strip',c);await wait(page,1);expect(await home(page,'strip')).toBeGreaterThan(3);
  await wait(page,6);expect(await home(page,'strip')).toBeLessThan(.5);
});
test('a job item knocked out of the room comes straight back',async({page})=>{
  await open(page,'playground');
  const id=(await snapshot(page)).items[0].id;
  await place(page,id,{x:40,y:1,z:0});await wait(page,.5);expect(await home(page,id)).toBeLessThan(.5);
});
