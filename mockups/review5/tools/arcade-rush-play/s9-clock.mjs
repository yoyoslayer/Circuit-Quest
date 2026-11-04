import {launch} from '../cap.mjs';
const P='arcade-rush-play-';
const g=await launch('arcade-rush',{fullfx:true});await g.advance(.5);
for(let i=0;i<17;i++)await g.advance(10);
await g.crop(P+'80-hud-clock-at-170s',{x:0,y:0,width:420,height:240});
console.log('t',(await g.snap()).time);
console.log('errors',JSON.stringify(await g.close()));
