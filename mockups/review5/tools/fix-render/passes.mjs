// Draw calls split by pass (R5-026/R5-167): the full frame, the plain scene with and without the shadow
// map, the outline effect, and the AO pass's own re-render. Usage: BASE=... node passes.mjs [levels...]
import {launch} from '../cap.mjs';
const levels=process.argv.slice(2);
for(const level of levels.length?levels:['meeting','arcade']){
  const g=await launch(level,{fullfx:true});await g.page.evaluate(()=>localStorage.setItem('circuit-crew-quality','2'));
  await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
  await g.advance(.5);
  const r=await g.page.evaluate(()=>{const G=window.__game,R=G.view.renderer,S=G.view.scene,C=G.view.camera,out={quality:G.view.getQuality()};
    const count=f=>{R.info.reset();f();return R.info.render.calls;};
    out.frame=count(()=>G.view.render());
    R.shadowMap.needsUpdate=true;out.sceneWithShadow=count(()=>R.render(S,C));
    const au=R.shadowMap.autoUpdate;R.shadowMap.autoUpdate=false;out.sceneOnly=count(()=>R.render(S,C));
    out.outlineEffect=count(()=>G.view.effect.render(S,C));R.shadowMap.autoUpdate=au;
    let casters=0,meshes=0;S.traverse(o=>{let v=true;for(let q=o;q;q=q.parent)if(!q.visible)v=false;if(v&&o.isMesh){meshes++;if(o.castShadow)casters++;}});out.meshes=meshes;out.casters=casters;return out;});
  console.log(level.padEnd(12),JSON.stringify(r));await g.close();
}
