// (c)+(d) Model bounds per prop kind vs Pip, and bevel/segment audit of every part geometry.
import {launch} from '../cap.mjs';
import {writeFileSync} from 'node:fs';
const g=await launch('playground',{fullfx:true});
await g.page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/deps\/three\.js/.test(n));const T=await import(url);window.__T=T;
  T.Object3D.prototype.onBeforeRender=function(r,s){if(s&&s.isScene)window.__scene=s;};});
await g.advance(.3);await g.page.waitForTimeout(800);
const r=await g.page.evaluate(async()=>{const T=window.__T,P=await import('/src/props/prefabs.ts'),A=await import('/src/render/actors.ts');const s=window.__scene;
  const bb=o=>{o.updateMatrixWorld(true);const b=new T.Box3().setFromObject(o,true);const v=b.getSize(new T.Vector3());return {w:+v.x.toFixed(3),h:+v.y.toFixed(3),d:+v.z.toFixed(3),minY:+b.min.y.toFixed(3)};};
  // Pip: the avatar holding the hat mesh
  let hat=null;s.traverse(o=>{if(o.isMesh&&/hat/i.test(o.name)&&!hat)hat=o;});let av=hat;const names=[];
  while(av&&av.parent&&av.parent!==s&&av.parent.children.length<40)av=av.parent;
  const pipB=av?bb(av):null;const pipFeet=av?new T.Box3().setFromObject(av,true):null;
  const meshNames=[];av?.traverse(o=>{if(o.isMesh)meshNames.push(o.name)});
  const blob=A.blob('#b392f0','calm',[]);const blobB=bb(blob);
  const kinds={};
  for(const k of Object.keys(P.prefabs)){const m=P.makeProp(k);const b=bb(m);const geos=[];
    m.traverse(o=>{if(!o.isMesh)return;const gm=o.geometry,p=gm.parameters??{};o.geometry.computeBoundingBox();const gb=gm.boundingBox.getSize(new T.Vector3());const sc=o.getWorldScale(new T.Vector3());
      const dims=[gb.x*sc.x,gb.y*sc.y,gb.z*sc.z],mn=Math.min(...dims);let note=null;
      if(gm.type==='BoxGeometry'&&mn>=.03)note=`SHARP box ${dims.map(v=>v.toFixed(2))}`;
      else if(gm.type==='RoundedBoxGeometry'){const rr=p.radius??Math.min(.025,mn*.2);if(rr<Math.max(.015,mn*.06))note=`rbox-small r=${rr.toFixed(3)} min=${mn.toFixed(2)} (${(rr/mn*100).toFixed(1)}%)`;}
      else if(gm.type==='ExtrudeGeometry'){const op=p.options??{};if(!op.bevelEnabled)note=`UNBEVELLED extrude ${dims.map(v=>v.toFixed(2))}`;else if(op.bevelThickness<Math.max(.015,mn*.06))note=`extrude-bevel ${op.bevelThickness.toFixed(3)} min=${mn.toFixed(2)} (${(op.bevelThickness/mn*100).toFixed(1)}%)`;}
      else if(/Cylinder|Cone/.test(gm.type)&&p.radialSegments<24)note=`${gm.type} seg=${p.radialSegments} r=${(p.radiusBottom??p.radius)?.toFixed(2)}`;
      else if(gm.type==='SphereGeometry'&&p.widthSegments<24)note=`sphere seg=${p.widthSegments}`;
      else if(gm.type==='TorusGeometry'&&p.radialSegments<8)note=`torus seg=${p.radialSegments}/${p.tubularSegments}`;
      if(note)geos.push(note);});
    kinds[k]={size:P.prefabs[k].size,model:b,issues:[...new Set(geos)]};}
  return {pip:pipB,meshNames:meshNames.slice(0,40),blob:blobB,kinds};});
writeFileSync(new URL('./scale.json',import.meta.url),JSON.stringify(r,null,1));
console.log('pip',JSON.stringify(r.pip),r.meshNames.join(','));console.log('blob',JSON.stringify(r.blob));
for(const [k,v] of Object.entries(r.kinds))console.log(k.padEnd(10),'prefab',JSON.stringify(v.size),'model',JSON.stringify(v.model),'\n     ',v.issues.join(' | '));
console.log(await g.close());
