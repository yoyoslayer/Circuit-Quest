// Pip's real height, plus on-screen pixel size of handheld kinds at the default game camera.
import {launch} from '../cap.mjs';
const g=await launch('meeting',{fullfx:true});
await g.page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/deps\/three\.js/.test(n));const T=await import(url);window.__T=T;
  T.Object3D.prototype.onBeforeRender=function(r,s,c){if(s&&s.isScene){window.__scene=s;if(c?.isPerspectiveCamera&&c.fov===30)window.__cam=c;}};});
await g.advance(.3);await g.page.waitForTimeout(800);
const r=await g.page.evaluate(()=>{const T=window.__T,s=window.__scene,c=window.__cam;let hat=null;
  s.traverse(o=>{if(o.isMesh&&o.material?.color?.getHexString()==='fdd161'&&!hat)hat=o;});
  const chain=[];let a=hat;while(a){const b=new T.Box3().setFromObject(a,true),v=b.getSize(new T.Vector3());chain.push({name:a.name,type:a.type,kids:a.children.length,h:+v.y.toFixed(3),w:+v.x.toFixed(3),d:+v.z.toFixed(3),minY:+b.min.y.toFixed(3),maxY:+b.max.y.toFixed(3)});if(v.y>1.5)break;a=a.parent;}
  const names=[];a?.traverse(o=>{if(o.isMesh)names.push(o.name+':'+o.material.color.getHexString())});
  return {chain,names};});
console.log(JSON.stringify(r,null,0));
// pixel size of mugs/plug at default camera
const px=await g.page.evaluate(()=>{const T=window.__T,s=window.__scene,c=window.__cam,W=innerWidth,H=innerHeight;const out=[];
  s.traverse(o=>{if(o.isMesh&&o.geometry.type==='TorusGeometry'&&o.geometry.parameters.arc&&Math.abs(o.geometry.parameters.arc-Math.PI)<.01&&Math.abs(o.geometry.parameters.radius-.044)<.002){const p=o.parent;const b=new T.Box3().setFromObject(p,true);const pts=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const q=new T.Vector3(x,y,z).project(c);pts.push([(q.x+1)/2*W,(1-q.y)/2*H,q.z]);}
    const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);if(pts.every(p=>p[2]<1&&p[0]>0&&p[0]<W&&p[1]>0&&p[1]<H))out.push([+(Math.max(...xs)-Math.min(...xs)).toFixed(1),+(Math.max(...ys)-Math.min(...ys)).toFixed(1)]);}});return out;});
console.log('mug screen px (w,h) at default camera:',JSON.stringify(px.slice(0,12)));
const sn=await g.snap();console.log('zoom',sn.camera??sn.zoom, Object.keys(sn).join(','));
console.log(await g.close());
