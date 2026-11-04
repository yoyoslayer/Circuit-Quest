import * as T from 'three';
import {makeProp,prefabs,type PropKind} from '../../../../src/props/prefabs';
const out:any={};
for(const k of Object.keys(prefabs) as PropKind[]){const g=makeProp(k);g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g);const s=prefabs[k].size;
  let meshes=0,tris=0;const mats=new Set<string>();g.traverse(o=>{if((o as T.Mesh).isMesh){meshes++;const m=o as T.Mesh;const geo=m.geometry;tris+=(geo.index?geo.index.count:geo.attributes.position.count)/3;mats.add((m.material as T.Material).type);}});
  // volume fill: sample grid points inside collider, test if inside any mesh bbox (rough)
  out[k]={size:s,min:b.min.toArray().map(v=>+v.toFixed(3)),max:b.max.toArray().map(v=>+v.toFixed(3)),
    over:[+(b.max.x-s[0]/2).toFixed(3),+(b.max.y-s[1]/2).toFixed(3),+(b.max.z-s[2]/2).toFixed(3)],
    under:[+(-s[0]/2-b.min.x).toFixed(3),+(-s[1]/2-b.min.y).toFixed(3),+(-s[2]/2-b.min.z).toFixed(3)],meshes,tris:Math.round(tris),mats:[...mats]};}
(window as any).measure=out;document.body.dataset.ready='true';
