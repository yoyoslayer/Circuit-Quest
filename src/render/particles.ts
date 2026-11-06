import * as T from 'three';
import {toon,box,ico,canvasTex} from './kit';
export type Fx='debris'|'confetti'|'spark'|'dust'|'smoke'|'star'|'ring'|'flash'|'puff';
interface Particle {mesh:T.Mesh;kind:Fx;velocity:T.Vector3;spin:T.Vector3;life:number;max:number;size:number}
const CONFETTI=['#e5484d','#3f7fd6','#6cc58a','#ffc94d','#b392f0','#f08a4b','#8fd3c8'];
const flatSquare=new T.PlaneGeometry(1,1);
// Impact star: a four-point flat star; ring: a thin floor shockwave; flash: a bright billboard.
const starShape=(()=>{const s=new T.Shape();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i%2?.22:.5;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i)s.lineTo(x,y);else s.moveTo(x,y);}s.closePath();return new T.ShapeGeometry(s);})();
const ringGeo=new T.RingGeometry(.8,1,40).rotateX(-Math.PI/2);
// Spark: a unit streak that trails back from its head along -z; stretched along its velocity each frame.
const streakGeo=new T.BoxGeometry(1,1,1).translate(0,0,-.5);
const hotMaterials=new Map<string,T.Material>();
// Smoke and steam: translucent, unlit and unoutlined so puffs read as vapour, not snowballs.
const hotFlat=(c:string,k:number,additive=false)=>{const key=c+k+additive;let m=hotMaterials.get(key);if(!m){const b=new T.MeshBasicMaterial({color:c,side:T.DoubleSide,transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending});b.color.multiplyScalar(k);b.userData.outlineParameters={visible:false};m=b;hotMaterials.set(key,m);}return m;};
const confettiMaterials=new Map<string,T.Material>();
// Confetti gets its own double-sided materials so shared prop materials stay single-sided.
const confetti=(c:string)=>{let m=confettiMaterials.get(c);if(!m){m=toon(c).clone();m.side=T.DoubleSide;confettiMaterials.set(c,m);}return m;};
// Dust and smoke (R5-313/314): a camera-facing quad with a shared soft radial falloff, so a puff has
// no hard disc edge and no outline. The alpha map reads the green channel: white centre, black rim.
let softMap:T.Texture|undefined;
const soft=()=>softMap??=canvasTex(64,64,c=>{c.fillStyle='#000';c.fillRect(0,0,64,64);const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.3,'#fff');g.addColorStop(.65,'#777');g.addColorStop(1,'#000');c.fillStyle=g;c.fillRect(0,0,64,64);});
// A 2 × 2 quad so `size` stays the puff radius, as it was for the unit ico.
const quad=new T.PlaneGeometry(2,2);
const noop=()=>{};
/** Turns a puff to face the camera just before it is drawn (after the scene's matrix update). */
function billboard(this:T.Mesh,_r:T.WebGLRenderer,_s:T.Scene,camera:T.Camera){this.quaternion.copy(camera.quaternion);this.updateMatrixWorld();}
const dim=new T.Color(),VAPOUR=new T.Color('#9fb0cc');
/** Each puff keeps its own fading material on its pooled mesh. */
function puffMaterial(mesh:T.Mesh,color:string,map=false){
  let m=mesh.userData.smoke as T.MeshBasicMaterial|undefined;if(!m){m=new T.MeshBasicMaterial({transparent:true,depthWrite:false});m.userData.outlineParameters={visible:false};mesh.userData.smoke=m;}
  m.color.set(color);m.opacity=0;const alpha=map?soft():null;if(m.alphaMap!==alpha){m.alphaMap=alpha;m.needsUpdate=true;}mesh.material=m;return m;
}
/** Each ring fades its own material on its pooled mesh (render-4): with one shared per colour, a new
 *  ring took the oldest live ring's nearly-faded opacity, then popped to full when that one died. */
