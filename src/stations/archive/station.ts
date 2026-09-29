// The Archive: the datasheet detective desk. Work orders arrive at the post desk; Pip carries
// them to the desk, reads fictional datasheets on the terminal, bookmarks values and drags them
// into the work order, requests a part (its bin lights up), carries the box to the test rig and
// sets it in. The rig runs it: it works, or it fails and says why. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressArchive,bankersLamp,plate,WALNUT,WALNUT_DARK,OCHRE,OLIVE,BRASS,CREAM} from './room';
import {toon,box,rbox,cyl,sphere,part,group,glow,canvasTex,INK,DMETAL} from '../../render/kit';
import {hot,glossyToon} from '../../render/actors';
import {solid} from '../../levels/decor';
import {binSpot,CASES,DOCS,GLOSSARY,KIND_LABEL,SLOT_LABEL,check,citeNote,clue,docById,needText,part as partOf,search,tierFor,cheapest,type Case,type Clue,type Doc,type Install,type Param} from './logic';
import './archive.css';

const RIG_TIME=3.4;
const MAKER_COLOR:Record<string,string>={'The Archive':WALNUT,'Brambleworth Passives':'#b0822c','Fenwick Thin Film':'#4f6b8a','Quillon Semiconductor':'#6a4c7a','Ottery Microsystems':'#3f6b5a','Harrowgate Microdevices':'#a44a3f'};
const TIER_WORD=['','Works','Works reliably','Elegant'];
const esc=(s:string)=>s.replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]!));
const WARN=new Set(['typ','absmax','front']);
// Shared materials for the rig and bin lamps (swapped, never rebuilt every frame).
const MAT={ledOff:toon('#5a6b4a'),ledOn:hot('#8dffb0',1.8),ledGlare:hot('#fff6e0',3),lampIdle:toon('#c9c2ad'),lampPass:hot('#8dffb0',2.2),lampFail:hot('#ff7a6b',2.2),lampBusy:hot('#ffe08a',1.4),binOff:glossyToon('#3f6b4a',{spec:.8,size:.95}),binOn:hot('#8dffb0',2.2)};

interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
interface Rig {mpn:string;t:number;result:Install;prop:Game['props'][number];shown:number}
export class ArchiveDesk implements Station {
  readonly view={distance:4.3,pitch:.62,lookY:.3};
  readonly limits={time:720,damage:1,cost:0};
  readonly stand={x:-2,z:-4.35};readonly table=new T.Vector3(-2,.8,-5.6);readonly facing=Math.PI;
  readonly rigAt={x:-7.4,z:-4.1};
  caseIdx=0;trayReady=false;active=false;screenOpen=true;query='';tabs:string[]=['stock'];doc='stock';
  evidence:string[]=[];cites:Partial<Record<Param,string>>={};selected?:string;requested?:string;fails=0;mistakes=0;spent=0;
  served:{case:string;mpn:string;tier:1|2|3;notes:string[]}[]=[];rig?:Rig;
  private root=new T.Group();private clickables:Clickable[]=[];private hovered?:Clickable;
  private tray?:Game['props'][number];private trayPapers=new T.Group();private boxes:{mpn:string;prop:Game['props'][number];label:T.Group}[]=[];
  private binLamps=new Map<string,{bulb:T.Mesh;halo:T.Object3D}>();private rigScreen!:T.Mesh;private rigCanvas=document.createElement('canvas');private rigTex!:T.CanvasTexture;
  private rigLamp!:T.Mesh;private rigBox=new T.Group();private rigBoxLabel=new T.MeshBasicMaterial({transparent:true});private rigBoxBody!:T.Mesh;private beacon!:T.Sprite;private fan=new T.Group();private fanSpeed=0;private led!:T.Mesh;private ledHalo!:T.Sprite;private frost!:T.Mesh;private deskScreen!:T.Mesh;
  private panel?:HTMLElement;private screen?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';private screenKey='';private docKey='';private listKey='';
  readonly job:StationJob;
  constructor(private game:Game){
    this.limits.cost=Math.ceil(CASES.reduce((n,k)=>n+partOf(cheapest(k))!.price,0)*1.25);
    this.job={goal:'Datasheet detective: fill three work orders',
      steps:[
        {text:'Bring the work-order tray from the post desk to the datasheet desk',done:()=>this.trayReady,at:()=>this.tray?.body.translation()??this.stand},
        {text:'Sit at the datasheet desk (E)',done:()=>this.active||this.served.length>0||!!this.requested,at:()=>this.stand},
        ...CASES.flatMap((k,i)=>[
          {text:`Order ${i+1} · ${k.title}: find the part, cite it, request it`,done:()=>this.served.length>i||(this.caseIdx===i&&!!this.requested),at:()=>this.stand},
          {text:'Carry the lit box to the test rig and set it in (E)',done:()=>this.served.length>i,at:()=>this.game.held&&this.boxOf(this.game.held)?{x:this.rigAt.x,z:this.rigAt.z}:this.requestedBox()?.prop.body.translation()??this.stand}])],
      bonuses:[
        {text:'Every work order cites guaranteed or recommended values',ok:()=>this.served.length>0&&this.served.every(s=>s.tier>=2)},
        {text:'Elegant: the cheapest adequate part, first try',ok:()=>this.served.length>0&&this.served.every(s=>s.tier===3)},
        {text:'No failed installs',ok:()=>this.mistakes===0}]};
    game.root.add(this.root);
    this.buildDesk();this.buildRig();this.buildBinLamps();
  }
  dress(kit:RoomKit){return dressArchive(this.game,kit);}
  current():Case|undefined{return CASES[this.caseIdx];}
  private ready=false;
  private setup(){this.ready=true;const g=this.game;this.tray=g.props.find(p=>p.spec.id==='orders');
    // The tray carries a stack of work orders in a folder, so it reads as paperwork, not lunch.
    const tp=this.trayPapers;this.root.add(tp);for(let k=0;k<3;k++){const s=part(tp,box(.5,.012,.36),toon(k===1?'#f3e7c8':'#fffaf0'),0,.085+k*.013,0,false);s.rotation.y=(k-1)*.08;}
    part(tp,box(.54,.018,.4),toon(OCHRE),.02,.13,.01).rotation.y=.05;part(tp,box(.2,.02,.05),toon('#a44a3f'),.02,.142,-.17,false);
    const ticket=new T.MeshBasicMaterial({map:signTextureSmall('WORK ORDERS ×3'),transparent:true});ticket.userData.outlineParameters={visible:false};
    const tk=new T.Mesh(new T.PlaneGeometry(.42,.105),ticket);tk.rotation.x=-Math.PI/2;tk.position.set(.02,.141,.06);tk.userData.noAO=true;tp.add(tk);
    for(const p of g.props){const id=p.spec.id;if(!id?.startsWith('part:'))continue;const mpn=id.slice(5),label=new T.Group();this.root.add(label);
      const info=partOf(mpn)!,m=new T.MeshBasicMaterial({map:boxLabel(info.bin,mpn),transparent:true});m.userData.outlineParameters={visible:false};
      const top=new T.Mesh(new T.PlaneGeometry(.64,.32),m);top.rotation.x=-Math.PI/2;top.position.y=.306;top.userData.noAO=true;label.add(top);
      const front=new T.Mesh(new T.PlaneGeometry(.6,.3),m);front.position.set(0,.02,.356);front.userData.noAO=true;label.add(front);
      this.boxes.push({mpn,prop:p,label});this.shelve(p);}
  }
  /** Stocked boxes sit fixed on their counter (tidy shelves); picking one up frees it. */
  private shelve(p:Game['props'][number]){p.body.setTranslation(p.home,true);p.body.setRotation(new T.Quaternion(),true);p.body.setLinvel({x:0,y:0,z:0},true);p.body.setAngvel({x:0,y:0,z:0},true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);}
  private boxOf(p:Game['props'][number]){return this.boxes.find(b=>b.prop===p);}
  private requestedBox(){return this.boxes.find(b=>b.mpn===this.requested);}

