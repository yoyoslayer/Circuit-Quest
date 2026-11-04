// gap7 helpers (read-only introspection; no repo files changed).
export const K='snap-grab-target';
export async function hook(g){
  await g.page.evaluate(async()=>{const m=await import('/src/game.ts');const P=m.Game.prototype;if(!P.__hooked){const o=P.render;P.render=function(dt){window.__game=this;return o.call(this,dt);};P.__hooked=true;}
    window.__T=await import('/node_modules/.vite/deps/three.js').catch(()=>null)??await import('three');});
  await g.advance(.05);
}
// Prompt pill text, reticle target and marker state.
export const ui=g=>g.page.evaluate(()=>{const G=window.__game,pill=document.querySelector('.prompt-pill');const r=G.reticle;
  const near=G.nearest?.();const p=G.player.translation();
  let markerObj=null;G.root.traverse(o=>{if(o.isMesh&&o.geometry?.type==='ConeGeometry'&&o.material?.color&&o.geometry.parameters?.radius===.22)markerObj=o;});
  return {prompt:pill&&!pill.hidden?pill.textContent:null,reticle:r.visible?[+r.position.x.toFixed(2),+r.position.z.toFixed(2)]:null,
    nearest:near?{kind:near.spec.kind,id:near.spec.id,d:+Math.hypot(near.body.translation().x-p.x,near.body.translation().z-p.z).toFixed(2)}:null,
    marker:markerObj&&markerObj.visible?[+markerObj.position.x.toFixed(2),+markerObj.position.y.toFixed(2),+markerObj.position.z.toFixed(2)]:null,
    pip:[+p.x.toFixed(2),+p.z.toFixed(2)],holdingPlug:G.holdingPlug,connected:G.connected,held:G.held?.spec.id??G.held?.spec.kind??null,
    plug:[+G.plugPosition.x.toFixed(2),+G.plugPosition.z.toFixed(2)],strain:+G.rope?.strain?.toFixed(2)};});
// Props near a point (for junk-vs-job grab tests).
export const propsNear=(g,x,z,r=2.5)=>g.page.evaluate(([x,z,r])=>{const G=window.__game;return G.props.filter(p=>p.mesh.visible).map(p=>{const t=p.body.translation();return {kind:p.spec.kind,id:p.spec.id??null,x:+t.x.toFixed(2),y:+t.y.toFixed(2),z:+t.z.toFixed(2),d:+Math.hypot(t.x-x,t.z-z).toFixed(2)};}).filter(q=>q.d<r).sort((a,b)=>a.d-b.d);},[x,z,r]);
// Is a world point visible from the camera? Raycast against visible opaque meshes (skips Pip, marker, reticle, rings).
export const vis=(g,pts)=>g.page.evaluate((pts)=>{const T=window.__T,G=window.__game,cam=G.view.camera;cam.updateMatrixWorld();
  const skip=new Set();[G.avatar,G.pipRing,G.reticle,G.hint].forEach(o=>o&&o.traverse(c=>skip.add(c)));
  G.root.traverse(o=>{if(o.isMesh&&o.geometry?.type==='ConeGeometry'&&o.geometry.parameters?.radius===.22)skip.add(o);});
  const meshes=[];G.view.scene.traverse(o=>{if(!(o.isMesh||o.isInstancedMesh)||skip.has(o))return;let q=o;while(q){if(!q.visible)return;q=q.parent;}meshes.push(o);});
  const rc=new T.Raycaster();return pts.map(([x,y,z,name])=>{const end=new T.Vector3(x,y,z),ndc=end.clone().project(cam);const inFrame=Math.abs(ndc.x)<1&&Math.abs(ndc.y)<1&&ndc.z<1;
    const dir=end.clone().sub(cam.position),d=dir.length();rc.set(cam.position,dir.normalize());rc.far=d-.3;
    const hits=rc.intersectObjects(meshes,false).filter(h=>{const m=Array.isArray(h.object.material)?h.object.material[0]:h.object.material;if(!m)return false;if(m.transparent&&m.opacity<.35)return false;if(m.blending===T.AdditiveBlending)return false;return true;});
    const h=hits[0];let by=null;if(h){const bb=new T.Box3().setFromObject(h.object);by={n:h.object.name||h.object.parent?.name||h.object.type,h:+(bb.max.y-bb.min.y).toFixed(2),at:[+h.point.x.toFixed(1),+h.point.y.toFixed(1),+h.point.z.toFixed(1)],occ:G.occluders.includes(h.object),op:+(h.object.material.opacity??1).toFixed(2)};}
    return {name,inFrame,px:[Math.round((ndc.x+1)/2*innerWidth),Math.round((1-ndc.y)/2*innerHeight)],blocked:by};});},pts);
// Sweep 8 yaws at two zooms; returns rows. markerPts: [[x,y,z,name],...]
export async function sweep(g,pts,label,shotEvery=null){const rows=[];
  for(const z of [9,38]){await g.page.evaluate(z=>{window.__game.zoom=z;window.__game.survey=false;},z);
    for(let k=0;k<8;k++){await g.page.evaluate(k=>{window.__game.yaw=.14+k*Math.PI/4;},k);await g.advance(.9);await g.page.waitForTimeout(900);
      const v=await vis(g,pts);rows.push({zoom:z,yaw:k*45,v});
      if(shotEvery&&shotEvery(z,k,v))await g.shot(`${K}-${label}-z${z}-y${k*45}`);}}
  await g.page.evaluate(()=>{window.__game.yaw=.14;window.__game.zoom=window.__game.homeZoom();});await g.advance(.6);
  return rows;}
export const summarize=rows=>rows.map(r=>`z${r.zoom} y${r.yaw}: `+r.v.map(v=>`${v.name}:${!v.inFrame?'OFF':v.blocked?'HID('+v.blocked.n+' h'+v.blocked.h+(v.blocked.occ?' occ op'+v.blocked.op:'')+')':'ok'}`).join(' ')).join('\n');
// Face a point and walk up so Pip stands `d` m (horizontal) from (tx,tz) along the line from current position.
export async function approach(g,tx,tz,d,r=.15){const p=(await g.snap()).player;const dx=p.x-tx,dz=p.z-tz,L=Math.hypot(dx,dz)||1;return g.walk(tx+dx/L*d,tz+dz/L*d,r,15);}
