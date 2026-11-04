import {launch} from '../cap.mjs';
const P='verify-observatory-play-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText}));
await g.advance(.5);
await g.walk(-3.7,-.1,.6);await g.key('KeyE',.3);await g.walk(-6,3.5,.6);await g.key('KeyE',.4);
await g.walk(0,-1.55,.4);await g.key('KeyE',.6);
await g.act('pick','C');await g.act('slot','shunt');await g.advance(.3);
// find knob by hover probing
let hit=null;
for(let y=520;y<=600&&!hit;y+=3)for(let x=700;x<=790;x+=3){await g.page.mouse.move(x,y);const t=await g.page.evaluate(()=>document.querySelector('.prompt-pill:not([hidden])')?.innerText);if(t&&t.startsWith('Drag')){hit=[x,y];break;}}
log('knob hover at',hit);
const val=async()=>(await g.snap()).station.shunt.value;
if(hit){const [x,y]=hit;
  for(const dx of [10,20,28,40,90,180]){await g.act('value',{slot:'shunt',value:1e-7});await g.page.mouse.move(x,y);await g.page.mouse.down();await g.page.mouse.move(x+dx,y,{steps:10});const v=await val();await g.page.mouse.up();
    log('drag',dx,'px ->',v);}
}
// F0: 68 uF + reroute, cart moved
await g.act('value',{slot:'shunt',value:68e-6});await g.act('route');await g.page.mouse.move(5,450);await g.advance(.6);
const s=(await g.snap()).station;log('68uF',JSON.stringify({snr:s.reading.snr,level:s.reading.level,cartD:s.cartDistance}),JSON.stringify(await txt()));
const rows=await g.page.evaluate(()=>[...document.querySelectorAll('.station-panel li')].map(li=>`${li.className}:${li.innerText.replace('\n',' ')}:${getComputedStyle(li.querySelector('b')).color}`));log(rows.join(' | '));
await g.shot(P+'02-shunt68u-rerouted');
await g.crop(P+'03-shunt68u-scope-crop',{x:540,y:170,width:420,height:240});
await g.act('log');await g.advance(.3);log('after log',JSON.stringify(await txt()),'mist',(await g.snap()).station.mistakes);
await g.shot(P+'04-shunt68u-log-fail');
log('errors',JSON.stringify(await g.close()));
