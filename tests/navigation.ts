import {expect,type Page} from '@playwright/test';
// Pages opened with ?manual advance simulated time only when a test asks, so routes are
// deterministic regardless of how fast the headless renderer draws frames.
export const snapshot=(page:Page)=>page.evaluate(()=>(window as any).__circuitCrew.snapshot());
export async function open(page:Page,level?:string){
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(level?`/?level=${level}&manual`:'/?manual');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Start playing'}).click();return errors;
}
export const wait=(page:Page,seconds:number,keys:string[]=[])=>page.evaluate(([s,k])=>(window as any).__circuitCrew.drive.advance(s,k),[seconds,keys] as const);
export async function walk(page:Page,x:number,z:number,radius=.5,limit=40){
  const result=await page.evaluate(([x,z,r,l])=>(window as any).__circuitCrew.drive.walkTo(x,z,r,l),[x,z,radius,limit] as const);
  if(!result.arrived)throw new Error(`Walk stuck toward ${x},${z} at ${JSON.stringify(result.state.player)}: ${JSON.stringify(result.state)}`);
  return result.state;
}
export async function route(page:Page,points:[number,number][],radius=.5){for(const [x,z] of points)await walk(page,x,z,radius);}
