import {launch} from '../cap.mjs';
const P='verify-garage-models-';
const g=await launch('garage',{fullfx:true});
const prompt=()=>g.page.evaluate(()=>{const p=document.querySelector('.prompt-pill');return p&&!p.hidden?p.textContent:null;});
console.log('AUDIT02',JSON.stringify(await g.audit(.02)));
console.log('AUDIT04',JSON.stringify(await g.audit()));
await g.advance(.5);
let s=await g.snap();console.log('START drawCalls',s.drawCalls,'fps',s.fps,'props',s.props);
await g.shot(P+'01-start');
await g.survey();s=await g.snap();console.log('SURVEY drawCalls',s.drawCalls);await g.shot(P+'02-survey');await g.survey();
// Bench before the robot is on the stand
await g.walk(0,-1.55,.4);console.log('PROMPT at bench before robot:',await prompt());await g.shot(P+'03-bench-before-robot');
await g.key('KeyE',.6);s=await g.snap();console.log('sat?',s.atBench,'prompt',await prompt());await g.shot(P+'04-sat-before-robot');
await g.key('Escape',.4);
// carry
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.4);s=await g.snap();const rb=s.items.find(i=>i.id==='robot');console.log('held',s.held,'robot pos',JSON.stringify(rb.pos),'player',JSON.stringify(s.player));
await g.shot(P+'05-carry');
await g.walk(3.4,-4,.5);s=await g.snap();console.log('carry mid robot',JSON.stringify(s.items.find(i=>i.id==='robot').pos),'player',JSON.stringify(s.player));await g.shot(P+'06-carry-mid');
await g.walk(2.5,-4.4,.5);await g.key('KeyE',.5);s=await g.snap();console.log('onStand',s.station.onStand);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);console.log('PROMPT at bench after robot:',await prompt());await g.key('KeyE',.6);
await g.shot(P+'07-bench-view');
await g.act('pulse');await g.advance(.85);await g.shot(P+'08-arc');
await g.advance(.4);await g.shot(P+'09-arc-later');
await g.advance(1.5);
await g.act('pick','diode');await g.act('slot','fly');await g.act('test');await g.advance(1.2);await g.shot(P+'10-test-1.2s');await g.crop(P+'11-test-lamps-crop',{x:780,y:330,width:320,height:160});
await g.advance(2);
await g.act('pick','diode');await g.act('pick','diode');await g.act('pick','tvs');await g.act('slot','switch');await g.act('test');await g.advance(2.5);
await g.act('ground');await g.act('test');
for(let k=0;k<16;k++){await g.advance(.8);s=await g.snap();const b=s.items.find(i=>i.id==='robot');console.log('t',k,s.won,b&&JSON.stringify(b.pos),'player',JSON.stringify(s.player),'atBench',s.atBench);
  if(k===4)await g.shot(P+'12-driving');if(s.won){await g.advance(.1);await g.shot(P+'13-win-early');await g.advance(1.5);await g.shot(P+'14-win-late');break;}}
console.log('ERR',JSON.stringify(await g.close()));
