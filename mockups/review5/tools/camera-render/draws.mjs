// Draw calls per room: full frame (composer + outlines + AO) vs plain scene pass, fullfx and lowfx; plus point lights.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const levels=['lobby','playground','meeting','lunch','arcade','arcade-rush','garage','qfn','observatory','spectrum'];
for(const fx of [true,false])for(const level of levels){
  const g=await launch(level,{fullfx:fx});await hook(g);await g.advance(.5);await g.page.waitForTimeout(400);
  const r=await g.page.evaluate(()=>{const G=window.__game,R=G.view.renderer;const frame=R.info.render.calls;
    R.info.reset();R.render(G.view.scene,G.view.camera);const scene=R.info.render.calls;R.info.reset();G.view.effect.render(G.view.scene,G.view.camera);const outl=R.info.render.calls;
    let vis=0,inst=0,pl=0;G.view.scene.traverse(o=>{if(o.isPointLight&&o.visible)pl++;if(o.isMesh&&o.visible){vis++;if(o.isInstancedMesh)inst++;}});return {frame,scene,outlineScene:outl,meshes:vis,instanced:inst,points:pl,quality:G.view.getQuality()};});
  console.log(fx?'fullfx':'lowfx ',level.padEnd(12),JSON.stringify(r));await g.close();
}
