// Read-only runtime introspection: patches Game.prototype.render in the page (no file changes) to expose the live Game.
export async function hook(g){
  await g.page.evaluate(async()=>{const m=await import('/src/game.ts');const P=m.Game.prototype;if(!P.__hooked){const o=P.render;P.render=function(dt){window.__game=this;return o.call(this,dt);};P.__hooked=true;}});
  await g.advance(.05);
  const ok=await g.page.evaluate(()=>!!window.__game);if(!ok)throw new Error('hook failed');
}
// Pip occlusion: rays from camera to feet/chest/head; lists blockers that are opaque (opacity>0.3).
export async function occl(g){return g.page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js').catch(()=>null)??await import('three');
  const G=window.__game,cam=G.view.camera,p=G.player.translation();
  const avatar=G.avatar,skip=new Set();avatar.traverse(o=>skip.add(o));[G.pipRing,G.reticle,G.hint].forEach(o=>o&&o.traverse(c=>skip.add(c)));
  const meshes=[];G.view.scene.traverse(o=>{if(!o.isMesh&&!o.isInstancedMesh)return;if(skip.has(o))return;let v=true,q=o;while(q){if(!q.visible){v=false;break;}q=q.parent;}if(!v)return;meshes.push(o);});
  const pts={feet:p.y-.65,chest:p.y+.05,head:p.y+.75};const out={};
  const rc=new T.Raycaster();
  for(const [k,y] of Object.entries(pts)){const end=new T.Vector3(p.x,y,p.z),dir=end.clone().sub(cam.position);const d=dir.length();rc.set(cam.position,dir.normalize());rc.far=d-.35;rc.near=0;
    const hits=rc.intersectObjects(meshes,false).filter(h=>{const m=Array.isArray(h.object.material)?h.object.material[0]:h.object.material;if(!m||m.visible===false)return false;if(m.opacity!==undefined&&m.transparent&&m.opacity<.3)return false;if(m.blending===T.AdditiveBlending)return false;if(h.object.isSprite)return false;return true;});
    out[k]=hits.slice(0,3).map(h=>{const m=Array.isArray(h.object.material)?h.object.material[0]:h.object.material;h.object.geometry.computeBoundingBox?.();const bb=new T.Box3().setFromObject(h.object);return {name:h.object.name||h.object.type,mat:m.type,op:+(m.opacity??1).toFixed(2),occluder:G.occluders.includes(h.object),hitY:+h.point.y.toFixed(2),bbH:+(bb.max.y-bb.min.y).toFixed(2),bbTop:+bb.max.y.toFixed(2),at:[+h.point.x.toFixed(1),+h.point.z.toFixed(1)]};});}
  return {cam:[+cam.position.x.toFixed(1),+cam.position.y.toFixed(1),+cam.position.z.toFixed(1)],pip:[+p.x.toFixed(1),+p.y.toFixed(1),+p.z.toFixed(1)],yaw:+G.yaw.toFixed(2),pitch:+G.pitch.toFixed(2),zoom:+G.zoom.toFixed(1),blocked:out};});}
export async function stats(g){return g.page.evaluate(()=>{const G=window.__game;let pl=0,mats={},tris=G.view.renderer.info.render.triangles;G.view.scene.traverse(o=>{if(o.isPointLight)pl++;if(o.isMesh){const m=Array.isArray(o.material)?o.material[0]:o.material;mats[m.type]=(mats[m.type]||0)+1;}});
  return {draw:G.view.renderer.info.render.calls,tris,fps:+G.fps.toFixed(0),points:pl,mats,occluders:G.occluders.length,shell:G.shellWalls.length,quality:G.view.getQuality(),camNear:G.view.camera.near};});}
export async function camInfo(g){return g.page.evaluate(()=>{const G=window.__game,c=G.view.camera;return {cam:[+c.position.x.toFixed(2),+c.position.y.toFixed(2),+c.position.z.toFixed(2)],focus:[+G.focus.x.toFixed(2),+G.focus.y.toFixed(2),+G.focus.z.toFixed(2)],yaw:+G.yaw.toFixed(2),pitch:G.pitch,zoom:G.zoom,survey:G.survey,w:G.level.width,d:G.level.depth};});}
