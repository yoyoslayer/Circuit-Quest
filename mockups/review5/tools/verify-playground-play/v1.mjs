import {launch} from '../cap.mjs';
import {hud,props,brief} from '../playground-play/lib.mjs';
const K='verify-playground-play';
const seg=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);};
// A: start audit, props, hint line
{const g=await launch('playground',{fullfx:true});await g.advance(.3);
console.log('audit',JSON.stringify(await g.audit(.02)));
const ps=await props(g);console.log('nprops',ps.length);
console.log('decoys',JSON.stringify(ps.filter(p=>['reel','splitter','coupler'].includes(p.kind))));
const a={x:-7,z:5},b={x:7,z:-6};console.log('on spawn->target line (<.45)',JSON.stringify(ps.filter(p=>seg(p,a,b)<.45).map(p=>[p.kind,p.x,p.z,+seg(p,a,b).toFixed(2)])));
const s=await g.snap();console.log('start dc',s.drawCalls);
// idle hint at 36s
await g.advance(36.2);await g.shot(`${K}-01-idle-hint`);
const hint=await g.page.evaluate(()=>0);
// clean run
await g.key('KeyF',.2);let mx=0;console.log('F',JSON.stringify(brief(await g.snap())),JSON.stringify(await hud(g)));
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]]){
  // walk in small sub steps to sample strain
  const s0=await g.snap();const sx=s0.player.x,sz=s0.player.z;
  for(let k=1;k<=6;k++){await g.walk(sx+(x-sx)*k/6,sz+(z-sz)*k/6,.4);const s=await g.snap();mx=Math.max(mx,s.rope.strain);}
  console.log('leg',x,z,JSON.stringify(brief(await g.snap())),JSON.stringify(await hud(g)));}
console.log('max strain on clean route',mx.toFixed(3));
await g.shot(`${K}-02-at-socket`);
await g.key('KeyF',.3);console.log('plug',JSON.stringify(brief(await g.snap())));
await g.walk(6.6,-5.9,.4);await g.zoom(-1500);await g.shot(`${K}-03-at-switch-close`);
await g.key('KeyE',.05);const sw=await g.snap();console.log('afterE',JSON.stringify(brief(sw)));
await g.page.waitForTimeout(1500);await g.shot(`${K}-04-win`);
console.log('errors',JSON.stringify(await g.close()));}
