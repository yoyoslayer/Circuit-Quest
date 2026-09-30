import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';
import {BOARDS,REFERENCE} from '../src/stations/qfn/logic';

// Presses the same buttons a player clicks at the bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function ok(page:Page,name:string,arg?:unknown){expect((await act(page,name,arg)).ok,`${name} ${JSON.stringify(arg)??''}`).toBe(true);}
async function toBench(page:Page){
  await walk(page,-8.8,2.95,.5);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('parts');
  await walk(page,1.3,-.6,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  expect((await snapshot(page)).station.partsReady).toBe(true);
  await walk(page,0,-.5,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);await wait(page,1.2);
}
/** Lays out a board exactly as its reference route: parts, top-layer tracks, vias, then layer 2. */
async function playReference(page:Page,ix:number){
  const b=BOARDS[ix],ref=REFERENCE[b.id];
  for(const [id,pl] of Object.entries(ref.place)){const p=b.parts.find(q=>q.id===id)!;if(p.locked||p.kind==='qfn')continue;await ok(page,'move',{part:id,at:pl.at,rot:pl.rot});}
  for(const t of ref.traces.filter(t=>t.layer===1))await ok(page,'trace',{cells:t.cells,layer:1});
  for(const v of ref.vias)await ok(page,'via',v.at);
  const l2=ref.traces.filter(t=>t.layer===2);if(l2.length){await ok(page,'layer',2);for(const t of l2)await ok(page,'trace',{cells:t.cells,layer:2});}
}

test('QFN bench: three boards laid out, each reliable and at par',async({page})=>{
  test.setTimeout(180000);
  const errors=await open(page,'qfn');await wait(page,.1);
  await expect(page.locator('.objective')).toContainText('Bring the parts crate');
  // Nothing can be placed before the parts arrive.
  expect((await act(page,'rotate','R1')).ok).toBe(false);
  await toBench(page);
  await expect(page.locator('.station-panel')).toContainText('Sensor breakout');
  for(let ix=0;ix<BOARDS.length;ix++){
    await playReference(page,ix);
    const s=(await snapshot(page)).station;expect(s.report.tier,`${BOARDS[ix].id}: ${s.report.problems.join(' ')} ${s.report.notes.join(' ')}`).toBe(3);
    await ok(page,'check');await expect(page.locator('.station-toast')).toContainText('Elegant');
    await ok(page,'ship');
    if(ix<BOARDS.length-1)await expect(page.locator('.station-panel')).toContainText(BOARDS[ix+1].title);
  }
  await wait(page,.1);const s=await snapshot(page);
  expect(s.station.shipped.map((v:{tier:number})=>v.tier)).toEqual([3,3,3]);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('QFN bench: a board shipped with the connector inside is sent back, then fixed; tracks refuse to short',async({page})=>{
  test.setTimeout(120000);
  await open(page,'qfn');await wait(page,.1);await toBench(page);
  // Shipping the scrambled board: rejected, one mistake, the reason shown.
  await ok(page,'ship');let s=(await snapshot(page)).station;
  expect(s.mistakes).toBe(1);expect(s.board).toBe(0);expect(s.rings).toBeGreaterThan(0);
  await expect(page.locator('.station-toast')).toContainText('J1 must sit on a board edge');
  // A move onto another part is refused with a reason; so is a track that would join two nets.
  expect((await act(page,'move',{part:'R1',at:[10,1]})).ok).toBe(false);
  await expect(page.locator('.station-toast')).toContainText('overlap');
  await playReference(page,0);
  // The send-back's problem rings described the old layout: moving parts cleared them.
  expect((await snapshot(page)).station.rings).toBe(0);
  expect((await act(page,'trace',{cells:[[9,4],[9,5],[9,6],[9,7],[8,7],[7,7],[6,7],[5,7],[4,7],[3,7]],layer:1})).ok).toBe(false);
  await expect(page.locator('.station-toast')).toContainText('short');
  // Layer 2 stays locked on the single-layer board.
  expect((await act(page,'layer',2)).ok).toBe(false);
  // Undo takes back the last track; the net opens again, then it is redrawn.
  await ok(page,'undo');s=(await snapshot(page)).station;expect(s.report.nets.find((n:{net:string})=>n.net==='SIG').done).toBe(false);
  await ok(page,'trace',{cells:REFERENCE.sensor.traces[3].cells,layer:1});
  await ok(page,'ship');s=(await snapshot(page)).station;
  expect(s.board).toBe(1);expect(s.shipped[0].tier).toBe(3);
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
});

test('QFN bench: the real pointer drags a part and draws a track',async({page})=>{
  test.setTimeout(120000);
  await open(page,'qfn');await wait(page,.1);await toBench(page);
  // The bench camera eases in on real animation frames; wait until the pointer lands where the
  // projected cell centres say (corner cells map back to themselves).
  const cells=async()=>{for(let i=0;i<40;i++){const c=(await snapshot(page)).station.cells as Record<string,[number,number]>;let good=true;
    for(const k of ['0,0','12,8']){await page.mouse.move(...c[k]);if(JSON.stringify((await snapshot(page)).station.hover)!==`[${k}]`)good=false;}
    if(good)return c;await page.waitForTimeout(500);}throw new Error('bench camera never settled');};
  let c=await cells();
  // MOVE tool (the default): drag C1 by its first pad from its start (10,7) to (2,4).
  await page.mouse.move(...c['10,7']);await page.mouse.down();for(const k of ['9,6','6,5','3,4','2,4'])await page.mouse.move(...c[k],{steps:3});await page.mouse.up();
  let s=(await snapshot(page)).station;expect(s.design.place.C1.at).toEqual([2,4]);
  // PEN (T): from U1 pin 1 at (4,3) left to (2,3), then down to (2,8).
  await page.keyboard.press('KeyT');expect((await snapshot(page)).station.tool).toBe('pen');c=await cells();
  await page.mouse.move(...c['4,3']);await page.mouse.down();for(const k of ['3,3','2,3','2,5','2,8'])await page.mouse.move(...c[k],{steps:4});await page.mouse.up();
  s=(await snapshot(page)).station;expect(s.design.traces).toHaveLength(1);
  expect(s.design.traces[0]).toMatchObject({net:'VDD',layer:1});expect(s.design.traces[0].cells[0]).toEqual([4,3]);expect(s.design.traces[0].cells.at(-1)).toEqual([2,8]);
  // Clicking the CHECK button on the bench runs the check.
  await page.keyboard.press('KeyC');expect((await snapshot(page)).station.checks).toBe(1);
});

test.describe('phone QFN bench',()=>{
  test.use({viewport:{width:390,height:844},hasTouch:true});
  test('both tool racks fit, and touch can select PEN and CHECK the board',async({page},testInfo)=>{
    test.setTimeout(120000);
    const errors=await open(page,'qfn');await wait(page,.1);await toBench(page);
    await expect.poll(async()=>{
      const tools=(await snapshot(page)).station.tools as Record<string,[number,number]>;
      return Object.values(tools).every(([x,y])=>x>12&&x<378&&y>190&&y<650);
    }).toBe(true);
    let s=(await snapshot(page)).station;
    await page.touchscreen.tap(...s.tools.pen);expect((await snapshot(page)).station.tool).toBe('pen');
    s=(await snapshot(page)).station;
    await page.touchscreen.tap(...s.tools.check);expect((await snapshot(page)).station.checks).toBe(1);
    await testInfo.attach('phone-qfn',{body:await page.screenshot(),contentType:'image/png'});
    await page.locator('.bench-chip').tap();expect((await snapshot(page)).atBench).toBe(false);
    expect(errors).toEqual([]);
  });
});
