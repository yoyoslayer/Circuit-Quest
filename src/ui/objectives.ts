// On-screen objectives: a job card with ordered steps that tick off as they are done, bonus
// goals to chase, and a contextual "[key] what to do" prompt for whatever is in reach.
// (The product owner asked for a little text so the goal is always clear.)
import * as T from 'three';
import type {Game} from '../game';
import {prefabs,type PropKind} from '../props/prefabs';

type At=(g:Game)=>{x:number;z:number}|undefined;
/** at: where the bouncing marker points for this step. */
interface Step {text:string;done:(g:Game)=>boolean;at?:At}
interface Bonus {text:string;ok:(g:Game)=>boolean}
interface Job {goal:string;steps:Step[];bonuses:Bonus[]}
const dist=(a:{x:number;z:number},b:{x:number;z:number})=>Math.hypot(a.x-b.x,a.z-b.z);
const prop=(g:Game,id:string)=>{const q=g.props.find(q=>q.spec.id===id);return q?.mesh.visible?q.body.translation():undefined;};

// Lunch Rush bookkeeping read from the circuit's event log.
const tripped=(g:Game)=>!!g.lunch?.circuit.events.some(e=>e.kind==='trip'||e.kind==='short');
const scorched=(g:Game)=>!!g.lunch?.circuit.events.some(e=>e.kind==='scorch')||!!g.lunch?.cables.some(c=>c.lead.dead);
const kitchenFed=(g:Game)=>!!g.lunch&&(g.lunch.powered('oven')||g.lunch.powered('kitchen-lamp'));

export const JOBS:Record<string,Job>={
  playground:{goal:'Light the lamp',
    steps:[
      {text:'Pick up the reel\'s plug',done:g=>g.holdingPlug||g.connected,at:g=>g.plugPosition},
      {text:'Drag the cable to the lamp\'s socket and plug it in',done:g=>g.connected,at:g=>g.holdingPlug?g.level.target:g.plugPosition},
      {text:'Switch the lamp on',done:g=>g.connected&&g.switchedOn,at:g=>g.level.switchAt}],
    bonuses:[
      {text:'Knock down all six pins',ok:g=>g.pinsDown()>=6},
      {text:'Finish in under 45 seconds',ok:g=>g.time<45},
      {text:'Break nothing',ok:g=>g.damage===0}]},
  meeting:{goal:'Get the projector running before the 10:00 meeting',
    steps:[
      {text:'Fetch the power strip by the printer and set it at the boardroom door',done:g=>g.stripPlaced(),at:g=>g.held?.spec.id==='strip'?g.level.target:prop(g,'strip')},
      {text:'Bring the server-room cable to the power strip and plug it in',done:g=>g.connected&&g.stripPlaced(),at:g=>g.holdingPlug?g.level.target:g.plugPosition},
      {text:'Switch the projector on in the boardroom',done:g=>g.won,at:g=>g.level.switchAt}],
    bonuses:[
      {text:'Finish before the meeting starts (4:00)',ok:g=>g.time<(g.level.deadline??240)},
      {text:'Break fewer than 5 things',ok:g=>g.damage<5},
      {text:'Leave the coffee machine alone',ok:g=>!g.coffeeReused}]},
  lunch:{goal:'Bake a tray of lunch and send it upstairs on the lift',
    steps:[
      {text:'Wedge the kitchen door open with the doorstop',done:g=>!!g.lunch?.doorWedged()||kitchenFed(g),at:g=>g.held?.spec.id==='wedge'?{x:0,z:1}:prop(g,'wedge')},
      {text:'Mop up the leak (or bridge it)',done:g=>(g.lunch?.water??1)<.1||kitchenFed(g),at:g=>g.held?.spec.id==='mop'?{x:.3,z:2}:prop(g,'mop')},
      {text:'Power the kitchen\'s feed post (oven and lamps)',done:g=>kitchenFed(g)||(g.lunch?.job.bake??0)>=20,at:()=>({x:-4,z:-3})},
      {text:'Keep the oven on until the tray is baked',done:g=>g.lunch?.job.tray!=='raw',at:()=>({x:-2.5,z:-7.2})},
      {text:'Carry the tray to the conveyor',done:g=>['conveyor','lift','delivered'].includes(g.lunch?.job.tray??''),at:g=>g.held?.spec.id==='tray'?{x:0,z:-7}:prop(g,'tray')},
      {text:'Get the conveyor moving',done:g=>!!g.lunch&&(g.lunch.powered('conveyor')||(g.lunch.job.transport??0)>0||['lift','delivered'].includes(g.lunch.job.tray)),at:()=>({x:5,z:-5})},
      // Goals, not methods: how to start the lift's heavy motor is for the player to find (a badge
      // over the capacitor cart appears only after its start-up kick has tripped a breaker).
      {text:'Start the lift winch without tripping a breaker',done:g=>!!g.lunch?.liftRan||!!g.lunch?.job.done,at:g=>g.lunch?.capHint&&!g.lunch.capDocked?prop(g,'capacitor'):{x:12,z:-4.8}},
      {text:'Send the tray up on the lift',done:g=>!!g.lunch?.job.done,at:g=>g.lunch?.circuit.loads.find(l=>l.id==='conveyor')?.state==='on'?{x:12,z:-4.8}:{x:5,z:-5}}],
    bonuses:[
      {text:'Never trip a breaker',ok:g=>!tripped(g)},
      {text:'No scorched or cut cables',ok:g=>!scorched(g)},
      {text:'Keep the fridge from spoiling (under 80%)',ok:g=>(g.lunch?.maxTemperature??0)<.8}]},
};

