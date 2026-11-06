import {test,expect,type Page} from '@playwright/test';
import {open,snapshot,wait} from './navigation';
// Review 6 game.ts fixes (mockups/review6/CODE_REVIEW.md): put-downs, respawns, fixed items, the Meeting
// strip's seated plug, the idle hint, mouse chords and bench drags, and the gamepad at a bench and after a win.
test.describe.configure({timeout:120000});
/** Puts a light fragile clutter prop (no job id) into Pip's hands and returns its index in game.props. */
const carry=(page:Page)=>page.evaluate(()=>{const g=(window as any).__game,i=g.props.findIndex((p:any)=>!p.spec.id&&['mug','plant','lamp','monitor'].includes(p.spec.kind)&&p.body.isDynamic());g.held=g.props[i];return i;});
/** Horizontal speed (a put-down still falls from chest height under gravity). */
const speedOf=(page:Page,i:number)=>page.evaluate(i=>{const v=(window as any).__game.props[i].body.linvel();return Math.hypot(v.x,v.z);},i);
/** A fake gamepad the page reads through navigator.getGamepads (set window.__pad to change it). */
const fakePad=(page:Page)=>page.addInitScript(()=>{const w=window as any;w.__pad={id:'test pad',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};
  Object.defineProperty(navigator,'getGamepads',{value:()=>[w.__pad],configurable:true});});
const press=(page:Page,i:number,on:boolean)=>page.evaluate(([i,on])=>{(window as any).__pad.buttons[i].pressed=on;},[i,on] as const);

