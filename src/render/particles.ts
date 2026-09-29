import * as T from 'three';
import {toon,unlit,box,ico} from './kit';
export type Fx='debris'|'confetti'|'spark'|'dust';
interface Particle {mesh:T.Mesh;kind:Fx;velocity:T.Vector3;spin:T.Vector3;life:number;max:number;size:number}
const CONFETTI=['#e5484d','#3f7fd6','#6cc58a','#ffc94d','#b392f0','#f08a4b','#8fd3c8'];
const flatSquare=new T.PlaneGeometry(1,1);
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
      else if(p.kind==='dust'){p.velocity.multiplyScalar(1-dt*2);p.mesh.scale.setScalar(p.size*(1+(1-t)*1.8)*Math.min(1,t*3));}
      else p.velocity.y-=(p.kind==='spark'?14:8)*dt;
      p.mesh.position.addScaledVector(p.velocity,dt);if(p.mesh.position.y<.03&&p.kind!=='dust'){p.mesh.position.y=.03;p.velocity.set(p.velocity.x*.5,Math.abs(p.velocity.y)*.25,p.velocity.z*.5);}
      p.mesh.rotation.x+=p.spin.x*dt;p.mesh.rotation.y+=p.spin.y*dt;p.mesh.rotation.z+=p.spin.z*dt;
      if(p.kind!=='dust')p.mesh.scale.setScalar(p.size*Math.min(1,t*4));
    }
  }
  get count(){return this.live.length;}
}
