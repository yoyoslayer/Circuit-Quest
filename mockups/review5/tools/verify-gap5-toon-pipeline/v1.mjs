import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});
await g.page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/deps\/three\.js/.test(n));const T=await import(url);window.__T=T;
  T.Object3D.prototype.onBeforeRender=function(r,s){if(s&&s.isScene){window.__scene=s;window.__r=r;}};});
await g.advance(.3);await g.page.waitForTimeout(800);
const r=await g.page.evaluate(async()=>{const T=window.__T,P=await import('/src/props/prefabs.ts'),K=await import('/src/render/kit.ts'),A=await import('/src/render/actors.ts');const s=window.__scene;
  const bb=o=>{o.updateMatrixWorld(true);const b=new T.Box3().setFromObject(o,true);const v=b.getSize(new T.Vector3());return [+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3),+b.min.y.toFixed(3),+b.max.y.toFixed(3)];};
  const out={};for(const k of ['plug','coupler','strip','reel','splitter','chair','coolbox','cooler','cart','wedge','bridge','box','mug'])out[k]={size:P.prefabs[k].size,model:bb(P.makeProp(k))};
  const t=K.toon('#123456'),c=t.clone();out.clone={same:c.onBeforeCompile===t.onBeforeCompile,key:c.customProgramCacheKey(),orig:t.customProgramCacheKey()};
  const gl=A.glossyToon('#fefefe');out.glossySrc=gl.onBeforeCompile.toString().includes('rim');
  // compiled programs: count fragment shaders with rimColor among materials in scene
  let rim=0,no=0,glossyN=0,noList={};const seen=new Set();
  s.traverse(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(!m.isMeshToonMaterial||seen.has(m))continue;seen.add(m);const k=m.customProgramCacheKey();if(k==='toonRim')rim++;else if(k.startsWith('glossyToon'))glossyN++;else{no++;const n='#'+m.color.getHexString()+(m.vertexColors?'(vc)':'');noList[n]=(noList[n]||0)+1;}}});
  out.census={rim,glossyN,no,noList};
  // Pip
  let hat=null;s.traverse(o=>{if(o.isMesh&&/hat/i.test(o.name)&&!hat)hat=o;});out.hatKey=hat?.material.customProgramCacheKey();
  let av=hat;while(av&&av.parent&&av.parent!==s&&av.parent.children.length<40)av=av.parent;out.pip=av?bb(av):null;out.blob=bb(A.blob('#b392f0'));
  return out;});
console.log(JSON.stringify(r,null,0));
console.log(await g.close());