const NAMES:Partial<Record<PropKind,string>>={box:'crate',desk:'desk',chair:'chair',monitor:'monitor',mug:'mug',paper:'paper',plant:'plant',cabinet:'cabinet',sofa:'sofa',bin:'bin',
  reel:'cable reel',coupler:'coupler',cart:'cart',printer:'printer',whiteboard:'whiteboard',bookshelf:'shelf',cooler:'water cooler',bridge:'cable bridge',mop:'mop',tray:'lunch tray',
  lamp:'lamp',dolly:'cable dolly',capcart:'capacitor cart',coolbox:'cooler box',splitter:'splitter',wedge:'doorstop',cone:'cone',strip:'power strip',beanbag:'bean bag'};
/** Job items whose prop kind is generic get their own name in prompts. */
const ID_NAMES:Record<string,string>={parts:'parts crate',blocks:'resistor tray',robot:'robot',motor:'motor cart',pod:'detector pod'};
/** A station supplies its own steps and bonuses (src/stations); the marker defaults to its bench. */
function stationJob(g:Game):Job{const j=(g.station??g.hub)!.job,home=g.station?.stand;
  return {goal:j.goal,steps:j.steps.map(s=>({text:s.text,done:()=>s.done(),at:()=>s.at?.()??home})),bonuses:j.bonuses.map(b=>({text:b.text,ok:()=>b.ok()}))};}
