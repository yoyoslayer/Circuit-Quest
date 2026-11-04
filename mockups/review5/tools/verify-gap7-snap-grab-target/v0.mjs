import {launch} from '../cap.mjs';import {hook} from '../snap-grab-target/h.mjs';
const g=await launch('meeting',{fullfx:true});await hook(g);await g.advance(.5);
const st=()=>g.page.evaluate(()=>{const G=window.__game,c=G.view.camera.position;return {yaw:G.yaw,zoom:G.zoom,cam:[c.x,c.y,c.z].map(v=>+v.toFixed(2)),same:G===window.__circuitCrew?.game,keys:Object.keys(window.__circuitCrew||{})};});
console.log(JSON.stringify(await st()));
await g.page.evaluate(()=>{window.__game.zoom=9;window.__game.yaw=.14+Math.PI;});console.log(JSON.stringify(await st()));
await g.advance(1.5);console.log(JSON.stringify(await st()));
await g.orbit(600,0,1.5);console.log(JSON.stringify(await st()));
console.log(await g.close());
