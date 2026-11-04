import {launch} from '../cap.mjs';
const P='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
const log=(...a)=>console.log(...a);
const pill=async()=>g.page.evaluate(()=>{const p=document.querySelector('.prompt-pill');return p?(p.hidden?'[hidden]':p.innerText.replace(/\n/g,' ')):'none';});
const pod=async()=>{const s=await g.snap();return Array.isArray(s.items)?s.items.find(i=>i.id==='pod'):s.items?.pod;};
const st=async(tag)=>{const s=await g.snap();log(tag,'t=',s.time.toFixed(1),'held=',s.held,'pill=',await pill(),'dmg=',s.damage,'alarmed=',s.alarmed,'fastest=',s.fastestProp,'podPad=',s.station.podPad,'mirrors=',JSON.stringify(s.station.mirrors),'pod=',JSON.stringify(await pod()));return s;};
const W=async(x,z,r=.5)=>{const res=await g.walk(x,z,r);if(!res.arrived)log('STUCK',x,z,JSON.stringify(res.state.player));return res;};
await g.advance(.5);
const s0=await g.snap();log('items sample',JSON.stringify(s0.items).slice(0,600),'props',JSON.stringify(s0.props).slice(0,200));
// 1. DR-03: throw something within 30 s
await W(-6.4,6.4,.6);await g.key('KeyE',.2);await st('holding pod');
// Face toward the storeroom wall and throw the pod from outside it, at the pad (chaos shortcut)
await W(-8.3,-1.8,.4);await W(-8.25,-2.4,.3);await st('outside store wall');await g.shot(`${P}-50-about-to-throw-pod`);
await g.key('KeyQ',.1);await g.advance(.4);await g.shot(`${P}-51-pod-thrown-mid`);await g.advance(2);await st('after throw');await g.shot(`${P}-52-pod-after-throw`);
await g.advance(8);await st('after 10s');
// walk to pod wherever it is and try
const p1=await pod();log('POD at',JSON.stringify(p1));
log('ERR',JSON.stringify(await g.close()));
