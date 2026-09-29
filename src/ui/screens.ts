// Markup for the menu screens and HUD. Pure string builders: no game state lives here.
import {icon} from '../render/icons';
import type {Level,LevelId} from '../levels/types';
import type {Grade} from '../sim/grade';
import type {Best} from './store';

/** Per-job look: disc colour (UI.md level discs) and the thumbnail crop used on job tags. */
export const LOOK:Record<LevelId,{color:string;thumb:string;size:string;pos:string}>={
  playground:{color:'#5ED6CC',thumb:'thumb-playground.jpg',size:'175%',pos:'52% 42%'},
  meeting:{color:'#6E9BEA',thumb:'thumb-meeting.jpg',size:'165%',pos:'52% 45%'},
  lunch:{color:'#FF8A3D',thumb:'thumb-lunch.jpg',size:'160%',pos:'50% 45%'},
  vias:{color:'#2F9A62',thumb:'thumb-vias.jpg',size:'160%',pos:'50% 45%'},
  archive:{color:'#B0822C',thumb:'thumb-archive.jpg',size:'160%',pos:'50% 45%'}
};
export const thumbUrl=(id:LevelId)=>`${import.meta.env.BASE_URL}ui/${LOOK[id].thumb}`;
/** Level data keeps names upper-case for the old intro card; menus use title case. */
export const title=(l:Level)=>l.name.toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase());
export const clock=(t:number)=>`${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,'0')}`;
export const medalClass=(g:Grade)=>({A:'',B:'b',C:'c',D:'d'} as const)[g];
export const medal=(g:Grade|undefined,extra='')=>g?`<span class="medal ${medalClass(g)} ${extra}"><span>${g}</span></span>`:`<span class="medal none ${extra}"></span>`;
const disc=(l:Level,cls='disc')=>`<span class="${cls}" style="--lvl:${LOOK[l.id].color}">${icon(l.badge)}</span>`;
const kb=(k:string,cls='')=>`<span class="key kb ${cls}">${k}</span>`;
/** Face buttons match the colours printed on common pads. */
const pad=(b:'A'|'B'|'X'|'Y')=>`<span class="key gp btnpad p${b.toLowerCase()}">${b}</span>`;
const pill=(t:string)=>`<span class="key gp pill">${t}</span>`;
const space=()=>`<span class="key kb sp"></span>`;
/** Striped yellow/ink cable: the one motif shared by every screen. */
const stripe=(id:string,w:number,band:number)=>`<pattern id="${id}" width="${w}" height="${w}" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="${w}" height="${w}" fill="#262A40"/><rect width="${band}" height="${w}" fill="#FFC53D"/></pattern>`;

export const hudMarkup=(l:Level)=>`
<div class="hud" data-layer="hud">
  <div class="jobplate card">
    <div class="badge"><svg class="ring" viewBox="0 0 84 84" aria-hidden="true"><circle class="track" cx="42" cy="42" r="37"/><circle class="left" cx="42" cy="42" r="37"/></svg>${disc(l)}</div>
    <div class="tallies">
      <div class="tally" data-tally="time">${icon('clock')}<b id="clock">0:00</b></div>
      <div class="tally" data-tally="damage" hidden>${icon('mug')}<b id="damage">0</b></div>
      <div class="tally" data-tally="cost" hidden>${icon('coins')}<b id="cost">0</b></div>
    </div>
  </div>
  <div class="topright">
    <div class="strain card" aria-hidden="true"><div class="reel">${icon('reel')}</div><div class="cablebar"><i id="strain"></i></div></div>
    <button class="btn pausebtn" data-ui="pause" aria-label="Pause">${icon('pause')}</button>
  </div>
  <div class="actions card">
    <button class="act grab" data-action="grab" aria-label="Grab or drop">${icon('hand')}${kb('E')}${pad('X')}</button>
    <button class="act cable" data-action="cable" aria-label="Cable">${icon('plug')}${kb('F')}${pad('B')}</button>
    <button class="act throw" data-action="throw" aria-label="Throw">${icon('throw')}${kb('Q')}${pad('Y')}</button>
    <button class="act jump" data-action="jump" aria-label="Jump">${icon('jump')}${space()}${pad('A')}</button>
    <i class="sep"></i>
    <button class="act small cam" data-action="camera" aria-label="Reset camera">${icon('camera')}${kb('C')}${pill('RS')}</button>
  </div>
  <div class="stick" aria-hidden="true"><i class="knob"></i></div>
</div>`;

