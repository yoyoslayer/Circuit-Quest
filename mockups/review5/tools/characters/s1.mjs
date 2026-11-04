import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});
await g.advance(1);
await g.zoom(-1500);await g.advance(.5);
console.log(JSON.stringify((await g.snap()).player));
await g.shot('characters-01-pip-idle-zoom9-a0');
for(let i=1;i<6;i++){await g.orbit(175,0);await g.shot(`characters-0${1+i}-pip-idle-zoom9-a${i*60}`);}
await g.orbit(175,0);
// low and high pitch
await g.orbit(0,-200);await g.shot('characters-07-pip-idle-zoom9-low');
await g.orbit(0,300);await g.shot('characters-08-pip-idle-zoom9-high');
await g.orbit(0,-100);
console.log(await g.close());
