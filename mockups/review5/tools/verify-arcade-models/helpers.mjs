export async function grab(g){
  const u=(await g.page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name))).find(x=>/deps\/three\.js/.test(x));
  await g.page.evaluate(async(u)=>{const T=await import(u);window.__T=T;const o=T.Object3D.prototype.updateMatrixWorld;
    T.Object3D.prototype.updateMatrixWorld=function(f){if(this.isScene&&this.children.length>5)window.__scene=this;if(this.isPerspectiveCamera)window.__cam=this;return o.call(this,f);};},u);
  await g.advance(.05);
}
// Raycast from camera to Pip at feet/chest/head against all visible meshes; report first hits.
export const rays=g=>g.page.evaluate(()=>{const T=window.__T,s=window.__scene,c=window.__cam,p=window.__circuitCrew.snapshot().player;const out={cam:[+c.position.x.toFixed(2),+c.position.y.toFixed(2),+c.position.z.toFixed(2)],pip:[+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2)]};
  const meshes=[];s.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){let v=true,q=o;while(q){if(!q.visible){v=false;break;}q=q.parent;}if(v)meshes.push(o);}});
  for(const [n,dy] of [['feet',-.6],['chest',.4],['head',1.0]]){const e=new T.Vector3(p.x,p.y+dy,p.z),d=e.clone().sub(c.position);const len=d.length();const r=new T.Raycaster(c.position.clone(),d.normalize(),0,len-.5);
    const h=r.intersectObjects(meshes,false).filter(h=>{const m=h.object.material;return !(m.transparent&&m.opacity<.5);});out[n]=h.slice(0,2).map(h=>({d:+h.distance.toFixed(2),op:+(h.object.material.opacity??1).toFixed(2),tr:!!h.object.material.transparent,col:h.object.material.color?.getHexString(),pt:[+h.point.x.toFixed(2),+h.point.y.toFixed(2),+h.point.z.toFixed(2)]}));}
  return out;});