export const titleMarkup=(l:Level)=>`
<section class="screen title-screen" data-screen="title" aria-label="Circuit Crew" hidden>
  <div class="scrim"></div>
  <main class="title">
    <h1 class="logo" aria-label="Circuit Crew"><span>Circuit</span><span>Crew</span>
      <svg class="cable" viewBox="0 0 900 250" aria-hidden="true">
        <defs>${stripe('cc-stripe-title',26,11)}</defs>
        <path d="M0 250 C 150 262, 300 214, 380 140 S 480 58, 580 62" fill="none" stroke="#262A40" stroke-width="26" stroke-linecap="round"/>
        <path d="M0 250 C 150 262, 300 214, 380 140 S 480 58, 580 62" fill="none" stroke="url(#cc-stripe-title)" stroke-width="16" stroke-linecap="round"/>
        <circle class="ringspin" cx="688" cy="62" r="60" fill="none" stroke="#5ED6CC" stroke-width="5" stroke-dasharray="14 10" opacity=".95"/>
        <rect x="648" y="22" width="80" height="80" rx="22" fill="#FAF3E3" stroke="#262A40" stroke-width="5"/>
        <circle cx="704" cy="84" r="5" fill="#262A40"/>
        <circle class="led" cx="710" cy="38" r="6" fill="#5ED6CC" stroke="#262A40" stroke-width="3"/>
        <g class="spark" fill="#FFC53D" stroke="#262A40" stroke-width="3.5" stroke-linejoin="round">
          <path d="M686 -26l6 18 14-10-6 17 18 2-17 7"/><path d="M758 34l20-6-8 14 16 8-20 2"/><path d="M748 104l18 10-17 2 4 17-13-12"/>
        </g>
        <g class="plug">
          <rect x="574" y="38" width="56" height="48" rx="12" fill="#FFC53D" stroke="#262A40" stroke-width="5"/>
          <path d="M590 50h24" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>
          <path d="M630 51h20M630 73h20" stroke="#262A40" stroke-width="8" stroke-linecap="round"/>
        </g>
      </svg>
    </h1>
    <div class="cta">
      <button class="btn primary big play" data-ui="play" aria-label="Start playing" title="${title(l)}">
        <span class="lead">${icon('play')}Play</span>
        <span class="nextjob">${disc(l)}<small>${l.number}</small></span>
      </button>
      <button class="btn jobsbtn" data-ui="jobs" aria-label="Choose a job">${icon('jobs')}</button>
    </div>
    <p class="tagline">Big offices, springy cables, one small technician.</p>
  </main>
  <div class="controls" aria-label="Controls">
    <div><span class="key">W A S D</span>${icon('move')}</div>
    <div><span class="key">E</span>${icon('hand')}</div>
    <div><span class="key">F</span>${icon('plug')}</div>
    <div><span class="key">Q</span>${icon('throw')}</div>
    <div><span class="key sp"></span>${icon('jump')}</div>
    <div><span class="key">&#8679;</span>${icon('dash')}</div>
    <div>${icon('mouse')}${icon('camera')}</div>
  </div>
  <div class="corner">
    <span class="padind" aria-hidden="true">${icon('gamepad')}<i></i></span>
    <button class="btn" data-ui="sound" aria-label="Mute audio" aria-pressed="false">${icon('sound')}</button>
  </div>
</section>`;

const bestRow=(b:Best|undefined)=>`<span class="best ${b?'':'empty'}">
  <span>${icon('clock')}${b?clock(b.time):'&ndash;'}</span><span>${icon('mug')}${b?b.damage:'&ndash;'}</span><span>${icon('coins')}${b?b.cost:'&ndash;'}</span></span>`;
export const jobTag=(l:Level,b:Best|undefined,i:number)=>`
<button class="job tag" data-job="${l.id}" style="--r:${[-3,2.5,-2][i%3]}deg;animation-delay:${(-i*1.2).toFixed(1)}s" aria-label="${l.number} ${title(l)}${b?`, best grade ${b.grade}`:''}">
  <i class="clip"></i>
  <span class="num"><b>${l.number}</b></span>
  <span class="name">${title(l)}</span>
  <span class="thumb" style="background-image:url(${thumbUrl(l.id)});--bs:${LOOK[l.id].size};--bp:${LOOK[l.id].pos}">
    ${disc(l)}${b?medal(b.grade):`<span class="medal none">${icon('star')}</span>`}
  </span>
  ${bestRow(b)}
</button>`;

