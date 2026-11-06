import {test,expect} from '@playwright/test';
test('Pip batches rigid details while preserving triangles, facial parts and live joints',async({page},testInfo)=>{
 test.setTimeout(180000);const results:any[]=[];const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const mode of ['nofreeze','batched']){
  await page.goto('/?level=playground&manual&lowfx'+(mode==='nofreeze'?'&nofreeze':''));await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.waitForFunction(()=>!!(window as any).__game?.rig);
  const data=await page.evaluate(()=>{const g=(window as any).__game,r=g.rig;g.avatar.position.set(0,0,0);g.avatar.rotation.set(0,0,0);g.avatar.updateMatrixWorld(true);let meshes=0,triangles=0,protectedParts=0;r.body.traverse((o:any)=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;if(o.material.defines?.SEE_OFF!==undefined)protectedParts++;});
   const names=['HeadEyeL','HeadEyeR','HeadMouth'],face=names.map(n=>!!r.head.getObjectByName(n));
   const base={dt:1/60,time:0,speed:0,grounded:true,rising:false,airborne:0,turnRate:0,carrying:'none',holdingPlug:true,strain:1.1,won:false,waving:false};for(let i=0;i<120;i++)r.update({...base,time:i/60});r.body.updateMatrixWorld(true);const hand=r.hand.getWorldPosition(r.hand.position.clone()),head=r.head.getWorldPosition(r.hand.position.clone());
   return {meshes,triangles,protectedParts,face,handAttached:r.hand.parent===r.elbows[1],hand:hand.toArray(),head:head.toArray(),knees:r.knees.every((k:any)=>!!k.parent),elbows:r.elbows.every((k:any)=>!!k.parent)};});results.push({mode,...data});
  expect(data.face).toEqual([true,true,true]);expect(data.knees&&data.elbows&&data.handAttached).toBe(true);expect(data.protectedParts).toBe(data.meshes);expect(data.hand.every(Number.isFinite)).toBe(true);expect(data.hand[1]).toBeLessThan(data.head[1]);
 }
 console.log(JSON.stringify(results));
 expect(results[1].meshes).toBeLessThan(results[0].meshes*.7);expect(results[1].triangles).toBe(results[0].triangles);
 for(let i=0;i<3;i++)expect(results[1].hand[i]).toBeCloseTo(results[0].hand[i],3);
 await testInfo.attach('pip-mesh-counts',{body:JSON.stringify(results,null,2),contentType:'application/json'});expect(errors).toEqual([]);
});
