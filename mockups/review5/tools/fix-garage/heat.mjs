// Check: the shared-ground heat tint in job 3. BASE=http://localhost:4192 node mockups/review5/tools/fix-garage/heat.mjs
import {launch} from '../cap.mjs';
const g=await launch('garage',{fullfx:true});
const st=async()=>(await g.snap()).station;
const fit=async(part,slot,flipped=false)=>{await g.act('pick',part);if((await st()).trayFlip[part]!==flipped)await g.act('flip');await g.act('slot',slot);};
await g.advance(.5);
await g.walk(6.4,-4.2,.5);await g.key('KeyE');await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE');await g.advance(.4);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE');await g.advance(.6);
for(const [p,s] of [['diode','fly'],['tvs','switch']]){await fit(p,s);await g.act('pulse');await g.advance(2);await g.act('test');await g.advance(4.5);if(p==='diode'){await g.act('pick','diode');await g.act('pick','diode');}}
await fit('diode','fly');console.log('job',(await st()).job);
await g.act('pulse');await g.advance(.25);const s=await st();console.log('heat',s.gndHeat,s.gndColor,s.capture?.fault);
await g.shot('fix-garage-19-j3-heat');
await g.close();
