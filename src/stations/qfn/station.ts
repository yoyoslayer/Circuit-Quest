// QFN layout bench (Fabrication Bay): the "parking puzzle". The board lies on the bench as a big
// clean grid with the QFN fixed in the middle; the other parts arrive scrambled around it. Pip
// slides and turns them into place, then draws tracks between pads. Board 1 is one copper layer
// (tracks can't cross), board 2 is about decoupling, board 3 adds layer 2, vias and a thermal pad.
// Dashed lines are the ratsnest: connections still to route. Rules: ./logic.ts.
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Game} from '../../game';
import type {Station,StationJob,Pointer,Prompt,RoomKit} from '../types';
import {dressFabBay} from './room';
import {toon,box,rbox,cyl,part,group,canvasTex,INK} from '../../render/kit';
import {hot} from '../../render/actors';
import {BOARDS,blank,check,erase,footprint,netOfPin,isNC,partOf,pinCells,placeProblem,ratsnest,strokeNet,stepProblem,traceProblem,viaProblem,same,
  type Board,type Design,type Layer,type PartDef,type Place,type Report,type Rot,type XY} from './logic';
import './qfn.css';

/** Cell size on the bench (world units) and the board's top above the worktop. */
const S=.15,TOP=.07;
const NET_COLORS:Record<string,string>={VDD:'#e5484d',VIN:'#e5484d',GND:'#3f7fd6',OUT:'#f08a24',SIG:'#9b6ee8',RST:'#e063b8',ISET:'#e0a800'};
const netColor=(n:string)=>isNC(n)?'#cdbf95':NET_COLORS[n]??'#8a8fa3';
const MASK='#4c9f76',GOLD='#e9c46a',JIG='#aeb4e8',TIERS=['Doesn\'t work','Works','Works reliably','Elegant to manufacture'];
type Tool='move'|'pen'|'via'|'erase';
const TOOL_KEYS:Record<string,[string,unknown?]>={KeyM:['tool','move'],KeyT:['tool','pen'],KeyV:['tool','via'],KeyX:['tool','erase'],KeyR:['rotate'],KeyL:['layer'],KeyC:['check'],Enter:['ship'],KeyZ:['undo'],Backspace:['undo']};