export interface Prompt {key:string;text:string}
/** What the most useful key does right now, in words. */
export function promptFor(g:Game):Prompt|null{
  if(!g.running||g.won||g.paused)return null;
  const pos=g.player.translation();
  if(g.lunch){const p=g.lunch.promptAt();if(p)return p;}
  if(g.strip&&!g.held&&!g.holdingPlug){const p=g.strip.prompt(pos);if(p)return p;}
  // A station may return {key:'',text:''} to show no pill at all.
  if(g.station){const p=g.station.prompt(g.atBench);if(p||g.atBench)return p&&p.text?p:null;}
  if(g.hub&&!g.held){const p=g.hub.prompt();if(p)return p;}
  if(g.held){const name=NAMES[g.held.spec.kind]??'it';
    if(g.held.spec.id==='strip'&&dist(pos,g.level.target)<2.6)return {key:'E',text:'Set the power strip down by the door'};
    return {key:'E',text:`Put the ${name} down  ·  Q throws it`};}
  if(g.holdingPlug&&!g.lunch){
    const part=g.props.find(q=>q.mesh.visible&&((q.spec.id==='coupler'&&!g.coupler)||(q.spec.id==='extension'&&!g.extension))&&dist(pos,q.body.translation())<1.9);
    if(part)return {key:'F',text:part.spec.id==='coupler'||g.coupler?'Attach it to your cable':'Attach the coupler first'};
    if(Math.min(dist(pos,g.level.target)-.6,dist(g.plugPosition,g.level.target))<1.6)return {key:'F',text:g.stripPlaced()?'Plug in':'Plug in (the power strip is still missing)'};
    // Only offer the slingshot when letting go would actually fling something (the rope has stored energy).
    return g.rope.peak>1?{key:'Q',text:'Let go to slingshot the cable'}:{key:'F',text:'Drop the plug'};}
  if(!g.lunch&&g.nearSwitch(pos))return {key:'E',text:g.switchedOn?'Switch it off':g.connected?'Switch it on':'Switch on (needs power first)'};
  // In the Meeting the strip comes first: only offer the plug when Pip is right on it until the strip is placed.
  if(!g.lunch&&!g.station&&!g.hub&&!g.connected&&dist(pos,g.plugPosition)<(g.strip&&!g.stripPlaced()?.9:1.75))return {key:'F',text:'Pick up the plug'};
  // In station rooms the pill is for the job: clutter can still be grabbed, it just isn't advertised.
  const near=g.nearest();if(near&&g.station&&!near.spec.id)return null;if(near){if(near.spec.id==='coffee-reel'&&!g.coffeeReused)return {key:'E',text:'Borrow the coffee machine\'s cable'};
    return {key:'E',text:`Grab the ${ID_NAMES[near.spec.id??'']??NAMES[near.spec.kind]??'thing'}${prefabs[near.spec.kind].mass>=15?' (heavy: push it)':''}`};}
  return null;
}

