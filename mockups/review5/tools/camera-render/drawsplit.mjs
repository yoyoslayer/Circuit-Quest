// Which subtrees own the visible meshes (draw-call sources).
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
for(const level of process.argv.slice(2)){
  const g=await launch(level,{fullfx:true});await hook(g);await g.advance(.3);
  const r=await g.page.evaluate(()=>{const G=window.__game;const count=o=>{let n=0;o.traverse(c=>{if(c.isMesh&&c.visible){let v=true,q=c;while(q){if(!q.visible){v=false;break;}q=q.parent;}if(v)n++;}});return n;};
    const out={total:count(G.view.scene),decorRoot:count(G.decorRoot),props:G.props.reduce((n,p)=>n+(p.mesh.visible?count(p.mesh):0),0),npcs:G.npcs.reduce((n,p)=>n+count(p.group),0),avatar:count(G.avatar),shellWalls:G.shellWalls.reduce((n,w)=>n+count(w.group.parent),0),occluders:G.occluders.length,station:G.station?.group?count(G.station.group):undefined};
    // direct root children that are not props/npcs/decorRoot
    const propMeshes=new Set(G.props.map(p=>p.mesh));const npcG=new Set(G.npcs.map(n=>n.group));let other=0;const kinds={};for(const c of G.root.children){if(c===G.decorRoot||propMeshes.has(c)||npcG.has(c)||c===G.avatar)continue;const n=count(c);other+=n;const k=(c.name||c.type)+(c.isInstancedMesh?'(inst)':'');kinds[k]=(kinds[k]||0)+n;}
    out.rootOther=other;out.rootOtherKinds=Object.entries(kinds).sort((a,b)=>b[1]-a[1]).slice(0,8);return out;});
  console.log(level,JSON.stringify(r));await g.close();
}
