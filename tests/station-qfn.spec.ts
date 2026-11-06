import {test,expect,type Page} from '@playwright/test';
import {open,walk,wait,snapshot} from './navigation';
import {plugBench} from './station-lead';
import {BOARDS,REFERENCE} from '../src/stations/qfn/logic';

// Presses the same buttons a player clicks at the bench (drive.act).
const act=(page:Page,name:string,arg?:unknown)=>page.evaluate(([n,a])=>(window as any).__circuitCrew.drive.act(n,a),[name,arg] as const);
async function ok(page:Page,name:string,arg?:unknown){expect((await act(page,name,arg)).ok,`${name} ${JSON.stringify(arg)??''}`).toBe(true);}
async function toBench(page:Page){
  await walk(page,-8.8,2.95,.5);await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBe('parts');
  await walk(page,1.3,-.6,.5);await page.keyboard.press('KeyE');await wait(page,.2);
  expect((await snapshot(page)).station.partsReady).toBe(true);
  // SHIP's bring-up test needs the bench lead plugged in at the back wall (R5-079).
  await plugBench(page,[],[[9,-5],[8.6,-3],[6.2,-2.6],[3.3,0],[1.3,-.4]]);
  await walk(page,0,-.5,.4);await page.keyboard.press('KeyE');expect((await snapshot(page)).atBench).toBe(true);await wait(page,1.2);
}
/** SHIP on a board that works runs a short bring-up test on the bench before the next board loads. */
async function ship(page:Page){await ok(page,'ship');expect((await snapshot(page)).station.testing).toBe(true);await wait(page,2.5);expect((await snapshot(page)).station.testing).toBe(false);}
/** Lays out a board exactly as its reference route: the right header, parts, top-layer tracks, vias, then layer 2. */
async function playReference(page:Page,ix:number){
  const b=BOARDS[ix],ref=REFERENCE[b.id];
  if(b.spare&&!!(await snapshot(page)).station.design.place[b.spare.part].flip!==!!ref.place[b.spare.part].flip)await ok(page,'swap');
  const now=(await snapshot(page)).station.design.place;
  for(const [id,pl] of Object.entries(ref.place)){const p=b.parts.find(q=>q.id===id)!;if(p.locked||p.kind==='qfn'||(now[id].at+''===pl.at+''&&now[id].rot===pl.rot))continue;await ok(page,'move',{part:id,at:pl.at,rot:pl.rot});}
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
  await expect(page.locator('.station-panel header')).toContainText('Tracks cannot cross');
  for(let ix=0;ix<BOARDS.length;ix++){
    await playReference(page,ix);
    await expect(page.locator('.station-panel header')).toContainText('Copper');
    await expect(page.locator('.station-panel .build')).toContainText('Elegant');
    if(ix>0)await expect(page.locator('.station-panel .build')).toContainText('loop');
    if(ix===2)await expect(page.locator('.station-panel .build')).toContainText('Chip °C');
    const feedback=await page.evaluate(()=>{const g=(window as any).__game;return Math.max(0,(g.station.toastUntil??0)-g.time)+.2;});await wait(page,feedback);
    const words=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('.station-panel,.station-toast,.objective,.prompt-pill,.bench-chip')].filter(el=>!el.hidden&&el.getBoundingClientRect().width>0).map(el=>el.innerText).join(' ').match(/[\p{L}\p{N}]+(?:['.-][\p{L}\p{N}]+)*/gu)?.length??0);
    console.log(JSON.stringify({board:BOARDS[ix].id,phase:'ready',words}));expect(words).toBeLessThanOrEqual(25);
    await page.screenshot({path:`artifacts/astra-qfn-board-${ix+1}-ready.png`});
    const s=(await snapshot(page)).station;expect(s.report.tier,`${BOARDS[ix].id}: ${s.report.problems.join(' ')} ${s.report.notes.join(' ')}`).toBe(3);
    await ok(page,'check');await expect(page.locator('.station-toast')).toContainText('Elegant');
    // The power-on test lit the chip's status LED steady (nothing resets on a reliable board).
    if(ix<BOARDS.length-1){await ship(page);expect((await snapshot(page)).station.boardId).toBe(BOARDS[ix+1].id);await expect(page.locator('.station-panel header')).toContainText(ix===0?'Keep the MCU running':'Two layers');}else await ok(page,'ship');
  }
  await wait(page,.1);const s=await snapshot(page);
  expect(s.station.shipped.map((v:{tier:number})=>v.tier)).toEqual([3,3,3]);
  expect(s.won).toBe(true);expect(s.station.mistakes).toBe(0);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true',{timeout:8000});
  // Two of three: the tidy run skips the room's chaos bonus (earned in station-cable.spec).
  await expect(page.locator('.result-bonus li.ok')).toHaveCount(2);
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
  await ship(page);s=(await snapshot(page)).station;
  expect(s.board).toBe(1);expect(s.shipped[0].tier).toBe(3);
  await page.keyboard.press('Escape');expect((await snapshot(page)).atBench).toBe(false);
});

test('QFN bench: the mirrored header can\'t route on one layer; a board that only works shows its flaw on the bring-up test',async({page})=>{
  test.setTimeout(120000);
  await open(page,'qfn');await wait(page,.1);await toBench(page);
  // Board 1 arrives with the mirrored header: placed on an edge it reports the pin order, and the prompt
  // points at the spare once a track hits a short.
  await ok(page,'move',{part:'J1',at:[3,8],rot:3});
  let s=(await snapshot(page)).station;expect(s.report.problems.join(' ')).toMatch(/pins run the other way round/);
  await ok(page,'check');await expect(page.locator('.station-toast')).toContainText('spare header');
  await ok(page,'swap');s=(await snapshot(page)).station;expect(s.design.place.J1.flip).toBe(false);
  expect(s.report.problems.join(' ')).not.toMatch(/other way round/);
  await ok(page,'undo');expect((await snapshot(page)).station.design.place.J1.flip).toBe(true);await ok(page,'swap');
  await playReference(page,0);await ship(page);
  // Board 2 with C2 down in the far corner: it works, but the bring-up test shows the MCU resetting.
  const far=structuredClone(REFERENCE.mcu);far.place.C2={at:[11,7],rot:1};far.traces=far.traces.filter(t=>!t.cells.some(c=>c[0]===9&&c[1]===5));
  far.traces.push({layer:1,net:'GND',cells:[[3,4],[3,5],[3,6],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[10,8],[11,8]]},
    {layer:1,net:'GND',cells:[[8,5],[9,5],[10,5],[10,6],[10,7]]},{layer:1,net:'VDD',cells:[[9,4],[10,4],[11,4],[11,5],[11,6],[11,7]]});
  for(const [id,pl] of Object.entries(far.place))if(id!=='U1')await ok(page,'move',{part:id,at:pl.at,rot:pl.rot});
  for(const t of far.traces)await ok(page,'trace',{cells:t.cells,layer:1});
  s=(await snapshot(page)).station;expect(s.report.problems).toEqual([]);expect(s.report.tier).toBe(1);
  await ok(page,'check');await expect(page.locator('.station-toast')).toContainText('inductance');
  await ok(page,'ship');await expect(page.locator('.station-toast')).toContainText('resets when it gets busy');
  s=(await snapshot(page)).station;expect(s.testing).toBe(true);expect(s.mistakes).toBe(0);
  await wait(page,2.5);s=(await snapshot(page)).station;expect(s.board).toBe(2);expect(s.shipped.map((v:{tier:number})=>v.tier)).toEqual([3,1]);
  // Board 3's chip is cold until VIN and GND reach it.
  expect(s.report.thermal).toMatchObject({powered:false,temp:25});
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
  // No tools: grab C1 by its body (between its pads) and drag it from its start (10,7) to (2,4).
  const bodies=(await snapshot(page)).station.bodies as Record<string,[number,number]>;
  await page.mouse.move(...bodies.C1);expect((await snapshot(page)).station.hoverBody).toBe('C1');
  await page.mouse.down();const [gx,gy]=(await snapshot(page)).station.drag.grab as [number,number];
  for(const k of [[9,6],[6,5],[3,4],[2,4]])await page.mouse.move(...c[`${k[0]+gx},${k[1]+gy}`],{steps:3});await page.mouse.up();
  let s=(await snapshot(page)).station;expect(s.design.place.C1.at).toEqual([2,4]);
  // Press and hold on R1's far pad (its end cap, not its body), then drag: the part moves and no track is drawn.
  c=await cells();await page.mouse.move(...c['1,2']);expect((await snapshot(page)).station.hoverBody).toBe(null);
  await page.mouse.down();await page.waitForTimeout(450);
  for(const k of ['1,3','1,5','1,7'])await page.mouse.move(...c[k],{steps:3});await page.mouse.up();
  s=(await snapshot(page)).station;expect(s.design.place.R1.at).toEqual([1,6]);expect(s.design.traces).toHaveLength(0);
  // Dragging from a pad draws: from U1 pin 1 at (4,3) left to (2,3), then down to (2,8).
  c=await cells();
  await page.mouse.move(...c['4,3']);await page.mouse.down();for(const k of ['3,3','2,3','2,5','2,8'])await page.mouse.move(...c[k],{steps:4});await page.mouse.up();
  s=(await snapshot(page)).station;expect(s.design.traces).toHaveLength(1);
  expect(s.design.traces[0]).toMatchObject({net:'VDD',layer:1});expect(s.design.traces[0].cells[0]).toEqual([4,3]);expect(s.design.traces[0].cells.at(-1)).toEqual([2,8]);
  // A tap on the track cuts it there.
  await page.mouse.click(...c['2,6']);s=(await snapshot(page)).station;expect(s.design.traces.flatMap((t:{cells:number[][]})=>t.cells).some((x:number[])=>x[0]===2&&x[1]===6)).toBe(false);
  // Clicking the CHECK button on the bench runs the check.
  await page.keyboard.press('KeyC');expect((await snapshot(page)).station.checks).toBe(1);
});


test('QFN bench: losing focus cancels an unfinished drag without moving the part',async({page})=>{
 test.setTimeout(180000);await open(page,'qfn');await toBench(page);
 await expect.poll(async()=>{const s=(await snapshot(page)).station;await page.mouse.move(...s.bodies.C1);return (await snapshot(page)).station.hoverBody;}).toBe('C1');
 const before=(await snapshot(page)).station.design.place.C1;
 await page.mouse.down();expect((await snapshot(page)).station.drag).not.toBeNull();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 expect((await snapshot(page)).paused).toBe(true);expect((await snapshot(page)).station.drag).toBeNull();
 await page.mouse.up();await page.getByRole('button',{name:'Resume',exact:true}).click();await wait(page,.1);
 expect((await snapshot(page)).station.design.place.C1).toEqual(before);
 await page.mouse.move(20,20);await page.mouse.up();expect((await snapshot(page)).station.design.place.C1).toEqual(before);
 const planted=(await snapshot(page)).player;
 await page.evaluate(()=>{const pad={axes:[1,1,1,1],buttons:Array.from({length:17},()=>({pressed:false,value:0})),connected:true,index:0,id:'test pad',mapping:'standard',timestamp:0};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});});
 await wait(page,.7);const now=(await snapshot(page)).player;expect(Math.hypot(now.x-planted.x,now.z-planted.z)).toBeLessThan(.05);
 await page.getByRole('button',{name:'Pause',exact:true}).click();await page.locator('.bench-notes summary').focus();await page.keyboard.press('Space');await expect(page.locator('.bench-notes p')).toBeVisible();
});
