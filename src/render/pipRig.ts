// Procedural rig for Pip (tools/create_assets.py). The GLB's parts are grouped by name prefix
// onto pivots: a body root that bobs, hips -> torso -> shoulders/head -> hat, and hip pivots for
// the legs. Every pose is a target that the joints ease toward, so transitions blend smoothly.
import * as T from 'three';

export interface PipState {
  dt:number;time:number;speed:number;grounded:boolean;rising:boolean;airborne:number;turnRate:number;
  carrying:'none'|'light'|'heavy';holdingPlug:boolean;strain:number;won:boolean;waving:boolean;
  /** World-space point Pip should glance at (the nearest thing to use), if any. */
  lookAt?:T.Vector3;
}
type Joint=T.Group;
const ease=(j:T.Object3D,x:number,y:number,z:number,k:number)=>{j.rotation.x+=(x-j.rotation.x)*k;j.rotation.y+=(y-j.rotation.y)*k;j.rotation.z+=(z-j.rotation.z)*k;};

export class PipRig {
  body:Joint;torso:Joint;head:Joint;hat:Joint;legs:[Joint,Joint];arms:[Joint,Joint];
  /** Attachment point in Pip's right glove, for a held plug. */
  hand=new T.Group();
  private phase=0;private blinkAt=2;private idleTime=0;private idleLook=0;private hatTilt=new T.Vector2();private hatVel=new T.Vector2();private lastSpeed=0;
  private eyes:T.Object3D[]=[];private glints:T.Object3D[]=[];private eyeScale=1;
  constructor(private model:T.Object3D){
    model.updateMatrixWorld(true);
    const all:T.Object3D[]=[];model.traverse(o=>{if(o!==model&&o.parent===model)all.push(o);});
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
    this.hand.position.set(.03,-.5,.04);this.arms[1].add(this.hand);
    this.head.traverse(o=>{if(/^HeadEye[LR]$/.test(o.name))this.eyes.push(o);if(/^HeadGlint/.test(o.name))this.glints.push(o);});
    for(const e of this.eyes)e.userData.baseY=e.scale.y;
  }
  update(s:PipState){
    const {dt}=s,k=1-Math.exp(-dt*14),slow=1-Math.exp(-dt*6);
    const amount=Math.min(1,s.speed/4),run=T.MathUtils.clamp((s.speed-4.5)/2,0,1),air=!s.grounded&&s.airborne>.08;
    this.phase+=dt*s.speed*2.2;const sin=Math.sin(this.phase),bounce=Math.abs(sin);
    // Body: bob on each step, lean into turns and into a run.
    const bob=air?0:bounce*.05*amount-.015*amount+(s.won?Math.abs(Math.sin(s.time*9))*.14:0);
    this.body.position.y+=(bob-this.body.position.y)*k;ease(this.body,0,0,T.MathUtils.clamp(-s.turnRate*.05,-.18,.18),slow);
    // Torso: counter-twist against the stride; lean forward running, back when hauling or lifting.
    const pull=s.holdingPlug&&s.strain>.7?Math.min(1,(s.strain-.7)/.3):0;
    let lean=amount*.08+run*.1-pull*.32;if(s.carrying==='heavy')lean+=.22;if(s.carrying==='light')lean-=.05;if(air)lean=s.rising?-.08:.12;
    const breathe=amount<.1?Math.sin(s.time*2.2)*.015:0;this.torso.scale.set(1+breathe*.5,1+breathe,1+breathe*.5);
    ease(this.torso,lean,sin*.13*amount,sin*.03*amount,k);
    // Legs: stride (longer when running), tuck in the air.
    const stride=(.75+.3*run)*amount;
    ease(this.legs[0],air?-.55:sin*stride,0,air?-.05:0,k);ease(this.legs[1],air?.4:-sin*stride,0,air?.05:0,k);
    // Arms: swing opposite the legs by default; poses override.
    const swing=-sin*(.75+.35*run)*amount;let [lx,lz,rx,rz]=[swing,.12+run*.1,-swing,-.12-run*.1];
    if(s.carrying!=='none'){const reach=s.carrying==='heavy'?-1.15:-1.45;lx=rx=reach;lz=.18;rz=-.18;}
    else if(s.holdingPlug){rx=pull>.5?2.45:-1.1;rz=pull>.5?-.35:-.1;lx=pull>.5?-1.3:swing*.5;}
    if(air&&s.carrying==='none'&&!s.holdingPlug){lx=rx=-2.2;lz=.5;rz=-.5;}
    if(s.won){const w=Math.sin(s.time*12)*.15;lx=-2.9+w;rx=-2.9-w;lz=-.35;rz=.35;}
    else if(s.waving){const w=Math.sin(s.time*10);rx=-2.7;rz=.5+w*.35;lx=0;lz=.1;}
    ease(this.arms[0],lx,0,lz,k);ease(this.arms[1],rx,0,rz,k);
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
