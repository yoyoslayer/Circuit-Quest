import {test,expect} from '@playwright/test';
import {open} from './navigation';

// Nothing a level places may start out buried in a wall, a fixture or another prop: overlapping
// props jump apart on the first physics step, and coworkers or Pip inside furniture look broken.
const LEVELS=['','playground','meeting','lunch','arcade','arcade-rush','garage','qfn','observatory','spectrum'];
test.describe.configure({timeout:120000});
for(const level of LEVELS){
  test(`layout: nothing starts overlapping in ${level||'the lobby'}`,async({page})=>{
    const errors=await open(page,level||undefined);
    const found=await page.evaluate(()=>(window as any).__circuitCrew.drive.audit());
    if(found.length)console.log(`${level||'lobby'}:\n${found.map((f:{a:string;b:string;depth:number})=>`  ${f.a}  ×  ${f.b}  (${f.depth} m)`).join('\n')}`);
    expect(found).toEqual([]);expect(errors).toEqual([]);
  });
}