test('putting a carried prop down at a sprint sets it down instead of launching or breaking it (game-a-01, game-a-07)',async({page})=>{
  await open(page,'playground');await wait(page,2.2);
  const i=await carry(page);await wait(page,.6,['KeyD','ShiftLeft']);
  await page.keyboard.press('KeyE');expect((await snapshot(page)).held).toBeUndefined();
  // Keep sprinting through where it was set down.
  let fastest=0;for(let k=0;k<30;k++){await wait(page,1/60,['KeyD','ShiftLeft']);fastest=Math.max(fastest,await speedOf(page,i));}
  const s=await snapshot(page);expect(fastest).toBeLessThan(3);expect(s.damage).toBe(0);expect(s.beats.some((b:{kind:string})=>b.kind==='break')).toBe(false);
});
test('a fast prop sent home by a respawn is not counted broken there (game-b-3)',async({page})=>{
  await open(page,'meeting');await wait(page,2.2);
  await page.evaluate(()=>{const g=(window as any).__game,p=g.props.find((q:any)=>!q.spec.id&&q.spec.kind==='mug');p.body.setTranslation({x:40,y:1,z:0},true);p.body.setLinvel({x:12,y:0,z:0},true);p.lastSpeed=12;});
  await wait(page,.5);const s=await snapshot(page);expect(s.damage).toBe(0);expect(s.cost).toBe(0);
});
test('fixed items a station has taken cannot be grabbed; the strip and the second reel still can (game-a-03)',async({page})=>{
  await open(page,'meeting');
  const r=await page.evaluate(()=>{const g=(window as any).__game,pip=g.player.translation(),put=(p:any)=>p.body.setTranslation({x:pip.x+.8,y:p.body.translation().y,z:pip.z},true);
    const mug=g.props.find((q:any)=>!q.spec.id&&q.spec.kind==='mug');put(mug);mug.body.setBodyType(1,true);const fixedMug=g.nearest()===mug;
    mug.body.setTranslation(mug.home,true);const ext=g.props.find((q:any)=>q.spec.id==='extension');put(ext);return {fixedMug,ext:g.nearest()===ext,extFixed:ext.body.isFixed()};});
  expect(r).toEqual({fixedMug:false,ext:true,extFixed:true});
});
test('Meeting: a seated plug follows the strip to its inlet and comes out when the strip is lifted (game-a-05)',async({page})=>{
  await open(page,'meeting');
  // Plugged in at the door before the strip arrives: it waits where the inlet will be.
  await page.evaluate(()=>{const g=(window as any).__game;g.connected=true;g.plugPosition.copy(g.seatAt());});await wait(page,.1);
  const place=()=>page.evaluate(()=>{const g=(window as any).__game,s=g.props.find((q:any)=>q.spec.id==='strip'),t=g.level.target;s.body.setTranslation({x:t.x+.4,y:.08,z:t.z+.5},true);s.body.setLinvel({x:0,y:0,z:0},true);s.body.setBodyType(1,true);});
  await place();await wait(page,.1);
  const gap=()=>page.evaluate(()=>{const g=(window as any).__game;return g.plugPosition.distanceTo(g.strip.seatAt());});
  let s=await snapshot(page);expect(s.stripPlaced).toBe(true);expect(s.connected).toBe(true);expect(await gap()).toBeLessThan(.02);
  // Lifting the strip pulls the plug out.
  await page.evaluate(()=>{const g=(window as any).__game;const st=g.props.find((q:any)=>q.spec.id==='strip');st.body.setBodyType(0,true);g.held=st;});await wait(page,.1);
  s=await snapshot(page);expect(s.connected).toBe(false);expect(s.electrical).not.toBe('on');
});
test('the idle hint route always ends at the socket, even when the lane collapses to the plug (game-b-6)',async({page})=>{
  await open(page,'playground');
  const r=await page.evaluate(()=>{const g=(window as any).__game;g.plugPosition.set(8.8,.22,-4.6);const p=g.hintRoute();return {n:p.length,end:p[p.length-1],target:g.level.target};});
  expect(r.n).toBeGreaterThanOrEqual(2);expect(r.end.x).toBeCloseTo(r.target.x);expect(r.end.z).toBeCloseTo(r.target.z);
});
test('Lunch: the fail shot stamps its start so the camera swings to it in real play (game-b-4)',async({page})=>{
  await open(page,'lunch');
  expect(await page.evaluate(()=>{const g=(window as any).__game;g.won=true;g.lunchFailed();return g.winAt>0;})).toBe(true);
});
test('mouse chords: a left click while orbiting grabs, and releasing right first ends the orbit (game-a-06)',async({page})=>{
  await open(page,'meeting');
  await page.evaluate(()=>{const g=(window as any).__game,pip=g.player.translation(),mug=g.props.find((q:any)=>!q.spec.id&&q.spec.kind==='mug');mug.body.setTranslation({x:pip.x+.7,y:.3,z:pip.z},true);});
  await wait(page,.3);expect(await page.evaluate(()=>(window as any).__game.nearest()?.spec.kind)).toBe('mug');
  await page.mouse.move(700,450);await page.mouse.down({button:'right'});await page.mouse.down({button:'left'});
  expect(await page.evaluate(()=>[(window as any).__game.orbit,(window as any).__game.held?.spec.kind])).toEqual([true,'mug']);
  await page.mouse.up({button:'right'});expect(await page.evaluate(()=>(window as any).__game.orbit)).toBe(false);
  await page.mouse.up({button:'left'});
});
test('a bench drag is pointer-captured and ends when a move arrives with no button held (game-a-08)',async({page})=>{
  await open(page,'garage');
  await page.evaluate(()=>{const g=(window as any).__game;g.enterBench();const log:string[]=(window as any).__benchLog=[];const real=g.station.pointer.bind(g.station);g.station.pointer=(e:any)=>{if(e.kind!=='move')log.push(e.kind);real(e);};});
  await wait(page,.1);await page.mouse.move(700,450);await page.mouse.down();
  expect(await page.evaluate(()=>document.querySelector('canvas')!.hasPointerCapture(1))).toBe(true);
  // The button went up somewhere the canvas never heard of: the next move has no buttons.
  await page.evaluate(()=>{document.querySelector('canvas')!.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'mouse',buttons:0,button:-1,clientX:700,clientY:450,bubbles:true}));});
  await expect.poll(()=>page.evaluate(()=>(window as any).__benchLog)).toEqual(['down','up']);
});
test('the pad sticks neither walk Pip nor turn the camera at a bench (game-a-02)',async({page})=>{
  await fakePad(page);await open(page,'garage');
  await page.evaluate(()=>{const g=(window as any).__game;g.enterBench();(window as any).__pad.axes=[1,0,1,.6];});
  const before=await page.evaluate(()=>{const g=(window as any).__game;return {p:{...g.player.translation()},pitch:g.pitch};});
  await wait(page,1);
  const after=await page.evaluate(()=>{const g=(window as any).__game;return {p:{...g.player.translation()},pitch:g.pitch};});
  expect(Math.hypot(after.p.x-before.p.x,after.p.z-before.p.z)).toBeLessThan(.05);expect(after.pitch).toBeCloseTo(before.pitch,3);
});
test('pad A during the win beat waits for the result card, then retries straight back in (game-a-04, ui-1)',async({page})=>{
  await fakePad(page);await open(page,'playground');
  await page.evaluate(()=>{(window as any).__stay=1;(window as any).__game.win();});
  await press(page,0,true);await page.waitForTimeout(150);await press(page,0,false);await page.waitForTimeout(150);
  expect(await page.evaluate(()=>(window as any).__stay)).toBe(1);
  await expect(page.locator('body')).toHaveAttribute('data-complete','true');
  await press(page,0,true);await page.waitForFunction(()=>(window as any).__stay===undefined&&document.body.dataset.ready==='true');
  // The retry flag took us straight back into play, not to the title or Jobs board.
  await expect.poll(()=>snapshot(page).then(s=>s.running)).toBe(true);
});

