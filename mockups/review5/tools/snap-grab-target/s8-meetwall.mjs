import {launch} from '../cap.mjs';import {hook,K} from './h.mjs';import {occl} from './occl.mjs';
const g=await launch('meeting',{fullfx:true});await hook(g);await g.advance(.5);
for(const [yaw,lab] of [[.14+Math.PI,'y180'],[.14+Math.PI*1.25,'y225'],[.14+Math.PI*.75,'y135']]){
await g.page.evaluate(([y])=>{window.__game.zoom=9;window.__game.yaw=y;},[yaw]);await g.advance(1.2);
const o=await occl(g);console.log(lab,JSON.stringify(o));
const shell=await g.page.evaluate(()=>window.__game.shellWalls.map(w=>+w.group.scale.y.toFixed(2)).join(','));console.log('shell scales',shell);
await g.shot(`${K}-60-mt-spawn-z9-${lab}`);}
console.log(await g.close());
