// Screen flow and HUD for Circuit Crew. game.ts calls in from setupUI/begin/togglePause/win/render;
// Icons, rings and meters carry the state; a short objective card and key prompts say what to do
// (src/ui/objectives.ts).
import type {Game} from '../game';
import type {Grade} from '../sim/grade';
import type {LunchJob} from '../sim/lunch';
import {installIcons} from '../render/icons';
import {levels} from '../levels';
import {prefabs} from '../props/prefabs';
import {bestFor,record,flagAutostart,takeAutostart} from './store';
import {ObjectivesHUD} from './objectives';
import {hudMarkup,titleMarkup,jobsMarkup,pauseMarkup,resultMarkup,failMarkup,clock} from './screens';

type Screen='title'|'jobs'|'play'|'pause'|'result'|'fail';
const RING=2*Math.PI*37;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const dist=(a:{x:number;z:number},b:{x:number;z:number})=>Math.hypot(a.x-b.x,a.z-b.z);

export class GameUI {
  screen:Screen='title';sel=0;
  layer:HTMLElement;ring:SVGCircleElement;badge:HTMLElement;strainCard:HTMLElement;strainFill:HTMLElement;reel:HTMLElement;cablebar:HTMLElement;
  tallies:Record<'time'|'damage'|'cost',{box:HTMLElement;value:HTMLElement;shown:string}>;acts:Record<string,HTMLElement>={};
  private lastLength=0;private connectedUntil=0;private heldCable?:{ports:(string|null)[];lead:{dead:boolean}};private actState='';private padFrame=0;private padPrev:boolean[]=[];private padAxis=0;private stickId?:number;
  /** Focus follows the keyboard only; mouse and touch players never see a focus ring they didn't ask for. */
  private keyboard=false;
  objectives!:ObjectivesHUD;
  constructor(public game:Game){
    installIcons();
    const hud=game.hud,params=new URLSearchParams(location.search),bests=levels.map(l=>bestFor(l.id));
    this.sel=Math.max(0,levels.findIndex(l=>l.id===game.level.id));
    hud.innerHTML=hudMarkup(game.level)+titleMarkup(game.level)+jobsMarkup(levels,bests)+pauseMarkup(game.level);
    this.layer=hud.querySelector('[data-layer="hud"]')!;this.ring=hud.querySelector('.ring .left')!;this.badge=hud.querySelector('.badge')!;
    this.strainCard=hud.querySelector('.strain')!;this.strainFill=hud.querySelector('#strain')!;this.reel=hud.querySelector('.reel')!;this.cablebar=hud.querySelector('.cablebar')!;
    const tally=(k:'time'|'damage'|'cost')=>({box:hud.querySelector<HTMLElement>(`[data-tally="${k}"]`)!,value:hud.querySelector<HTMLElement>(`[data-tally="${k}"] b`)!,shown:''});
    this.tallies={time:tally('time'),damage:tally('damage'),cost:tally('cost')};
    for(const el of Array.from(hud.querySelectorAll<HTMLElement>('.act')))this.acts[el.dataset.action!]=el;
    hud.addEventListener('click',e=>this.click(e));
    // Registered before Game.setupInput, so these run ahead of the game's own key handling.
    addEventListener('keydown',e=>{this.keyboard=true;this.key(e);});addEventListener('pointerdown',()=>this.keyboard=false,true);
    this.setupStick();
    this.objectives=new ObjectivesHUD(game,this.layer);
    addEventListener('gamepadconnected',()=>this.syncPad());addEventListener('gamepaddisconnected',()=>this.syncPad());
    // Autostarted jobs begin without a click, so the first input anywhere wakes the audio.
    const unlock=()=>{if(this.game.running)this.game.audio.start();removeEventListener('pointerdown',unlock);removeEventListener('keydown',unlock);};
    addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);
    addEventListener('resize',()=>{if(this.screen==='jobs')this.layoutJobs();});
    this.syncSound();this.syncPad();
    // Restart and "next job" reload straight into play; a bare URL opens the title; ?level=… opens that job's tag.
    const auto=params.has('go')||takeAutostart(game.level.id);
    if(params.has('go')){params.delete('go');const q=params.toString();history.replaceState(null,'',location.pathname+(q?`?${q}`:''));}
    if(auto){this.show('play');setTimeout(()=>game.begin(),0);}
    else{game.survey=true;this.show(!params.has('level')||params.has('intro')?'title':'jobs');}
  }

  // ---------- screens ----------
  show(s:Screen){
    this.screen=s;document.body.dataset.screen=s;
    for(const el of Array.from(this.game.hud.querySelectorAll<HTMLElement>('.screen')))el.hidden=el.dataset.screen!==s;
    this.layer.hidden=s!=='play';
    if(s==='jobs')this.selectJob(this.sel);
    const focus:Partial<Record<Screen,string>>={title:'[data-ui="play"]',jobs:'[data-ui="go"]',pause:'[data-ui="resume"]'};
    const target=focus[s]&&this.game.hud.querySelector<HTMLElement>(`.screen[data-screen="${s}"] ${focus[s]}`);
    if(target&&this.keyboard)requestAnimationFrame(()=>target.focus({preventScroll:true}));
  }
  /** Returns true when the UI takes over a begin request (Jobs with another job picked). */
  beforeBegin(){if(this.screen==='jobs'&&levels[this.sel].id!==this.game.level.id){this.playSelected();return true;}return false;}
  started(){this.show('play');(document.activeElement as HTMLElement|null)?.blur?.();}
  paused(on:boolean){
    if(on){const g=this.game,set=(k:string,v:string)=>{const el=g.hud.querySelector(`.pause-screen [data-p="${k}"]`);if(el)el.textContent=v;};set('time',clock(g.time));set('damage',String(g.damage));set('cost',String(g.cost));}
    this.show(on?'pause':'play');if(!on)(document.activeElement as HTMLElement|null)?.blur?.();
  }
  restart(){flagAutostart(this.game.level.id);location.reload();}
  toJobs(){location.href=`?level=${this.game.level.id}`;}
  playSelected(){const l=levels[this.sel];if(l.id===this.game.level.id){this.game.begin();return;}flagAutostart(l.id);location.href=`?level=${l.id}`;}

  selectJob(i:number){
    this.sel=(i+levels.length)%levels.length;const hud=this.game.hud,l=levels[this.sel];
    hud.querySelectorAll<HTMLElement>('.job').forEach((el,j)=>{el.classList.toggle('sel',j===this.sel);el.setAttribute('aria-pressed',String(j===this.sel));});
    const go=hud.querySelector<HTMLElement>('[data-ui="go"]')!;go.setAttribute('aria-label',l.id===this.game.level.id?'Start playing':`Play ${l.number} ${l.name.toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase())}`);
    this.layoutJobs();
  }
  /** Tags hang centred as a group; when they overflow (phone) the selected tag slides to centre. */
  layoutJobs(){
    const row=this.game.hud.querySelector<HTMLElement>('.jobs-screen .row'),wrap=row?.parentElement;if(!row||!wrap)return;
    row.classList.remove('scroll');row.style.transform='';
    if(row.scrollWidth<=wrap.clientWidth-160)return;
    row.classList.add('scroll');const tag=row.children[this.sel] as HTMLElement;
    row.style.transform=`translateX(${wrap.clientWidth/2-(tag.offsetLeft+tag.offsetWidth/2)}px)`;
  }

  // ---------- input ----------
  click(e:MouseEvent){
    const t=(e.target as Element).closest<HTMLElement>('[data-ui],[data-action],[data-job]');if(!t)return;
    const g=this.game;
    if(t.dataset.action){g.action(t.dataset.action);t.blur();return;}
    if(t.dataset.job){const i=levels.findIndex(l=>l.id===t.dataset.job);if(i===this.sel)this.playSelected();else this.selectJob(i);return;}
    switch(t.dataset.ui){
      case 'play':g.begin();break;
      case 'jobs':this.show('jobs');break;
      case 'home':this.show('title');break;
      case 'prev':this.selectJob(this.sel-1);break;
      case 'next':this.selectJob(this.sel+1);break;
      case 'go':this.playSelected();break;
      case 'sound':g.action('sound');this.syncSound();break;
      case 'pause':g.action('pause');t.blur();break;
      case 'resume':g.togglePause();break;
      case 'restart':this.restart();break;
      case 'jobs-reload':this.toJobs();break;
      case 'nextjob':{const next=g.level.next;if(next){flagAutostart(next);location.href=`?level=${next}`;}break;}
    }
  }
  key(e:KeyboardEvent){
    if(e.repeat)return;
    const s=this.screen,onButton=document.activeElement instanceof HTMLButtonElement;
    if(e.code==='KeyR'&&(s==='play'||s==='pause'||s==='result'||s==='fail'))flagAutostart(this.game.level.id);
    if(s==='title'){if(e.code==='Enter'&&!onButton){e.preventDefault();this.game.begin();}if(e.code==='KeyJ')this.show('jobs');}
    else if(s==='jobs'){
      if(e.code==='ArrowLeft'||e.code==='KeyA')this.selectJob(this.sel-1);
      if(e.code==='ArrowRight'||e.code==='KeyD')this.selectJob(this.sel+1);
      if(e.code==='Enter'&&!onButton){e.preventDefault();this.playSelected();}
      if(e.code==='Escape')this.show('title');
    }
    else if(s==='play'){if(e.code==='KeyC'&&this.game.running&&!this.game.paused&&!this.game.won)this.game.action('camera');}
    else if((s==='result'||s==='fail')&&e.code==='Enter'&&!onButton){e.preventDefault();this.game.hud.querySelector<HTMLElement>(`.screen[data-screen="${s}"] .btn.primary`)?.click();}
  }
  /** Phone thumbstick: sets game.stick in screen space (x right, z down) only while dragged. */
  setupStick(){
    const stick=this.layer.querySelector<HTMLElement>('.stick')!,knob=stick.querySelector<HTMLElement>('.knob')!;
    const move=(e:PointerEvent)=>{const r=stick.getBoundingClientRect(),max=r.width*.36;let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const d=Math.hypot(dx,dy);if(d>max){dx*=max/d;dy*=max/d;}
      knob.style.transform=`translate(${dx}px,${dy}px)`;const m=Math.hypot(dx,dy)/max;this.game.stick=m>.15?{x:dx/max,z:dy/max}:undefined;};
    const end=(e:PointerEvent)=>{if(e.pointerId!==this.stickId)return;this.stickId=undefined;stick.classList.remove('held');knob.style.transform='';this.game.stick=undefined;};
    stick.addEventListener('pointerdown',e=>{e.preventDefault();this.stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stick.classList.add('held');this.game.audio.start();move(e);});
    stick.addEventListener('pointermove',e=>{if(e.pointerId===this.stickId)move(e);});
    stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
  }
  syncSound(){const muted=this.game.audio.muted;
    for(const b of Array.from(this.game.hud.querySelectorAll<HTMLElement>('[data-ui="sound"]'))){b.setAttribute('aria-pressed',String(muted));b.classList.toggle('on',!muted);const use=b.querySelector('use');use?.setAttribute('href',muted?'#i-mute':'#i-sound');}}
  syncPad(){const on=[...(navigator.getGamepads?.()??[])].some(p=>!!p);this.layer.classList.toggle('gp',on);this.game.hud.querySelector('.padind')?.classList.toggle('on',on);}
  /** Menu navigation on a pad: d-pad / stick to pick a job, B to go back, A on pause resumes.
   *  (A and Start on the title/jobs reach Game.begin through Game.pollPad.) */
  pollPad(){
    if(++this.padFrame%30===0)this.syncPad();
    const pad=navigator.getGamepads?.()[0];if(!pad)return;
    const edge=(i:number)=>{const p=!!pad.buttons[i]?.pressed,was=!!this.padPrev[i];this.padPrev[i]=p;return p&&!was;};
    const left=edge(14),right=edge(15),a=edge(0),b=edge(1);
    const axis=Math.abs(pad.axes[0]??0)>.6?Math.sign(pad.axes[0]):0,flick=axis!==this.padAxis?axis:0;this.padAxis=axis;
    const s=this.screen;
    if(s==='jobs'){if(left||flick<0)this.selectJob(this.sel-1);if(right||flick>0)this.selectJob(this.sel+1);if(b)this.show('title');}
    else if(s==='title'){if(right||flick>0)this.show('jobs');}
    else if(s==='pause'){if(a||b)this.game.togglePause();}
    // Game.pollPad reloads on A once the job is over; flag it so the reload goes straight back in.
    else if((s==='result'||s==='fail')&&a)flagAutostart(this.game.level.id);
  }

  // ---------- HUD ----------
  update(){
    this.pollPad();
    const g=this.game;if(!g.running||this.screen!=='play')return;
    this.setTally('time',clock(g.time));this.setTally('damage',String(g.damage),g.damage>0);this.setTally('cost',String(g.cost),g.cost>0);
    const deadline=g.level.deadline??240,left=Math.max(0,1-g.time/deadline);
    this.ring.style.strokeDasharray=`${(left*RING).toFixed(1)} ${RING.toFixed(1)}`;this.badge.classList.toggle('late',g.time>deadline);
    this.layer.classList.toggle('won',g.won);
    this.updateStrain();this.updateActions();this.objectives.update();
  }
  setTally(k:'time'|'damage'|'cost',v:string,visible=true){
    const t=this.tallies[k];if(t.shown===v&&!t.box.hidden===visible)return;
    const changed=t.shown!==''&&t.shown!==v;t.shown=v;t.value.textContent=v;t.box.hidden=!visible;
    // Damage and cost pop when they tick up; time just counts.
    if(changed&&k!=='time'&&!reduced())t.box.animate([{transform:'scale(1)'},{transform:'scale(1.35) translateY(-4px)'},{transform:'scale(.95)'},{transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.34,1.56,.64,1)'});
  }
  updateStrain(){
    const g=this.game,lunch=g.lunch,held=lunch?lunch.held?.cable:undefined,holding=lunch?!!held:g.holdingPlug,rope=held?held.rope:g.rope;
    // A plug seated after being carried flashes the meter gold before it fades.
    if(held)this.heldCable=held;
    if(!holding&&this.heldCable&&lunch){if(this.heldCable.ports.every(p=>!!p)&&!this.heldCable.lead.dead)this.connectedUntil=g.time+1.4;this.heldCable=undefined;}
    if(!lunch&&g.connected&&this.connectedUntil===0)this.connectedUntil=g.time+1.6;
    const connected=g.time<this.connectedUntil||(!lunch&&g.connected&&g.won);
    const show=holding||connected;this.strainCard.classList.toggle('show',show);this.strainCard.classList.toggle('connected',connected&&!holding);
    if(!holding){this.reel.classList.remove('paying');return;}
    const t=Math.max(0,Math.min(1,rope.strain/1.15));this.cablebar.style.setProperty('--t',t.toFixed(3));
    this.reel.style.setProperty('--left',Math.max(0,1-rope.length/rope.maxLength).toFixed(3));
    this.reel.classList.toggle('paying',rope.length>this.lastLength+.002);this.lastLength=rope.length;
  }
  updateActions(){
    const g=this.game,lunch=g.lunch,p=g.player.translation(),holding=g.holdingPlug,heavy=!!g.held&&prefabs[g.held.spec.kind].mass>=15;
    let cableReady=false;
    if(lunch){
      if(lunch.held){const end=lunch.held.cable.ends[lunch.held.end];cableReady=lunch.ports.some(q=>q.id!==lunch.held!.cable.ports[1-lunch.held!.end]&&Math.min(dist(p,q.pos)-.3,dist(end,q.pos))<1.4);}
      else cableReady=!g.held&&lunch.cables.some(c=>c.ends.some(e=>dist(p,e)<1.75));
    }else cableReady=holding?Math.min(dist(p,g.level.target)-.3,dist(g.plugPosition,g.level.target))<1.6:!g.held&&dist(p,g.plugPosition)<1.75;
    const state={grab:{on:!!g.held,ready:!g.held&&!holding&&g.reticle.visible,off:false},
      cable:{on:holding,ready:cableReady,off:!!g.held},
      throw:{on:false,ready:holding&&g.rope.strain>.97,off:!g.held&&!holding},
      jump:{on:!g.grounded&&g.airborne>.05,ready:false,off:heavy}};
    const key=JSON.stringify(state);if(key===this.actState)return;this.actState=key;
    for(const [k,v] of Object.entries(state)){const el=this.acts[k];if(!el)continue;el.classList.toggle('on',v.on);el.classList.toggle('ready',v.ready&&!v.off);el.classList.toggle('off',v.off);}
  }

  // ---------- end of job ----------
  won(result:{parts:Grade[];overall:Grade}){
    const g=this.game,{improved}=record(g.level.id,{grade:result.overall,time:g.time,damage:g.damage,cost:g.cost});
    const next=levels.find(l=>l.id===g.level.next),view={level:g.level,time:g.time,damage:g.damage,cost:g.cost,parts:result.parts,overall:result.overall,improved,next};
    // Let the camera push in on the machine coming to life before the card lands.
    setTimeout(()=>{
      g.hud.insertAdjacentHTML('beforeend',resultMarkup(view));this.show('result');document.body.dataset.complete='true';
      const screen=g.hud.querySelector<HTMLElement>('.result-screen')!;this.countUp(screen);
      // Bonus goals under the grade rows: a star for each one achieved.
      const rows=screen.querySelector('.result .rows');const bonus=this.objectives.results();if(rows)rows.insertAdjacentHTML('afterend',`<ul class="result-bonus">${bonus.map(b=>`<li class="${b.ok?'ok':'miss'}"><i>★</i>${b.text}</li>`).join('')}</ul>`);
      if(this.keyboard)requestAnimationFrame(()=>screen.querySelector<HTMLElement>('.btn.primary')?.focus({preventScroll:true}));
      if(!reduced())setTimeout(()=>{g.audio.thud(9);g.audio.tone(90,.18,.08,'triangle');screen.querySelector('.result')?.classList.add('thud');},1800);
      setTimeout(()=>{if(improved)g.audio.bell(1319,.6,.05);},reduced()?0:1950);
    },1400);
  }
  /** Rows rise at 0.6 / 0.85 / 1.1 s and their numbers count up as they land. */
  countUp(screen:HTMLElement){
    const cells=Array.from(screen.querySelectorAll<HTMLElement>('[data-count]')),start=performance.now(),instant=reduced();
    const fmt=(el:HTMLElement,v:number)=>el.dataset.kind==='time'?clock(v):String(Math.round(v));
    const tick=(now:number)=>{let busy=false;
      cells.forEach((el,i)=>{const target=Number(el.dataset.count),t=instant?1:Math.max(0,Math.min(1,((now-start)/1000-(.6+i*.25))/.7));el.textContent=fmt(el,target*(1-(1-t)**3));if(t<1)busy=true;});
      if(busy)requestAnimationFrame(tick);};
    tick(start);
  }
  failed(job:LunchJob){
    const g=this.game;
    g.hud.insertAdjacentHTML('beforeend',failMarkup({level:g.level,burned:job.tray==='burned',oven:job.tray!=='raw',belt:job.transport>=1,lift:job.done}));
    this.show('fail');if(this.keyboard)requestAnimationFrame(()=>g.hud.querySelector<HTMLElement>('.fail-screen .btn.primary')?.focus({preventScroll:true}));
  }
}

const uis=new WeakMap<Game,GameUI>();
export function setupGameUI(game:Game){const ui=new GameUI(game);uis.set(game,ui);return ui;}
export const gameUI=(game:Game)=>uis.get(game);

