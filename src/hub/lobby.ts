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
import {toon,box,rbox,cyl,sphere,part,group,glow,DMETAL,INK,canvasTex} from '../render/kit';
import {hot,glossyToon} from '../render/actors';
import {signPlate} from '../render/labels';
import * as TX from '../render/textures';
import {wallArt,pendant,lampPool,pointLamp,rug} from '../levels/dressing';
import {solid} from '../levels/decor';

interface Door {level:Level;at:Point;leaf:T.Group;open:number;lamp:T.Mesh;done:boolean;locked:boolean;portal:T.Mesh;arrival:number}
/** Door slots: along the back wall, then the left wall, then free-standing arches on the right. */
function slots(width:number,depth:number){
  const office=levels.filter(l=>['playground','meeting','lunch'].includes(l.id));
  const fab=levels.filter(l=>['vias','vias-rush','qfn','archive'].includes(l.id));
  const facility=levels.filter(l=>!office.includes(l)&&!fab.includes(l));
  return [
    ...office.map((l,i)=>({id:l.id,wall:'back' as const,x:-6+i*6,z:-depth/2})),
    ...fab.map((l,i)=>({id:l.id,wall:'side' as const,x:-width/2,z:-depth/2+5+i*6})),
    ...facility.map((l,i)=>({id:l.id,wall:'free' as const,x:width/2,z:-depth/2+3.6+i*3.5})),
  ];
}
export class Lobby {
  doors:Door[]=[];readonly job:StationJob;private directory?:T.Mesh;private directoryKey='';private departing=false;
  /** The Workshop arch: practise any station without recording a grade. */
  workshopAt:Point={x:7.5,z:5.5};private picker?:HTMLElement;
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
    // One readable departure display, not fifteen tiny competing tickets.
    const board=group(r,0,0,-1.35);part(board,box(3.8,2.1,.16),toon(INK),0,2.2,0);
    this.directory=part(board,new T.PlaneGeometry(3.58,1.88),new T.MeshBasicMaterial({map:this.directoryTexture()}),0,2.2,.09,false);
    (this.directory.material as T.Material).userData.outlineParameters={visible:false};
    pendant(g.root,-3,.2,{y:2.8,color:'#ffc94d'});pendant(g.root,3,.2,{y:2.8,color:'#ffc94d',light:false});lampPool(g.root,0,.2,4,.16);
    // Benches, plants and a water cooler around the ring.
    for(const [x,z,ry] of [[-6.5,3.6,0],[6.5,3.6,0]] as const){const b=group(r,x,0,z,ry);part(b,rbox(2,.12,.6,.05),toon('#c98a55'),0,.46,0);for(const s of [-.8,.8])part(b,box(.1,.44,.5),toon(INK),s,.22,0);solid(g,2,.5,.6,x,.25,z);}
    wallArt(kit.back,'bolt',-W+1.4,1.9,.18,0,.8);wallArt(kit.side,'mountain',-(D-1.6),1.9,.16,0,.8);
    // The Workshop arch, free-standing on the right of the atrium.
    this.workshop();
    // Three actual circulation zones: office ahead, fab left, facility right.
    for(const x of [-10,10])kit.interiorWall({id:`wing-${x}`,minX:x-.12,maxX:x+.12,minZ:-10,maxZ:5},'#e0e7df','#99ada6',3.2);
    for(const [x,text,color] of [[-12.5,'FABRICATION','#87b8bd'],[0,'OFFICE','#d6b276'],[12.5,'FACILITY','#9abb9d']] as const){
      const sign=group(g.root,x,0,x===0?-11:2.5);
      part(sign,box(2.7,.12,.18),toon('#536b70'),0,3.25,0);
      for(const sx of [-1.25,1.25])part(sign,box(.05,.35,.05),toon('#536b70'),sx,3.1,0);
      signPlate(sign,text,0,2.95,.1,2.4,{bg:color});
    }
    // The doors.
    const sl=slots(l.width,l.depth);
    levels.forEach(lv=>{const s=sl.find(s=>s.id===lv.id);if(!s)return;this.doors.push(this.door(kit,lv,s));});
    return {};
  }
  private door(kit:RoomKit,level:Level,s:{wall:'back'|'side'|'free';x:number;z:number}):Door{
    const g=this.game,color=LOOK[level.id]?.color??'#5ED6CC',done=!!bestFor(level.id),best=bestFor(level.id),locked=!!level.requires&&!bestFor(level.requires);
    // Wall-local frames: the back wall's local x is world x; the side wall's local x is -world z.
    let parent:T.Object3D,lx=0,at:Point;
    if(s.wall==='back'){parent=kit.back;lx=s.x;at={x:s.x,z:s.z+1.1};}
    else if(s.wall==='side'){parent=kit.side;lx=-s.z;at={x:s.x+1.1,z:s.z};}
    // Free-standing doors turn 45° toward the default camera so their signs read from the atrium.
    else{parent=group(g.root,s.x,0,s.z,-Math.PI/2);lx=0;at={x:s.x-1.1,z:s.z};}
    const f=group(parent,lx,0,.14);
    // A mounted, framed glass office door with its name above the opening.
    for(const x of [-.95,.95])part(f,rbox(.2,2.5,.22,.035),toon('#52636c'),x,1.25,.03);
    part(f,rbox(2.08,.2,.22,.035),toon('#52636c'),0,2.5,.03);
    part(f,rbox(1.72,.055,.34,.025),toon('#c98a55'),0,.025,.17,false);
    const leaf=group(f,-.84,0,.11);
    part(leaf,rbox(1.65,2.25,.1,.035),glossyToon('#dce4df',{spec:.65,size:.97}),.82,1.13,.02);
    const glass=part(leaf,rbox(1.32,1.12,.035,.02),glossyToon('#9bcbd0',{spec:.85,size:.98}),.82,1.66,.081,false);
    (glass.material as T.Material).transparent=true;(glass.material as T.Material).opacity=.72;
    part(leaf,rbox(1.3,.48,.035,.02),toon(locked?'#879397':color),.82,.65,.081,false);
    part(leaf,rbox(.035,.3,.045,.012),toon('#fffaf0'),.24,1.63,.105,false);
    // A proper pull bar reads better than a gold knob at this scale.
    part(leaf,cyl(.025,.025,.28,10),toon('#c2c9c3'),1.42,1.12,.11,false).rotation.x=Math.PI/2;
    signPlate(leaf,level.number,.82,1.65,.105,.42,{bg:color,h:72,w:144});
    signPlate(f,title(level),0,2.91,.16,1.86,{bg:'#fffaf0'});
    if(locked){signPlate(leaf,'LOCKED',.83,.95,.085,.9,{bg:'#262A40',fg:'#fffaf0',w:200,h:64});part(leaf,rbox(.3,.26,.08,.05),toon('#ffc629'),.83,1.2,.1);}
    if(best)signPlate(f,best.grade,1.08,2.12,.18,.34,{bg:best.grade==='A'?'#ffc629':'#dfe3ea',w:80,h:80});
    // The wing lamp: dark until the job is done.
    const lamp=part(f,sphere(.13,14,10),done?hot('#ffe7a0',2.2):toon('#8a8fa6'),0,3.35,.12,false);part(f,cyl(.05,.07,.12,10),toon(DMETAL),0,3.5,.1,false);
    if(done){const w=f.getWorldPosition(new T.Vector3());glow(g.root,'rgba(255,220,140,1)',1.4,.35).position.set(w.x,3.35,w.z+(s.wall==='back'?.4:0));}
    // Put the active field clearly in front of the uncut wall shell. At the old
    // nearly coplanar depth the wall and door backing swallowed the translucent shader.
    const portal=part(f,new T.PlaneGeometry(1.66,2.24),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,uniforms:{time:{value:0},tint:{value:new T.Color(color)}},vertexShader:'varying vec2 uvP; void main(){uvP=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 uvP;uniform float time;uniform vec3 tint;void main(){vec2 p=uvP-.5;float edge=pow(max(abs(p.x)*2.,abs(p.y)*2.),7.);float radius=length(vec2(p.x*.8,p.y));float swirl=.5+.5*sin(atan(p.y,p.x)*5.-radius*32.+time*3.+sin(p.x*15.+time)*.55);vec3 deep=tint*.72+vec3(.07,.13,.19);vec3 color=mix(deep,vec3(.55,.97,1.),smoothstep(.08,.48,swirl)*.72+edge*.65);float alpha=.58+swirl*.28+edge*.14;gl_FragColor=vec4(color,alpha);}' }),0,1.16,.24,false);
    (portal.material as T.Material).userData.outlineParameters={visible:false};portal.visible=false;
    return {level,at,leaf,open:0,lamp,done,locked,portal,arrival:0};
  }
  private workshop(){
    const g=this.game,w=this.workshopAt,a=group(g.root,w.x,0,w.z-1.2);
    for(const x of [-1,1])part(a,rbox(.3,2.6,.4,.06),toon('#5ED6CC'),x,1.3,0);part(a,rbox(2.4,.36,.44,.08),toon('#5ED6CC'),0,2.7,0);
    signPlate(a,'WORKSHOP',0,2.7,.23,1.8,{bg:'#ffc629'});signPlate(a,'practise any station',0,2.35,.23,1.5,{bg:'#fffaf0',h:56});
    part(a,box(1.7,.02,1.2),toon('#e3d5bd'),0,.01,.4,false);for(const [x,c] of [[-.5,'#e98a42'],[0,'#7B6FE0'],[.5,'#43B8C4']] as const)part(a,rbox(.36,.3,.3,.05),toon(c),x,.15,-.5);
    solid(g,.3,2.6,.4,w.x-1,1.3,w.z-1.2);solid(g,.3,2.6,.4,w.x+1,1.3,w.z-1.2);
  }
  nearWorkshop(pos:Point){return Math.hypot(pos.x-this.workshopAt.x,pos.z-this.workshopAt.z)<1.6;}
  /** A small picker of every station job, opened at the Workshop arch. */
  openPicker(){
    if(this.picker){this.picker.hidden=false;return;}
    const el=document.createElement('section');el.className='workshop-picker panel';el.setAttribute('aria-label','Workshop');
    const jobs=levels.filter(l=>l.station&&l.id!=='vias-rush');
    el.innerHTML=`<h3>Workshop</h3><p>Practise any station. The whole job plays, nothing is graded or recorded.</p><div class="grid">${jobs.map(l=>`<button class="btn" data-practice="${l.id}" style="--lvl:${LOOK[l.id]?.color??'#5ED6CC'}"><small>${l.number}</small>${title(l)}</button>`).join('')}</div><button class="btn close" data-close>Close <span class="key">Esc</span></button>`;
    el.addEventListener('click',e=>{const t=(e.target as Element).closest<HTMLElement>('[data-practice],[data-close]');if(!t)return;if(t.dataset.close!==undefined){el.hidden=true;return;}flagAutostart(t.dataset.practice as Level['id']);location.href=`?level=${t.dataset.practice}&practice`;});
    addEventListener('keydown',e=>{if(e.code==='Escape'&&!el.hidden){el.hidden=true;e.stopPropagation();}},true);
    document.querySelector('[data-layer="hud"]')?.append(el);this.picker=el;
  }
  near(pos:Point){return this.doors.find(d=>Math.hypot(pos.x-d.at.x,pos.z-d.at.z)<1.5);}
  /** E at a door walks through it into that job. */
  interact(pos:Point){if(this.nearWorkshop(pos)){this.game.audio.pop();this.openPicker();return true;}const d=this.near(pos);if(!d)return false;
    if(d.locked){this.game.audio.tone(140,.2,.06,'square');d.leaf.rotation.y=-.08;return true;}
    this.game.audio.pop();d.arrival=.01;return true;}
  enter(level:Level){if(this.departing)return;this.departing=true;flagAutostart(level.id);this.game.hud.dataset.leaving=level.id;location.href=`?level=${level.id}`;}
  update(dt:number){
    const p=this.game.player.translation();
    for(const d of this.doors){const want=!d.locked&&Math.hypot(p.x-d.at.x,p.z-d.at.z)<2.6?1:0;d.open+=(want-d.open)*Math.min(1,dt*5);d.leaf.rotation.y=d.open*Math.PI*.48;d.portal.visible=d.open>.08;(d.portal.material as T.ShaderMaterial).uniforms.time.value=this.game.time;
      if(!d.locked&&(d.arrival>0||Math.hypot(p.x-d.at.x,p.z-d.at.z)<1.15)){d.arrival+=dt;if(d.open>.65&&d.arrival>.45)this.enter(d.level);}}
    const near=this.near(p),key=near?.level.id??'';if(key!==this.directoryKey&&this.directory){this.directoryKey=key;const m=this.directory.material as T.MeshBasicMaterial;m.map?.dispose();m.map=this.directoryTexture(near?.level);m.needsUpdate=true;}
  }
  prompt():Prompt|null{if(this.nearWorkshop(this.game.player.translation()))return {key:'E',text:'Workshop: practise any station'};const d=this.near(this.game.player.translation());if(d?.locked){const need=levels.find(l=>l.id===d.level.requires);return {key:'E',text:`Locked: finish ${need?`${need.number} · ${title(need)}`:'the previous job'} first`};}return d?{key:'E',text:`Enter ${d.level.number} · ${title(d.level)}${bestFor(d.level.id)?` (best ${bestFor(d.level.id)!.grade})`:''}`}:null;}
  private directoryTexture(level?:Level){return canvasTex(1024,540,c=>{
    c.fillStyle='#172b38';c.fillRect(0,0,1024,540);c.fillStyle='#71dbcc';c.font='700 36px system-ui';c.fillText('CIRCUIT CREW / DEPARTURES',52,72);
    c.fillStyle='#eff5f3';let size=62;const heading=level?title(level):'Choose your next job';c.font=`700 ${size}px system-ui`;while(c.measureText(heading).width>920){size--;c.font=`700 ${size}px system-ui`;}c.fillText(heading,52,178);
    c.font='28px system-ui';c.fillStyle='#b9d2d7';c.fillText(level?'Walk into the open portal':'Explore the three wings. Doors open as you approach.',52,238);
    for(const [i,text] of ['OFFICE / cable repair','FABRICATION / build & inspect','FACILITY / diagnose & restore'].entries()){c.fillStyle=['#e5b66e','#7bb8cb','#94bd9d'][i];c.fillRect(52,292+i*66,8,40);c.font='28px system-ui';c.fillText(text,82,323+i*66);}
  });}
  snapshot(){return {doors:this.doors.map(d=>({id:d.level.id,at:d.at,done:d.done,locked:d.locked,portal:d.portal.visible,open:d.open})),near:this.near(this.game.player.translation())?.level.id};}
}
