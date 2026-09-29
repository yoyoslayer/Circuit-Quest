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
const kitchenFed=(g:Game)=>!!g.lunch?.cables.some(c=>c.ports.includes('kitchen')&&c.lead.closed&&!c.lead.dead);

export const JOBS:Record<string,Job>={
  playground:{goal:'Light the lamp',
    steps:[
      {text:'Pick up the reel\'s plug',done:g=>g.holdingPlug||g.connected,at:g=>g.plugPosition},
      {text:'Drag the cable to the lamp\'s socket and plug it in',done:g=>g.connected,at:g=>g.holdingPlug?g.level.target:g.plugPosition},
      {text:'Switch the lamp on',done:g=>g.connected&&g.switchedOn,at:g=>g.level.switchAt}],
    bonuses:[
      {text:'Fling something with a taut cable (Q)',ok:g=>g.flung},
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
      {text:'Run the thick cable from cart B to the kitchen\'s power post',done:g=>kitchenFed(g)||(g.lunch?.job.bake??0)>=20,at:g=>g.lunch?.held?.cable.id==='thick'?{x:-4,z:-3}:prop(g,'thick-dolly')},
      {text:'Keep the oven on until the tray is baked',done:g=>g.lunch?.job.tray!=='raw',at:()=>({x:-2.5,z:-7.2})},
      {text:'Carry the tray to the conveyor',done:g=>['conveyor','lift','delivered'].includes(g.lunch?.job.tray??''),at:g=>g.held?.spec.id==='tray'?{x:0,z:-7}:prop(g,'tray')},
      {text:'Park the capacitor cart next to the lift winch',done:g=>!!g.lunch?.circuit.loads.find(l=>l.id==='lift')?.capacitor?.atLoad||!!g.lunch?.job.done,at:g=>g.held?.spec.id==='capacitor'?{x:12,z:-4.8}:prop(g,'capacitor')},
      {text:'Power the conveyor first, then the lift',done:g=>!!g.lunch?.job.done,at:g=>g.lunch?.circuit.loads.find(l=>l.id==='conveyor')?.state==='on'?{x:12,z:-4.8}:{x:5,z:-5}}],
    bonuses:[
      {text:'Never trip a breaker',ok:g=>!tripped(g)},
      {text:'No scorched or cut cables',ok:g=>!scorched(g)},
      {text:'Keep the fridge from spoiling (under 80%)',ok:g=>(g.lunch?.maxTemperature??0)<.8}]},
};

const NAMES:Partial<Record<PropKind,string>>={box:'crate',desk:'desk',chair:'chair',monitor:'monitor',mug:'mug',paper:'paper',plant:'plant',cabinet:'cabinet',sofa:'sofa',bin:'bin',
  reel:'cable reel',coupler:'coupler',cart:'cart',printer:'printer',whiteboard:'whiteboard',bookshelf:'shelf',cooler:'water cooler',bridge:'cable bridge',mop:'mop',tray:'lunch tray',
  lamp:'lamp',dolly:'cable dolly',capcart:'capacitor cart',coolbox:'cooler box',splitter:'splitter',wedge:'doorstop',cone:'cone',strip:'power strip',beanbag:'bean bag'};
/** A station supplies its own steps and bonuses (src/stations); the marker defaults to its bench. */
function stationJob(g:Game):Job{const st=g.station!,j=st.job;
  return {goal:j.goal,steps:j.steps.map(s=>({text:s.text,done:()=>s.done(),at:()=>s.at?.()??st.stand})),bonuses:j.bonuses.map(b=>({text:b.text,ok:()=>b.ok()}))};}
export interface Prompt {key:string;text:string}
/** What the most useful key does right now, in words. */
export function promptFor(g:Game):Prompt|null{
  if(!g.running||g.won||g.paused)return null;
  const pos=g.player.translation();
  if(g.lunch){const p=g.lunch.promptAt();if(p)return p;}
  if(g.station){const p=g.station.prompt(g.atBench);if(p||g.atBench)return p;}
  if(g.held){const name=NAMES[g.held.spec.kind]??'it';
    if(g.held.spec.id==='strip'&&dist(pos,g.level.target)<2.6)return {key:'E',text:'Set the power strip down by the door'};
    return {key:'E',text:`Put the ${name} down  ·  Q throws it`};}
  if(g.holdingPlug&&!g.lunch){
    const part=g.props.find(q=>q.mesh.visible&&((q.spec.id==='coupler'&&!g.coupler)||(q.spec.id==='extension'&&!g.extension))&&dist(pos,q.body.translation())<1.9);
    if(part)return {key:'F',text:part.spec.id==='coupler'||g.coupler?'Attach it to your cable':'Attach the coupler first'};
    if(Math.min(dist(pos,g.level.target)-.6,dist(g.plugPosition,g.level.target))<1.6)return {key:'F',text:g.stripPlaced()?'Plug in':'Plug in (the power strip is still missing)'};
    return g.rope.strain>.97?{key:'Q',text:'Let go to slingshot the cable'}:{key:'F',text:'Drop the plug'};}
  if(!g.lunch&&g.nearSwitch(pos))return {key:'E',text:g.switchedOn?'Switch it off':g.connected?'Switch it on':'Switch on (needs power first)'};
  if(!g.lunch&&!g.connected&&dist(pos,g.plugPosition)<1.75)return {key:'F',text:'Pick up the plug'};
  const near=g.nearest();if(near){if(near.spec.id==='coffee-reel'&&!g.coffeeReused)return {key:'E',text:'Borrow the coffee machine\'s cable'};
    return {key:'E',text:`Grab the ${NAMES[near.spec.kind]??'thing'}${prefabs[near.spec.kind].mass>=15?' (heavy: push it)':''}`};}
  return null;
}

