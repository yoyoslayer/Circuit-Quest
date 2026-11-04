// (a) Material census per room: types per mesh, glossyToon meshes with colour/size/position, toon without ramp/rim.
import {launch} from '../cap.mjs';
import {writeFileSync} from 'node:fs';
const levels=(process.argv[2]??'lobby,playground,meeting,lunch,arcade,arcade-rush,garage,qfn,observatory,spectrum').split(',');
const out={};
for(const lv of levels){
  const g=await launch(lv,{fullfx:true});
  await g.page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/deps\/three\.js/.test(n));const T=await import(url);window.__T=T;
    const o=T.Object3D.prototype.onBeforeRender;T.Object3D.prototype.onBeforeRender=function(r,s){if(s&&s.isScene)window.__scene=s;};});
  await g.advance(.5);await g.page.waitForTimeout(600);
  const r=await g.page.evaluate(()=>{const T=window.__T,s=window.__scene;if(!s)return {err:'no scene'};
    const ramp=new Set();const types={},gloss=[],noramp=[],norim={},basicLit=[];let meshes=0;
    s.traverse(o=>{if(!(o.isMesh||o.isSprite||o.isLine||o.isPoints||o.isInstancedMesh))return;if(!o.visible)return;
      const mats=Array.isArray(o.material)?o.material:[o.material];
      for(const m of mats){meshes++;let t=m.type;const key=m.customProgramCacheKey?.()??'';
        if(t==='MeshToonMaterial'&&/glossy/.test(key))t='glossyToon';else if(t==='MeshToonMaterial'&&key==='toonRim')t='toon';else if(t==='MeshToonMaterial')t='toon(no rim/clone)';
        types[t]=(types[t]??0)+1;
        if(m.isMeshToonMaterial&&!m.gradientMap)noramp.push('#'+m.color.getHexString());
        if(t==='toon(no rim/clone)'){const c='#'+m.color.getHexString();norim[c]=(norim[c]??0)+1;}
        if(m.gradientMap)ramp.add(m.gradientMap.image.width+'x'+m.gradientMap.magFilter);
        if(t==='glossyToon'||/Standard|Phong|Lambert|Physical/.test(t)){o.geometry.computeBoundingBox?.();const b=o.geometry.boundingBox,sz=b?[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z].map(v=>+v.toFixed(2)):null;const p=new T.Vector3();o.getWorldPosition(p);
          gloss.push({t,c:'#'+m.color.getHexString(),vc:!!m.vertexColors,geo:o.geometry.type,size:sz,pos:[p.x,p.y,p.z].map(v=>+v.toFixed(1)),name:o.name||o.parent?.name||''});}
      }});
    // group gloss by colour+geo
    const gg={};for(const x of gloss){const k=`${x.t} ${x.c} ${x.geo} ${x.vc?'vc':''}`;(gg[k]??=[]).push(x);}
    const glossSum=Object.entries(gg).map(([k,v])=>({k,n:v.length,size:v[0].size,pos:v.slice(0,3).map(q=>q.pos)}));
    return {meshes,types,ramp:[...ramp],noramp,norim,glossSum};});
  out[lv]=r;console.log(lv,JSON.stringify(r.types),'ramp',r.ramp, 'norim',JSON.stringify(r.norim));for(const x of r.glossSum??[])console.log('   ',x.k,'n='+x.n,JSON.stringify(x.size),JSON.stringify(x.pos));
  console.log('  errors',await g.close());
}
writeFileSync(new URL('./materials.json',import.meta.url),JSON.stringify(out,null,1));
