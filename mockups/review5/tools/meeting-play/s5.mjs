import {launch} from '../cap.mjs';import {hud,route} from './common.mjs';
const K='meeting-play';const log=(...a)=>console.log(...a);
const g=await launch('meeting',{fullfx:true});await g.advance(.3);
const spots=[['bookshelf',[[-8,-1.4],[6,-1.2],[8.5,1],[9.75,3]]],['vending',[[-10,-1],[-15.6,1.6]]],['closet',[[-11,-6.8]]]];
let n=49;
for(const [name,pts] of spots){await route(g,pts,.4);const s=await g.snap();log(name,JSON.stringify(s.player));
  for(const [i,dx] of [[0,0],[1,262],[2,262],[3,262]]){if(dx)await g.orbit(dx,0);await g.orbit(0,-200,.3);
    await g.shot(`${K}-${n++}-occl-${name}-yaw${i*90}`);}
  await g.orbit(262,0);}
console.log('errors',JSON.stringify(await g.close()));
