import {test,expect} from '@playwright/test';
import {open,wait} from './navigation';
// Review 6 P1-6: the free-roam camera must never sit inside furniture or a pillar. For each orbit
// step, the segment from Pip to the camera must not touch a fixed solid (shell walls and lips fold
// away on purpose, so they are ignored, as in game.ts updateCamera).
test('the free-roam camera is never inside a pillar or furniture as it orbits Pip',async({page})=>{
  test.setTimeout(180000);
  await open(page,'meeting');
  const bad:number[]=[];
  for(let i=0;i<16;i++){
    await page.evaluate(i=>{const G=(window as any).__game;G.yaw=i*Math.PI/8;G.zoom=12;},i);
    await wait(page,1);
    const toi=await page.evaluate(()=>{const G=(window as any).__game,c=G.view.camera.position,f=G.focus;
      const dx=c.x-f.x,dy=c.y-f.y,dz=c.z-f.z,len=Math.hypot(dx,dy,dz);
      const hit=G.world.castRay({origin:{x:f.x,y:f.y,z:f.z},dir:{x:dx/len,y:dy/len,z:dz/len}},len,true,undefined,undefined,undefined,undefined,(col:any)=>!G.cameraIgnore.has(col.handle)&&!!col.parent()?.isFixed());
      return hit?hit.timeOfImpact:-1;});
    if(toi>=0)bad.push(i);
  }
  expect(bad).toEqual([]);
});
