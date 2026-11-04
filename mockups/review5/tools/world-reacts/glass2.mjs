import {launch} from './wrcap.mjs';
const g=await launch('meeting');await g.advance(.3);
await g.walk(7,-1.5,.5);await g.walk(8.4,-3.8,.4);await g.walk(8.6,-3.7,.2,2);
await g.key('KeyE',.3);let s=await g.snap();console.log('held',s.held);
await g.shot('world-reacts-22-meeting-glass-held');
await g.walk(7.6,-3.6,.3,3);await g.walk(7.0,-3.6,.2,2);// face -x, away from boardroom (throw into open office)
await g.key('KeyQ',0);for(let i=0;i<10;i++){s=await g.advance(.1);const gl=(await g.props()).filter(q=>q.k==='glass');if(gl.some(q=>!q.en))break;}
console.log('after',JSON.stringify((await g.props()).filter(q=>q.k==='glass').map(q=>[q.id,q.en,q.dmg])),'alarmed',s.alarmed,'dmg',s.damage,'cost',s.cost,'t',s.time.toFixed(1));
await g.shot('world-reacts-23-meeting-glass-smash');
s=await g.advance(3);console.log('+3 alarmed',s.alarmed);
console.log(JSON.stringify(await g.close()));
