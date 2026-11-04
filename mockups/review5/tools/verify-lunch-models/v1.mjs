import {launch} from '../cap.mjs';
import {hook} from '../lunch-models/hook.mjs';
const P='verify-lunch-models';
const g=await launch('lunch',{fullfx:true});
await hook(g);
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__g.player.setTranslation({x,y:.8,z},true);},[x,z]);
await g.advance(.5);
const s0=await g.snap();console.log('dc start',s0.drawCalls,'props',s0.props,'fps',s0.fps);
// prop colours / kinds
console.log('propstats',JSON.stringify(await g.page.evaluate(()=>{const G=window.__g,c={};for(const p of G.props){const k=p.spec.kind+'|'+(p.spec.color??'default')+(p.spec.id?'|ID':'');c[k]=(c[k]||0)+1;}return c;})));
// socket box near target
console.log('socket',JSON.stringify(await g.page.evaluate(()=>{const G=window.__g,out=[];G.view.scene.traverse(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry'&&Math.abs(o.position.x-12)<.01&&Math.abs(o.position.z+6)<.01)out.push({p:o.position.toArray(),vis:o.visible,c:o.material.color?.getHexString(),parent:o.parent?.type});});return out;})));
// rack duplicate: meshes in decorRoot children groups at (-16.1,0,5)
console.log('racks',await g.page.evaluate(()=>{let n=0;window.__g.view.scene.traverse(o=>{if(o.isGroup&&Math.abs(o.position.x+16.1)<.01&&Math.abs(o.position.z-5)<.01)n++;});return n;}));
// cord rebuilt every frame?
const u1=await g.page.evaluate(()=>window.__g.lunch.cord.geometry.uuid);await g.advance(.1);const u2=await g.page.evaluate(()=>window.__g.lunch.cord.geometry.uuid);console.log('cord same geom',u1===u2);
console.log('lamp pos',JSON.stringify(await g.page.evaluate(()=>window.__g.lunch.prop('portable-lamp').mesh.position)));
await g.shot(`${P}-01-start`);
await g.survey();console.log('dc survey',(await g.snap()).drawCalls);await g.shot(`${P}-02-survey`);await g.survey();
// Lift: walk under car
await g.zoom(-2000);
await tp(12,-3.4);await g.advance(.3);
let q=await g.walk(12,-6.0,.3);console.log('walk to -6',JSON.stringify(q.state.player));
q=await g.walk(12,-7.2,.3);console.log('walk to -7.2',JSON.stringify(q.state.player),q.arrived);
await g.shot(`${P}-03-pip-under-liftcar`);
await g.orbit(262,0);await g.shot(`${P}-04-pip-under-liftcar-side`);await g.orbit(-262,0);
// tray over gap
await g.page.evaluate(()=>{const G=window.__g,L=G.lunch,t=G.props.find(p=>p.spec.id==='tray');t.mesh.visible=true;t.body.setEnabled(true);t.body.setBodyType(2,true);L.job.tray='conveyor';L.job.transport=.78;});
await tp(9.0,-3.4);await g.advance(.2);console.log('tray',JSON.stringify((await g.snap()).items.find(i=>i.id==='tray').pos));
await g.shot(`${P}-05-tray-over-gap`);
console.log('errors',JSON.stringify(await g.close()));
