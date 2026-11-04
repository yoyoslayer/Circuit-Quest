// Verifier: pins walk-through, NPC collision, prop rest heights, draw calls, start view, pillar fade.
import {launch} from '../cap.mjs';
const K='verify-playground-models';
const hook=async g=>{await g.page.addInitScript(()=>{window.__seen=[];const t=new EventTarget();t.addEventListener('observe',e=>window.__seen.push(e.detail));window.__THREE_DEVTOOLS__=t;});
  await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();};
const scene=g=>g.page.evaluate(()=>{const sc=window.__seen.filter(o=>o&&o.isScene).sort((a,b)=>{let na=0,nb=0;a.traverse(()=>na++);b.traverse(()=>nb++);return nb-na;})[0];window.__sc=sc;return !!sc;});
const g=await launch('playground',{fullfx:true,start:false});await hook(g);await scene(g);
console.log('audit02',JSON.stringify(await g.audit(.02)));
await g.advance(1);let s=await g.snap();console.log('start dc',s.drawCalls,'props',s.props,'player',JSON.stringify(s.player));
console.log('pins y',JSON.stringify(s.items.filter(i=>i.id.startsWith('pin')).map(i=>+i.pos.y.toFixed(3))));
// instanced box bottoms: box rbox geometry height .6
const info=await g.page.evaluate(()=>{const sc=window.__sc;const out={};const m4=new (sc.matrixWorld.constructor)();
  sc.traverse(o=>{if(!o.isInstancedMesh)return;const p=o.geometry.parameters||{};o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox;const key=o.geometry.type+':'+(o.material.color?.getHexString())+':'+(bb.max.y-bb.min.y).toFixed(3);
    const ys=[];for(let i=0;i<o.count;i++){o.getMatrixAt(i,m4);const e=m4.elements;ys.push(+(e[13]+bb.min.y*e[5]).toFixed(3));}out[key]=ys.slice(0,6);});
  // sockets near target (7,-6)
  const near=[];sc.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;const w=o.getWorldPosition(o.position.clone());if(Math.abs(w.x-7)<.05&&Math.abs(w.z+6)<.05)near.push([o.geometry.type,+w.y.toFixed(3),o.material.color?.getHexString()]);});
  return {out,near};});
console.log('instance bottoms (sample)',JSON.stringify(info.out).slice(0,3000));console.log('meshes at target',JSON.stringify(info.near));
await g.shot(`${K}-01-start`);
await g.zoom(-2000);await g.shot(`${K}-02-start-close`);await g.zoom(2000);
// NPC collision: walk into the teal trainee
await g.walk(-6.6,-3.4,.1,12);s=await g.snap();console.log('to teal trainee: player',JSON.stringify(s.player),'dist',Math.hypot(s.player.x+6.6,s.player.z+3.4).toFixed(2));
await g.zoom(-2000);await g.shot(`${K}-03-trainee-overlap-close`);await g.zoom(2000);
// pillar-a: stand behind it (camera looks -z from +z), Pip at -1.3,-2.6
await g.walk(-1.3,-2.6,.3);await g.zoom(-2000);await g.shot(`${K}-04-behind-pillar-a-close`);
await g.orbit(-150,0);await g.shot(`${K}-05-behind-pillar-a-close-o`);await g.zoom(2000);
// pins: walk straight through
await g.walk(3.6,4.6,.3);s=await g.snap();console.log('at 3.6,4.6 pinsDown',s.pinsDown);
await g.walk(6.2,5.3,.3);await g.advance(2);s=await g.snap();console.log('walked through pins: pinsDown',s.pinsDown,'time',s.time.toFixed(1));await g.shot(`${K}-06-walked-through-pins`);
console.log('errors',JSON.stringify(await g.close()));
