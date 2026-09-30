// Procedural rig for Pip (tools/create_assets.py). The GLB's parts are grouped by name prefix
// onto pivots: a body root that bobs, hips -> torso -> shoulders/head -> hat, and hip pivots for
// the legs. Every pose is a target that the joints ease toward, so transitions blend smoothly.
import * as T from 'three';
import {footAt,kneeAt} from './gait';

export interface PipState {
  dt:number;time:number;speed:number;grounded:boolean;rising:boolean;airborne:number;turnRate:number;
  carrying:'none'|'light'|'heavy';holdingPlug:boolean;strain:number;won:boolean;waving:boolean;
  /** World-space point Pip should glance at (the nearest thing to use), if any. */
  lookAt?:T.Vector3;
  work?:{kind:string;progress:number;target?:T.Vector3};
}
type Joint=T.Group;
const ease=(j:T.Object3D,x:number,y:number,z:number,k:number)=>{j.rotation.x+=(x-j.rotation.x)*k;j.rotation.y+=(y-j.rotation.y)*k;j.rotation.z+=(z-j.rotation.z)*k;};

export class PipRig {
  body:Joint;torso:Joint;head:Joint;hat:Joint;legs:[Joint,Joint];arms:[Joint,Joint];
  /** Attachment point in Pip's right glove, for a held plug. */
  hand=new T.Group();
  private phase=0;private blinkAt=2;private idleTime=0;private idleLook=0;private hatTilt=new T.Vector2();private hatVel=new T.Vector2();private lastSpeed=0;
  private eyes:T.Object3D[]=[];private glints:T.Object3D[]=[];private eyeScale=1;
  private travelled=0;private bones:[T.Mesh,T.Mesh][]=[];
  private armBones:[T.Mesh,T.Mesh][]=[];
  constructor(private model:T.Object3D){
    model.updateMatrixWorld(true);
    // Blender exports a named Pip group inside the glTF scene. Collect the named
    // parts through that wrapper, before creating any joints or reparenting them.
    const all:T.Object3D[]=[];model.traverse(o=>{if(o instanceof T.Mesh)all.push(o);});
    const take=(g:Joint,prefixes:string[])=>{for(const o of all)if(prefixes.some(p=>o.name.startsWith(p)))g.attach(o);};
    const joint=(parent:T.Object3D,x:number,y:number,z=0)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);g.updateMatrixWorld(true);return g;};
    this.body=joint(model,0,0);
    this.legs=[joint(this.body,-.17,.62),joint(this.body,.17,.62)];
    this.torso=joint(this.body,0,.62);
    this.head=joint(this.torso,0,.58);this.hat=joint(this.head,0,.3);
    this.arms=[joint(this.torso,-.39,.5),joint(this.torso,.39,.5)];
    // Attach from the most specific group outward so each part lands on exactly one pivot.
    take(this.hat,['Helmet']);take(this.head,['Head']);take(this.legs[0],['LegL','BootL']);take(this.legs[1],['LegR','BootR']);
    take(this.arms[0],['ArmL','GloveL']);take(this.arms[1],['ArmR','GloveR']);take(this.torso,['Torso']);
    // The export has rigid sausage legs. Keep the detailed boots, replace those
    // legs with separate thighs/shins so a lifted foot can actually bend a knee.
    this.legs.forEach((leg,i)=>{leg.traverse(o=>{if(o.name.startsWith('Leg'))o.visible=false;});
      const material=(leg.getObjectByName(i===0?'LegL':'LegR') as T.Mesh)?.material??new T.MeshToonMaterial({color:'#175da8'});
      const make=()=>{const m=new T.Mesh(new T.CapsuleGeometry(.09,.16,6,12),material);m.castShadow=true;this.body.add(m);return m;};this.bones.push([make(),make()]);
    });
    this.arms.forEach((arm,i)=>{arm.traverse(o=>{if(o.name.startsWith('Arm'))o.visible=false;});
      const material=(arm.getObjectByName(i===0?'ArmL':'ArmR') as T.Mesh)?.material??new T.MeshToonMaterial({color:'#175da8'});
      const make=()=>{const m=new T.Mesh(new T.CapsuleGeometry(.08,.11,6,12),material);m.castShadow=true;this.torso.add(m);return m;};this.armBones.push([make(),make()]);
    });
    this.hand.position.set(.03,-.5,.04);this.arms[1].add(this.hand);
    this.head.traverse(o=>{if(/^HeadEye[LR]$/.test(o.name))this.eyes.push(o);if(/^HeadGlint/.test(o.name))this.glints.push(o);});
    for(const e of this.eyes)e.userData.baseY=e.scale.y;
  }
  update(s:PipState){
    const {dt}=s,k=1-Math.exp(-dt*14),slow=1-Math.exp(-dt*6);
    const amount=Math.min(1,s.speed/.5),run=T.MathUtils.clamp((s.speed-3)/1.5,0,1),air=!s.grounded&&s.airborne>.08;
    this.travelled+=dt*s.speed;this.phase=this.travelled/1.2*Math.PI*2;const sin=Math.sin(this.phase),bounce=Math.abs(sin);
    // Body: bob on each step, lean into turns and into a run.
    const bob=air?0:-.035*amount+bounce*.012*amount+(s.won?Math.abs(Math.sin(s.time*9))*.14:0);
    this.body.position.y+=(bob-this.body.position.y)*k;ease(this.body,0,0,T.MathUtils.clamp(-s.turnRate*.05,-.18,.18),slow);
    // Torso: counter-twist against the stride; lean forward running, back when hauling or lifting.
    const pull=s.holdingPlug&&s.strain>.7?Math.min(1,(s.strain-.7)/.3):0;
    let lean=amount*.08+run*.1-pull*.32;if(s.carrying==='heavy')lean+=.22;if(s.carrying==='light')lean-=.05;if(air)lean=s.rising?-.08:.12;
    const breathe=amount<.1?Math.sin(s.time*2.2)*.015:0;this.torso.scale.set(1+breathe*.5,1+breathe,1+breathe*.5);
    ease(this.torso,lean,sin*.13*amount,sin*.03*amount,k);
    // Legs: stride (longer when running), tuck in the air.
    this.legs.forEach((leg,i)=>{
      const f=footAt(this.travelled,i),moving=s.speed>.15,lift=air?.16:moving?f.y:Math.max(0,leg.position.y-.62+this.body.position.y)*(1-k);
      const z=air?(i===0?.12:-.12):moving?f.z:leg.position.z;
      leg.position.set(i===0?-.17:.17,.62+lift-this.body.position.y,z);
      leg.rotation.set(air?-.3:0,0,0);
      const hip={y:.76,z:0},foot={y:.18+lift-this.body.position.y,z},knee=kneeAt(hip,foot,.32);
      const points=[hip,knee,foot];this.bones[i].forEach((bone,j)=>{
        const a=points[j],b=points[j+1],v=new T.Vector3(0,b.y-a.y,b.z-a.z);
        bone.position.set(i===0?-.17:.17,(a.y+b.y)/2,(a.z+b.z)/2);
        bone.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());bone.scale.y=v.length()/.34;
      });
    });
    // Arms: swing opposite the legs by default; poses override.
    const swing=-sin*(.75+.35*run)*amount;let [lx,lz,rx,rz]=[swing,.12+run*.1,-swing,-.12-run*.1];
    if(s.carrying!=='none'){const reach=s.carrying==='heavy'?-.8:-1.15;lx=rx=reach;lz=.18;rz=-.18;}
    else if(s.holdingPlug){rx=pull>.5?2.45:-1.1;rz=pull>.5?-.35:-.1;lx=pull>.5?-1.3:swing*.5;}
    if(air&&s.carrying==='none'&&!s.holdingPlug){lx=rx=-2.2;lz=.5;rz=-.5;}
    if(s.won){const w=Math.sin(s.time*12)*.15;lx=-2.9+w;rx=-2.9-w;lz=-.35;rz=.35;}
    else if(s.waving){const w=Math.sin(s.time*10);rx=-2.7;rz=.5+w*.35;lx=0;lz=.1;}
    else if(s.work){const turn=Math.sin(s.work.progress*Math.PI*2)*.18;lx=-1.2;rx=-1.5+turn;lz=.25;rz=-.1;}
    ease(this.arms[0],lx,0,lz,k);ease(this.arms[1],rx,0,rz,k);
    this.torso.updateWorldMatrix(true,true);
    if(s.work?.target){const glove=this.arms[1].getObjectByName('GloveR');if(glove){
      const target=this.torso.worldToLocal(s.work.target.clone()).sub(this.arms[1].position).normalize();
      this.arms[1].quaternion.slerp(new T.Quaternion().setFromUnitVectors(glove.position.clone().normalize(),target),k);
      this.arms[1].updateWorldMatrix(true,true);
    }}
    this.arms.forEach((arm,i)=>{
      const glove=arm.getObjectByName(i===0?'GloveL':'GloveR');if(!glove)return;
      const a=arm.position.clone(),b=this.torso.worldToLocal(glove.getWorldPosition(new T.Vector3())),v=b.clone().sub(a),d=v.length();
      const normal=new T.Vector3(0,0,-1).addScaledVector(v,-new T.Vector3(0,0,-1).dot(v)/(d*d||1)).normalize();
      const elbow=a.clone().add(b).multiplyScalar(.5).addScaledVector(normal,Math.sqrt(Math.max(0,.27**2-d*d/4)));
      const points=[a,elbow,b];this.armBones[i].forEach((bone,j)=>{const from=points[j],to=points[j+1],delta=to.clone().sub(from);bone.position.copy(from).add(to).multiplyScalar(.5);bone.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());bone.scale.y=delta.length()/.27;});
    });
    // Head: steady against the torso twist, glance at the nearest usable thing, look around when idle.
    this.idleTime=amount<.1&&!s.holdingPlug&&s.carrying==='none'?this.idleTime+dt:0;
    let yaw=-this.torso.rotation.y*.8,pitch=pull*.15+(air?-.1:0)+Math.sin(this.phase*2)*.03*amount,roll=pull*.12;
    if(s.lookAt){const local=this.model.worldToLocal(s.lookAt.clone());const a=Math.atan2(local.x,local.z);if(Math.abs(a)<1.6)yaw+=T.MathUtils.clamp(a,-.7,.7);pitch+=T.MathUtils.clamp(-Math.atan2(local.y-1.4,Math.hypot(local.x,local.z))*.5,-.3,.3);}
    else if(this.idleTime>2.5){this.idleLook+=dt;yaw+=Math.sin(this.idleLook*.8)*.5;pitch+=Math.sin(this.idleLook*.53)*.08;}
    if(s.won)pitch-=.25;
    ease(this.head,pitch,yaw,roll,slow);
    // Blink every few seconds.
    this.blinkAt-=dt;if(this.blinkAt<0){this.eyeScale=.1;if(this.blinkAt<-.12){this.blinkAt=2+Math.random()*3;}}else this.eyeScale+=(1-this.eyeScale)*k;
    for(const e of this.eyes)e.scale.y=e.userData.baseY*this.eyeScale;for(const g of this.glints)g.visible=this.eyeScale>.5;
    // The hard hat sits on a spring: it tips against acceleration and bounces on landing.
    const accel=dt>0?(s.speed-this.lastSpeed)/dt:0;this.lastSpeed=s.speed;
    this.hatVel.x+=(-120*this.hatTilt.x-9*this.hatVel.x-accel*.02-(air?0:bounce*amount*.6))*dt;this.hatVel.y+=(-120*this.hatTilt.y-9*this.hatVel.y+s.turnRate*.4)*dt;
    this.hatTilt.addScaledVector(this.hatVel,dt).clampScalar(-.3,.3);this.hat.rotation.set(this.hatTilt.x,0,this.hatTilt.y);
  }
}
