// Helper: capture the live THREE scene by patching Object3D.updateMatrixWorld (read-only inspection).
export async function grabScene(g){
  const u=(await g.page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name))).find(x=>/deps\/three\.js/.test(x));
  await g.page.evaluate(async(u)=>{const T=await import(u);window.__T=T;const o=T.Object3D.prototype.updateMatrixWorld;
    T.Object3D.prototype.updateMatrixWorld=function(f){if(this.isScene&&this.children.length>5)window.__scene=this;return o.call(this,f);};},u);
  await g.advance(.05);
  return g.page.evaluate(()=>!!window.__scene);
}
