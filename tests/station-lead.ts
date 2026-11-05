import {expect,type Page} from '@playwright/test';
import {walk,route,wait,snapshot} from './navigation';
// Station rooms have a mains lead (R5-079): the bench is dead until Pip drags it off its reel and
// seats it in the wall socket. Every station spec plugs it in before the bench can power or test.
type XZ=[number,number];
/** The level's lead: reel anchor, wall socket, length and the clean walk from the plug to the socket. */
export const lead=(page:Page)=>page.evaluate(()=>(window as any).__game.level.stationCable as {anchor:{x:number;z:number};target:{x:number;z:number};length:number;route:XZ[]});
/** Walks `approach` to the loose plug, picks it up (F), drags it along the level's clean route, seats
 *  it (F), then walks `back`. The bench is live afterwards. */
export async function plugBench(page:Page,approach:XZ[]=[],back:XZ[]=[]){
  const l=await lead(page);await route(page,approach);
  await walk(page,l.route[0][0],l.route[0][1],.6);await page.keyboard.press('KeyF');
  let s=await snapshot(page);expect(s.holdingPlug,'picked up the bench plug').toBe(true);expect(s.benchLive).toBe(false);
  for(const [x,z] of l.route.slice(1))await walk(page,x,z,.45);
  await page.keyboard.press('KeyF');await wait(page,.2);
  s=await snapshot(page);expect(s.connected,'bench plug seated').toBe(true);expect(s.benchLive).toBe(true);expect(s.rope.strain).toBeLessThan(1);
  await route(page,back);
  return s;
}
