import {launch} from '../cap.mjs';
const P='garage-models-';
const g=await launch('garage',{fullfx:true,query:''});
await g.advance(.3);
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.4);
await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE',.5);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE',.6);
// PULSE arc timing frames
await g.act('pulse');await g.advance(.8);await g.crop(P+'70-arc-0.0',{x:300,y:380,width:700,height:280});
await g.advance(.1);await g.crop(P+'71-arc-0.1',{x:300,y:380,width:700,height:280});
await g.advance(.3);await g.crop(P+'72-arc-0.4',{x:300,y:380,width:700,height:280});
await g.advance(.6);await g.crop(P+'73-arc-1.0',{x:300,y:380,width:700,height:280});
await g.advance(1.6);
// TEST with diode to view cycle lamps
await g.act('pick','diode');await g.act('slot','fly');await g.act('test');await g.advance(1.2);await g.crop(P+'74-test-cycle-lamps',{x:780,y:330,width:320,height:160});
await g.advance(2);
await g.act('pick','diode');await g.act('pick','diode');await g.act('pick','tvs');await g.act('slot','switch');await g.act('test');await g.advance(2.5);
await g.act('ground');await g.act('test');
for(let k=0;k<12;k++){await g.advance(.8);const s=await g.snap();const b=s.items.find(i=>i.id==='robot');console.log('t',k,s.won,b&&JSON.stringify(b.pos),'player',JSON.stringify(s.player));
  if(k===2)await g.shot(P+'75-drive-1.6s');if(k===5)await g.shot(P+'76-drive-4s');if(s.won){await g.shot(P+'77-win-moment');break;}}
await g.orbit(-300,0,.5);await g.shot(P+'78-win-orbit-to-dock');
console.log('ERR',JSON.stringify(await g.close()));
