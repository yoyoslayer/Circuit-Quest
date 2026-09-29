// Lunch Rush HUD: objective chain (oven -> conveyor -> lift), fridge thermometer and one
// breaker needle dial per supply cart. Reads the runtime's job and circuit; owns no rules.
import {icon} from '../render/icons';
import type {LunchJob} from '../sim/lunch';
import type {Circuit} from '../sim/electrical';

const PROG=2*Math.PI*32;
/** Bezel colours match the cart bodies in the world. */
const CARTS:[string,string][]=[['a','#FFC53D'],['b','#E9803A']];
const dial=`<svg viewBox="0 0 96 62" aria-hidden="true">
  <path d="M8 56 A40 40 0 0 1 48 16" fill="none" stroke="#3BB273" stroke-width="8"/>
  <path d="M48 16 A40 40 0 0 1 82.6 36" fill="none" stroke="#FFC53D" stroke-width="8"/>
  <path d="M82.6 36 A40 40 0 0 1 88 56" fill="none" stroke="#E5484D" stroke-width="8"/>
  <path d="M22 41l-5.2-3M33 30l-3-5.2M48 26v-6M63 30l3-5.2M74 41l5.2-3" stroke="#262A40" stroke-width="2.5" stroke-linecap="round"/>
  <g class="needle"><path d="M48 56L13 56" stroke="#262A40" stroke-width="4" stroke-linecap="round"/></g>
  <circle cx="48" cy="56" r="6" fill="#262A40"/></svg>`;
const step=(id:string,ic:string)=>`<div class="step todo" id="${id}"><svg class="prog" viewBox="0 0 70 70" aria-hidden="true"><circle cx="35" cy="35" r="32"/></svg>${icon(ic)}</div>`;

export class LunchHud {
  chain:HTMLElement;breakers:HTMLElement;steps:HTMLElement[];links:HTMLElement[];progs:SVGCircleElement[];thermo:HTMLElement;gauges=new Map<string,{el:HTMLElement;needle:SVGGElement}>();
  private last='';
  constructor(host:HTMLElement){
    const layer=host.querySelector<HTMLElement>('[data-layer="hud"]')??host;
    layer.classList.add('lunch');
    this.chain=document.createElement('div');this.chain.className='chain card lunch-chain';this.chain.setAttribute('aria-hidden','true');
    this.chain.innerHTML=`${step('oven-stage','oven')}<i class="link cold"></i>${step('belt-stage','conveyor')}<i class="link cold"></i>${step('lift-stage','lift')}<i class="div"></i>
      <div class="thermo" id="fridge-stage">${icon('fridge','fr')}<div class="tube"><i></i></div>${icon('spoiled','sad')}</div>`;
    this.breakers=document.createElement('div');this.breakers.className='breakers card';this.breakers.id='breaker-stage';this.breakers.setAttribute('aria-hidden','true');
    this.breakers.innerHTML=CARTS.map(([id,c])=>`<div class="gauge" data-cart="${id}" style="--g:${c}"><div class="face">${dial}</div><i class="pip"></i></div>`).join('');
    layer.append(this.chain,this.breakers);
    this.steps=Array.from(this.chain.querySelectorAll<HTMLElement>('.step'));this.links=Array.from(this.chain.querySelectorAll<HTMLElement>('.link'));
    this.progs=Array.from(this.chain.querySelectorAll<SVGCircleElement>('.prog circle'));this.thermo=this.chain.querySelector('.thermo')!;
    for(const el of Array.from(this.breakers.querySelectorAll<HTMLElement>('.gauge')))this.gauges.set(el.dataset.cart!,{el,needle:el.querySelector('.needle')!});
  }
  update(job:LunchJob,circuit:Circuit){
    // Stage progress: bake 0-20 s, then carry to the belt, then ride the lift.
    const oven=job.tray!=='raw',belt=job.transport>=1,lift=job.done;
    const done=[oven,belt,lift],now=[!oven,oven&&!belt,belt&&!lift],prog=[job.bake/20,job.transport,job.height];
    const temp=job.temperature,hot=temp>.8;
    const gauges=CARTS.map(([id])=>{const s=circuit.sources.find(q=>q.id===id),draw=circuit.draw.get(id)??0;return {id,tripped:!!s?.tripped,draw};});
    const key=[...done,...now,...prog.map(p=>p.toFixed(3)),temp.toFixed(3),...gauges.map(g=>`${g.tripped}${g.draw.toFixed(2)}`)].join();
    if(key===this.last)return;this.last=key;
    this.steps.forEach((el,i)=>{el.classList.toggle('done',done[i]);el.classList.toggle('now',now[i]&&!done[i]);el.classList.toggle('todo',!done[i]&&!now[i]);
      this.progs[i].style.strokeDasharray=`${Math.max(0,Math.min(1,prog[i]))*PROG} ${PROG}`;});
    this.links.forEach((el,i)=>{el.classList.toggle('live',done[i]);el.classList.toggle('cold',!done[i]);});
    this.thermo.style.setProperty('--h',String(Math.max(0,Math.min(1,temp))));this.thermo.classList.toggle('hot',hot);this.thermo.classList.toggle('warm',temp>.55&&!hot);
    for(const g of gauges){const v=this.gauges.get(g.id);if(!v)continue;
      // Needle sweeps 0-180 degrees across 0-6 bars; the limit is 5.
      const turn=g.tripped?180:Math.max(0,Math.min(1,g.draw/6))*180;v.needle.style.transform=`rotate(${turn}deg)`;
      v.el.classList.toggle('tripped',g.tripped);v.el.classList.toggle('hot',!g.tripped&&g.draw>=4.5);}
  }
}
const huds=new WeakMap<HTMLElement,LunchHud>();
/** One Lunch HUD per HUD root; created on first use by the lunch runtime. */
export function lunchHud(host:HTMLElement){let h=huds.get(host);if(!h){h=new LunchHud(host);huds.set(host,h);}return h;}
