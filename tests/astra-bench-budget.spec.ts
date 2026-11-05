import {test,expect,type Page} from '@playwright/test';
import {walk,route,wait,snapshot} from './navigation';
import {plugBench} from './station-lead';
test.describe.configure({timeout:300000});
async function sameObject(page:Page,name:RegExp){await wait(page,.1);await expect(page.locator('.objective .cur')).toContainText(name);await expect(page.locator('.prompt-pill')).toContainText(name);}
async function prepare(page:Page,level:string){
 await page.goto(`/?level=${level}&manual&lowfx`);await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();
 const approach:[number,number][]=level==='spectrum'?[[-6.3,3.6],[-6.4,1.2]]:[];
 const back:[number,number][]=level==='spectrum'?[[-8.6,1.5],[-6.4,1.45]]:level==='qfn'?[[9,-5],[8.6,-3],[6.2,-2.6],[3.3,0],[1.3,-.4]]:[];
 await plugBench(page,approach,back);
 if(level==='arcade'){
  await route(page,[[-5.5,6.6],[-7.2,5.8]]);await walk(page,-8.3,4.4,.3);await sameObject(page,/tray|blocks/i);await page.keyboard.press('KeyE');await sameObject(page,/tray|blocks/i);
  await route(page,[[-7.2,5.8],[-5.5,6.4]]);await walk(page,1.2,-1.3,.5);await page.keyboard.press('KeyE');await wait(page,.2);await walk(page,0,-1.55,.4);
 }else if(level==='garage'){
  await walk(page,6.4,-4.2,.5);await sameObject(page,/robot/i);await page.keyboard.press('KeyE');await sameObject(page,/robot/i);await route(page,[[3.4,-4],[2.5,-4.4]]);await page.keyboard.press('KeyE');await wait(page,.3);await route(page,[[2.9,-4],[2.9,-1.1]]);await walk(page,0,-1.55,.4);
 }else if(level==='qfn'){
  await walk(page,-8.8,2.95,.5);await sameObject(page,/crate|parts/i);await page.keyboard.press('KeyE');await sameObject(page,/crate|parts/i);await walk(page,1.3,-.6,.5);await page.keyboard.press('KeyE');await wait(page,.2);await walk(page,0,-.5,.4);
 }else if(level==='observatory'){
  await walk(page,-3.7,-.1,.6);await sameObject(page,/cart|motor/i);await page.keyboard.press('KeyE');await sameObject(page,/cart|motor/i);await walk(page,-6,3.5,.6);await page.keyboard.press('KeyE');await wait(page,.3);await walk(page,0,-1.55,.4);
 }else{
  await walk(page,-6.4,6.4,.6);await sameObject(page,/pod|receiver/i);await page.keyboard.press('KeyE');await sameObject(page,/pod|receiver/i);await route(page,[[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await page.keyboard.press('KeyE');await route(page,[[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);await walk(page,-3.5,3.55,.4);
 }
 await page.keyboard.press('KeyE');await wait(page,.4);expect((await snapshot(page)).atBench).toBe(true);
}
for(const level of ['arcade','garage','qfn','observatory','spectrum'])test(`${level}: clean-route task names and shared bench word budget`,async({page},testInfo)=>{
 await prepare(page,level);
 const report=await page.evaluate(()=>{
  const panels=[...document.querySelectorAll<HTMLElement>('.station-panel,.station-toast,.objective,.prompt-pill,.bench-chip')].filter(el=>!el.hidden&&el.getBoundingClientRect().width>0);
  const text=panels.map(el=>el.innerText.trim()).join(' '),words=text.match(/[\p{L}\p{N}]+(?:['.-][\p{L}\p{N}]+)*/gu)??[];
  const small=panels.flatMap(el=>[el,...el.querySelectorAll<HTMLElement>('*')]).filter(el=>el.getBoundingClientRect().width>0&&el.childElementCount===0&&(el.innerText??'').trim()).filter(el=>parseFloat(getComputedStyle(el).fontSize)<14).map(el=>({text:el.innerText,size:getComputedStyle(el).fontSize}));
  return {text,words:words.length,small};
 });
 await testInfo.attach('shared-ui-word-budget',{body:JSON.stringify(report,null,2),contentType:'application/json'});await page.screenshot({path:`artifacts/astra-${level}-bench.png`});
 expect.soft(report.small,'Visible shared HTML labels must be at least 14 CSS px').toEqual([]);
 expect(report.words,'DR-40 shared HTML word budget; canvas monitor copy is separately owned by Claude').toBeLessThanOrEqual(25);
});