/** The job card (top left, under the timer) and the prompt pill (above the action bar). */
export class ObjectivesHUD{
  card:HTMLElement;prompt:HTMLElement;marker:T.Mesh;private shown='';private promptShown='';private job:Job;private flash=new Set<number>();
  constructor(private g:Game,layer:HTMLElement){
    this.job=g.station?stationJob(g):JOBS[g.level.id]??JOBS.playground;
    this.card=document.createElement('section');this.card.className='objective panel';this.card.setAttribute('aria-live','polite');layer.append(this.card);
    this.prompt=document.createElement('div');this.prompt.className='prompt-pill';this.prompt.hidden=true;layer.append(this.prompt);
    const m=new T.MeshBasicMaterial({color:'#ffd84a'});m.color.multiplyScalar(1.5);m.userData.outlineParameters={visible:false};
    this.marker=new T.Mesh(new T.ConeGeometry(.22,.42,20).rotateX(Math.PI),m);this.marker.userData.noAO=true;this.marker.visible=false;g.root.add(this.marker);
  }
  /** Steps latch once done so the list only ever moves forward. */
  private done=new Set<number>();
  update(){
    const g=this.g;this.job.steps.forEach((s,i)=>{if(!this.done.has(i)&&s.done(g)){this.done.add(i);this.flash.add(i);g.audio.bell(1175,.35,.035);setTimeout(()=>{this.flash.delete(i);this.shown='';},900);}});
    const current=this.job.steps.findIndex((_,i)=>!this.done.has(i));
    const bonus=this.job.bonuses.map(b=>b.ok(g));
    const key=`${[...this.done].join()}|${current}|${bonus.join()}|${[...this.flash].join()}`;
    if(key!==this.shown){this.shown=key;
      // Long jobs stay compact: a done count, the current step and the one after it.
      const steps=this.job.steps.map((st,i)=>({st,i})).filter(({i})=>this.job.steps.length<=4||this.flash.has(i)||(current>=0&&i>=current&&i<=current+1));
      const doneCount=this.done.size,hiddenDone=doneCount-steps.filter(({i})=>this.done.has(i)).length;
      this.card.innerHTML=`<h3><small>JOB · ${doneCount}/${this.job.steps.length}</small>${this.job.goal}</h3><ol>${hiddenDone>0?`<li class="done summary"><i></i><span>${hiddenDone} step${hiddenDone>1?'s':''} done</span></li>`:''}${steps.map(({st,i})=>`<li class="${this.done.has(i)?'done':i===current?'now':'todo'}${this.flash.has(i)?' flash':''}"><i></i><span>${st.text}</span></li>`).join('')}</ol>`+
        `<ul class="bonus">${this.job.bonuses.map((b,i)=>`<li class="${bonus[i]?'ok':'miss'}"><i>★</i>${b.text}</li>`).join('')}</ul>`;}
    // A bouncing arrow over whatever the current step needs.
    const at=current>=0&&g.running&&!g.won&&!g.atBench?this.job.steps[current].at?.(g):undefined;this.marker.visible=!!at;
    if(at){this.marker.position.set(at.x,2.1+Math.sin(g.last*.006)*.18,at.z);this.marker.rotation.y=g.last*.002;}
    const p=promptFor(g),pk=p?`${p.key}|${p.text}`:'';
    if(pk!==this.promptShown){this.promptShown=pk;this.prompt.hidden=!p;if(p)this.prompt.innerHTML=`<kbd>${p.key}</kbd><span>${p.text}</span>`;}
  }
  /** Bonus results for the grade card. */
  results(){return this.job.bonuses.map(b=>({text:b.text,ok:b.ok(this.g)}));}
}
