// Procedural rig for Pip (tools/create_assets.py). The GLB's parts are grouped by name prefix
// onto pivots: a body root that bobs, hips -> torso -> shoulders/head -> hat, and hip pivots for
// the legs. Every pose is a target that the joints ease toward, so transitions blend smoothly.
import * as T from 'three';

export interface PipState {
  dt:number;time:number;speed:number;grounded:boolean;rising:boolean;airborne:number;turnRate:number;
  carrying:'none'|'light'|'heavy';holdingPlug:boolean;strain:number;won:boolean;waving:boolean;
  /** Width across the chest of the carried item (m), so both mitts meet its sides. */
  carryWidth?:number;
  /** Seconds since a throw, and since a slingshot release (both large when not recent). */
  sinceThrow?:number;sinceRelease?:number;
  /** Optional explicit collision/failure signals. Ordinary braking still has follow-through. */
  bumped?:boolean;failed?:boolean;
  /** World-space point Pip should glance at (the nearest thing to use), if any. */
  lookAt?:T.Vector3;
}
type Joint=T.Group;
const ease=(j:T.Object3D,x:number,y:number,z:number,k:number)=>{j.rotation.x+=(x-j.rotation.x)*k;j.rotation.y+=(y-j.rotation.y)*k;j.rotation.z+=(z-j.rotation.z)*k;};

