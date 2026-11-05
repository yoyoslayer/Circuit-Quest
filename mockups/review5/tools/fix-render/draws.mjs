// Draw calls per room (R5-026): snapshot().drawCalls = every pass of one frame (composer scene + outlines,
// AO re-render at q2, shadow map), at the start camera and in the survey; plus a breakdown of visible
// meshes by owner, to find what is still unmerged. Usage: BASE=http://localhost:4204 node draws.mjs [levels...] [--low]
import {launch} from '../cap.mjs';
const all=['lobby','playground','meeting','lunch','arcade','arcade-rush','garage','qfn','observatory','spectrum'];
const args=process.argv.slice(2),low=args.includes('--low'),detail=args.includes('--detail'),levels=args.filter(a=>!a.startsWith('--'));
for(const level of levels.length?levels:all){
  const g=await launch(level,{fullfx:!low});await g.advance(.5);await g.page.waitForTimeout(300);await g.advance(.05);
  const start=await g.snap();
  const r=await g.page.evaluate((detail)=>{const G=window.__game,root=G.root;const own={};let meshes=0;
    const vis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true;};
    G.view.scene.traverse(o=>{if(!(o.isMesh||o.isSprite)||!vis(o))return;meshes++;let top=o;while(top.parent&&top.parent!==root&&top.parent!==G.view.scene)top=top.parent;
      const k=top===G.decorRoot?'decorRoot':top.isInstancedMesh?'batches':(top.name||top.type)+(detail?'@'+top.position.x.toFixed(1)+','+top.position.z.toFixed(1):'');own[k]=(own[k]||0)+1;});
    const top=Object.entries(own).sort((a,b)=>b[1]-a[1]).slice(0,detail?40:12);return {quality:G.view.getQuality(),meshes,top};},detail);
  await g.survey();await g.advance(.3);const survey=await g.snap();
  console.log(level.padEnd(12),`q${r.quality} start ${start.drawCalls} survey ${survey.drawCalls} meshes ${r.meshes}`,JSON.stringify(r.top));
  await g.close();
}
