import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';

// Presses the same buttons a player clicks at the bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function steps(page:Page,list:[string,unknown?][]){for(const [n,a] of list)expect((await act(page,n,a)).ok,`${n} ${JSON.stringify(a??'')}`).toBe(true);}
const carts=(pP:number,pR:number,fQ:number,fR:number):[string,unknown][]=>[['set',['pP',pP]],['set',['pR',pR]],['set',['fQ',fQ]],['set',['fR',fR]]];
const circuit=(v:number,r:number,mA:number):[string,unknown][]=>[['set',['eV',v]],['set',['eR',r]],['set',['eI',mA]]];
async function toBench(page:Page){
  await walk(page,-7.2,3.1,.6);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('wheels');
  await walk(page,1.4,-1.5,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  expect((await snapshot(page)).station.wheelsReady).toBe(true);
  await walk(page,0,-1.5,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);
}

test('waterworks: three hidden networks matched with two readings each, then named as circuits',async({page})=>{
  test.setTimeout(150000);
  const errors=await open(page,'waterworks');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Roll the load-wheel cart');
  // Nothing works at the bench before the test loads arrive.
  expect((await act(page,'load','open')).ok).toBe(false);
  await toBench(page);
  await expect(page.locator('.station-panel')).toContainText('HEADER TANK');
  // 1 · Header tank: shut valve + one wheel fixes the equivalent (9 kPa behind 1.5; 6 L/min across 1.5).
  await steps(page,[['load','open']]);expect((await snapshot(page)).station.reading).toEqual({p:9,q:0});
  await steps(page,[['load',6],...carts(9,1.5,6,1.5),['device','pcart'],['device','fcart'],['compare']]);
  let s=(await snapshot(page)).station;expect(s.revealed).toBe(true);expect(s.records[0].tier).toBe(3);
  await wait(page,1);await expect(page.locator('.station-panel')).toContainText('Name it in electronics');
  await steps(page,[...circuit(9,150,60),['check']]);await wait(page,1.5);
  // 2 · Twin pumps: shut valve + bypass hose (open pressure / short flow).
  await steps(page,[['load','open'],['load','short'],...carts(14,4,3.5,4),['compare']]);await wait(page,1);
  await steps(page,[...circuit(14,400,35),['check']]);await wait(page,1.5);
  // 3 · Booster loop: shut valve + the heavy wheel.
  await steps(page,[['load','open'],['load',12],...carts(24,6,4,6),['compare']]);await wait(page,1);
  await steps(page,[...circuit(24,600,40),['check']]);await wait(page,.5);
  s=await snapshot(page);
  expect(s.station.served.map((v:{tier:number})=>v.tier)).toEqual([3,3,3]);
  expect(s.station.served.every((v:{elecFirst:boolean})=>v.elecFirst)).toBe(true);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);expect(s.station.spent).toBe(12);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('waterworks: a cart that only matches one wheel is caught, and a wrong I_N is explained',async({page})=>{
  test.setTimeout(150000);
  await open(page,'waterworks');await wait(page,.1);await toBench(page);
  // Three readings, then a flow cart whose bypass is wrong: COMPARE says which cart and why.
  await steps(page,[['load','open'],['load',2],['load',6],...carts(9,1.5,6,2),['compare']]);
  let s=(await snapshot(page)).station;expect(s.revealed).toBe(false);expect(s.compare).toEqual({pOk:true,fOk:false});
  await wait(page,.1);await expect(page.locator('.station-toast')).toContainText('flow cart');
  await expect(page.locator('.ww-table').last()).toContainText('F-cart');
  // Circuit knobs stay locked until both carts match.
  expect((await act(page,'set',['eV',9])).ok).toBe(false);
  await steps(page,[['set',['fR',1.5]],['compare']]);
  s=(await snapshot(page)).station;expect(s.revealed).toBe(true);expect(s.records[0].tier).toBe(2);
  await wait(page,1);
  // I_N must equal V_th ÷ R_th (shown with subscripts): 20 mA is wrong, the toast says why; fixing it moves on.
  await steps(page,[...circuit(9,150,20),['check']]);
  s=(await snapshot(page)).station;expect(s.mistakes).toBe(1);expect(s.index).toBe(0);
  await expect(page.locator('.station-toast')).toContainText('IN must be Vth ÷ Rth: 9 V ÷ 150 Ω = 60 mA');
  await expect(page.locator('.station-toast sub')).toHaveCount(3);
  await steps(page,[['set',['eI',60]],['check']]);await wait(page,1.5);
  s=(await snapshot(page)).station;expect(s.index).toBe(1);expect(s.served[0]).toEqual({net:'header',tier:2,elecFirst:false});
  // Stepping back from the bench returns the keys to walking.
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
});