function ringMaterial(mesh:T.Mesh,color:string){
  let m=mesh.userData.ring as T.MeshBasicMaterial|undefined;if(!m){m=new T.MeshBasicMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending});m.userData.outlineParameters={visible:false};mesh.userData.ring=m;}
  m.color.set(color).multiplyScalar(2);m.opacity=1;mesh.material=m;return m;
}
/** Pooled particles: meshes share geometry/materials and shrink out instead of fading. */
export class Particles {
  private live:Particle[]=[];private pool:T.Mesh[]=[];
  constructor(private root:T.Object3D,private limit=420){}
  spawn(kind:Fx,at:{x:number;y:number;z:number},count:number,color='#e1d4b7'){
    for(let i=0;i<count&&this.live.length<this.limit;i++){
      const mesh=this.pool.pop()??new T.Mesh();mesh.castShadow=false;mesh.position.set(at.x,at.y,at.z);mesh.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);mesh.onBeforeRender=noop;mesh.renderOrder=0;
      const r=()=>Math.random()-.5;let velocity:T.Vector3,life:number,size:number;
      if(kind==='confetti'){mesh.geometry=flatSquare;mesh.material=confetti(CONFETTI[i%CONFETTI.length]);velocity=new T.Vector3(r()*7,5+Math.random()*6,r()*7);life=2.4+Math.random();size=.16;}
      else if(kind==='spark'){mesh.geometry=streakGeo;mesh.material=hotFlat(color,2.2,true);velocity=new T.Vector3(r()*10,2.5+Math.random()*5.5,r()*10);life=.3+Math.random()*.35;size=.016;}
      else if(kind==='star'){mesh.geometry=starShape;mesh.material=hotFlat(color,2.4);velocity=new T.Vector3(r()*3,2+Math.random()*2,r()*3);life=.45;size=.35;}
      else if(kind==='ring'){mesh.geometry=ringGeo;ringMaterial(mesh,color);mesh.rotation.set(0,0,0);velocity=new T.Vector3();life=.45;size=.2;}
      else if(kind==='flash'){mesh.geometry=starShape;mesh.material=hotFlat(color,3.5,true);velocity=new T.Vector3();life=.18;size=1.4;}
      else if(kind==='puff'){
        // A small, low, short puff (impacts, a popped part): unoutlined, drifting sideways, gone in ~0.6 s,
        // so it never covers what it came from (R5-240, R5-327).
        puffMaterial(mesh,color);mesh.geometry=ico(1);velocity=new T.Vector3((Math.random()<.5?-1:1)*(.25+Math.random()*.3),.2+Math.random()*.15,r()*.2);life=.45+Math.random()*.25;size=.06+Math.random()*.04;}
      else if(kind==='smoke'){
        // Steam: soft, peaks at .28 opacity, grows at most 2.2×, and drifts sideways (±0.15 m/s) so
        // successive puffs separate instead of stacking into a column of discs (R5-314).
        // A cool grey-blue cast so a pale puff still reads over cream walls and white appliances.
        dim.set(color).lerp(VAPOUR,.4);puffMaterial(mesh,'#'+dim.getHexString(),true);mesh.geometry=quad;mesh.onBeforeRender=billboard;mesh.renderOrder=2;velocity=new T.Vector3(r()*.3,.7+Math.random()*.5,r()*.3);life=1.3+Math.random()*.6;size=.14+Math.random()*.08;}
      else if(kind==='dust'){
        // Footstep and landing dust: a low, flattened, soft scuff a little darker than the floor colour
        // it is given, fading .45 → 0 over 0.45 s (R5-313). No outline, no sphere.
        dim.set(color).offsetHSL(0,0,-.12);puffMaterial(mesh,'#'+dim.getHexString(),true);mesh.geometry=quad;mesh.onBeforeRender=billboard;mesh.renderOrder=1;
        velocity=new T.Vector3(r()*1.2,.15+Math.random()*.25,r()*1.2);life=.45;size=.16+Math.random()*.04;}
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
      else if(p.kind==='puff'){const age=1-t;p.mesh.scale.setScalar(p.size*(1+age*.8));(p.mesh.material as T.MeshBasicMaterial).opacity=.3*Math.min(1,age*8)*t;}
      else if(p.kind==='smoke'){p.velocity.x*=1-dt*.3;p.velocity.z*=1-dt*.3;p.velocity.y*=1-dt*.6;const age=1-t;p.mesh.scale.setScalar(p.size*(1+Math.sqrt(age)*1.2));
        (p.mesh.material as T.MeshBasicMaterial).opacity=.28*Math.min(1,age*7)*Math.pow(t,.8);p.mesh.position.addScaledVector(p.velocity,dt);continue;}
      else if(p.kind==='dust'){p.velocity.multiplyScalar(1-dt*3);const age=1-t,s=p.size*(1+age*1.2);p.mesh.scale.set(s,s*.45,s);
        (p.mesh.material as T.MeshBasicMaterial).opacity=.45*t;p.mesh.position.addScaledVector(p.velocity,dt);continue;}
      else if(p.kind==='spark'){
        // Hot streaks: they fall, skid off the floor once, and stretch along their speed as they cool.
        p.velocity.y-=14*dt;p.mesh.position.addScaledVector(p.velocity,dt);
        if(p.mesh.position.y<.03){p.mesh.position.y=.03;p.velocity.set(p.velocity.x*.45,Math.abs(p.velocity.y)*.3,p.velocity.z*.45);}
        const speed=p.velocity.length();p.mesh.lookAt(p.mesh.position.clone().add(p.velocity));const w=p.size*Math.min(1,t*3);p.mesh.scale.set(w,w,Math.min(.32,Math.max(.03,speed*.028))*Math.min(1,t*2));continue;}
      else p.velocity.y-=8*dt;
      p.mesh.position.addScaledVector(p.velocity,dt);if(p.mesh.position.y<.03&&p.kind!=='puff'){p.mesh.position.y=.03;p.velocity.set(p.velocity.x*.5,Math.abs(p.velocity.y)*.25,p.velocity.z*.5);}
      p.mesh.rotation.x+=p.spin.x*dt;p.mesh.rotation.y+=p.spin.y*dt;p.mesh.rotation.z+=p.spin.z*dt;
      if(p.kind!=='puff')p.mesh.scale.setScalar(p.size*Math.min(1,t*4));
    }
  }
  get count(){return this.live.length;}
}
