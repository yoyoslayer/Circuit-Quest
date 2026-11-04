import {launch} from '../cap.mjs';
import {grab,rays} from './helpers.mjs';
const P='verify-arcade-models';
const g=await launch('arcade',{fullfx:true});
const settle=async(n=20)=>{for(let i=0;i<n;i++)await g.advance(1/60);};
const shot=async(name)=>{await settle();return g.shot(`${P}-${name}`);};
await grab(g);
console.log('audit02',JSON.stringify(await g.audit(.02)));
await settle();
let s=await g.snap();console.log('start dc',s.drawCalls,'fps',s.fps);
console.log('lights',await g.page.evaluate(()=>{const L=[];window.__scene.traverse(o=>{if(o.isPointLight)L.push([o.intensity,+o.position.x.toFixed(1)]);});return JSON.stringify(L);}));
await shot('01-start');
// A: shot 81 repro
let w=await g.walk(5.9,-4.6,.4);console.log('A arrived',w.arrived);
await g.key('KeyC',.2);await g.zoom(-2000,.3);await g.orbit(-262,-150,.2);await shot('02-claw-side-low');console.log('A1',JSON.stringify(await rays(g)));
await g.orbit(-120,0,.2);await shot('03-corner-blind');console.log('A2',JSON.stringify(await rays(g)));
// settle more to see whether walls finish lerping
for(let i=0;i<60;i++)await g.advance(1/60);await shot('04-corner-blind-settled');console.log('A3',JSON.stringify(await rays(g)));
// zoom out at same yaw
await g.zoom(3000,.5);await shot('05-corner-zoomout');console.log('A4',JSON.stringify(await rays(g)));
await g.key('KeyC',.2);
// B: west-wall orbit repro
w=await g.walk(-5.9,5.2,.4,40);console.log('B arrived',w.arrived,JSON.stringify(w.state.player));
await g.key('KeyC',.2);await g.zoom(-2000,.3);await g.orbit(262,0,.2);for(let i=0;i<40;i++)await g.advance(1/60);await shot('06-west-wall-orbit');console.log('B1',JSON.stringify(await rays(g)));
console.log('occluder opacities',await g.page.evaluate(()=>{const o=[];window.__scene.traverse(m=>{if(m.isMesh&&m.material?.transparent&&m.material.opacity<.99&&m.material.opacity>.01)o.push(+m.material.opacity.toFixed(2)+':'+m.material.color?.getHexString());});return o.slice(0,20).join(',');}));
await g.key('KeyC',.2);
// C: hopper from behind (shot 24)
w=await g.walk(8.4,-3.2,.4);console.log('C arrived',w.arrived);
await g.key('KeyC',.2);await g.zoom(-2000,.3);await g.orbit(-262,0,.2);for(let i=0;i<30;i++)await g.advance(1/60);await shot('07-hopper-behind');console.log('C1',JSON.stringify(await rays(g)));
console.log(await g.close());