  // ---------- the desk (bench) ----------
  private buildDesk(){
    const g=this.game,t=this.table,r=g.decorRoot,top=group(this.root,t.x,t.y,t.z);
    // Walnut pedestal desk: the top sits at the table height.
    part(r,rbox(2.4,.08,1.05,.03),toon(WALNUT),t.x,t.y-.04,t.z);part(r,box(2.3,.03,.98),toon('#3f6b4a'),t.x,t.y+.002,t.z-.02);
    for(const s of [-1,1]){part(r,rbox(.62,t.y-.08,.95,.04),toon(WALNUT_DARK),t.x+s*.84,(t.y-.08)/2,t.z);for(let k=0;k<3;k++)part(r,box(.4,.03,.02),toon(BRASS),t.x+s*.84,.18+k*.22,t.z+.48);}
    solid(g,2.4,t.y,1.05,t.x,t.y/2,t.z);
    // The terminal: a cream monitor on a riser; its screen glows while the job runs.
    const mon=group(top,-.2,0,-.2);part(mon,rbox(.5,.06,.34,.02),toon(CREAM),0,.03,0);part(mon,cyl(.05,.07,.14,12),toon('#d9ccb0'),0,.12,0);
    part(mon,rbox(.86,.58,.18,.05),toon(CREAM),0,.5,0);part(mon,rbox(.44,.36,.26,.06),toon('#e6dac0'),0,.5,-.18);
    this.deskScreen=part(mon,new T.PlaneGeometry(.74,.46),new T.MeshBasicMaterial({map:terminalTexture(false)}),0,.5,.092,false);(this.deskScreen.material as T.Material).userData.outlineParameters={visible:false};
    part(mon,sphere(.012,8,6),hot('#6cff9a',2),.36,.25,.092,false);this.click(mon,'screen');
    part(top,rbox(.62,.03,.2,.02),toon('#e6dac0'),-.2,.015,.22);for(let k=0;k<3;k++)part(top,box(.56,.012,.035),toon('#cbbd9f'),-.2,.034,.16+k*.05,false);
    bankersLamp(top,.78,0,-.28,0,true);
    // A card-index box, a stack of binders and a magnifying glass.
    part(top,rbox(.26,.16,.34,.02),toon(OCHRE),-.92,.08,-.2);for(let k=0;k<5;k++)part(top,box(.22,.09,.006),toon('#fffaf0'),-.92,.17,-.32+k*.06,false);
    for(let k=0;k<3;k++)part(top,rbox(.34,.07,.26,.01),toon([OLIVE,'#a44a3f','#5b6b8f'][k]),-.9,.035+k*.07,.24).rotation.y=(k-1)*.12;
    const lens=group(top,.35,.012,.26,.6);part(lens,new T.TorusGeometry(.07,.012,8,24).rotateX(Math.PI/2),toon(BRASS));part(lens,cyl(.06,.06,.004,20),toon('#cfe8ef',{opacity:.5}),0,0,0,false);part(lens,cyl(.012,.014,.16,8,'x'),toon(WALNUT_DARK),.14,0,0);
    // Where the work-order tray lands.
    part(r,box(.84,.012,.54),toon(OCHRE),t.x+.72,t.y+.008,t.z+.2,false);
    plate(g.root,'DATASHEET DESK',t.x,t.y-.3,t.z+.53,.9,0,OLIVE,CREAM);
  }
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseScale=obj.scale.clone();}

  // ---------- the test rig ----------
  private buildRig(){
    const g=this.game,{x,z}=this.rigAt,r=g.decorRoot,cz=z-.5;
    part(r,rbox(2.6,.9,.9,.06),toon('#b9c49a'),x,.45,cz);part(r,box(2.66,.05,.96),toon(WALNUT),x,.925,cz);part(r,box(2.5,.06,.02),toon(OCHRE),x,.8,cz+.46);
    for(const s of [-1,1])part(r,box(.5,.5,.02),toon('#a7b287'),x+s*.8,.4,cz+.455);
    solid(g,2.6,.95,.9,x,.47,cz);
    // Install bay: an ochre outlined pad the box drops into.
    for(const [w,d,dx,dz] of [[.86,.05,0,-.33],[.86,.05,0,.33],[.05,.7,-.43,0],[.05,.7,.43,0]] as const)part(r,box(w,.03,d),toon('#ffc629'),x+dx,.96,cz+.05+dz,false);
    // Back panel: screen in the middle, the status LED on the left, the fan on the right.
    part(r,rbox(2.6,1.5,.14,.05),toon('#a7b287'),x,1.68,cz-.38);part(r,box(2.5,.08,.16),toon(WALNUT),x,2.45,cz-.38);
    const c=this.rigCanvas;c.width=512;c.height=288;this.rigTex=new T.CanvasTexture(c);this.rigTex.colorSpace=T.SRGBColorSpace;
    part(r,rbox(1.16,.7,.05,.03),toon(INK),x,1.98,cz-.3);
    this.rigScreen=part(g.root,new T.PlaneGeometry(1.08,.61),new T.MeshBasicMaterial({map:this.rigTex}),x,1.98,cz-.27,false);(this.rigScreen.material as T.Material).userData.outlineParameters={visible:false};
    part(r,cyl(.2,.2,.04,24,'z'),toon(INK),x-.93,1.98,cz-.3);part(r,cyl(.16,.16,.02,24,'z'),toon('#2a2c40'),x-.93,1.98,cz-.28);
    this.led=part(g.root,sphere(.07,14,10),MAT.ledOff,x-.93,1.98,cz-.24,false);this.ledHalo=glow(g.root,'rgba(140,255,160,1)',.9,.0);this.ledHalo.position.set(x-.93,1.98,cz-.18);
    plate(r,'LED',x-.93,1.7,cz-.3,.34,0,CREAM,INK);
    part(r,cyl(.24,.24,.06,28,'z'),toon(INK),x+.93,1.98,cz-.3);part(r,new T.TorusGeometry(.23,.02,6,28),toon(DMETAL),x+.93,1.98,cz-.24,false);
    this.fan.position.set(x+.93,1.98,cz-.25);g.root.add(this.fan);for(let k=0;k<5;k++){const b=part(this.fan,box(.07,.2,.012),toon(OCHRE),0,0,0,false);b.position.set(Math.sin(k*1.2566)*.1,Math.cos(k*1.2566)*.1,0);b.rotation.set(0,.4,-k*1.2566);}
    part(this.fan,cyl(.05,.05,.04,14,'z'),toon(INK),0,0,.01,false);plate(r,'FAN',x+.93,1.7,cz-.3,.34,0,CREAM,INK);
    this.rigLamp=part(g.root,sphere(.09,16,10),MAT.lampIdle,x,2.55,cz-.38,false);this.rigLamp.scale.y=.75;
    plate(r,'TEST RIG',x-.55,2.56,cz-.3,.8,0,OCHRE,WALNUT_DARK);
    // The cold chamber beside it: a small chest freezer with a window and a thermometer.
    const fz=group(r,x+1.85,0,cz);part(fz,rbox(.9,.9,.8,.06),toon('#eef2f0'),0,.45,0);part(fz,rbox(.94,.08,.84,.03),toon('#d7e3e6'),0,.93,0);
    part(fz,box(.5,.3,.02),toon('#9fd3e6',{opacity:.7}),0,.5,.405,false);part(fz,box(.12,.5,.03),toon('#e5484d'),.33,.55,.41,false);plate(fz,'COLD CHAMBER',0,.2,.41,.7,0,'#dff1f6',INK);
    this.frost=part(g.root,box(.46,.26,.01),toon('#dff6ff',{opacity:.0}),x+1.85,.5,cz+.418,false);
    solid(g,.9,.95,.8,x+1.85,.47,cz);
    // The box being tested sits in the bay (the prop itself steps out of the world meanwhile).
    this.rigBox.position.set(x,.96,cz+.05);this.rigBox.visible=false;g.root.add(this.rigBox);this.rigBoxLabel.userData.outlineParameters={visible:false};
    this.rigBoxBody=part(this.rigBox,rbox(.7,.6,.7,.05),toon(OCHRE),0,.3,0);
    const top=new T.Mesh(new T.PlaneGeometry(.64,.32),this.rigBoxLabel);top.rotation.x=-Math.PI/2;top.position.y=.606;top.userData.noAO=true;this.rigBox.add(top);
    const front=new T.Mesh(new T.PlaneGeometry(.6,.3),this.rigBoxLabel);front.position.set(0,.32,.356);front.userData.noAO=true;this.rigBox.add(front);
    this.beacon=glow(g.root,'rgba(150,255,180,1)',1.1,.0);
    this.drawRig();
  }
  private buildBinLamps(){
    for(const k of CASES)for(const mpn of k.stock){const info=partOf(mpn)!,s=binSpot(info.bin),g=group(this.game.root,s.x,.4,s.z-.26);
      part(g,cyl(.035,.045,.03,12),toon(BRASS),0,.015,0);part(g,cyl(.012,.012,.28,8),toon(BRASS),0,.16,0);
      const bulb=part(g,sphere(.07,14,10),MAT.binOff,0,.33,0);const halo=glow(g,'rgba(140,255,170,1)',.9,.55);halo.position.y=.33;halo.visible=false;
      this.binLamps.set(mpn,{bulb,halo});}
  }
  private lightBins(){for(const [mpn,l] of this.binLamps){const on=mpn===this.requested;l.bulb.material=on?MAT.binOn:MAT.binOff;l.halo.visible=on;}}
  private drawRig(){
    const c=this.rigCanvas.getContext('2d')!,k=this.current(),rig=this.rig;
    c.fillStyle='#1f2a24';c.fillRect(0,0,512,288);c.fillStyle='rgba(140,255,170,.06)';for(let y=0;y<288;y+=4)c.fillRect(0,y,512,1);
    c.font='700 26px "Fredoka Variable", system-ui, sans-serif';c.fillStyle='#bff5c9';c.textBaseline='top';
    c.fillText(rig?`TESTING ${rig.mpn}`:k?`READY · ${k.title.toUpperCase()}`:'ALL ORDERS DONE',22,18);
    c.fillStyle='rgba(191,245,201,.35)';c.fillRect(22,56,468,2);
    if(rig){const lines=rig.result.lines;c.font='600 24px "Fredoka Variable", system-ui, sans-serif';
      lines.slice(0,rig.shown).forEach((ln,i)=>{c.fillStyle=ln.ok?'#8dffb0':'#ff8f7a';c.fillText(`${ln.ok?'✓':'✗'}  ${ln.label}`,26,74+i*38);});
      if(rig.shown>lines.length){c.font='700 40px "Fredoka Variable", system-ui, sans-serif';c.fillStyle=rig.result.ok?'#8dffb0':'#ff8f7a';c.fillText(rig.result.ok?'PASS':'FAIL',26,226);}}
    else if(k){c.font='600 22px "Fredoka Variable", system-ui, sans-serif';c.fillStyle='#bff5c9';
      c.fillText(this.requested?`Waiting for ${this.requested}`:'Waiting for a part',26,80);c.fillStyle='rgba(191,245,201,.7)';needText(k.needs).forEach((n,i)=>c.fillText(`· ${n}`,26,120+i*32));}
    this.rigTex.needsUpdate=true;
  }

  // ---------- actions ----------
  act(name:string,arg?:unknown):boolean{
    const k=this.current(),a=this.game.audio;
    if(!k)return false;
    if(!this.trayReady){this.say('The work orders are still at the post desk. Carry the tray to the datasheet desk first.');a.voice('hm',1.4);return false;}
    switch(name){
      case 'screen':this.screenOpen=!this.screenOpen;a.tone(this.screenOpen?520:360,.06,.03,'triangle');break;
      case 'search':this.query=String(arg??'');break;
      case 'open':{const d=docById(String(arg));if(!d)return false;if(!this.tabs.includes(d.id))this.tabs.push(d.id);if(this.tabs.length>5)this.tabs.splice(this.tabs.findIndex(t=>t!==d.id),1);this.doc=d.id;a.tone(640,.04,.03);break;}
      case 'close':{const id=String(arg);if(!this.tabs.includes(id)||this.tabs.length===1)return false;this.tabs=this.tabs.filter(t=>t!==id);if(this.doc===id)this.doc=this.tabs[this.tabs.length-1];break;}
      case 'bookmark':{const x=clue(String(arg));if(!x)return false;if(this.evidence.includes(x.id)){this.selected=x.id;return true;}
        this.evidence.push(x.id);this.selected=x.id;a.pop();break;}
      case 'unbookmark':{const id=String(arg);if(!this.evidence.includes(id))return false;this.evidence=this.evidence.filter(e=>e!==id);if(this.selected===id)this.selected=undefined;break;}
      case 'select':{const id=String(arg);if(!this.evidence.includes(id))return false;this.selected=id;a.tone(700,.03,.02);break;}
      case 'cite':{const {slot,clue:id}=(arg??{}) as {slot?:Param;clue?:string};const x=id?clue(id):undefined;
        if(!x||!slot||!k.slots.includes(slot))return false;
        if(x.param!==slot){this.say(`That value is not about ${SLOT_LABEL[slot].toLowerCase()}. ${slot==='mpn'?'Drag a part number here.':`Look for the ${SLOT_LABEL[slot].toLowerCase()} rows.`}`);a.tone(200,.12,.04,'square');return false;}
        if(slot==='mpn'){const p=partOf(String(x.value));if(p&&p.kind!==k.kind){this.say(`${p.mpn} is a ${p.kind==='driver'?'motor driver':p.kind}. This order needs a ${k.kind==='driver'?'motor driver':k.kind}.`,'bad');a.tone(200,.12,.04,'square');return false;}}
        if(!this.evidence.includes(x.id))this.evidence.push(x.id);this.cites[slot]=x.id;this.selected=undefined;
        const note=citeNote(slot,x);if(note)this.say(note);a.tone(880,.05,.03,'triangle');break;}
      case 'uncite':{const slot=arg as Param;if(!this.cites[slot])return false;delete this.cites[slot];break;}
      case 'request':{const id=this.cites.mpn,mpn=id?String(clue(id)!.value):undefined;
        if(!mpn){this.say('Put a part number on the work order first: bookmark one in a datasheet or the stock list and drag it in.');return false;}
        if(this.rig){this.say('The rig is busy testing a part.');return false;}
        if(mpn===this.requested){this.say(`${mpn} is already requested: bin ${partOf(mpn)!.bin} is lit.`);return false;}
        this.requested=mpn;this.lightBins();this.drawRig();const bin=partOf(mpn)!.bin;
        this.say(`Bin ${bin} is lit. Carry the ${mpn} box to the test rig.${k.slots.some(s=>!this.cites[s])?' (Empty slots on the work order will cost the reliable grade.)':''}`,'ok');a.bell(990,.3,.03);break;}
      default:return false;
    }
    this.shown='';this.updatePanel();return true;
  }
  /** Tabletop hits: the monitor opens the terminal. */
  pointer(e:Pointer){
    const hits=e.ray.intersectObjects(this.clickables.map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);if(found)found.obj.scale.copy(found.obj.userData.baseScale).multiplyScalar(1.05);this.hovered=found;}
    document.body.style.cursor=found&&this.active?'pointer':'';
    if(e.kind==='down'&&e.button===0&&found)this.act(found.act,found.arg);
  }
  key(code:string){
    if(code==='KeyM'){this.act('screen');return true;}
    if(code==='Enter'){this.act('request');return true;}
    if(code==='Slash'&&this.screenOpen){this.screen?.querySelector<HTMLInputElement>('.as-search input')?.focus();return true;}
    return false;
  }
  setActive(active:boolean){this.active=active;if(active)this.screenOpen=true;queueMicrotask(()=>this.updatePanel());if(!active){document.body.style.cursor='';if(this.hovered){this.hovered.obj.scale.copy(this.hovered.obj.userData.baseScale);this.hovered=undefined;}}this.shown='';}
  dropped(p:Game['props'][number]){
    const q=p.body.translation(),pl=this.game.player.translation();
    if(p.spec.id==='orders'&&!this.trayReady){const t=this.table;
      if(Math.hypot(q.x-t.x,q.z-t.z)<2.2||Math.hypot(pl.x-this.stand.x,pl.z-this.stand.z)<2){this.trayReady=true;this.fix(p,t.x+.72,t.y+.09,t.z+.2);this.game.audio.plug();this.game.burst({x:t.x+.72,y:t.y+.1,z:t.z+.2},'#ffd98a',1,'ring');
        (this.deskScreen.material as T.MeshBasicMaterial).map=terminalTexture(true);this.shown='';}
      return;}
    const b=this.boxOf(p),k=this.current();if(!b||!k)return;
    const near=Math.hypot(q.x-this.rigAt.x,q.z-(this.rigAt.z-.45))<2.2||Math.hypot(pl.x-this.rigAt.x,pl.z-this.rigAt.z)<2.1;if(!near)return;
    if(this.rig){this.say('The rig is busy. Wait for this test to finish.');return;}
    if(b.mpn!==this.requested){this.say(this.requested?`The rig runs the part on the work order: ${this.requested} (bin ${partOf(this.requested)!.bin}). This box is ${b.mpn}.`:`Nothing is requested yet. Pick the part at the desk first; the rig runs only what the work order asks for.`,'bad');this.game.audio.tone(180,.18,.05,'square');return;}
    p.mesh.visible=false;p.body.setEnabled(false);this.showRigBox(p,b.mpn);this.spent+=partOf(b.mpn)!.price;
    this.rig={mpn:b.mpn,t:0,result:check(k,b.mpn),prop:p,shown:0};this.game.audio.plug();this.game.audio.tone(220,.4,.03,'sawtooth');this.drawRig();this.shown='';
  }
  private showRigBox(p:Game['props'][number],mpn:string){this.rigBox.visible=true;this.rigBoxBody.material=toon(p.spec.color??OCHRE);this.rigBoxLabel.map=boxLabel(partOf(mpn)!.bin,mpn);this.rigBoxLabel.needsUpdate=true;}
  private fix(p:Game['props'][number],x:number,y:number,z:number){p.body.setTranslation({x,y,z},true);p.body.setRotation(new T.Quaternion(),true);p.body.setLinvel({x:0,y:0,z:0},true);p.body.setAngvel({x:0,y:0,z:0},true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);}
  private finishRig(){
    const rig=this.rig!,k=this.current()!,a=this.game.audio,g=this.game;this.rig=undefined;
    if(!rig.result.ok){this.fails++;this.mistakes++;
      this.say(`${rig.mpn} failed on the rig. ${rig.result.problem} Back to the datasheets.`,'bad');a.voice('groan',1);g.alarm({x:this.rigAt.x,z:this.rigAt.z},3);
      // The box goes back to its bin.
      rig.prop.body.setEnabled(true);this.shelve(rig.prop);rig.prop.mesh.visible=true;this.rigBox.visible=false;
      this.drawRig();this.shown='';return;}
    const v=tierFor(k,rig.mpn,this.cites,this.fails);this.served.push({case:k.id,mpn:rig.mpn,tier:v.tier,notes:v.notes});
    this.say(`${k.who}: “${['','It runs, thanks.','Solid work, and I can see why it works.','Perfect: right part, right price, first try.'][v.tier]}” ${TIER_WORD[v.tier]}.${v.notes[0]?` ${v.notes[0]}`:''}`,'ok');
    a.cheer();a.bell(1319,.5,.05);g.burst({x:this.rigAt.x,y:1.8,z:this.rigAt.z-.4},'#ffcf52',30,'confetti');
    this.caseIdx++;this.cites={};this.evidence=[];this.selected=undefined;this.requested=undefined;this.fails=0;this.lightBins();this.drawRig();this.shown='';
  }
  update(dt:number){
    if(!this.ready)this.setup();
    const held=this.game.held;if(held&&this.boxOf(held)&&!held.body.isDynamic())held.body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
    if(this.tray){const q=this.tray.body.translation(),r=this.tray.body.rotation();this.trayPapers.position.set(q.x,q.y,q.z);this.trayPapers.quaternion.set(r.x,r.y,r.z,r.w);}
    for(const b of this.boxes){b.label.visible=b.prop.mesh.visible;if(!b.label.visible)continue;const q=b.prop.body.translation(),r=b.prop.body.rotation();b.label.position.set(q.x,q.y,q.z);b.label.quaternion.set(r.x,r.y,r.z,r.w);}
    // Rig animation: lines appear one by one, then the verdict; the device shows it too.
    const rig=this.rig,k=this.current(),t=this.game.time;
    if(rig){rig.t+=dt;const n=rig.result.lines.length,step=Math.min(n+1,Math.floor(rig.t/(RIG_TIME/(n+1.5))));if(step!==rig.shown){rig.shown=step;this.drawRig();this.game.audio.tone(rig.shown>n?(rig.result.ok?880:180):520,.07,.03,rig.shown>n&&!rig.result.ok?'square':'triangle');}
      if(rig.t>=RIG_TIME+.6)this.finishRig();}
    const running=this.rig,dev=running?k?.rig:undefined,ok=running?.result.ok,late=running?running.t>RIG_TIME*.55:false;
    this.fanSpeed+=((dev==='fan'&&(ok||!late)?1:0)-this.fanSpeed)*Math.min(1,dt*(dev==='fan'?2:1.2));this.fan.rotation.z-=this.fanSpeed*dt*22;
    const glare=dev==='led'&&running!.mpn.endsWith('471'),ledOn=dev==='led';
    this.led.material=ledOn?(glare?MAT.ledGlare:MAT.ledOn):MAT.ledOff;this.ledHalo.scale.setScalar(glare?1.9:.9);(this.ledHalo.material as T.SpriteMaterial).opacity=ledOn?(glare?.9:.55):0;
    (this.frost.material as T.MeshToonMaterial).opacity=T.MathUtils.lerp((this.frost.material as T.MeshToonMaterial).opacity,dev==='freezer'?.85:0,Math.min(1,dt*2));
    const verdict=running&&running.shown>running.result.lines.length;
    this.rigLamp.material=verdict?(ok?MAT.lampPass:MAT.lampFail):running?MAT.lampBusy:MAT.lampIdle;this.rigLamp.scale.setScalar(running&&!verdict?1+Math.sin(t*12)*.08:1);this.rigLamp.scale.y*=.75;
    // A soft green beacon floats over the requested box until it is picked up.
    const rb=this.requestedBox(),showBeacon=!!rb&&rb.prop.mesh.visible&&this.game.held!==rb.prop;this.beacon.visible=showBeacon;
    if(showBeacon){const q=rb!.prop.body.translation();this.beacon.position.set(q.x,q.y+.75+Math.sin(t*3)*.05,q.z);(this.beacon.material as T.SpriteMaterial).opacity=.45+Math.sin(t*4)*.15;}
    this.updatePanel();
  }

  // ---------- panels ----------
  private say(text:string,tone:'ok'|'bad'|'info'='info'){
    if(!this.toast){this.toast=document.createElement('div');this.toast.className='station-toast archive-toast';this.layer()?.append(this.toast);}
    this.toast.textContent=text;this.toast.dataset.tone=tone;this.toast.hidden=false;this.toastUntil=this.game.time+Math.max(4.5,text.length*.065);
  }
  private layer(){return document.querySelector<HTMLElement>('[data-layer="hud"]');}
  private updatePanel(){
    if(this.toast&&!this.toast.hidden&&this.game.time>this.toastUntil&&this.game.running)this.toast.hidden=true;
    const open=this.active&&this.screenOpen&&this.trayReady&&!!this.current()&&!this.game.won;
    if(open)document.body.dataset.archive='open';else delete document.body.dataset.archive;
    const k=this.current();
    const key=JSON.stringify([this.active,this.caseIdx,this.cites,this.requested,this.trayReady,!!this.rig,this.selected,this.evidence.length]);
    if(key!==this.shown){this.shown=key;this.renderOrder(k);}
    this.renderScreen(open);
  }
  /** The work order: the job, its needs, the evidence slots and the request button. */
  private renderOrder(k:Case|undefined){
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel archive-order';this.layer()?.append(this.panel);this.wire(this.panel);}
    this.panel.hidden=!k||!this.trayReady;if(!k)return;
    const slot=(s:Param)=>{const id=this.cites[s],x=id?clue(id):undefined;
      return `<li class="slot${x?' filled':''}${x&&WARN.has(x.kind)?' warn':''}${this.selected?' armed':''}" data-slot="${s}"><span class="sl">${SLOT_LABEL[s]}</span>`+
        (x?`<span class="cite">${chipInner(x)}<button class="x" data-uncite="${s}" aria-label="Remove">×</button></span>`:`<span class="drop">${this.selected?'Click to cite the selected value':'Drop evidence here'}</span>`)+`</li>`;};
    const req=this.requested?partOf(this.requested)!:undefined,mpn=this.cites.mpn?String(clue(this.cites.mpn)!.value):undefined;
    this.panel.innerHTML=`<header><small>WORK ORDER ${this.caseIdx+1}/${CASES.length} · ${esc(k.who)}</small><h4>${esc(k.title)}</h4><p>${esc(k.brief)}</p></header>`+
      `<ul class="needs">${needText(k.needs).map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`+
      (this.active?`<ol class="slots">${k.slots.map(slot).join('')}</ol>`+
        `<button class="btn primary req" data-act="request" ${!mpn||this.rig?'disabled':''}>${req?`Requested · bin ${req.bin} lit`:mpn?`Request ${esc(mpn)}`:'Request part'} <span class="key kb">Enter</span></button>`+
        `<p class="profile">Cite guaranteed (min/max) or recommended values for a reliable grade. Parts and prices are fictional.</p>`
        :this.requested?`<p class="status">Requested: <b>${esc(this.requested)}</b> · bin ${req!.bin} is lit.</p>`:'');
  }
  /** The terminal overlay: search, results, document tabs, the datasheet and the evidence tray. */
  private renderScreen(open:boolean){
    if(!open){if(this.screen)this.screen.hidden=true;return;}
    if(!this.screen){this.screen=document.createElement('section');this.screen.className='archive-screen';this.screen.setAttribute('aria-label','Archive terminal');this.layer()?.append(this.screen);this.build(this.screen);}
    this.screen.hidden=false;
    const results=search(this.query),listKey=JSON.stringify([this.query,this.doc]);
    if(listKey!==this.listKey){this.listKey=listKey;
      this.screen.querySelector('.as-list')!.innerHTML=results.length?results.map(d=>`<button class="as-hit${d.id===this.doc?' on':''}" data-doc="${d.id}" style="--mk:${MAKER_COLOR[d.maker]??WALNUT}"><small>${esc(d.maker)}</small><b>${esc(d.title)}</b><span>${esc(d.subtitle)}</span></button>`).join(''):`<p class="as-none">No document mentions “${esc(this.query)}”.</p>`;
      this.screen.querySelector('.as-count')!.textContent=`${results.length} of ${DOCS.length} documents`;}
    const docKey=JSON.stringify([this.doc,this.tabs,this.evidence,this.selected]);
    if(docKey!==this.docKey){this.docKey=docKey;
      this.screen.querySelector('.as-tabs')!.innerHTML=this.tabs.map(id=>{const d=docById(id)!;return `<span class="as-tab${id===this.doc?' on':''}" data-tab="${id}">${esc(d.title)}${this.tabs.length>1?`<button data-close="${id}" aria-label="Close">×</button>`:''}</span>`;}).join('');
      const view=this.screen.querySelector<HTMLElement>('.as-doc')!,keep=view.dataset.shown===this.doc?view.scrollTop:0;view.innerHTML=renderDoc(docById(this.doc)!,new Set(this.evidence));view.dataset.shown=this.doc;view.scrollTop=keep;
      this.screen.querySelector('.as-chips')!.innerHTML=this.evidence.length?this.evidence.map(id=>{const x=clue(id)!;return `<span class="chip k-${x.kind}${id===this.selected?' sel':''}" data-chip="${id}" draggable="true">${chipInner(x)}<button class="x" data-unmark="${id}" aria-label="Remove">×</button></span>`;}).join(''):`<span class="as-hint">Click a value in a datasheet to bookmark it. Drag it onto the work order, or click it and then a slot.</span>`;}
  }
  /** One-time markup and event wiring for the terminal (event delegation: re-renders keep working). */
  private build(el:HTMLElement){
    el.innerHTML=`<div class="as-bezel"><div class="as-bar"><label class="as-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search datasheets: part number, maker, word…" aria-label="Search datasheets"></label><div class="as-tabs"></div><button class="as-hide" data-act="screen" aria-label="Hide the screen">Hide <span class="key kb">M</span></button></div>`+
      `<div class="as-main"><aside class="as-side"><p class="as-count"></p><div class="as-list"></div><dl class="as-gloss">${GLOSSARY.map(([t,d])=>`<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl></aside><article class="as-doc"></article></div>`+
      `<footer class="as-tray"><b>Evidence</b><div class="as-chips"></div></footer><i class="as-plate">ARCHIVE TERMINAL</i><i class="as-power"></i></div>`;
    const input=el.querySelector<HTMLInputElement>('input')!;
    // Typing belongs to the search box, not to Pip (E would otherwise stand up from the desk).
    for(const type of ['keydown','keyup'] as const)input.addEventListener(type,e=>{e.stopPropagation();if(type==='keydown'&&e.key==='Escape')input.blur();});
    input.addEventListener('input',()=>this.act('search',input.value));
    this.wire(el);
  }
  private wire(el:HTMLElement){
    el.addEventListener('click',e=>{const t=e.target as HTMLElement,q=(s:string)=>t.closest<HTMLElement>(s);let m:HTMLElement|null;
      if((m=q('[data-close]'))){e.stopPropagation();this.act('close',m.dataset.close);return;}
      if((m=q('[data-uncite]'))){this.act('uncite',m.dataset.uncite);return;}
      if((m=q('[data-unmark]'))){this.act('unbookmark',m.dataset.unmark);return;}
      if((m=q('[data-act]'))){this.act(m.dataset.act!);return;}
      if((m=q('[data-doc]'))){this.act('open',m.dataset.doc);return;}
      if((m=q('[data-tab]'))){this.act('open',m.dataset.tab);return;}
      if((m=q('[data-chip]'))){this.act('select',m.dataset.chip);return;}
      if((m=q('[data-slot]'))&&this.selected){this.act('cite',{slot:m.dataset.slot,clue:this.selected});return;}
      if((m=q('[data-clue]'))){this.act('bookmark',m.dataset.clue);return;}});
    el.addEventListener('dragstart',e=>{const m=(e.target as HTMLElement).closest<HTMLElement>('[data-clue],[data-chip]');if(!m||!e.dataTransfer)return;e.dataTransfer.setData('text/plain',m.dataset.clue??m.dataset.chip!);e.dataTransfer.effectAllowed='copy';document.body.dataset.dragging='true';});
    el.addEventListener('dragend',()=>{delete document.body.dataset.dragging;});
    el.addEventListener('dragover',e=>{const s=(e.target as HTMLElement).closest('[data-slot]');if(s){e.preventDefault();s.classList.add('over');}});
    el.addEventListener('dragleave',e=>{(e.target as HTMLElement).closest('[data-slot]')?.classList.remove('over');});
    el.addEventListener('drop',e=>{const s=(e.target as HTMLElement).closest<HTMLElement>('[data-slot]');if(!s)return;e.preventDefault();s.classList.remove('over');delete document.body.dataset.dragging;
      const id=e.dataTransfer?.getData('text/plain');if(id)this.act('cite',{slot:s.dataset.slot,clue:id});});
  }

  prompt(atBench:boolean):Prompt|null{
    const k=this.current();if(!k||this.game.won)return null;const g=this.game,p=g.player.translation();
    if(!atBench){
      const held=g.held;
      if(held?.spec.id==='orders'&&Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<2.4)return {key:'E',text:'Set the work orders on the desk'};
      const hb=held&&this.boxOf(held);
      if(hb){const near=Math.hypot(p.x-this.rigAt.x,p.z-this.rigAt.z)<2.1;return {key:'E',text:near?`Set ${hb.mpn} in the test rig`:hb.mpn===this.requested?'Carry it to the test rig (left of the desk)':`${hb.mpn} is not on the work order · E puts it down`};}
      if(this.rig)return {key:'…',text:`The rig is testing ${this.rig.mpn}`};
      if(!held&&Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6)return this.trayReady?{key:'E',text:'Sit at the datasheet desk'}:{key:'E',text:'Sit at the desk (the work orders are still at the post desk)'};
      const near=!held?g.nearest():undefined,nb=near&&this.boxOf(near);
      if(nb)return {key:'E',text:nb.mpn===this.requested?`Pick up ${nb.mpn} (bin ${partOf(nb.mpn)!.bin})`:`Pick up ${nb.mpn} (not requested)`};
      if(near?.spec.id==='orders')return {key:'E',text:'Pick up the work-order tray'};
      return null;}
    if(!this.trayReady)return {key:'E',text:'Stand up and fetch the work-order tray from the post desk'};
    if(this.rig)return {key:'E',text:'The rig is testing: stand up to watch'};
    if(this.requested)return {key:'E',text:`Stand up and fetch ${this.requested} from lit bin ${partOf(this.requested)!.bin}`};
    if(!this.screenOpen)return {key:'M',text:'Open the terminal (or click the monitor)'};
    if(!this.cites.mpn)return {key:'Drag',text:'Find the right part and drag its part number onto the work order'};
    return {key:'Enter',text:'Request the part (fill every slot for a reliable grade)'};
  }
  complete(){return this.served.length>=CASES.length;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent*10)/10};}
  snapshot(){return {caseIdx:this.caseIdx,trayReady:this.trayReady,active:this.active,screenOpen:this.screenOpen,requested:this.requested??null,cites:this.cites,evidence:this.evidence,selected:this.selected??null,
    served:this.served.map(s=>({case:s.case,mpn:s.mpn,tier:s.tier})),mistakes:this.mistakes,fails:this.fails,spent:this.spent,doc:this.doc,tabs:this.tabs,results:search(this.query).length,
    rig:this.rig?{mpn:this.rig.mpn,t:this.rig.t,ok:this.rig.result.ok}:null,boxes:this.boxes.map(b=>({mpn:b.mpn,visible:b.prop.mesh.visible,pos:{...b.prop.body.translation()}}))};}
}

/** Evidence chip: the value's words plus a tag saying how much the datasheet promises. */
function chipInner(x:Clue){const d=docById(x.doc)!;return `<i class="ktag k-${x.kind}">${KIND_LABEL[x.kind]}</i><span class="ct">${esc(x.text)}</span><small>${esc(d.title)}${x.cond?` · ${esc(x.cond)}`:''}</small>`;}
/** A datasheet as HTML: header band, features, then its tables with clickable values. */
function renderDoc(d:Doc,marked:Set<string>){
  const val=(x:string|{id:string;kind:string;text:string},shown?:string)=>typeof x==='string'?esc(x):`<button class="val k-${x.kind}${marked.has(x.id)?' marked':''}" data-clue="${x.id}" draggable="true" title="${esc(KIND_LABEL[x.kind as keyof typeof KIND_LABEL])}: click to bookmark">${esc(shown??cellText(x as Clue))}</button>`;
  const section=(s:Doc['sections'][number])=>{const kind=/absolute/i.test(s.title)?'abs':/recommended/i.test(s.title)?'rec':/electrical/i.test(s.title)?'elec':/ordering|stock/i.test(s.title)?'order':'';
    const cols=s.cols??[],rows=s.rows??[];
    const table=rows.length?`<table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>{const withLabel=r.cells.length<cols.length;
      return `<tr${r.clue?` class="clue-row k-${r.clue.kind}${marked.has(r.clue.id)?' marked':''}" data-clue="${r.clue.id}" draggable="true" title="${KIND_LABEL[r.clue.kind]}: click to bookmark"`:''}>${withLabel?`<th scope="row">${esc(r.label)}${r.cond?`<small>${esc(r.cond)}</small>`:''}</th>`:''}${r.cells.map(c=>`<td>${val(c)}</td>`).join('')}</tr>`;}).join('')}</tbody></table>`:'';
    return `<section class="ds-sec ${kind}"><h5>${esc(s.title)}</h5>${s.text?`<p>${esc(s.text)}</p>`:''}${table}${s.note?`<p class="ds-note">${esc(s.note)}</p>`:''}</section>`;};
  return `<header class="ds-head" style="--mk:${MAKER_COLOR[d.maker]??WALNUT}"><small>${esc(d.maker)} · ${esc(d.rev)}</small><h3>${esc(d.title)}</h3><p>${esc(d.subtitle)}</p>${d.id==='stock'?'':`<p class="ds-parts">${d.parts.map(esc).join(' · ')}</p>`}</header>`+
    `<section class="ds-sec front"><h5>Features</h5><ul>${d.features.map(f=>`<li>${val(f,typeof f==='string'?undefined:f.text)}</li>`).join('')}</ul></section>`+d.sections.map(section).join('')+
    `<p class="ds-foot">Fictional datasheet for Circuit Crew. Not a real part.</p>`;
}
/** Short text for a value inside a table cell. */
function cellText(x:Clue){
  if(x.kind==='min'||x.kind==='typ'||x.kind==='max')return String(x.value);
  if(x.param==='mpn')return String(x.value);if(x.param==='r')return x.text.split(': ')[1];if(x.param==='tol')return `±${x.value} %`;
  if(x.param==='pkg')return String(x.value);if(x.param==='temp'&&x.lo!==undefined)return `${x.lo<0?'−':''}${Math.abs(x.lo)} to ${x.hi} °C`;return x.text;
}
function boxLabel(bin:string,mpn:string){
  return canvasTex(256,128,c=>{c.fillStyle=CREAM;c.beginPath();c.roundRect(6,6,244,116,18);c.fill();c.lineWidth=6;c.strokeStyle=WALNUT_DARK;c.stroke();
    c.fillStyle=bin[0]==='A'?OCHRE:bin[0]==='B'?OLIVE:'#c7774a';c.beginPath();c.arc(50,64,34,0,7);c.fill();c.stroke();
    c.fillStyle='#fffaf0';c.font='700 34px "Fredoka Variable", system-ui, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(bin,50,66);
    let size=34;c.font=`700 ${size}px "Fredoka Variable", system-ui, sans-serif`;while(size>12&&c.measureText(mpn).width>150){size--;c.font=`700 ${size}px "Fredoka Variable", system-ui, sans-serif`;}
    c.fillStyle=INK;c.textAlign='left';c.fillText(mpn,94,66);});
}
function signTextureSmall(text:string){
  return canvasTex(256,64,c=>{c.fillStyle='#fffaf0';c.beginPath();c.roundRect(4,4,248,56,10);c.fill();c.fillStyle=WALNUT_DARK;c.font='700 30px "Fredoka Variable", system-ui, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,128,34);});
}
function terminalTexture(on:boolean){
  return canvasTex(256,160,c=>{c.fillStyle=on?'#f3ead2':'#27342c';c.fillRect(0,0,256,160);
    if(!on){c.fillStyle='rgba(140,255,170,.5)';c.fillRect(20,70,14,20);return;}
    c.fillStyle='#8a9a4a';c.fillRect(0,0,256,22);c.fillStyle='#d9a441';c.fillRect(12,34,70,112);
    c.fillStyle='rgba(58,36,22,.55)';for(let k=0;k<9;k++){c.fillRect(96,34+k*12,120-(k*37)%60,5);}c.fillStyle='rgba(47,138,90,.6)';c.fillRect(96,142,60,8);});
}
