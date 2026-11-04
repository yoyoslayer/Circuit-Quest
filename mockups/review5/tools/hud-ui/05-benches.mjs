import {launch} from '../cap.mjs';
const out={};
const lvl=process.argv[2];
const hud=g=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText.replace(/\n+/g,' | '),pill:document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' '),
  panel:document.querySelector('.station-panel')?.hidden?null:document.querySelector('.station-panel')?.innerText.replace(/\n+/g,' | '),toast:document.querySelector('.station-toast')?.hidden?null:document.querySelector('.station-toast')?.innerText,
  words:(()=>{const els=['.objective','.prompt-pill','.station-panel','.station-toast','.bench-chip'].map(s=>document.querySelector(s)).filter(e=>e&&!e.hidden&&e.offsetParent!==null);return els.map(e=>e.innerText).join(' ').split(/\s+/).filter(Boolean).length;})()}));
const preps={
  garage:async g=>{await g.walk(6.4,-4.2,.5);await g.key('KeyE');await g.walk(3.4,-4);await g.walk(2.5,-4.4);await g.key('KeyE',.3);await g.walk(2.9,-4);await g.walk(2.9,-1.1);await g.walk(0,-1.55,.4);},
  observatory:async g=>{await g.walk(-3.7,-.1,.6);await g.key('KeyE');await g.walk(-6,3.5,.6);await g.key('KeyE',.3);await g.walk(0,-1.55,.4);},
  qfn:async g=>{await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE',.2);await g.walk(0,-.5,.4);},
  spectrum:async g=>{await g.walk(-6.3,3.6);await g.walk(-3.5,3.55,.4);},
};
for(const [tag,w,h] of [['d',1440,900],['p',390,844]]){
  const g=await launch(lvl,{fullfx:true,width:w,height:h});
  await g.advance(1);await g.shot(`hud-ui-40${tag}-${lvl}-start`);out[tag+'start']=await hud(g);
  await preps[lvl](g);await g.advance(.2);out[tag+'stand']=await hud(g);
  await g.key('KeyE',1.2);await g.shot(`hud-ui-41${tag}-${lvl}-bench`);out[tag+'bench']=await hud(g);out[tag+'atBench']=(await g.snap()).atBench;
  out[tag+'err']=await g.close();
}
console.log(JSON.stringify(out,null,1));
