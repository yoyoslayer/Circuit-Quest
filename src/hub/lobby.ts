// Circuit Crew HQ: the walkable lobby. Every job is a door off the atrium, in its wing's colour,
// with its number, name and best medal. A lamp over a door lights once that job is done ("a wing
// lights up when repaired", GAME_VISION); the objective marker bounces over the next one.
import * as T from 'three';
import type {Game} from '../game';
import type {Level} from '../levels/types';
import type {RoomKit,StationJob,Prompt} from '../stations/types';
import type {Point} from '../sim/cable';
import {levels} from '../levels';
import {LOOK,title,thumbUrl} from '../ui/screens';
import {portal} from '../render/portal';
import {bestFor,flagAutostart,isLocked,isOptional} from '../ui/store';
import {toon,box,rbox,cyl,sphere,part,group,glow,DMETAL,INK} from '../render/kit';
import {hot,glossyToon} from '../render/actors';
import {signPlate} from '../render/labels';
import * as TX from '../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../levels/dressing';
import {solid} from '../levels/decor';

interface Door {level:Level;at:Point;leaf:T.Group;open:number;vel:number;lamp:T.Mesh;done:boolean;locked:boolean;portal:ReturnType<typeof portal>;spill:T.Mesh;rattle:number;padlock?:T.Mesh;color:string;strips:T.Mesh[]}
/** sessionStorage: the door Pip went through, so coming back puts him there (R5-235). */
const FROM_KEY='circuit-crew:from';
const LOCK_IDLE=toon(DMETAL),LOCK_FLASH=toon('#e5484d'),STRIP_ON=hot('#ffe7a0',1.6),STRIP_OFF=toon('#3a3d55');
const views=new Map<string,T.Texture>();
const viewOf=(id:Level['id'])=>{let t=views.get(id);if(!t){t=new T.TextureLoader().load(thumbUrl(id));t.colorSpace=T.SRGBColorSpace;views.set(id,t);}return t;};
/** Door slots: seven along the back wall, then two on the left wall near the back corner, then
 *  free-standing arches on the right. The start view (yaw .4) shows the back wall to x≈9.5 and the
 *  left wall to z≈-3; this keeps all nine doors in it and clear of the job card (R5-241). */
