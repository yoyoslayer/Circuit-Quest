// Visible meshes per top-level object under game.root (with a path sample), to find what is unmerged.
import {launch} from '../cap.mjs';
for(const level of process.argv.slice(2)){
const g=await launch(level,{fullfx:false});await g.advance(.3);
console.log(level,JSON.stringify(await g.page.evaluate(()=>{const G=window.__game;const vis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true;};
  const rows=[];for(const top of [...G.root.children,...G.view.scene.children.filter(c=>c!==G.root)]){let n=0;const kinds={};top.traverse(o=>{if((o.isMesh||o.isSprite)&&vis(o)){n++;const k=(o.material?.type??o.type)+(o.name?':'+o.name:'');kinds[k]=(kinds[k]||0)+1;}});
    if(n>3)rows.push([top===G.decorRoot?'decor':top===G.avatar?'avatar':(top.name||top.type)+'@'+top.position.x.toFixed(1)+','+top.position.z.toFixed(1)+' ch'+top.children.length,n,Object.entries(kinds).sort((a,b)=>b[1]-a[1]).slice(0,4)]);}
  return rows.sort((a,b)=>b[1]-a[1]).slice(0,12);})));
await g.close();}