export const jobsMarkup=(levels:Level[],bests:(Best|undefined)[])=>`
<section class="screen jobs-screen" data-screen="jobs" aria-label="Jobs" hidden>
  <div class="scrim"></div>
  <header>
    <button class="btn" data-ui="home" aria-label="Back to title">${icon('home')}</button>
    <h1>Jobs</h1>
    <div class="shelf" aria-label="Best grades">${bests.map(b=>medal(b?.grade)).join('')}</div>
  </header>
  <svg class="wire" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true">
    <defs>${stripe('cc-stripe-jobs',22,9)}</defs>
    <path d="M-20 138 C 300 176, 520 170, 720 168 S 1140 176, 1460 138" fill="none" stroke="#262A40" stroke-width="20" stroke-linecap="round"/>
    <path d="M-20 138 C 300 176, 520 170, 720 168 S 1140 176, 1460 138" fill="none" stroke="url(#cc-stripe-jobs)" stroke-width="11"/>
  </svg>
  <div class="rowwrap"><div class="row">${levels.map((l,i)=>jobTag(l,bests[i],i)).join('')}</div></div>
  <button class="btn arrow prev" data-ui="prev" aria-label="Previous job in list">${icon('next')}</button>
  <button class="btn arrow nextarrow" data-ui="next" aria-label="Following job in list">${icon('next')}</button>
  <div class="go"><button class="btn primary big" data-ui="go" aria-label="Start playing">${icon('play')}Play</button></div>
  <div class="hints" aria-hidden="true">
    <span><span class="key">A</span><span class="key">D</span>${icon('move')}</span>
    <span><span class="key">&#9166;</span>${icon('play')}</span>
    <span><span class="key">Esc</span>${icon('home')}</span>
  </div>
</section>`;

const tallies=()=>`<div class="tallies">
  <div class="tally">${icon('clock')}<b data-p="time">0:00</b></div><div class="tally">${icon('mug')}<b data-p="damage">0</b></div><div class="tally">${icon('coins')}<b data-p="cost">0</b></div></div>`;
export const pauseMarkup=(l:Level)=>`
<section class="screen pause-screen" data-screen="pause" aria-label="Paused" hidden>
  <div class="scrim"></div>
  <div class="pause panel">
    <div class="tab" aria-hidden="true">${icon('pause')}</div>
    <div class="head">${disc(l)}<div><small>${l.number}</small><h2>${title(l)}</h2></div>${tallies()}</div>
    <div class="body">
      <div>
        <button class="btn primary resume" data-ui="resume" aria-label="Resume">${icon('play')}Resume</button>
        <div class="grid">
          <button class="btn tile" data-ui="restart" aria-label="Restart">${icon('retry')}<span>Restart</span><span class="key">R</span></button>
          <button class="btn tile" data-ui="jobs-reload" aria-label="Jobs">${icon('jobs')}<span>Jobs</span></button>
          <button class="btn tile on" data-ui="sound" aria-label="Mute audio" aria-pressed="false">${icon('sound')}<span>Sound</span></button>
        </div>
      </div>
      <div class="map" aria-label="Controls">
        <span class="k key">W A S D</span>${icon('move')}${icon('gamepad','sm')}
        <span class="k key">E</span>${icon('hand')}<span class="btnpad px">X</span>
        <span class="k key">F</span>${icon('plug')}<span class="btnpad pb">B</span>
        <span class="k key">Q</span>${icon('throw')}<span class="btnpad py">Y</span>
        <span class="k key sp"></span>${icon('jump')}<span class="btnpad pa">A</span>
        <hr>
        <span class="k">${icon('mouse','sm')}<span class="key">C</span></span>${icon('camera')}<span class="pill">RS</span>
      </div>
    </div>
  </div>
</section>`;

