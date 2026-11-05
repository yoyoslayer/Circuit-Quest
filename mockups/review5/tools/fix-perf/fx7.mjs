import {launch} from '../cap.mjs';
const g=await launch('meeting',{fullfx:true});
const c=await g.page.evaluate(()=>{const G=window.__game;const p=G.props.find(q=>q.spec.id==='coffee');const t=p.body.translation();return {x:t.x,y:t.y,z:t.z,vis:p.mesh.visible};});console.log(c);
await g.walk(c.x+2,c.z+2.5,.4);await g.page.evaluate(()=>{window.__game.zoom=9;});
for(let k=0;k<25;k++)await g.advance(.1);
console.log(await g.page.evaluate(()=>{const G=window.__game;const r=[];G.root.traverse(o=>{if(o.userData.smoke&&o.parent&&o.material.opacity>0){o.material.opacity=1;o.material.color.set('#ff00ff');r.push([o.position.x.toFixed(2),o.position.y.toFixed(2),o.position.z.toFixed(2),o.visible,o.material.alphaMap?.uuid?.slice(0,4),o.geometry.type,o.material.transparent,o.material.depthTest]);}});G.fx.update=()=>{};return r;}));
await g.advance(.02);await g.shot('fix-perf-fx7');await g.close();