/** Rounded label plate texture; the type shrinks until the words fit. */
function label(text:string,bg='#fffaf0',fg=INK,w=256,h=96,sub?:string){
  return canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(24,h*.28));c.fill();c.lineWidth=6;c.strokeStyle=INK;c.stroke();
    const font=(n:number,wt=700)=>`${wt} ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
    let size=Math.round(h*(sub?.4:.5));c.font=font(size);while(size>10&&c.measureText(text).width>w-(sub?60:28)){size--;c.font=font(size);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,sub?w/2-14:w/2,h/2+2);
    if(sub){c.font=font(Math.round(h*.24),600);const kw=Math.max(34,c.measureText(sub).width+14);c.fillStyle='rgba(43,45,66,.12)';c.beginPath();c.roundRect(w-kw-12,h-44,kw,32,9);c.fill();c.fillStyle=fg;c.fillText(sub,w-12-kw/2,h-27);}});
}
const flatMat=(map:T.Texture,opacity=1)=>{const m=new T.MeshBasicMaterial({map,transparent:true,opacity});m.userData.outlineParameters={visible:false};return m;};
/** A flat plate lying on a surface (readable from the elevated bench camera). */
function plate(parent:T.Object3D,map:T.Texture,w:number,h:number,x:number,y:number,z:number){
  const m=part(parent,new T.PlaneGeometry(w,h),flatMat(map),x,y,z,false);m.rotation.x=-Math.PI/2;m.userData.noAO=true;return m;
}
const ownToon=(c:string,opacity=1)=>{const m=toon(c).clone();if(opacity<1){m.transparent=true;m.opacity=opacity;m.depthWrite=false;}return m;};
const mats=new Map<string,T.Material>();
const mat=(c:string,opacity=1,outline=true)=>{const k=`${c}|${opacity}|${outline}`;let m=mats.get(k);if(!m){m=ownToon(c,opacity);if(!outline)m.userData.outlineParameters={visible:false};mats.set(k,m);}return m;};
const shade=(c:string,k:number)=>'#'+new T.Color(c).lerp(new T.Color(INK),k).getHexString();

interface Clickable {obj:T.Object3D;act:string;arg?:unknown}
interface Stroke {layer:Layer;net:string;cells:XY[];warned:boolean}
export class QfnBench implements Station {
  readonly view={distance:5.25,pitch:1.02,lookY:-.12};
  readonly limits={time:720,damage:1,cost:0};
  readonly stand={x:0,z:-.5};readonly table=new T.Vector3(0,.92,-2.2);readonly facing=Math.PI;
  readonly job:StationJob;
  boardIx=0;design:Design;tool:Tool='move';layer:Layer=1;selected?:string;partsReady=false;active=false;
  shipped:{board:string;tier:number;cost:number}[]=[];mistakes=0;spent=0;checks=0;live:Report;
  private history:Design[]=[];private root=new T.Group();private boardRoot=new T.Group();private partsRoot=new T.Group();private copper=new T.Group();private rats=new T.Group();
  private preview=new T.Group();private marks=new T.Group();private hover!:T.Mesh;private selFrame=new T.Group();private partGroups=new Map<string,T.Group>();private qfnBody?:T.Mesh;
  private clickables:Clickable[]=[];private hovered?:Clickable;private toolPucks=new Map<string,T.Object3D>();private layerPlate!:T.Mesh;private viaPlate!:T.Mesh;private boardPlate!:T.Mesh;
  private stroke?:Stroke;private drag?:{id:string;grab:XY;to:XY;moved:boolean};private erasing=false;private hoverCell?:XY;
  private drops:{g:T.Group;t:number}[]=[];private markUntil=0;private outbox:T.Group[]=[];
  private panel?:HTMLElement;private toast?:HTMLElement;private toastUntil=0;private shown='';private crate?:Game['props'][number];private ready=false;
  constructor(private game:Game){
    this.design=blank(this.board());this.live=check(this.board(),this.design);
    this.limits.cost=Math.ceil(BOARDS.reduce((n,b)=>n+b.par,0)*1.25);
    this.job={goal:'Lay out three boards at the QFN bench',
      steps:[
        {text:'Bring the parts crate from the stock shelf to the bench',done:()=>this.partsReady,at:()=>this.crate?.body.translation()??this.stand},
        {text:'Sit at the layout bench (E)',done:()=>this.active||this.shipped.length>0,at:()=>this.stand},
        ...BOARDS.map((b,i)=>({text:`Board ${i+1} · ${b.title}: ${['one layer, no crossings','two caps hug their pins','layer 2, vias, thermal pad'][i]}`,done:()=>this.shipped.length>i,at:()=>this.stand}))],
      bonuses:[
        {text:'Every board works reliably',ok:()=>this.shipped.length>0&&this.shipped.every(s=>s.tier>=2)},
        {text:'Elegant: every route at or under par',ok:()=>this.shipped.length>0&&this.shipped.every(s=>s.tier===3)},
        {text:'No board sent back',ok:()=>this.mistakes===0}]};
    game.root.add(this.root);this.buildBench();this.loadBoard();
  }
  board():Board{return BOARDS[Math.min(this.boardIx,BOARDS.length-1)];}
  dress(kit:RoomKit){return dressFabBay(this.game,kit,this.table);}

  // ---------- the bench ----------
  private buildBench(){
    const g=this.game,t=this.table,r=g.decorRoot;
    // Pale wood worktop on a periwinkle cabinet; a lavender cutting mat under the board jig.
    part(r,rbox(3.9,.84,2.3,.06),toon('#9aa3dc'),t.x,.42,t.z);part(r,box(4.05,.08,2.45),toon('#ecd3a6'),t.x,t.y-.04,t.z);part(r,box(4.07,.03,2.47),toon('#c79a62'),t.x,t.y-.095,t.z);
    for(const s of [-1,1])part(r,rbox(.9,.5,.04,.03),toon('#b9bfeb'),t.x+s*1.2,.48,t.z+1.16);
    part(r,box(3.3,.012,2.26),toon('#d9d4f2'),t.x,t.y+.006,t.z);
    this.solid(4,1.1,2.4,t.x,.5,t.z);
    // Side table: the parts crate lands here, and shipped boards stack beside it.
    part(r,rbox(1,.84,.9,.05),toon('#9aa3dc'),t.x+2.55,.42,t.z);part(r,box(1.08,.07,.98),toon('#ecd3a6'),t.x+2.55,t.y-.035,t.z);this.solid(1,1,.9,t.x+2.55,.5,t.z);
    const top=group(this.root,t.x,t.y,t.z);
    top.add(this.boardRoot);this.boardRoot.position.set(0,TOP,-.3);
    this.boardRoot.add(this.partsRoot,this.copper,this.rats,this.preview,this.marks,this.selFrame);
    this.hover=part(this.boardRoot,new T.PlaneGeometry(S*.94,S*.94),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.35,depthWrite:false}),0,.03,0,false);
    this.hover.rotation.x=-Math.PI/2;(this.hover.material as T.Material).userData.outlineParameters={visible:false};this.hover.visible=false;this.hover.renderOrder=3;
    // Tools: two columns of chunky buttons either side of the board's near half.
    const tools:[string,string,string,unknown,string,number,number][]=[
      ['MOVE','M','tool','move','#bfe3f5',-1,0],['TURN','R','rotate',undefined,'#d9d4f2',-1,1],['PEN','T','tool','pen','#ffd9a8',-1,2],['ERASE','X','tool','erase','#f5c4c4',-1,3],
      ['LAYER','L','layer',undefined,'#c8f0dc',1,0],['VIA','V','tool','via','#ffe9a8',1,1],['CHECK','C','check',undefined,'#d6f5d0',1,2],['SHIP','⏎','ship',undefined,'#ffc629',1,3]];
    for(const [name,k,act,arg,color,side,row] of tools){
      const b=group(top,side*1.58,0,.3+row*.24);part(b,rbox(.4,.07,.21,.035),toon(color),0,.035,0);part(b,box(.42,.02,.23),toon(INK),0,.004,0);
      const p=plate(b,label(name,color,INK,256,128,k),.37,.185,0,.072,0);
      if(act==='layer')this.layerPlate=p;if(arg==='via')this.viaPlate=p;
      this.click(b,act,arg);this.toolPucks.set(act==='tool'?String(arg):act,b);}
    const undo=group(top,-1.08,0,1.0);part(undo,rbox(.26,.05,.14,.03),toon('#fffaf0'),0,.025,0);plate(undo,label('UNDO','#fffaf0',INK,256,128,'Z'),.25,.125,0,.052,0);this.click(undo,'undo');
    // Title and ratsnest legend ride on the jig's far margin.
    const far=-(9*S)/2-.066;this.boardPlate=plate(this.boardRoot,label('BOARD 1','#fffaf0'),.84,.112,-.2,-.033,far);this.boardPlate.userData.keep=true;
    plate(this.boardRoot,label('- - -  still to route','#d9d4f2',INK,384,72),.46,.086,.68,-.033,far).userData.keep=true;
  }
  private solid(w:number,h:number,d:number,x:number,y:number,z:number){const b=this.game.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.game.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2),b);}
  private click(obj:T.Object3D,act:string,arg?:unknown){this.clickables.push({obj,act,arg});obj.userData.baseY=obj.position.y;}
  /** Board-local position of a cell centre. */
  private at(c:XY,y=0){const b=this.board();return new T.Vector3((c[0]-(b.w-1)/2)*S,y,(c[1]-(b.h-1)/2)*S);}

  /** (Re)builds the board slab and every part for the current board. */
  private loadBoard(){
    const b=this.board();
    for(const c of [...this.boardRoot.children])if(![this.partsRoot,this.copper,this.rats,this.preview,this.marks,this.selFrame,this.hover].includes(c as never)&&!c.userData.keep)this.boardRoot.remove(c);
    this.partsRoot.clear();this.partGroups.clear();this.qfnBody=undefined;
    const w=b.w*S,h=b.h*S;
    part(this.boardRoot,rbox(w+.26,.05,h+.26,.03),toon(JIG),0,-.06,0);
    part(this.boardRoot,box(w,.028,h),toon(MASK),0,-.014,0);
    const grid=canvasTex(b.w*48,b.h*48,(c,cw,ch)=>{c.fillStyle=MASK;c.fillRect(0,0,cw,ch);c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=2;
      for(let x=0;x<=b.w;x++){c.beginPath();c.moveTo(x*48,0);c.lineTo(x*48,ch);c.stroke();}for(let y=0;y<=b.h;y++){c.beginPath();c.moveTo(0,y*48);c.lineTo(cw,y*48);c.stroke();}
      c.fillStyle='rgba(255,255,255,.22)';for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++){c.beginPath();c.arc(x*48+24,y*48+24,2.2,0,7);c.fill();}
      c.strokeStyle='rgba(255,250,235,.8)';c.lineWidth=5;c.strokeRect(2.5,2.5,cw-5,ch-5);});
    grid.minFilter=T.LinearMipmapLinearFilter;
    const face=part(this.boardRoot,new T.PlaneGeometry(w,h),toon('#ffffff',{map:grid}),0,.0005,0,false);face.rotation.x=-Math.PI/2;face.userData.noAO=true;(face.material as T.Material).userData.outlineParameters={visible:false};
    for(const p of b.parts)this.buildPart(p);
    (this.boardPlate.material as T.MeshBasicMaterial).map=label(`BOARD ${this.boardIx+1} · ${b.title.toUpperCase()}`,'#fffaf0',INK,512,68);
    this.layer=1;this.tool='move';this.selected=undefined;this.history=[];
    this.syncParts(true);this.redraw();
  }
  private padTex=new Map<string,T.Texture>();
  private buildPart(p:PartDef){
    const b=this.board(),g=new T.Group(),tags:{m:T.Mesh;z:number}[]=[];this.partsRoot.add(g);this.partGroups.set(p.id,g);g.userData.part=p.id;
    for(const pin of p.pins){const net=netOfPin(b,`${p.id}.${pin.id}`),col=netColor(net);
      if(pin.id==='EP'){const m=part(g,box(3*S-.035,.012,3*S-.035),mat(isNC(net)?'#d8cba2':col),0,.006,0);m.userData.pad=true;continue;}
      for(const c of pin.cells){
        if(p.through){part(g,cyl(.058,.058,.014,20),mat(col),c[0]*S,.007,c[1]*S);part(g,cyl(.022,.022,.016,12),mat(INK,1,false),c[0]*S,.008,c[1]*S);}
        else part(g,box(.112,.014,.112),mat(col),c[0]*S,.007,c[1]*S);}}
    if(p.kind==='qfn'){
      // Body over the exposed pad, with the pin-1 dot and each used pin's name printed beside it.
      const tex=canvasTex(512,512,c=>{c.fillStyle='#34364d';c.beginPath();c.roundRect(0,0,512,512,40);c.fill();c.fillStyle='rgba(255,255,255,.08)';c.fillRect(24,24,464,464);
        c.fillStyle='#fffaf0';c.beginPath();c.arc(70,70,22,0,7);c.fill();c.textAlign='center';c.textBaseline='middle';c.font='700 92px "Fredoka Variable", system-ui, sans-serif';c.fillText(p.id,256,232);
        c.font='600 46px "Fredoka Variable", system-ui, sans-serif';c.fillStyle='#d9d4f2';c.fillText(p.value,256,318);
        const ep=p.pins.find(q=>q.id==='EP')!;c.font='600 34px "Fredoka Variable", system-ui, sans-serif';c.fillStyle='#b9bfeb';c.fillText(ep.label==='NC'?'EP: not connected':`EP: ${ep.label}`,256,388);});
      const body=part(g,rbox(3*S+.02,.05,3*S+.02,.02),ownToon('#34364d'),0,.04,0);this.qfnBody=body;
      const top=part(g,new T.PlaneGeometry(3*S,3*S),flatMat(tex),0,.0655,0,false);top.rotation.x=-Math.PI/2;body.userData.top=top;
      for(const pin of p.pins){if(pin.id==='EP'||pin.label==='NC')continue;const [x,y]=pin.cells[0],dx=Math.sign(x)*(Math.abs(x)===2?1:0),dy=Math.sign(y)*(Math.abs(y)===2?1:0);
        // The name sits on the body edge next to its pin.
        const key=`pin:${pin.label}`;let t=this.padTex.get(key);if(!t){t=label(pin.label,netColor(netOfPin(b,`${p.id}.${pin.id}`)),'#fffaf0',160,72);this.padTex.set(key,t);}
        const tag=plate(g,t,.13,.058,(x-dx*.93)*S,.067,(y-dy*.93)*S);tag.renderOrder=2;}
    }else if(p.kind==='conn'){
      // Shroud on the mouth side (the cable plugs in there), pin names on its top.
      const n=p.pins.length,ys=p.pins.map(q=>q.cells[0][1]),mid=(Math.min(...ys)+Math.max(...ys))/2;
      const sh=group(g,-S*.5-.07,0,mid*S);part(sh,rbox(.15,.11,n*S+.04,.025),toon('#3a3d55'),0,.055,0);part(sh,box(.02,.06,n*S-.03),toon('#8a8fb8'),-.075,.06,0);
      p.pins.forEach(q=>{const t=label(q.label,netColor(netOfPin(b,`${p.id}.${q.id}`)),'#fffaf0',160,72);tags.push({m:plate(sh,t,.115,.052,.0,.112,(q.cells[0][1]-mid)*S),z:0});});
      // An end cap past pin 1 carries the part's name (striped when the enclosure fixes it).
      const cap=group(g,-S*.5-.07,0,(Math.min(...ys)-.5)*S-.07);part(cap,rbox(.15,.11,.14,.025),toon(p.locked?'#ffc629':'#3a3d55'),0,.055,0);
      tags.push({m:plate(cap,label(p.id,'#fffaf0',INK,160,80),.12,.06,0,.112,0),z:0});
      // Chevron pointing out of the mouth.
      const chev=part(sh,new T.ConeGeometry(.035,.06,3),hot('#ffe36e',1.2),-.12,.07,0,false);chev.rotation.z=Math.PI/2;
    }else{
      const col=p.kind==='cap'?'#d8b88c':'#34364d',body=group(g,S/2,0,0);
      part(body,rbox(.2,.06,.1,.022),toon(col),0,.045,0);for(const s of [-1,1])part(body,rbox(.04,.064,.104,.014),toon('#dfe3ea'),s*.085,.045,0);
      const tag=plate(body,label(p.id,col,p.kind==='cap'?INK:'#fffaf0',160,80),.12,.06,0,.077,0);tag.renderOrder=2;tags.push({m:tag,z:0});
    }
    g.userData.tags=tags;
  }
  /** Moves every part group to its placement (and hides parts until the crate arrives). */
  private syncParts(instant=false){
    const b=this.board();
    for(const p of b.parts){const g=this.partGroups.get(p.id)!,pl=this.design.place[p.id];
      const pos=this.at(pl.at);g.position.set(pos.x,g.position.y,pos.z);g.rotation.y=-pl.rot*Math.PI/2;
      g.visible=this.partsReady||p.kind==='qfn'||!!p.locked;
      // Flat tags counter-turn so they always read upright from the bench.
      for(const t of (g.userData.tags??[]) as {m:T.Mesh;z:number}[])t.m.rotation.z=t.z+pl.rot*Math.PI/2;
      if(instant)g.position.y=0;}
  }

  // ---------- drawing copper, ratsnest and marks ----------
  redraw(){
    const b=this.board(),d=this.design;this.live=check(b,d);
    this.copper.clear();this.rats.clear();
    const seg=(parent:T.Object3D,a:XY,z:XY,w:number,y:number,m:T.Material)=>{const pa=this.at(a),pz=this.at(z),len=pa.distanceTo(pz)+w;
      const mesh=part(parent,box(a[0]===z[0]?w:len,.008,a[0]===z[0]?len:w),m,(pa.x+pz.x)/2,y,(pa.z+pz.z)/2,false);return mesh;};
    // The layer being edited is drawn full strength; the other one fades toward the soldermask.
    for(const t of d.traces){const l1=t.layer===1,act=t.layer===this.layer||b.layers===1,base=l1?netColor(t.net):shade(netColor(t.net),.35);
      const col=act?base:'#'+new T.Color(base).lerp(new T.Color(MASK),l1?.6:.35).getHexString(),m=mat(col,1,act);for(let i=1;i<t.cells.length;i++)seg(this.copper,t.cells[i-1],t.cells[i],l1?.07:.052,l1?.006:.002,m);
      if(t.cells.length===1){const p=this.at(t.cells[0]);part(this.copper,box(.07,.008,.07),m,p.x,.006,p.z,false);}}
    for(const v of d.vias){const p=this.at(v.at);part(this.copper,cyl(.05,.05,.018,18),mat(netColor(v.net)),p.x,.012,p.z,false);part(this.copper,cyl(.02,.02,.02,12),mat('#1d1f30',1,false),p.x,.013,p.z,false);}
    // Ratsnest: thin dashes floating over the board.
    for(const r of ratsnest(b,d)){const a=this.at(r.a,.09),z=this.at(r.b,.09),len=a.distanceTo(z),n=Math.max(1,Math.floor(len/.05)),dir=z.clone().sub(a).normalize(),yaw=Math.atan2(-dir.z,dir.x);
      const m=mat(shade(netColor(r.net),-.0),1,false);
      for(let i=0;i<n;i++){const p=a.clone().addScaledVector(dir,(i+.5)*len/n);const dash=part(this.rats,box(.026,.008,.012),m,p.x,p.y,p.z,false);dash.rotation.y=yaw;}
      for(const e of [a,z]){const dot=part(this.rats,cyl(.016,.016,.01,10),m,e.x,e.y,e.z,false);dot.userData.noAO=true;}}
    // Selection frame around the selected part's footprint.
    this.selFrame.clear();
    if(this.selected){const p=partOf(b,this.selected),cells=footprint(p,d.place[p.id]),xs=cells.map(c=>c[0]),ys=cells.map(c=>c[1]);
      const x0=(Math.min(...xs)-.5-(b.w-1)/2)*S,x1=(Math.max(...xs)+.5-(b.w-1)/2)*S,z0=(Math.min(...ys)-.5-(b.h-1)/2)*S,z1=(Math.max(...ys)+.5-(b.h-1)/2)*S;
      const bad=this.drag&&placeProblem(b,d,this.drag.id,{at:this.drag.to,rot:d.place[this.drag.id].rot}),m=hot(bad?'#ff6b6b':'#ffe36e',1.3);
      if(this.drag){const dx=(this.drag.to[0]-d.place[this.drag.id].at[0])*S,dz=(this.drag.to[1]-d.place[this.drag.id].at[1])*S;this.selFrame.position.set(dx,0,dz);}else this.selFrame.position.set(0,0,0);
      for(const [w,h,x,z] of [[x1-x0,.016,(x0+x1)/2,z0],[x1-x0,.016,(x0+x1)/2,z1],[.016,z1-z0,x0,(z0+z1)/2],[.016,z1-z0,x1,(z0+z1)/2]])part(this.selFrame,box(w+.016,.012,h),m,x,.02,z,false);}
    // Tool and layer states.
    for(const [k,o] of this.toolPucks){const on=k===this.tool||(k==='layer'&&this.layer===2);o.position.y=(o.userData.baseY as number)+(on?.03:0);}
    const L=b.layers===1?'L1 only':`L${this.layer}`;(this.layerPlate.material as T.MeshBasicMaterial).map=this.tex(`layer:${L}`,()=>label(`LAYER ${L}`,this.layer===2?'#8fd6b4':'#c8f0dc',INK,256,128,'L'));
    (this.viaPlate.material as T.MeshBasicMaterial).map=this.tex(`via:${b.layers}`,()=>label('VIA',b.layers===2?'#ffe9a8':'#e3e0d6',b.layers===2?INK:'#8a8a9a',256,128,'V'));
    if(this.qfnBody){const see=b.layers===2&&(this.tool==='via'||this.layer===2),m=this.qfnBody.material as T.MeshToonMaterial,top=this.qfnBody.userData.top as T.Mesh;
      m.transparent=true;m.opacity=see?.28:1;m.depthWrite=!see;(top.material as T.MeshBasicMaterial).opacity=see?.3:1;}
    this.drawPreview();this.shown='';
  }
  private texCache=new Map<string,T.Texture>();
  private tex(k:string,make:()=>T.Texture){let t=this.texCache.get(k);if(!t){t=make();this.texCache.set(k,t);}return t;}
  private drawPreview(){
    this.preview.clear();const s=this.stroke;if(!s)return;const m=hot(s.layer===1?netColor(s.net):shade(netColor(s.net),.2),1.25);
    for(let i=1;i<s.cells.length;i++){const a=this.at(s.cells[i-1]),z=this.at(s.cells[i]),len=a.distanceTo(z)+.07,v=s.cells[i-1][0]===s.cells[i][0];part(this.preview,box(v?.07:len,.01,v?len:.07),m,(a.x+z.x)/2,.016,(a.z+z.z)/2,false);}
    const e=this.at(s.cells[s.cells.length-1]);part(this.preview,cyl(.04,.04,.02,14),hot('#fffaf0',1.3),e.x,.02,e.z,false);
  }
  /** After CHECK: rings pulse on the pads of nets that are not joined yet. */
  private showMarks(r:Report){
    this.marks.clear();const b=this.board();
    for(const n of r.nets.filter(n=>!n.done))for(const ref of b.nets[n.net]){const [pid,pin]=ref.split('.'),p=partOf(b,pid);
      for(const c of pinCells(p,this.design.place[pid]).find(x=>x.pin.id===pin)!.cells.slice(0,1)){const q=this.at(c);const ring=part(this.marks,new T.TorusGeometry(.085,.012,8,24),hot('#ff6b6b',1.4),q.x,.05,q.z,false);ring.rotation.x=Math.PI/2;}}
    this.markUntil=this.game.time+4;
  }

  // ---------- actions ----------
  private commit(){this.history.push(structuredClone(this.design));if(this.history.length>60)this.history.shift();}
  act(name:string,arg?:unknown):boolean{const ok=this.run(name,arg);this.updatePanel();return ok;}
  private run(name:string,arg?:unknown):boolean{
    const b=this.board(),d=this.design,a=this.game.audio;
    if(this.complete())return false;
    if(!this.partsReady){this.say('No parts yet: bring the parts crate from the stock shelf to the bench.');a.voice('hm',1.4);return false;}
    switch(name){
      case 'tool':{const t=arg as Tool;if(!['move','pen','via','erase'].includes(t))return false;
        if(t==='via'&&b.layers<2){this.say('Vias need a second copper layer. It unlocks on board 3.');a.tone(180,.12,.05,'square');return false;}
        this.tool=t;a.tone(560,.05,.03,'triangle');break;}
      case 'select':{const id=arg as string;if(!b.parts.some(p=>p.id===id))return false;this.selected=id;a.pop();break;}
      case 'move':{const {part:id,at,rot}=arg as {part:string;at:XY;rot?:Rot};const p=b.parts.find(q=>q.id===id);if(!p)return false;const cur=d.place[id],to:Place={at:[at[0],at[1]],rot:rot??cur.rot};
        if(same(cur.at,to.at)&&cur.rot===to.rot)return false;const why=placeProblem(b,d,id,to);if(why){this.say(why,'bad');a.tone(170,.14,.05,'square');return false;}
        this.commit();d.place[id]=to;this.selected=id;a.tone(420,.05,.04,'triangle');a.noise(.04,.03,1800,'bandpass');break;}
      case 'rotate':{const id=(arg as string|undefined)??this.selected;if(!id){this.say('Select a part first (MOVE tool, click it), then TURN.');return false;}
        const p=partOf(b,id);if(p.kind==='qfn'||p.locked){this.say(`${id} is fixed${p.kind==='qfn'?': the QFN is the anchor everything else fits around':' by the enclosure'}.`);return false;}
        const cur=d.place[id],to:Place={at:cur.at,rot:((cur.rot+1)%4) as Rot},why=placeProblem(b,d,id,to);if(why){this.say(`Can't turn it here: ${why}`,'bad');a.tone(170,.14,.05,'square');return false;}
        this.commit();d.place[id]=to;this.selected=id;a.tone(620,.06,.04,'triangle');break;}
      case 'layer':{const want=(arg as Layer|undefined)??(this.layer===1?2:1);
        if(want===2&&b.layers<2){this.say('This board has one copper layer. Layer 2 and vias unlock on board 3.');a.tone(180,.12,.05,'square');return false;}
        if(want===this.layer)return false;this.layer=want;a.tone(want===2?380:520,.07,.04,'triangle');break;}
      case 'trace':{const {cells,layer}=arg as {cells:XY[];layer?:Layer};const l=layer??this.layer;const s=strokeNet(b,d,l,cells[0]);
        if(s.why){this.say(s.why,'bad');return false;}const t={layer:l,net:s.net!,cells:cells.map(c=>[c[0],c[1]] as XY)};const why=traceProblem(b,d,t);
        if(why){this.say(why,'bad');a.tone(170,.14,.05,'square');return false;}
        const was=this.live.nets.find(n=>n.net===t.net)?.done;this.commit();d.traces.push(t);a.tone(700,.06,.03,'triangle');
        if(!was&&check(b,d).nets.find(n=>n.net===t.net)?.done){a.bell(1047,.35,.04);this.say(`${t.net} is joined: every ${t.net} pad is on one piece of copper.`,'ok');}
        break;}
      case 'via':{const c=arg as XY,v=viaProblem(b,d,c);if(v.why){this.say(v.why,'bad');a.tone(170,.14,.05,'square');return false;}
        this.commit();d.vias.push({at:[c[0],c[1]],net:v.net!});a.noise(.12,.05,2400,'bandpass');a.tone(900,.05,.03);break;}
      case 'erase':{const c=arg as XY,before=structuredClone(d);if(!erase(d,this.layer,c)){return false;}this.history.push(before);a.noise(.05,.04,3000,'highpass');break;}
      case 'undo':{const prev=this.history.pop();if(!prev){this.say('Nothing to undo on this board.');return false;}this.design=prev;this.syncParts();a.tone(300,.06,.04,'triangle');break;}
      case 'check':{const r=check(b,d);this.checks++;this.showMarks(r);
        this.say(r.tier===0?`Check: ${r.problems.slice(0,2).join(' ')}`:`${TIERS[r.tier]}. ${r.tier===3?'Reliable, and at or under par.':r.notes[0]??''}`,r.tier===0?'bad':'ok');
        if(r.tier>0)a.bell(1175,.4,.04);else a.tone(160,.25,.06,'square');this.redraw();return true;}
      case 'ship':{const r=check(b,d);this.spent+=r.cost;
        if(r.tier===0){this.mistakes++;this.showMarks(r);this.say(`Sent back from test: ${r.problems[0]}`,'bad');a.voice('groan',1);this.game.alarm({x:this.table.x,z:this.table.z},3);this.redraw();return true;}
        this.shipped.push({board:b.id,tier:r.tier,cost:r.cost});
        this.say(`Shipped · ${TIERS[r.tier]}. ${b.teach}`,'ok');a.cheer();
        this.game.burst(this.table.clone().add(new T.Vector3(2.55,.5,0)),'#ffcf52',24,'confetti');this.stackShipped();
        this.boardIx++;if(this.boardIx<BOARDS.length){this.design=blank(this.board());this.loadBoard();this.dropIn();}else{this.stroke=undefined;this.redraw();}
        return true;}
      default:return false;
    }
    this.syncParts();this.redraw();return true;
  }
  /** Finished boards stack up on the side table. */
  private stackShipped(){const t=this.table,n=this.outbox.length,g=group(this.game.root,t.x+2.55,t.y+.02+n*.035,t.z+.2);
    part(g,box(.5,.03,.36),toon(MASK));part(g,box(.12,.035,.12),toon('#34364d'),0,.01,0);this.outbox.push(g);}
  private dropIn(){for(const p of this.board().parts)if(p.kind!=='qfn'&&!p.locked){const g=this.partGroups.get(p.id)!;g.position.y=.6+Math.random()*.3;this.drops.push({g,t:0});}}

  // ---------- pointer and keys ----------
  private cellFromRay(ray:T.Raycaster):XY|undefined{
    const y=this.boardRoot.getWorldPosition(new T.Vector3()).y,hit=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-y),new T.Vector3());if(!hit)return undefined;
    const local=this.boardRoot.worldToLocal(hit.clone()),b=this.board(),c:XY=[Math.round(local.x/S+(b.w-1)/2),Math.round(local.z/S+(b.h-1)/2)];
    return c[0]>=0&&c[1]>=0&&c[0]<b.w&&c[1]<b.h?c:undefined;
  }
  private partAt(c:XY){const b=this.board();return b.parts.find(p=>p.kind!=='qfn'&&footprint(p,this.design.place[p.id]).some(x=>same(x,c)))??b.parts.find(p=>footprint(p,this.design.place[p.id]).some(x=>same(x,c)));}
  pointer(e:Pointer){
    const hits=e.ray.intersectObjects(this.clickables.map(c=>c.obj),true);let found:Clickable|undefined;
    for(const h of hits){let o:T.Object3D|null=h.object;while(o&&!found){found=this.clickables.find(c=>c.obj===o);o=o.parent;}if(found)break;}
    if(this.hovered!==found){if(this.hovered)this.hovered.obj.scale.setScalar(1);if(found)found.obj.scale.setScalar(1.08);this.hovered=found;}
    const cell=found?undefined:this.cellFromRay(e.ray);
    const hoverPart=cell&&this.partsReady&&this.tool==='move'?this.partAt(cell):undefined;
    document.body.style.cursor=!this.active?'':found||hoverPart?'pointer':cell&&this.tool!=='move'?'crosshair':'';
    this.hoverCell=cell;this.updateHover();
    if(e.kind==='down'){
      if(found){this.act(found.act,found.arg);return;}
      if(!cell||!this.partsReady){if(!this.partsReady&&cell)this.act('select','U1');return;}
      if(this.tool==='move'){const p=this.partAt(cell);if(!p){this.selected=undefined;this.redraw();return;}
        this.act('select',p.id);if(!p.locked&&p.kind!=='qfn'){const at=this.design.place[p.id].at;this.drag={id:p.id,grab:[cell[0]-at[0],cell[1]-at[1]],to:at,moved:false};}}
      else if(this.tool==='pen'){const s=strokeNet(this.board(),this.design,this.layer,cell);if(s.why){this.say(s.why,'bad');return;}this.stroke={layer:this.layer,net:s.net!,cells:[cell],warned:false};this.drawPreview();}
      else if(this.tool==='via')this.act('via',cell);
      else if(this.tool==='erase'){this.erasing=true;this.act('erase',cell);}
      return;}
    if(e.kind==='move'){
      if(this.drag&&cell){const to:XY=[cell[0]-this.drag.grab[0],cell[1]-this.drag.grab[1]];if(!same(to,this.drag.to)){this.drag.to=to;this.drag.moved=true;this.ghost();}}
      if(this.stroke&&cell)this.extend(cell);
      if(this.erasing&&cell)this.act('erase',cell);
      return;}
    // up
    if(this.drag){const d=this.drag;this.drag=undefined;if(d.moved&&!same(d.to,this.design.place[d.id].at))this.act('move',{part:d.id,at:d.to});this.syncParts();this.redraw();}
    if(this.stroke){const s=this.stroke;this.stroke=undefined;if(s.cells.length>1)this.act('trace',{cells:s.cells,layer:s.layer});else this.drawPreview();}
    this.erasing=false;
  }
  /** While dragging: the part follows the pointer; the frame turns red where it can't go. */
  private ghost(){const d=this.drag!,g=this.partGroups.get(d.id)!,p=this.at(d.to);g.position.set(p.x,.05,p.z);this.redraw();}
  /** Pen: walks the stroke cell by cell toward the pointer; backing up over the last cell undoes it. */
  private extend(target:XY){
    const s=this.stroke!,b=this.board();let guard=40;
    while(guard-->0){const last=s.cells[s.cells.length-1];if(same(last,target))break;
      const dx=target[0]-last[0],dy=target[1]-last[1],next:XY=Math.abs(dx)>=Math.abs(dy)?[last[0]+Math.sign(dx),last[1]]:[last[0],last[1]+Math.sign(dy)];
      const prev=s.cells[s.cells.length-2];if(prev&&same(prev,next)){s.cells.pop();continue;}
      if(s.cells.some(c=>same(c,next)))break;
      const why=stepProblem(b,this.design,s.layer,s.net,next);if(why){if(!s.warned){s.warned=true;this.say(why,'bad');this.game.audio.tone(170,.1,.04,'square');}break;}
      s.cells.push(next);this.game.audio.tone(640+s.cells.length*12,.03,.015,'triangle');
      // Reaching a pad of the same net chimes (the stroke may carry on through it).
      if(netOfCell(b,this.design,s.layer,next)===s.net)this.game.audio.bell(1319,.2,.03);}
    this.drawPreview();
  }
  private updateHover(){const c=this.hoverCell;this.hover.visible=!!c&&this.active&&this.partsReady&&this.tool!=='move';
    if(c){const p=this.at(c,.03);this.hover.position.copy(p);(this.hover.material as T.MeshBasicMaterial).color.set(this.tool==='erase'?'#ff8a8a':this.tool==='via'?'#ffe36e':'#ffffff');}}
  key(code:string){const m=TOOL_KEYS[code];if(!m)return false;this.act(m[0],m[1]);return true;}
  setActive(active:boolean){this.active=active;if(!active){document.body.style.cursor='';this.stroke=undefined;this.drag=undefined;this.erasing=false;this.hover.visible=false;this.syncParts();this.redraw();}this.shown='';}
  dropped(p:Game['props'][number]){
    if(p.spec.id!=='parts'||this.partsReady)return;const q=p.body.translation(),sx=this.table.x+2.55,sz=this.table.z;
    if(Math.hypot(q.x-sx,q.z-sz)<2.2||Math.hypot(q.x-this.stand.x,q.z-this.stand.z)<2.2){
      this.partsReady=true;p.body.setTranslation({x:sx,y:this.table.y+.32,z:sz-.18},true);p.body.setRotation(new T.Quaternion(),true);p.body.setBodyType(RAPIER.RigidBodyType.Fixed,true);
      this.game.audio.plug();this.game.burst({x:sx,y:this.table.y+.4,z:sz},'#c7b8ff',1,'ring');this.syncParts();this.dropIn();this.redraw();}
  }
  update(dt:number){
    if(!this.ready){this.ready=true;this.crate=this.game.props.find(p=>p.spec.id==='parts');}
    for(const d of this.drops){d.t+=dt;const k=Math.min(1,d.t/.45);d.g.position.y=Math.max(0,(1-k*k)*.7)+(k>=1?0:Math.abs(Math.sin(k*9))*.03*(1-k));}
    if(this.drops.length&&this.drops.every(d=>d.t>=.45)){this.drops=[];this.game.audio.clatter();}
    if(this.marks.children.length){const k=1+Math.sin(this.game.last*.012)*.15;this.marks.children.forEach(m=>m.scale.setScalar(k));if(this.game.time>this.markUntil)this.marks.clear();}
    this.preview.children.forEach(m=>{(m as T.Mesh).position.y=.016+Math.sin(this.game.last*.01)*.002;});
    this.updatePanel();
  }

  // ---------- panel ----------
  private say(text:string,tone:'ok'|'bad'|'info'='info'){
    if(!this.toast){this.toast=document.createElement('div');this.toast.className='station-toast';this.layerEl()?.append(this.toast);}
    this.toast.textContent=text;this.toast.dataset.tone=tone;this.toast.hidden=false;this.toastUntil=this.game.time+Math.max(4,text.length*.06);
  }
  private layerEl(){return document.querySelector<HTMLElement>('[data-layer="hud"]');}
  private updatePanel(){
    if(this.toast&&!this.toast.hidden&&this.game.time>this.toastUntil&&this.game.running)this.toast.hidden=true;
    const b=this.board(),r=this.live,done=this.complete();
    const key=JSON.stringify([this.active,this.boardIx,this.tool,this.layer,this.partsReady,r.tier,r.cost,r.nets,r.loops.map(l=>l.loop),r.thermal,r.problems.length,done]);if(key===this.shown)return;this.shown=key;
    if(!this.panel){this.panel=document.createElement('section');this.panel.className='station-panel panel qfn-panel';this.layerEl()?.append(this.panel);}
    this.panel.hidden=done;if(done)return;
    const row=(k:string,v:string,ok?:boolean)=>`<li class="${ok===undefined?'':ok?'ok':'no'}"><span>${k}</span><b>${v}</b></li>`;
    const nets=r.nets.map(n=>`<li class="${n.done?'ok':''}"><i style="--c:${netColor(n.net)}"></i><span>${n.net}</span><b>${n.done?'joined':`${n.joined}/${n.pads} pads`}</b></li>`).join('');
    const loops=r.loops.map(l=>row(`Bypass ${l.cap??'cap'}`,l.loop===Infinity?'not wired':`loop ${l.loop} · want ≤ ${l.max}`,l.loop<=l.max)).join('');
    const orient=r.problems.find(p=>/mouth/.test(p));
    this.panel.innerHTML=`<header><small>BOARD ${this.boardIx+1}/${BOARDS.length} · ${b.layers===1?'ONE LAYER':'TWO LAYERS'}</small><h4>${b.title}</h4><p>${b.ask}</p></header>`+
      (this.active&&this.partsReady?`<ul class="nets">${nets}</ul><ul class="build">${orient?row('Connector','edge, mouth out',false):''}${loops}${r.thermal?row('Thermal vias',`${r.thermal.vias} / ${r.thermal.need}`,r.thermal.vias>=r.thermal.need):''}`+
        `${row('Track + vias',`${r.cost} · par ${r.par}`,r.tier===3)}${row('Grade now',TIERS[r.tier],r.tier>0)}</ul>`+
        `<p class="profile">Teaching grid: cell sizes and loop limits are this bench's rules. A real layout still needs the fab's DRC and an electrical review.</p>`:'');
  }
  prompt(atBench:boolean):Prompt|null{
    if(this.complete())return null;
    if(!atBench){const p=this.game.player.translation();
      if(this.game.held?.spec.id==='parts'&&Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<2.6)return {key:'E',text:'Set the parts crate on the bench'};
      if(Math.hypot(p.x-this.stand.x,p.z-this.stand.z)<1.6)return this.partsReady?{key:'E',text:'Sit at the layout bench'}:{key:'E',text:'Sit at the bench (the parts crate is still on the shelf)'};return null;}
    if(!this.partsReady)return {key:'E',text:'Step back and fetch the parts crate from the stock shelf'};
    const b=this.board(),r=this.live;
    if(r.problems.some(p=>/mouth/.test(p)))return {key:'M',text:'MOVE: drag the connector to a board edge, mouth out (R turns it)'};
    if(r.nets.some(n=>!n.done)){
      if(this.tool==='move')return {key:'T',text:'Parts placed? PEN: drag from a pad along a dashed line'};
      if(b.layers===2)return {key:'V',text:'Blocked? A VIA on your track, then LAYER (L) to cross under'};
      return {key:'Drag',text:'Drag from a pad to its match. One layer: tracks can\'t cross'};}
    if(r.tier===0)return {key:'C',text:'CHECK shows what the test would reject'};
    if(r.tier===1)return r.loops.some(l=>l.loop>l.max)?{key:'M',text:'Works. Move each bypass cap beside its VDD and GND pins'}:{key:'V',text:'Works. Add thermal vias inside the exposed pad'};
    return {key:'Enter',text:r.tier===3?'Elegant. SHIP it (Enter)':'Reliable. SHIP it, or shorten the route to reach par'};
  }
  complete(){return this.shipped.length>=BOARDS.length;}
  score(){return {mistakes:this.mistakes,cost:Math.round(this.spent)};}
  snapshot(){const r=this.live;return {board:this.boardIx,boardId:this.board().id,partsReady:this.partsReady,tool:this.tool,layer:this.layer,selected:this.selected,design:this.design,
    report:{tier:r.tier,problems:r.problems,notes:r.notes,cost:r.cost,par:r.par,nets:r.nets,loops:r.loops,thermal:r.thermal},shipped:this.shipped,mistakes:this.mistakes,spent:this.spent,checks:this.checks,
    hover:this.hoverCell,cells:this.active?this.cellScreens():undefined};}
  /** Page coordinates of every cell centre (browser tests drive the real pointer with these). */
  private cellScreens(){const b=this.board(),cam=this.game.view.camera,rect=this.game.view.renderer.domElement.getBoundingClientRect(),out:Record<string,[number,number]>={};
    cam.updateMatrixWorld();this.boardRoot.updateMatrixWorld(true);
    for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++){const v=this.boardRoot.localToWorld(this.at([x,y])).project(cam);out[`${x},${y}`]=[Math.round(rect.left+(v.x+1)/2*rect.width),Math.round(rect.top+(1-v.y)/2*rect.height)];}
    return out;}
}
function netOfCell(b:Board,d:Design,l:Layer,c:XY){
  for(const p of b.parts)for(const {pin,cells} of pinCells(p,d.place[p.id]))if((l===1||p.through)&&cells.some(x=>same(x,c)))return netOfPin(b,`${p.id}.${pin.id}`);
  return undefined;}