export interface ResultView {level:Level;time:number;damage:number;cost:number;parts:Grade[];overall:Grade;improved:boolean;next?:Level}
export function resultMarkup(r:ResultView){
  const best=r.parts.indexOf(r.overall),rows:[string,string,number][]=[['clock','time',r.time],['mug','damage',r.damage],['coins','cost',r.cost]];
  // The winning stat's cable runs from the end of its row up into the stamp.
  const dy=best*80,feed=`<svg class="feed" viewBox="0 0 120 ${290+dy}" style="height:${290+dy}px" aria-hidden="true">
      <path d="M20 ${265+dy} C 92 ${262+dy}, 104 ${200+dy*.7}, 92 160 S 30 96, -84 108" fill="none" stroke="#262A40" stroke-width="14" stroke-linecap="round"/>
      <path d="M20 ${265+dy} C 92 ${262+dy}, 104 ${200+dy*.7}, 92 160 S 30 96, -84 108" fill="none" stroke="#FFC53D" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 12"/></svg>`;
  const next=r.next?`<button class="btn primary next" data-ui="nextjob" aria-label="Next job">${icon('next')}<span class="nx">${disc(r.next,'d')}${r.next.number}</span><span class="key">&#9166;</span></button>`
    :`<button class="btn primary next jobs" data-ui="jobs-reload" aria-label="Jobs">${icon('jobs')}<span class="lbl">Jobs</span></button>`;
  const confetti=['#FFC53D','#5ED6CC','#E5484D','#FFC53D','#E5484D','#FFC53D','#5ED6CC','#3BB273','#3BB273','#6E9BEA'].map((c,i)=>`<i style="left:${[21,27,17,29,76,72,82,70,87,12][i]}%;top:${[20,47,71,84,23,52,71,88,40,36][i]}%;background:${c};--rot:${[20,-35,60,-12,-25,40,10,-55,75,-70][i]}deg;animation-delay:${(i*.07).toFixed(2)}s"></i>`).join('');
  return `<section class="screen result-screen" data-screen="result" aria-label="Job done, grade ${r.overall}">
  <div class="scrim"></div>
  <div class="confetti" aria-hidden="true">${confetti}</div>
  <i class="string"></i>
  <div class="result tag">
    <i class="eyelet"></i><i class="hole"></i>
    <div class="head">${disc(r.level)}<div><small>${r.level.number}</small><h2>${title(r.level)}</h2></div><span class="done">${icon('check')}</span></div>
    <div class="stampzone"><i class="rays"></i>${medal(r.overall,'stamp')}${r.improved?`<span class="newbest" title="New best">${icon('star')}</span>`:''}</div>
    <div class="rows">
      ${rows.map(([ic,key,v],i)=>`<div class="row ${i===best?'best':''}">${icon(ic)}<b data-count="${v}" data-kind="${key}">${key==='time'?clock(0):0}</b>${medal(r.parts[i])}</div>`).join('')}
      ${feed}
    </div>
    <div class="actions2">
      <button class="btn sq" data-ui="restart" aria-label="Play again">${icon('retry')}<span class="key">R</span></button>
      ${r.next?`<button class="btn sq" data-ui="jobs-reload" aria-label="Jobs">${icon('jobs')}</button>`:''}
      ${next}
    </div>
  </div>
</section>`;
}

export interface FailView {level:Level;burned:boolean;oven:boolean;belt:boolean;lift:boolean}
export function failMarkup(f:FailView){
  const step=(done:boolean,ic:string)=>`<div class="step ${done?'done':'todo'}">${icon(ic)}</div>`;
  const hero=f.burned
    ?`<div class="plate2 burned"><span class="smoke"><i></i><i></i><i></i></span>${icon('oven')}<span class="fr">${icon('tray')}</span></div>`
    :`<div class="plate2">${icon('spoiled')}<span class="fr">${icon('fridge')}</span></div>`;
  return `<section class="screen fail-screen" data-screen="fail" aria-label="${f.burned?'Lunch burned':'Lunch spoiled'}. Retry?">
  <div class="scrim"></div>
  <i class="string"></i>
  <div class="fail tag">
    <i class="eyelet"></i><i class="hole"></i>
    <div class="head">${disc(f.level)}<div><small>${f.level.number}</small><h2>${title(f.level)}</h2></div></div>
    <div class="hero">${hero}
      <div class="vthermo" aria-hidden="true"><svg class="pop" viewBox="0 0 50 34"><path d="M8 30l-6-12M25 26V4M42 30l6-12" stroke="#E5484D" stroke-width="5" stroke-linecap="round"/></svg><i class="tube"></i><i class="bulb"></i></div>
    </div>
    <div class="progress" aria-label="How far the tray got">
      ${step(f.oven,'oven')}<i class="link ${f.oven?'live':'cold'}"></i>${step(f.belt,'conveyor')}<i class="link ${f.belt?'live':'cold'}"></i>${step(f.lift,'lift')}
    </div>
    <div class="actions2">
      <button class="btn primary retry" data-ui="restart" aria-label="Retry ${title(f.level)}">${icon('retry')}Retry<span class="key">R</span></button>
      <button class="btn sq" data-ui="jobs-reload" aria-label="Jobs">${icon('jobs')}</button>
    </div>
  </div>
</section>`;
}
