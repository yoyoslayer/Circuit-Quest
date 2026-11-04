import {launch} from '../cap.mjs';import {toBench} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true,width:390,height:844});await g.advance(.5);
await toBench(g,log);await g.advance(.5);
for(const s of [['slot','across'],['pick',220],['slot',0],['power']])await g.act(...s);await g.advance(3.4);
let s=await g.snap();log('soakDone',s.station.soakDone);
await g.shot(P+'84-phone-bench-passed');
for(let x=330;x<=389;x+=6)for(const y of [470,490,510,530]){await g.click(x,y);s=await g.snap();if(s.station.index>0){log('signed by tap at',x,y);break;}}
s=await g.snap();log('index after taps',s.station.index);
log('errors',JSON.stringify(await g.close()));
