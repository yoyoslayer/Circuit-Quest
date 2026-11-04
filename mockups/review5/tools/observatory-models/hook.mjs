// Read-only scene capture: remembers the Scene the game updates each frame (no game code is changed).
export async function hook(g){
  await g.page.evaluate(async()=>{const u=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/deps\/three\.js/.test(n));const T=await import(u);window.__T=T;
    const P=T.Object3D.prototype.updateMatrixWorld;T.Object3D.prototype.updateMatrixWorld=function(f){if(this.isScene&&this.children.length>3)window.__scene=this;return P.call(this,f);};});
  await g.advance(.05);
}
