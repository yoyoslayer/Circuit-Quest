import * as T from 'three';
import {toon,unlit,box,ico} from './kit';
export type Fx='debris'|'confetti'|'spark'|'dust'|'smoke'|'star'|'ring'|'flash';
interface Particle {mesh:T.Mesh;kind:Fx;velocity:T.Vector3;spin:T.Vector3;life:number;max:number;size:number}
const CONFETTI=['#e5484d','#3f7fd6','#6cc58a','#ffc94d','#b392f0','#f08a4b','#8fd3c8'];
const flatSquare=new T.PlaneGeometry(1,1);
// Impact star: a four-point flat star; ring: a thin floor shockwave; flash: a bright billboard.
const starShape=(()=>{const s=new T.Shape();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i%2?.22:.5;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i)s.lineTo(x,y);else s.moveTo(x,y);}s.closePath();return new T.ShapeGeometry(s);})();
const ringGeo=new T.RingGeometry(.8,1,40).rotateX(-Math.PI/2);
const hotMaterials=new Map<string,T.Material>();
// Smoke and steam: translucent, unlit and unoutlined so puffs read as vapour, not snowballs.
const smokeMaterials=new Map<string,T.Material>();
const softSmoke=(c:string)=>{let m=smokeMaterials.get(c);if(!m){const b=new T.MeshBasicMaterial({color:c,transparent:true,opacity:.45,depthWrite:false});b.userData.outlineParameters={visible:false};m=b;smokeMaterials.set(c,m);}return m;};
const hotFlat=(c:string,k:number,additive=false)=>{const key=c+k+additive;let m=hotMaterials.get(key);if(!m){const b=new T.MeshBasicMaterial({color:c,side:T.DoubleSide,transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending});b.color.multiplyScalar(k);b.userData.outlineParameters={visible:false};m=b;hotMaterials.set(key,m);}return m;};
const confettiMaterials=new Map<string,T.Material>();
// Confetti gets its own double-sided materials so shared prop materials stay single-sided.
const confetti=(c:string)=>{let m=confettiMaterials.get(c);if(!m){m=toon(c).clone();m.side=T.DoubleSide;confettiMaterials.set(c,m);}return m;};
const sparkMaterials=new Map<string,T.Material>();
const spark=(c:string)=>{let m=sparkMaterials.get(c);if(!m){m=unlit(c);sparkMaterials.set(c,m);}return m;};
/** Pooled particles: meshes share geometry/materials and shrink out instead of fading. */
export class Particles {
  private live:Particle[]=[];private pool:T.Mesh[]=[];
  constructor(private root:T.Object3D,private limit=420){}
  spawn(kind:Fx,at:{x:number;y:number;z:number},count:number,color='#e1d4b7'){
    for(let i=0;i<count&&this.live.length<this.limit;i++){
      const mesh=this.pool.pop()??new T.Mesh();mesh.castShadow=false;mesh.position.set(at.x,at.y,at.z);mesh.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
      const r=()=>Math.random()-.5;let velocity:T.Vector3,life:number,size:number;
      if(kind==='confetti'){mesh.geometry=flatSquare;mesh.material=confetti(CONFETTI[i%CONFETTI.length]);velocity=new T.Vector3(r()*7,5+Math.random()*6,r()*7);life=2.4+Math.random();size=.16;}
      else if(kind==='spark'){mesh.geometry=box(1,1,1);mesh.material=spark(color);velocity=new T.Vector3(r()*9,2+Math.random()*5,r()*9);life=.35+Math.random()*.3;size=.05;}
      else if(kind==='star'){mesh.geometry=starShape;mesh.material=hotFlat(color,2.4);velocity=new T.Vector3(r()*3,2+Math.random()*2,r()*3);life=.45;size=.35;}
      else if(kind==='ring'){mesh.geometry=ringGeo;mesh.material=hotFlat(color,2,true);mesh.rotation.set(0,0,0);velocity=new T.Vector3();life=.45;size=.2;}
      else if(kind==='flash'){mesh.geometry=starShape;mesh.material=hotFlat(color,3.5,true);velocity=new T.Vector3();life=.18;size=1.4;}
      else if(kind==='smoke'){mesh.geometry=ico(1);mesh.material=softSmoke(color);velocity=new T.Vector3(r()*.5,.7+Math.random()*.5,r()*.5);life=1.3+Math.random()*.6;size=.14+Math.random()*.08;}
      else if(kind==='dust'){mesh.geometry=ico(1);mesh.material=toon(color);velocity=new T.Vector3(r()*1.6,.4+Math.random()*.6,r()*1.6);life=.7+Math.random()*.4;size=.12+Math.random()*.1;}
      else {mesh.geometry=box(1,1,1);mesh.material=toon(color);velocity=new T.Vector3(r()*5,2+Math.random()*4,r()*5);life=1.1+Math.random();size=.09;}
      mesh.scale.setScalar(size);this.root.add(mesh);
      this.live.push({mesh,kind,velocity,spin:new T.Vector3(r()*9,r()*9,r()*9),life,max:life,size});
    }
  }
  update(dt:number){
    for(let i=this.live.length-1;i>=0;i--){const p=this.live[i];p.life-=dt;
      if(p.life<=0){this.root.remove(p.mesh);this.pool.push(p.mesh);this.live.splice(i,1);continue;}
      const t=p.life/p.max;
      if(p.kind==='confetti'){p.velocity.y=Math.max(p.velocity.y-9*dt,-1.2);p.velocity.x*=1-dt*1.5;p.velocity.z*=1-dt*1.5;p.mesh.position.x+=Math.sin(p.life*7+i)*dt*.6;}
      else if(p.kind==='ring'){p.mesh.scale.setScalar(p.size+(1-t)*1.6);(p.mesh.material as T.Material).opacity=t;continue;}
      else if(p.kind==='flash'){p.mesh.scale.setScalar(p.size*(.6+(1-t)*.8));p.mesh.lookAt(p.mesh.position.clone().add(new T.Vector3(0,1,1)));continue;}
      else if(p.kind==='smoke'){p.velocity.x*=1-dt;p.velocity.z*=1-dt;p.mesh.scale.setScalar(p.size*(1+(1-t)*2.2)*(t<.25?Math.ceil(t*8)/2:1));}
      else if(p.kind==='dust'){p.velocity.multiplyScalar(1-dt*2);p.mesh.scale.setScalar(p.size*(1+(1-t)*1.8)*Math.min(1,t*3));}
      else p.velocity.y-=(p.kind==='spark'?14:8)*dt;
      p.mesh.position.addScaledVector(p.velocity,dt);if(p.mesh.position.y<.03&&p.kind!=='dust'){p.mesh.position.y=.03;p.velocity.set(p.velocity.x*.5,Math.abs(p.velocity.y)*.25,p.velocity.z*.5);}
      p.mesh.rotation.x+=p.spin.x*dt;p.mesh.rotation.y+=p.spin.y*dt;p.mesh.rotation.z+=p.spin.z*dt;
      if(p.kind!=='dust'&&p.kind!=='smoke')p.mesh.scale.setScalar(p.size*Math.min(1,t*4));
    }
  }
  get count(){return this.live.length;}
}
