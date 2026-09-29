// Circuit Crew HQ: the walkable lobby. Every job is a door off the atrium, in its wing's colour,
// with its number, name and best medal. A lamp over a door lights once that job is done ("a wing
// lights up when repaired", GAME_VISION); the objective marker bounces over the next one.
import * as T from 'three';
import type {Game} from '../game';
import type {Level} from '../levels/types';
import type {RoomKit,StationJob,Prompt} from '../stations/types';
import type {Point} from '../sim/cable';
import {levels} from '../levels';
import {LOOK,title} from '../ui/screens';
import {bestFor,flagAutostart} from '../ui/store';
import {toon,box,rbox,cyl,sphere,part,group,glow,DMETAL,INK} from '../render/kit';
import {hot,glossyToon} from '../render/actors';
import {signPlate} from '../render/labels';
import * as TX from '../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../levels/dressing';
import {solid} from '../levels/decor';

interface Door {level:Level;at:Point;leaf:T.Group;open:number;lamp:T.Mesh;done:boolean}
/** Door slots: along the back wall, then the left wall, then free-standing arches on the right. */
function slots(width:number,depth:number){
  const out:{wall:'back'|'side'|'free';x:number;z:number}[]=[];
  for(let k=0;k<6;k++)out.push({wall:'back',x:-width/2+3.4+k*((width-6.8)/5),z:-depth/2});
  for(let k=0;k<3;k++)out.push({wall:'side',x:-width/2,z:-depth/2+4.5+k*4.6});
  for(let k=0;k<6;k++)out.push({wall:'free',x:width/2-2.2,z:-depth/2+4.5+k*2.9});
  return out;
}
export class Lobby {
  doors:Door[]=[];readonly job:StationJob;
  constructor(private game:Game){
    const jobs=levels;
    this.job={goal:'Circuit Crew HQ: pick a door, fix what\'s behind it',
      steps:jobs.map(l=>({text:`${l.number} · ${title(l)}`,done:()=>!!bestFor(l.id),at:()=>this.doors.find(d=>d.level===l)?.at})),
      bonuses:[
        {text:'Finish every job',ok:()=>jobs.every(l=>!!bestFor(l.id))},
        {text:'Earn an A on three jobs',ok:()=>jobs.filter(l=>bestFor(l.id)?.grade==='A').length>=3},
        {text:'Light every wing',ok:()=>this.doors.every(d=>d.done)}]};
  }
  dress(kit:RoomKit){
    const g=this.game,l=g.level,r=g.decorRoot,W=l.width/2,D=l.depth/2;
    kit.floor(-W,W,-D,D,TX.woodPlanks('#d9ab6e'),3.2);
    // A terrazzo-style atrium ring with a rug and the reception island in the middle.
    kit.floor(-6,6,-3.5,3.5,TX.kitchenTiles('#f2eadb','#e3d5bd',6),2.4,.004);rug(r,0,.6,7,4.2,'#5ED6CC','#d8f5ef');
    kit.backWindows(()=>true);
    const desk=group(r,0,0,-.6);part(desk,rbox(4,1,1.1,.12),toon('#f4ead6'),0,.5,0);part(desk,rbox(4.1,.08,1.2,.04),toon('#c98a55'),0,1.02,0);
    part(desk,box(3.6,.5,.06),toon('#5ED6CC'),0,.55,.57);signPlate(desk,'CIRCUIT CREW HQ',0,.6,.61,2.2,{bg:'#ffc629'});solid(g,4,1.05,1.1,0,.52,-.6);
    for(const x of [-1.2,1.2])part(desk,rbox(.5,.35,.4,.05),toon(INK),x,1.25,-.1);
    // Directory board: every job with its number, on the reception's back.
    const board=group(r,0,0,-1.3);part(board,box(3.2,1.3,.08),toon(INK),0,1.9,0);
    levels.forEach((lv,i)=>signPlate(board,`${lv.number}  ${title(lv)}`,(i%2?.8:-.8),2.4-Math.floor(i/2)*.3,.05,1.5,{bg:LOOK[lv.id]?.color??'#fffaf0',h:64}));
    pendant(g.root,-3,.2,{y:2.8,color:'#ffc94d'});pendant(g.root,3,.2,{y:2.8,color:'#ffc94d',light:false});lampPool(g.root,0,.2,4,.16);
    // Benches, plants and a water cooler around the ring.
    for(const [x,z,ry] of [[-6.5,3.6,0],[6.5,3.6,0]] as const){const b=group(r,x,0,z,ry);part(b,rbox(2,.12,.6,.05),toon('#c98a55'),0,.46,0);for(const s of [-.8,.8])part(b,box(.1,.44,.5),toon(INK),s,.22,0);solid(g,2,.5,.6,x,.25,z);}
    wallArt(kit.back,'bolt',-W+1.4,1.9,.18,0,.8);wallArt(kit.side,'mountain',-(D-1.6),1.9,.16,0,.8);
    // The doors.
    const sl=slots(l.width,l.depth);
    levels.forEach((lv,i)=>{const s=sl[i];if(!s)return;this.doors.push(this.door(kit,lv,s));});
    return {};
  }
  private door(kit:RoomKit,level:Level,s:{wall:'back'|'side'|'free';x:number;z:number}):Door{
    const g=this.game,color=LOOK[level.id]?.color??'#5ED6CC',done=!!bestFor(level.id),best=bestFor(level.id);
    // Wall-local frames: the back wall's local x is world x; the side wall's local x is -world z.
    let parent:T.Object3D,lx=0,at:Point;
    if(s.wall==='back'){parent=kit.back;lx=s.x;at={x:s.x,z:s.z+1.1};}
    else if(s.wall==='side'){parent=kit.side;lx=-s.z;at={x:s.x+1.1,z:s.z};}
    else{parent=group(g.root,s.x,0,s.z,-Math.PI/2);lx=0;at={x:s.x-1.1,z:s.z};part(parent,box(2.5,3,.3),toon('#efe2c8'),0,1.5,-.2);solid(g,.3,3,2.5,s.x+.2,1.5,s.z);}
    const f=group(parent,lx,0,.14);
    // Frame, the door leaf on a hinge, a threshold, the name sign and a medal.
    for(const x of [-.95,.95])part(f,rbox(.22,2.5,.26,.05),toon(color),x,1.25,0);part(f,rbox(2.12,.26,.28,.06),toon(color),0,2.55,0);
    part(f,box(1.7,2.3,.04),toon('#262A40'),0,1.15,-.06,false);part(f,box(1.9,.04,.5),toon('#c98a55'),0,.02,.15,false);
    const leaf=group(f,-.84,0,0);part(leaf,rbox(1.66,2.26,.08,.03),glossyToon('#fffaf0',{spec:.5,size:.97}),.83,1.14,.02);part(leaf,box(1.3,.9,.02),toon(color),.83,1.55,.07);part(leaf,sphere(.05,10,8),toon('#ffc629'),1.5,1.05,.1);
    signPlate(leaf,level.number,.83,1.55,.085,.7,{bg:color,h:80,w:160});
    signPlate(f,title(level),0,2.95,.03,2.1,{bg:'#fffaf0'});
    if(best)signPlate(f,best.grade,.95,2.2,.16,.34,{bg:best.grade==='A'?'#ffc629':'#dfe3ea',w:80,h:80});
    // The wing lamp: dark until the job is done.
    const lamp=part(f,sphere(.13,14,10),done?hot('#ffe7a0',2.2):toon('#8a8fa6'),0,3.35,.12,false);part(f,cyl(.05,.07,.12,10),toon(DMETAL),0,3.5,.1,false);
    if(done){const w=f.getWorldPosition(new T.Vector3());glow(g.root,'rgba(255,220,140,1)',1.4,.35).position.set(w.x,3.35,w.z+(s.wall==='back'?.4:0));}
    return {level,at,leaf,open:0,lamp,done};
  }
  near(pos:Point){return this.doors.find(d=>Math.hypot(pos.x-d.at.x,pos.z-d.at.z)<1.5);}
  /** E at a door walks through it into that job. */
  interact(pos:Point){const d=this.near(pos);if(!d)return false;this.game.audio.pop();this.enter(d.level);return true;}
  enter(level:Level){flagAutostart(level.id);this.game.hud.dataset.leaving=level.id;location.href=`?level=${level.id}`;}
  update(dt:number){
    const p=this.game.player.translation();
    for(const d of this.doors){const want=Math.hypot(p.x-d.at.x,p.z-d.at.z)<2.6?1:0;d.open+=(want-d.open)*Math.min(1,dt*5);d.leaf.rotation.y=-d.open*1.2;}
  }
  prompt():Prompt|null{const d=this.near(this.game.player.translation());return d?{key:'E',text:`Enter ${d.level.number} · ${title(d.level)}${bestFor(d.level.id)?` (best ${bestFor(d.level.id)!.grade})`:''}`}:null;}
  snapshot(){return {doors:this.doors.map(d=>({id:d.level.id,at:d.at,done:d.done})),near:this.near(this.game.player.translation())?.level.id};}
}
