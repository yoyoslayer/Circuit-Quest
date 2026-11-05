// Pip close-ups after the model/rig fixes: 4 orbit angles at zoom 9, the haul pose at the cable limit,
// a light carry, and the throw. BASE=http://localhost:4206 node mockups/review5/tools/fix-models/pip.mjs
import {launch} from '../cap.mjs';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const SH=resolve(dirname(fileURLToPath(import.meta.url)),'..','..','shots');
const crop=(g,name,clip={x:420,y:120,width:600,height:660})=>g.page.waitForTimeout(600).then(()=>g.page.screenshot({path:resolve(SH,`fix-models-${name}.jpg`),type:'jpeg',quality:80,clip}));
const g=await launch('playground',{fullfx:true});await g.advance(1);await g.zoom(-1500);await g.advance(.5);
for(const [i,a] of [[0,0],[1,262],[2,262],[3,262]])
{if(a)await g.orbit(a,0);await crop(g,`pip-a${i*90}`);}
await g.orbit(-262*3,0);
// Haul: grab the reel's plug and sprint past the cable's length.
await g.key('KeyF');await g.walk(1,8.6,.4);await g.walk(8.5,6.2,.4);await g.ev('return drive.advance(2.2,["KeyW","ShiftLeft"])');
await g.orbit(520,0);await crop(g,'pip-haul');console.log('strain',(await g.snap()).rope.strain.toFixed(2),'pose',JSON.stringify((await g.snap()).pose));
await g.key('KeyQ',.1);await crop(g,'pip-slingshot-release');await g.advance(1);
// Carry a box.
const s=await g.snap();
const box=await g.page.evaluate(()=>{const p=window.__game.player.translation();const b=window.__game.props.filter(q=>q.spec.kind==='box').sort((a,b)=>Math.hypot(a.body.translation().x-p.x,a.body.translation().z-p.z)-Math.hypot(b.body.translation().x-p.x,b.body.translation().z-p.z))[0].body.translation();return {x:b.x,z:b.z};});
await g.walk(box.x-.9,box.z,.2);await g.key('KeyE',.3);await g.walk(box.x-3,box.z+1,.4);await g.advance(.5);
const held=await g.page.evaluate(()=>{const h=window.__game.held;if(!h)return null;const r=h.body.rotation(),t=h.body.translation();return {kind:h.spec.kind,up:+(1-2*(r.x*r.x+r.z*r.z)).toFixed(3),y:+t.y.toFixed(2)};});
console.log('held',JSON.stringify(held));await crop(g,'pip-carry');await g.orbit(-400,0);await crop(g,'pip-carry-side');
await g.key('KeyQ',.08);await crop(g,'pip-throw');
console.log(g.errors.filter(e=>!/Fredoka|403/.test(e)).join('\n')||'no errors');await g.close();
