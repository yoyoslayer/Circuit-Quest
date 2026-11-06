import {test,expect} from '@playwright/test';
import {open,wait} from './navigation';
// Review 6 P1-6: the free-roam camera must never sit inside furniture or a pillar. For each orbit step
// the camera is settled deterministically (updateCamera with a long step, so the result does not depend
// on how fast the machine renders), then the segment from Pip's chest to the camera must not touch a
// fixed solid that blocks the view. Solids within 1.2 m of Pip are left to the see-through oval, and the
// colliders the camera passes through (Game.cameraIgnore) are skipped, as in game.ts updateCamera.
test('the free-roam camera is never inside a pillar or furniture as it orbits Pip',async({page})=>{
  test.setTimeout(180000);
  await open(page,'meeting');await wait(page,.3); // physics queries only see colliders after a step
  // Pip stands 1.8 m in front of a pillar, so the orbit swings the camera behind it (without the pull-in
  // the view from behind the pillar is blocked: checked when this test was written).
  const bad=await page.evaluate(()=>{const G=(window as any).__game,out:number[]=[];
    const P=G.level.obstacles.find((o:any)=>o.id.startsWith('pillar')),at={x:(P.minX+P.maxX)/2,y:.8,z:P.maxZ+1.8};
    G.player.setTranslation(at,true);G.player.setNextKinematicTranslation(at);
    for(let i=0;i<16;i++){G.yaw=i*Math.PI/8;G.zoom=12;for(let k=0;k<8;k++)G.updateCamera(5);
      const c=G.view.camera.position,p=G.player.translation(),o={x:p.x,y:p.y+.3,z:p.z};
      const dx=c.x-o.x,dy=c.y-o.y,dz=c.z-o.z,len=Math.hypot(dx,dy,dz);
      const hit=G.world.castRay({origin:o,dir:{x:dx/len,y:dy/len,z:dz/len}},len,true,undefined,undefined,undefined,undefined,(col:any)=>!G.cameraIgnore.has(col.handle)&&!!col.parent()?.isFixed());
      if(hit&&hit.timeOfImpact>1.2)out.push(i);}
    return out;});
  expect(bad).toEqual([]);
});
