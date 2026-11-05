// Draw calls per room (R5-026), start camera after 0.5 s: snapshot().drawCalls (all passes of one frame),
// plus counts of visible meshes and instanced batches. Usage: BASE=http://localhost:4213 node draws.mjs [levels...] [--low]
import {launch} from '../cap.mjs';
const all=['lobby','playground','meeting','lunch','arcade','arcade-rush','garage','qfn','observatory','spectrum'];
const args=process.argv.slice(2),low=args.includes('--low'),levels=args.filter(a=>!a.startsWith('--'));
const out={};
for(const level of levels.length?levels:all){
  const g=await launch(level,{fullfx:!low});
  if(!low){await g.page.evaluate(()=>localStorage.setItem('circuit-crew-quality','2'));await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();}
  await g.advance(.5);await g.page.waitForTimeout(300);await g.advance(.05);
  const s=await g.snap();
  const r=await g.page.evaluate(()=>{const G=window.__game;let meshes=0,inst=0;const vis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true;};
    const own={};G.view.scene.traverse(o=>{if(!(o.isMesh||o.isSprite)||!vis(o))return;meshes++;if(o.isInstancedMesh)inst++;let top=o;while(top.parent&&top.parent!==G.root&&top.parent!==G.view.scene)top=top.parent;const k=top===G.decorRoot?'decorRoot':top.isInstancedMesh?'batches':(top.name||top.type);own[k]=(own[k]||0)+1;});
    return {quality:G.view.getQuality(),meshes,inst,batches:G.batches.length,top:Object.entries(own).sort((a,b)=>b[1]-a[1]).slice(0,6)};});
  out[level]={draw:s.drawCalls,...r};console.log(level.padEnd(12),`q${r.quality} draws ${s.drawCalls} meshes ${r.meshes} batches ${r.batches}`,JSON.stringify(r.top));
  const errs=await g.close();if(errs.length)console.log('  errors:',errs.slice(0,3).join(' | '));
}
console.log(JSON.stringify(out));