test('pushing into a room edge reads as standing still: no walk cycle on the spot (game-b-5 follow-up)',async({page})=>{
  await open(page,'meeting');await wait(page,.2);
  // Walks with D held for 0.6 s from a spot and returns Pip's pace and how far he moved.
  const walkFrom=(x:number)=>page.evaluate(x=>{const G=(window as any).__game,at={x,y:.8,z:0};G.player.setTranslation(at,true);G.player.setNextKinematicTranslation(at);G.yaw=0;
    (window as any).__circuitCrew.drive.advance(.6,['KeyD']);G.keys=new Set(['KeyD']);G.step(1/60);G.keys.clear();
    return {pace:G.pace,moved:Math.abs(G.player.translation().x-x)};},x);
  // Open floor first, which also tells the test which way D walks.
  const free=await walkFrom(0);expect(free.pace).toBeGreaterThan(1.5);
  const right=await page.evaluate(()=>(window as any).__game.player.translation().x>0);
  const edge=await page.evaluate(()=>{const G=(window as any).__game;return G.level.width/2-.5;});
  const pushed=await walkFrom(right?edge:-edge);
  expect(pushed.moved).toBeLessThan(.05);expect(pushed.pace).toBeLessThan(.3);
});

test('a button pressed on the HUD and dragged onto the canvas does not grab (game-a-06 follow-up)',async({page})=>{
  await open(page,'meeting');await wait(page,.2);
  const box=(await page.locator('canvas').first().boundingBox())!;
  await page.evaluate(()=>{(window as any).__grabs=0;const G=(window as any).__game,a=G.action.bind(G);G.action=(n:string)=>{if(n==='grab')(window as any).__grabs++;return a(n);};});
  // A move with the left button already held (as from a press that began on a HUD element).
  await page.locator('canvas').first().dispatchEvent('pointermove',{pointerType:'mouse',buttons:1,clientX:box.x+box.width/2,clientY:box.y+box.height/2,pointerId:1});
  expect(await page.evaluate(()=>(window as any).__grabs)).toBe(0);
});
