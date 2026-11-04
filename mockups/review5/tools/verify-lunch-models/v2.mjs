import {launch} from '../cap.mjs';
import {hook} from '../lunch-models/hook.mjs';
const P='verify-lunch-models';
const g=await launch('lunch',{fullfx:true});
await hook(g);
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__g.player.setTranslation({x,y:.8,z},true);},[x,z]);
const tilt=id=>g.page.evaluate(id=>{const p=window.__g.props.find(p=>p.spec.id===id);const q=p.body.rotation();return +(Math.acos(Math.max(-1,Math.min(1,1-2*(q.x*q.x+q.z*q.z))))*57.3).toFixed(1);},id);
await g.advance(.5);
console.log('meshes',JSON.stringify(await g.page.evaluate(()=>{const G=window.__g,dr=G.decorRoot;let inDecor=0,inst=0,other=0,shell=0;const vis=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  const shellGroups=new Set(G.shellWalls.map(s=>s.group.parent));
  G.view.scene.traverse(o=>{if(!o.isMesh||!vis(o))return;let d=false,s=false;for(let p=o;p;p=p.parent){if(p===dr)d=true;if(shellGroups.has(p))s=true;}
    if(o.isInstancedMesh)inst++;else if(d)inDecor++;else if(s)shell++;else other++;});
  return {inDecor,inst,shell,other,total:inDecor+inst+shell+other,calls:G.view.renderer.info.render.calls};})));
// cart A tipping: reproduce
console.log('cartA start',await tilt('supply-a'));
let r=await g.walk(-14.2,5,.4);console.log('walk1',JSON.stringify(r.state.player),'tilt',await tilt('supply-a'));
r=await g.walk(-12,1.6,.4);console.log('walk2',JSON.stringify(r.state.player),'tilt',await tilt('supply-a'));
await g.advance(2);console.log('tilt settled',await tilt('supply-a'),JSON.stringify((await g.snap()).items.find(i=>i.id==='supply-a').pos));
await g.zoom(-2000);await g.shot(`${P}-06-cartA-after-walk`);
// cart B too
console.log('cartB tilt',await tilt('supply-b'));
// bench walk-through
await tp(-4.2,8.4);await g.advance(.2);r=await g.walk(-4.2,10.2,.2);console.log('bench walk end',JSON.stringify(r.state.player));await g.shot(`${P}-07-pip-bench`);
await tp(-7.2,2.6);await g.advance(.2);r=await g.walk(-7.2,1.0,.15);console.log('plant walk end',JSON.stringify(r.state.player));await g.shot(`${P}-08-pip-plant`);
// dining chair / pink blob
await tp(13.6,6.6);await g.advance(.4);await g.orbit(525,0);await g.shot(`${P}-09-dining-chair-blob`);await g.orbit(-525,0);
// storeroom lid from inside
await tp(-10.8,-5.6);await g.advance(.6);await g.shot(`${P}-10-store-lid`);
// rack close
await tp(-14.6,4.6);await g.advance(.4);await g.orbit(-262,0);await g.shot(`${P}-11-rack-sidewall`);
console.log('errors',JSON.stringify(await g.close()));
