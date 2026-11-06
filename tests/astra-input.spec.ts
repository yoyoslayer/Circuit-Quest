import {test,expect} from '@playwright/test';
import {wait,snapshot} from './navigation';
test('pause ignores queued walking and camera input, then fresh controls work',async({page})=>{
 await page.goto('/?level=playground&manual&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();
 await page.getByRole('button',{name:'Pause',exact:true}).click();const start=(await snapshot(page)).player;
 await page.keyboard.down('KeyD');await page.keyboard.down('ShiftLeft');
 const camera=await page.evaluate(()=>{const g=(window as any).__game;return [g.yaw,g.pitch,g.zoom];});
 await page.locator('canvas').dispatchEvent('wheel',{deltaY:400});
 expect(await page.evaluate(()=>{const g=(window as any).__game;return [g.yaw,g.pitch,g.zoom];})).toEqual(camera);
 await page.getByRole('button',{name:'Resume',exact:true}).click();await wait(page,.5);
 const after=(await snapshot(page)).player;expect(Math.hypot(after.x-start.x,after.z-start.z)).toBeLessThan(.05);
 await page.keyboard.up('KeyD');await page.keyboard.up('ShiftLeft');await wait(page,.4,['KeyD']);expect((await snapshot(page)).player.x).toBeGreaterThan(after.x+.5);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 const beforeTouch=await page.evaluate(()=>{const g=(window as any).__game;return [g.yaw,g.pitch];});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:300}]});
 await page.keyboard.press('Escape');expect((await snapshot(page)).paused).toBe(true);await page.getByRole('button',{name:'Resume',exact:true}).click();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:300,y:400}]});
 expect(await page.evaluate(()=>{const g=(window as any).__game;return [g.yaw,g.pitch];})).toEqual(beforeTouch);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
});


test.describe('phone thumbstick',()=>{
 test.use({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 test('pause releases the finger and a second finger cannot steal the stick',async({page})=>{
  test.setTimeout(180000);await page.goto('/?level=playground&manual&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();
  const rect=await page.locator('.stick').boundingBox();expect(rect).not.toBeNull();const x=rect!.x+rect!.width/2,y=rect!.y+rect!.height/2;
  const cdp=await page.context().newCDPSession(page),touch=(type:string,points:any[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
  await touch('touchStart',[{id:1,x:x+25,y}]);await expect.poll(()=>page.evaluate(()=>(window as any).__game.stick?.x??0)).toBeGreaterThan(.2);
  await touch('touchStart',[{id:1,x:x+25,y},{id:2,x:x-25,y}]);expect(await page.evaluate(()=>(window as any).__game.stick?.x??0)).toBeGreaterThan(.2);
  await touch('touchMove',[{id:1,x:x+25,y}]);
  await page.keyboard.press('Escape');expect((await snapshot(page)).paused).toBe(true);await expect(page.locator('.stick')).not.toHaveClass(/held/);
  expect(await page.evaluate(()=>(window as any).__game.stick??null)).toBeNull();await page.keyboard.press('Escape');expect((await snapshot(page)).paused).toBe(false);
  const before=(await snapshot(page)).player;await touch('touchMove',[{id:1,x:x+40,y}]);await wait(page,.4);expect(await page.evaluate(()=>(window as any).__game.stick??null)).toBeNull();
  const after=(await snapshot(page)).player;expect(Math.hypot(after.x-before.x,after.z-before.z)).toBeLessThan(.05);
  await touch('touchEnd',[]);await touch('touchStart',[{id:3,x:x+25,y}]);await expect.poll(()=>page.evaluate(()=>(window as any).__game.stick?.x??0)).toBeGreaterThan(.2);
  await touch('touchEnd',[]);await expect(page.locator('.stick')).not.toHaveClass(/held/);await cdp.detach();await page.screenshot({path:'artifacts/astra-phone-stick-reset.png'});
 });
});


test('a controller in a nonzero slot drives gameplay and pause menus',async({page})=>{
 await page.goto('/?level=playground&manual&lowfx');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Start playing'}).click();
 await page.evaluate(()=>{const pad={axes:[1,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),connected:true,index:2,id:'reconnected pad',mapping:'standard',timestamp:0};(window as any).__testPad=pad;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[null,null,pad,null]});});
 const before=(await snapshot(page)).player;await wait(page,.5);expect((await snapshot(page)).player.x).toBeGreaterThan(before.x+.5);
 await page.evaluate(()=>{const p=(window as any).__testPad;p.axes=[0,0,0,0];p.buttons[9].pressed=true;(window as any).__game.pollPad();});expect((await snapshot(page)).paused).toBe(true);
 await page.evaluate(()=>{const p=(window as any).__testPad;p.buttons[9].pressed=false;(window as any).__game.pollPad();p.buttons[0].pressed=true;});
 await expect.poll(async()=>(await snapshot(page)).paused).toBe(false);
 // A disconnected object is ignored even if the browser has not yet replaced its slot with null.
 await page.evaluate(()=>{const p=(window as any).__testPad;p.connected=false;p.axes=[1,0,0,0];});const stopped=(await snapshot(page)).player;await wait(page,.5);
 const after=(await snapshot(page)).player;expect(Math.hypot(after.x-stopped.x,after.z-stopped.z)).toBeLessThan(.05);
});