function slots(width:number,depth:number){
  const out:{wall:'back'|'side'|'free';x:number;z:number}[]=[];
  for(let k=0;k<7;k++)out.push({wall:'back',x:-width/2+2.6+k*3.3,z:-depth/2});
  for(let k=0;k<2;k++)out.push({wall:'side',x:-width/2,z:-depth/2+2.6+k*3.2});
  for(let k=0;k<6;k++)out.push({wall:'free',x:width/2-2.2,z:-depth/2+4.5+k*2.9});
  return out;
}
let spillT:T.Texture|undefined;
/** A soft wedge of light, brightest at the threshold. */
function spillTex(){return spillT??=(()=>{const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d')!;
  const g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;
  x.beginPath();x.moveTo(30,0);x.lineTo(98,0);x.lineTo(128,128);x.lineTo(0,128);x.closePath();x.fill();const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();}
export class Lobby {
  doors:Door[]=[];readonly job:StationJob;
  /** The Workshop arch: practise any station without recording a grade. */
  workshopAt:Point={x:7.5,z:5.5};private picker?:HTMLElement;
  constructor(private game:Game){
    // Bonus jobs (Rush) get a door but aren't required steps or part of "finish every job".
    const jobs=levels.filter(l=>!isOptional(l));
    this.job={goal:'Circuit Crew HQ: pick a door, fix what\'s behind it',
      steps:jobs.map(l=>({text:`${l.number} · ${title(l)}`,done:()=>!!bestFor(l.id),at:()=>this.doors.find(d=>d.level===l)?.at})),
      bonuses:[
        {text:'Finish every job',ok:()=>jobs.every(l=>!!bestFor(l.id))},
        {text:'Crew Gold on three jobs',ok:()=>jobs.filter(l=>bestFor(l.id)?.crewGold).length>=3},
        {text:'Collect 15 bonus stars',ok:()=>levels.reduce((n,l)=>n+[0,1,2].filter(i=>((bestFor(l.id)?.stars??0)&(1<<i))!==0).length,0)>=15}]};
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
    // Read top to bottom, left column then right; rows clear each other and stand on two posts.
    const board=group(r,0,0,-1.3),rows=Math.ceil(levels.length/2),pitch=.27,h=.3+rows*pitch,y0=1.15;part(board,box(3.3,h,.08),toon(INK),0,y0+h/2,0);
    part(board,rbox(3.42,h+.12,.06,.03),toon('#c98a55'),0,y0+h/2,-.03);for(const x of [-1.5,1.5])part(board,box(.08,y0,.08),toon(DMETAL),x,y0/2,-.02);solid(g,3.4,y0+h,.12,0,(y0+h)/2,-1.3);
    levels.forEach((lv,i)=>{const col=i<rows?0:1,row=i%rows;signPlate(board,`${lv.number}  ${title(lv)}`,col?.775:-.775,y0+h-.28-row*pitch,.05+row*.0015+col*.0007,1.45,{bg:LOOK[lv.id]?.color??'#fffaf0',w:512,h:88});});
    pendant(g.root,-3,.2,{y:2.8,color:'#ffc94d'});pendant(g.root,3,.2,{y:2.8,color:'#ffc94d',light:false});lampPool(g.root,0,.2,4,.16);
    // Benches, plants and a water cooler around the ring.
    // The right bench stays clear of the Workshop arch.
    for(const [x,z,ry] of [[-4.6,3.6,0],[4.6,3.6,0]] as const){const b=group(r,x,0,z,ry);part(b,rbox(2,.12,.6,.05),toon('#c98a55'),0,.46,0);for(const s of [-.8,.8])part(b,box(.1,.44,.5),toon(INK),s,.22,0);solid(g,2,.5,.6,x,.25,z);}
    wallArt(kit.side,'bolt',1,1.9,.16,0,.8);wallArt(kit.side,'mountain',-(D-1.6),1.9,.16,0,.8);
    // The Workshop arch, free-standing on the right of the atrium.
    this.workshop();
    // The doors.
    const sl=slots(l.width,l.depth);
    levels.forEach((lv,i)=>{const s=sl[i];if(!s)return;this.doors.push(this.door(kit,lv,s));});
    // Back from a job: Pip starts at the door he went through, and a finished wing lights up as he arrives.
    let from:string|null=null;try{from=sessionStorage.getItem(FROM_KEY);sessionStorage.removeItem(FROM_KEY);}catch{/* storage unavailable */}
    const back=this.doors.find(d=>d.level.id===from);if(back){l.spawn={x:back.at.x,z:back.at.z};if(back.done){this.ignite={door:back,t:0};back.lamp.scale.setScalar(0);for(const s of back.strips)s.material=STRIP_OFF;}}
    return {};
  }
  /** The return beat: the wing's lamp and post strips flick on with sparks and confetti. */
  private ignite?:{door:Door;t:number};
  private door(kit:RoomKit,level:Level,s:{wall:'back'|'side'|'free';x:number;z:number}):Door{
    const g=this.game,color=LOOK[level.id]?.color??'#5ED6CC',done=!!bestFor(level.id),best=bestFor(level.id),locked=isLocked(level);
    // Wall-local frames: the back wall's local x is world x; the side wall's local x is -world z.
    let parent:T.Object3D,lx=0,at:Point;
    if(s.wall==='back'){parent=kit.back;lx=s.x;at={x:s.x,z:s.z+1.1};}
    else if(s.wall==='side'){parent=kit.side;lx=-s.z;at={x:s.x+1.1,z:s.z};}
    // Free-standing doors turn 45° toward the default camera so their signs read from the atrium.
    else{parent=group(g.root,s.x,0,s.z,-Math.PI/4);lx=0;at={x:s.x-.8,z:s.z+.8};part(parent,box(2.5,3,.3),toon('#efe2c8'),0,1.5,-.2);solid(g,2.5,3,.3,s.x+.14,1.5,s.z-.14,-Math.PI/4);}
    const f=group(parent,lx,0,.14);
    // Side-wall doors face across the room: a blade sign on an arm out of the wall carries the number
    // on both faces (the name stays on the lintel). It hangs from the wall's upper part, so it folds
    // away with the cutaway.
    if(s.wall==='side'){part(parent,box(.05,.05,1.5),toon('#8a8fa6'),lx,2.95,.75);for(const z of [.68,1.32])part(parent,box(.02,.13,.02),toon(DMETAL),lx,2.86,z,false);
      for(const k of [-1,1]){const p=signPlate(parent,level.number,lx+k*.006,2.7,1,.8,{bg:color,w:256,h:72});p.rotation.y=k*Math.PI/2;}}
    // A locked door shows it from across the room: a greyed frame, hazard tape and a padlock.
    const frame=locked?'#'+new T.Color(color).lerp(new T.Color('#8a8fa6'),.6).getHexString():color;
    // Frame, the door leaf on a hinge, a threshold, the name sign and a medal.
    for(const x of [-.95,.95])part(f,rbox(.22,2.5,.26,.05),toon(frame),x,1.25,0);part(f,rbox(2.12,.26,.28,.06),toon(frame),0,2.55,0);
    // The doorway: a corridor into the wing with the destination room at its end (src/render/portal.ts).
    const way=portal({color,width:1.7,height:2.3,depth:2,view:viewOf(level.id),locked});way.mesh.position.set(0,1.15,.05);f.add(way.mesh);
    // Light that spills from the corridor onto the lobby floor as the door opens.
    const spill=new T.Mesh(new T.PlaneGeometry(1.9,1.6),new T.MeshBasicMaterial({map:spillTex(),color,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));
    spill.rotation.x=-Math.PI/2;spill.position.set(0,.025,.85);spill.userData.noAO=true;(spill.material as T.Material).userData.outlineParameters={visible:false};f.add(spill);part(f,box(1.9,.04,.5),toon('#c98a55'),0,.02,.15,false);
    // The leaf swings in, into the corridor (never out through Pip), and is gone once it is open.
    const leaf=group(f,-.84,0,.1);part(leaf,rbox(1.66,2.26,.08,.03),glossyToon('#fffaf0',{spec:.5,size:.97}),.83,1.14,.02);part(leaf,box(1.3,.9,.02),toon(color),.83,1.55,.07);part(leaf,sphere(.05,10,8),toon('#ffc629'),1.5,1.05,.1);
    signPlate(leaf,level.number,.83,1.55,.085,.7,{bg:color,h:80,w:160});
    signPlate(f,title(level),0,2.56,.16,1.95,{bg:'#fffaf0'});
    let padlock:T.Mesh|undefined;
    if(locked){signPlate(leaf,'LOCKED',.83,2.1,.085,.9,{bg:'#262A40',fg:'#fffaf0',w:256,h:56});
      const tape=part(leaf,box(1.8,.09,.012),toon('#ffffff',{map:TX.hazardStripe()}),.83,1.25,.095,false);tape.rotation.z=.5;
      padlock=part(leaf,rbox(.22,.2,.08,.04),toon(DMETAL),1.2,1.05,.13);part(leaf,new T.TorusGeometry(.07,.018,8,16,Math.PI),toon('#c7ccd6'),1.2,1.15,.13);part(leaf,box(.03,.06,.01),toon(INK),1.2,1.04,.175,false);}
    // Medal on the wall beside the door, big enough to read from the atrium.
    if(best){part(f,rbox(.5,.5,.025,.06),toon(INK),1.42,1.6,.012);signPlate(f,best.grade,1.42,1.6,.03,.44,{bg:best.grade==='A'?'#ffc629':'#dfe3ea',w:80,h:80});}
    // The wing lamp: a sconce beside the lintel, below the wall cap, plus light strips down the post
    // fronts. Dark until the job is done.
    part(f,rbox(.2,.28,.04,.02),toon(DMETAL),-1.3,2.75,.02);part(f,box(.04,.04,.16),toon(DMETAL),-1.3,2.8,.1);part(f,new T.CylinderGeometry(.07,.15,.14,16),toon(color),-1.3,2.8,.2);
    const lamp=part(f,sphere(.07,12,8),done?hot('#ffe7a0',2.2):toon('#8a8fa6'),-1.3,2.69,.2,false);
    const strips=[-.95,.95].map(x=>part(f,box(.07,2.2,.02),done?STRIP_ON:STRIP_OFF,x,1.2,.14,false));
    if(done)glow(lamp,'rgba(255,220,140,1)',.4,.45).position.set(0,0,.08);
    return {level,at,leaf,open:0,vel:0,lamp,done,locked,portal:way,spill,rattle:0,padlock,color,strips};
  }
  private workshop(){
    const g=this.game,w=this.workshopAt,a=group(g.root,w.x,0,w.z-1.2);
    for(const x of [-1,1]){part(a,rbox(.3,2.6,.4,.06),toon('#5ED6CC'),x,1.3,0);part(a,rbox(.34,.12,.44,.03),toon('#3aa79f'),x,.06,0);for(const y of [.7,1.9])part(a,cyl(.025,.025,.02,8,'z'),toon(DMETAL),x,y,.205,false);}
    part(a,rbox(2.4,.36,.44,.08),toon('#5ED6CC'),0,2.7,0);
    signPlate(a,'WORKSHOP',0,2.7,.23,1.8,{bg:'#ffc629'});signPlate(a,'practise any station',0,2.24,.235,1.5,{bg:'#fffaf0',h:56});
    part(a,box(1.7,.02,1.2),toon('#e3d5bd'),0,.01,.4,false);
    // A practice bench beside the arch (not in its walk-through): a vice, a mini reel and parts to try.
    const b=group(g.root,w.x+2.4,0,w.z-1.2);part(b,rbox(1.3,.07,.62,.03),toon('#c98a55'),0,.86,0);for(const x of [-.55,.55])part(b,box(.08,.84,.5),toon(INK),x,.42,0);
    part(b,box(1.1,.05,.45),toon(INK),0,.25,0);part(b,box(1.3,.5,.03),toon('#d9c3a0'),0,1.16,-.3);
    for(let k=0;k<4;k++)part(b,cyl(.015,.015,.02,6,'z'),toon(INK),-.45+k*.3,1.3,-.28,false);
    part(b,box(.05,.22,.02),toon(DMETAL),-.3,1.14,-.27,false);part(b,box(.04,.26,.02),toon('#e5484d'),.1,1.12,-.27,false);
    part(b,box(.2,.12,.16),toon(DMETAL),-.42,.95,.05);part(b,box(.06,.06,.22),toon(INK),-.42,.98,.18);
    const reel=group(b,.05,1.0,.05);for(const s of [-1,1])part(reel,cyl(.13,.13,.025,16,'z'),toon('#ffc94d'),0,0,s*.07);part(reel,cyl(.09,.09,.12,16,'z'),toon('#f4efe6'));
    for(const [x,c] of [[.3,'#e98a42'],[.43,'#7B6FE0'],[.56,'#43B8C4']] as const)part(b,rbox(.11,.1,.1,.02),toon(c),x,.945,.15);
    solid(g,.3,2.6,.4,w.x-1,1.3,w.z-1.2);solid(g,.3,2.6,.4,w.x+1,1.3,w.z-1.2);solid(g,1.3,.9,.62,w.x+2.4,.45,w.z-1.2);
  }
  /** E opens the Workshop only right at the arch, so the props around it stay grabbable. */
  nearWorkshop(pos:Point){return Math.hypot(pos.x-this.workshopAt.x,pos.z-this.workshopAt.z)<1.2;}
  /** A small picker of every station job, opened at the Workshop arch. */
  /** The picker is a modal: while it is open the game ignores walking, survey and action keys. */
  get pickerOpen(){return !!this.picker&&!this.picker.hidden;}
  closePicker(){if(!this.picker)return;this.picker.hidden=true;this.game.menu=false;delete document.body.dataset.menu;(document.activeElement as HTMLElement|null)?.blur?.();}
  private pickerButtons(){return Array.from(this.picker?.querySelectorAll<HTMLButtonElement>('button')??[]);}
  /** Arrow keys or the d-pad move between the picker's buttons (dir: -1 back, +1 forward). */
  movePicker(dir:number){const b=this.pickerButtons();if(!b.length)return;const i=b.indexOf(document.activeElement as HTMLButtonElement);b[(i<0?0:i+dir+b.length)%b.length].focus();}
  /** Gamepad while the picker is open: d-pad moves, A picks, B closes. */
  padPicker(button:number){if(button===0)(document.activeElement as HTMLButtonElement|null)?.click?.();else if(button===1)this.closePicker();else if(button===12||button===14)this.movePicker(-1);else if(button===13||button===15)this.movePicker(1);}
  openPicker(){
    const g=this.game;g.menu=true;g.keys.clear();g.stick=undefined;document.body.dataset.menu='true';
    if(this.picker){this.picker.hidden=false;this.pickerButtons()[0]?.focus();return;}
    const el=document.createElement('section');el.className='workshop-picker panel';el.setAttribute('aria-label','Workshop');
    const jobs=levels.filter(l=>l.station&&!l.id.endsWith('-rush'));
    el.innerHTML=`<h3>Workshop</h3><p>Practise any station. The whole job plays, nothing is graded or recorded.</p><div class="grid">${jobs.map(l=>`<button class="btn" data-practice="${l.id}" style="--lvl:${LOOK[l.id]?.color??'#5ED6CC'}"><small>${l.number}</small>${title(l)}</button>`).join('')}</div><button class="btn close" data-close>Close <span class="key">Esc</span></button>`;
    el.addEventListener('click',e=>{const t=(e.target as Element).closest<HTMLElement>('[data-practice],[data-close]');if(!t)return;if(t.dataset.close!==undefined){this.closePicker();return;}flagAutostart(t.dataset.practice as Level['id']);location.href=`?level=${t.dataset.practice}&practice`;});
    // While open, the picker owns the keyboard: Esc or E closes, arrows move, Enter or Space presses
    // the focused button (the browser default). Nothing reaches the game behind it.
    addEventListener('keydown',e=>{if(el.hidden)return;e.stopPropagation();
      if(e.code==='Escape'||e.code==='KeyE'){e.preventDefault();if(!e.repeat)this.closePicker();}
      else if(e.code==='ArrowRight'||e.code==='ArrowDown'){e.preventDefault();this.movePicker(1);}
      else if(e.code==='ArrowLeft'||e.code==='ArrowUp'){e.preventDefault();this.movePicker(-1);}},true);
    document.querySelector('[data-layer="hud"]')?.append(el);this.picker=el;this.pickerButtons()[0]?.focus();
  }
  near(pos:Point){return this.doors.find(d=>Math.hypot(pos.x-d.at.x,pos.z-d.at.z)<1.5);}
  /** E at a door walks through it into that job. A locked door rattles, its padlock flashes red and Pip shrugs. */
  interact(pos:Point){if(this.leaving)return true;if(this.nearWorkshop(pos)){this.game.audio.pop();this.openPicker();return true;}const d=this.near(pos);if(!d)return false;
    if(d.locked){this.game.audio.tone(140,.2,.06,'square');this.game.audio.knock(1.2);d.rattle=.4;this.game.shrug();return true;}
    this.game.audio.pop();this.enter(d.level);return true;}
  private leaving=false;
  /** Through the door: the corridor brightens and the screen fades to the wing colour, then black,
   *  before the job loads (R5-235). Input is held meanwhile. */
  enter(level:Level){
    if(this.leaving)return;this.leaving=true;flagAutostart(level.id);this.game.hud.dataset.leaving=level.id;try{sessionStorage.setItem(FROM_KEY,level.id);}catch{/* storage unavailable */}
    const g=this.game;g.menu=true;g.keys.clear();g.stick=undefined;const d=this.doors.find(d=>d.level===level);
    const veil=document.createElement('div');Object.assign(veil.style,{position:'fixed',inset:'0',zIndex:'50',pointerEvents:'none',background:d?.color??'#000',opacity:'0',transition:'opacity .25s ease-in, background-color .2s linear .22s'});
    document.body.append(veil);requestAnimationFrame(()=>{veil.style.opacity='1';veil.style.background='#0b0b14';});
    setTimeout(()=>{location.href=`?level=${level.id}`;},420);
  }
  update(dt:number){
    const p=this.game.player.translation();
    // Doors swing in on a damped spring: a quick open that overshoots a touch and settles, a softer close.
    // The leaf turns into the corridor and is hidden once it is clear of the frame, so it never crosses Pip.
    const t=this.game.time;
    for(const d of this.doors){const want=!d.locked&&Math.hypot(p.x-d.at.x,p.z-d.at.z)<2.6?1:0;
      const k=want?60:34,c=want?9:10;d.vel+=((want-d.open)*k-d.vel*c)*dt;d.open+=d.vel*dt;d.rattle=Math.max(0,d.rattle-dt);
      d.leaf.rotation.y=Math.max(0,d.open)*1.25-Math.sin(t*45)*.06*d.rattle/.4;d.leaf.visible=d.open<.25;
      if(d.padlock)d.padlock.material=d.rattle>0&&Math.sin(t*30)>0?LOCK_FLASH:LOCK_IDLE;
      d.portal.set(T.MathUtils.clamp(d.open,0,1),t);(d.spill.material as T.MeshBasicMaterial).opacity=.45*T.MathUtils.clamp(d.open,0,1);}
    // The return beat: after a short pause the wing lamp pops in, sparks, confetti and a jingle.
    const ig=this.ignite;if(ig){const before=ig.t;ig.t+=dt;const u=Math.max(0,ig.t-.5);
      ig.door.lamp.scale.setScalar(u<=0?0:u<.18?u/.18*1.5:u<.4?1.5-(u-.18)/.22*.5:1);
      if(before<.5&&ig.t>=.5){const w=ig.door.lamp.getWorldPosition(new T.Vector3());this.game.burst(w,'#fff3a3',14,'spark');this.game.burst({x:ig.door.at.x,y:2.4,z:ig.door.at.z},'#ffcf52',50,'confetti');this.game.audio.jingle();for(const s of ig.door.strips)s.material=STRIP_ON;}
      if(u>=.4)this.ignite=undefined;}
  }
  prompt():Prompt|null{if(this.nearWorkshop(this.game.player.translation()))return {key:'E',text:'Workshop: practise any station'};const d=this.near(this.game.player.translation());if(d?.locked){const need=levels.find(l=>l.id===d.level.requires);return {key:'E',text:`Locked: get a B on ${need?`${need.number} · ${title(need)}`:'the previous job'} first`};}return d?{key:'E',text:`Enter ${d.level.number} · ${title(d.level)}${bestFor(d.level.id)?` (best ${bestFor(d.level.id)!.grade})`:''}`}:null;}
  snapshot(){return {doors:this.doors.map(d=>({id:d.level.id,at:d.at,done:d.done,locked:d.locked})),near:this.near(this.game.player.translation())?.level.id};}
}