/** The job card (top left, under the timer) and the prompt pill (above the action bar). */
export class ObjectivesHUD{
  card:HTMLElement;prompt:HTMLElement;stand:HTMLElement;marker:T.Mesh;edge:HTMLElement;private shown='';private promptShown='';private current:{key:string;text:string}|null=null;private job:Job;private flash=new Set<number>();
  constructor(private g:Game,layer:HTMLElement){
    this.job=g.station||g.hub?stationJob(g):JOBS[g.level.id]??JOBS.playground;
    this.card=document.createElement('section');this.card.className='objective panel';this.card.setAttribute('aria-live','polite');layer.append(this.card);
    this.prompt=document.createElement('div');this.prompt.className='prompt-pill';this.prompt.hidden=true;layer.append(this.prompt);
    // At a bench the walking controls hide; this chip says how to step back.
    this.stand=document.createElement('div');this.stand.className='bench-chip';this.stand.hidden=true;this.stand.innerHTML='<kbd>Esc</kbd><span>Stand up</span>';layer.append(this.stand);
    this.stand.addEventListener('pointerdown',e=>{e.stopPropagation();g.leaveBench();});
    // At a bench a tap on the prompt presses its key, so touch screens can sign off, ship or send.
    this.prompt.addEventListener('pointerdown',e=>{if(!g.atBench||!this.current)return;e.stopPropagation();const k=this.current.key;
      if(k==='Esc'){g.leaveBench();return;}
      const code=k==='Enter'||k==='Space'?k:/^[A-Z]$/.test(k)?`Key${k}`:/^\d$/.test(k)?`Digit${k}`:'';if(code)g.station?.key(code);});
    // The marker draws over walls and clutter (depthTest off), with an ink rim so it reads on pale lamps
    // and floors; it keeps a minimum on-screen size, and an arrow at the screen edge points to it when off screen.
    const m=new T.MeshBasicMaterial({color:'#ffd84a',depthTest:false,depthWrite:false});m.userData.outlineParameters={visible:false};
    const rim=new T.MeshBasicMaterial({color:'#262a40',side:T.BackSide,depthTest:false,depthWrite:false});rim.userData.outlineParameters={visible:false};
    const cone=new T.ConeGeometry(.22,.42,20).rotateX(Math.PI);this.marker=new T.Mesh(cone,m);this.marker.renderOrder=13;
    const shell=new T.Mesh(cone,rim);shell.scale.setScalar(1.16);shell.renderOrder=12;this.marker.add(shell);
    this.marker.userData.noAO=true;this.marker.visible=false;g.root.add(this.marker);
    this.edge=document.createElement('div');this.edge.className='marker-edge';this.edge.hidden=true;layer.append(this.edge);
  }
  /** Steps latch once done so the list only ever moves forward. */
  private done=new Set<number>();
  update(){
    // Steps latch in order: a later step that happens to be true early (sitting at the bench before
    // fetching the item) waits until the ones before it are done, so the card never skips ahead.
    const g=this.g;this.job.steps.forEach((s,i)=>{if(!this.done.has(i)&&this.job.steps.slice(0,i).every((_,k)=>this.done.has(k))&&s.done(g)){this.done.add(i);this.flash.add(i);g.audio.bell(1175,.35,.035);setTimeout(()=>{this.flash.delete(i);this.shown='';},900);}});
    const current=this.job.steps.findIndex((_,i)=>!this.done.has(i));
    const bonus=this.job.bonuses.map(b=>b.ok(g));
    const key=`${[...this.done].join()}|${current}|${bonus.join()}|${[...this.flash].join()}`;
    if(key!==this.shown){this.shown=key;
      // One line: progress dots, the current step, and three stars for the bonus goals (their wording
      // is on the pause and result screens). Steps that just finished flash a tick before moving on.
      const n=this.job.steps.length,cur=current<0?n-1:current,flashing=[...this.flash].pop();
      const dots=this.job.steps.map((_,i)=>`<b class="${this.done.has(i)?'done':i===current?'now':''}"></b>`).join('');
      const text=flashing!==undefined&&current!==flashing?this.job.steps[flashing].text:this.job.steps[cur].text;
      this.card.classList.toggle('flash',flashing!==undefined);
      this.card.innerHTML=`<div class="dots" aria-label="Step ${Math.min(n,this.done.size+1)} of ${n}">${dots}</div><p class="cur">${current<0?'Done!':text}</p>`+
        `<div class="stars" aria-label="Bonus goals">${bonus.map(ok=>`<i class="${ok?'ok':''}">★</i>`).join('')}</div>`;}
    // A bouncing arrow over whatever the current step needs.
    const at=current>=0&&g.running&&!g.won&&!g.atBench?this.job.steps[current].at?.(g):undefined;this.marker.visible=!!at;
    if(at){const cam=g.view.camera,y=(g.hub?3.7:2.1)+Math.sin(g.last*.006)*.18;this.marker.position.set(at.x,y,at.z);this.marker.rotation.y=g.last*.002;
      // At least ~28 px tall however far the camera is.
      this.marker.scale.setScalar(Math.max(1,cam.position.distanceTo(this.marker.position)/18));
      const n=this.marker.position.clone().project(cam),off=n.z>1||Math.abs(n.x)>.95||Math.abs(n.y)>.92;this.edge.hidden=!off;
      if(off){let x=n.x,yy=n.y;if(n.z>1){x=-x;yy=-yy;}const k=Math.max(Math.abs(x)/.9,Math.abs(yy)/.82,1);x/=k;yy/=k;
        this.edge.style.left=`${(x*.5+.5)*100}%`;this.edge.style.top=`${(.5-yy*.5)*100}%`;this.edge.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(-yy,x)}rad)`;}}
    else this.edge.hidden=true;
    this.stand.hidden=!g.atBench;
    const p=promptFor(g),pk=p?`${p.key}|${p.text}`:'';this.current=p;
    if(pk!==this.promptShown){this.promptShown=pk;this.prompt.hidden=!p;if(p)this.prompt.innerHTML=`${p.key?`<kbd>${p.key}</kbd>`:''}<span>${p.text}</span>`;this.prompt.classList.toggle('status',!!p&&!p.key);}
  }
  /** Bonus results for the grade card. */
  results(){return this.job.bonuses.map(b=>({text:b.text,ok:b.ok(this.g)}));}
}