export class PipRig {
  body:Joint;torso:Joint;head:Joint;hat:Joint;legs:[Joint,Joint];arms:[Joint,Joint];
  /** Lower joints: the boots hang from knees, the gloves from elbows, so steps lift and swings trail. */
  knees:[Joint,Joint];elbows:[Joint,Joint];
  /** Attachment point in Pip's right glove, for a held plug. */
  hand=new T.Group();
  private phase=0;private blinkAt=2;private idleTime=0;private idleLook=0;private hatTilt=new T.Vector2();private hatVel=new T.Vector2();private lastSpeed=0;private spd=0;private sway=0;
  private eyes:T.Object3D[]=[];private glints:T.Object3D[]=[];private eyeScale=1;private mouth?:T.Object3D;private face=new T.Vector2(1,1);
  private wasAir=false;private wasBumped=false;private wasFailed=false;private wasWon=false;
  private previousCarry:PipState['carrying']='none';private previousPlug=false;private lastRawSpeed=0;
  private landingAge=2;private pickupAge=2;private bumpAge=2;private failureAge=2;private celebrationAge=2;
  constructor(private model:T.Object3D){
    model.updateMatrixWorld(true);
    // The GLB wraps its parts in one root node ('Pip'); the parts are that node's children.
    const holder=model.children.length===1&&model.children[0].children.length>1?model.children[0]:model;
    const all:T.Object3D[]=[...holder.children];
    const take=(g:Joint,prefixes:string[])=>{for(const o of all)if(o.parent===holder&&prefixes.some(p=>o.name.startsWith(p)))g.attach(o);};
    const joint=(parent:T.Object3D,x:number,y:number,z=0)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);g.updateMatrixWorld(true);return g;};
    this.body=joint(model,0,0);
    this.legs=[joint(this.body,-.17,.62),joint(this.body,.17,.62)];
    this.torso=joint(this.body,0,.62);
    this.head=joint(this.torso,0,.58);this.hat=joint(this.head,0,.3);
    this.arms=[joint(this.torso,-.43,.48),joint(this.torso,.43,.48)];
    this.knees=[joint(this.legs[0],0,-.3),joint(this.legs[1],0,-.3)];this.elbows=[joint(this.arms[0],-.01,-.17),joint(this.arms[1],.01,-.17)];
    // Attach from the most specific group outward so each part lands on exactly one pivot.
    take(this.hat,['Helmet']);take(this.head,['Head']);
    take(this.knees[0],['BootL','LegLCuff']);take(this.knees[1],['BootR','LegRCuff']);take(this.legs[0],['LegL']);take(this.legs[1],['LegR']);
    take(this.elbows[0],['GloveL','ArmLCuff']);take(this.elbows[1],['GloveR','ArmRCuff']);take(this.arms[0],['ArmL']);take(this.arms[1],['ArmR']);take(this.torso,['Torso']);
    this.hand.position.set(.04,-.33,.04);this.elbows[1].add(this.hand);
    this.head.traverse(o=>{if(/^HeadEye[LR]$/.test(o.name))this.eyes.push(o);if(/^HeadGlint/.test(o.name))this.glints.push(o);});
    for(const e of this.eyes)e.userData.baseY=e.scale.y;
    this.head.traverse(o=>{if(o.name==='HeadMouth'){this.mouth=o;o.userData.base=o.scale.clone();}});
  }
  update(s:PipState){
    const dt=Math.max(0,Math.min(.1,s.dt)),winning=s.won&&!s.failed,k=1-Math.exp(-dt*14),slow=1-Math.exp(-dt*6),gait=1-Math.exp(-dt*28);
    // Speed is measured from frame to frame; smooth it so the stride doesn't stutter.
    this.spd+=(s.speed-this.spd)*(1-Math.exp(-dt*10));
    const amount=T.MathUtils.clamp(this.spd/4,0,1),run=T.MathUtils.clamp((this.spd-4.6)/1.8,0,1),air=!s.grounded&&s.airborne>.08;
    // The cycle is tied to distance covered, so planted feet don't skate: a cycle is two steps of
    // 2·leg·sin(swing), using the swing actually applied. Slower, the stride shortens with the square
    // root of speed so steps don't turn into a scurry; sprinting, cadence rises instead of stride.
    const swingAmp=(.32+.26*amount+.12*run)*Math.sqrt(amount),cycle=T.MathUtils.clamp(4*.56*Math.sin(Math.max(.15,swingAmp)),.4,1.6);
    this.phase+=dt*this.spd*Math.PI*2/cycle;
    const sin=Math.sin(this.phase),cos=Math.cos(this.phase);
    if(this.wasAir&&!air)this.landingAge=0;this.wasAir=air;
    if((s.carrying!=='none'&&this.previousCarry==='none')||(s.holdingPlug&&!this.previousPlug))this.pickupAge=0;
    this.previousCarry=s.carrying;this.previousPlug=s.holdingPlug;
    const hardStop=this.lastRawSpeed>4.5&&s.speed<.4&&s.grounded;this.lastRawSpeed=s.speed;
    if((s.bumped&&!this.wasBumped)||hardStop)this.bumpAge=0;this.wasBumped=!!s.bumped;
    if(s.failed&&!this.wasFailed)this.failureAge=0;this.wasFailed=!!s.failed;
    if(winning&&!this.wasWon)this.celebrationAge=0;this.wasWon=winning;
    this.landingAge+=dt;this.pickupAge+=dt;this.bumpAge+=dt;this.failureAge+=dt;this.celebrationAge+=dt;
    const land=this.landingAge<1?Math.exp(-this.landingAge*10):0;
    const pickup=this.pickupAge<.28?Math.sin(this.pickupAge/.28*Math.PI):0;
    const stumble=this.bumpAge<.45?Math.sin(this.bumpAge/.45*Math.PI)*Math.exp(-this.bumpAge*2)*.2:0;
    const tired=!winning&&!s.failed&&!s.holdingPlug&&s.carrying==='none'?T.MathUtils.clamp((this.idleTime-8)/4,0,1)*(.7+.3*Math.sin(this.idleTime*.4)):0;
    const failDip=s.failed&&this.failureAge<.35?Math.sin(this.failureAge/.35*Math.PI)*.08:0;
    // Game already squashes the avatar on landing; this smaller, volume-preserving secondary
    // motion plants the knees and lets the shoulders settle instead of doubling that big squash.
    const bodyY=Math.max(.86,1-land*.06-pickup*.025-(s.failed?.02+failDip:0));
    this.body.scale.set(1/Math.sqrt(bodyY),bodyY,1/Math.sqrt(bodyY));
    // Walking, the body rides highest when the legs pass each other and dips at each heel strike;
    // running, it's highest in the flight between steps. Hips sway over the standing leg.
    const passing=1-Math.abs(sin),walkBob=(passing-.5)*.05,runBob=(Math.abs(sin)-.5)*.07;
    const bob=(air?0:(walkBob*(1-run)+runBob*run)*amount-.02*run)+(winning?Math.abs(Math.sin(s.time*9))*.14-Math.max(0,1-this.celebrationAge/.12)*.035:0)-land*.035-pickup*.028-tired*.018;
    this.body.position.y+=(bob-this.body.position.y)*gait;
    this.sway+=(sin*.035*amount*(1-run*.5)-this.sway)*gait;this.body.position.x=this.sway;
    ease(this.body,0,0,T.MathUtils.clamp(-s.turnRate*.05,-.18,.18)-this.sway*.6+stumble,slow);
    // Torso: counter-twist against the stride; lean forward running, back when hauling or lifting.
    const pull=s.holdingPlug&&s.strain>.7?Math.min(1,(s.strain-.7)/.3):0;
    const thrown=(s.sinceThrow??9)<.3?(s.sinceThrow??9)/.3:-1,flung=(s.sinceRelease??9)<.4?(s.sinceRelease??9)/.4:-1;
    let lean=amount*.06+run*.16-pull*.32;if(s.carrying==='heavy')lean+=.22;if(s.carrying==='light')lean-=.05;if(air)lean=s.rising?-.08:.12;
    // Throw: pitch forward through the release; slingshot: rock back from the recoil.
    if(thrown>=0)lean+=.25*Math.sin(thrown*Math.PI);if(flung>=0)lean-=.35*(1-flung);
    const throwFollow=(s.sinceThrow??9)>.3&&(s.sinceThrow??9)<.65?Math.sin(((s.sinceThrow??0)-.3)/.35*Math.PI):0;
    const releaseFollow=(s.sinceRelease??9)>.4&&(s.sinceRelease??9)<.8?Math.sin(((s.sinceRelease??0)-.4)/.4*Math.PI):0;
    lean+=throwFollow*.1+releaseFollow*.06-pickup*.1+tired*.09;if(s.failed)lean=.12;
    this.torso.position.y=.62-tired*.02;
    const breathe=amount<.1?Math.sin(s.time*2.2)*.015:0;this.torso.scale.set(1+breathe*.5,1+breathe,1+breathe*.5);
    ease(this.torso,lean+Math.abs(cos)*.03*amount,sin*(.09-.03*run)*amount,-this.sway*.8,gait);
    // Legs: hip swings with the stride; the knee folds the boot back only while that leg swings
    // forward (cosine > 0 for the left leg), so each foot lifts clear and plants flat.
    const hip=(l:number)=>air?(l?.4:-.55):(l?-sin:sin)*swingAmp;
    const knee=(l:number)=>{if(air)return l?.35:.9;const c=l?-cos:cos;return Math.max(0,c)*(.55+.55*run)*amount+(run*.2*amount)+pull*.3+land*.22+Math.abs(stumble)*.5;};
    for(const l of [0,1]){ease(this.legs[l],hip(l),0,air?(l?.05:-.05):0,gait);ease(this.knees[l],knee(l),0,0,gait);}
    // Arms: swing opposite the legs by default; poses override.
    // Arms swing a beat behind the legs, elbows bending more as Pip speeds up.
    const swing=-Math.sin(this.phase-.35)*(.6+.45*run)*amount;let [lx,lz,rx,rz]=[swing,.12+run*.1,-swing,-.12-run*.1];
    // Carrying: both arms forward to chest height, mitts closing on the item's sides.
    if(s.carrying!=='none'){const reach=s.carrying==='heavy'?-1.15:-1.25,grip=T.MathUtils.clamp(.18-((s.carryWidth??.8)-.8)*.4,-.12,.3);lx=rx=reach;lz=grip;rz=-grip;}
    // Hauling at the cable's limit: a two-handed tug-of-war lean, both hands low on the cable in
    // front (never swung over the shoulder into the hat).
    else if(s.holdingPlug){rx=pull>.5?-.6:-1.1;rz=pull>.5?-.25:-.1;lx=pull>.5?-.9:swing*.5;if(pull>.5)lz=.3;}
    if(air&&s.carrying==='none'&&!s.holdingPlug){lx=rx=-2.2;lz=.5;rz=-.5;}
    if(thrown>=0){lx=rx=-2.6+2*thrown;lz=.15;rz=-.15;}
    if(flung>=0){lx=rx=-.4;lz=-1.1*(1-flung*.5);rz=1.1*(1-flung*.5);}
    if(winning){const w=Math.sin(s.time*12)*.15;lx=-2.9+w;rx=-2.9-w;lz=-.35;rz=.35;}
    else if(s.waving){const w=Math.sin(s.time*10);rx=-2.7;rz=.5+w*.35;lx=0;lz=.1;}
    if(s.failed){lx=rx=-.32;lz=.12;rz=-.12;}
    ease(this.arms[0],lx,0,lz,k);ease(this.arms[1],rx,0,rz,k);
    const free=s.carrying==='none'&&!s.holdingPlug&&!winning&&!s.failed&&!s.waving&&!air;
    const bend=s.failed?-.15:winning?-.25:free?-(.25+.75*run)*amount-.08:s.carrying!=='none'?-.45:s.holdingPlug&&pull>.5?-.6:0;
    ease(this.elbows[0],bend+(free?Math.max(0,swing)*.25:0),0,0,k);ease(this.elbows[1],bend+(free?Math.max(0,-swing)*.25:0),0,0,k);
    // Head: steady against the torso twist, glance at the nearest usable thing, look around when idle.
    this.idleTime=amount<.1&&!s.holdingPlug&&s.carrying==='none'?this.idleTime+dt:0;
    let yaw=-this.torso.rotation.y*.8,pitch=pull*.15+(air?-.1:0)+Math.sin(this.phase*2)*.03*amount,roll=pull*.12;
    if(s.lookAt){const local=this.model.worldToLocal(s.lookAt.clone());const a=Math.atan2(local.x,local.z);if(Math.abs(a)<1.6)yaw+=T.MathUtils.clamp(a,-.7,.7);pitch+=T.MathUtils.clamp(-Math.atan2(local.y-1.4,Math.hypot(local.x,local.z))*.5,-.3,.3);}
    else if(this.idleTime>2.5){this.idleLook+=dt;yaw+=Math.sin(this.idleLook*.8)*.5;pitch+=Math.sin(this.idleLook*.53)*.08;}
    pitch+=tired*.24+land*.05+Math.abs(stumble)*.3;if(winning)pitch-=.25;if(s.failed)pitch+=.32;
    ease(this.head,pitch,yaw,roll,slow);
    // Blink every few seconds.
    this.blinkAt-=dt;if(this.blinkAt<0){this.eyeScale=.1;if(this.blinkAt<-.12){this.blinkAt=2+Math.random()*3;}}else this.eyeScale+=(1-this.eyeScale)*k;
    // Face: squint and a tight mouth straining at the limit, wide eyes and an O mouth in the air or
    // after a slingshot, happy arcs and a big grin at the win (x: eyes, y: mouth scale).
    const fx=s.failed?.65:winning?.35:flung>=0||air?1.3:pull>.5?.55:1-tired*.15,fy=s.failed?.65:winning?1.45:flung>=0||air?1.3:pull>.5?.6:1;this.face.x+=(fx-this.face.x)*k;this.face.y+=(fy-this.face.y)*k;
    for(const e of this.eyes)e.scale.y=e.userData.baseY*this.eyeScale*this.face.x;for(const g of this.glints)g.visible=this.eyeScale>.5&&this.face.x>.5;
    if(this.mouth){const b=this.mouth.userData.base as T.Vector3,open=flung>=0||air;this.mouth.scale.set(b.x*(open?.9:this.face.y),b.y*(open?2.1:pull>.5?.5:1),b.z);}
    // The hard hat sits on a spring: it tips against acceleration and bounces on landing.
    const accel=dt>0?(this.spd-this.lastSpeed)/dt:0;this.lastSpeed=this.spd;
    // Small integration steps keep the hat spring stable even during software-rendered frames.
    for(let remaining=dt;remaining>1e-6;){const h=Math.min(remaining,1/120);remaining-=h;
      this.hatVel.x+=(-120*this.hatTilt.x-9*this.hatVel.x-accel*.02-(air?0:Math.abs(sin)*amount*.6))*h;
      this.hatVel.y+=(-120*this.hatTilt.y-9*this.hatVel.y+s.turnRate*.4)*h;
      this.hatTilt.addScaledVector(this.hatVel,h).clampScalar(-.3,.3);}
    this.hat.rotation.set(this.hatTilt.x-.12,0,this.hatTilt.y);
  }
}
