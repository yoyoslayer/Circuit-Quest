import {launch} from '../cap.mjs';
const g=await launch('meeting',{fullfx:true});
const c=await g.page.evaluate(()=>{const G=window.__game;const p=G.props.find(q=>q.spec.id==='coffee');const t=p.body.translation();return {x:t.x,z:t.z};});
await g.walk(c.x+2,c.z+2.5,.4);await g.page.evaluate(()=>{window.__game.zoom=9;});
for(let k=0;k<25;k++)await g.advance(.1);
const s=await g.page.evaluate((c)=>{const G=window.__game;let n=0;G.root.traverse(o=>{if(o.userData.smoke&&o.parent&&o.material.opacity>0)n++;});const v=new (G.view.camera.position.constructor)(c.x,1.6,c.z).project(G.view.camera);return {n,x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight};},c);
console.log(s);await g.crop('fix-perf-steam-crop',{x:Math.max(0,s.x-300),y:0,width:600,height:450});
// dust on open floor, spawned the way a sprint step does
await g.page.evaluate(()=>{const G=window.__game,p=G.player.translation();for(let k=0;k<4;k++)G.burst({x:p.x+.6+k*.45,y:.05,z:p.z+.8},'#e6dfd2',k?1:5,'dust');});
await g.advance(.15);const d=await g.page.evaluate(()=>{const G=window.__game,p=G.player.translation();const v=new (G.view.camera.position.constructor)(p.x+1.2,.1,p.z+.8).project(G.view.camera);return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight};});
await g.crop('fix-perf-dust-crop',{x:Math.max(0,d.x-260),y:Math.max(0,d.y-200),width:520,height:400});
await g.close();
