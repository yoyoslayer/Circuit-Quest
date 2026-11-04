import {launch} from '../cap.mjs';import {hook} from '../observatory-models/hook.mjs';
const P='verify-observatory-models-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});await hook(g);await g.advance(.5);
let s=await g.snap();log('start dc',s.drawCalls,'fps',s.fps,'player',JSON.stringify(s.player));
log('audit02',JSON.stringify(await g.audit(.02)));
log('audit005',JSON.stringify(await g.audit(.005)));
const info=await g.page.evaluate(()=>{const sc=window.__scene;const lights=[];let sides={};const mats=new Set();
  sc.traverse(o=>{if(o.isPointLight){const p=new window.__T.Vector3();o.getWorldPosition(p);lights.push([+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2),o.intensity]);}
    if(o.isMesh&&o.material&&o.material.color&&o.material.color.getHexString&&o.material.color.getHexString()==='dfe3ea'){mats.add(o.material.uuid);sides[o.material.uuid]=o.material.side;}});
  return {lights,dfe3ea:[...mats].map(u=>sides[u])};});
log('scene',JSON.stringify(info));
await g.shot(P+'01-start');
// Into the dome through the open front, behind the pier
let r=await g.walk(-7.6,-3.4,.4);log('front',JSON.stringify(r.state.player));
r=await g.walk(-7.2,-6.5,.3,20);log('inside via front',r.arrived,JSON.stringify(r.state.player));
await g.shot(P+'02-inside-dome-front-cam');
await g.orbit(525,0);await g.shot(P+'03-inside-dome-orbit180');
await g.orbit(-525,0);
// Leave sideways through the shell towards the gallery
r=await g.walk(-3.0,-6.8,.3,20);log('out through shell',r.arrived,JSON.stringify(r.state.player));
r=await g.walk(-5.4,-7.0,.3,20);log('back in through shell',r.arrived,JSON.stringify(r.state.player));
await g.shot(P+'04-back-in-through-shell');
await g.orbit(525,0);await g.shot(P+'05-orbit180-rail');
await g.zoom(-2000);await g.shot(P+'06-orbit180-zoom9');
log('errors',JSON.stringify(await g.close()));
