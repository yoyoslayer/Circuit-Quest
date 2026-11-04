import {launch} from '../cap.mjs';import {toBench} from './common.mjs';
const g=await launch('arcade',{fullfx:true,width:844,height:390});await g.advance(.5);
await toBench(g);await g.advance(.5);await g.shot('arcade-play-85-phone-landscape-bench');
console.log(JSON.stringify(await g.close()));
