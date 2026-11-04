// Lid coverage test, mystery black cube, poster overlap, bench/chair overlaps, sprint dust, decor colliders.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const P='lunch-models';
const g=await launch('lunch',{fullfx:true});
await hook(g);
const W=async(x,z,r=.5)=>{const q=await g.walk(x,z,r);if(!q.arrived)console.log('STUCK',x,z,JSON.stringify(q.state.player));return q;};
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__g.player.setTranslation({x,y:.8,z},true);},[x,z]);
// Meshes near the lift-room black cube and the lid
console.log('near cube',JSON.stringify(await g.page.evaluate(()=>{const T=window.__g.view.scene;const out=[];const v={x:0,y:0,z:0};
  T.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;o.geometry.computeBoundingBox?.();const b=o.geometry.boundingBox;if(!b)return;const c=b.getCenter(new o.position.constructor()).applyMatrix4(o.matrixWorld);
    if(Math.hypot(c.x-11,c.z+5.6)<1.6&&c.y<1.2)out.push({type:o.material.type,color:o.material.color?.getHexString(),c:[+c.x.toFixed(2),+c.y.toFixed(2),+c.z.toFixed(2)],size:b.getSize(new o.position.constructor()).toArray().map(v=>+v.toFixed(2)),parent:o.parent?.type,vis:o.visible});});return out;})));
// Storeroom lid test from inside
await tp(-10.8,-5.6);await g.advance(.6);await g.zoom(-2000);
await g.shot(`${P}-70-lid-on`);
await g.page.evaluate(()=>{window.__g.lunch.dark.material.opacity=0;});await g.advance(.02);await g.shot(`${P}-71-lid-off`);
await g.page.evaluate(()=>{window.__g.lunch.dark.material.opacity=.8;});
// Which storeroom props render below the lid? list store props with screen positions
console.log('store props screen',JSON.stringify(await g.page.evaluate(()=>{const G=window.__g,cam=G.view.camera;return G.props.filter(p=>{const t=p.body.translation();return t.x<-7.8&&t.z<0;}).map(p=>{const t=p.body.translation();const v=new cam.position.constructor(t.x,t.y,t.z).project(cam);return {k:p.spec.kind,c:p.spec.color,x:+t.x.toFixed(1),z:+t.z.toFixed(1),y:+t.y.toFixed(2),sx:Math.round((v.x+1)/2*1440),sy:Math.round((1-v.y)/2*900),vis:p.mesh.visible};}).filter(q=>q.sx>0&&q.sx<1440&&q.sy>0&&q.sy<900);})));
// Posters on the side wall over the rack
await tp(-14.6,3.4);await g.advance(.4);
const y=await g.page.evaluate(()=>window.__g.yaw);console.log('yaw',y);
await g.orbit(-262,0);await g.shot(`${P}-72-side-wall-posters`);await g.orbit(262,0);
// Benches + blobs, from the room side
await tp(-3.2,7.2);await g.advance(.4);await g.orbit(525,0);await g.shot(`${P}-73-bench-blob-front`);await g.orbit(-525,0);
// Walk through the bench? (decor with no collider)
await tp(-4.2,8.4);await g.advance(.2);const r1=await W(-4.2,10.2,.2);console.log('bench walk-through end',JSON.stringify(r1.state.player));await g.shot(`${P}-74-pip-in-bench`);
// Plant by kitchen door: walk through?
await tp(-7.2,2.6);await g.advance(.2);const r2=await W(-7.2,-.2+1.0,.15);console.log('plant walk end',JSON.stringify(r2.state.player));await g.shot(`${P}-75-pip-in-plant`);
// Dining chair vs pink blob
await tp(13.6,6.6);await g.advance(.4);await g.orbit(525,0);await g.shot(`${P}-76-dining-blob-chair`);await g.orbit(-525,0);
// Sprint dust: long walk then shot right away
await tp(-1,4);await g.advance(.3);await g.zoom(1200);await W(9,4,.5);await g.shot(`${P}-77-sprint-dust`);
console.log('errors',JSON.stringify(await g.close()));
